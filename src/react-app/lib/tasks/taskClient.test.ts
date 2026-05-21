import type { Cultivator } from '@shared/types/cultivator';
import type { TaskInstance } from '@shared/types/task';
import { describe, expect, it } from 'vitest';
import { findCurrentMajorBreakthroughTask } from './taskClient';

function createCultivator(
  overrides: Partial<Cultivator> = {},
): Cultivator {
  return {
    id: overrides.id ?? 'cultivator-1',
    name: overrides.name ?? '韩立',
    title: overrides.title ?? null,
    gender: overrides.gender ?? '男',
    realm: overrides.realm ?? '炼气',
    realm_stage: overrides.realm_stage ?? '圆满',
    age: overrides.age ?? 120,
    lifespan: overrides.lifespan ?? 300,
    attributes: overrides.attributes ?? {
      vitality: 20,
      spirit: 20,
      wisdom: 20,
      speed: 20,
      willpower: 20,
    },
    spiritual_roots: overrides.spiritual_roots ?? [],
    pre_heaven_fates: overrides.pre_heaven_fates ?? [],
    cultivations: overrides.cultivations ?? [],
    skills: overrides.skills ?? [],
    inventory: overrides.inventory ?? {
      artifacts: [],
      consumables: [],
      materials: [],
    },
    equipped: overrides.equipped ?? {
      weapon: null,
      armor: null,
      accessory: null,
    },
    max_skills: overrides.max_skills ?? 4,
    spirit_stones: overrides.spirit_stones ?? 0,
    cultivation_progress: overrides.cultivation_progress ?? {
      cultivation_exp: 100,
      exp_cap: 100,
      comprehension_insight: 65,
      breakthrough_failures: 0,
      bottleneck_state: true,
      inner_demon: false,
      deviation_risk: 0,
    },
  };
}

function createTask(
  overrides: Partial<TaskInstance> = {},
): TaskInstance {
  return {
    id: overrides.id ?? 'task-1',
    definitionId: overrides.definitionId ?? 'major_breakthrough_炼气_筑基',
    category: overrides.category ?? 'breakthrough_major',
    status: overrides.status ?? 'active',
    currentStage: overrides.currentStage ?? 'foundation-pill',
    objectives: overrides.objectives ?? [],
    metadata: overrides.metadata ?? {
      fromRealm: '炼气',
      toRealm: '筑基',
      taskTheme: 'foundation',
    },
    createdAt: overrides.createdAt ?? '2026-05-21T00:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2026-05-21T00:00:00.000Z',
    completedAt: overrides.completedAt ?? null,
    snapshot: overrides.snapshot ?? {
      title: '筑基前引',
      summary: '备妥筑基丹，再经药园试炼稳住根基。',
      fromRealm: '炼气',
      toRealm: '筑基',
      isCompleted: false,
      currentStageId: 'foundation-pill',
      currentStageIndex: 0,
      totalStages: 2,
      missingRequirements: [],
      stages: [],
    },
  };
}

describe('findCurrentMajorBreakthroughTask', () => {
  it('returns the task matching the current major transition', () => {
    const cultivator = createCultivator();
    const currentTask = createTask();
    const unrelatedTask = createTask({
      id: 'task-2',
      definitionId: 'major_breakthrough_筑基_金丹',
      metadata: {
        fromRealm: '筑基',
        toRealm: '金丹',
        taskTheme: 'core',
      },
      snapshot: {
        title: '凝丹之机',
        summary: '丹法并备。',
        fromRealm: '筑基',
        toRealm: '金丹',
        isCompleted: false,
        currentStageId: 'core-prep',
        currentStageIndex: 0,
        totalStages: 2,
        missingRequirements: [],
        stages: [],
      },
    });

    expect(
      findCurrentMajorBreakthroughTask(cultivator, [unrelatedTask, currentTask]),
    ).toBe(currentTask);
  });

  it('returns null when the cultivator is not at realm completion', () => {
    const cultivator = createCultivator({
      realm_stage: '后期',
    });

    expect(findCurrentMajorBreakthroughTask(cultivator, [createTask()])).toBeNull();
  });
});
