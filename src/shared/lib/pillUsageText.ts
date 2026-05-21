import { REALM_PILL_USAGE_LIMITS } from '@shared/config/consumableSystem';
import type { RealmType } from '@shared/types/constants';

export function getRealmPillUsageLimit(realm: RealmType): number {
  return REALM_PILL_USAGE_LIMITS[realm];
}

export function getPillUsageKeywordLabel(
  countsTowardLongTermQuota: boolean,
  realm?: RealmType,
): string | null {
  if (!countsTowardLongTermQuota) {
    return null;
  }

  if (!realm) {
    return '服用上限随境界变化';
  }

  return `服用上限 ${getRealmPillUsageLimit(realm)} 次`;
}

export function getPillUsageRuleText(
  countsTowardLongTermQuota: boolean,
  realm?: RealmType,
): string | null {
  if (!countsTowardLongTermQuota) {
    return null;
  }

  if (!realm) {
    return '服用上限：随当前境界变化';
  }

  return `服用上限：${getRealmPillUsageLimit(realm)} 次`;
}

export function getPillUsageLimitReachedText(
  used: number,
  limit: number,
): string {
  return `该丹药服用次数已达上限（当前境界 ${used}/${limit}），无法继续服用。`;
}
