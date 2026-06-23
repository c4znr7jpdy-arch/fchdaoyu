import { Hono } from 'hono';
import { authUsers } from '@server/lib/auth/schema';
import { db } from '@server/lib/drizzle/db';
import { eq } from 'drizzle-orm';
import { redis } from '@server/lib/redis';
import type { AppEnv } from '@server/lib/hono/types';
import { randomBytes } from 'node:crypto';

const router = new Hono<AppEnv>();

const WX_APPID = process.env.WECHAT_MINI_APPID;
const WX_SECRET = process.env.WECHAT_MINI_SECRET;

const MP_SESSION_PREFIX = 'mp:session:';
const MP_SESSION_TTL = 60 * 60 * 24 * 30; // 30 days
const WX_SESSION_KEY_PREFIX = 'wx:session:';
const WX_SESSION_KEY_TTL = 7200; // 2 hours

interface WxCode2SessionResponse {
  openid?: string;
  session_key?: string;
  unionid?: string;
  errcode?: number;
  errmsg?: string;
}

async function code2Session(code: string): Promise<WxCode2SessionResponse> {
  if (!WX_APPID || !WX_SECRET) {
    throw new Error('WeChat Mini Program credentials not configured');
  }

  const url = new URL('https://api.weixin.qq.com/sns/jscode2session');
  url.searchParams.set('appid', WX_APPID);
  url.searchParams.set('secret', WX_SECRET);
  url.searchParams.set('js_code', code);
  url.searchParams.set('grant_type', 'authorization_code');

  const response = await fetch(url.toString());
  const data = (await response.json()) as WxCode2SessionResponse;

  if (data.errcode) {
    throw new Error(`WeChat API error ${data.errcode}: ${data.errmsg}`);
  }

  if (!data.openid || !data.session_key) {
    throw new Error('Invalid response from WeChat API');
  }

  return data;
}

async function storeSessionKey(openid: string, sessionKey: string): Promise<void> {
  await redis.set(
    `${WX_SESSION_KEY_PREFIX}${openid}`,
    sessionKey,
    'EX',
    WX_SESSION_KEY_TTL,
  );
}

function generateSessionToken(): string {
  return randomBytes(32).toString('hex');
}

async function createMiniProgramSession(userId: string): Promise<string> {
  const token = generateSessionToken();
  await redis.set(
    `${MP_SESSION_PREFIX}${token}`,
    userId,
    'EX',
    MP_SESSION_TTL,
  );
  return token;
}

router.post('/wx/login', async (c) => {
  try {
    const body = await c.req.json().catch(() => null) as { code?: string } | null;
    const code = body?.code;

    if (!code || typeof code !== 'string') {
      return c.json({ success: false, error: '缺少 code' }, 400);
    }

    const { openid, session_key } = await code2Session(code);
    await storeSessionKey(openid, session_key);

    let user = await db()
      .select()
      .from(authUsers)
      .where(eq(authUsers.wxOpenid, openid))
      .limit(1);

    let isNewUser = false;

    if (user.length === 0) {
      const syntheticEmail = `wx_${openid}@wx.local`;
      const now = new Date();

      const [newUser] = await db()
        .insert(authUsers)
        .values({
          name: '玩家',
          email: syntheticEmail,
          emailVerified: false,
          wxOpenid: openid,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      user = [newUser];
      isNewUser = true;
    }

    const authUser = user[0];
    const token = await createMiniProgramSession(authUser.id);

    return c.json({
      success: true,
      token,
      user: {
        id: authUser.id,
        name: authUser.name,
        isNewUser,
      },
    });
  } catch (error) {
    console.error('WeChat login error:', error);
    const message = error instanceof Error ? error.message : '登录失败';
    return c.json({ success: false, error: message }, 500);
  }
});

export default router;
