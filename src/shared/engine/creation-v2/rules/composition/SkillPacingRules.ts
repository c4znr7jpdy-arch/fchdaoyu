import { GameplayTags } from '@shared/engine/shared/tag-domain';
import { REALM_STAGE_CAPS, type RealmStage, type RealmType } from '@shared/types/constants';
import {
  CREATION_PROJECTION_BALANCE,
  CREATION_SKILL_DEFAULTS,
} from '../../config/CreationBalance';
import type { EffectConfig, ListenerConfig } from '../../contracts/battle';
import { BuffType } from '../../contracts/battle';
import type {
  CreationSkillProjectionContext,
  RolledAffix,
} from '../../types';
import type { CompositionEnergySummary } from '../contracts/CompositionFacts';
import type { ProjectionQualityProfile } from '../../analysis/ProjectionQualityProfile';

export interface SkillPacingInput {
  coreType: string;
  abilityTags: string[];
  effects: EffectConfig[];
  listeners?: ListenerConfig[];
  affixes: RolledAffix[];
  energySummary: CompositionEnergySummary;
  projectionQualityProfile: ProjectionQualityProfile;
  anchorRealm?: RealmType;
  anchorRealmStage?: RealmStage;
  projectionContext?: CreationSkillProjectionContext;
}

export interface SkillPacingResult {
  cooldown: number;
  mpCost: number;
  priority: number;
  traceMessage: string;
}

type SkillPacingRole = NonNullable<CreationSkillProjectionContext['role']>;

const ROLE_COOLDOWN_LIMITS: Record<SkillPacingRole, { min: number; max: number }> = {
  offense: { min: 2, max: 5 },
  control: { min: 2, max: 5 },
  guard: { min: 3, max: 6 },
  sustain: { min: 3, max: 6 },
};

const ROLE_MP_RATIO_BASE: Record<SkillPacingRole, number> = {
  offense: 0.1,
  control: 0.12,
  guard: 0.11,
  sustain: 0.14,
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function roundTo10(value: number): number {
  return Math.max(0, Math.round(value / 10) * 10);
}

function collectEffects(
  effects: readonly EffectConfig[],
  listeners: readonly ListenerConfig[] | undefined,
): EffectConfig[] {
  return [
    ...effects,
    ...(listeners ?? []).flatMap((listener) => listener.effects),
  ];
}

function hasAbilityFunction(
  abilityTags: readonly string[],
  tag: string,
): boolean {
  return abilityTags.includes(tag);
}

function isControlBuff(effect: EffectConfig): boolean {
  if (effect.type !== 'apply_buff') return false;
  const buff = effect.params.buffConfig;
  return (
    buff.type === BuffType.CONTROL ||
    (buff.tags ?? []).some((tag) =>
      tag.startsWith(GameplayTags.BUFF.TYPE.CONTROL) ||
      tag.startsWith(GameplayTags.STATUS.CONTROL.ROOT) ||
      tag.startsWith(GameplayTags.STATUS.CONTROL.STUNNED),
    )
  );
}

function resolveRole(args: {
  coreType: string;
  abilityTags: readonly string[];
  effects: readonly EffectConfig[];
  projectionContext?: CreationSkillProjectionContext;
}): SkillPacingRole {
  const explicit = args.projectionContext?.role;
  if (explicit) return explicit;

  if (args.coreType === 'heal') return 'sustain';
  if (
    hasAbilityFunction(args.abilityTags, GameplayTags.ABILITY.FUNCTION.CONTROL) ||
    args.effects.some(isControlBuff)
  ) {
    return 'control';
  }
  if (
    args.coreType === 'apply_buff' ||
    args.coreType === 'shield' ||
    hasAbilityFunction(args.abilityTags, GameplayTags.ABILITY.FUNCTION.BUFF)
  ) {
    return 'guard';
  }
  return 'offense';
}

function resolveBaseCooldown(role: SkillPacingRole): number {
  return role === 'guard' || role === 'sustain'
    ? CREATION_SKILL_DEFAULTS.buffCooldown
    : CREATION_SKILL_DEFAULTS.damageCooldown;
}

function resolveQualityCooldownAdd(qualityOrder: number): number {
  if (qualityOrder >= 5) return 2;
  if (qualityOrder >= 3) return 1;
  return 0;
}

function resolveMinMpCost(
  anchorRealm: RealmType | undefined,
  anchorRealmStage: RealmStage | undefined,
): number {
  if (!anchorRealm || !anchorRealmStage) {
    return 60;
  }
  const cap = REALM_STAGE_CAPS[anchorRealm][anchorRealmStage];
  return roundTo10(45 + cap * 0.3);
}

function resolveFallbackMpCost(args: {
  energySummary: CompositionEnergySummary;
  qualityOrder: number;
  nonCoreAffixCount: number;
  rareAffixCount: number;
  anchorRealm?: RealmType;
  anchorRealmStage?: RealmStage;
}): number {
  const minMpCost = resolveMinMpCost(args.anchorRealm, args.anchorRealmStage);
  return roundTo10(
    Math.max(
      minMpCost,
      60 +
        args.qualityOrder * 25 +
        args.energySummary.effectiveTotal * 1.2 +
        args.nonCoreAffixCount * 15 +
        args.rareAffixCount * 30,
    ),
  );
}

export function resolveSkillResourceAndCooldown(
  input: SkillPacingInput,
): SkillPacingResult {
  const allEffects = collectEffects(input.effects, input.listeners);
  const role = resolveRole({
    coreType: input.coreType,
    abilityTags: input.abilityTags,
    effects: allEffects,
    projectionContext: input.projectionContext,
  });
  const qualityOrder = input.projectionQualityProfile.qualityOrder;
  const nonCoreAffixCount = input.affixes.filter(
    (affix) => affix.category !== 'skill_core',
  ).length;
  const rareAffixCount = input.affixes.filter(
    (affix) => affix.category === 'skill_rare',
  ).length;
  const hasDamage = hasAbilityFunction(
    input.abilityTags,
    GameplayTags.ABILITY.FUNCTION.DAMAGE,
  );
  const hasHardControl =
    hasAbilityFunction(input.abilityTags, GameplayTags.ABILITY.FUNCTION.CONTROL) ||
    allEffects.some(isControlBuff);
  const healEffectCount = allEffects.filter((effect) => effect.type === 'heal').length;
  const hasDispel = allEffects.some((effect) => effect.type === 'dispel');

  let complexityCooldownAdd = 0;
  if (nonCoreAffixCount >= 2) complexityCooldownAdd += 1;
  if (hasHardControl && hasDamage) {
    complexityCooldownAdd += 1;
  }
  if (healEffectCount > 1 || (healEffectCount > 0 && hasDispel)) {
    complexityCooldownAdd += 1;
  }

  const limits = ROLE_COOLDOWN_LIMITS[role];
  const cooldown = clamp(
    resolveBaseCooldown(role) +
      complexityCooldownAdd +
      resolveQualityCooldownAdd(qualityOrder),
    limits.min,
    limits.max,
  );

  const ratioCap = role === 'guard' || role === 'sustain' ? 0.24 : 0.2;
  const paceModifier =
    input.projectionContext?.paceProfile === 'aggressive'
      ? -0.015
      : input.projectionContext?.paceProfile === 'sustain'
        ? 0.01
        : 0;
  const mpRatio = clamp(
    ROLE_MP_RATIO_BASE[role] +
      qualityOrder * 0.01 +
      nonCoreAffixCount * 0.015 +
      rareAffixCount * 0.03 +
      paceModifier,
    0.06,
    ratioCap,
  );
  const estimatedMaxMp = input.projectionContext?.estimatedMaxMp;
  const mpCost =
    estimatedMaxMp && Number.isFinite(estimatedMaxMp) && estimatedMaxMp > 0
      ? roundTo10(
          Math.max(
            resolveMinMpCost(input.anchorRealm, input.anchorRealmStage),
            estimatedMaxMp * mpRatio,
          ),
        )
      : resolveFallbackMpCost({
          energySummary: input.energySummary,
          qualityOrder,
          nonCoreAffixCount,
          rareAffixCount,
          anchorRealm: input.anchorRealm,
          anchorRealmStage: input.anchorRealmStage,
        });

  const priority =
    CREATION_PROJECTION_BALANCE.skillPriorityBase + input.affixes.length;

  return {
    cooldown,
    mpCost,
    priority,
    traceMessage:
      `skill pacing: role=${role}, cooldown=${cooldown}, mpCost=${mpCost}, ` +
      `mpRatio=${mpRatio.toFixed(3)}, nonCore=${nonCoreAffixCount}, rare=${rareAffixCount}`,
  };
}
