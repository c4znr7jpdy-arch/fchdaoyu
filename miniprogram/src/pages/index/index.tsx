import { useEffect, useState } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { API_BASE_URL, getMiniProgramEnvVersion } from '@/config';
import { hasSessionToken } from '@/lib/auth';
import { ApiRequestError, getHealthCheck } from '@/lib/client';
import './index.css';

type HealthStatus = 'checking' | 'ok' | 'error';

export default function Index() {
  const envVersion = getMiniProgramEnvVersion();
  const [healthStatus, setHealthStatus] = useState<HealthStatus>('checking');
  const [healthMessage, setHealthMessage] = useState('正在探查后端气机');
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    const token = hasSessionToken();
    setHasToken(token);

    if (token) {
      Taro.switchTab({ url: '/pages/cave/index' });
      return;
    }

    getHealthCheck()
      .then((result) => {
        setHealthStatus(result.success ? 'ok' : 'error');
        setHealthMessage(result.message || result.error || '后端已响应');
      })
      .catch((error: unknown) => {
        setHealthStatus('error');
        setHealthMessage(
          error instanceof ApiRequestError ? error.message : '后端暂不可达',
        );
      });
  }, []);

  const goToLogin = () => {
    Taro.navigateTo({ url: '/pages/login/index' });
  };

  return (
    <View className="page">
      <View className="hero">
        <Text className="eyebrow">万界道友 · 微信小程序</Text>
        <Text className="title">一念入道，万界开卷</Text>
        <Text className="summary">
          欢迎来到万界道友。登录后开启你的修仙旅程。
        </Text>
      </View>

      <View className="card muted">
        <Text className="cardTitle">运行环境</Text>
        <Text className="cardBody">{envVersion}</Text>
        <Text className="endpoint">{API_BASE_URL}</Text>
      </View>

      <View className={`card status ${healthStatus}`}>
        <Text className="cardTitle">后端探针</Text>
        <Text className="cardBody">{healthMessage}</Text>
      </View>

      <View className="actions">
        <Button className="btn primary" onClick={goToLogin}>
          微信登录
        </Button>
      </View>
    </View>
  );
}
