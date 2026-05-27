import { i18nClient } from '@better-auth/i18n/client';
import { emailOTPClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  basePath: '/api/auth',
  plugins: [i18nClient(), emailOTPClient()],
});
