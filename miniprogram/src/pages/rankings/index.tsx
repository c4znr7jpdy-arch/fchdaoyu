import { useCallback, useEffect, useState } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import {
  fetchBattleRankings,
  fetchItemRankings,
  fetchMyRank,
  type BattleRankingItem,
  type ItemRankingEntry,
  type RankingItemType,
} from '@/lib/client';
import { ApiRequestError } from '@/lib/client';
import { usePlayer } from '@/lib/player-context';
import SectionTitle from '@/components/section-title';
import InkDivider from '@/components/ink-divider';
import TabBar from '@/components/tab-bar';
import ScrollCard from '@/components/scroll-card';
import Tag from '@/components/tag';
import SceneBg from '@/components/scene-bg';
import inkCloud from '@/assets/ink-cloud.svg';
import './index.css';

type TabKey = 'battle' | 'artifact' | 'technique' | 'skill' | 'elixir';

const TAB_ITEMS = [
  { key: 'battle', label: '战力' },
  { key: 'artifact', label: '法宝' },
  { key: 'technique', label: '功法' },
  { key: 'skill', label: '神通' },
  { key: 'elixir', label: '丹药' },
];

export default function RankingsPage() {
  const { cultivator } = usePlayer();
  const [activeTab, setActiveTab] = useState<TabKey>('battle');
  const [battleItems, setBattleItems] = useState<BattleRankingItem[]>([]);
  const [itemEntries, setItemEntries] = useState<ItemRankingEntry[]>([]);
  const [myRank, setMyRank] = useState<{ rank: number | null; remainingChallenges: number; isProtected: boolean } | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async (tab: TabKey) => {
    setLoading(true);
    try {
      if (tab === 'battle') {
        const [rankRes, myRes] = await Promise.all([
          fetchBattleRankings(),
          cultivator?.id ? fetchMyRank() : Promise.resolve(null),
        ]);
        if (rankRes.success && rankRes.data) setBattleItems(rankRes.data);
        else setBattleItems([]);
        if (myRes?.success && myRes.data) setMyRank(myRes.data);
      } else {
        const res = await fetchItemRankings(tab as RankingItemType);
        if (res.success && res.data) setItemEntries(res.data);
        else setItemEntries([]);
      }
    } catch (err) {
      Taro.showToast({
        title: err instanceof ApiRequestError ? err.message : '加载失败',
        icon: 'none',
      });
    } finally {
      setLoading(false);
    }
  }, [cultivator?.id]);

  useEffect(() => {
    loadData(activeTab);
  }, [activeTab, loadData]);

  const switchTab = (key: string) => {
    if (key === activeTab) return;
    setActiveTab(key as TabKey);
  };

  return (
    <View className="page">
      <SceneBg src={inkCloud} />
      <View className="hero">
        <SectionTitle>天骄榜</SectionTitle>
        <Text className="title">排行榜</Text>
      </View>

      <TabBar items={TAB_ITEMS} active={activeTab} onChange={switchTab} />

      {activeTab === 'battle' && myRank && (
        <ScrollCard>
          <View className="my-rank-card">
            <Text className="my-rank-label">我的排名</Text>
            <Text className="my-rank-value">{myRank.rank ?? '未上榜'}</Text>
            <Text className="my-rank-meta">
              剩余挑战 {myRank.remainingChallenges} 次
              {myRank.isProtected ? ' · 保护中' : ''}
            </Text>
          </View>
        </ScrollCard>
      )}

      {loading && (
        <ScrollCard>
          <Text>加载中...</Text>
        </ScrollCard>
      )}

      {!loading && activeTab === 'battle' && battleItems.length === 0 && (
        <ScrollCard>
          <Text>暂无排名数据。</Text>
        </ScrollCard>
      )}

      {!loading && activeTab === 'battle' && battleItems.map((item) => (
        <ScrollCard key={item.id}>
          <View className="rank-card">
            <View className="rank-num">
              <Text className={`rank-value ${item.rank <= 3 ? 'top' : ''}`}>
                {item.rank}
              </Text>
            </View>
            <View className="rank-info">
              <View className="rank-head">
                <Text className="rank-name">{item.name}</Text>
                {item.is_new_comer && <Tag variant="default">新</Tag>}
              </View>
              <Text className="rank-realm">{item.realm} {item.realm_stage}</Text>
            </View>
          </View>
        </ScrollCard>
      ))}

      {!loading && activeTab !== 'battle' && itemEntries.length === 0 && (
        <ScrollCard>
          <Text>暂无排名数据。</Text>
        </ScrollCard>
      )}

      {!loading && activeTab !== 'battle' && itemEntries.map((item) => (
        <ScrollCard key={item.id}>
          <View className="rank-card">
            <View className="rank-num">
              <Text className={`rank-value ${item.rank <= 3 ? 'top' : ''}`}>
                {item.rank}
              </Text>
            </View>
            <View className="rank-info">
              <View className="rank-head">
                <Text className="rank-name">{item.name}</Text>
                {item.quality && <Tag variant="default">{item.quality}</Tag>}
              </View>
              <Text className="rank-meta">
                持有者：{item.ownerName} · 评分 {item.score}
              </Text>
            </View>
          </View>
        </ScrollCard>
      ))}
    </View>
  );
}
