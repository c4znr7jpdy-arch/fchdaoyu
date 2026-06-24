import { useCallback, useEffect, useState } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import {
  fetchInventory,
  equipArtifact,
  consumeItem,
  identifyMaterial,
  discardItem,
  type InventoryTab,
  type InventoryPagination,
} from '@/lib/client';
import { ApiRequestError } from '@/lib/client';
import { usePlayer } from '@/lib/player-context';
import type { Artifact, Consumable, Material } from '@shared/types/cultivator';
import TabBar from '@/components/tab-bar';
import SectionTitle from '@/components/section-title';
import InkDivider from '@/components/ink-divider';
import ScrollCard from '@/components/scroll-card';
import Tag from '@/components/tag';
import './index.css';

type Item = Artifact | Consumable | Material;

const TAB_LABEL: Record<InventoryTab, string> = {
  artifacts: '法宝',
  materials: '材料',
  consumables: '丹药',
};

const SLOT_LABEL: Record<string, string> = {
  weapon: '武器',
  armor: '护甲',
  accessory: '饰物',
};

const MATERIAL_TYPE_LABEL: Record<string, string> = {
  herb: '灵草',
  ore: '矿石',
  monster: '妖物',
  tcdb: '天材地宝',
  aux: '辅料',
  gongfa_manual: '功法残卷',
  skill_manual: '神通残卷',
};

const EMPTY_PAGINATION: InventoryPagination = {
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 0,
  hasMore: false,
};

export default function InventoryPage() {
  const { cultivator, refresh } = usePlayer();
  const [activeTab, setActiveTab] = useState<InventoryTab>('artifacts');
  const [items, setItems] = useState<Item[]>([]);
  const [pagination, setPagination] = useState<InventoryPagination>(EMPTY_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingId, setPendingId] = useState<string | null>(null);

  const loadTab = useCallback(async (tab: InventoryTab, page: number) => {
    if (!cultivator?.id) return;
    setTabLoading(true);
    setError('');
    try {
      const result = await fetchInventory(tab, page);
      if (result.success && result.data) {
        setItems((result.data.items ?? []) as Item[]);
        setPagination(result.data.pagination ?? EMPTY_PAGINATION);
      } else {
        setError(result.error || '加载失败');
        setItems([]);
      }
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : '加载失败');
      setItems([]);
    } finally {
      setTabLoading(false);
      setLoading(false);
    }
  }, [cultivator?.id]);

  useEffect(() => {
    if (cultivator?.id) {
      setLoading(true);
      loadTab(activeTab, 1);
    } else if (!cultivator) {
      setLoading(false);
    }
  }, [cultivator?.id, activeTab]);

  const toast = (title: string, icon: 'success' | 'none' | 'error' = 'none') => {
    Taro.showToast({ title, icon });
  };

  const handleEquip = async (item: Artifact) => {
    if (!item.id) return;
    setPendingId(item.id);
    try {
      const result = await equipArtifact(item.id);
      if (result.success) {
        toast(item.isEquipped ? '已卸下' : '已装备', 'success');
        await refresh();
        await loadTab(activeTab, pagination.page);
      } else {
        toast(result.error || '操作失败');
      }
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : '操作失败');
    } finally {
      setPendingId(null);
    }
  };

  const handleConsume = async (item: Consumable) => {
    if (!item.id) return;
    setPendingId(item.id);
    try {
      const result = await consumeItem(item.id);
      if (result.success) {
        toast(result.data?.message || '已服用', 'success');
        await refresh();
        await loadTab(activeTab, pagination.page);
      } else {
        toast(result.error || '服用失败');
      }
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : '服用失败');
    } finally {
      setPendingId(null);
    }
  };

  const handleIdentify = async (item: Material) => {
    if (!item.id) return;
    setPendingId(item.id);
    try {
      const result = await identifyMaterial(item.id);
      if (result.success) {
        toast(`鉴定完成：${result.revealedItem?.name || '未知宝物'}`, 'success');
        await loadTab(activeTab, pagination.page);
      } else {
        toast(result.error || '鉴定失败');
      }
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : '鉴定失败');
    } finally {
      setPendingId(null);
    }
  };

  const handleDiscard = (item: Item) => {
    if (!item.id) return;
    Taro.showModal({
      title: '丢弃确认',
      content: `确定要丢弃 ${item.name} 吗？丢弃后将无法找回。`,
      confirmText: '丢弃',
      cancelText: '取消',
      confirmColor: '#9b2e22',
      success: async (res) => {
        if (!res.confirm || !item.id) return;
        setPendingId(item.id);
        try {
          const typeMap: Record<InventoryTab, 'artifact' | 'consumable' | 'material'> = {
            artifacts: 'artifact',
            materials: 'material',
            consumables: 'consumable',
          };
          const result = await discardItem(item.id, typeMap[activeTab]);
          if (result.success) {
            toast('已丢弃', 'success');
            await loadTab(activeTab, pagination.page);
          } else {
            toast(result.error || '丢弃失败');
          }
        } catch (err) {
          toast(err instanceof ApiRequestError ? err.message : '丢弃失败');
        } finally {
          setPendingId(null);
        }
      },
    });
  };

  const goPrev = () => {
    if (pagination.page <= 1 || tabLoading) return;
    loadTab(activeTab, pagination.page - 1);
  };

  const goNext = () => {
    if (pagination.page >= pagination.totalPages || tabLoading) return;
    loadTab(activeTab, pagination.page + 1);
  };

  const switchTab = (tab: string) => {
    if (tab === activeTab) return;
    setActiveTab(tab as InventoryTab);
  };

  if (loading) {
    return (
      <View className="page">
        <ScrollCard>
          <Text className="cardTitle">储物袋</Text>
          <Text className="cardBody">正在开启储物袋...</Text>
        </ScrollCard>
      </View>
    );
  }

  if (!cultivator) {
    return (
      <View className="page">
        <View className="hero">
          <Text className="eyebrow">储物袋</Text>
          <Text className="title">尚未入道</Text>
          <Text className="summary">请先创建角色。</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="page">
      <View className="hero">
        <Text className="eyebrow">储物袋</Text>
        <Text className="title">身外之物</Text>
        <Text className="summary">第 {pagination.page} / {Math.max(pagination.totalPages, 1)} 页 · 共 {pagination.total} 件</Text>
      </View>

      <InkDivider />

      <TabBar
        items={[
          { key: 'artifacts', label: '法宝' },
          { key: 'materials', label: '材料' },
          { key: 'consumables', label: '丹药' },
        ]}
        active={activeTab}
        onChange={switchTab}
      />

      {error && (
        <ScrollCard>
          <Text className="cardBody">{error}</Text>
        </ScrollCard>
      )}

      {tabLoading && (
        <ScrollCard>
          <Text className="cardBody">正在清点...</Text>
        </ScrollCard>
      )}

      {!tabLoading && items.length === 0 && !error && (
        <ScrollCard>
          <Text className="cardBody">囊中空空如也。</Text>
        </ScrollCard>
      )}

      {items.length > 0 && (
        <View className="item-list">
          {items.map((item) => (
            <ScrollCard key={item.id ?? item.name}>
              <View className="item-head">
                <Text className="item-name">{item.name}</Text>
                {'quality' in item && item.quality && (
                  <Tag>{item.quality}</Tag>
                )}
                {'rank' in item && item.rank && (
                  <Tag>{item.rank}</Tag>
                )}
              </View>
              <View className="item-meta">
                {activeTab === 'artifacts' && (
                  <>
                    <Text className="meta-text">
                      {SLOT_LABEL[(item as Artifact).slot] ?? (item as Artifact).slot}
                    </Text>
                    {(item as Artifact).element && (
                      <Text className="meta-text">{(item as Artifact).element}属性</Text>
                    )}
                    {(item as Artifact).isEquipped && (
                      <Tag variant="equipped">已装备</Tag>
                    )}
                  </>
                )}
                {activeTab === 'materials' && (
                  <>
                    <Text className="meta-text">
                      {MATERIAL_TYPE_LABEL[(item as Material).type] ?? (item as Material).type}
                    </Text>
                    <Text className="meta-text">×{(item as Material).quantity}</Text>
                  </>
                )}
                {activeTab === 'consumables' && (
                  <>
                    <Text className="meta-text">{(item as Consumable).type}</Text>
                    <Text className="meta-text">×{(item as Consumable).quantity}</Text>
                  </>
                )}
              </View>
              {item.description && (
                <Text className="item-desc">{item.description}</Text>
              )}
              <View className="item-actions">
                {activeTab === 'artifacts' && (
                  <Button
                    className="btn-small"
                    loading={pendingId === item.id}
                    disabled={pendingId === item.id}
                    onClick={() => handleEquip(item as Artifact)}
                  >
                    {(item as Artifact).isEquipped ? '卸下' : '装备'}
                  </Button>
                )}
                {activeTab === 'consumables' && (
                  <Button
                    className="btn-small"
                    loading={pendingId === item.id}
                    disabled={pendingId === item.id}
                    onClick={() => handleConsume(item as Consumable)}
                  >
                    服用
                  </Button>
                )}
                {activeTab === 'materials' && (item as Material).type === 'tcdb' && (
                  <Button
                    className="btn-small"
                    loading={pendingId === item.id}
                    disabled={pendingId === item.id}
                    onClick={() => handleIdentify(item as Material)}
                  >
                    鉴定
                  </Button>
                )}
                <Button
                  className="btn-small danger"
                  loading={pendingId === item.id}
                  disabled={pendingId === item.id}
                  onClick={() => handleDiscard(item)}
                >
                  丢弃
                </Button>
              </View>
            </ScrollCard>
          ))}
        </View>
      )}

      {pagination.totalPages > 1 && (
        <View className="pager">
          <Button className="btn-small" disabled={pagination.page <= 1 || tabLoading} onClick={goPrev}>
            上一页
          </Button>
          <Text className="pager-text">
            {pagination.page} / {pagination.totalPages}
          </Text>
          <Button
            className="btn-small"
            disabled={pagination.page >= pagination.totalPages || tabLoading}
            onClick={goNext}
          >
            下一页
          </Button>
        </View>
      )}
    </View>
  );
}
