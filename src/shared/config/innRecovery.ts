export const INN_RECOVERY_SPIRIT_STONE_COST = 5000;
export const INN_RECOVERY_LOSS_PERCENT_MIN = 5;
export const INN_RECOVERY_LOSS_PERCENT_MAX = 10;

export function calculateInnRecoveryLossAmount(
  cultivationExp: number,
  lossPercent: number,
): number {
  return Math.floor(Math.max(0, cultivationExp) * (lossPercent / 100));
}

export function calculateInnRecoveryLossRange(cultivationExp: number) {
  return {
    min: calculateInnRecoveryLossAmount(
      cultivationExp,
      INN_RECOVERY_LOSS_PERCENT_MIN,
    ),
    max: calculateInnRecoveryLossAmount(
      cultivationExp,
      INN_RECOVERY_LOSS_PERCENT_MAX,
    ),
  };
}

export function rollInnRecoveryLossPercent(rng: () => number = Math.random) {
  const span =
    INN_RECOVERY_LOSS_PERCENT_MAX - INN_RECOVERY_LOSS_PERCENT_MIN + 1;
  return INN_RECOVERY_LOSS_PERCENT_MIN + Math.floor(rng() * span);
}
