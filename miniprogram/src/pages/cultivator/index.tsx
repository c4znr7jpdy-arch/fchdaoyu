import { View, Text } from '@tarojs/components';
import { usePlayer } from '@/lib/player-context';
import './index.css';

export default function CultivatorPage() {
  const { cultivator, loading } = usePlayer();

  if (loading) {
    return (
      <View className="page">
        <View className="card status checking">
          <Text className="cardTitle">道身</Text>
          <Text className="cardBody">正在探查道身...</Text>
        </View>
      </View>
    );
  }

  if (!cultivator) {
    return (
      <View className="page">
        <View className="card status error">
          <Text className="cardTitle">道身</Text>
          <Text className="cardBody">尚未创建角色</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="page">
      <View className="hero">
        <Text className="eyebrow">道身</Text>
        <Text className="title">{cultivator.name}</Text>
        {cultivator.title && <Text className="summary">{cultivator.title}</Text>}
      </View>

      <View className="card">
        <Text className="cardTitle">境界</Text>
        <Text className="cardBody">{cultivator.realm} · {cultivator.realm_stage}</Text>
      </View>

      <View className="card">
        <Text className="cardTitle">属性</Text>
        <View className="attr-grid">
          <View className="attr">
            <Text className="attr-label">生命</Text>
            <Text className="attr-value">{cultivator.vitality}</Text>
          </View>
          <View className="attr">
            <Text className="attr-label">灵气</Text>
            <Text className="attr-value">{cultivator.spirit}</Text>
          </View>
          <View className="attr">
            <Text className="attr-label">悟性</Text>
            <Text className="attr-value">{cultivator.wisdom}</Text>
          </View>
          <View className="attr">
            <Text className="attr-label">速度</Text>
            <Text className="attr-value">{cultivator.speed}</Text>
          </View>
          <View className="attr">
            <Text className="attr-label">意志</Text>
            <Text className="attr-value">{cultivator.willpower}</Text>
          </View>
        </View>
      </View>

      <View className="card">
        <Text className="cardTitle">灵石</Text>
        <Text className="cardBody">{cultivator.spirit_stones}</Text>
      </View>

      <View className="card">
        <Text className="cardTitle">天地灵气</Text>
        <Text className="cardBody">{cultivator.qi}</Text>
      </View>

      <View className="card">
        <Text className="cardTitle">寿元</Text>
        <Text className="cardBody">第 {cultivator.age} 年 / 寿限 {cultivator.lifespan} 年</Text>
      </View>

      {cultivator.background && (
        <View className="card muted">
          <Text className="cardTitle">身世</Text>
          <Text className="cardBody">{cultivator.background}</Text>
        </View>
      )}

      {cultivator.personality && (
        <View className="card muted">
          <Text className="cardTitle">性格</Text>
          <Text className="cardBody">{cultivator.personality}</Text>
        </View>
      )}
    </View>
  );
}
