import { describe, expect, it } from 'vitest';
import { composeProductFromAffixIds } from '@shared/engine/creation-v2/composeProductFromAffixIds';
import {
  deserializeAndRehydrate,
  serializeProductModel,
} from '@shared/engine/creation-v2/persistence/ProductPersistenceMapper';

describe('ProductRehydrator', () => {
  it('rebuilds skill battleProjection from productModel only', () => {
    const model = composeProductFromAffixIds({
      productType: 'skill',
      element: '火',
      name: '赤炎术',
      affixIds: ['skill-core-damage-fire'],
    });

    const serialized = serializeProductModel(model);

    expect(serialized).not.toHaveProperty('battleProjection');
    expect(serialized).not.toHaveProperty('projectionAnchor');
    expect(serialized).toHaveProperty('projectionBasisEnergy');

    const rehydrated = deserializeAndRehydrate(serialized);

    expect(rehydrated.productType).toBe('skill');
    expect(rehydrated.battleProjection).toMatchObject({
      mpCost: model.battleProjection.mpCost,
      cooldown: model.battleProjection.cooldown,
      priority: model.battleProjection.priority,
      targetPolicy: model.battleProjection.targetPolicy,
      abilityTags: model.battleProjection.abilityTags,
    });
    expect(rehydrated.battleProjection.effects).toHaveLength(
      model.battleProjection.effects.length,
    );
  });

  it('preserves enemy pacing context when rebuilding skill battleProjection', () => {
    const model = composeProductFromAffixIds({
      productType: 'skill',
      element: '火',
      name: '赤炎袭',
      affixIds: ['skill-core-damage-fire'],
      realm: '金丹',
      realmStage: '后期',
      projectionContext: {
        ownerKind: 'enemy',
        difficulty: 95,
        role: 'offense',
        paceProfile: 'aggressive',
      },
    });

    const serialized = serializeProductModel(model);
    expect(serialized).toHaveProperty('projectionPacingContext');

    const rehydrated = deserializeAndRehydrate(serialized);

    expect(rehydrated.productType).toBe('skill');
    expect(rehydrated.battleProjection).toMatchObject({
      mpCost: model.battleProjection.mpCost,
      cooldown: model.battleProjection.cooldown,
      priority: model.battleProjection.priority,
    });
  });

  it('rehydrates legacy skill models without pacing context', () => {
    const model = composeProductFromAffixIds({
      productType: 'skill',
      element: '火',
      name: '旧版赤炎术',
      affixIds: ['skill-core-damage-fire'],
    });
    const serialized = serializeProductModel(model);
    delete serialized.projectionPacingContext;

    expect(() => deserializeAndRehydrate(serialized)).not.toThrow();
    const rehydrated = deserializeAndRehydrate(serialized);
    expect(rehydrated.productType).toBe('skill');
    expect(rehydrated.battleProjection.mpCost).toBeGreaterThan(0);
  });

  it('ignores legacy skill projectionAnchor when rebuilding mpCost', () => {
    const model = composeProductFromAffixIds({
      productType: 'skill',
      element: '火',
      name: '旧版锚点赤炎术',
      affixIds: ['skill-core-damage-fire'],
      realm: '炼气',
      realmStage: '初期',
    });
    const serialized = serializeProductModel(model) as Record<string, unknown>;
    serialized.projectionAnchor = {
      realm: '渡劫',
      realmStage: '圆满',
    };

    const rehydrated = deserializeAndRehydrate(serialized);

    expect(rehydrated.productType).toBe('skill');
    expect(rehydrated).not.toHaveProperty('projectionAnchor');
    expect(rehydrated.battleProjection.mpCost).toBe(
      model.battleProjection.mpCost,
    );
  });
});
