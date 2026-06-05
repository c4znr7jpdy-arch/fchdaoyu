import { GameplayTags } from '@shared/engine/shared/tag-domain';
import { DamageType } from '../../core/types';

const GAMEPLAY_TAG_LABELS: Record<string, string> = {
  [GameplayTags.ABILITY.FUNCTION.DAMAGE]: '伤害',
  [GameplayTags.ABILITY.FUNCTION.CONTROL]: '控制',
  [GameplayTags.ABILITY.FUNCTION.HEAL]: '治疗',
  [GameplayTags.ABILITY.FUNCTION.BUFF]: '增益',
  [GameplayTags.ABILITY.CHANNEL.MAGIC]: '法术',
  [GameplayTags.ABILITY.CHANNEL.PHYSICAL]: '物理',
  [GameplayTags.ABILITY.CHANNEL.TRUE]: '真实',
  [GameplayTags.ABILITY.KIND.SKILL]: '神通',
  [GameplayTags.ABILITY.KIND.PASSIVE]: '被动',
  [GameplayTags.ABILITY.KIND.ARTIFACT]: '法宝',
  [GameplayTags.ABILITY.KIND.GONGFA]: '功法',
  [GameplayTags.ABILITY.ELEMENT.FIRE]: '火系',
  [GameplayTags.ABILITY.ELEMENT.WATER]: '水系',
  [GameplayTags.ABILITY.ELEMENT.WOOD]: '木系',
  [GameplayTags.ABILITY.ELEMENT.EARTH]: '土系',
  [GameplayTags.ABILITY.ELEMENT.METAL]: '金系',
  [GameplayTags.ABILITY.ELEMENT.WIND]: '风系',
  [GameplayTags.ABILITY.ELEMENT.ICE]: '冰系',
  [GameplayTags.ABILITY.ELEMENT.THUNDER]: '雷系',
  [GameplayTags.ABILITY.TARGET.SINGLE]: '单体',
  [GameplayTags.ABILITY.TARGET.AOE]: '群体',
  [GameplayTags.STATUS.IMMUNE.CONTROL]: '控制免疫',
  [GameplayTags.STATUS.IMMUNE.DEBUFF]: '减益免疫',
  [GameplayTags.STATUS.IMMUNE.FIRE]: '火系免疫',
  [GameplayTags.STATUS.STATE.POISONED]: '中毒',
  [GameplayTags.STATUS.STATE.BURNED]: '灼烧',
  [GameplayTags.STATUS.STATE.FROZEN]: '冻结',
  [GameplayTags.STATUS.STATE.BLEEDING]: '流血',
  [GameplayTags.STATUS.STATE.CHILLED]: '冰缓',
  [GameplayTags.STATUS.STATE.SHOCKED]: '感电',
  [GameplayTags.STATUS.CATEGORY.BUFF]: '正面状态',
  [GameplayTags.STATUS.CATEGORY.DEBUFF]: '负面状态',
  [GameplayTags.STATUS.CATEGORY.DOT]: '持续伤害状态',
  [GameplayTags.STATUS.CATEGORY.DEF_DEBUFF]: '防御削弱状态',
  [GameplayTags.STATUS.CATEGORY.MYTHIC]: '神话状态',
  [GameplayTags.STATUS.CATEGORY.COMBO]: '连携状态',
  [GameplayTags.STATUS.CATEGORY.MANA_EFF]: '法力效率状态',
  [GameplayTags.STATUS.CONTROL.ROOT]: '控制状态',
  [GameplayTags.STATUS.CONTROL.STUNNED]: '眩晕',
  [GameplayTags.STATUS.CONTROL.NO_ACTION]: '无法行动',
  [GameplayTags.STATUS.CONTROL.NO_SKILL]: '无法施放神通',
  [GameplayTags.STATUS.CONTROL.NO_BASIC]: '无法普通攻击',
  [GameplayTags.BUFF.TYPE.BUFF]: '正面状态',
  [GameplayTags.BUFF.TYPE.DEBUFF]: '负面状态',
  [GameplayTags.BUFF.TYPE.CONTROL]: '控制状态',
  [GameplayTags.BUFF.DOT.ROOT]: '持续伤害',
  [GameplayTags.BUFF.DOT.POISON]: '中毒伤害',
  [GameplayTags.BUFF.DOT.BURN]: '灼烧伤害',
  [GameplayTags.BUFF.DOT.FREEZE]: '冻结伤害',
  [GameplayTags.BUFF.DOT.BLEED]: '流血伤害',
  [GameplayTags.BUFF.ELEMENT.FIRE]: '火系状态',
  [GameplayTags.BUFF.ELEMENT.WATER]: '水系状态',
  [GameplayTags.BUFF.ELEMENT.WOOD]: '木系状态',
  [GameplayTags.BUFF.ELEMENT.EARTH]: '土系状态',
  [GameplayTags.BUFF.ELEMENT.METAL]: '金系状态',
  [GameplayTags.BUFF.ELEMENT.WIND]: '风系状态',
  [GameplayTags.BUFF.ELEMENT.ICE]: '冰系状态',
  [GameplayTags.BUFF.ELEMENT.THUNDER]: '雷系状态',
  [GameplayTags.BUFF.ELEMENT.POISON]: '毒系状态',
  [GameplayTags.TRAIT.EXECUTE]: '斩杀',
  [GameplayTags.TRAIT.REFLECT]: '反伤',
  [GameplayTags.TRAIT.LIFESTEAL]: '吸血',
  [GameplayTags.TRAIT.MANA_THIEF]: '夺取法力',
  [GameplayTags.TRAIT.SHIELD_MASTER]: '护盾强化',
  [GameplayTags.TRAIT.BERSERKER]: '狂战',
  [GameplayTags.TRAIT.COOLDOWN]: '冷却干扰',
};

const DAMAGE_TYPE_LABELS: Record<string, string> = {
  [DamageType.PHYSICAL]: '物理',
  [DamageType.MAGICAL]: '法术',
  [DamageType.TRUE]: '真实',
  [DamageType.DOT]: '持续伤害（DOT）',
};

const DAMAGE_CHANNEL_TAGS = [
  GameplayTags.ABILITY.CHANNEL.TRUE,
  GameplayTags.ABILITY.CHANNEL.MAGIC,
  GameplayTags.ABILITY.CHANNEL.PHYSICAL,
] as const;

const ELEMENT_TAGS = [
  GameplayTags.ABILITY.ELEMENT.FIRE,
  GameplayTags.ABILITY.ELEMENT.WATER,
  GameplayTags.ABILITY.ELEMENT.WOOD,
  GameplayTags.ABILITY.ELEMENT.EARTH,
  GameplayTags.ABILITY.ELEMENT.METAL,
  GameplayTags.ABILITY.ELEMENT.WIND,
  GameplayTags.ABILITY.ELEMENT.ICE,
  GameplayTags.ABILITY.ELEMENT.THUNDER,
] as const;

export function labelGameplayTag(tag: string): string {
  return GAMEPLAY_TAG_LABELS[tag] ?? tag.split('.').pop() ?? tag;
}

export function labelGameplayTags(tags: string[] | undefined): string[] {
  return Array.from(new Set(tags ?? [])).map(labelGameplayTag);
}

export function labelDamageType(damageType?: DamageType | string): string {
  if (!damageType) return '伤害';
  return DAMAGE_TYPE_LABELS[damageType] ?? damageType;
}

export function inferDamageTypeLabels(args: {
  abilityTags?: string[];
  buffTags?: string[];
  explicitDamageType?: DamageType;
}): string[] {
  const { abilityTags = [], buffTags = [], explicitDamageType } = args;
  if (explicitDamageType) return [labelDamageType(explicitDamageType)];
  if (buffTags.includes(GameplayTags.BUFF.DOT.ROOT)) {
    return [labelDamageType(DamageType.DOT)];
  }

  const channel = DAMAGE_CHANNEL_TAGS.find((tag) => abilityTags.includes(tag));
  const element = ELEMENT_TAGS.find((tag) => abilityTags.includes(tag));
  const labels = [element ? labelGameplayTag(element) : '', channel ? labelGameplayTag(channel) : '']
    .filter(Boolean);

  return labels.length > 0 ? [`${labels.join('')}伤害`] : ['伤害'];
}

export function labelTagList(tags: string[] | undefined): string {
  return labelGameplayTags(tags).join('、');
}
