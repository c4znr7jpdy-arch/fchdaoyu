import { useState } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { ApiRequestError, loginWithWeChat } from '@/lib/client';
import { hasSessionToken, clearSessionToken } from '@/lib/auth';
import SectionTitle from '@/components/section-title';
import InkDivider from '@/components/ink-divider';
import BreadButton from '@/components/bread-button';
import './index.css';

type LoginStatus = 'idle' | 'logging-in' | 'success' | 'error';

export default function Login() {
  const [status, setStatus] = useState<LoginStatus>('idle');
  const [message, setMessage] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);

  const handleLogin = async () => {
    setStatus('logging-in');
    setMessage('正在向微信请示道号');

    try {
      const result = await loginWithWeChat();

      if (result.success && result.token) {
        setStatus('success');
        setMessage(`登录成功，欢迎你，${result.user?.name ?? '道友'}`);
        setIsNewUser(Boolean(result.user?.isNewUser));

        setTimeout(() => {
          Taro.redirectTo({ url: '/pages/index/index' });
        }, 800);
      } else {
        setStatus('error');
        setMessage(result.error || '登录失败');
      }
    } catch (error) {
      setStatus('error');
      setMessage(
        error instanceof ApiRequestError ? error.message : '登录失败，请稍后重试',
      );
    }
  };

  const handleClearSession = () => {
    clearSessionToken();
    setStatus('idle');
    setMessage('已清除本地令牌');
  };

  return (
    <View className="page">
      <View className="hero">
        <Text className="eyebrow">万界道友</Text>
        <Text className="title">入道登册</Text>
        <Text className="summary">
          使用微信身份登录，开启你的修仙旅程。首次登录将自动注册新道号。
        </Text>
      </View>

      <InkDivider />

      <View className="card">
        <SectionTitle>当前会话</SectionTitle>
        <Text className="cardBody">
          {hasSessionToken() ? '已发现本地令牌' : '尚未登录'}
        </Text>
      </View>

      {status === 'logging-in' || status === 'success' ? (
        <View className={`card status ${status === 'success' ? 'ok' : 'checking'}`}>
          <SectionTitle>登录状态</SectionTitle>
          <Text className="cardBody">{message}</Text>
        </View>
      ) : null}

      {status === 'error' ? (
        <View className="card status error">
          <SectionTitle>登录失败</SectionTitle>
          <Text className="cardBody">{message}</Text>
        </View>
      ) : null}

      {isNewUser ? (
        <View className="card muted">
          <SectionTitle>新道友</SectionTitle>
          <Text className="cardBody">系统已为你创建新道号，下一步可前往创建角色。</Text>
        </View>
      ) : null}

      <InkDivider />

      <View className="actions">
        <Button
          className="btn primary"
          loading={status === 'logging-in'}
          disabled={status === 'logging-in' || status === 'success'}
          onClick={handleLogin}
        >
          微信登录
        </Button>

        {hasSessionToken() ? (
          <BreadButton variant="ghost" onClick={handleClearSession}>
            清除本地令牌
          </BreadButton>
        ) : null}
      </View>

      <View className="links">
        <Text className="link" onClick={() => Taro.navigateTo({ url: '/pages/privacy/index' })}>
          隐私协议
        </Text>
        <Text className="link-sep">·</Text>
        <Text className="link" onClick={() => Taro.navigateTo({ url: '/pages/agreement/index' })}>
          用户协议
        </Text>
      </View>
    </View>
  );
}
