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
        countsTowardLongTermQuota: false,
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
});
