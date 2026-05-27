import { describe, expect, it } from 'vitest';
import { composeProductFromAffixIds } from '@shared/engine/creation-v2/composeProductFromAffixIds';
import { serializeProductModel } from '@shared/engine/creation-v2/persistence/ProductPersistenceMapper';
import { toProductDisplayModel } from './abilityDisplay';

describe('abilityDisplay', () => {
  it('rehydrates stored productModel before building display state', () => {
    const model = composeProductFromAffixIds({
      productType: 'skill',
      element: '火',
      name: '赤炎术',
      affixIds: ['skill-core-damage-fire'],
    });

    const displayModel = toProductDisplayModel({
      name: model.name,
      productType: model.productType,
      element: '火',
      quality: model.projectionQuality,
      score: 18,
      productModel: serializeProductModel(model),
    });

    expect(displayModel.projection).toMatchObject({
      mpCost: model.battleProjection.mpCost,
      cooldown: model.battleProjection.cooldown,
      priority: model.battleProjection.priority,
      targetPolicy: model.battleProjection.targetPolicy,
    });
    expect(displayModel.affixes).toHaveLength(model.affixes.length);
  });

  it('tolerates legacy productModel payloads without productType', () => {
    const displayModel = toProductDisplayModel({
      name: '旧法宝',
      productType: 'artifact',
      quality: '凡品',
      score: 0,
      productModel: {
        affixes: [],
      },
    });

    expect(displayModel.name).toBe('旧法宝');
    expect(displayModel.productType).toBe('artifact');
    expect(displayModel.projection).toBeUndefined();
    expect(displayModel.affixes).toEqual([]);
  });
});
