import { useCallback, useEffect, useState } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import {
  fetchMarketListings,
  buyMarketItem,
  sellPreview,
  sellConfirm,
  type MarketLayer,
  type MarketListing,
  type SellPreviewItem,
} from '@/lib/client';
import { ApiRequestError } from '@/lib/client';
import { usePlayer } from '@/lib/player-context';
import SectionTitle from '@/components/section-title';
import InkDivider from '@/components/ink-divider';
import TabBar from '@/components/tab-bar';
import ScrollCard from '@/components/scroll-card';
import BreadButton from '@/components/bread-button';
import './index.css';

type TabKey = 'buy' | 'sell';

const TAB_ITEMS = [
  { key: 'buy', label: '购买' },
  { key: 'sell', label: '出售' },
];

const LAYER_LABEL: Record<MarketLayer, string> = {
  common: '凡市',
  treasure: '珍宝阁',
  heaven: '天宝殿',
  black: '黑市',
};

const LAYERS: MarketLayer[] = ['common', 'treasure', 'heaven', 'black'];

export default function MarketPage() {
  const { cultivator, refresh } = usePlayer();
  const [tab, setTab] = useState<TabKey>('buy');
  const [layer, setLayer] = useState<MarketLayer>('common');
  const [listings, setListings] = useState<MarketListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<string | null>(null);

  // Sell state
  const [sellItems, setSellItems] = useState<SellPreviewItem[]>([]);
  const [sellSessionId, setSellSessionId] = useState('');
  const [sellTotal, setSellTotal] = useState(0);
  const [sellLoading, setSellLoading] = useState(false);
  const [sellAppraisal, setSellAppraisal] = useState<{ rating: string; comment: string } | null>(null);

  const loadListings = useCallback(async () => {
    if (!cultivator?.id) return;
    setLoading(true);
    try {
      const result = await fetchMarketListings(cultivator.id, layer);
      if (result.success && result.data) {
        setListings(result.data);
      } else {
        setListings([]);
      }
    } catch (err) {
      Taro.showToast({
        title: err instanceof ApiRequestError ? err.message : '加载失败',
        icon: 'none',
      });
    } finally {
      setLoading(false);
    }
  }, [cultivator?.id, layer]);

  useEffect(() => {
    if (tab === 'buy') loadListings();
  }, [tab, loadListings]);

  const handleBuy = async (listing: MarketListing) => {
    if (!cultivator?.id) return;
    setBuyingId(listing.id);
    try {
      const result = await buyMarketItem(cultivator.id, listing.id);
      if (result.success) {
        Taro.showToast({ title: '购买成功', icon: 'success' });
        await refresh();
        await loadListings();
      } else {
        Taro.showToast({ title: result.error || '购买失败', icon: 'none' });
      }
    } catch (err) {
      Taro.showToast({
        title: err instanceof ApiRequestError ? err.message : '购买失败',
        icon: 'none',
      });
    } finally {
      setBuyingId(null);
    }
  };

  const handleSellPreview = async (itemType: 'material' | 'artifact') => {
    setSellLoading(true);
    try {
      const result = await sellPreview(itemType);
      if (result.success && result.items) {
        setSellItems(result.items);
        setSellSessionId(result.sessionId ?? '');
        setSellTotal(result.totalSpiritStones ?? 0);
        setSellAppraisal(result.appraisal ?? null);
      } else {
        Taro.showToast({ title: result.error || '无可出售物品', icon: 'none' });
      }
    } catch (err) {
      Taro.showToast({
        title: err instanceof ApiRequestError ? err.message : '预览失败',
        icon: 'none',
      });
    } finally {
      setSellLoading(false);
    }
  };

  const handleSellConfirm = async () => {
    if (!sellSessionId) return;
    setSellLoading(true);
    try {
      const result = await sellConfirm(sellSessionId);
      if (result.success) {
        Taro.showToast({ title: `获得 ${result.gainedSpiritStones ?? 0} 灵石`, icon: 'success' });
        setSellItems([]);
        setSellSessionId('');
        setSellTotal(0);
        setSellAppraisal(null);
        await refresh();
      } else {
        Taro.showToast({ title: result.error || '出售失败', icon: 'none' });
      }
    } catch (err) {
      Taro.showToast({
        title: err instanceof ApiRequestError ? err.message : '出售失败',
        icon: 'none',
      });
    } finally {
      setSellLoading(false);
    }
  };

  if (!cultivator) {
    return (
      <View className="page">
        <View className="hero">
          <SectionTitle>坊市</SectionTitle>
          <Text className="title">尚未入道</Text>
          <Text className="summary">请先创建角色。</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="page">
      <View className="hero">
        <SectionTitle>坊市</SectionTitle>
        <Text className="title">灵石余额：{cultivator.spirit_stones ?? 0}</Text>
      </View>

      <TabBar
        items={TAB_ITEMS}
        active={tab}
        onChange={(key) => { setTab(key as TabKey); setSellItems([]); }}
      />

      {tab === 'buy' && (
        <>
          <View className="layer-tabs">
            {LAYERS.map((l) => (
              <View
                key={l}
                className={`layer-tab ${l === layer ? 'active' : ''}`}
                onClick={() => setLayer(l)}
              >
                <Text className="layer-text">{LAYER_LABEL[l]}</Text>
              </View>
            ))}
          </View>

          {loading && (
            <ScrollCard>
              <Text>加载中...</Text>
            </ScrollCard>
          )}

          {!loading && listings.length === 0 && (
            <ScrollCard>
              <Text>暂无商品。</Text>
            </ScrollCard>
          )}

          {!loading && listings.map((item) => (
            <ScrollCard key={item.id}>
              <View className="listing-card">
                <View className="listing-head">
                  <Text className="listing-name">
                    {item.isMystery ? item.mysteryMask?.disguisedName ?? '???' : item.name}
                  </Text>
                  {item.rank && <Text className="item-tag quality">{item.rank}</Text>}
                  {item.quality && <Text className="item-tag quality">{item.quality}</Text>}
                  {item.isMystery && <Text className="item-tag">?</Text>}
                </View>
                <View className="listing-meta">
                  <Text className="listing-price">{item.price} 灵石</Text>
                  <Text className="listing-stock">库存 {item.quantity}</Text>
                  {item.element && <Text className="listing-element">{item.element}</Text>}
                </View>
                <InkDivider />
                <Button
                  className="btn-buy"
                  loading={buyingId === item.id}
                  disabled={buyingId === item.id || (cultivator.spirit_stones ?? 0) < item.price}
                  onClick={() => handleBuy(item)}
                >
                  购买
                </Button>
              </View>
            </ScrollCard>
          ))}
        </>
      )}

      {tab === 'sell' && (
        <>
          {sellItems.length === 0 ? (
            <View className="sell-actions">
              <Button
                className="btn-sell-type"
                loading={sellLoading}
                disabled={sellLoading}
                onClick={() => handleSellPreview('material')}
              >
                材料回收
              </Button>
              <Button
                className="btn-sell-type"
                loading={sellLoading}
                disabled={sellLoading}
                onClick={() => handleSellPreview('artifact')}
              >
                法宝回收
              </Button>
            </View>
          ) : (
            <View className="sell-preview">
              {sellAppraisal && (
                <ScrollCard>
                  <View className="card appraisal">
                    <Text className="cardTitle">鉴评：{sellAppraisal.rating}</Text>
                    <Text className="cardBody">{sellAppraisal.comment}</Text>
                  </View>
                </ScrollCard>
              )}

              <ScrollCard>
                <View className="card">
                  <Text className="cardTitle">出售清单</Text>
                  {sellItems.map((item) => (
                    <View key={item.id} className="sell-item">
                      <Text className="sell-item-name">{item.name}</Text>
                      <Text className="sell-item-qty">×{item.quantity}</Text>
                      <Text className="sell-item-price">{item.totalPrice} 灵石</Text>
                    </View>
                  ))}
                  <Text className="sell-total">合计：{sellTotal} 灵石</Text>
                </View>
              </ScrollCard>

              <View className="sell-btns">
                <BreadButton
                  variant="ghost"
                  onClick={() => { setSellItems([]); setSellSessionId(''); }}
                >
                  取消
                </BreadButton>
                <Button
                  className="btn primary"
                  loading={sellLoading}
                  disabled={sellLoading || !sellSessionId}
                  onClick={handleSellConfirm}
                >
                  确认出售
                </Button>
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );
}
