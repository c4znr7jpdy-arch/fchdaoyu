import { describe, expect, it } from 'vitest';
import {
  buildTowerBlessingChoices,
  packTowerLeaderboardScore,
  resolveTowerFloorKind,
  resolveTowerMilestoneTier,
  resolveTowerRealmStage,
  unpackTowerLeaderboardScore,
} from './helpers';
import { getTowerBlessingEffectPreview } from './presentation';

describe('tower helpers', () => {
  it('maps floor kinds and realm stages deterministically', () => {
    expect(resolveTowerFloorKind(1)).toBe('normal');
    expect(resolveTowerFloorKind(5)).toBe('elite');
    expect(resolveTowerFloorKind(10)).toBe('boss');
    expect(resolveTowerFloorKind(100)).toBe('boss');

    expect(resolveTowerRealmStage(1)).toBe('初期');
    expect(resolveTowerRealmStage(4)).toBe('中期');
    expect(resolveTowerRealmStage(7)).toBe('后期');
    expect(resolveTowerRealmStage(10)).toBe('圆满');
    expect(resolveTowerRealmStage(11)).toBe('初期');
  });

  it('maps milestone tiers by boss floor', () => {
    expect(resolveTowerMilestoneTier(10)).toBe('C');
    expect(resolveTowerMilestoneTier(40)).toBe('B');
    expect(resolveTowerMilestoneTier(70)).toBe('A');
    expect(resolveTowerMilestoneTier(100)).toBe('S');
    expect(resolveTowerMilestoneTier(35)).toBeNull();
  });

  it('forces recovery blessings when hp or mp is low', () => {
    const choices = buildTowerBlessingChoices({
      runId: 'run-1',
      clearedFloor: 18,
      blessings: {
        vitality_surge: 5,
      },
      currentHp: 40,
      maxHp: 100,
      currentMp: 20,
      maxMp: 100,
    });

    expect(choices.map((choice) => choice.id)).toContain('breathing_technique');
    expect(choices.map((choice) => choice.id)).toContain('meridian_cycle');
    expect(choices.length).toBeLessThanOrEqual(3);
  });

  it('projects blessing effect previews with concrete recovery values', () => {
    expect(
      getTowerBlessingEffectPreview({
        blessingId: 'breathing_technique',
        currentStacks: 2,
        nextStacks: 3,
        currentHp: 120,
        maxHp: 320,
      }),
    ).toEqual({
      currentLabel: '战前回复 20% 缺失气血（约 40 点）',
      nextLabel: '战前回复 30% 缺失气血（约 60 点）',
      formulaLabel: '公式：每层战前回复 10% 缺失气血。 上限 3 层。',
    });

    expect(
      getTowerBlessingEffectPreview({
        blessingId: 'balanced_dao',
        currentStacks: 1,
        nextStacks: 2,
      }),
    ).toEqual({
      currentLabel: '五维主属性 +5%',
      nextLabel: '五维主属性 +10%',
      formulaLabel: '公式：每层五维主属性同步 +5%。 上限 3 层。',
    });
  });

  it('packs and unpacks leaderboard scores while preserving rank tie ordering', () => {
    const seasonEndAtMs = Date.parse('2026-06-07T16:00:00.000Z');
    const earlier = packTowerLeaderboardScore(
      37,
      Date.parse('2026-06-02T12:00:00.000Z'),
      seasonEndAtMs,
    );
    const later = packTowerLeaderboardScore(
      37,
      Date.parse('2026-06-03T12:00:00.000Z'),
      seasonEndAtMs,
    );

    expect(earlier).toBeGreaterThan(later);
    expect(unpackTowerLeaderboardScore(earlier, seasonEndAtMs)).toEqual({
      highestFloor: 37,
      firstReachedAtMs: Date.parse('2026-06-02T12:00:00.000Z'),
    });
  });
});
