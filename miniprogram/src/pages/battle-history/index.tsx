import { useCallback, useEffect, useState } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import {
  fetchBattleRecords,
  type BattleRecordV2Summary,
  type BattleRecordType,
} from '@/lib/client';
import { ApiRequestError } from '@/lib/client';
import { usePlayer } from '@/lib/player-context';
import SectionTitle from '@/components/section-title';
import InkDivider from '@/components/ink-divider';
import TabBar from '@/components/tab-bar';
import ScrollCard from '@/components/scroll-card';
import Tag from '@/components/tag';
import SceneBg from '@/components/scene-bg';
import inkMountainBattle from '@/assets/ink-mountain-battle.svg';
import './index.css';

type TabKey = 'all' | 'challenge' | 'challenged';

const TAB_ITEMS = [
  { key: 'all', label: '全部' },
  { key: 'challenge', label: '我发起' },
  { key: 'challenged', label: '被挑战' },
];

export default function BattleHistoryPage() {
  const { cultivator } = usePlayer();
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [records, setRecords] = useState<BattleRecordV2Summary[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadRecords = useCallback(async (tab: TabKey, p: number) => {
    if (!cultivator?.id) return;
    setLoading(true);
    try {
      const typeFilter: BattleRecordType | undefined = tab === 'all' ? undefined : tab as BattleRecordType;
      const result = await fetchBattleRecords(p, 20, typeFilter);
      if (result.success && result.data) {
        setRecords(result.data);
        setTotalPages(result.pagination?.totalPages ?? 1);
      } else {
        setRecords([]);
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
    if (cultivator?.id) {
      loadRecords(activeTab, page);
    }
  }, [cultivator?.id, activeTab, page]);

  const switchTab = (key: string) => {
    if (key === activeTab) return;
    setActiveTab(key as TabKey);
    setPage(1);
  };

  const viewDetail = (id: string) => {
    Taro.navigateTo({ url: `/pages/battle-result/index?id=${id}` });
  };

  if (!cultivator) {
    return (
      <View className="page">
        <SceneBg src={inkMountainBattle} />
        <View className="hero">
          <SectionTitle>战纪</SectionTitle>
          <Text className="title">尚未入道</Text>
          <Text className="summary">请先创建角色。</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="page">
      <SceneBg src={inkMountainBattle} />
      <View className="hero">
        <SectionTitle>战纪</SectionTitle>
        <Text className="title">战斗记录</Text>
      </View>

      <TabBar items={TAB_ITEMS} active={activeTab} onChange={switchTab} />

      {loading && (
        <ScrollCard>
          <Text>加载中...</Text>
        </ScrollCard>
      )}

      {!loading && records.length === 0 && (
        <ScrollCard>
          <Text>暂无战斗记录。</Text>
        </ScrollCard>
      )}

      {!loading && records.map((r) => {
        const isWinner = r.winner?.id === cultivator.id;
        const opponent = isWinner ? r.loser : r.winner;
        return (
          <ScrollCard key={r.id}>
            <View className="record-card" onClick={() => viewDetail(r.id)}>
              <View className="record-head">
                <Tag variant={isWinner ? 'win' : 'lose'}>
                  {isWinner ? '胜' : '负'}
                </Tag>
                <Text className="record-opponent">
                  {opponent?.name ?? '未知'} ({opponent?.realm ?? ''})
                </Text>
                <Text className="record-turns">{r.turns} 回合</Text>
              </View>
              <InkDivider />
              <View className="record-meta">
                <Text className="record-type">
                  {r.battleType === 'challenge' ? '主动挑战' : '遭遇挑战'}
                </Text>
                {r.createdAt && (
                  <Text className="record-time">
                    {new Date(r.createdAt).toLocaleDateString('zh-CN')}
                  </Text>
                )}
              </View>
            </View>
          </ScrollCard>
        );
      })}

      {totalPages > 1 && (
        <View className="pager">
          <Button
            className="btn-small"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            上一页
          </Button>
          <Text className="pager-text">{page} / {totalPages}</Text>
          <Button
            className="btn-small"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            下一页
          </Button>
        </View>
      )}
    </View>
  );
}
