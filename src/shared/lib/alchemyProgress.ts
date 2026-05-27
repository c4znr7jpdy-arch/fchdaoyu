import { BASE_EXP_PER_YEAR } from '@shared/config/cultivationProgress';
import { getConsumableQualityScalar } from '@shared/config/consumableSystem';
import type { Quality, RealmType } from '@shared/types/constants';

const INSIGHT_GAIN_BY_QUALITY: Record<Quality, number> = {
  凡品: 1,
  灵品: 2,
  玄品: 3,
  真品: 4,
  地品: 6,
  天品: 8,
  仙品: 11,
  神品: 15,
};

export function buildCultivationGain(
  realm: RealmType,
  quality: Quality,
): number {
  return Math.max(
    1,
    Math.floor(BASE_EXP_PER_YEAR[realm] * getConsumableQualityScalar(quality) * 2),
  );
}

export function buildInsightGain(quality: Quality): number {
  return INSIGHT_GAIN_BY_QUALITY[quality];
}

export function scaleProgressGain(value: number, factor: number): number {
  return Math.max(1, Math.floor(value * factor));
}
