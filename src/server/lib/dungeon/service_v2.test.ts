import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  buildDraftMock,
  getMapNodeMock,
  redisSetMock,
  buildDungeonBattleInitMock,
} = vi.hoisted(() => ({
  buildDraftMock: vi.fn(),
  getMapNodeMock: vi.fn(),
  redisSetMock: vi.fn(),
  buildDungeonBattleInitMock: vi.fn(),
}));

vi.mock('@server/lib/prompts', () => ({
  renderPrompt: vi.fn(),
}));

vi.mock('@server/utils/aiClient', () => ({
  object: vi.fn(),
}));

vi.mock('@shared/engine/battle-v5/adapters/CultivatorDisplayAdapter', () => ({
  getCultivatorDisplayAttributes: vi.fn(),
}));

vi.mock('@shared/engine/enemyGenerator', () => ({
  enemyGenerator: {
    buildDraft: buildDraftMock,
  },
}));

vi.mock('@shared/engine/resource/ResourceEngine', () => ({
  resourceEngine: {},
}));

vi.mock('@shared/lib/game/mapSystem', () => ({
  getMapNode: getMapNodeMock,
}));

vi.mock('../drizzle/db', () => ({
  getExecutor: vi.fn(),
}));

vi.mock('../drizzle/schema', () => ({
  dungeonHistories: {},
}));

vi.mock('../redis', () => ({
  redis: {
    set: redisSetMock,
    get: vi.fn(),
    del: vi.fn(),
  },
}));

vi.mock('../redis/json', () => ({
  parseRedisJson: vi.fn(),
}));

vi.mock('../services/cultivatorService', () => ({
  getCultivatorByIdUnsafe: vi.fn(),
  getCultivatorOwnerId: vi.fn(),
  getPaginatedInventoryByType: vi.fn(),
  updateCultivator: vi.fn(),
}));

vi.mock('../services/ConditionService', () => ({
  ConditionService: {},
}));

vi.mock('../services/FateEngine', () => ({
  FateEngine: {},
}));

vi.mock('./battleInit', () => ({
  buildDungeonBattleInit: buildDungeonBattleInitMock,
}));

vi.mock('./dungeonLimiter', () => ({
  checkDungeonLimit: vi.fn(),
  consumeDungeonLimit: vi.fn(),
}));

vi.mock('./reward', () => ({
  RewardFactory: {},
}));

import { DungeonService } from './service_v2';

describe('DungeonService.createBattleSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getMapNodeMock.mockReturnValue({
      realm_requirement: '金丹',
    });
    buildDungeonBattleInitMock.mockReturnValue({
      player: { resourceState: { hp: { mode: 'absolute', value: 420 } } },
    });
    redisSetMock.mockResolvedValue('OK');
    buildDraftMock.mockReturnValue({
      cultivator: {
        id: 'enemy-1',
        name: '守陵阴魂',
        realm: '金丹',
        realm_stage: '后期',
      },
    });
  });

  it('maps battle metadata into the strict enemy draft DTO', async () => {
    const service = new DungeonService();

    const session = await (service as any).createBattleSession(
      'player-1',
      'dungeon:key',
      {
        type: 'battle',
        value: 68,
        desc: '旧描述不应再参与推断',
        metadata: {
          race: '鬼魂',
          realm_stage: '后期',
          enemy_name: '守陵阴魂',
          background: '残阵中的执念化形。',
          description: '阴气缭绕，目光森寒。',
          is_boss: true,
        },
      },
      {
        name: '韩立',
      },
      {
        mapNodeId: 'node-1',
        condition: {
          version: 1,
          resources: {
            hp: { current: 420 },
            mp: { current: 210 },
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
          },
          statuses: [],
          timestamps: {
            lastRecoveryAt: new Date().toISOString(),
          },
        },
      },
    );

    expect(buildDraftMock).toHaveBeenCalledWith({
      realm: '金丹',
      realmStage: '后期',
      race: '鬼魂',
      difficulty: 68,
      name: '守陵阴魂',
      background: '残阵中的执念化形。',
      description: '阴气缭绕，目光森寒。',
      isBoss: true,
    });
    expect(session.enemyData).toMatchObject({
      name: '守陵阴魂',
      realm: '金丹',
      stage: '后期',
      difficulty: 68,
    });
    expect(redisSetMock).toHaveBeenCalledTimes(1);
  });

  it('rejects battle costs missing race or realm_stage', async () => {
    const service = new DungeonService();

    await expect(
      (service as any).createBattleSession(
        'player-1',
        'dungeon:key',
        {
          type: 'battle',
          value: 68,
          metadata: {
            enemy_name: '无名敌',
          },
        },
        {
          name: '韩立',
        },
        {
          mapNodeId: 'node-1',
          condition: {
            version: 1,
            resources: {
              hp: { current: 420 },
              mp: { current: 210 },
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
            },
            statuses: [],
            timestamps: {
              lastRecoveryAt: new Date().toISOString(),
            },
          },
        },
      ),
    ).rejects.toThrow('Battle cost metadata must include race and realm_stage');
  });
});
