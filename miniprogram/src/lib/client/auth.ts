import { request } from './request';
import { setSessionToken } from '@/lib/auth';

type WxLoginResponse = {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    name: string;
    isNewUser: boolean;
  };
  error?: string;
};

export function loginWithWeChat() {
  return new Promise<WxLoginResponse>((resolve, reject) => {
    wx.login({
      success: async (res) => {
        if (!res.code) {
          reject(new Error('微信登录未返回 code'));
          return;
        }

        try {
          const result = await request<WxLoginResponse>({
            url: '/api/wx/wx/login',
            method: 'POST',
            data: { code: res.code },
            auth: false,
          });

          if (result.success && result.token) {
            setSessionToken(result.token);
          }

          resolve(result);
        } catch (error) {
          reject(error);
        }
      },
      fail: () => {
        reject(new Error('微信登录调用失败'));
      },
    });
  });
}
