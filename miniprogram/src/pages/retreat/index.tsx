import { useMemo, useState } from 'react';
import { View, Text, Button, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { performRetreat, type RetreatResultData } from '@/lib/client';
import { ApiRequestError } from '@/lib/client';
import { usePlayer } from '@/lib/player-context';
import SectionTitle from '@/components/section-title';
import InkDivider from '@/components/ink-divider';
import BreadButton from '@/components/bread-button';
import ScrollCard from '@/components/scroll-card';
import ProgressBar from '@/components/progress-bar';
import SceneBg from '@/components/scene-bg';
import inkLotus from '@/assets/ink-lotus.svg';
import './index.css';

export default function RetreatPage() {
  const { cultivator, refresh, loading } = usePlayer();
  const [years, setYears] = useState('10');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<RetreatResultData | null>(null);
  const [resultOpen, setResultOpen] = useState(false);

  const remainingLifespan = useMemo(() => {
    if (!cultivator) return 0;
    return Math.max(cultivator.lifespan - cultivator.age, 0);
  }, [cultivator]);

  const progress = cultivator?.cultivation_progress;
  const percent = progress && progress.exp_cap > 0
    ? Math.floor((progress.cultivation_exp / progress.exp_cap) * 100)
    : 0;
  const canBreakthrough = percent >= 60;

  const handleYearsChange = (value: string) => {
    const numeric = value.replace(/[^\d]/g, '');
    setYears(numeric);
  };

  const runRetreat = async (action: 'cultivate' | 'breakthrough') => {
    if (!cultivator) return;
    if (busy) return;

    if (action === 'cultivate') {
      const parsedYears = Number(years || '0');
      if (!Number.isFinite(parsedYears) || parsedYears < 1 || parsedYears > 200) {
        Taro.showToast({ title: '闭关年限需在 1~200 之间', icon: 'none' });
        return;
      }
      if (parsedYears > remainingLifespan) {
        Taro.showToast({ title: '寿元不足', icon: 'none' });
        return;
      }
    }

    setBusy(true);
    try {
      const outcome = await performRetreat(
        action,
        action === 'cultivate' ? Number(years) : undefined,
      );
      if (outcome.error && !outcome.result) {
        Taro.showToast({ title: outcome.error, icon: 'none' });
        return;
      }
      if (outcome.result) {
        setResult(outcome.result);
        setResultOpen(true);
        await refresh();
      } else if (outcome.error) {
        Taro.showToast({ title: outcome.error, icon: 'none' });
      }
    } catch (err) {
      Taro.showToast({
        title: err instanceof ApiRequestError ? err.message : '闭关失败',
        icon: 'none',
      });
    } finally {
      setBusy(false);
    }
  };

  const closeResult = () => {
    setResultOpen(false);
    setResult(null);
  };

  if (loading) {
    return (
      <View className="page">
        <SceneBg src={inkLotus} />
        <ScrollCard>
          <Text className="cardTitle">静室</Text>
          <Text className="cardBody">正在步入静室...</Text>
        </ScrollCard>
      </View>
    );
  }

  if (!cultivator) {
    return (
      <View className="page">
        <SceneBg src={inkLotus} />
        <View className="hero">
          <Text className="eyebrow">静室</Text>
          <Text className="title">尚未入道</Text>
          <Text className="summary">请先创建角色。</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="page">
      <SceneBg src={inkLotus} />
      <View className="hero">
        <Text className="eyebrow">静室</Text>
        <Text className="title">闭关修行</Text>
        <Text className="summary">
          {cultivator.realm} · {cultivator.realm_stage} · 寿元 {cultivator.age}/{cultivator.lifespan}
        </Text>
      </View>

      <InkDivider />

      <SectionTitle>修为进度</SectionTitle>
      {progress ? (
        <ScrollCard>
          <ProgressBar label={`${progress.cultivation_exp}/${progress.exp_cap}`} percent={percent} />
          <View className="progress-extra">
            <Text className="meta-text">感悟：{progress.comprehension_insight}</Text>
            {progress.bottleneck_state && (
              <Text className="meta-text warn">瓶颈期，突破更难</Text>
            )}
            {progress.inner_demon && (
              <Text className="meta-text warn">心魔缠身，走火入魔风险升高</Text>
            )}
          </View>
        </ScrollCard>
      ) : (
        <ScrollCard>
          <Text className="cardBody">暂无修为数据</Text>
        </ScrollCard>
      )}

      <InkDivider />

      <SectionTitle>闭关修炼</SectionTitle>
      <ScrollCard>
        <Text className="cardBody">消耗寿元积累修为，每 10 年为一旬。</Text>
        <View className="years-input">
          <Text className="input-label">年限</Text>
          <Input
            className="years-field"
            type="number"
            value={years}
            onInput={(e) => handleYearsChange(e.detail.value)}
            placeholder="1~200"
          />
        </View>
        <Button
          className="btn primary"
          loading={busy}
          disabled={busy}
          onClick={() => runRetreat('cultivate')}
        >
          入定闭关
        </Button>
      </ScrollCard>

      <InkDivider />

      <SectionTitle>突破境界</SectionTitle>
      <ScrollCard>
        <Text className="cardBody">
          {canBreakthrough
            ? '修为已足，可尝试冲关。'
            : '修为不足六成，暂不可突破。'}
        </Text>
        <Button
          className="btn primary"
          loading={busy}
          disabled={busy || !canBreakthrough}
          onClick={() => runRetreat('breakthrough')}
        >
          冲关突破
        </Button>
      </ScrollCard>

      {resultOpen && result && (
        <View className="modal-mask" onClick={closeResult}>
          <View className="modal" onClick={(e) => e.stopPropagation()}>
            <Text className="modal-title">
              {result.action === 'breakthrough' ? '突破结果' : '闭关结果'}
            </Text>
            {result.action === 'breakthrough' && result.summary.success != null && (
              <Text className={`modal-headline ${result.summary.success ? 'success' : 'fail'}`}>
                {result.summary.success ? '突破成功' : '突破失败'}
              </Text>
            )}
            {result.action === 'breakthrough' && result.summary.fromRealm && (
              <Text className="modal-line">
                {result.summary.fromRealm} {result.summary.fromStage} → {result.summary.toRealm} {result.summary.toStage}
              </Text>
            )}
            {result.summary.lifespanGained ? (
              <Text className="modal-line">寿元 +{result.summary.lifespanGained}</Text>
            ) : null}
            {result.story && (
              <ScrollCard>
                <Text className="story-text">{result.story}</Text>
              </ScrollCard>
            )}
            {result.depleted && (
              <Text className="modal-line warn">寿元已尽，请尽快处理转世。</Text>
            )}
            <BreadButton onClick={closeResult}>
              知道了
            </BreadButton>
          </View>
        </View>
      )}
    </View>
  );
}
