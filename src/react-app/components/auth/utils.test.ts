import { describe, expect, it } from 'vitest';
import {
  buildEmailOtpTarget,
  getEmailOtpVerifyFieldErrors,
  isEmailOtpNameRequiredError,
} from './utils';

describe('email OTP helpers', () => {
  it('builds official OTP targets with email, optional name, and signup source', () => {
    expect(
      buildEmailOtpTarget('/login/verify', {
        email: 'new@daoyou.org',
        displayName: '青岚道友',
        source: 'signup',
      }),
    ).toBe(
      '/login/verify?email=new%40daoyou.org&name=%E9%9D%92%E5%B2%9A%E9%81%93%E5%8F%8B&source=signup',
    );
  });

  it('treats the missing display-name response as an inline retry case', () => {
    expect(
      getEmailOtpVerifyFieldErrors({
        otp: '123456',
        displayName: '',
        displayNameRequired: false,
      }),
    ).toEqual({
      otp: undefined,
      displayName: undefined,
    });

    expect(
      isEmailOtpNameRequiredError({
        message: '首次注册请填写昵称',
      }),
    ).toBe(true);

    expect(
      getEmailOtpVerifyFieldErrors({
        otp: '123456',
        displayName: '',
        displayNameRequired: true,
      }),
    ).toEqual({
      otp: undefined,
      displayName: '请输入昵称',
    });

    expect(
      getEmailOtpVerifyFieldErrors({
        otp: '123456',
        displayName: '青岚道友',
        displayNameRequired: true,
      }),
    ).toEqual({
      otp: undefined,
      displayName: undefined,
    });
  });
});
