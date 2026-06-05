import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Cultivator } from '@shared/types/cultivator';
import type {
  BattleSession,
  DungeonOptionCost,
  DungeonState,
  PlayerInfo,
} from './types';

const { buildDraftMock, enrichNarrativeMock, getMapNodeMock, redisSetMock } =
  vi.hoisted(() => ({
    buildDraftMock: vi.fn(),
    enrichNarrativeMock: vi.fn(),
    getMapNodeMock: vi.fn(),
    redisSetMock: vi.fn(),
  }));

vi.mock('@server/lib/prompts', () => ({
  renderPrompt: vi.fn(),
}));

vi.mock('@server/lib/services/simulateBattleV5', () => ({
  simulateBattleV5: vi.fn(),
}));

vi.mock('@server/utils/aiClient', () => ({
  object: vi.fn(),
}));

vi.mock('@shared/engine/enemyGenerator', () => ({
  EnemyGenerator: vi.fn().mockImplementation(function EnemyGeneratorMock() {
    return {
      buildDraft: buildDraftMock,
      enrichNarrative: enrichNarrativeMock,
    };
  }),
}));

vi.mock('@shared/lib/game/mapSystem', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@shared/lib/game/mapSystem')>();
  return {
    ...actual,
    getMapNode: getMapNodeMock,
  };
});

vi.mock('../redis', () => ({
  redis: {
    get: vi.fn(),
    set: redisSetMock,
    del: vi.fn(),
  },
}));

vi.mock('../drizzle/db', () => ({
  getExecutor: vi.fn(),
}));

vi.mock('../services/cultivatorService', () => ({
  getCultivatorByIdUnsafe: vi.fn(),
  getCultivatorOwnerId: vi.fn(),
  getPaginatedInventoryByType: vi.fn(),
  updateCultivator: vi.fn(),
}));

vi.mock('../services/ConditionService', () => ({
  ConditionService: {
    tickNaturalRecovery: vi.fn(),
    applyExternalResourceLoss: vi.fn(),
    addOrStackStatus: vi.fn(),
    applyBattleOutcome: vi.fn(),
  },
}));

vi.mock('../services/TaskService', () => ({
  TaskService: {
    recordDungeonCompletion: vi.fn(),
    recordTaskEvent: vi.fn(),
  },
}));

vi.mock('./dungeonLimiter', () => ({
  checkDungeonLimit: vi.fn(),
  consumeDungeonLimit: vi.fn(),
}));

import { DungeonService } from './service_v2';

interface TestableDungeonService {
  createBattleSession(
    cultivatorId: string,
    dungeonStateKey: string,
    battleCost: DungeonOptionCost,
    playerInfo: PlayerInfo,
    dungeonState: DungeonState,
  ): Promise<BattleSession>;
}

function createEnemy(input: {
  realm: Cultivator['realm'];
  realmStage: Cultivator['realm_stage'];
  name?: string;
}): Cultivator {
  return {
    id: 'enemy-1',
    name: input.name ?? '测试敌人',
    title: null,
    gender: '男',
    realm: input.realm,
    realm_stage: input.realmStage,
    age: 100,
    lifespan: 300,
    attributes: {
      vitality: 10,
      spirit: 10,
      wisdom: 10,
      speed: 10,
      willpower: 10,
    },
    spiritual_roots: [],
    pre_heaven_fates: [],
    cultivations: [],
    skills: [],
    inventory: {
      artifacts: [],
      consumables: [],
      materials: [],
    },
    equipped: {
      weapon: null,
      armor: null,
      accessory: null,
    },
    max_skills: 4,
    spirit_stones: 0,
    background: '',
  };
}

function createPlayerInfo(): PlayerInfo {
  return {
    name: '韩立',
    realm: '元婴 后期',
    gender: '男',
    age: 120,
    lifespan: 800,
    personality: '谨慎',
    attributes: {
      vitality: 100,
      spirit: 100,
      wisdom: 100,
      speed: 100,
      willpower: 100,
    },
    resourceCaps: {
      maxHp: 1000,
      maxMp: 800,
    },
    spiritual_roots: [],
    fates: [],
    skills: [],
    spirit_stones: 0,
    background: '',
  };
}

function createDungeonState(mapNodeId: string): DungeonState {
  return {
    cultivatorId: 'cultivator-1',
    mapNodeId,
    playerInfo: createPlayerInfo(),
    theme: '测试秘境',
    currentRound: 1,
    maxRounds: 5,
    history: [],
    status: 'EXPLORING',
    dangerScore: 10,
    isFinished: false,
    location: {
      location: '测试秘境',
      location_tags: [],
      location_description: '',
    },
    summary_of_sacrifice: [],
    accumulatedRewards: [],
    accumulatedHpLoss: 0,
    accumulatedMpLoss: 0,
    condition: {
      version: 1,
      resources: {
        hp: { current: 1000 },
        mp: { current: 800 },
      },
      gauges: {
        pillToxicity: 0,
      },
      tracks: {
        tempering: {
          vitality: { level: 0, progress: 0 },
          spirit: { level: 0, progress: 0 },
          wisdom: { level: 0, progress: 0 },
          speed: { level: 0, progress: 0 },
          willpower: { level: 0, progress: 0 },
        },
        marrowWash: { level: 0, progress: 0 },
      },
      counters: {
        longTermPillUsesByRealm: {},
        cultivationPillUsesByRealm: {},
        longevityPillUsesByRealm: {},
      },
      statuses: [],
      timestamps: {
        lastRecoveryAt: new Date(0).toISOString(),
      },
    },
  };
}

function createBattleCost(value: number): DungeonOptionCost {
  return {
    type: 'battle',
    value,
    metadata: {
      race: '鬼魂',
      realm_stage: '后期',
      enemy_name: '守陵阴魂',
      is_boss: true,
    },
  };
}

describe('DungeonService dungeon enemy scaling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    redisSetMock.mockResolvedValue('OK');
    buildDraftMock.mockImplementation((input) => ({
      cultivator: createEnemy({
        realm: input.realm,
        realmStage: input.realmStage,
        name: input.name,
      }),
    }));
    enrichNarrativeMock.mockImplementation(async (draft) => draft);
  });

  it('uses map realm requirement instead of player realm and disables boss loadout below elite', async () => {
    getMapNodeMock.mockReturnValueOnce({
      id: 'easy-map',
      name: '太岳山脉',
      region: '天南',
      realm_requirement: '筑基',
      dungeon_config: { difficulty: 'easy' },
      tags: [],
      description: '',
      connections: [],
      x: 0,
      y: 0,
    });
    const service = new DungeonService() as unknown as TestableDungeonService;

    const session = await service.createBattleSession(
      'cultivator-1',
      'dungeon:active:cultivator-1',
      createBattleCost(100),
      createPlayerInfo(),
      createDungeonState('easy-map'),
    );

    expect(buildDraftMock).toHaveBeenCalledWith(
      expect.objectContaining({
        realm: '筑基',
        difficulty: 35,
        isBoss: false,
      }),
    );
    expect(enrichNarrativeMock).toHaveBeenCalledTimes(1);
    expect(session.enemyData).toMatchObject({
      realm: '筑基',
      difficulty: 35,
    });
  });

  it('allows boss loadout on boss maps and caps effective difficulty', async () => {
    getMapNodeMock.mockReturnValueOnce({
      id: 'boss-map',
      name: '昆吾山',
      region: '大晋',
      realm_requirement: '化神',
      dungeon_config: { difficulty: 'boss' },
      tags: [],
      description: '',
      connections: [],
      x: 0,
      y: 0,
    });
    const service = new DungeonService() as unknown as TestableDungeonService;

    const session = await service.createBattleSession(
      'cultivator-1',
      'dungeon:active:cultivator-1',
      createBattleCost(200),
      createPlayerInfo(),
      createDungeonState('boss-map'),
    );

    expect(buildDraftMock).toHaveBeenCalledWith(
      expect.objectContaining({
        realm: '化神',
        difficulty: 100,
        isBoss: true,
      }),
    );
    expect(enrichNarrativeMock).toHaveBeenCalledTimes(1);
    expect(session.enemyData).toMatchObject({
      realm: '化神',
      difficulty: 100,
    });
  });
});
