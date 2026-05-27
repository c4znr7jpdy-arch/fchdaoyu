import { beforeEach, describe, expect, it, vi } from 'vitest';

const scoreStore = new Map<string, Map<string, number>>();

const basicsById = new Map([
  [
    'cultivator-1',
    {
      id: 'cultivator-1',
      name: '韩立',
      title: '青元子',
      realm: '筑基',
      realm_stage: '后期',
      gender: '男',
      origin: '散修',
    },
  ],
  [
    'cultivator-2',
    {
      id: 'cultivator-2',
      name: '厉飞雨',
      title: null,
      realm: '筑基',
      realm_stage: '中期',
      gender: '男',
      origin: '宗门',
    },
  ],
  [
    'cultivator-3',
    {
      id: 'cultivator-3',
      name: '南宫婉',
      title: null,
      realm: '炼气',
      realm_stage: '圆满',
      gender: '女',
      origin: '宗门',
    },
  ],
]);

vi.mock('@server/lib/redis', () => ({
  redis: {
    zscore: vi.fn(async (key: string, member: string) => {
      const score = scoreStore.get(key)?.get(member);
      return typeof score === 'number' ? String(score) : null;
    }),
    zadd: vi.fn(async (key: string, score: number, member: string) => {
      const bucket = scoreStore.get(key) ?? new Map<string, number>();
      bucket.set(member, Number(score));
      scoreStore.set(key, bucket);
      return 1;
    }),
    zrevrange: vi.fn(
      async (
        key: string,
        start: number,
        stop: number,
        withScores: string,
      ) => {
        expect(withScores).toBe('WITHSCORES');
        const records = [...(scoreStore.get(key) ?? new Map()).entries()]
          .sort((left, right) => right[1] - left[1])
          .slice(start, stop + 1);

        return records.flatMap(([member, score]) => [member, String(score)]);
      },
    ),
  },
}));

vi.mock('@server/lib/services/cultivatorService', () => ({
  getCultivatorBasicsByIdsUnsafe: vi.fn(async (ids: string[]) =>
    ids.flatMap((id) => {
      const basics = basicsById.get(id);
      return basics ? [basics] : [];
    }),
  ),
}));

import {
  getTowerLeaderboard,
  updateTowerWeeklyRecord,
} from './leaderboard';

const seasonKey = '2026-W22@Asia/Shanghai';
const seasonEndAt = '2026-06-07T16:00:00.000Z';

describe('tower leaderboard', () => {
  beforeEach(() => {
    scoreStore.clear();
    vi.clearAllMocks();
  });

  it('keeps the first record when the same player repeats the same floor, then upgrades on a higher floor', async () => {
    await updateTowerWeeklyRecord({
      seasonKey,
      seasonEndAt,
      cultivatorId: 'cultivator-1',
      recordedRealm: '筑基',
      highestFloor: 18,
      firstReachedAt: '2026-06-02T12:00:00.000Z',
    });
    await updateTowerWeeklyRecord({
      seasonKey,
      seasonEndAt,
      cultivatorId: 'cultivator-1',
      recordedRealm: '筑基',
      highestFloor: 18,
      firstReachedAt: '2026-06-03T12:00:00.000Z',
    });

    let leaderboard = await getTowerLeaderboard({
      seasonKey,
      seasonEndAt,
      realm: '筑基',
      limit: 30,
      selfCultivatorId: 'cultivator-1',
    });

    expect(leaderboard).toHaveLength(1);
    expect(leaderboard[0]).toMatchObject({
      cultivatorId: 'cultivator-1',
      highestFloor: 18,
      firstReachedAt: '2026-06-02T12:00:00.000Z',
    });

    await updateTowerWeeklyRecord({
      seasonKey,
      seasonEndAt,
      cultivatorId: 'cultivator-1',
      recordedRealm: '筑基',
      highestFloor: 20,
      firstReachedAt: '2026-06-04T12:00:00.000Z',
    });

    leaderboard = await getTowerLeaderboard({
      seasonKey,
      seasonEndAt,
      realm: '筑基',
      limit: 30,
      selfCultivatorId: 'cultivator-1',
    });

    expect(leaderboard[0]).toMatchObject({
      cultivatorId: 'cultivator-1',
      highestFloor: 20,
      firstReachedAt: '2026-06-04T12:00:00.000Z',
    });
  });

  it('orders higher floors first and breaks ties by earlier first reach time', async () => {
    await updateTowerWeeklyRecord({
      seasonKey,
      seasonEndAt,
      cultivatorId: 'cultivator-1',
      recordedRealm: '筑基',
      highestFloor: 20,
      firstReachedAt: '2026-06-03T12:00:00.000Z',
    });
    await updateTowerWeeklyRecord({
      seasonKey,
      seasonEndAt,
      cultivatorId: 'cultivator-2',
      recordedRealm: '筑基',
      highestFloor: 20,
      firstReachedAt: '2026-06-02T12:00:00.000Z',
    });
    await updateTowerWeeklyRecord({
      seasonKey,
      seasonEndAt,
      cultivatorId: 'cultivator-3',
      recordedRealm: '筑基',
      highestFloor: 18,
      firstReachedAt: '2026-06-01T12:00:00.000Z',
    });

    const leaderboard = await getTowerLeaderboard({
      seasonKey,
      seasonEndAt,
      realm: '筑基',
      limit: 30,
    });

    expect(leaderboard.map((entry) => entry.cultivatorId)).toEqual([
      'cultivator-2',
      'cultivator-1',
      'cultivator-3',
    ]);
    expect(leaderboard.map((entry) => entry.rank)).toEqual([1, 2, 3]);
  });

  it('stores the same player in separate realm buckets within one season', async () => {
    await updateTowerWeeklyRecord({
      seasonKey,
      seasonEndAt,
      cultivatorId: 'cultivator-3',
      recordedRealm: '炼气',
      highestFloor: 9,
      firstReachedAt: '2026-06-01T12:00:00.000Z',
    });
    await updateTowerWeeklyRecord({
      seasonKey,
      seasonEndAt,
      cultivatorId: 'cultivator-3',
      recordedRealm: '筑基',
      highestFloor: 14,
      firstReachedAt: '2026-06-05T12:00:00.000Z',
    });

    const qiLeaderboard = await getTowerLeaderboard({
      seasonKey,
      seasonEndAt,
      realm: '炼气',
      limit: 30,
    });
    const foundationLeaderboard = await getTowerLeaderboard({
      seasonKey,
      seasonEndAt,
      realm: '筑基',
      limit: 30,
    });

    expect(qiLeaderboard[0]).toMatchObject({
      cultivatorId: 'cultivator-3',
      recordedRealm: '炼气',
      highestFloor: 9,
    });
    expect(foundationLeaderboard[0]).toMatchObject({
      cultivatorId: 'cultivator-3',
      recordedRealm: '筑基',
      highestFloor: 14,
    });
  });
});
