import { describe, expect, it } from 'vitest';
import {
  getBreakthroughPenaltyPercent,
  getNaturalRecoveryEstimate,
  getNaturalRecoveryStatusMultiplier,
  getPillToxicityRecoveryMultiplier,
} from './condition';
import type { CultivatorCondition } from '@shared/types/condition';

function createCondition(): CultivatorCondition {
  return {
    version: 1,
    resources: {
      hp: { current: 200 },
      mp: { current: 150 },
    },
    gauges: {
      pillToxicity: 0,
    },
    tracks: {
      tempering: {
        vitality: { level: 0, progress: 0 },
        spirit: { level: 0, progress: 0 },
        wisdom: { level: 0, progress: 0 },
        speed: { level: 0, progress: 0 },
        willpower: { level: 0, progress: 0 },
      },
      marrowWash: { level: 0, progress: 0 },
    },
    counters: {
      longTermPillUsesByRealm: {},
    },
    statuses: [],
    timestamps: {
      lastRecoveryAt: '2026-05-25T00:00:00.000Z',
    },
  };
}

describe('condition recovery helpers', () => {
  it('estimates base natural recovery from current max resource', () => {
    const condition = createCondition();

    const estimate = getNaturalRecoveryEstimate({
      resource: 'hp',
      current: 200,
      max: 1000,
      conditionInput: condition,
      now: new Date('2026-05-25T12:00:00.000Z'),
    });

    expect(estimate.perHour).toBe(280);
    expect(estimate.timeToFullMs).toBe(10285715);
    expect(estimate.isFull).toBe(false);
  });

  it('applies wound and toxicity penalties to recovery speed', () => {
    const condition = createCondition();
    condition.gauges.pillToxicity = 180;
    condition.statuses = [
      {
        key: 'minor_wound',
        stacks: 1,
        source: 'battle',
        duration: { kind: 'until_removed' },
        createdAt: '2026-05-25T00:00:00.000Z',
        updatedAt: '2026-05-25T00:00:00.000Z',
      },
    ];

    const multiplier = getNaturalRecoveryStatusMultiplier(
      condition,
      new Date('2026-05-25T12:00:00.000Z'),
    );
    const estimate = getNaturalRecoveryEstimate({
      resource: 'hp',
      current: 200,
      max: 1000,
      conditionInput: condition,
      now: new Date('2026-05-25T12:00:00.000Z'),
    });

    expect(multiplier).toBe(0.88);
    expect(estimate.perHour).toBeCloseTo(73.92);
    expect(estimate.timeToFullMs).toBe(38961039);
  });

  it('derives player-facing toxicity recovery and breakthrough penalties', () => {
    const condition = createCondition();
    condition.gauges.pillToxicity = 12;

    expect(getPillToxicityRecoveryMultiplier(condition)).toBeCloseTo(
      0.9333333333,
    );
    expect(getBreakthroughPenaltyPercent(condition)).toBe(1.2);
  });
});
