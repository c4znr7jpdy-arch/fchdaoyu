import { Hono } from 'hono';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  authHandlerMock,
  dbMock,
  eqMock,
  verifyTurnstileTokenMock,
} = vi.hoisted(() => ({
  authHandlerMock: vi.fn(),
  dbMock: vi.fn(),
  eqMock: vi.fn(),
  verifyTurnstileTokenMock: vi.fn(),
}));

vi.mock('@server/lib/auth/auth', () => ({
  auth: {
    handler: authHandlerMock,
  },
}));

vi.mock('@server/lib/auth/schema', () => ({
  authUsers: {
    id: 'id',
    email: 'email',
  },
}));

vi.mock('@server/lib/auth/turnstile', () => ({
  verifyTurnstileToken: verifyTurnstileTokenMock,
}));

vi.mock('@server/lib/drizzle/db', () => ({
  db: dbMock,
}));

vi.mock('drizzle-orm', () => ({
  eq: eqMock,
}));

import { handleAuthRequest } from './hono';

function createApp() {
  const app = new Hono();
  app.all('/api/auth/*', handleAuthRequest);
  return app;
}

function mockUserLookup(rows: Array<{ id: string }>) {
  const chain = {
    from: vi.fn(),
    where: vi.fn(),
    limit: vi.fn(),
  };

  chain.from.mockReturnValue(chain);
  chain.where.mockReturnValue(chain);
  chain.limit.mockResolvedValue(rows);

  dbMock.mockReturnValue({
    select: vi.fn(() => chain),
  });
}

describe('handleAuthRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authHandlerMock.mockResolvedValue(Response.json({ success: true }));
    verifyTurnstileTokenMock.mockResolvedValue(true);
    eqMock.mockReturnValue('email-equals');
    mockUserLookup([]);
  });

  it('rejects first-time email OTP sign-in when the display name is missing', async () => {
    const response = await createApp().request('/api/auth/sign-in/email-otp', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        email: 'new@daoyou.org',
        otp: '123456',
      }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: '首次注册请填写昵称',
    });
    expect(authHandlerMock).not.toHaveBeenCalled();
  });

  it('allows existing users to verify email OTP without sending the display name again', async () => {
    mockUserLookup([{ id: 'user-1' }]);

    const response = await createApp().request('/api/auth/sign-in/email-otp', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        email: 'old@daoyou.org',
        otp: '123456',
      }),
    });

    expect(response.status).toBe(200);
    expect(authHandlerMock).toHaveBeenCalledTimes(1);
  });

  it('still requires Turnstile for sending email OTP', async () => {
    const response = await createApp().request(
      '/api/auth/email-otp/send-verification-otp',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          email: 'new@daoyou.org',
          type: 'sign-in',
        }),
      },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: '请先完成人机验证',
    });
    expect(verifyTurnstileTokenMock).not.toHaveBeenCalled();
    expect(authHandlerMock).not.toHaveBeenCalled();
  });

  it('passes Turnstile-protected OTP send requests through to Better Auth after verification', async () => {
    const response = await createApp().request(
      '/api/auth/email-otp/send-verification-otp',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-turnstile-token': 'captcha-token',
        },
        body: JSON.stringify({
          email: 'new@daoyou.org',
          type: 'sign-in',
        }),
      },
    );

    expect(response.status).toBe(200);
    expect(verifyTurnstileTokenMock).toHaveBeenCalledWith(
      'captcha-token',
      undefined,
    );
    expect(authHandlerMock).toHaveBeenCalledTimes(1);
  });
});
