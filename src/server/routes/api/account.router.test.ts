import { auth } from '@server/lib/auth/auth';
import { Hono } from 'hono';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import accountRouter from './account.router';

const authState = vi.hoisted(() => ({
  user: null as { id: string; email: string; name: string } | null,
}));

vi.mock('@server/lib/auth/auth', () => ({
  auth: {
    api: {
      setPassword: vi.fn(),
    },
  },
}));

vi.mock('@server/lib/hono/middleware', () => ({
  requireUser: () => async (context: any, next: () => Promise<void>) => {
    if (!authState.user) {
      context.res = Response.json(
        { success: false, error: '未授权访问' },
        { status: 401 },
      );
      return;
    }

    context.set('user', authState.user);
    await next();
  },
  validateJson:
    (schema: { parse: (value: unknown) => unknown }) =>
    async (context: any, next: () => Promise<void>) => {
      const body = await context.req.json();
      context.set('validatedJson', schema.parse(body));
      await next();
    },
  getValidatedJson: (context: any) => context.get('validatedJson'),
}));

const setPasswordMock = auth.api.setPassword as unknown as Mock;

function createApp() {
  return new Hono().route('/api/account', accountRouter);
}

describe('account router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState.user = null;
  });

  it('requires a logged-in user to set an initial password', async () => {
    const response = await createApp().request('/api/account/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword: 'secret-password' }),
    });

    await expect(response.json()).resolves.toEqual({
      success: false,
      error: '未授权访问',
    });
    expect(response.status).toBe(401);
    expect(setPasswordMock).not.toHaveBeenCalled();
  });

  it('sets an initial password through Better Auth for the current session', async () => {
    authState.user = {
      id: 'user-1',
      email: 'user@example.com',
      name: '玩家',
    };
    setPasswordMock.mockResolvedValueOnce({ status: true });

    const response = await createApp().request('/api/account/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword: 'secret-password' }),
    });

    await expect(response.json()).resolves.toEqual({
      success: true,
      data: { status: true },
    });
    expect(response.status).toBe(200);
    expect(setPasswordMock).toHaveBeenCalledWith({
      body: { newPassword: 'secret-password' },
      headers: expect.any(Headers),
    });
  });
});
