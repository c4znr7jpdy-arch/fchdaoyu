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
});
