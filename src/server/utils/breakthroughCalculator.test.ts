import { describe, expect, it } from 'vitest';
import type { Cultivator } from '@shared/types/cultivator';
import { calculateBreakthroughChance } from './breakthroughCalculator';

function createCultivator(pillToxicity: number): Cultivator {
  return {
    id: 'cultivator-1',
    name: '韩立',
    title: null,
    gender: '男',
    realm: '筑基',
    realm_stage: '中期',
    age: 60,
    lifespan: 300,
    status: 'active',
    attributes: {
      vitality: 60,
      spirit: 64,
      wisdom: 70,
      speed: 52,
      willpower: 58,
    },
    spiritual_roots: [{ element: '木', strength: 85, grade: '真灵根' }],
    pre_heaven_fates: [],
    cultivations: [],
    skills: [],
    inventory: {
      artifacts: [],
      consumables: [],
      materials: [],
    },
    equipped: {
      weapon: null,
      armor: null,
      accessory: null,
    },
    max_skills: 4,
    spirit_stones: 0,
    cultivation_progress: {
      cultivation_exp: 84,
      exp_cap: 100,
      comprehension_insight: 72,
      breakthrough_failures: 0,
      bottleneck_state: true,
      inner_demon: false,
      deviation_risk: 0,
    },
    condition: {
      version: 1,
      resources: {
        hp: { current: 500 },
        mp: { current: 420 },
      },
      gauges: {
        pillToxicity,
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
      timestamps: {},
    },
  };
}

describe('calculateBreakthroughChance', () => {
  it('treats pill toxicity as a breakthrough penalty', () => {
    const clean = calculateBreakthroughChance(createCultivator(0));
    const toxic = calculateBreakthroughChance(createCultivator(180));

    expect(clean.modifiers.toxicityPenalty).toBe(0);
    expect(toxic.modifiers.toxicityPenalty).toBe(0.18);
    expect(toxic.chance).toBeLessThan(clean.chance);
  });
});
