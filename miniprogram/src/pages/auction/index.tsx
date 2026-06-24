import { useCallback, useEffect, useState } from 'react';
import { View, Text, Button, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import {
  fetchAuctionListings,
  buyAuctionItem,
  cancelAuctionListing,
  type AuctionListing,
} from '@/lib/client';
import { ApiRequestError } from '@/lib/client';
import { usePlayer } from '@/lib/player-context';
import SectionTitle from '@/components/section-title';
import InkDivider from '@/components/ink-divider';
import TabBar from '@/components/tab-bar';
import ScrollCard from '@/components/scroll-card';
import BreadButton from '@/components/bread-button';
import './index.css';

type TabKey = 'browse' | 'my';

const TAB_ITEMS = [
  { key: 'browse', label: '浏览' },
  { key: 'my', label: '我的挂单' },
];

export default function AuctionPage() {
  const { cultivator, refresh } = usePlayer();
  const [tab, setTab] = useState<TabKey>('browse');
  const [listings, setListings] = useState<AuctionListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [buyingId, setBuyingId] = useState<string | null>(null);

  // Filters
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const loadListings = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const result = await fetchAuctionListings({
        page: p,
        pageSize: 20,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
      });
      if (result.success && result.data) {
        setListings(result.data);
        setTotalPages(result.pagination?.totalPages ?? 1);
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
  }, [minPrice, maxPrice]);

  useEffect(() => {
    loadListings(page);
  }, [page, loadListings]);

  const handleBuy = async (listing: AuctionListing) => {
    setBuyingId(listing.id);
    try {
      const result = await buyAuctionItem(listing.id);
      if (result.success) {
        Taro.showToast({ title: '购买成功', icon: 'success' });
        await refresh();
        await loadListings(page);
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

  const handleCancel = async (listingId: string) => {
    try {
      const result = await cancelAuctionListing(listingId);
      if (result.success) {
        Taro.showToast({ title: '已下架', icon: 'success' });
        await loadListings(page);
      } else {
        Taro.showToast({ title: result.error || '下架失败', icon: 'none' });
      }
    } catch (err) {
      Taro.showToast({
        title: err instanceof ApiRequestError ? err.message : '下架失败',
        icon: 'none',
      });
    }
  };

  const myListings = listings.filter((l) => l.sellerName === cultivator?.name);

  return (
    <View className="page">
      <View className="hero">
        <SectionTitle>拍卖行</SectionTitle>
        <Text className="title">灵石余额：{cultivator?.spirit_stones ?? 0}</Text>
      </View>

      <TabBar
        items={TAB_ITEMS}
        active={tab}
        onChange={(key) => { setTab(key as TabKey); setPage(1); }}
      />

      {tab === 'browse' && (
        <View className="filter-row">
          <Input
            className="filter-input"
            type="number"
            value={minPrice}
            onInput={(e) => setMinPrice(e.detail.value)}
            placeholder="最低价"
          />
          <Text className="filter-sep">-</Text>
          <Input
            className="filter-input"
            type="number"
            value={maxPrice}
            onInput={(e) => setMaxPrice(e.detail.value)}
            placeholder="最高价"
          />
          <Button className="filter-btn" onClick={() => { setPage(1); loadListings(1); }}>
            筛选
          </Button>
        </View>
      )}

      {loading && (
        <ScrollCard>
          <Text>加载中...</Text>
        </ScrollCard>
      )}

      {!loading && (tab === 'browse' ? listings : myListings).length === 0 && (
        <ScrollCard>
          <Text>暂无挂单。</Text>
        </ScrollCard>
      )}

      {!loading && (tab === 'browse' ? listings : myListings).map((item) => (
        <ScrollCard key={item.id}>
          <View className="auction-card">
            <View className="auction-head">
              <Text className="auction-name">{item.name}</Text>
              {item.quality && <Text className="item-tag quality">{item.quality}</Text>}
              {item.rank && <Text className="item-tag quality">{item.rank}</Text>}
            </View>
            <View className="auction-meta">
              <Text className="auction-price">{item.price} 灵石</Text>
              <Text className="auction-seller">{item.sellerName} · {item.sellerRealm}</Text>
            </View>
            {item.element && <Text className="auction-element">{item.element}属性</Text>}
            <InkDivider />
            {tab === 'browse' ? (
              <Button
                className="btn-buy"
                loading={buyingId === item.id}
                disabled={buyingId === item.id || (cultivator?.spirit_stones ?? 0) < item.price}
                onClick={() => handleBuy(item)}
              >
                购买
              </Button>
            ) : (
              <BreadButton
                variant="ghost"
                onClick={() => handleCancel(item.id)}
              >
                下架
              </BreadButton>
            )}
          </View>
        </ScrollCard>
      ))}

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
