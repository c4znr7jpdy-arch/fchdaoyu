const {
  creationProductRepositoryMock,
  executorState,
  getExecutorMock,
  redisDelMock,
  redisGetMock,
  redisSetMock,
  textMock,
} = vi.hoisted(() => {
  const state = {
    materialRows: [] as any[],
  };

  const executor = {
    select() {
      return {
        from() {
          return {
            where: async () => state.materialRows,
          };
        },
      };
    },
  };

  return {
    creationProductRepositoryMock: {
      deleteArtifactsByIdsAndCultivator: vi.fn(),
      findArtifactsByIdsAndCultivator: vi.fn(),
      findEquippedArtifacts: vi.fn(),
    },
    executorState: state,
    getExecutorMock: vi.fn(() => executor),
    redisDelMock: vi.fn(),
    redisGetMock: vi.fn(),
    redisSetMock: vi.fn(),
    textMock: vi.fn(),
  };
});

vi.mock('@server/lib/drizzle/db', () => ({
  getExecutor: getExecutorMock,
}));

vi.mock('@server/lib/repositories/creationProductRepository', () => ({
  deleteArtifactsByIdsAndCultivator:
    creationProductRepositoryMock.deleteArtifactsByIdsAndCultivator,
  findArtifactsByIdsAndCultivator:
    creationProductRepositoryMock.findArtifactsByIdsAndCultivator,
  findEquippedArtifacts: creationProductRepositoryMock.findEquippedArtifacts,
}));

vi.mock('@server/lib/redis', () => ({
  redis: {
    del: redisDelMock,
    get: redisGetMock,
    set: redisSetMock,
  },
}));

vi.mock('@server/utils/aiClient', () => ({
  text: textMock,
}));

import {
  buildMaterialHighTierAppraisal,
  previewSell,
} from './MarketRecycleService';

describe('MarketRecycleService', () => {
  beforeEach(() => {
    executorState.materialRows = [];
    creationProductRepositoryMock.findArtifactsByIdsAndCultivator.mockReset();
    creationProductRepositoryMock.findEquippedArtifacts.mockReset();
    creationProductRepositoryMock.deleteArtifactsByIdsAndCultivator.mockReset();
    redisSetMock.mockReset();
    redisGetMock.mockReset();
    redisDelMock.mockReset();
    textMock.mockReset();
  });

  it('builds a rule-based appraisal for a high-tier material preview without calling LLM', async () => {
    executorState.materialRows = [
      {
        id: 'material-1',
        name: '本源玄铁',
        type: 'ore',
        rank: '天品',
        element: '金',
        quantity: 2,
        description: '矿脉完整，内蕴本源气机。',
        details: { origin: '稀缺古矿' },
      },
    ];

    const preview = await previewSell(
      { id: 'cultivator-1' },
      ['material-1'],
      'material',
    );

    expect(preview.mode).toBe('high_single');
    expect(preview.itemType).toBe('material');
    expect(preview.appraisal).toEqual({
      rating: 'S',
      comment: expect.stringContaining('本源玄铁'),
      keywords: ['本源', '稀缺', '完整'],
    });
    expect(preview.items).toHaveLength(1);
    expect(preview.items[0]).toMatchObject({
      id: 'material-1',
      quantity: 2,
      rank: '天品',
    });
    expect(preview.totalSpiritStones).toBe(
      preview.items[0].unitPrice * preview.items[0].quantity,
    );
    expect(redisSetMock).toHaveBeenCalledTimes(1);
    expect(textMock).not.toHaveBeenCalled();
  });

  it('keeps low-tier material preview in bulk mode', async () => {
    executorState.materialRows = [
      {
        id: 'material-1',
        name: '灰石',
        type: 'ore',
        rank: '凡品',
        element: '土',
        quantity: 3,
      },
      {
        id: 'material-2',
        name: '灵藤',
        type: 'herb',
        rank: '玄品',
        element: '木',
        quantity: 1,
      },
    ];

    const preview = await previewSell(
      { id: 'cultivator-1' },
      ['material-1', 'material-2'],
      'material',
    );

    expect(preview.mode).toBe('low_bulk');
    expect(preview.appraisal).toBeUndefined();
    expect(preview.items).toHaveLength(2);
    expect(preview.totalSpiritStones).toBeGreaterThan(0);
  });

  it('keeps artifact single-preview appraisal on the rule path', async () => {
    creationProductRepositoryMock.findArtifactsByIdsAndCultivator.mockResolvedValueOnce(
      [
        {
          id: 'artifact-1',
          name: '赤霄印',
          slot: 'accessory',
          element: '火',
          quality: '天品',
          description: '火纹流转',
          abilityConfig: {
            modifiers: [{ key: 'spirit', op: 'add', value: 12 }],
          },
          productModel: {},
          score: 1680,
          isEquipped: false,
        },
      ],
    );
    creationProductRepositoryMock.findEquippedArtifacts.mockResolvedValueOnce([]);

    const preview = await previewSell(
      { id: 'cultivator-1' },
      ['artifact-1'],
      'artifact',
    );

    expect(preview.mode).toBe('high_single');
    expect(preview.itemType).toBe('artifact');
    expect(preview.appraisal).toMatchObject({
      rating: expect.stringMatching(/^[SABC]$/),
      comment: expect.stringContaining('赤霄印'),
    });
    expect(preview.items).toHaveLength(1);
    expect(preview.items[0]).toMatchObject({
      id: 'artifact-1',
      quality: '天品',
      quantity: 1,
      slot: 'accessory',
    });
  });

  it('downgrades high-tier material appraisal when negative keywords dominate', () => {
    const appraisal = buildMaterialHighTierAppraisal({
      name: '残缺古简',
      type: 'gongfa_manual',
      rank: '地品',
      element: '水',
      description: '此物驳杂残缺，灵纹断续。',
      details: { note: '杂质偏多' },
    });

    expect(appraisal.rating).toBe('C');
    expect(appraisal.keywords).toEqual(['残缺', '驳杂', '杂质']);
    expect(appraisal.comment).toContain('惜有残缺、驳杂之痕');
  });
});
