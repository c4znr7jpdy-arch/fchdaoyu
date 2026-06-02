import { describe, expect, it } from 'vitest';
import { calculateCultivationExpByCap } from './cultivationExpGain';

describe('calculateCultivationExpByCap', () => {
  it('calculates cap percent units with floor rounding by default', () => {
    const result = calculateCultivationExpByCap({
      cap: 1_000,
      percent: 0.015,
      units: 3,
    });

    expect(result.baseExp).toBe(45);
    expect(result.rawExp).toBe(45);
    expect(result.trace.rounding).toBe('floor');
  });

  it('supports ceil and round modes', () => {
    expect(
      calculateCultivationExpByCap({
        cap: 100,
        percent: 0.015,
        rounding: 'ceil',
      }).baseExp,
    ).toBe(2);

    expect(
      calculateCultivationExpByCap({
        cap: 100,
        percent: 0.015,
        rounding: 'round',
      }).baseExp,
    ).toBe(2);
  });

  it('applies minBaseExp only for positive raw gains', () => {
    expect(
      calculateCultivationExpByCap({
        cap: 10,
        percent: 0.01,
        minBaseExp: 1,
      }).baseExp,
    ).toBe(1);

    expect(
      calculateCultivationExpByCap({
        cap: 10,
        percent: 0,
        minBaseExp: 1,
      }).baseExp,
    ).toBe(0);
  });

  it('applies maxBaseExp after rounding and min', () => {
    const result = calculateCultivationExpByCap({
      cap: 10_000,
      percent: 0.5,
      maxBaseExp: 200,
    });

    expect(result.baseExp).toBe(200);
  });

  it('clamps negative cap percent and units to zero', () => {
    expect(
      calculateCultivationExpByCap({
        cap: -1_000,
        percent: 0.1,
      }).baseExp,
    ).toBe(0);

    expect(
      calculateCultivationExpByCap({
        cap: 1_000,
        percent: -0.1,
      }).baseExp,
    ).toBe(0);

    expect(
      calculateCultivationExpByCap({
        cap: 1_000,
        percent: 0.1,
        units: -1,
      }).baseExp,
    ).toBe(0);
  });

  it('rejects non-finite numeric inputs', () => {
    expect(() =>
      calculateCultivationExpByCap({
        cap: Number.POSITIVE_INFINITY,
        percent: 0.1,
      }),
    ).toThrow('cap');

    expect(() =>
      calculateCultivationExpByCap({
        cap: 1_000,
        percent: Number.NaN,
      }),
    ).toThrow('percent');

    expect(() =>
      calculateCultivationExpByCap({
        cap: 1_000,
        percent: 0.1,
        units: Number.NEGATIVE_INFINITY,
      }),
    ).toThrow('units');
  });
});
