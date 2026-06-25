import { useEffect, useState } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { hasSessionToken } from '@/lib/auth';
import { ApiRequestError, loginWithWeChat } from '@/lib/client';
import InkDivider from '@/components/ink-divider';
import SceneBg from '@/components/scene-bg';
import inkMountainCave from '@/assets/ink-mountain-cave.png';
import './index.css';

export default function Index() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (hasSessionToken()) {
      Taro.switchTab({ url: '/pages/cave/index' });
    }
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const result = await loginWithWeChat();
      if (result.success && result.token) {
        Taro.switchTab({ url: '/pages/cave/index' });
      } else {
        Taro.showToast({ title: result.error || '登录失败', icon: 'none' });
      }
    } catch (error) {
      Taro.showToast({
        title: error instanceof ApiRequestError ? error.message : '登录失败',
        icon: 'none',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="page">
      <SceneBg src={inkMountainCave} />

      <Text className="eyebrow">万界道友</Text>
      <Text className="title">一念入道，万界开卷</Text>
      <Text className="subtitle">修仙模拟 · 文字冒险</Text>

      <View className="desc-card">
        <Text className="desc-line">踏入修仙世界，从凡人到大能。</Text>
        <Text className="desc-line">炼丹炼器、功法神通、洞府修行。</Text>
        <Text className="desc-line">万界道友，等你入道。</Text>
      </View>

      <InkDivider />

      <Button
        className="login-btn"
        loading={loading}
        disabled={loading}
        onClick={handleLogin}
      >
        微信登录
      </Button>
    </View>
  );
}
