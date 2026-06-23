import { useState } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { ApiRequestError, loginWithWeChat } from '@/lib/client';
import { hasSessionToken, clearSessionToken } from '@/lib/auth';
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

      <View className="card">
        <Text className="cardTitle">当前会话</Text>
        <Text className="cardBody">
          {hasSessionToken() ? '已发现本地令牌' : '尚未登录'}
        </Text>
      </View>

      {status === 'logging-in' || status === 'success' ? (
        <View className={`card status ${status === 'success' ? 'ok' : 'checking'}`}>
          <Text className="cardTitle">登录状态</Text>
          <Text className="cardBody">{message}</Text>
        </View>
      ) : null}

      {status === 'error' ? (
        <View className="card status error">
          <Text className="cardTitle">登录失败</Text>
          <Text className="cardBody">{message}</Text>
        </View>
      ) : null}

      {isNewUser ? (
        <View className="card muted">
          <Text className="cardTitle">新道友</Text>
          <Text className="cardBody">系统已为你创建新道号，下一步可前往创建角色。</Text>
        </View>
      ) : null}

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
          <Button className="btn ghost" onClick={handleClearSession}>
            清除本地令牌
          </Button>
        ) : null}
      </View>
    </View>
  );
}
