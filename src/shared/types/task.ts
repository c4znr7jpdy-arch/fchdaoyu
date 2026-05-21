import type { ConditionStatusKey } from './condition';
import type { Quality, RealmType } from './constants';

export type TaskCategory = 'breakthrough_major';

export type TaskStatus = 'active' | 'completed';

export type TaskObjectiveKind =
  | 'craft_breakthrough_pill'
  | 'insight_at_least'
  | 'technique_quality_at_least'
  | 'status_active'
  | 'complete_dungeon'
  | 'win_task_challenge';

export interface TaskActionLink {
  label: string;
  href: string;
}

export interface TaskObjectiveDefinitionBase {
  id: string;
  kind: TaskObjectiveKind;
  title: string;
  description: string;
}

export interface CraftBreakthroughPillObjectiveDefinition
  extends TaskObjectiveDefinitionBase {
  kind: 'craft_breakthrough_pill';
  targetRealm: RealmType;
}

export interface InsightAtLeastObjectiveDefinition
  extends TaskObjectiveDefinitionBase {
  kind: 'insight_at_least';
  threshold: number;
}

export interface TechniqueQualityAtLeastObjectiveDefinition
  extends TaskObjectiveDefinitionBase {
  kind: 'technique_quality_at_least';
  threshold: Quality;
}

export interface StatusActiveObjectiveDefinition
  extends TaskObjectiveDefinitionBase {
  kind: 'status_active';
  statusKey: Extract<
    ConditionStatusKey,
    'breakthrough_focus' | 'protect_meridians' | 'clear_mind'
  >;
}

export interface CompleteDungeonObjectiveDefinition
  extends TaskObjectiveDefinitionBase {
  kind: 'complete_dungeon';
  mapNodeId: string;
  mapNodeName: string;
}

export interface WinTaskChallengeObjectiveDefinition
  extends TaskObjectiveDefinitionBase {
  kind: 'win_task_challenge';
  challengeId: string;
}

export type TaskObjectiveDefinition =
  | CraftBreakthroughPillObjectiveDefinition
  | InsightAtLeastObjectiveDefinition
  | TechniqueQualityAtLeastObjectiveDefinition
  | StatusActiveObjectiveDefinition
  | CompleteDungeonObjectiveDefinition
  | WinTaskChallengeObjectiveDefinition;

export interface TaskStageDefinition {
  id: string;
  title: string;
  description: string;
  completionText: string;
  objectives: TaskObjectiveDefinition[];
}

export interface TaskDefinition {
  id: string;
  category: TaskCategory;
  title: string;
  summary: string;
  fromRealm: RealmType;
  toRealm: RealmType;
  stages: TaskStageDefinition[];
}

export interface TaskObjectiveState {
  objectiveId: string;
  completed: boolean;
  progressValue?: number;
  completedAt?: string;
  updatedAt?: string;
}

export interface TaskInstanceMetadata {
  fromRealm: RealmType;
  toRealm: RealmType;
  taskTheme:
    | 'foundation'
    | 'core'
    | 'heart_demon'
    | 'tribulation'
    | 'law_insight';
}

export interface TaskObjectiveProgress {
  id: string;
  kind: TaskObjectiveKind;
  title: string;
  description: string;
  completed: boolean;
  progressText: string;
}

export interface TaskStageProgress {
  id: string;
  title: string;
  description: string;
  completionText: string;
  completed: boolean;
  current: boolean;
  links: TaskActionLink[];
  objectives: TaskObjectiveProgress[];
}

export interface TaskProgressSnapshot {
  title: string;
  summary: string;
  fromRealm: RealmType;
  toRealm: RealmType;
  isCompleted: boolean;
  currentStageId: string | null;
  currentStageIndex: number;
  totalStages: number;
  missingRequirements: string[];
  stages: TaskStageProgress[];
}

export interface TaskInstance {
  id: string;
  definitionId: string;
  category: TaskCategory;
  status: TaskStatus;
  currentStage: string | null;
  objectives: TaskObjectiveState[];
  metadata: TaskInstanceMetadata;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  snapshot: TaskProgressSnapshot;
}
