import { beforeEach, describe, expect, it, vi } from 'vitest';

type RedisValueStore = Map<string, number>;

const { redisEvalMock, redisGetMock, store } = vi.hoisted(() => {
  const store: RedisValueStore = new Map();

  const redisGetMock = vi.fn(async (key: string) => {
    const value = store.get(key);
    return value === undefined ? null : String(value);
  });

  const redisEvalMock = vi.fn(
    async (
      _script: string,
      _numKeys: number,
      emailKey: string,
      ipKey: string,
      limitRaw: number | string,
      _ttlRaw: number | string,
      hasIpRaw: number | string,
    ) => {
      const limit = Number(limitRaw);
      const hasIp = String(hasIpRaw) === '1';
      const emailCount = store.get(emailKey) ?? 0;
      const ipCount = hasIp ? (store.get(ipKey) ?? 0) : 0;
      const emailLimited = emailCount >= limit;
      const ipLimited = hasIp && ipCount >= limit;

      if (emailLimited || ipLimited) {
        return [
          0,
          emailCount,
          ipCount,
          emailLimited ? 1 : 0,
          ipLimited ? 1 : 0,
        ];
      }

      const nextEmailCount = emailCount + 1;
      store.set(emailKey, nextEmailCount);

      let nextIpCount = ipCount;
      if (hasIp) {
        nextIpCount += 1;
        store.set(ipKey, nextIpCount);
      }

      return [1, nextEmailCount, nextIpCount, 0, 0];
    },
  );

  return {
    redisEvalMock,
    redisGetMock,
    store,
  };
});

vi.mock('./index', () => ({
  redis: {
    eval: redisEvalMock,
    get: redisGetMock,
  },
}));

describe('characterGenerationLimiter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    store.clear();
  });

  it('returns a full quota before any generation is consumed', async () => {
    const { getCharacterGenerationQuota } =
      await import('./characterGenerationLimiter');

    await expect(
      getCharacterGenerationQuota({
        email: 'Test@Example.com',
        ip: '203.0.113.10',
      }),
    ).resolves.toEqual({
      dailyLimit: 6,
      remaining: 6,
      remainingByEmail: 6,
      remainingByIp: 6,
      limitedBy: 'none',
      ipTracked: true,
    });
  });

  it('allows six consumes and rejects the seventh consume', async () => {
    const { consumeCharacterGenerationQuota } =
      await import('./characterGenerationLimiter');

    for (let index = 0; index < 6; index += 1) {
      await expect(
        consumeCharacterGenerationQuota({
          email: 'test@example.com',
          ip: '203.0.113.10',
        }),
      ).resolves.toMatchObject({
        allowed: true,
        quota: {
          remaining: 5 - index,
        },
      });
    }

    await expect(
      consumeCharacterGenerationQuota({
        email: 'test@example.com',
        ip: '203.0.113.10',
      }),
    ).resolves.toEqual({
      allowed: false,
      quota: {
        dailyLimit: 6,
        remaining: 0,
        remainingByEmail: 0,
        remainingByIp: 0,
        limitedBy: 'both',
        ipTracked: true,
      },
    });
  });

  it('reports ip-only exhaustion when the email still has quota', async () => {
    const { consumeCharacterGenerationQuota } =
      await import('./characterGenerationLimiter');

    for (let index = 0; index < 6; index += 1) {
      await consumeCharacterGenerationQuota({
        email: `user-${index}@example.com`,
        ip: '203.0.113.77',
      });
    }

    await expect(
      consumeCharacterGenerationQuota({
        email: 'fresh@example.com',
        ip: '203.0.113.77',
      }),
    ).resolves.toEqual({
      allowed: false,
      quota: {
        dailyLimit: 6,
        remaining: 0,
        remainingByEmail: 6,
        remainingByIp: 0,
        limitedBy: 'ip',
        ipTracked: true,
      },
    });
  });

  it('tracks only email when the request ip is unavailable', async () => {
    const { consumeCharacterGenerationQuota, getCharacterGenerationQuota } =
      await import('./characterGenerationLimiter');

    await consumeCharacterGenerationQuota({
      email: 'missing-ip@example.com',
    });

    await expect(
      getCharacterGenerationQuota({
        email: 'missing-ip@example.com',
      }),
    ).resolves.toEqual({
      dailyLimit: 6,
      remaining: 5,
      remainingByEmail: 5,
      remainingByIp: 6,
      limitedBy: 'none',
      ipTracked: false,
    });
  });

  it('does not exceed the limit under concurrent consume attempts', async () => {
    const { consumeCharacterGenerationQuota } =
      await import('./characterGenerationLimiter');

    const results = await Promise.all(
      Array.from({ length: 10 }, () =>
        consumeCharacterGenerationQuota({
          email: 'concurrent@example.com',
          ip: '203.0.113.90',
        }),
      ),
    );

    expect(results.filter((result) => result.allowed)).toHaveLength(6);
    expect(results.filter((result) => !result.allowed)).toHaveLength(4);
    expect(results.at(-1)).toEqual({
      allowed: false,
      quota: {
        dailyLimit: 6,
        remaining: 0,
        remainingByEmail: 0,
        remainingByIp: 0,
        limitedBy: 'both',
        ipTracked: true,
      },
    });
  });
});
