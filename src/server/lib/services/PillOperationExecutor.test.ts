import { describe, expect, it } from 'vitest';
import { ConditionService } from './ConditionService';
import { PillOperationExecutor } from './PillOperationExecutor';
import type { Consumable, Cultivator } from '@shared/types/cultivator';

function createCultivator(): Cultivator {
  return {
    id: 'c1',
    name: '韩立',
    gender: '男',
    realm: '筑基',
    realm_stage: '初期',
    age: 30,
    lifespan: 180,
    status: 'active',
    attributes: {
      vitality: 40,
      spirit: 36,
      wisdom: 30,
      speed: 28,
      willpower: 32,
    },
    spiritual_roots: [{ element: '木', strength: 80, grade: '真灵根' }],
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
  };
}

function createHealingPill(): Consumable {
  return {
    id: 'pill-1',
    name: '回春丹',
    type: '丹药',
    quality: '真品',
    quantity: 1,
    description: '回补气血。',
    spec: {
      kind: 'pill',
      family: 'healing',
      operations: [
        { type: 'restore_resource', resource: 'hp', mode: 'percent', value: 0.2 },
      ],
      consumeRules: {
        scene: 'out_of_battle_only',
        quotaCategory: 'none',
      },
      alchemyMeta: {
        source: 'improvised',
        sourceMaterials: ['青木芝'],
        dominantElement: '木',
        stability: 72,
        toxicityRating: 8,
        tags: ['healing'],
      },
    },
  };
}

function createCultivationPill(): Consumable {
  return {
    id: 'pill-cultivation',
    name: '养元丹',
    type: '丹药',
    quality: '真品',
    quantity: 1,
    description: '积修养元。',
    spec: {
      kind: 'pill',
      family: 'cultivation',
      operations: [
        { type: 'gain_progress', target: 'cultivation_exp', value: 48 },
      ],
      consumeRules: {
        scene: 'out_of_battle_only',
        quotaCategory: 'cultivation',
      },
      alchemyMeta: {
        source: 'improvised',
        sourceMaterials: ['金霞芝'],
        dominantElement: '金',
        stability: 72,
        toxicityRating: 9,
        tags: ['cultivation'],
      },
    },
  };
}

function createInsightPill(): Consumable {
  return {
    id: 'pill-insight',
    name: '悟心丹',
    type: '丹药',
    quality: '真品',
    quantity: 1,
    description: '启悟明心。',
    spec: {
      kind: 'pill',
      family: 'insight',
      operations: [
        {
          type: 'gain_progress',
          target: 'comprehension_insight',
          value: 12,
        },
      ],
      consumeRules: {
        scene: 'out_of_battle_only',
        quotaCategory: 'none',
      },
      alchemyMeta: {
        source: 'improvised',
        sourceMaterials: ['寒魄晶'],
        dominantElement: '冰',
        stability: 76,
        toxicityRating: 5,
        tags: ['insight'],
      },
    },
  };
}

describe('PillOperationExecutor', () => {
  it('restores percent-based hp from max hp instead of filling to full', () => {
    const cultivator = createCultivator();
    const { maxHp } = ConditionService.getMaxResources(cultivator);
    const now = new Date('2026-05-25T12:00:00.000Z');
    cultivator.condition = {
      ...ConditionService.normalizeCondition(cultivator, undefined, now),
      resources: {
        hp: { current: 1 },
        mp: { current: 100 },
      },
      timestamps: {
        lastRecoveryAt: now.toISOString(),
      },
    };

    const result = PillOperationExecutor.execute(
      cultivator,
      createHealingPill(),
      now,
    );

    expect(result.cultivator.condition?.resources.hp.current).toBe(
      1 + Math.floor(maxHp * 0.2),
    );
    expect(result.cultivator.condition?.resources.hp.current).toBeLessThan(maxHp);
  });

  it('applies cultivation pills to cultivation progress and independent quota counters', () => {
    const cultivator = createCultivator();
    cultivator.cultivation_progress = {
      cultivation_exp: 12,
      exp_cap: 100,
      comprehension_insight: 30,
      breakthrough_failures: 0,
      bottleneck_state: false,
      inner_demon: false,
      deviation_risk: 0,
    };

    const result = PillOperationExecutor.execute(
      cultivator,
      createCultivationPill(),
      new Date('2026-05-25T12:00:00.000Z'),
    );

    expect(result.cultivator.cultivation_progress?.cultivation_exp).toBe(60);
    expect(
      result.cultivator.condition?.counters.cultivationPillUsesByRealm.筑基,
    ).toBe(1);
    expect(
      result.cultivator.condition?.counters.longTermPillUsesByRealm.筑基 ?? 0,
    ).toBe(0);
  });

  it('caps insight gain at 100 without consuming any quota entry', () => {
    const cultivator = createCultivator();
    cultivator.cultivation_progress = {
      cultivation_exp: 20,
      exp_cap: 100,
      comprehension_insight: 95,
      breakthrough_failures: 0,
      bottleneck_state: false,
      inner_demon: false,
      deviation_risk: 0,
    };

    const result = PillOperationExecutor.execute(
      cultivator,
      createInsightPill(),
      new Date('2026-05-25T12:00:00.000Z'),
    );

    expect(result.cultivator.cultivation_progress?.comprehension_insight).toBe(100);
    expect(
      result.cultivator.condition?.counters.cultivationPillUsesByRealm.筑基 ?? 0,
    ).toBe(0);
    expect(
      result.cultivator.condition?.counters.longTermPillUsesByRealm.筑基 ?? 0,
    ).toBe(0);
  });
});
