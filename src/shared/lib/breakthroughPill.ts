import type { Consumable } from '@shared/types/cultivator';
import { REALM_VALUES, type RealmType } from '@shared/types/constants';

export function getNextMajorRealm(realm: RealmType): RealmType | null {
  const index = REALM_VALUES.indexOf(realm);
  if (index < 0 || index >= REALM_VALUES.length - 1) {
    return null;
  }

  return REALM_VALUES[index + 1];
}

export function getBreakthroughPillLabel(targetRealm: RealmType | null): string {
  switch (targetRealm) {
    case '筑基':
      return '筑基丹';
    case '金丹':
      return '降尘丹';
    case '元婴':
      return '护婴丹';
    case '化神':
      return '化神助力丹';
    default:
      return targetRealm ? `${targetRealm}破境丹` : '破境丹';
  }
}

export function isBreakthroughConsumableForRealm(
  consumable: Pick<Consumable, 'spec'>,
  targetRealm: RealmType,
): boolean {
  if (consumable.spec.kind !== 'pill' || consumable.spec.family !== 'breakthrough') {
    return false;
  }

  const pillRealm = consumable.spec.alchemyMeta.breakthroughTargetRealm;
  return pillRealm ? pillRealm === targetRealm : true;
}
