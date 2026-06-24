import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, Button, Input, Textarea } from '@tarojs/components';
import Taro from '@tarojs/taro';
import {
  fetchInventory,
  fetchCraftPreview,
  submitCraft,
  type CraftType,
  type CraftPreviewData,
  type CraftResultData,
} from '@/lib/client';
import { ApiRequestError } from '@/lib/client';
import { usePlayer } from '@/lib/player-context';
import type { Material } from '@shared/types/cultivator';
import SectionTitle from '@/components/section-title';
import InkDivider from '@/components/ink-divider';
import ScrollCard from '@/components/scroll-card';
import SceneBg from '@/components/scene-bg';
import inkSmokeAlchemy from '@/assets/ink-smoke-alchemy.svg';
import './index.css';

const ALCHEMY_TYPES = ['herb', 'ore', 'monster', 'tcdb', 'aux'];
const REFINE_TYPES = ['ore', 'monster', 'tcdb', 'aux'];
const MAX_MATERIALS = 5;

const MATERIAL_TYPE_LABEL: Record<string, string> = {
  herb: '灵草',
  ore: '矿石',
  monster: '妖物',
  tcdb: '天材地宝',
  aux: '辅料',
  gongfa_manual: '功法残卷',
  skill_manual: '神通残卷',
};

interface CraftPageProps {
  craftType: CraftType;
  title: string;
  eyebrow: string;
  promptLabel: string;
  promptPlaceholder: string;
}

export default function CraftPage({
  craftType,
  title,
  eyebrow,
  promptLabel,
  promptPlaceholder,
}: CraftPageProps) {
  const { cultivator, refresh } = usePlayer();
  const allowedTypes = craftType === 'alchemy' ? ALCHEMY_TYPES : REFINE_TYPES;

  const [materials, setMaterials] = useState<Material[]>([]);
  const [loadingMats, setLoadingMats] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [doseMap, setDoseMap] = useState<Record<string, number>>({});
  const [prompt, setPrompt] = useState('');
  const [preview, setPreview] = useState<CraftPreviewData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CraftResultData | null>(null);
  const [resultOpen, setResultOpen] = useState(false);

  const loadMaterials = useCallback(async () => {
    if (!cultivator?.id) {
      setLoadingMats(false);
      return;
    }
    setLoadingMats(true);
    try {
      const result = await fetchInventory('materials', 1, 100);
      if (result.success && result.data) {
        const all = (result.data.items ?? []) as Material[];
        const filtered = all.filter((m) => allowedTypes.includes(m.type));
        setMaterials(filtered);
      }
    } catch (err) {
      Taro.showToast({
        title: err instanceof ApiRequestError ? err.message : '材料加载失败',
        icon: 'none',
      });
    } finally {
      setLoadingMats(false);
    }
  }, [cultivator?.id, craftType]);

  useEffect(() => {
    loadMaterials();
  }, [loadMaterials]);

  const selectedKey = useMemo(
    () => selectedIds.map((id) => `${id}:${doseMap[id] ?? 1}`).join('|'),
    [selectedIds, doseMap],
  );

  useEffect(() => {
    if (selectedIds.length === 0) {
      setPreview(null);
      return;
    }
    let cancelled = false;
    const run = async () => {
      setPreviewLoading(true);
      try {
        const res = await fetchCraftPreview(craftType, selectedIds);
        if (!cancelled) {
          if (res.success && res.data) {
            setPreview(res.data);
          } else {
            setPreview(null);
          }
        }
      } catch {
        if (!cancelled) setPreview(null);
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [selectedKey, craftType]);

  const toggleMaterial = (mat: Material) => {
    if (!mat.id) return;
    const id = mat.id;
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        setDoseMap((m) => {
          const next = { ...m };
          delete next[id];
          return next;
        });
        return prev.filter((x) => x !== id);
      }
      if (prev.length >= MAX_MATERIALS) {
        Taro.showToast({ title: `最多投入 ${MAX_MATERIALS} 种灵材`, icon: 'none' });
        return prev;
      }
      setDoseMap((m) => ({ ...m, [id]: 1 }));
      return [...prev, id];
    });
  };

  const changeDose = (id: string, dose: number) => {
    const mat = materials.find((m) => m.id === id);
    if (!mat) return;
    const stock = mat.quantity ?? 0;
    const clamped = Math.min(Math.max(stock, 1), Math.max(1, Math.floor(dose)));
    setDoseMap((prev) => ({ ...prev, [id]: clamped }));
  };

  const reset = () => {
    setSelectedIds([]);
    setDoseMap({});
    setPrompt('');
    setPreview(null);
  };

  const handleSubmit = async () => {
    if (!cultivator) {
      Taro.showToast({ title: '请先创建角色', icon: 'none' });
      return;
    }
    if (selectedIds.length === 0) {
      Taro.showToast({ title: '丹炉已备，只欠灵材', icon: 'none' });
      return;
    }
    if (!prompt.trim()) {
      Taro.showToast({ title: '请先注入意图', icon: 'none' });
      return;
    }
    if (preview && !preview.canAfford) {
      Taro.showToast({ title: '灵石不足', icon: 'none' });
      return;
    }
    if (preview?.validation?.valid === false) {
      Taro.showToast({
        title: preview.validation.blockingReason || '炉况未稳',
        icon: 'none',
      });
      return;
    }

    setSubmitting(true);
    try {
      const quantities: Record<string, number> = {};
      selectedIds.forEach((id) => {
        quantities[id] = doseMap[id] ?? 1;
      });
      const res = await submitCraft({
        craftType,
        materialIds: selectedIds,
        materialQuantities: quantities,
        userPrompt: prompt.trim(),
        alchemyMode: craftType === 'alchemy' ? 'improvised' : undefined,
      });
      if (res.success && res.data) {
        setResult(res.data);
        setResultOpen(true);
        Taro.showToast({ title: '功成', icon: 'success' });
        await refresh();
        await loadMaterials();
        reset();
      } else {
        Taro.showToast({ title: res.error || '炼制失败', icon: 'none' });
      }
    } catch (err) {
      Taro.showToast({
        title: err instanceof ApiRequestError ? err.message : '炼制失败',
        icon: 'none',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const closeResult = () => {
    setResultOpen(false);
    setResult(null);
  };

  if (loadingMats && materials.length === 0) {
    return (
      <View className="page">
        <SceneBg src={inkSmokeAlchemy} />
        <View className="card status checking">
          <SectionTitle>{title}</SectionTitle>
          <Text className="cardBody">正在清点灵材...</Text>
        </View>
      </View>
    );
  }

  if (!cultivator) {
    return (
      <View className="page">
        <SceneBg src={inkSmokeAlchemy} />
        <View className="hero">
          <Text className="eyebrow">{eyebrow}</Text>
          <Text className="title">尚未入道</Text>
          <Text className="summary">请先创建角色。</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="page">
      <SceneBg src={inkSmokeAlchemy} />
      <View className="hero">
        <Text className="eyebrow">{eyebrow}</Text>
        <Text className="title">{title}</Text>
        <Text className="summary">灵石余额：{cultivator.spirit_stones ?? 0}</Text>
      </View>

      <InkDivider />

      <ScrollCard>
        <SectionTitle>炉材投入 ({selectedIds.length}/{MAX_MATERIALS})</SectionTitle>
        {materials.length === 0 ? (
          <Text className="cardBody">储物袋中暂无可用灵材。</Text>
        ) : (
          <View className="mat-list">
            {materials.map((mat) => {
              const selected = selectedIds.includes(mat.id ?? '');
              return (
                <View
                  key={mat.id}
                  className={`mat-item ${selected ? 'selected' : ''}`}
                  onClick={() => toggleMaterial(mat)}
                >
                  <View className="mat-head">
                    <Text className="mat-name">{mat.name}</Text>
                    {mat.rank && <Text className="item-tag quality">{mat.rank}</Text>}
                    <Text className="item-tag">{MATERIAL_TYPE_LABEL[mat.type] ?? mat.type}</Text>
                    <Text className="mat-stock">×{mat.quantity}</Text>
                  </View>
                  {mat.description && (
                    <Text className="mat-desc">{mat.description}</Text>
                  )}
                  {selected && (
                    <View className="dose-row" onClick={(e) => e.stopPropagation()}>
                      <Text className="dose-label">投入</Text>
                      <Button
                        className="dose-btn"
                        onClick={() => changeDose(mat.id!, (doseMap[mat.id!] ?? 1) - 1)}
                      >
                        -
                      </Button>
                      <Text className="dose-value">{doseMap[mat.id!] ?? 1}</Text>
                      <Button
                        className="dose-btn"
                        onClick={() => changeDose(mat.id!, (doseMap[mat.id!] ?? 1) + 1)}
                      >
                        +
                      </Button>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollCard>

      <InkDivider />

      <ScrollCard>
        <SectionTitle>{promptLabel}</SectionTitle>
        <Textarea
          className="prompt-input"
          value={prompt}
          onInput={(e) => setPrompt(e.detail.value)}
          placeholder={promptPlaceholder}
          maxlength={200}
        />
      </ScrollCard>

      <InkDivider />

      <ScrollCard>
        <SectionTitle>炉况</SectionTitle>
        {previewLoading ? (
          <Text className="cardBody">炉意推演中...</Text>
        ) : preview ? (
          <View className="preview-block">
            <Text className="preview-line">
              预计灵石：{preview.cost.spiritStones} 枚
              {preview.canAfford ? '（充足）' : '（不足）'}
            </Text>
            {preview.validation.blockingReason && (
              <Text className="preview-line warn">{preview.validation.blockingReason}</Text>
            )}
            {preview.validation.warnings.map((w, idx) => (
              <Text key={idx} className="preview-line">{w}</Text>
            ))}
          </View>
        ) : (
          <Text className="cardBody">投入灵材后查看预检。</Text>
        )}
      </ScrollCard>

      <View className="action-row">
        <Button className="btn ghost" onClick={reset} disabled={submitting}>
          重置
        </Button>
        <Button
          className="btn primary"
          loading={submitting}
          disabled={submitting || selectedIds.length === 0 || !prompt.trim()}
          onClick={handleSubmit}
        >
          {submitting ? '炼制中...' : '开炉'}
        </Button>
      </View>

      {resultOpen && result && (
        <View className="modal-mask" onClick={closeResult}>
          <View className="modal" onClick={(e) => e.stopPropagation()}>
            <SectionTitle>炼制结果</SectionTitle>
            {result.consumable && (
              <>
                <Text className="modal-headline success">{result.consumable.name}</Text>
                {result.consumable.quality && (
                  <Text className="modal-line">品质：{result.consumable.quality}</Text>
                )}
                {result.consumable.quantity && (
                  <Text className="modal-line">份数：{result.consumable.quantity}</Text>
                )}
                {result.consumable.description && (
                  <Text className="modal-line">{result.consumable.description}</Text>
                )}
              </>
            )}
            {result.artifact && (
              <>
                <Text className="modal-headline success">{result.artifact.name}</Text>
                {result.artifact.quality && (
                  <Text className="modal-line">品质：{result.artifact.quality}</Text>
                )}
                {result.artifact.slot && (
                  <Text className="modal-line">部位：{result.artifact.slot}</Text>
                )}
                {result.artifact.element && (
                  <Text className="modal-line">属性：{result.artifact.element}</Text>
                )}
                {result.artifact.description && (
                  <Text className="modal-line">{result.artifact.description}</Text>
                )}
              </>
            )}
            <Button className="btn primary" onClick={closeResult}>收下</Button>
          </View>
        </View>
      )}
    </View>
  );
}
