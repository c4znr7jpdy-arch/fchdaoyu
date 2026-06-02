import type { ApiSuccess } from './http';
import type { TaskInstance } from '@shared/types/task';

export type TaskListResponse = ApiSuccess<{
  tasks: TaskInstance[];
}>;

export type TaskDetailResponse = ApiSuccess<{
  task: TaskInstance;
}>;

export type TaskChallengeResponse = ApiSuccess<{
  task: TaskInstance;
  battleResult: import('@shared/types/battle').BattleRecord;
  isWin: boolean;
  challengeTitle: string;
}>;

export type TaskRewardClaimResponse = ApiSuccess<{
  task: TaskInstance;
  rewards: string[];
}>;
