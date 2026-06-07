import { z } from 'zod';

export const BATTLE_ABILITY_STRATEGY_MODES = [
  'balanced',
  'aggressive',
  'conservative',
] as const;

export type BattleAbilityStrategyMode =
  (typeof BATTLE_ABILITY_STRATEGY_MODES)[number];

export const BattleAbilityStrategyModeSchema = z.enum(
  BATTLE_ABILITY_STRATEGY_MODES,
);

export const DEFAULT_BATTLE_ABILITY_STRATEGY_SETTINGS = {
  version: 1,
  mode: 'balanced',
  healHpSkipThreshold: 0.85,
  emergencyHealHpThreshold: 0.35,
  restoreMpSkipThreshold: 0.75,
  avoidRepeatControl: true,
} as const satisfies BattleAbilityStrategySettings;

export interface BattleAbilityStrategyWeights {
  damageBase: number;
  damageExecuteScale: number;
  healScale: number;
  emergencyHealBonus: number;
  restoreMpScale: number;
  controlBonus: number;
  controlLowHpPenalty: number;
  buffBonus: number;
  defensiveBase: number;
  defensiveLowHpBonus: number;
  shieldRepeatPenalty: number;
}

export interface BattleAbilityStrategySettings {
  version: 1;
  mode: BattleAbilityStrategyMode;
  healHpSkipThreshold: number;
  emergencyHealHpThreshold: number;
  restoreMpSkipThreshold: number;
  avoidRepeatControl: boolean;
  weights?: Partial<BattleAbilityStrategyWeights>;
}

export interface CultivatorGameSettings {
  battleAbilityStrategy?: BattleAbilityStrategySettings;
}

const ratioSchema = z.number().min(0).max(1);

export const BattleAbilityStrategySettingsSchema = z.object({
  version: z.literal(1).default(1),
  mode: BattleAbilityStrategyModeSchema.default(
    DEFAULT_BATTLE_ABILITY_STRATEGY_SETTINGS.mode,
  ),
  healHpSkipThreshold: ratioSchema.default(
    DEFAULT_BATTLE_ABILITY_STRATEGY_SETTINGS.healHpSkipThreshold,
  ),
  emergencyHealHpThreshold: ratioSchema.default(
    DEFAULT_BATTLE_ABILITY_STRATEGY_SETTINGS.emergencyHealHpThreshold,
  ),
  restoreMpSkipThreshold: ratioSchema.default(
    DEFAULT_BATTLE_ABILITY_STRATEGY_SETTINGS.restoreMpSkipThreshold,
  ),
  avoidRepeatControl: z
    .boolean()
    .default(DEFAULT_BATTLE_ABILITY_STRATEGY_SETTINGS.avoidRepeatControl),
  weights: z
    .object({
      damageBase: z.number().finite().optional(),
      damageExecuteScale: z.number().finite().optional(),
      healScale: z.number().finite().optional(),
      emergencyHealBonus: z.number().finite().optional(),
      restoreMpScale: z.number().finite().optional(),
      controlBonus: z.number().finite().optional(),
      controlLowHpPenalty: z.number().finite().optional(),
      buffBonus: z.number().finite().optional(),
      defensiveBase: z.number().finite().optional(),
      defensiveLowHpBonus: z.number().finite().optional(),
      shieldRepeatPenalty: z.number().finite().optional(),
    })
    .optional(),
});

export const CultivatorGameSettingsSchema = z.object({
  battleAbilityStrategy: BattleAbilityStrategySettingsSchema.optional(),
});

function clampRatio(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function normalizeThresholdOrder(
  settings: BattleAbilityStrategySettings,
): BattleAbilityStrategySettings {
  const healHpSkipThreshold = clampRatio(settings.healHpSkipThreshold);
  const emergencyHealHpThreshold = Math.min(
    healHpSkipThreshold,
    clampRatio(settings.emergencyHealHpThreshold),
  );

  return {
    ...settings,
    healHpSkipThreshold,
    emergencyHealHpThreshold,
    restoreMpSkipThreshold: clampRatio(settings.restoreMpSkipThreshold),
  };
}

export function normalizeBattleAbilityStrategySettings(
  value: unknown,
): BattleAbilityStrategySettings {
  const parsed = BattleAbilityStrategySettingsSchema.safeParse(value);
  if (!parsed.success) {
    return { ...DEFAULT_BATTLE_ABILITY_STRATEGY_SETTINGS };
  }

  return normalizeThresholdOrder(parsed.data);
}

export function normalizeCultivatorGameSettings(
  value: unknown,
): CultivatorGameSettings {
  const parsed = CultivatorGameSettingsSchema.safeParse(value);
  if (!parsed.success) {
    return {};
  }

  return {
    battleAbilityStrategy: parsed.data.battleAbilityStrategy
      ? normalizeBattleAbilityStrategySettings(
          parsed.data.battleAbilityStrategy,
        )
      : undefined,
  };
}
