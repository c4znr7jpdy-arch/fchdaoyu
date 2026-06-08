import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Cultivator } from '@shared/types/cultivator';
import type {
  BattleSession,
  DungeonOptionCost,
  DungeonState,
  PlayerInfo,
} from './types';

const {
  buildDraftMock,
  enrichNarrativeMock,
  getMapNodeMock,
  redisSetMock,
  resourceConsumeMock,
  resourceGainMock,
} = vi.hoisted(() => ({
    buildDraftMock: vi.fn(),
    enrichNarrativeMock: vi.fn(),
    getMapNodeMock: vi.fn(),
    redisSetMock: vi.fn(),
    resourceConsumeMock: vi.fn(),
    resourceGainMock: vi.fn(),
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

vi.mock('@shared/engine/resource/ResourceEngine', () => ({
  resourceEngine: {
    consume: resourceConsumeMock,
    gain: resourceGainMock,
  },
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

import {
  DungeonFlowError,
  DungeonFlowErrorCode,
  DungeonService,
} from './service_v2';
import { object as objectMock } from '@server/utils/aiClient';
import { renderPrompt } from '@server/lib/prompts';
import { getCultivatorOwnerId } from '../services/cultivatorService';

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

function createRound(scene = '你继续深入秘境。') {
  return {
    scene_description: scene,
    interaction: {
      options: [
        {
          id: 1,
          text: '继续探查',
          risk_level: 'low' as const,
          potential_cost: '无',
          costs: [],
        },
      ],
    },
    status_update: {
      is_final_round: false,
      internal_danger_score: 12,
    },
  };
}

function createSettlement() {
  return {
    ending_narrative: '你带着秘境所得安然离去。',
    settlement: {
      reward_tier: 'C' as const,
      reward_blueprints: [
        {
          name: '青木灵草',
          description: '一株带着青木灵气的草药。',
          material_type: 'herb' as const,
          element: '木' as const,
          reward_score: 30,
        },
      ],
      performance_tags: ['稳妥收获'],
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

describe('DungeonService looting continuation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    redisSetMock.mockResolvedValue('OK');
    resourceConsumeMock.mockResolvedValue({ success: true });
    resourceGainMock.mockResolvedValue({ success: true });
    vi.mocked(renderPrompt).mockReturnValue({
      system: 'settlement system',
      user: 'settlement user',
    });
    vi.mocked(getCultivatorOwnerId).mockResolvedValue('user-1');
    getMapNodeMock.mockReturnValue({
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
  });

  it('throws a flow error when continuing outside LOOTING state', async () => {
    const service = new DungeonService();
    const state = createDungeonState('easy-map');
    state.status = 'EXPLORING';
    vi.spyOn(service, 'getState').mockResolvedValueOnce(state);

    const promise = service.continueFromLooting('cultivator-1');

    await expect(promise).rejects.toMatchObject({
      code: DungeonFlowErrorCode.INVALID_STATE,
      message: '当前副本状态已变化，请刷新后重试',
      status: 409,
    });
    await expect(promise).rejects.toBeInstanceOf(DungeonFlowError);
  });

  it('settles when continuing from LOOTING past the max round', async () => {
    const service = new DungeonService();
    const state = createDungeonState('easy-map');
    state.status = 'LOOTING';
    state.currentRound = 5;
    state.maxRounds = 5;
    const settlementResult: Awaited<
      ReturnType<DungeonService['settleDungeon']>
    > = {
      isFinished: true,
      settlement: {
        ending_narrative: '秘境探索结束。',
        settlement: {
          reward_tier: 'C',
          reward_blueprints: [],
          performance_tags: [],
        },
      },
      realGains: [],
    };
    vi.spyOn(service, 'getState').mockResolvedValueOnce(state);
    const settleSpy = vi
      .spyOn(service, 'settleDungeon')
      .mockResolvedValueOnce(settlementResult);

    await expect(service.continueFromLooting('cultivator-1')).resolves.toBe(
      settlementResult,
    );
    expect(settleSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'GENERATING_NEXT',
        currentRound: 6,
        maxRounds: 5,
      }),
    );
  });

  it('enters recoverable retry_continue when AI generation fails after looting', async () => {
    const service = new DungeonService();
    const state = createDungeonState('easy-map');
    state.status = 'LOOTING';
    state.currentRound = 2;
    state.maxRounds = 5;
    state.history.push({
      round: 2,
      scene: '你击败了守陵阴魂。',
      outcome: '战斗胜利。',
    });
    vi.spyOn(service, 'getState').mockResolvedValueOnce(state);
    vi.spyOn(service as any, 'callAI').mockRejectedValueOnce(
      new Error('LLM unavailable'),
    );
    const saveSpy = vi.spyOn(service, 'saveState').mockResolvedValueOnce();

    const result = await service.continueFromLooting('cultivator-1');

    expect(result.isFinished).toBe(false);
    expect(result.state).toMatchObject({
      status: 'RECOVERABLE_ERROR',
      currentRound: 3,
      statusReason: 'LLM unavailable',
      recoverableActions: ['retry_continue', 'safe_retreat', 'force_quit'],
    });
    expect(saveSpy).toHaveBeenCalledWith('cultivator-1', result.state);
  });

  it('retries a failed looting continuation without incrementing the round again', async () => {
    const service = new DungeonService();
    const state = createDungeonState('easy-map');
    state.status = 'RECOVERABLE_ERROR';
    state.currentRound = 3;
    state.maxRounds = 5;
    state.recoverableActions = ['retry_continue', 'safe_retreat', 'force_quit'];
    vi.spyOn(service, 'getState').mockResolvedValueOnce(state);
    vi.spyOn(service as any, 'callAI').mockResolvedValueOnce(
      createRound('重试后，秘境深处云雾散开。'),
    );
    vi.spyOn(service, 'saveState').mockResolvedValueOnce();

    const result = await service.recoverDungeon(
      'cultivator-1',
      'retry_continue',
    );

    expect(result).toMatchObject({
      isFinished: false,
      state: {
        status: 'EXPLORING',
        currentRound: 3,
      },
      roundData: {
        scene_description: '重试后，秘境深处云雾散开。',
      },
    });
  });

  it('enters retry_settle when final looting continuation settlement LLM fails', async () => {
    const service = new DungeonService();
    const state = createDungeonState('easy-map');
    state.status = 'LOOTING';
    state.currentRound = 5;
    state.maxRounds = 5;
    vi.spyOn(service, 'getState').mockResolvedValueOnce(state);
    vi.spyOn(service, 'saveState').mockResolvedValue();
    vi.mocked(objectMock).mockRejectedValueOnce(new Error('settlement LLM down'));

    const result = await service.continueFromLooting('cultivator-1');

    expect(result.isFinished).toBe(false);
    expect(result.state).toMatchObject({
      status: 'RECOVERABLE_ERROR',
      currentRound: 6,
      statusReason: 'settlement LLM down',
      recoverableActions: ['retry_settle', 'force_quit'],
    });
  });

  it('does not return successful settlement when reward gain fails', async () => {
    const service = new DungeonService();
    const state = createDungeonState('easy-map');
    state.status = 'SETTLING';
    vi.spyOn(service, 'saveState').mockResolvedValue();
    vi.mocked(objectMock).mockResolvedValueOnce({
      object: createSettlement(),
    } as Awaited<ReturnType<typeof objectMock>>);
    resourceGainMock.mockResolvedValueOnce({
      success: false,
      errors: ['奖励发放失败'],
    });

    const result = await service.settleDungeon(state);

    expect(result).toMatchObject({
      isFinished: false,
      state: {
        status: 'RECOVERABLE_ERROR',
        statusReason: '奖励发放失败',
        recoverableActions: ['retry_settle', 'force_quit'],
      },
    });
    expect(result.settlement).toBeUndefined();
  });

  it('retries settlement from saved settlement gains without rerunning LLM or rewards', async () => {
    const service = new DungeonService();
    const state = createDungeonState('easy-map');
    const gains = [{ type: 'spirit_stones' as const, value: 10 }];
    state.status = 'RECOVERABLE_ERROR';
    state.recoverableActions = ['retry_settle', 'force_quit'];
    state.settlement = createSettlement();
    state.realGains = gains;
    state.gainLedger = [
      {
        source: 'settlement',
        gains,
        committedAt: new Date(0).toISOString(),
      },
    ];
    vi.spyOn(service, 'getState').mockResolvedValueOnce(state);
    vi.spyOn(service, 'saveState').mockResolvedValue();
    const archiveSpy = vi.spyOn(service, 'archiveDungeon').mockResolvedValue();

    const result = await service.recoverDungeon('cultivator-1', 'retry_settle');

    expect(result).toMatchObject({
      isFinished: true,
      settlement: state.settlement,
      realGains: gains,
    });
    expect(objectMock).not.toHaveBeenCalled();
    expect(resourceGainMock).not.toHaveBeenCalled();
    expect(archiveSpy).toHaveBeenCalledWith(state, state.settlement, gains);
  });
});
