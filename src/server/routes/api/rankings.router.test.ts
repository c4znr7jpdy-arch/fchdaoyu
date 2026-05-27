import { Hono } from 'hono';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  checkDailyChallengesMock,
  isRankingEmptyMock,
  getCultivatorRankMock,
  isProtectedMock,
  acquireChallengeLockMock,
  getCultivatorByIdUnsafeMock,
  simulateBattleV5Mock,
  incrementDailyChallengesMock,
  createBattleRecordV2Mock,
  releaseChallengeLockMock,
  recordTaskEventMock,
  updateRankingMock,
} = vi.hoisted(() => ({
  checkDailyChallengesMock: vi.fn(),
  isRankingEmptyMock: vi.fn(),
  getCultivatorRankMock: vi.fn(),
  isProtectedMock: vi.fn(),
  acquireChallengeLockMock: vi.fn(),
  getCultivatorByIdUnsafeMock: vi.fn(),
  simulateBattleV5Mock: vi.fn(),
  incrementDailyChallengesMock: vi.fn(),
  createBattleRecordV2Mock: vi.fn(),
  releaseChallengeLockMock: vi.fn(),
  recordTaskEventMock: vi.fn(),
  updateRankingMock: vi.fn(),
}));

vi.mock('@server/lib/hono/middleware', () => ({
  requireActiveCultivator:
    () => async (context: any, next: () => Promise<void>) => {
      context.set('user', { id: 'user-1' });
      context.set('cultivator', {
        id: 'cultivator-1',
      });
      await next();
    },
}));

vi.mock('@shared/engine/creation-v2/persistence/ProductPersistenceMapper', () => ({
  deserializeAndRehydrate: vi.fn(),
}));

vi.mock('@shared/engine/creation-v2/models/AbilityProjection', () => ({
  projectAbilityConfig: vi.fn(() => ({ cooldown: 0, mpCost: 0 })),
}));

vi.mock('@shared/engine/battle-v5/adapters/CultivatorDisplayAdapter', () => ({
  getCultivatorDisplayAttributes: vi.fn(),
}));

vi.mock('@server/lib/drizzle/db', () => ({
  getExecutor: vi.fn(),
}));

vi.mock('@server/lib/drizzle/schema', () => ({
  consumables: {},
  creationProducts: {},
  cultivators: {},
}));

vi.mock('@server/lib/redis/rankings', () => ({
  acquireChallengeLock: acquireChallengeLockMock,
  addToRanking: vi.fn(),
  checkDailyChallenges: checkDailyChallengesMock,
  getCultivatorRank: getCultivatorRankMock,
  getRankingList: vi.fn(),
  getRemainingChallenges: vi.fn(),
  incrementDailyChallenges: incrementDailyChallengesMock,
  isLocked: vi.fn(() => false),
  isProtected: isProtectedMock,
  isRankingEmpty: isRankingEmptyMock,
  releaseChallengeLock: releaseChallengeLockMock,
  updateRanking: updateRankingMock,
}));

vi.mock('@server/lib/repositories/battleRecordV2Repository', () => ({
  createBattleRecordV2: createBattleRecordV2Mock,
}));

vi.mock('@server/lib/services/cultivatorService', () => ({
  getCultivatorByIdUnsafe: getCultivatorByIdUnsafeMock,
}));

vi.mock('@server/lib/services/simulateBattleV5', () => ({
  simulateBattleV5: simulateBattleV5Mock,
}));

vi.mock('@server/lib/services/TaskService', () => ({
  TaskService: {
    recordTaskEvent: recordTaskEventMock,
  },
}));

import rankingsRouter from './rankings.router';

function createApp() {
  return new Hono().route('/api/rankings', rankingsRouter);
}

describe('rankings router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    checkDailyChallengesMock.mockResolvedValue({ success: true, remaining: 10 });
    isRankingEmptyMock.mockResolvedValue(false);
    getCultivatorRankMock
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(2);
    isProtectedMock.mockResolvedValue(false);
    acquireChallengeLockMock.mockResolvedValue(true);
    getCultivatorByIdUnsafeMock
      .mockResolvedValueOnce({
        cultivator: {
          id: 'cultivator-1',
          name: '韩立',
          realm: '筑基',
          realm_stage: '中期',
        },
      })
      .mockResolvedValueOnce({
        cultivator: {
          id: 'target-1',
          name: '厉飞雨',
          realm: '筑基',
          realm_stage: '中期',
        },
      });
    simulateBattleV5Mock.mockReturnValue({
      winner: { id: 'cultivator-1' },
      loser: { id: 'target-1' },
    });
    incrementDailyChallengesMock.mockResolvedValue(9);
    createBattleRecordV2Mock.mockResolvedValue(undefined);
    releaseChallengeLockMock.mockResolvedValue(undefined);
    recordTaskEventMock.mockResolvedValue([]);
    updateRankingMock.mockResolvedValue(undefined);
  });

  it('records the daily ranking task only after a challenge battle completes', async () => {
    const response = await createApp().request(
      '/api/rankings/challenge-battle/v5',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetId: 'target-1',
        }),
      },
    );

    expect(response.status).toBe(200);
    expect(recordTaskEventMock).toHaveBeenCalledWith(
      'cultivator-1',
      'ranking_challenge_battled',
    );
    expect(createBattleRecordV2Mock).toHaveBeenCalledTimes(1);
  });
});
