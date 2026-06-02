import type { NoviceReadinessResource } from '@shared/lib/noviceGuidance';
import {
  NOVICE_DUNGEON_RESOURCE_THRESHOLD,
  getNoviceEquipmentState,
} from '@shared/lib/noviceGuidance';
import type { Cultivator } from '@shared/types/cultivator';
import type { TaskInstance } from '@shared/types/task';
import { findNextTutorialTask } from './taskClient';

export interface NoviceHomeAction {
  title: string;
  summary: string;
  href: string;
  label: string;
}

export interface NoviceHomeActionInput {
  tasks: TaskInstance[];
  cultivator: Cultivator | null | undefined;
  hp?: NoviceReadinessResource | null;
  mp?: NoviceReadinessResource | null;
}

function percent(resource?: NoviceReadinessResource | null): number {
  if (!resource) return 100;
  const max = Math.max(1, Math.floor(resource.max));
  const current = Math.max(0, Math.min(max, Math.floor(resource.current)));
  return Math.floor((current / max) * 100);
}

function hasLowDungeonResource(
  hp?: NoviceReadinessResource | null,
  mp?: NoviceReadinessResource | null,
) {
  return (
    percent(hp) < NOVICE_DUNGEON_RESOURCE_THRESHOLD ||
    percent(mp) < NOVICE_DUNGEON_RESOURCE_THRESHOLD
  );
}

function hasUnrecoveredResource(
  hp?: NoviceReadinessResource | null,
  mp?: NoviceReadinessResource | null,
) {
  return percent(hp) < 100 || percent(mp) < 100;
}

export function getNextNoviceHomeAction(
  input: NoviceHomeActionInput,
): NoviceHomeAction | null {
  const task = findNextTutorialTask(input.tasks);
  if (!task) return null;

  const rewardClaimedAt =
    task.snapshot.rewardClaimedAt ?? task.metadata.rewardClaimedAt;
  const canClaim = task.status === 'completed' && !rewardClaimedAt;

  if (canClaim) {
    if (
      task.definitionId === 'tutorial_first_dungeon' &&
      hasUnrecoveredResource(input.hp, input.mp)
    ) {
      return {
        title: '📜 战后调息',
        summary: '第一次探秘已结算，先把气血与法力恢复，再领取入门奖励。',
        href: '/game/inn',
        label: '调息',
      };
    }

    return {
      title: '📜 入门卷宗',
      summary: `${task.snapshot.title}已完成，先领取奖励。`,
      href: '/game/tasks',
      label: '领奖',
    };
  }

  const equipmentState = input.cultivator
    ? getNoviceEquipmentState(input.cultivator)
    : null;
  if (
    task.definitionId !== 'tutorial_starter_supply' &&
    !equipmentState?.hasEquippedFullSet
  ) {
    return {
      title: '📜 装备入门套装',
      summary: equipmentState?.hasFullSet
        ? `先去储物袋装备${equipmentState.unequippedNames.join('、')}，再继续后面的入门步骤。`
        : '尚未找到完整入门装备，先回任务中心确认入门供给是否已领取。',
      href: equipmentState?.hasFullSet ? '/game/inventory' : '/game/tasks',
      label: equipmentState?.hasFullSet ? '装备' : '查看',
    };
  }

  if (task.definitionId === 'tutorial_starter_supply') {
    return {
      title: '📜 入门供给',
      summary: task.snapshot.summary,
      href: '/game/tasks',
      label: '领取',
    };
  }

  if (task.definitionId === 'tutorial_first_alchemy') {
    return {
      title: '📜 第一炉丹',
      summary: '去炼丹房使用推荐首炉，完成青露草与凝水花的入门炼制。',
      href: '/game/craft/alchemy',
      label: '开炉',
    };
  }

  if (task.definitionId === 'tutorial_first_dungeon') {
    if (hasLowDungeonResource(input.hp, input.mp)) {
      return {
        title: '📜 探秘准备',
        summary: '首次探秘前先把气血与法力恢复到八成以上。',
        href: '/game/inn',
        label: '调息',
      };
    }

    return {
      title: '📜 低危探秘',
      summary: '状态与入门套装已备好，去低危秘境学会查探、撤退与结算。',
      href: '/game/dungeon',
      label: '探秘',
    };
  }

  return {
    title: '📜 入门卷宗',
    summary: task.snapshot.summary,
    href: '/game/tasks',
    label: '继续',
  };
}
