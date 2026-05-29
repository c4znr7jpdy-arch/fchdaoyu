import { Hono } from 'hono';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  consumeCharacterGenerationQuotaMock,
  generateCultivatorFromAIMock,
  getCharacterGenerationQuotaMock,
  saveTempCharacterMock,
} = vi.hoisted(() => ({
  consumeCharacterGenerationQuotaMock: vi.fn(),
  generateCultivatorFromAIMock: vi.fn(),
  getCharacterGenerationQuotaMock: vi.fn(),
  saveTempCharacterMock: vi.fn(),
}));

vi.mock('@server/lib/hono/middleware', () => ({
  requireUser: () => async (context: any, next: () => Promise<void>) => {
    context.set('user', {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
    });
    await next();
  },
}));

vi.mock('@server/lib/redis/characterGenerationLimiter', () => ({
  consumeCharacterGenerationQuota: consumeCharacterGenerationQuotaMock,
  getCharacterGenerationQuota: getCharacterGenerationQuotaMock,
}));

vi.mock('@server/lib/repositories/redisCultivatorRepository', () => ({
  saveTempCharacter: saveTempCharacterMock,
}));

vi.mock('@server/utils/characterEngine', () => ({
  generateCultivatorFromAI: generateCultivatorFromAIMock,
}));

import {
  CHARACTER_GENERATION_LIMIT_REACHED_CODE,
  type CharacterGenerationQuota,
} from '@shared/contracts/character-generation';
import generateCharacterRouter from './generate-character.router';

function createQuota(
  overrides: Partial<CharacterGenerationQuota> = {},
): CharacterGenerationQuota {
  return {
    dailyLimit: 6,
    remaining: 5,
    remainingByEmail: 5,
    remainingByIp: 5,
    limitedBy: 'none',
    ipTracked: true,
    ...overrides,
  };
}

function createApp() {
  return new Hono().route('/api/generate-character', generateCharacterRouter);
}

describe('generate-character router', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    consumeCharacterGenerationQuotaMock.mockResolvedValue({
      allowed: true,
      quota: createQuota(),
    });
    getCharacterGenerationQuotaMock.mockResolvedValue(createQuota());
    generateCultivatorFromAIMock.mockResolvedValue({
      cultivator: { name: '韩立' },
      balanceNotes: '',
    });
    saveTempCharacterMock.mockResolvedValue('temp-1');
  });

  it('does not consume quota when the prompt is too short', async () => {
    const response = await createApp().request('/api/generate-character', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '203.0.113.8, 10.0.0.1',
      },
      body: JSON.stringify({ userInput: 'a' }),
    });

    expect(response.status).toBe(400);
    expect(consumeCharacterGenerationQuotaMock).not.toHaveBeenCalled();
    expect(generateCultivatorFromAIMock).not.toHaveBeenCalled();
  });

  it('consumes quota before generating and returns quota in the success payload', async () => {
    const response = await createApp().request('/api/generate-character', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '203.0.113.8, 10.0.0.1',
      },
      body: JSON.stringify({ userInput: '寒门剑修' }),
    });

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(consumeCharacterGenerationQuotaMock).toHaveBeenCalledWith({
      email: 'test@example.com',
      ip: '203.0.113.8',
    });
    expect(
      generateCultivatorFromAIMock.mock.invocationCallOrder[0],
    ).toBeGreaterThan(
      consumeCharacterGenerationQuotaMock.mock.invocationCallOrder[0],
    );
    expect(body).toMatchObject({
      success: true,
      data: {
        tempCultivatorId: 'temp-1',
        quota: createQuota(),
      },
    });
  });

  it('returns a 429 with code and quota when the daily limit is exhausted', async () => {
    consumeCharacterGenerationQuotaMock.mockResolvedValueOnce({
      allowed: false,
      quota: createQuota({
        remaining: 0,
        remainingByEmail: 0,
        remainingByIp: 0,
        limitedBy: 'both',
      }),
    });

    const response = await createApp().request('/api/generate-character', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '203.0.113.8',
      },
      body: JSON.stringify({ userInput: '寒门剑修' }),
    });

    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body).toEqual({
      success: false,
      code: CHARACTER_GENERATION_LIMIT_REACHED_CODE,
      error: '该邮箱与当前网络今日角色推演次数均已用尽，请明日再试。',
      quota: createQuota({
        remaining: 0,
        remainingByEmail: 0,
        remainingByIp: 0,
        limitedBy: 'both',
      }),
    });
    expect(generateCultivatorFromAIMock).not.toHaveBeenCalled();
  });

  it('returns the live quota for the current user and request ip', async () => {
    const response = await createApp().request(
      '/api/generate-character/quota',
      {
        headers: {
          'cf-connecting-ip': '198.51.100.7',
        },
      },
    );

    expect(response.status).toBe(200);
    expect(getCharacterGenerationQuotaMock).toHaveBeenCalledWith({
      email: 'test@example.com',
      ip: '198.51.100.7',
    });
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: {
        quota: createQuota(),
      },
    });
  });
});
