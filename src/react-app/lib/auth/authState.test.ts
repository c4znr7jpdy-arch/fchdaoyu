import { toErrorMessage } from '@app/components/auth/utils';
import { BetterFetchError } from '@better-fetch/fetch';
import { describe, expect, it, vi } from 'vitest';

vi.mock('./client', () => ({
  authClient: {},
}));

import { toAuthActionError } from './authState';

describe('authState error mapping', () => {
  it('prefers the nested Better Auth message over HTTP status text', () => {
    const error = new BetterFetchError(401, 'Unauthorized', {
      code: 'INVALID_EMAIL_OR_PASSWORD',
      message: '邮箱或密码错误',
      originalMessage: 'Invalid email or password',
    });

    expect(toAuthActionError(error)).toEqual({
      code: 'INVALID_EMAIL_OR_PASSWORD',
      message: '邮箱或密码错误',
      originalMessage: 'Invalid email or password',
      status: 401,
      statusText: 'Unauthorized',
    });
  });

  it('normalizes rate limit responses to a Chinese fallback', () => {
    expect(
      toErrorMessage(
        {
          message: 'Too many requests. Please try again later.',
          status: 429,
        },
        '发送失败，请稍后重试',
      ),
    ).toBe('请求过于频繁，请一个时辰后再试');
  });
});
