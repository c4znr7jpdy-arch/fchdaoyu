export type CultivationExpRounding = 'floor' | 'ceil' | 'round';

export interface CultivationExpCalculationInput {
  cap: number;
  percent: number;
  units?: number;
  rounding?: CultivationExpRounding;
  minBaseExp?: number;
  maxBaseExp?: number;
}

export interface CultivationExpCalculationTrace {
  cap: number;
  percent: number;
  units: number;
  rawExp: number;
  roundedExp: number;
  rounding: CultivationExpRounding;
  minBaseExp?: number;
  maxBaseExp?: number;
}

export interface CultivationExpCalculation {
  baseExp: number;
  rawExp: number;
  trace: CultivationExpCalculationTrace;
}

function assertFiniteNumber(name: string, value: number): void {
  if (!Number.isFinite(value)) {
    throw new Error(`修为收益计算参数 ${name} 必须是有限数字: ${value}`);
  }
}

function roundExp(value: number, rounding: CultivationExpRounding): number {
  switch (rounding) {
    case 'ceil':
      return Math.ceil(value);
    case 'round':
      return Math.round(value);
    case 'floor':
      return Math.floor(value);
  }
}

/**
 * 纯修为收益计算核心。
 *
 * 只负责 cap × percent × units 的数学计算，不认识场景、境界、品质、
 * 评级、危险度、命格或任何业务倍率。
 */
export function calculateCultivationExpByCap(
  input: CultivationExpCalculationInput,
): CultivationExpCalculation {
  const units = input.units ?? 1;
  const rounding = input.rounding ?? 'floor';

  assertFiniteNumber('cap', input.cap);
  assertFiniteNumber('percent', input.percent);
  assertFiniteNumber('units', units);

  if (input.minBaseExp !== undefined) {
    assertFiniteNumber('minBaseExp', input.minBaseExp);
  }
  if (input.maxBaseExp !== undefined) {
    assertFiniteNumber('maxBaseExp', input.maxBaseExp);
  }

  const safeCap = Math.max(0, input.cap);
  const safePercent = Math.max(0, input.percent);
  const safeUnits = Math.max(0, units);
  const rawExp = safeCap * safePercent * safeUnits;
  const roundedExp = roundExp(rawExp, rounding);

  let baseExp = roundedExp;
  if (rawExp > 0 && input.minBaseExp !== undefined) {
    baseExp = Math.max(baseExp, input.minBaseExp);
  }
  if (input.maxBaseExp !== undefined) {
    baseExp = Math.min(baseExp, input.maxBaseExp);
  }

  return {
    baseExp: Math.max(0, Math.floor(baseExp)),
    rawExp,
    trace: {
      cap: safeCap,
      percent: safePercent,
      units: safeUnits,
      rawExp,
      roundedExp,
      rounding,
      minBaseExp: input.minBaseExp,
      maxBaseExp: input.maxBaseExp,
    },
  };
}
