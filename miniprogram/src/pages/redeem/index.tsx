import { useState } from 'react';
import { View, Text, Button, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { claimRedeemCode } from '@/lib/client';
import { ApiRequestError } from '@/lib/client';
import { usePlayer } from '@/lib/player-context';
import SectionTitle from '@/components/section-title';
import InkDivider from '@/components/ink-divider';
import ScrollCard from '@/components/scroll-card';
import BreadButton from '@/components/bread-button';
import './index.css';

export default function RedeemPage() {
  const { cultivator, refresh } = usePlayer();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleClaim = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      Taro.showToast({ title: '请输入兑换码', icon: 'none' });
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const res = await claimRedeemCode(trimmed);
      if (res.success) {
        setResult({ success: true, message: res.message || '兑换成功！' });
        setCode('');
        await refresh();
      } else {
        setResult({ success: false, message: res.error || '兑换失败' });
      }
    } catch (err) {
      const msg = err instanceof ApiRequestError ? err.message : '兑换失败';
      setResult({ success: false, message: msg });
    } finally {
      setLoading(false);
    }
  };

  if (!cultivator) {
    return (
      <View className="page">
        <View className="hero">
          <SectionTitle>兑换</SectionTitle>
          <Text className="title">尚未入道</Text>
          <Text className="summary">请先创建角色。</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="page">
      <View className="hero">
        <SectionTitle>兑换</SectionTitle>
        <Text className="title">兑换码</Text>
        <Text className="summary">输入兑换码领取奖励。</Text>
      </View>

      <InkDivider />

      <ScrollCard>
        <View className="card">
          <Text className="cardTitle">输入兑换码</Text>
          <Input
            className="redeem-input"
            value={code}
            onInput={(e) => setCode(e.detail.value)}
            placeholder="请输入兑换码"
            maxlength={64}
          />
          <Button
            className="btn primary"
            loading={loading}
            disabled={loading || !code.trim()}
            onClick={handleClaim}
          >
            兑换
          </Button>
        </View>
      </ScrollCard>

      {result && (
        <ScrollCard>
          <View className={`card result-card ${result.success ? 'success' : 'error'}`}>
            <Text className="result-icon">{result.success ? '✓' : '✗'}</Text>
            <Text className="result-text">{result.message}</Text>
          </View>
        </ScrollCard>
      )}
    </View>
  );
}
