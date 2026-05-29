const {
  executorState,
  getExecutorMock,
  narrativeBatchDescriptionMock,
  narrativeFormulaCopyMock,
  redisDelMock,
  redisGetMock,
  redisSetMock,
} = vi.hoisted(() => {
  const state = {
    selectRows: [] as any[],
    txExistingRows: [] as any[],
    deletedRows: [] as any[],
    insertedRow: null as any,
    insertedValues: null as any,
  };

  const tx = {
    select() {
      return {
        from() {
          return {
            where: async () => state.txExistingRows,
          };
        },
      };
    },
    insert() {
      return {
        values(values: any) {
          state.insertedValues = values;
          return {
            returning: async () => [
              state.insertedRow ?? {
                id: '22222222-2222-2222-2222-222222222222',
                ...values,
                createdAt: new Date('2026-05-15T00:00:00.000Z'),
                updatedAt: new Date('2026-05-15T00:00:00.000Z'),
              },
            ],
          };
        },
      };
    },
  };

  const executor = {
    select() {
      return {
        from() {
          return {
            where() {
              return {
                orderBy: async () => state.selectRows,
                limit: async () => state.selectRows,
              };
            },
          };
        },
      };
    },
    delete() {
      return {
        where() {
          return {
            returning: async () => state.deletedRows,
          };
        },
      };
    },
    transaction: async (callback: (tx: any) => Promise<void>) => callback(tx),
  };

  return {
    executorState: state,
    getExecutorMock: vi.fn(() => executor),
    narrativeBatchDescriptionMock: vi.fn(),
    narrativeFormulaCopyMock: vi.fn(),
    redisSetMock: vi.fn(),
    redisGetMock: vi.fn(),
    redisDelMock: vi.fn(),
  };
});

vi.mock('@server/lib/drizzle/db', () => ({
  getExecutor: getExecutorMock,
}));

vi.mock('@server/lib/redis', () => ({
  redis: {
    del: redisDelMock,
    get: redisGetMock,
    set: redisSetMock,
  },
}));

vi.mock('./cultivatorService', () => ({
  addConsumableToInventory: vi.fn(),
}));

vi.mock('./AlchemyNarrativeEnricher', () => ({
  AlchemyNarrativeEnricher: class AlchemyNarrativeEnricher {
    generateFormulaBatchDescription = narrativeBatchDescriptionMock;
    generateFormulaRecordCopy = narrativeFormulaCopyMock;
  },
}));

import type { Consumable } from '@shared/types/cultivator';
import type { AlchemyFormula, PillSpec } from '@shared/types/consumable';
import {
  advanceFormulaMastery,
  buildDiscoveryCandidate,
  buildFormulaSignature,
  calculateFormulaFitMultiplier,
  confirmDiscoveryCandidate,
  deleteCultivatorFormula,
} from './AlchemyFormulaService';

function createFormula(
  overrides: Partial<AlchemyFormula> = {},
): AlchemyFormula {
  return {
    id: overrides.id ?? '11111111-1111-1111-1111-111111111111',
    cultivatorId: overrides.cultivatorId ?? 'cultivator-1',
    name: overrides.name ?? '青木疗伤丹丹方',
    description:
      overrides.description ?? '此方偏于生机温养，主走木性回春之路。',
    family: overrides.family ?? 'healing',
    pattern: overrides.pattern ?? {
      requiredTags: ['healing'],
      optionalTags: ['mana'],
      dominantElement: '木',
      minQuality: '真品',
      slotCount: 2,
    },
    blueprint: overrides.blueprint ?? {
      operations: [
        { type: 'restore_resource', resource: 'hp', mode: 'percent', value: 0.12 },
      ],
      consumeRules: {
        scene: 'out_of_battle_only',
        quotaCategory: 'none',
      },
      targetStability: 72,
      targetToxicity: 6,
    },
    mastery: overrides.mastery ?? {
      level: 0,
      exp: 0,
    },
    createdAt: overrides.createdAt ?? '2026-05-15T00:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2026-05-15T00:00:00.000Z',
  };
}

function createConsumable(): Consumable & { spec: PillSpec } {
  return {
    id: 'pill-1',
    name: '青木疗伤丹',
    type: '丹药',
    quality: '真品',
    quantity: 1,
    spec: {
      kind: 'pill',
      family: 'healing',
      operations: [
        { type: 'restore_resource', resource: 'hp', mode: 'percent', value: 0.12 },
        { type: 'change_gauge', gauge: 'pillToxicity', delta: 4 },
      ],
      consumeRules: {
        scene: 'out_of_battle_only',
        quotaCategory: 'none',
      },
      alchemyMeta: {
        source: 'improvised',
        sourceMaterials: ['青岚草', '灵泉露'],
        dominantElement: '木',
        stability: 78,
        toxicityRating: 6,
        tags: ['healing'],
      },
    },
  };
}

describe('AlchemyFormulaService', () => {
  beforeEach(() => {
    executorState.selectRows = [];
    executorState.txExistingRows = [];
    executorState.deletedRows = [];
    executorState.insertedRow = null;
    executorState.insertedValues = null;
    redisSetMock.mockReset();
    redisGetMock.mockReset();
    redisDelMock.mockReset();
    narrativeFormulaCopyMock.mockReset();
    narrativeBatchDescriptionMock.mockReset();
    narrativeFormulaCopyMock.mockResolvedValue(null);
    narrativeBatchDescriptionMock.mockResolvedValue(null);
  });

  it('normalizes formula signatures independent of required tag order', () => {
    const left = createFormula({
      pattern: {
        requiredTags: ['mana', 'healing'],
        slotCount: 2,
      },
    });
    const right = createFormula({
      pattern: {
        requiredTags: ['healing', 'mana'],
        slotCount: 2,
      },
    });

    expect(buildFormulaSignature(left)).toBe(buildFormulaSignature(right));
  });

  it('calculates fit multiplier from dominant element, optional tags and surplus quality', () => {
    const formula = createFormula();
    const multiplier = calculateFormulaFitMultiplier(formula, [
      {
        id: 'm1',
        name: '青岚草',
        rank: '天品',
        element: '木',
        type: 'herb',
        dose: 1,
        effectTags: ['healing', 'mana'],
        potency: 48,
      },
      {
        id: 'm2',
        name: '灵泉露',
        rank: '真品',
        element: '木',
        type: 'tcdb',
        dose: 1,
        effectTags: ['healing'],
        potency: 26,
      },
    ]);

    expect(multiplier).toBeCloseTo(1.1);
  });

  it('advances mastery with overflow exp', () => {
    expect(
      advanceFormulaMastery({
        level: 0,
        exp: 4,
      }),
    ).toEqual({
      next: {
        level: 1,
        exp: 0,
      },
      progress: {
        previousLevel: 0,
        level: 1,
        exp: 0,
        gainedExp: 1,
        leveledUp: true,
      },
    });
  });

  it('builds a discovery candidate and stores it in redis', async () => {
    redisSetMock.mockResolvedValueOnce('OK');

    const candidate = await buildDiscoveryCandidate('cultivator-1', {
      consumable: createConsumable(),
      ingredients: [
        {
          id: 'm1',
          name: '青岚草',
          rank: '真品',
          element: '木',
          type: 'herb',
          dose: 1,
          effectTags: ['healing'],
          potency: 26,
        },
        {
          id: 'm2',
          name: '灵泉露',
          rank: '真品',
          element: '水',
          type: 'herb',
          dose: 1,
          effectTags: ['mana'],
          potency: 26,
        },
      ],
      targetTags: ['healing'],
    });

    expect(candidate).toEqual({
      token: expect.any(String),
      name: '青木疗伤丹丹方',
      description: expect.stringContaining('此方以疗伤为炉中主脉'),
      family: 'healing',
      discoveryRemark: expect.stringContaining('《青木疗伤丹丹方》'),
      patternSummary: expect.stringContaining('主药性：疗伤'),
    });
    expect(redisSetMock).toHaveBeenCalledTimes(1);
  });

  it('uses generated formula copy when llm formula naming succeeds', async () => {
    redisSetMock.mockResolvedValueOnce('OK');
    narrativeFormulaCopyMock.mockResolvedValueOnce({
      name: '回春灵藏丹方',
      description: '此方温引木性生机，重在缓和归拢药气，不以躁火争先。',
      discoveryRemark: '一缕回春炉意忽而贯通，丹路已可成篇。',
    });

    const candidate = await buildDiscoveryCandidate('cultivator-1', {
      consumable: createConsumable(),
      ingredients: [
        {
          id: 'm1',
          name: '青岚草',
          rank: '真品',
          element: '木',
          type: 'herb',
          dose: 1,
          effectTags: ['healing'],
          potency: 26,
        },
      ],
      targetTags: ['healing'],
    });

    expect(candidate).toEqual({
      token: expect.any(String),
      name: '回春灵藏丹方',
      description: '此方温引木性生机，重在缓和归拢药气，不以躁火争先。',
      family: 'healing',
      discoveryRemark: '一缕回春炉意忽而贯通，丹路已可成篇。',
      patternSummary: expect.stringContaining('主药性：疗伤'),
    });
  });

  it('skips discovery when formula signature already exists', async () => {
    const existing = createFormula({
      pattern: {
        requiredTags: ['healing'],
        dominantElement: '木',
        minQuality: '真品',
        slotCount: 2,
      },
      blueprint: {
        operations: [
          { type: 'restore_resource', resource: 'hp', mode: 'percent', value: 0.12 },
          { type: 'change_gauge', gauge: 'pillToxicity', delta: 4 },
        ],
        consumeRules: {
          scene: 'out_of_battle_only',
          quotaCategory: 'none',
        },
        targetStability: 78,
        targetToxicity: 6,
      },
    });

    executorState.selectRows = [
      {
        id: existing.id,
        cultivatorId: existing.cultivatorId,
        name: existing.name,
        description: existing.description,
        family: existing.family,
        pattern: existing.pattern,
        blueprint: existing.blueprint,
        mastery: existing.mastery,
        createdAt: new Date(existing.createdAt),
        updatedAt: new Date(existing.updatedAt),
      },
    ];

    const candidate = await buildDiscoveryCandidate('cultivator-1', {
      consumable: createConsumable(),
      ingredients: [
        {
          id: 'm1',
          name: '青岚草',
          rank: '真品',
          element: '木',
          type: 'herb',
          dose: 1,
          effectTags: ['healing'],
          potency: 26,
        },
        {
          id: 'm2',
          name: '灵泉露',
          rank: '真品',
          element: '水',
          type: 'herb',
          dose: 1,
          effectTags: ['mana'],
          potency: 26,
        },
      ],
      targetTags: ['healing'],
    });

    expect(candidate).toBeNull();
    expect(redisSetMock).not.toHaveBeenCalled();
  });

  it('persists discovered formula on accept', async () => {
    const payload = {
      cultivatorId: 'cultivator-1',
      formula: {
        cultivatorId: 'cultivator-1',
        name: '青木疗伤丹丹方',
        description: '此方偏于生机温养，主走木性回春之路。',
        family: 'healing',
        pattern: {
          requiredTags: ['healing'],
          dominantElement: '木',
          minQuality: '真品',
          slotCount: 1,
        },
        blueprint: {
          operations: [
            { type: 'restore_resource', resource: 'hp', mode: 'percent', value: 0.12 },
          ],
          consumeRules: {
            scene: 'out_of_battle_only',
            quotaCategory: 'none',
          },
          targetStability: 78,
          targetToxicity: 6,
        },
        mastery: {
          level: 0,
          exp: 0,
        },
      },
      signature: 'sig-1',
    };
    redisGetMock.mockResolvedValueOnce(JSON.stringify(payload));
    redisDelMock.mockResolvedValueOnce(1);

    const result = await confirmDiscoveryCandidate(
      'cultivator-1',
      '11111111-1111-1111-1111-111111111111',
      true,
    );

    expect(executorState.insertedValues).toEqual(
      expect.objectContaining({
        cultivatorId: 'cultivator-1',
        name: '青木疗伤丹丹方',
        description: '此方偏于生机温养，主走木性回春之路。',
      }),
    );
    expect(result).toEqual({
      saved: true,
      formula: expect.objectContaining({
        id: '22222222-2222-2222-2222-222222222222',
        name: '青木疗伤丹丹方',
      }),
    });
    expect(redisDelMock).toHaveBeenCalled();
  });

  it('does not persist discovered formula on reject', async () => {
    redisGetMock.mockResolvedValueOnce(
      JSON.stringify({
        cultivatorId: 'cultivator-1',
      }),
    );

    const result = await confirmDiscoveryCandidate(
      'cultivator-1',
      '11111111-1111-1111-1111-111111111111',
      false,
    );

    expect(result).toEqual({ saved: false });
    expect(executorState.insertedValues).toBeNull();
    expect(redisDelMock).toHaveBeenCalled();
  });

  it('deletes an owned formula', async () => {
    executorState.deletedRows = [
      {
        id: '11111111-1111-1111-1111-111111111111',
      },
    ];

    await expect(
      deleteCultivatorFormula(
        'cultivator-1',
        '11111111-1111-1111-1111-111111111111',
      ),
    ).resolves.toBeUndefined();
  });

  it('throws when deleting a missing formula', async () => {
    executorState.deletedRows = [];

    await expect(
      deleteCultivatorFormula(
        'cultivator-1',
        '11111111-1111-1111-1111-111111111111',
      ),
    ).rejects.toMatchObject({
      message: '未找到这份丹方。',
      status: 404,
    });
  });
});
