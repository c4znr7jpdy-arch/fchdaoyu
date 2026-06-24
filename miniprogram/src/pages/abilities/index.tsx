import { useEffect, useState } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import {
  fetchProducts,
  equipProduct,
  deleteProduct,
  type ProductType,
  type ProductRecord,
} from '@/lib/client';
import { ApiRequestError } from '@/lib/client';
import { usePlayer } from '@/lib/player-context';
import TabBar from '@/components/tab-bar';
import SectionTitle from '@/components/section-title';
import InkDivider from '@/components/ink-divider';
import ScrollCard from '@/components/scroll-card';
import Tag from '@/components/tag';
import './index.css';

const TAB_LABEL: Record<ProductType, string> = {
  gongfa: '功法',
  skill: '神通',
  artifact: '法宝',
};

export default function AbilitiesPage() {
  const { cultivator, refresh } = usePlayer();
  const [activeTab, setActiveTab] = useState<ProductType>('gongfa');
  const [items, setItems] = useState<ProductRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadList = async (type: ProductType) => {
    if (!cultivator?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await fetchProducts(type);
      if (result.success) {
        setItems(result.data ?? []);
      } else {
        setError(result.error || '加载失败');
        setItems([]);
      }
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : '加载失败');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadList(activeTab);
  }, [activeTab, cultivator?.id]);

  const handleToggle = async (item: ProductRecord) => {
    if (!item.id) return;
    setPendingId(item.id);
    try {
      const result = await equipProduct(item.id);
      if (result.success) {
        Taro.showToast({
          title: result.equipped ? '已启用' : '已停用',
          icon: 'success',
        });
        await refresh();
        await loadList(activeTab);
      } else {
        Taro.showToast({ title: result.error || '操作失败', icon: 'none' });
      }
    } catch (err) {
      Taro.showToast({
        title: err instanceof ApiRequestError ? err.message : '操作失败',
        icon: 'none',
      });
    } finally {
      setPendingId(null);
    }
  };

  const handleForget = (item: ProductRecord) => {
    if (!item.id) return;
    Taro.showModal({
      title: `废除${TAB_LABEL[activeTab]}`,
      content: `确定要废除 ${item.name} 吗？此操作不可撤销。`,
      confirmText: '废除',
      cancelText: '留下',
      confirmColor: '#9b2e22',
      success: async (res) => {
        if (!res.confirm || !item.id) return;
        setPendingId(item.id);
        try {
          const result = await deleteProduct(item.id);
          if (result.success) {
            Taro.showToast({ title: '已废除', icon: 'success' });
            await refresh();
            await loadList(activeTab);
          } else {
            Taro.showToast({ title: result.error || '废除失败', icon: 'none' });
          }
        } catch (err) {
          Taro.showToast({
            title: err instanceof ApiRequestError ? err.message : '废除失败',
            icon: 'none',
          });
        } finally {
          setPendingId(null);
        }
      },
    });
  };

  const switchTab = (tab: string) => {
    if (tab === activeTab) return;
    setActiveTab(tab as ProductType);
  };

  if (loading && items.length === 0) {
    return (
      <View className="page">
        <ScrollCard>
          <Text className="cardTitle">{TAB_LABEL[activeTab]}卷</Text>
          <Text className="cardBody">卷轴徐徐展开...</Text>
        </ScrollCard>
      </View>
    );
  }

  if (!cultivator) {
    return (
      <View className="page">
        <View className="hero">
          <Text className="eyebrow">道基</Text>
          <Text className="title">尚未觉醒</Text>
          <Text className="summary">先去创建角色。</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="page">
      <View className="hero">
        <Text className="eyebrow">道基</Text>
        <Text className="title">{TAB_LABEL[activeTab]}卷</Text>
        <Text className="summary">参悟、启用、废除——皆在此处。</Text>
      </View>

      <InkDivider />

      <TabBar
        items={[
          { key: 'gongfa', label: '功法' },
          { key: 'skill', label: '神通' },
          { key: 'artifact', label: '法宝' },
        ]}
        active={activeTab}
        onChange={switchTab}
      />

      {error && (
        <ScrollCard>
          <Text className="cardBody">{error}</Text>
        </ScrollCard>
      )}

      {!loading && items.length === 0 && !error && (
        <ScrollCard>
          <Text className="cardBody">尚未参悟任何{TAB_LABEL[activeTab]}。</Text>
        </ScrollCard>
      )}

      {items.length > 0 && (
        <View className="item-list">
          {items.map((item) => (
            <ScrollCard key={item.id}>
              <View className="item-head">
                <Text className="item-name">{item.name}</Text>
                {item.quality && (
                  <Tag>{item.quality}</Tag>
                )}
                {item.element && (
                  <Tag>{item.element}</Tag>
                )}
                {item.isEquipped && (
                  <Tag variant="equipped">已启用</Tag>
                )}
              </View>
              {item.description && (
                <Text className="item-desc">{item.description}</Text>
              )}
              <View className="item-actions">
                <Button
                  className="btn-small"
                  loading={pendingId === item.id}
                  disabled={pendingId === item.id}
                  onClick={() => handleToggle(item)}
                >
                  {item.isEquipped ? '停用' : '启用'}
                </Button>
                <Button
                  className="btn-small danger"
                  loading={pendingId === item.id}
                  disabled={pendingId === item.id}
                  onClick={() => handleForget(item)}
                >
                  废除
                </Button>
              </View>
            </ScrollCard>
          ))}
        </View>
      )}
    </View>
  );
}
