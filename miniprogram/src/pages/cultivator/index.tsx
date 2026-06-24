import { View, Text } from '@tarojs/components';
import { usePlayer } from '@/lib/player-context';
import SectionTitle from '@/components/section-title';
import InkDivider from '@/components/ink-divider';
import ScrollCard from '@/components/scroll-card';
import './index.css';

export default function CultivatorPage() {
  const { cultivator, loading } = usePlayer();

  if (loading) {
    return (
      <View className="page">
        <View className="card status checking">
          <SectionTitle>道身</SectionTitle>
          <Text className="cardBody">正在探查道身...</Text>
        </View>
      </View>
    );
  }

  if (!cultivator) {
    return (
      <View className="page">
        <View className="card status error">
          <SectionTitle>道身</SectionTitle>
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

      <InkDivider />

      <ScrollCard>
        <SectionTitle>境界</SectionTitle>
        <Text className="cardBody">{cultivator.realm} · {cultivator.realm_stage}</Text>
      </ScrollCard>

      <ScrollCard>
        <SectionTitle>属性</SectionTitle>
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
      </ScrollCard>

      <InkDivider />

      <ScrollCard>
        <SectionTitle>灵石</SectionTitle>
        <Text className="cardBody">{cultivator.spirit_stones}</Text>
      </ScrollCard>

      <ScrollCard>
        <SectionTitle>天地灵气</SectionTitle>
        <Text className="cardBody">{cultivator.qi}</Text>
      </ScrollCard>

      <ScrollCard>
        <SectionTitle>寿元</SectionTitle>
        <Text className="cardBody">第 {cultivator.age} 年 / 寿限 {cultivator.lifespan} 年</Text>
      </ScrollCard>

      {cultivator.background && (
        <ScrollCard>
          <SectionTitle>身世</SectionTitle>
          <Text className="cardBody">{cultivator.background}</Text>
        </ScrollCard>
      )}

      {cultivator.personality && (
        <ScrollCard>
          <SectionTitle>性格</SectionTitle>
          <Text className="cardBody">{cultivator.personality}</Text>
        </ScrollCard>
      )}
    </View>
  );
}
