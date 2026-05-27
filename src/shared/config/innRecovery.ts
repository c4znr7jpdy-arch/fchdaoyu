import { scaleFateAdjustedValue } from '@shared/lib/fates';

export const INN_RECOVERY_SPIRIT_STONE_COST = 5000;
export const INN_RECOVERY_LOSS_PERCENT_MIN = 5;
export const INN_RECOVERY_LOSS_PERCENT_MAX = 10;

export function calculateInnRecoverySpiritStoneCost(
  multiplier = 1,
): number {
  return scaleFateAdjustedValue(INN_RECOVERY_SPIRIT_STONE_COST, multiplier);
}

export function calculateInnRecoveryLossAmount(
  cultivationExp: number,
  lossPercent: number,
  multiplier = 1,
): number {
  return scaleFateAdjustedValue(
    Math.max(0, cultivationExp) * (lossPercent / 100),
    multiplier,
  );
}

export function calculateInnRecoveryLossRange(
  cultivationExp: number,
  multiplier = 1,
) {
  return {
    min: calculateInnRecoveryLossAmount(
      cultivationExp,
      INN_RECOVERY_LOSS_PERCENT_MIN,
      multiplier,
    ),
    max: calculateInnRecoveryLossAmount(
      cultivationExp,
      INN_RECOVERY_LOSS_PERCENT_MAX,
      multiplier,
    ),
  };
}

export function rollInnRecoveryLossPercent(rng: () => number = Math.random) {
  const span =
    INN_RECOVERY_LOSS_PERCENT_MAX - INN_RECOVERY_LOSS_PERCENT_MIN + 1;
  return INN_RECOVERY_LOSS_PERCENT_MIN + Math.floor(rng() * span);
}
