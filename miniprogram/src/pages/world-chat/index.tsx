import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Button, Input, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import {
  fetchWorldChatMessages,
  sendWorldChatMessage,
  type WorldChatMessage,
} from '@/lib/client';
import { ApiRequestError } from '@/lib/client';
import { usePlayer } from '@/lib/player-context';
import SectionTitle from '@/components/section-title';
import InkDivider from '@/components/ink-divider';
import './index.css';

const POLL_INTERVAL = 8000;

export default function WorldChatPage() {
  const { cultivator } = usePlayer();
  const [messages, setMessages] = useState<WorldChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollRef = useRef<number>(0);

  const loadMessages = useCallback(async () => {
    try {
      const result = await fetchWorldChatMessages(30);
      if (result.success && result.data) {
        setMessages(result.data);
      }
    } catch { /* ignore polling errors */ }
  }, []);

  useEffect(() => {
    loadMessages().then(() => setLoading(false));
    timerRef.current = setInterval(loadMessages, POLL_INTERVAL);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loadMessages]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending || cooldown > 0) return;

    setSending(true);
    try {
      const result = await sendWorldChatMessage(text);
      if (result.success) {
        setInput('');
        await loadMessages();
      } else {
        if (result.remainingSeconds) {
          setCooldown(result.remainingSeconds);
        }
        Taro.showToast({ title: result.error || '发送失败', icon: 'none' });
      }
    } catch (err) {
      const msg = err instanceof ApiRequestError ? err.message : '发送失败';
      Taro.showToast({ title: msg, icon: 'none' });
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  if (!cultivator) {
    return (
      <View className="page">
        <View className="hero">
          <SectionTitle>世界</SectionTitle>
          <Text className="title">尚未入道</Text>
          <Text className="summary">请先创建角色。</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="page">
      <View className="chat-header">
        <SectionTitle>世界频道</SectionTitle>
        <Text className="chat-hint">每 60 秒可发言一次</Text>
      </View>

      <InkDivider />

      <ScrollView
        scrollY
        className="chat-messages"
        scrollIntoView={`msg-${messages.length - 1}`}
      >
        {loading && (
          <View className="chat-loading">
            <Text className="chat-loading-text">加载中...</Text>
          </View>
        )}
        {!loading && messages.length === 0 && (
          <View className="chat-loading">
            <Text className="chat-loading-text">暂无消息，来说点什么吧。</Text>
          </View>
        )}
        {messages.map((msg, i) => {
          const isMe = msg.senderCultivatorId === cultivator?.id;
          return (
            <View key={msg.id ?? i} className={`chat-msg ${isMe ? 'me' : ''}`}>
              <View className="msg-header">
                <Text className="msg-name">{msg.senderName}</Text>
                <Text className="msg-realm">{msg.senderRealm}</Text>
                <Text className="msg-time">{formatTime(msg.createdAt)}</Text>
              </View>
              {msg.messageType === 'text' ? (
                <Text className="msg-text">{msg.textContent}</Text>
              ) : (
                <View className="msg-showcase">
                  <Text className="msg-showcase-label">展示了一件物品</Text>
                  {msg.textContent && <Text className="msg-text">{msg.textContent}</Text>}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      <InkDivider />

      <View className="chat-input-bar">
        <Input
          className="chat-input"
          value={input}
          onInput={(e) => setInput(e.detail.value)}
          placeholder="说点什么..."
          maxlength={100}
          disabled={cooldown > 0}
        />
        <Button
          className="chat-send-btn"
          loading={sending}
          disabled={sending || !input.trim() || cooldown > 0}
          onClick={handleSend}
        >
          {cooldown > 0 ? `${cooldown}s` : '发送'}
        </Button>
      </View>
    </View>
  );
}
