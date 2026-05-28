import { useAuthFeedback } from '@app/components/auth';
import { useAuth } from '@app/lib/auth/authContext';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { useAuthMock, useAuthFeedbackMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  useAuthFeedbackMock: vi.fn(),
}));

vi.mock('@app/lib/auth/authContext', () => ({
  useAuth: useAuthMock,
}));

vi.mock('@app/components/auth', async () => {
  const actual = await vi.importActual<typeof import('@app/components/auth')>(
    '@app/components/auth',
  );

  return {
    ...actual,
    useAuthFeedback: useAuthFeedbackMock,
  };
});

import LoginRoute from '@app/routes/login/route';
import SignupRoute from '@app/routes/signup/route';

describe('auth entry email OTP links', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      signInWithGitHub: vi.fn(),
    } as any);
    vi.mocked(useAuthFeedback).mockReturnValue({
      showErrorDialog: vi.fn(),
    } as any);
  });

  it('keeps the login choice page pointing to the official OTP route', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/login']}>
        <LoginRoute />
      </MemoryRouter>,
    );

    expect(html).toContain('href="/login/email"');
    expect(html).not.toContain('href="/signup/email"');
  });

  it('points the signup choice page to the same official OTP route', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/signup']}>
        <SignupRoute />
      </MemoryRouter>,
    );

    expect(html).toContain('href="/login/email?source=signup"');
    expect(html).not.toContain('href="/signup/email"');
  });
});
