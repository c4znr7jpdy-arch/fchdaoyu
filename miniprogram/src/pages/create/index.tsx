import { useState } from 'react';
import { View, Text, Textarea, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { getGenerationQuota, generateCharacter, generateFates, saveCharacter } from '@/lib/client';
import type { Cultivator } from '@shared/types/cultivator';
import type { PreHeavenFate } from '@shared/types/cultivator';
import SectionTitle from '@/components/section-title';
import InkDivider from '@/components/ink-divider';
import BreadButton from '@/components/bread-button';
import ScrollCard from '@/components/scroll-card';
import './index.css';

type Step = 'input' | 'generating' | 'generating-fates' | 'preview' | 'fates' | 'saving' | 'done';

export default function CreatePage() {
  const [step, setStep] = useState<Step>('input');
  const [prompt, setPrompt] = useState('');
  const [cultivator, setCultivator] = useState<Cultivator | null>(null);
  const [tempId, setTempId] = useState('');
  const [fates, setFates] = useState<PreHeavenFate[]>([]);
  const [selectedFates, setSelectedFates] = useState<number[]>([]);
  const [remainingRerolls, setRemainingRerolls] = useState(0);
  const [quota, setQuota] = useState<{ remaining: number; limit: number } | null>(null);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      Taro.showToast({ title: '请输入角色描述', icon: 'none' });
      return;
    }

    setStep('generating');
    setError('');

    try {
      const result = await generateCharacter(prompt.trim());
      if (result.success && result.data) {
        setCultivator(result.data.cultivator);
        setTempId(result.data.tempCultivatorId);
        setQuota(result.data.quota);
        setStep('preview');
      } else {
        setError(result.error || '生成失败');
        setStep('input');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败，请重试');
      setStep('input');
    }
  };

  const handleGenerateFates = async () => {
    if (!tempId) return;

    setStep('generating-fates');

    try {
      const result = await generateFates(tempId);
      if (result.success && result.data) {
        setFates(result.data.fates as PreHeavenFate[]);
        setRemainingRerolls(result.data.remainingRerolls);
        setSelectedFates([]);
        setStep('fates');
      } else {
        setStep('preview');
        Taro.showToast({ title: '生成命格失败', icon: 'none' });
      }
    } catch (err) {
      setStep('preview');
      Taro.showToast({ title: '生成命格失败', icon: 'none' });
    }
  };

  const handleToggleFate = (index: number) => {
    setSelectedFates((prev) => {
      if (prev.includes(index)) {
        return prev.filter((i) => i !== index);
      }
      if (prev.length >= 3) {
        Taro.showToast({ title: '最多选择 3 个命格', icon: 'none' });
        return prev;
      }
      return [...prev, index];
    });
  };

  const handleSave = async () => {
    if (selectedFates.length !== 3) {
      Taro.showToast({ title: '请选择 3 个先天命格', icon: 'none' });
      return;
    }

    setStep('saving');

    try {
      const result = await saveCharacter(tempId, selectedFates);
      if (result.success) {
        setStep('done');
        Taro.showToast({ title: '角色创建成功', icon: 'success' });
        setTimeout(() => {
          Taro.switchTab({ url: '/pages/cave/index' });
        }, 1500);
      } else {
        setError(result.error || '保存失败');
        setStep('fates');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
      setStep('fates');
    }
  };

  return (
    <View className="page">
      <View className="hero">
        <Text className="eyebrow">凝气篇</Text>
        <Text className="title">入道</Text>
      </View>

      <InkDivider />

      {step === 'input' && (
        <ScrollCard>
          <SectionTitle>描述你的角色</SectionTitle>
          <Text className="summary">用几句话描述你想要的角色，AI 将为你创造独特的修仙者。</Text>
          <Textarea
            className="input"
            value={prompt}
            onInput={(e) => setPrompt(e.detail.value)}
            placeholder="例如：一个来自山村的少年，性格坚韧，擅长剑法..."
            maxlength={500}
          />
          {quota && (
            <Text className="endpoint">今日剩余生成次数：{quota.remaining}/{quota.limit}</Text>
          )}
          <BreadButton variant="primary" onClick={handleGenerate}>
            开始生成
          </BreadButton>
        </ScrollCard>
      )}

      {step === 'generating' && (
        <View className="card status checking">
          <SectionTitle>道韵凝聚中</SectionTitle>
          <Text className="cardBody">天道正在为你塑造根骨...</Text>
        </View>
      )}

      {step === 'generating-fates' && (
        <View className="card status checking">
          <SectionTitle>推演天命</SectionTitle>
          <Text className="cardBody">先天命格正在凝聚...</Text>
        </View>
      )}

      {step === 'preview' && cultivator && (
        <ScrollCard>
          <SectionTitle>角色预览</SectionTitle>
          <View className="info-grid">
            <Text className="info-label">姓名</Text>
            <Text className="info-value">{cultivator.name}</Text>
            <Text className="info-label">境界</Text>
            <Text className="info-value">{cultivator.realm} {cultivator.realm_stage}</Text>
            <Text className="info-label">灵根</Text>
            <Text className="info-value">
              {(cultivator as any).spiritualRoots?.map((r: any) => `${r.element}(${r.strength})`).join('、') || '未知'}
            </Text>
          </View>
          {cultivator.background && (
            <Text className="summary">{cultivator.background}</Text>
          )}
          <BreadButton variant="primary" onClick={handleGenerateFates}>
            抽取先天命格
          </BreadButton>
        </ScrollCard>
      )}

      {step === 'fates' && (
        <ScrollCard>
          <SectionTitle>选择 3 个先天命格</SectionTitle>
          <Text className="summary">已选 {selectedFates.length}/3</Text>
          {fates.map((fate, index) => (
            <View
              key={index}
              className={`fate-card ${selectedFates.includes(index) ? 'selected' : ''}`}
              onClick={() => handleToggleFate(index)}
            >
              <Text className="fate-name">{fate.name}</Text>
              <Text className="fate-quality">{fate.quality}</Text>
              {fate.description && <Text className="fate-desc">{fate.description}</Text>}
            </View>
          ))}
          <BreadButton variant="primary" onClick={handleSave}>
            确认创建
          </BreadButton>
        </ScrollCard>
      )}

      {step === 'saving' && (
        <View className="card status checking">
          <SectionTitle>录入天命</SectionTitle>
          <Text className="cardBody">正在将你的道途铭刻于天道...</Text>
        </View>
      )}

      {step === 'done' && (
        <View className="card status ok">
          <SectionTitle>入道成功</SectionTitle>
          <Text className="cardBody">你的修仙之旅正式开启。</Text>
        </View>
      )}

      {error && (
        <View className="card status error">
          <Text className="cardBody">{error}</Text>
        </View>
      )}
    </View>
  );
}
