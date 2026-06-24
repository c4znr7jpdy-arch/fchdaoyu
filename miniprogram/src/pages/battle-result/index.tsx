import { useEffect, useState } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import {
  fetchBattleRecordDetail,
  type BattleRecordV2Detail,
} from '@/lib/client';
import { ApiRequestError } from '@/lib/client';
import { usePlayer } from '@/lib/player-context';
import SectionTitle from '@/components/section-title';
import InkDivider from '@/components/ink-divider';
import ScrollCard from '@/components/scroll-card';
import SceneBg from '@/components/scene-bg';
import inkMountainBattle from '@/assets/ink-mountain-battle.png';
import './index.css';

export default function BattleResultPage() {
  const router = useRouter();
  const { cultivator } = usePlayer();
  const [detail, setDetail] = useState<BattleRecordV2Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const id = router.params.id;

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchBattleRecordDetail(id)
      .then((res) => {
        if (res.success && res.data) {
          setDetail(res.data);
        } else {
          setError(res.error || '加载失败');
        }
      })
      .catch((err) => {
        setError(err instanceof ApiRequestError ? err.message : '加载失败');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <View className="page">
        <SceneBg src={inkMountainBattle} />
        <ScrollCard>
          <View className="card status checking">
            <Text>加载战斗记录...</Text>
          </View>
        </ScrollCard>
      </View>
    );
  }

  if (error || !detail) {
    return (
      <View className="page">
        <SceneBg src={inkMountainBattle} />
        <ScrollCard>
          <View className="card status error">
            <Text>{error || '未找到记录'}</Text>
          </View>
        </ScrollCard>
      </View>
    );
  }

  const br = detail.battleResult;
  const isWinner = br.winner?.id === cultivator?.id;
  const myChar = isWinner ? br.winner : br.loser;
  const enemy = isWinner ? br.loser : br.winner;

  return (
    <View className="page">
      <SceneBg src={inkMountainBattle} />
      <View className="hero">
        <SectionTitle>战纪</SectionTitle>
        <Text className={`title ${isWinner ? 'result-win' : 'result-lose'}`}>
          {isWinner ? '大获全胜' : '惜败而归'}
        </Text>
        <Text className="summary">{br.turns} 回合</Text>
      </View>

      <InkDivider />

      <View className="versus">
        <View className="fighter">
          <Text className="fighter-name">{myChar?.name}</Text>
          <Text className="fighter-realm">{myChar?.realm} {myChar?.realm_stage}</Text>
        </View>
        <Text className="vs-text">VS</Text>
        <View className="fighter">
          <Text className="fighter-name">{enemy?.name}</Text>
          <Text className="fighter-realm">{enemy?.realm} {enemy?.realm_stage}</Text>
        </View>
      </View>

      {br.logs && br.logs.length > 0 && (
        <ScrollCard>
          <View className="card">
            <Text className="cardTitle">战斗日志</Text>
            <ScrollView scrollY className="log-scroll">
              {br.logs.map((line, i) => (
                <Text key={i} className="log-line">{line}</Text>
              ))}
            </ScrollView>
          </View>
        </ScrollCard>
      )}

      {detail.battleReport && (
        <ScrollCard>
          <View className="card">
            <Text className="cardTitle">战报</Text>
            <Text className="cardBody report-text">{detail.battleReport}</Text>
          </View>
        </ScrollCard>
      )}

      <InkDivider />

      <View className="actions">
        <Button
          className="btn primary"
          onClick={() => Taro.navigateBack()}
        >
          返回
        </Button>
      </View>
    </View>
  );
}
