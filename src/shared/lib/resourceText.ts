import type { ConditionResourceKey } from '@shared/types/condition';

export type ResourceTextKey =
  | ConditionResourceKey
  | 'maxHp'
  | 'maxMp'
  | 'cultivation_exp'
  | 'hp_loss'
  | 'mp_loss';

const RESOURCE_TEXT: Record<ResourceTextKey, string> = {
  hp: '气血',
  mp: '法力',
  maxHp: '气血上限',
  maxMp: '法力上限',
  cultivation_exp: '修为',
  hp_loss: '气血损失',
  mp_loss: '法力损失',
};

const RESOURCE_MAX_KEY_BY_RESOURCE: Record<
  ConditionResourceKey,
  Extract<ResourceTextKey, 'maxHp' | 'maxMp'>
> = {
  hp: 'maxHp',
  mp: 'maxMp',
};

const RESOURCE_LOSS_KEY_BY_RESOURCE: Record<
  ConditionResourceKey,
  Extract<ResourceTextKey, 'hp_loss' | 'mp_loss'>
> = {
  hp: 'hp_loss',
  mp: 'mp_loss',
};

export function getResourceText(key: ResourceTextKey): string {
  return RESOURCE_TEXT[key];
}

export function getResourceLabel(resource: ConditionResourceKey): string {
  return getResourceText(resource);
}

export function getResourceMaxLabel(resource: ConditionResourceKey): string {
  return getResourceText(RESOURCE_MAX_KEY_BY_RESOURCE[resource]);
}

export function getResourceLossLabel(resource: ConditionResourceKey): string {
  return getResourceText(RESOURCE_LOSS_KEY_BY_RESOURCE[resource]);
}

export function getResourceRestoreText(resource: ConditionResourceKey): string {
  return `恢复${getResourceLabel(resource)}`;
}
