import { useEffect } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { usePlayer } from '@/lib/player-context';
import './index.css';

export default function CavePage() {
  const { cultivator, hasActive, loading, error, refresh } = usePlayer();

  useEffect(() => {
    refresh();
  }, []);

  if (loading) {
    return (
      <View className="page">
        <View className="card status checking">
          <Text className="cardTitle">洞府</Text>
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
        <View className="actions">
          <View className="btn primary" onClick={() => Taro.navigateTo({ url: '/pages/create/index' })}>
            <Text className="btn-text">凝气入道</Text>
          </View>
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

      <View className="card">
        <Text className="cardTitle">当前状态</Text>
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
        <Text className="cardTitle">天</Text>
        <Text className="cardBody">第 {cultivator.age} 年</Text>
      </View>

      <View className="quick-grid">
        <View className="grid-item" onClick={() => Taro.navigateTo({ url: '/pages/cultivator/index' })}>
          <Text className="grid-icon">道</Text>
          <Text className="grid-label">道身</Text>
        </View>
        <View className="grid-item" onClick={() => Taro.navigateTo({ url: '/pages/tasks/index' })}>
          <Text className="grid-icon">任</Text>
          <Text className="grid-label">任务</Text>
        </View>
        <View className="grid-item">
          <Text className="grid-icon">炼</Text>
          <Text className="grid-label">炼丹</Text>
        </View>
        <View className="grid-item">
          <Text className="grid-icon">锻</Text>
          <Text className="grid-label">炼器</Text>
        </View>
        <View className="grid-item">
          <Text className="grid-icon">坊</Text>
          <Text className="grid-label">坊市</Text>
        </View>
        <View className="grid-item">
          <Text className="grid-icon">修</Text>
          <Text className="grid-label">修行</Text>
        </View>
      </View>

      {error && (
        <View className="card status error">
          <Text className="cardBody">{error}</Text>
        </View>
      )}
    </View>
  );
}
