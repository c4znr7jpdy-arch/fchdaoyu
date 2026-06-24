import { useCallback, useEffect, useState } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import {
  fetchMails,
  claimMail,
  claimAllMails,
  readMail,
  readAllMails,
  type MailRecord,
} from '@/lib/client';
import { ApiRequestError } from '@/lib/client';
import { usePlayer } from '@/lib/player-context';
import SectionTitle from '@/components/section-title';
import InkDivider from '@/components/ink-divider';
import ScrollCard from '@/components/scroll-card';
import Badge from '@/components/badge';
import BreadButton from '@/components/bread-button';
import './index.css';

const ATTACH_LABEL: Record<string, string> = {
  spirit_stones: '灵石',
  material: '材料',
  consumable: '丹药',
  artifact: '法宝',
  cultivation_exp: '修为',
  comprehension_insight: '悟性',
};

export default function MailPage() {
  const { cultivator, refresh } = usePlayer();
  const [mails, setMails] = useState<MailRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedMail, setSelectedMail] = useState<MailRecord | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const loadMails = useCallback(async (p: number) => {
    if (!cultivator?.id) return;
    setLoading(true);
    try {
      const result = await fetchMails(p);
      if (result.success && result.mails) {
        setMails(result.mails);
        setHasMore(result.pagination?.hasMore ?? false);
      } else {
        setMails([]);
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
    if (cultivator?.id) loadMails(page);
  }, [cultivator?.id, page]);

  const handleRead = async (mail: MailRecord) => {
    setSelectedMail(mail);
    if (!mail.isRead) {
      try {
        await readMail(mail.id);
        setMails((prev) => prev.map((m) => m.id === mail.id ? { ...m, isRead: true } : m));
      } catch { /* ignore */ }
    }
  };

  const handleClaim = async (mailId: string) => {
    setClaimingId(mailId);
    try {
      const result = await claimMail(mailId);
      if (result.success) {
        Taro.showToast({ title: '领取成功', icon: 'success' });
        setMails((prev) => prev.map((m) => m.id === mailId ? { ...m, isClaimed: true } : m));
        if (selectedMail?.id === mailId) {
          setSelectedMail((prev) => prev ? { ...prev, isClaimed: true } : prev);
        }
        await refresh();
      } else {
        Taro.showToast({ title: result.error || '领取失败', icon: 'none' });
      }
    } catch (err) {
      Taro.showToast({
        title: err instanceof ApiRequestError ? err.message : '领取失败',
        icon: 'none',
      });
    } finally {
      setClaimingId(null);
    }
  };

  const handleClaimAll = async () => {
    try {
      const result = await claimAllMails();
      if (result.success) {
        Taro.showToast({ title: `领取了 ${result.totalClaimed ?? 0} 封邮件`, icon: 'success' });
        await loadMails(page);
        await refresh();
      } else {
        Taro.showToast({ title: result.error || '批量领取失败', icon: 'none' });
      }
    } catch (err) {
      Taro.showToast({
        title: err instanceof ApiRequestError ? err.message : '批量领取失败',
        icon: 'none',
      });
    }
  };

  const handleReadAll = async () => {
    try {
      await readAllMails();
      setMails((prev) => prev.map((m) => ({ ...m, isRead: true })));
      Taro.showToast({ title: '全部已读', icon: 'success' });
    } catch { /* ignore */ }
  };

  if (!cultivator) {
    return (
      <View className="page">
        <View className="hero">
          <SectionTitle>传音玉简</SectionTitle>
          <Text className="title">尚未入道</Text>
          <Text className="summary">请先创建角色。</Text>
        </View>
      </View>
    );
  }

  if (selectedMail) {
    return (
      <View className="page">
        <View className="hero">
          <SectionTitle>传音玉简</SectionTitle>
          <Text className="title">{selectedMail.title}</Text>
        </View>

        <InkDivider />

        <ScrollCard>
          <View className="card">
            <Text className="mail-content">{selectedMail.content}</Text>
          </View>
        </ScrollCard>

        {selectedMail.attachments && selectedMail.attachments.length > 0 && (
          <ScrollCard>
            <View className="card">
              <Text className="cardTitle">附件</Text>
              {selectedMail.attachments.map((att, i) => (
                <View key={i} className="attach-item">
                  <Text className="attach-name">{att.name}</Text>
                  <Text className="attach-type">{ATTACH_LABEL[att.type] ?? att.type}</Text>
                  <Text className="attach-qty">×{att.quantity}</Text>
                </View>
              ))}
              {!selectedMail.isClaimed && (
                <Button
                  className="btn primary"
                  loading={claimingId === selectedMail.id}
                  disabled={claimingId === selectedMail.id}
                  onClick={() => handleClaim(selectedMail.id)}
                >
                  领取附件
                </Button>
              )}
              {selectedMail.isClaimed && (
                <Text className="claimed-text">已领取</Text>
              )}
            </View>
          </ScrollCard>
        )}

        <BreadButton variant="ghost" onClick={() => setSelectedMail(null)}>
          返回列表
        </BreadButton>
      </View>
    );
  }

  return (
    <View className="page">
      <View className="hero">
        <SectionTitle>传音玉简</SectionTitle>
        <Text className="title">邮件</Text>
      </View>

      <View className="action-row">
        <Button className="btn-small" onClick={handleReadAll}>全部已读</Button>
        <Button className="btn-small primary" onClick={handleClaimAll}>一键领取</Button>
      </View>

      {loading && (
        <ScrollCard>
          <Text>加载中...</Text>
        </ScrollCard>
      )}

      {!loading && mails.length === 0 && (
        <ScrollCard>
          <Text>暂无邮件。</Text>
        </ScrollCard>
      )}

      {!loading && mails.map((mail) => (
        <ScrollCard key={mail.id}>
          <View
            className={`mail-card ${!mail.isRead ? 'unread' : ''}`}
            onClick={() => handleRead(mail)}
          >
            <View className="mail-head">
              {!mail.isRead && <Badge />}
              <Text className="mail-title">{mail.title}</Text>
              {mail.attachments && mail.attachments.length > 0 && !mail.isClaimed && (
                <Badge />
              )}
            </View>
            <Text className="mail-preview">
              {mail.content?.substring(0, 60)}{mail.content && mail.content.length > 60 ? '...' : ''}
            </Text>
            {mail.createdAt && (
              <Text className="mail-time">
                {new Date(mail.createdAt).toLocaleDateString('zh-CN')}
              </Text>
            )}
          </View>
        </ScrollCard>
      ))}

      {hasMore && (
        <View className="pager">
          <Button
            className="btn-small"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            上一页
          </Button>
          <Text className="pager-text">第 {page} 页</Text>
          <Button
            className="btn-small"
            disabled={loading}
            onClick={() => setPage((p) => p + 1)}
          >
            下一页
          </Button>
        </View>
      )}
    </View>
  );
}
