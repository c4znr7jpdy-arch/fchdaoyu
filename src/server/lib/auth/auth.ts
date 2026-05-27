import { i18n, type TranslationDictionary } from '@better-auth/i18n';
import { betterAuth } from 'better-auth';
import { emailOTP } from 'better-auth/plugins/email-otp';
import { sendViaSmtp } from '../admin/smtp';
import { pgPool } from '../drizzle/db';

function getRequiredEnv(name: 'BETTER_AUTH_SECRET' | 'BETTER_AUTH_URL') {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing Better Auth config: ${name}`);
  }

  return value;
}

function getBetterAuthSchemaName() {
  return process.env.BETTER_AUTH_DB_SCHEMA?.trim() || 'better_auth';
}

function getGitHubProviderConfig() {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return undefined;
  }

  return {
    clientId,
    clientSecret,
  };
}

function fallbackDisplayName(email: string, name?: string | null) {
  const trimmedName = name?.trim();

  if (trimmedName) {
    return trimmedName;
  }

  const [prefix] = email.split('@');
  return prefix?.trim() || '道友';
}

const zhAuthTranslations = {
  USER_NOT_FOUND: '未寻得此道友',
  FAILED_TO_CREATE_SESSION: '归位失败，请稍后重试',
  INVALID_PASSWORD: '口令有误',
  INVALID_EMAIL: '飞鸽传书地址格式有误',
  INVALID_EMAIL_OR_PASSWORD: '飞鸽传书地址或口令有误',
  PROVIDER_NOT_FOUND: '未找到对应的归位方式',
  INVALID_TOKEN: '凭证无效',
  TOKEN_EXPIRED: '凭证已失效，请重新发起',
  FAILED_TO_GET_USER_INFO: '未能取得道友信息，请稍后重试',
  USER_EMAIL_NOT_FOUND: '未取得飞鸽传书地址',
  EMAIL_NOT_VERIFIED: '飞鸽传书地址尚未验证',
  PASSWORD_TOO_SHORT: '口令太短',
  PASSWORD_TOO_LONG: '口令过长',
  USER_ALREADY_EXISTS: '此飞鸽传书地址已被占用',
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: '此飞鸽传书地址已被占用，请换一个',
  EMAIL_CAN_NOT_BE_UPDATED: '暂不支持更改飞鸽传书地址',
  CREDENTIAL_ACCOUNT_NOT_FOUND: '未找到对应口令归位记录',
  SESSION_EXPIRED: '会话已失效，请重新归位后再试',
  SOCIAL_ACCOUNT_ALREADY_LINKED: '此 GitHub 命盘已绑定其他道友',
  INVALID_CALLBACK_URL: '回传地址无效，请稍后重试',
  INVALID_REDIRECT_URL: '跳转地址无效，请稍后重试',
  INVALID_ERROR_CALLBACK_URL: '错误回传地址无效，请稍后重试',
  INVALID_NEW_USER_CALLBACK_URL: '新道友回传地址无效，请稍后重试',
  CALLBACK_URL_REQUIRED: '缺少回传地址，请稍后重试',
  FAILED_TO_CREATE_VERIFICATION: '召符生成失败，请稍后重试',
  MISSING_FIELD: '请将信息填写完整',
  PASSWORD_ALREADY_SET: '此道友已设过口令',
  OTP_EXPIRED: '召符已失效，请重新获取',
  INVALID_OTP: '召符有误',
  TOO_MANY_ATTEMPTS: '尝试次数过多，请重新获取召符',
} satisfies TranslationDictionary;

export const authSchemaName = getBetterAuthSchemaName();

export const auth = betterAuth({
  baseURL: getRequiredEnv('BETTER_AUTH_URL'),
  secret: getRequiredEnv('BETTER_AUTH_SECRET'),
  database: pgPool,
  advanced: {
    database: {
      generateId: 'uuid',
    },
  },
  emailAndPassword: {
    enabled: true,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await sendViaSmtp(
        user.email,
        '【万界道友】重设口令',
        [
          `${user.name || '道友'}，你正在申请重设口令。`,
          '',
          '请点击下方链接继续：',
          url,
          '',
          '若这不是你的操作，可忽略本邮件。',
        ].join('\n'),
      );
    },
  },
  socialProviders: {
    ...(getGitHubProviderConfig() ? { github: getGitHubProviderConfig() } : {}),
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ['github'],
      updateUserInfoOnLink: true,
    },
  },
  plugins: [
    i18n({
      defaultLocale: 'zh',
      translations: {
        zh: zhAuthTranslations,
      },
    }),
    emailOTP({
      otpLength: 6,
      expiresIn: 60 * 10,
      sendVerificationOTP: async ({ email, otp, type }) => {
        const subject =
          type === 'forget-password'
            ? '【万界道友】重设口令验证码'
            : '【万界道友】登录验证码';

        const headline =
          type === 'forget-password'
            ? '你正在重设口令。'
            : '你正在请求登录口令。';

        await sendViaSmtp(
          email,
          subject,
          [
            headline,
            '',
            `验证码：${otp}`,
            '有效期：10 分钟。',
            '',
            '若这不是你的操作，可忽略本邮件。',
          ].join('\n'),
        );
      },
    }),
  ],
  databaseHooks: {
    user: {
      create: {
        async before(user) {
          return {
            data: {
              ...user,
              name: fallbackDisplayName(user.email, user.name),
            },
          };
        },
      },
    },
  },
});
