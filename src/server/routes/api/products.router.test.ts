import { Hono } from 'hono';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { composeProductFromAffixIds } from '@shared/engine/creation-v2/composeProductFromAffixIds';
import { serializeProductModel } from '@shared/engine/creation-v2/persistence/ProductPersistenceMapper';

const {
  findByTypeAndCultivatorMock,
  findEquippedArtifactsMock,
  findByIdMock,
} = vi.hoisted(() => ({
  findByTypeAndCultivatorMock: vi.fn(),
  findEquippedArtifactsMock: vi.fn(),
  findByIdMock: vi.fn(),
}));

vi.mock('@server/lib/hono/middleware', () => ({
  requireActiveCultivator:
    () => async (context: any, next: () => Promise<void>) => {
      context.set('cultivator', { id: 'cultivator-1' });
      await next();
    },
}));

vi.mock('@server/lib/repositories/creationProductRepository', () => ({
  findByTypeAndCultivator: findByTypeAndCultivatorMock,
  findEquippedArtifacts: findEquippedArtifactsMock,
  findById: findByIdMock,
  equipArtifact: vi.fn(),
  unequipArtifact: vi.fn(),
}));

import productsRouter from './products.router';

function createApp() {
  return new Hono().route('/api/v2/products', productsRouter);
}

describe('products router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rehydrates stored productModel before returning product lists', async () => {
    const model = composeProductFromAffixIds({
      productType: 'skill',
      element: '火',
      name: '赤炎术',
      affixIds: ['skill-core-damage-fire'],
    });

    findByTypeAndCultivatorMock.mockResolvedValue([
      {
        id: 'product-1',
        cultivatorId: 'cultivator-1',
        productType: 'skill',
        name: '赤炎术',
        description: null,
        element: '火',
        quality: '凡品',
        slot: null,
        score: 18,
        isEquipped: false,
        productModel: serializeProductModel(model),
      },
    ]);

    const response = await createApp().request('/api/v2/products?type=skill');
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data[0].productModel.battleProjection).toMatchObject({
      mpCost: model.battleProjection.mpCost,
      cooldown: model.battleProjection.cooldown,
      priority: model.battleProjection.priority,
      targetPolicy: model.battleProjection.targetPolicy,
    });
  });
});
