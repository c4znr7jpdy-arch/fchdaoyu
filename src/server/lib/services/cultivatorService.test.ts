const {
  dbExecutorMock,
  getExecutorMock,
  hasCultivatorOwnershipMock,
  insertMock,
  setMock,
  updateMock,
  whereMock,
} = vi.hoisted(() => ({
  dbExecutorMock: {} as Record<string, unknown>,
  getExecutorMock: vi.fn(),
  hasCultivatorOwnershipMock: vi.fn(),
  insertMock: vi.fn(),
  setMock: vi.fn(),
  updateMock: vi.fn(),
  whereMock: vi.fn(),
}));

vi.mock('@server/lib/drizzle/db', () => ({
  getExecutor: getExecutorMock,
}));

vi.mock('@server/lib/repositories/cultivatorRepository', async () => {
  const actual =
    await vi.importActual<typeof import('@server/lib/repositories/cultivatorRepository')>(
      '@server/lib/repositories/cultivatorRepository',
    );

  return {
    ...actual,
    hasCultivatorOwnership: hasCultivatorOwnershipMock,
  };
});

vi.mock('@server/lib/repositories/creationProductRepository', async () => {
  const actual =
    await vi.importActual<typeof import('@server/lib/repositories/creationProductRepository')>(
      '@server/lib/repositories/creationProductRepository',
    );

  return {
    ...actual,
    insert: insertMock,
  };
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { rehydrateStoredProductModel } from '@shared/engine/creation-v2/persistence/ProductPersistenceMapper';
import { buildPresetArtifact } from '@shared/engine/cultivator/creation/presetProducts';
import {
  addArtifactToInventory,
  updateCultivatorGameSettings,
} from './cultivatorService';

describe('addArtifactToInventory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbExecutorMock.update = updateMock;
    getExecutorMock.mockReturnValue(dbExecutorMock);
    hasCultivatorOwnershipMock.mockResolvedValue(true);
    insertMock.mockResolvedValue({
      id: 'product-1',
    });
    updateMock.mockReturnValue({ set: setMock });
    setMock.mockReturnValue({ where: whereMock });
    whereMock.mockResolvedValue(undefined);
  });

  it('persists the incoming artifact productModel instead of replacing it with an empty shell', async () => {
    const artifact = buildPresetArtifact({
      id: 'artifact-1',
      name: '离火古印',
      slot: 'accessory',
      element: '火',
      affixIds: [
        'artifact-panel-weapon-dual-atk',
        'artifact-panel-atk',
      ],
      realm: '金丹',
      realmStage: '中期',
      creatorName: '测试造物者',
      creatorCultivatorId: 'creator-1',
      isEquipped: false,
    });

    await addArtifactToInventory('user-1', 'cultivator-1', artifact);

    expect(insertMock).toHaveBeenCalledTimes(1);
    const [row, executor] = insertMock.mock.calls[0] as [
      Record<string, unknown>,
      unknown,
    ];

    expect(executor).toBe(dbExecutorMock);
    expect(row).toMatchObject({
      cultivatorId: 'cultivator-1',
      productType: 'artifact',
      name: '离火古印',
      slot: 'accessory',
      isEquipped: false,
    });

    const storedProductModel = row.productModel as Record<string, unknown>;
    expect(storedProductModel.productType).toBe('artifact');
    expect(Array.isArray(storedProductModel.affixes)).toBe(true);
    expect((storedProductModel.affixes as unknown[]).length).toBeGreaterThan(0);
    expect(storedProductModel).not.toEqual({ affixes: [] });
    expect(
      rehydrateStoredProductModel(storedProductModel, artifact.element),
    ).toBeDefined();
  });

  it('rejects artifact rewards with a missing productModel before writing bad data', async () => {
    const artifact = {
      ...buildPresetArtifact({
        id: 'artifact-2',
        name: '寒魄环',
        slot: 'armor',
        element: '水',
        affixIds: [
          'artifact-panel-atk',
          'artifact-defense-mana-recovery',
        ],
        realm: '筑基',
        realmStage: '后期',
        creatorName: '测试造物者',
        creatorCultivatorId: 'creator-2',
        isEquipped: false,
      }),
      productModel: undefined,
    };

    await expect(
      addArtifactToInventory('user-1', 'cultivator-1', artifact),
    ).rejects.toThrow('法宝数据缺少有效 productModel，无法入库');
    expect(insertMock).not.toHaveBeenCalled();
  });
});

describe('updateCultivatorGameSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbExecutorMock.update = updateMock;
    getExecutorMock.mockReturnValue(dbExecutorMock);
    updateMock.mockReturnValue({ set: setMock });
    setMock.mockReturnValue({ where: whereMock });
    whereMock.mockResolvedValue(undefined);
  });

  it('normalizes and persists cultivator game settings', async () => {
    const result = await updateCultivatorGameSettings('cultivator-1', {
      battleAbilityStrategy: {
        version: 1,
        mode: 'conservative',
        healHpSkipThreshold: 0.4,
        emergencyHealHpThreshold: 0.8,
        restoreMpSkipThreshold: 0.6,
        avoidRepeatControl: true,
      },
    });

    expect(result.battleAbilityStrategy).toMatchObject({
      mode: 'conservative',
      healHpSkipThreshold: 0.4,
      emergencyHealHpThreshold: 0.4,
      restoreMpSkipThreshold: 0.6,
      avoidRepeatControl: true,
    });
    expect(updateMock).toHaveBeenCalledTimes(1);
    expect(setMock).toHaveBeenCalledWith({
      gameSettings: result,
    });
    expect(whereMock).toHaveBeenCalledTimes(1);
  });
});
