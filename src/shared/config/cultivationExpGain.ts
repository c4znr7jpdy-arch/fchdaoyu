import type { Quality, RealmType } from '@shared/types/constants';

export const RETREAT_EXP_BUDGET = {
  percentByRealm: {
    炼气: 0.04,
    筑基: 0.01667,
    金丹: 0.00667,
    元婴: 0.00273,
    化神: 0.00106,
    炼虚: 0.000471,
    合体: 0.000333,
    大乘: 0.00025,
    渡劫: 0.00016,
  } satisfies Record<RealmType, number>,
  maxYears: 200,
  minBaseExp: 1,
} as const;

export const OFFLINE_YIELD_EXP_BUDGET = {
  percentPerUnit: 0.05,
  hoursPerUnit: 6,
  maxUnits: 4,
  minBaseExp: 1,
  randomFactor: {
    min: 0.8,
    range: 0.4,
  },
} as const;

export const BATTLE_VICTORY_EXP_BUDGET = {
  percent: 0.03,
  minBaseExp: 1,
  realmDiffMultiplier: {
    weaker: 0.5,
    same: 1,
    oneAbove: 1.5,
    twoOrMoreAbove: 2,
  },
  victoryMultiplier: {
    normal: 1,
    perfect: 1.3,
    challenged: 1.2,
  },
} as const;

export const DUNGEON_EXP_BUDGET = {
  minBaseExp: 1,
  tierPercent: {
    S: 0.25,
    A: 0.15,
    B: 0.08,
    C: 0.04,
    D: 0.02,
  },
  resultPercent: {
    perfect: 0.15,
    good: 0.1,
    normal: 0.05,
    failed: 0.02,
  },
  dangerBonusScale: 0.2,
} as const;

export const DAILY_TASK_EXP_BUDGET = {
  minBaseExp: 1,
  difficultyPercent: {
    easy: 0.015,
    normal: 0.025,
    hard: 0.045,
    elite: 0.07,
  },
} as const;

export const PILL_EXP_BUDGET = {
  percentByQuality: {
    凡品: 0.05,
    灵品: 0.061,
    玄品: 0.072,
    真品: 0.083,
    地品: 0.094,
    天品: 0.105,
    仙品: 0.116,
    神品: 0.127,
  } satisfies Record<Quality, number>,
  minBaseExp: 1,
} as const;

export const EVENT_EXP_BUDGET = {
  minBaseExp: 1,
  percentByWeight: {
    minor: 0.015,
    normal: 0.03,
    major: 0.08,
  },
} as const;

export const SYSTEM_REWARD_EXP_BUDGET = {
  minBaseExp: 1,
  maxPercent: 0.2,
  percentByWeight: {
    minor: 0.01,
    normal: 0.02,
    major: 0.05,
  },
} as const;
