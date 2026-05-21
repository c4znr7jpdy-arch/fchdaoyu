import { assertConsumableSpec } from '@shared/lib/consumables';
import { getBreakthroughPillLabel } from '@shared/lib/breakthroughPill';
import { isConditionStatusActive } from '@shared/lib/condition';
import { getConditionStatusTemplate } from '@shared/lib/conditionStatusRegistry';
import type { BattleRecord } from '@shared/types/battle';
import type { ConditionStatusKey } from '@shared/types/condition';
import type { Consumable, CultivationProgress, Cultivator } from '@shared/types/cultivator';
import { QUALITY_ORDER, type Quality, type RealmType } from '@shared/types/constants';
import type {
  TaskActionLink,
  TaskInstance,
  TaskInstanceMetadata,
  TaskObjectiveDefinition,
  TaskObjectiveProgress,
  TaskObjectiveState,
  TaskProgressSnapshot,
  TaskStageProgress,
  TaskStatus,
} from '@shared/types/task';
import {
  findActiveCultivatorRecordById,
  listCultivatorBreakthroughPills,
  listCultivatorTechniqueQualities,
  type CultivatorBreakthroughPillRecord,
} from '@server/lib/repositories/cultivatorRepository';
import { getNextStage } from '@server/utils/breakthroughCalculator';
import { getOrInitCultivationProgress } from '@server/utils/cultivationUtils';
import { simulateBattleV5 } from './simulateBattleV5';
import { getCultivatorByIdUnsafe } from './cultivatorService';
import {
  createCultivatorTask,
  findCultivatorTaskById,
  findCultivatorTaskByDefinition,
  listCultivatorTasks,
  type CultivatorTaskRecord,
  updateCultivatorTask,
} from '@server/lib/repositories/taskRepository';
import {
  getBreakthroughTaskDefinition,
  getBreakthroughTaskDefinitionByTransition,
  getTaskChallengeProfile,
  type BreakthroughTaskDefinition,
} from './taskDefinitions';

export interface TaskChallengeResult {
  task: TaskInstance;
  battleResult: BattleRecord;
  isWin: boolean;
  challengeTitle: string;
}

export interface MajorBreakthroughGate {
  required: boolean;
  blocked: boolean;
  task: TaskInstance | null;
}

interface TaskProgressContext {
  cultivatorId: string;
  realm: RealmType;
  realmStage: Cultivator['realm_stage'];
  cultivationProgress: Cultivator['cultivation_progress'];
  condition: Cultivator['condition'];
  highestTechniqueQuality: Quality | null;
  breakthroughPillQuantities: Partial<Record<RealmType, number>>;
  genericBreakthroughPillQuantity: number;
}

function getStatusName(statusKey: ConditionStatusKey): string {
  return getConditionStatusTemplate(statusKey)?.name ?? statusKey;
}

function toIsoString(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value;
  return value.toISOString();
}

function isKnownQuality(value: string | null | undefined): value is Quality {
  return Boolean(value && value in QUALITY_ORDER);
}

function getHighestTechniqueQuality(qualities: Array<Quality | null | undefined>): Quality | null {
  let current: Quality | null = null;

  for (const quality of qualities) {
    if (!quality) {
      continue;
    }

    if (!current || QUALITY_ORDER[quality] > QUALITY_ORDER[current]) {
      current = quality;
    }
  }

  return current;
}

function hasActiveStatus(
  context: TaskProgressContext,
  statusKey: Extract<
    ConditionStatusKey,
    'breakthrough_focus' | 'protect_meridians' | 'clear_mind'
  >,
): boolean {
  return (context.condition?.statuses ?? []).some(
    (status) => status.key === statusKey && isConditionStatusActive(status),
  );
}

function buildBreakthroughPillInventory(
  pills: Array<
    | Pick<Consumable, 'quantity' | 'spec'>
    | CultivatorBreakthroughPillRecord
  >,
): Pick<
  TaskProgressContext,
  'breakthroughPillQuantities' | 'genericBreakthroughPillQuantity'
> {
  const breakthroughPillQuantities: Partial<Record<RealmType, number>> = {};
  let genericBreakthroughPillQuantity = 0;

  for (const pill of pills) {
    const spec = assertConsumableSpec(pill.spec);
    if (spec.kind !== 'pill' || spec.family !== 'breakthrough') {
      continue;
    }

    const quantity = Math.max(0, pill.quantity ?? 0);
    if (quantity <= 0) {
      continue;
    }

    const targetRealm = spec.alchemyMeta.breakthroughTargetRealm;
    if (targetRealm) {
      breakthroughPillQuantities[targetRealm] =
        (breakthroughPillQuantities[targetRealm] ?? 0) + quantity;
      continue;
    }

    genericBreakthroughPillQuantity += quantity;
  }

  return {
    breakthroughPillQuantities,
    genericBreakthroughPillQuantity,
  };
}

function getPreparedBreakthroughPillQuantity(
  context: TaskProgressContext,
  targetRealm: RealmType,
): number {
  return (
    (context.breakthroughPillQuantities[targetRealm] ?? 0) +
    context.genericBreakthroughPillQuantity
  );
}

function createTaskProgressContextFromCultivator(
  cultivator: Cultivator,
): TaskProgressContext {
  if (!cultivator.id) {
    throw new Error('角色缺少有效标识');
  }

  return {
    cultivatorId: cultivator.id,
    realm: cultivator.realm,
    realmStage: cultivator.realm_stage,
    cultivationProgress: cultivator.cultivation_progress,
    condition: cultivator.condition,
    highestTechniqueQuality: getHighestTechniqueQuality(
      (cultivator.cultivations ?? []).map((cultivation) => cultivation.quality ?? null),
    ),
    ...buildBreakthroughPillInventory(cultivator.inventory.consumables),
  };
}

async function loadTaskProgressContextOrThrow(
  cultivatorId: string,
): Promise<TaskProgressContext> {
  const [record, techniqueRows, breakthroughPills] = await Promise.all([
    findActiveCultivatorRecordById(cultivatorId),
    listCultivatorTechniqueQualities(cultivatorId),
    listCultivatorBreakthroughPills(cultivatorId),
  ]);

  if (!record) {
    throw new Error('角色不存在');
  }

  return {
    cultivatorId: record.id,
    realm: record.realm as RealmType,
    realmStage: record.realm_stage as Cultivator['realm_stage'],
    cultivationProgress: getOrInitCultivationProgress(
      ((record.cultivation_progress ?? {}) as CultivationProgress),
      record.realm as Cultivator['realm'],
      record.realm_stage as Cultivator['realm_stage'],
    ),
    condition:
      (record.condition as Cultivator['condition'] | null | undefined) ?? undefined,
    highestTechniqueQuality: getHighestTechniqueQuality(
      techniqueRows.map((row) => (isKnownQuality(row.quality) ? row.quality : null)),
    ),
    ...buildBreakthroughPillInventory(breakthroughPills),
  };
}

function normalizeObjectiveStates(
  input: unknown,
): TaskObjectiveState[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') {
      return [];
    }

    const item = entry as Partial<TaskObjectiveState>;
    if (typeof item.objectiveId !== 'string') {
      return [];
    }

    return [
      {
        objectiveId: item.objectiveId,
        completed: item.completed === true,
        progressValue:
          typeof item.progressValue === 'number' ? item.progressValue : undefined,
        completedAt:
          typeof item.completedAt === 'string' ? item.completedAt : undefined,
        updatedAt:
          typeof item.updatedAt === 'string' ? item.updatedAt : undefined,
      },
    ];
  });
}

function createDefaultObjectiveState(objectiveId: string): TaskObjectiveState {
  return {
    objectiveId,
    completed: false,
  };
}

function completeObjectiveState(
  state: TaskObjectiveState | undefined,
  progressValue: number | undefined,
  nowIso: string,
): TaskObjectiveState {
  return {
    objectiveId: state?.objectiveId ?? '',
    completed: true,
    progressValue,
    completedAt: state?.completedAt ?? nowIso,
    updatedAt: nowIso,
  };
}

function serializeObjectiveStates(states: TaskObjectiveState[]): string {
  return JSON.stringify(
    states.map((state) => ({
      ...state,
      progressValue:
        typeof state.progressValue === 'number'
          ? Number(state.progressValue.toFixed(4))
          : undefined,
    })),
  );
}

function resolveObjectiveProgress(
  definition: TaskObjectiveDefinition,
  state: TaskObjectiveState | undefined,
  context: TaskProgressContext,
  nowIso: string,
): {
  objectiveState: TaskObjectiveState;
  progress: TaskObjectiveProgress;
} {
  switch (definition.kind) {
    case 'craft_breakthrough_pill': {
      const preparedPillQuantity = getPreparedBreakthroughPillQuantity(
        context,
        definition.targetRealm,
      );
      const completed = state?.completed === true || preparedPillQuantity > 0;
      const nextState = completed
        ? completeObjectiveState(
            {
              ...createDefaultObjectiveState(definition.id),
              ...state,
              objectiveId: definition.id,
            },
            preparedPillQuantity || state?.progressValue || 1,
            nowIso,
          )
        : {
            ...createDefaultObjectiveState(definition.id),
            ...state,
            objectiveId: definition.id,
            progressValue: preparedPillQuantity,
            updatedAt: nowIso,
          };

      return {
        objectiveState: nextState,
        progress: {
          id: definition.id,
          kind: definition.kind,
          title: definition.title,
          description: definition.description,
          completed,
          progressText: completed
            ? `已备妥${getBreakthroughPillLabel(definition.targetRealm)}`
            : `尚未炼成${getBreakthroughPillLabel(definition.targetRealm)}`,
        },
      };
    }
    case 'insight_at_least': {
      const currentInsight =
        context.cultivationProgress?.comprehension_insight ?? 0;
      const completed = currentInsight >= definition.threshold;
      const nextState = completed
        ? completeObjectiveState(
            {
              ...createDefaultObjectiveState(definition.id),
              ...state,
              objectiveId: definition.id,
            },
            currentInsight,
            nowIso,
          )
        : {
            ...createDefaultObjectiveState(definition.id),
            ...state,
            objectiveId: definition.id,
            progressValue: currentInsight,
            updatedAt: nowIso,
          };

      return {
        objectiveState: nextState,
        progress: {
          id: definition.id,
          kind: definition.kind,
          title: definition.title,
          description: definition.description,
          completed,
          progressText: `${currentInsight}/${definition.threshold}`,
        },
      };
    }
    case 'technique_quality_at_least': {
      const currentQuality = context.highestTechniqueQuality;
      const completed =
        currentQuality !== null &&
        QUALITY_ORDER[currentQuality] >= QUALITY_ORDER[definition.threshold];
      const nextState = completed
        ? completeObjectiveState(
            {
              ...createDefaultObjectiveState(definition.id),
              ...state,
              objectiveId: definition.id,
            },
            QUALITY_ORDER[currentQuality!],
            nowIso,
          )
        : {
            ...createDefaultObjectiveState(definition.id),
            ...state,
            objectiveId: definition.id,
            progressValue:
              currentQuality !== null ? QUALITY_ORDER[currentQuality] : 0,
            updatedAt: nowIso,
          };

      return {
        objectiveState: nextState,
        progress: {
          id: definition.id,
          kind: definition.kind,
          title: definition.title,
          description: definition.description,
          completed,
          progressText: `${currentQuality ?? '未得'} / 至少 ${definition.threshold}`,
        },
      };
    }
    case 'status_active': {
      const completed = hasActiveStatus(context, definition.statusKey);
      const nextState = completed
        ? completeObjectiveState(
            {
              ...createDefaultObjectiveState(definition.id),
              ...state,
              objectiveId: definition.id,
            },
            1,
            nowIso,
          )
        : {
            ...createDefaultObjectiveState(definition.id),
            ...state,
            objectiveId: definition.id,
            progressValue: 0,
            updatedAt: nowIso,
          };

      return {
        objectiveState: nextState,
        progress: {
          id: definition.id,
          kind: definition.kind,
          title: definition.title,
          description: definition.description,
          completed,
          progressText: completed
            ? `已具备${getStatusName(definition.statusKey)}状态`
            : `尚未具备${getStatusName(definition.statusKey)}状态`,
        },
      };
    }
    case 'complete_dungeon': {
      const completed = state?.completed === true;
      const nextState = {
        ...createDefaultObjectiveState(definition.id),
        ...state,
        objectiveId: definition.id,
      };

      return {
        objectiveState: nextState,
        progress: {
          id: definition.id,
          kind: definition.kind,
          title: definition.title,
          description: definition.description,
          completed,
          progressText: completed
            ? `已通过${definition.mapNodeName}`
            : `尚未通过${definition.mapNodeName}`,
        },
      };
    }
    case 'win_task_challenge': {
      const completed = state?.completed === true;
      const challengeProfile = getTaskChallengeProfile(definition.challengeId);
      const challengeTitle = challengeProfile?.title ?? '试炼';
      const nextState = {
        ...createDefaultObjectiveState(definition.id),
        ...state,
        objectiveId: definition.id,
      };

      return {
        objectiveState: nextState,
        progress: {
          id: definition.id,
          kind: definition.kind,
          title: definition.title,
          description: definition.description,
          completed,
          progressText: completed
            ? `已渡过${challengeTitle}`
            : `尚未战胜${challengeTitle}`,
        },
      };
    }
  }
}

function resolveStageLinks(
  taskId: string,
  stage: BreakthroughTaskDefinition['stages'][number],
): TaskActionLink[] {
  return stage.links.map((link) => {
    switch (link.kind) {
      case 'alchemy':
        return { label: link.label, href: '/game/craft/alchemy' };
      case 'dungeon':
        return { label: link.label, href: '/game/dungeon' };
      case 'retreat':
        return { label: link.label, href: '/game/retreat' };
      case 'challenge':
        return { label: link.label, href: `/game/tasks/${taskId}/challenge` };
      case 'tasks':
      default:
        return { label: link.label, href: '/game/tasks' };
    }
  });
}

function buildTaskSnapshot(
  record: CultivatorTaskRecord,
  definition: BreakthroughTaskDefinition,
  context: TaskProgressContext,
  nowIso: string,
): {
  snapshot: TaskProgressSnapshot;
  objectiveStates: TaskObjectiveState[];
  status: TaskStatus;
  currentStage: string | null;
} {
  const currentStates = normalizeObjectiveStates(record.objectives);
  const stateMap = new Map(currentStates.map((state) => [state.objectiveId, state]));
  const nextStates: TaskObjectiveState[] = [];
  const stageProgresses: TaskStageProgress[] = [];

  for (const stage of definition.stages) {
    const objectiveProgresses = stage.objectives.map((objective) => {
      const resolved = resolveObjectiveProgress(
        objective,
        stateMap.get(objective.id),
        context,
        nowIso,
      );
      nextStates.push(resolved.objectiveState);
      return resolved.progress;
    });
    const stageCompleted = objectiveProgresses.every((objective) => objective.completed);
    stageProgresses.push({
      id: stage.id,
      title: stage.title,
      description: stage.description,
      completionText: stage.completionText,
      completed: stageCompleted,
      current: false,
      links: resolveStageLinks(record.id, stage),
      objectives: objectiveProgresses,
    });
  }

  const currentStageIndex = stageProgresses.findIndex((stage) => !stage.completed);
  const isCompleted = currentStageIndex === -1;
  const resolvedCurrentStageIndex = isCompleted ? stageProgresses.length : currentStageIndex;
  const currentStageId = isCompleted ? null : stageProgresses[currentStageIndex].id;

  if (!isCompleted && currentStageIndex >= 0) {
    stageProgresses[currentStageIndex].current = true;
  }

  const missingRequirements =
    !isCompleted && currentStageIndex >= 0
      ? stageProgresses[currentStageIndex].objectives
          .filter((objective) => !objective.completed)
          .map((objective) => `${objective.title}：${objective.progressText}`)
      : [];

  return {
    snapshot: {
      title: definition.title,
      summary: definition.summary,
      fromRealm: definition.fromRealm,
      toRealm: definition.toRealm,
      isCompleted,
      currentStageId,
      currentStageIndex: resolvedCurrentStageIndex,
      totalStages: definition.stages.length,
      missingRequirements,
      stages: stageProgresses,
    },
    objectiveStates: nextStates,
    status: isCompleted ? 'completed' : 'active',
    currentStage: currentStageId,
  };
}

function mapTaskInstance(
  record: CultivatorTaskRecord,
  snapshot: TaskProgressSnapshot,
): TaskInstance {
  return {
    id: record.id,
    definitionId: record.definitionId,
    category: record.category as TaskInstance['category'],
    status: record.status as TaskStatus,
    currentStage: record.currentStage,
    objectives: normalizeObjectiveStates(record.objectives),
    metadata: record.metadata as TaskInstanceMetadata,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt?.toISOString() ?? record.createdAt.toISOString(),
    completedAt: toIsoString(record.completedAt),
    snapshot,
  };
}

function getCurrentMajorDefinition(
  context: Pick<TaskProgressContext, 'realm' | 'realmStage'>,
): BreakthroughTaskDefinition | null {
  if (context.realmStage !== '圆满') {
    return null;
  }

  const nextStage = getNextStage(context.realm, context.realmStage);
  if (!nextStage || nextStage.realm === context.realm) {
    return null;
  }

  return getBreakthroughTaskDefinitionByTransition(
    context.realm,
    nextStage.realm,
  );
}

async function ensureCurrentTaskRecord(
  context: TaskProgressContext,
): Promise<void> {
  const definition = getCurrentMajorDefinition(context);
  if (!definition) {
    return;
  }

  const existing = await findCultivatorTaskByDefinition(
    context.cultivatorId,
    definition.id,
  );
  if (existing) {
    return;
  }

  try {
    await createCultivatorTask({
      cultivatorId: context.cultivatorId,
      definitionId: definition.id,
      category: definition.category,
      status: 'active',
      currentStage: definition.stages[0]?.id ?? null,
      objectives: definition.stages.flatMap((stage) =>
        stage.objectives.map((objective) => createDefaultObjectiveState(objective.id)),
      ),
      metadata: {
        fromRealm: definition.fromRealm,
        toRealm: definition.toRealm,
        taskTheme: definition.taskTheme,
      },
    });
  } catch (error) {
    if (
      !error ||
      typeof error !== 'object' ||
      (error as { code?: string }).code !== '23505'
    ) {
      throw error;
    }
  }
}

async function syncTaskRecord(
  context: TaskProgressContext,
  record: CultivatorTaskRecord,
): Promise<TaskInstance> {
  const definition = getBreakthroughTaskDefinition(record.definitionId);
  if (!definition) {
    throw new Error(`缺少任务定义：${record.definitionId}`);
  }

  const nowIso = new Date().toISOString();
  const resolved = buildTaskSnapshot(record, definition, context, nowIso);
  const serializedCurrent = serializeObjectiveStates(normalizeObjectiveStates(record.objectives));
  const serializedNext = serializeObjectiveStates(resolved.objectiveStates);
  const needsUpdate =
    serializedCurrent !== serializedNext ||
    record.status !== resolved.status ||
    record.currentStage !== resolved.currentStage ||
    (resolved.status === 'completed' && !record.completedAt);

  const nextRecord =
    needsUpdate
      ? (await updateCultivatorTask(record.id, context.cultivatorId, {
          status: resolved.status,
          currentStage: resolved.currentStage,
          objectives: resolved.objectiveStates,
          completedAt:
            resolved.status === 'completed'
              ? record.completedAt ?? new Date(nowIso)
              : null,
        })) ?? record
      : record;

  return mapTaskInstance(nextRecord, resolved.snapshot);
}

async function loadBundleOrThrow(cultivatorId: string): Promise<Cultivator> {
  const bundle = await getCultivatorByIdUnsafe(cultivatorId);
  if (!bundle) {
    throw new Error('角色不存在');
  }

  return bundle.cultivator;
}

async function syncCultivatorTasksWithContext(
  context: TaskProgressContext,
): Promise<TaskInstance[]> {
  await ensureCurrentTaskRecord(context);
  const records = await listCultivatorTasks(context.cultivatorId);
  return Promise.all(records.map((record) => syncTaskRecord(context, record)));
}

export const TaskService = {
  async syncCultivatorTasks(cultivatorId: string): Promise<TaskInstance[]> {
    const context = await loadTaskProgressContextOrThrow(cultivatorId);
    return syncCultivatorTasksWithContext(context);
  },

  async listCultivatorTasks(
    cultivatorId: string,
    status?: TaskStatus,
  ): Promise<TaskInstance[]> {
    const tasks = await this.syncCultivatorTasks(cultivatorId);
    if (!status) {
      return tasks;
    }

    return tasks.filter((task) => task.status === status);
  },

  async getCultivatorTask(
    cultivatorId: string,
    taskId: string,
  ): Promise<TaskInstance | null> {
    const tasks = await this.syncCultivatorTasks(cultivatorId);
    return tasks.find((task) => task.id === taskId) ?? null;
  },

  async getMajorBreakthroughGate(cultivatorId: string): Promise<MajorBreakthroughGate> {
    const context = await loadTaskProgressContextOrThrow(cultivatorId);
    const definition = getCurrentMajorDefinition(context);
    if (!definition) {
      return {
        required: false,
        blocked: false,
        task: null,
      };
    }

    const tasks = await syncCultivatorTasksWithContext(context);
    const task = tasks.find((item) => item.definitionId === definition.id) ?? null;

    return {
      required: true,
      blocked: task?.status !== 'completed',
      task,
    };
  },

  async recordDungeonCompletion(
    cultivatorId: string,
    mapNodeId: string,
  ): Promise<TaskInstance[]> {
    const context = await loadTaskProgressContextOrThrow(cultivatorId);
    await ensureCurrentTaskRecord(context);
    const records = await listCultivatorTasks(cultivatorId, { status: 'active' });
    const nowIso = new Date().toISOString();

    for (const record of records) {
      const definition = getBreakthroughTaskDefinition(record.definitionId);
      if (!definition) {
        continue;
      }

      const nextStates = normalizeObjectiveStates(record.objectives);
      let changed = false;

      for (const stage of definition.stages) {
        for (const objective of stage.objectives) {
          if (
            objective.kind !== 'complete_dungeon' ||
            objective.mapNodeId !== mapNodeId
          ) {
            continue;
          }

          const stateIndex = nextStates.findIndex(
            (state) => state.objectiveId === objective.id,
          );
          const currentState =
            stateIndex >= 0 ? nextStates[stateIndex] : createDefaultObjectiveState(objective.id);
          if (currentState.completed) {
            continue;
          }

          const completedState = completeObjectiveState(
            {
              ...currentState,
              objectiveId: objective.id,
            },
            1,
            nowIso,
          );
          if (stateIndex >= 0) {
            nextStates[stateIndex] = completedState;
          } else {
            nextStates.push(completedState);
          }
          changed = true;
        }
      }

      if (changed) {
        await updateCultivatorTask(record.id, cultivatorId, {
          objectives: nextStates,
        });
      }
    }

    return syncCultivatorTasksWithContext(context);
  },

  async runTaskChallenge(
    cultivatorId: string,
    taskId: string,
  ): Promise<TaskChallengeResult> {
    const cultivator = await loadBundleOrThrow(cultivatorId);
    const context = createTaskProgressContextFromCultivator(cultivator);
    await ensureCurrentTaskRecord(context);
    const record = await findCultivatorTaskById(cultivatorId, taskId);
    if (!record) {
      throw new Error('任务不存在');
    }

    const definition = getBreakthroughTaskDefinition(record.definitionId);
    if (!definition) {
      throw new Error('任务定义不存在');
    }

    const preview = buildTaskSnapshot(
      record,
      definition,
      context,
      new Date().toISOString(),
    );
    const currentStage = preview.snapshot.stages.find((stage) => stage.current);
    if (!currentStage) {
      throw new Error('当前任务已无可执行试炼');
    }

    const challengeObjective = definition.stages
      .find((stage) => stage.id === currentStage.id)
      ?.objectives.find(
        (objective) =>
          objective.kind === 'win_task_challenge' &&
          !preview.snapshot.stages
            .find((stage) => stage.id === currentStage.id)
            ?.objectives.find((item) => item.id === objective.id)?.completed,
      );

    if (!challengeObjective || challengeObjective.kind !== 'win_task_challenge') {
      throw new Error('当前阶段没有可执行的试炼挑战');
    }

    const challengeProfile = getTaskChallengeProfile(challengeObjective.challengeId);
    if (!challengeProfile) {
      throw new Error('试炼配置不存在');
    }

    const battleResult = simulateBattleV5(
      cultivator,
      challengeProfile.buildOpponent(cultivator),
    );
    const isWin = battleResult.winner.id === cultivator.id;

    if (isWin) {
      const nextStates = normalizeObjectiveStates(record.objectives);
      const nowIso = new Date().toISOString();
      const stateIndex = nextStates.findIndex(
        (state) => state.objectiveId === challengeObjective.id,
      );
      const currentState =
        stateIndex >= 0
          ? nextStates[stateIndex]
          : createDefaultObjectiveState(challengeObjective.id);
      const completedState = completeObjectiveState(
        {
          ...currentState,
          objectiveId: challengeObjective.id,
        },
        1,
        nowIso,
      );

      if (stateIndex >= 0) {
        nextStates[stateIndex] = completedState;
      } else {
        nextStates.push(completedState);
      }

      await updateCultivatorTask(record.id, cultivatorId, {
        objectives: nextStates,
      });
    }

    const task = (await syncCultivatorTasksWithContext(context)).find(
      (item) => item.id === taskId,
    );
    if (!task) {
      throw new Error('任务同步失败');
    }

    return {
      task,
      battleResult,
      isWin,
      challengeTitle: challengeProfile.title,
    };
  },
};
