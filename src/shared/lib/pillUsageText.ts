import {
  CULTIVATION_PILL_USAGE_LIMITS,
  REALM_PILL_USAGE_LIMITS,
} from '@shared/config/consumableSystem';
import type { RealmType } from '@shared/types/constants';
import type { PillQuotaCategory } from '@shared/types/consumable';

export function getRealmPillUsageLimit(realm: RealmType): number {
  return REALM_PILL_USAGE_LIMITS[realm];
}

export function getCultivationPillUsageLimit(realm: RealmType): number {
  return CULTIVATION_PILL_USAGE_LIMITS[realm];
}

export function getPillUsageKeywordLabel(
  quotaCategory: PillQuotaCategory,
  realm?: RealmType,
): string | null {
  if (quotaCategory === 'none') {
    return null;
  }

  if (!realm) {
    return '服用上限随境界变化';
  }

  return `服用上限 ${
    quotaCategory === 'cultivation'
      ? getCultivationPillUsageLimit(realm)
      : getRealmPillUsageLimit(realm)
  } 次`;
}

export function getPillUsageRuleText(
  quotaCategory: PillQuotaCategory,
  realm?: RealmType,
): string | null {
  if (quotaCategory === 'none') {
    return null;
  }

  if (!realm) {
    return '服用上限：随当前境界变化';
  }

  return `服用上限：${
    quotaCategory === 'cultivation'
      ? getCultivationPillUsageLimit(realm)
      : getRealmPillUsageLimit(realm)
  } 次`;
}

export function getPillUsageLimitReachedText(
  quotaCategory: PillQuotaCategory,
  used: number,
  limit: number,
): string {
  return `${
    quotaCategory === 'cultivation' ? '该修为丹' : '该丹药'
  }服用次数已达上限（当前境界 ${used}/${limit}），无法继续服用。`;
}
