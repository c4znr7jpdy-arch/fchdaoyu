import { useInkUI } from '@app/components/providers/InkUIProvider';
import { useCultivator } from '@app/lib/contexts/CultivatorContext';
import { useTaskList } from '@app/lib/hooks/useTaskList';
import { findCurrentMajorBreakthroughTask } from '@app/lib/tasks/taskClient';
import type {
  BreakthroughResult,
  CultivationResult,
} from '@shared/engine/cultivation/CultivationEngine';
import type { TaskInstance } from '@shared/types/task';
import {
  calculateBreakthroughChance,
  getNextStage,
} from '@server/utils/breakthroughCalculator';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';

export interface RetreatResultData {
  summary: BreakthroughResult['summary'] | CultivationResult['summary'];
  story?: string;
  storyType?: 'breakthrough' | 'lifespan' | null;
  action?: 'cultivate' | 'breakthrough';
  depleted?: boolean;
}

export interface CultivationProgressData {
  cultivation_exp: number;
  exp_cap: number;
  comprehension_insight: number;
  percent: number;
  canBreakthrough: boolean;
  breakthroughType: 'forced' | 'normal' | 'perfect' | null;
}

export interface BreakthroughChancePreviewData {
  baseChance: number;
  finalChance: number;
  buffBonus: number;
  recommendation: string;
}

export interface UseRetreatViewModelReturn {
  cultivator: ReturnType<typeof useCultivator>['cultivator'];
  isLoading: boolean;
  note: string | undefined;
  remainingLifespan: number;
  cultivationProgress: CultivationProgressData | null;
  breakthroughPreview: BreakthroughChancePreviewData | null;
  currentMajorTask: TaskInstance | null;
  isMajorBreakthrough: boolean;
  majorBreakthroughBlocked: boolean;
  tasksLoading: boolean;
  taskError: string | undefined;

  retreatYears: string;
  setRetreatYears: (years: string) => void;
  handleRetreatYearsChange: (value: string) => void;

  retreatLoading: boolean;
  retreatResult: RetreatResultData | null;
  showBreakthroughConfirm: boolean;

  handleRetreat: () => Promise<void>;
  handleBreakthroughClick: () => void;
  handleBreakthrough: () => Promise<void>;
  closeBreakthroughConfirm: () => void;
  handleGoReincarnate: () => void;
  clearRetreatResult: () => void;
}

export function useRetreatViewModel(): UseRetreatViewModelReturn {
  const { cultivator, isLoading, refresh, note } = useCultivator();
  const { pushToast } = useInkUI();
  const navigate = useNavigate();
  const {
    tasks,
    loading: tasksLoading,
    error: taskError,
    reload: reloadTasks,
  } = useTaskList(cultivator?.id);

  const [retreatYears, setRetreatYears] = useState('10');
  const [retreatResult, setRetreatResult] = useState<RetreatResultData | null>(
    null,
  );
  const [retreatLoading, setRetreatLoading] = useState(false);
  const [showBreakthroughConfirm, setShowBreakthroughConfirm] = useState(false);

  const remainingLifespan = useMemo(() => {
    if (!cultivator) return 0;
    return Math.max(cultivator.lifespan - cultivator.age, 0);
  }, [cultivator]);

  const cultivationProgress = useMemo((): CultivationProgressData | null => {
    if (!cultivator?.cultivation_progress) return null;

    const progress = cultivator.cultivation_progress;
    const percent = Math.floor(
      (progress.cultivation_exp / progress.exp_cap) * 100,
    );
    const canBreakthrough = percent >= 60;

    let breakthroughType: 'forced' | 'normal' | 'perfect' | null = null;
    if (percent >= 100 && progress.comprehension_insight >= 50) {
      breakthroughType = 'perfect';
    } else if (percent >= 80) {
      breakthroughType = 'normal';
    } else if (percent >= 60) {
      breakthroughType = 'forced';
    }

    return {
      cultivation_exp: progress.cultivation_exp,
      exp_cap: progress.exp_cap,
      comprehension_insight: progress.comprehension_insight,
      percent,
      canBreakthrough,
      breakthroughType,
    };
  }, [cultivator]);

  const nextBreakthrough = useMemo(() => {
    if (!cultivator) {
      return null;
    }

    return getNextStage(cultivator.realm, cultivator.realm_stage);
  }, [cultivator]);

  const isMajorBreakthrough = Boolean(
    cultivator &&
      nextBreakthrough &&
      nextBreakthrough.realm !== cultivator.realm,
  );

  const currentMajorTask = useMemo(
    () => findCurrentMajorBreakthroughTask(cultivator, tasks),
    [cultivator, tasks],
  );

  const majorBreakthroughBlocked = Boolean(
    isMajorBreakthrough &&
      (!currentMajorTask || currentMajorTask.status !== 'completed'),
  );

  const breakthroughPreview = useMemo((): BreakthroughChancePreviewData | null => {
    if (
      !cultivator ||
      !cultivationProgress?.canBreakthrough ||
      (isMajorBreakthrough && majorBreakthroughBlocked)
    ) {
      return null;
    }

    try {
      const result = calculateBreakthroughChance(cultivator);
      const baseChance = Math.min(
        1,
        Math.max(
          0.05,
          result.modifiers.baseChance *
            result.modifiers.realmDifficulty *
            result.modifiers.progressMultiplier *
            result.modifiers.insightMultiplier *
            result.modifiers.wisdomMultiplier *
            result.modifiers.demonPenalty +
            result.modifiers.toxicityPenalty,
        ),
      );

      return {
        baseChance,
        finalChance: result.chance,
        buffBonus: result.modifiers.pillBonus + result.modifiers.fateBonus,
        recommendation: result.recommendation,
      };
    } catch {
      return null;
    }
  }, [
    cultivator,
    cultivationProgress?.canBreakthrough,
    isMajorBreakthrough,
    majorBreakthroughBlocked,
  ]);

  const handleRetreatYearsChange = useCallback((value: string) => {
    const numeric = value.replace(/[^\d]/g, '');
    setRetreatYears(numeric);
  }, []);

  const handleRetreat = useCallback(async () => {
    if (!cultivator) return;

    const parsedYears = Number(retreatYears || '0');
    if (!Number.isFinite(parsedYears) || parsedYears <= 0) {
      pushToast({
        message: '闭关年限似乎不对哦，道友请三思而行',
        tone: 'warning',
      });
      return;
    }

    setRetreatLoading(true);
    try {
      const response = await fetch('/api/cultivator/retreat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          years: parsedYears,
          action: 'cultivate',
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || '闭关失败');
      }

      setRetreatResult(payload.data);
      await Promise.all([refresh(), reloadTasks()]);
    } catch (error) {
      pushToast({
        message:
          error instanceof Error ? error.message : '闭关失败，请稍后再试',
        tone: 'danger',
      });
    } finally {
      setRetreatLoading(false);
    }
  }, [cultivator, pushToast, refresh, reloadTasks, retreatYears]);

  const handleBreakthroughClick = useCallback(() => {
    if (isMajorBreakthrough && majorBreakthroughBlocked) {
      pushToast({
        message: tasksLoading
          ? '破境卷宗仍在整理，请稍后再试。'
          : '先完成当前破境任务，再回静室正式冲关。',
        tone: 'warning',
      });
      return;
    }

    setShowBreakthroughConfirm(true);
  }, [isMajorBreakthrough, majorBreakthroughBlocked, pushToast, tasksLoading]);

  const closeBreakthroughConfirm = useCallback(() => {
    setShowBreakthroughConfirm(false);
  }, []);

  const handleBreakthrough = useCallback(async () => {
    if (!cultivator) return;

    setShowBreakthroughConfirm(false);
    setRetreatLoading(true);

    try {
      const response = await fetch('/api/cultivator/retreat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'breakthrough',
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload.success) {
        if (payload?.errorCode === 'MAJOR_BREAKTHROUGH_TASK_REQUIRED') {
          await reloadTasks();
          pushToast({
            message:
              typeof payload.error === 'string'
                ? payload.error
                : '大境界突破仍需先完成破境任务',
            tone: 'warning',
          });
          return;
        }

        throw new Error(payload.error || '突破失败');
      }

      setRetreatResult(payload.data);
      await Promise.all([refresh(), reloadTasks()]);
    } catch (error) {
      pushToast({
        message:
          error instanceof Error ? error.message : '突破失败，请稍后再试',
        tone: 'danger',
      });
    } finally {
      setRetreatLoading(false);
    }
  }, [cultivator, pushToast, refresh, reloadTasks]);

  const handleGoReincarnate = useCallback(() => {
    if (retreatResult?.story && typeof window !== 'undefined' && cultivator) {
      window.sessionStorage.setItem(
        'reincarnateContext',
        JSON.stringify({
          story: retreatResult.story,
          name: cultivator.name,
          realm: cultivator.realm,
          realm_stage: cultivator.realm_stage,
        }),
      );
    }
    navigate('/game/reincarnate');
  }, [cultivator, navigate, retreatResult]);

  const clearRetreatResult = useCallback(() => {
    setRetreatResult(null);
  }, []);

  return {
    cultivator,
    isLoading,
    note,
    remainingLifespan,
    cultivationProgress,
    breakthroughPreview,
    currentMajorTask,
    isMajorBreakthrough,
    majorBreakthroughBlocked,
    tasksLoading,
    taskError,
    retreatYears,
    setRetreatYears,
    handleRetreatYearsChange,
    retreatLoading,
    retreatResult,
    showBreakthroughConfirm,
    handleRetreat,
    handleBreakthroughClick,
    handleBreakthrough,
    closeBreakthroughConfirm,
    handleGoReincarnate,
    clearRetreatResult,
  };
}
