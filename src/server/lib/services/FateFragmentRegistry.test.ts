import { describe, expect, it } from 'vitest';
import {
  buildFateEffectEntry,
  buildFallbackFateName,
  getNegativeFateEffects,
  getPositiveFateEffects,
} from './FateFragmentRegistry';

function getPositiveEffect(effectId: string) {
  const effect = getPositiveFateEffects().find((item) => item.id === effectId);
  if (!effect) {
    throw new Error(`Missing positive fate effect: ${effectId}`);
  }
  return effect;
}

function getNegativeEffect(effectId: string) {
  const effect = getNegativeFateEffects().find((item) => item.id === effectId);
  if (!effect) {
    throw new Error(`Missing negative fate effect: ${effectId}`);
  }
  return effect;
}

describe('FateFragmentRegistry', () => {
  it('rolls different persisted values for the same quality and effect within range', () => {
    const definition = getPositiveEffect('retreat-exp-gain');
    const lowRoll = buildFateEffectEntry(definition, '真品', () => 0);
    const highRoll = buildFateEffectEntry(definition, '真品', () => 0.999999);

    expect(lowRoll.value).toBeGreaterThanOrEqual(lowRoll.rollMeta.minValue);
    expect(highRoll.value).toBeLessThanOrEqual(highRoll.rollMeta.maxValue);
    expect(lowRoll.value).not.toBe(highRoll.value);
    expect(lowRoll.rollMeta.roundingStep).toBe(0.01);
  });

  it('scales stronger with higher quality while keeping breakthrough granularity', () => {
    const retreatDefinition = getPositiveEffect('retreat-exp-gain');
    const mortalRoll = buildFateEffectEntry(retreatDefinition, '凡品', () => 0.5);
    const divineRoll = buildFateEffectEntry(retreatDefinition, '神品', () => 0.5);

    expect(divineRoll.value).toBeGreaterThan(mortalRoll.value);

    const breakthroughDefinition = getNegativeEffect('breakthrough-stumble');
    const breakthroughRoll = buildFateEffectEntry(
      breakthroughDefinition,
      '天品',
      () => 0.5,
    );

    expect(breakthroughRoll.rollMeta.roundingStep).toBe(0.001);
    expect(breakthroughRoll.value).toBeLessThan(0);
  });

  it('builds fallback names as 4-5 character fate-style labels', () => {
    expect(
      buildFallbackFateName(
        getPositiveEffect('retreat-insight-gain'),
        '凡品',
      ),
    ).toBe('凡品澄照台');
    expect(
      buildFallbackFateName(
        getNegativeEffect('toxicity-burden'),
        '仙品',
      ),
    ).toBe('仙品郁毒心');

    expect(
      buildFallbackFateName(
        getPositiveEffect('retreat-insight-gain'),
        '凡品',
      ),
    ).toMatch(/^[\u4e00-\u9fff]{4,5}$/);
    expect(
      buildFallbackFateName(
        getNegativeEffect('toxicity-burden'),
        '仙品',
      ),
    ).toMatch(/^[\u4e00-\u9fff]{4,5}$/);
  });
});
