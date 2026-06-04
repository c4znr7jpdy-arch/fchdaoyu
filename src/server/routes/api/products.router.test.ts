import { Hono } from 'hono';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

vi.mock('@server/lib/hono/middleware', () => ({
  requireActiveCultivator:
    () => async (context: any, next: () => Promise<void>) => {
      context.set('cultivator', {
        id: 'cultivator-1',
        max_skills: 2,
      });
      await next();
    },
}));

vi.mock('@server/lib/repositories/creationProductRepository', () => ({
  countEquippedByType: vi.fn(),
  equipArtifact: vi.fn(),
  findById: vi.fn(),
  findByTypeAndCultivator: vi.fn(),
  findEquippedArtifacts: vi.fn(),
  setProductEquipped: vi.fn(),
  unequipArtifact: vi.fn(),
}));

import * as creationProductRepository from '@server/lib/repositories/creationProductRepository';
import productsRouter from './products.router';

const findByIdMock = creationProductRepository.findById as unknown as Mock;
const countEquippedByTypeMock =
  creationProductRepository.countEquippedByType as unknown as Mock;
const setProductEquippedMock =
  creationProductRepository.setProductEquipped as unknown as Mock;
const equipArtifactMock =
  creationProductRepository.equipArtifact as unknown as Mock;
const unequipArtifactMock =
  creationProductRepository.unequipArtifact as unknown as Mock;

function createApp() {
  return new Hono().route('/api/v2/products', productsRouter);
}

describe('products router equip toggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects enabling a skill when the effective skill limit is full', async () => {
    findByIdMock.mockResolvedValueOnce({
      id: '11111111-1111-4111-8111-111111111111',
      cultivatorId: 'cultivator-1',
      productType: 'skill',
      isEquipped: false,
    });
    countEquippedByTypeMock.mockResolvedValueOnce(2);

    const response = await createApp().request('/api/v2/products/equip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: '11111111-1111-4111-8111-111111111111',
      }),
    });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: '神通启用数量已达上限，请先停用旧项',
    });
    expect(setProductEquippedMock).not.toHaveBeenCalled();
  });

  it('disables an already enabled gongfa', async () => {
    findByIdMock.mockResolvedValueOnce({
      id: '22222222-2222-4222-8222-222222222222',
      cultivatorId: 'cultivator-1',
      productType: 'gongfa',
      isEquipped: true,
    });

    const response = await createApp().request('/api/v2/products/equip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: '22222222-2222-4222-8222-222222222222',
      }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      equipped: false,
    });
    expect(setProductEquippedMock).toHaveBeenCalledWith(
      '22222222-2222-4222-8222-222222222222',
      false,
    );
  });

  it('keeps artifact equip behavior slot-aware', async () => {
    findByIdMock.mockResolvedValueOnce({
      id: '33333333-3333-4333-8333-333333333333',
      cultivatorId: 'cultivator-1',
      productType: 'artifact',
      slot: 'weapon',
      isEquipped: false,
    });

    const response = await createApp().request('/api/v2/products/equip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: '33333333-3333-4333-8333-333333333333',
      }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      equipped: true,
    });
    expect(equipArtifactMock).toHaveBeenCalledWith(
      '33333333-3333-4333-8333-333333333333',
      'cultivator-1',
      'weapon',
    );
    expect(unequipArtifactMock).not.toHaveBeenCalled();
  });
});
