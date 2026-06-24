import { useEffect } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { usePlayer } from '@/lib/player-context';
import SectionTitle from '@/components/section-title';
import InkDivider from '@/components/ink-divider';
import BreadButton from '@/components/bread-button';
import NavGrid, { NavItem } from '@/components/nav-grid';
import './index.css';

const navItems: NavItem[] = [
  { icon: '道', label: '道身', onClick: () => Taro.navigateTo({ url: '/pages/cultivator/index' }) },
  { icon: '任', label: '任务', onClick: () => Taro.navigateTo({ url: '/pages/tasks/index' }) },
  { icon: '修', label: '静室', onClick: () => Taro.navigateTo({ url: '/pages/retreat/index' }) },
  { icon: '储', label: '储物袋', onClick: () => Taro.navigateTo({ url: '/pages/inventory/index' }) },
  { icon: '法', label: '功法神通', onClick: () => Taro.navigateTo({ url: '/pages/abilities/index' }) },
  { icon: '炼', label: '炼丹', onClick: () => Taro.navigateTo({ url: '/pages/alchemy/index' }) },
  { icon: '锻', label: '炼器', onClick: () => Taro.navigateTo({ url: '/pages/refine/index' }) },
  { icon: '战', label: '战纪', onClick: () => Taro.navigateTo({ url: '/pages/battle-history/index' }) },
  { icon: '市', label: '坊市', onClick: () => Taro.navigateTo({ url: '/pages/market/index' }) },
  { icon: '榜', label: '排行榜', onClick: () => Taro.navigateTo({ url: '/pages/rankings/index' }) },
  { icon: '信', label: '邮件', onClick: () => Taro.navigateTo({ url: '/pages/mail/index' }) },
  { icon: '兑', label: '兑换', onClick: () => Taro.navigateTo({ url: '/pages/redeem/index' }) },
  { icon: '聊', label: '世界', onClick: () => Taro.navigateTo({ url: '/pages/world-chat/index' }) },
  { icon: '拍', label: '拍卖', onClick: () => Taro.navigateTo({ url: '/pages/auction/index' }) },
];

export default function CavePage() {
  const { cultivator, hasActive, loading, error, refresh } = usePlayer();

  useEffect(() => {
    refresh();
  }, []);

  if (loading) {
    return (
      <View className="page">
        <View className="card status checking">
          <SectionTitle>洞府</SectionTitle>
          <Text className="cardBody">正在探查洞府...</Text>
        </View>
      </View>
    );
  }

  if (!hasActive || !cultivator) {
    return (
      <View className="page">
        <View className="hero">
          <Text className="eyebrow">洞府</Text>
          <Text className="title">空无一人</Text>
          <Text className="summary">你还没有角色，快去创建一个吧。</Text>
        </View>
        <InkDivider />
        <View className="actions">
          <BreadButton
            variant="primary"
            onClick={() => Taro.navigateTo({ url: '/pages/create/index' })}
          >
            凝气入道
          </BreadButton>
        </View>
      </View>
    );
  }

  return (
    <View className="page">
      <View className="hero">
        <Text className="eyebrow">洞府</Text>
        <Text className="title">{cultivator.name}</Text>
        <Text className="summary">
          {cultivator.realm} · {cultivator.realm_stage}
        </Text>
      </View>

      <InkDivider />

      <View className="card">
        <SectionTitle>当前状态</SectionTitle>
        <View className="stats-grid">
          <View className="stat">
            <Text className="stat-label">生命</Text>
            <Text className="stat-value">{cultivator.vitality}</Text>
          </View>
          <View className="stat">
            <Text className="stat-label">灵气</Text>
            <Text className="stat-value">{cultivator.spirit}</Text>
          </View>
          <View className="stat">
            <Text className="stat-label">悟性</Text>
            <Text className="stat-value">{cultivator.wisdom}</Text>
          </View>
          <View className="stat">
            <Text className="stat-label">速度</Text>
            <Text className="stat-value">{cultivator.speed}</Text>
          </View>
          <View className="stat">
            <Text className="stat-label">意志</Text>
            <Text className="stat-value">{cultivator.willpower}</Text>
          </View>
          <View className="stat">
            <Text className="stat-label">灵石</Text>
            <Text className="stat-value">{cultivator.spirit_stones}</Text>
          </View>
        </View>
      </View>

      <View className="card muted">
        <SectionTitle>天</SectionTitle>
        <Text className="cardBody">第 {cultivator.age} 年</Text>
      </View>

      <InkDivider />

      <NavGrid items={navItems} />

      {error && (
        <View className="card status error">
          <Text className="cardBody">{error}</Text>
        </View>
      )}
    </View>
  );
}
