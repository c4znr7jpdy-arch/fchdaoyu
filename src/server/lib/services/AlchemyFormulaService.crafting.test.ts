const {
  addConsumableToInventoryMock,
  executorState,
  generateFormulaBatchDescriptionMock,
  generateFormulaRecordCopyMock,
  getExecutorMock,
  redisDelMock,
  redisSetMock,
} = vi.hoisted(() => {
  const state = {
    consumableRows: [] as any[],
    cultivatorRow: null as any,
    formulaRows: [] as any[],
    materialRows: [] as any[],
  };

  const tx = {
    delete() {
      return {
        where: async () => undefined,
      };
    },
    update() {
      return {
        set() {
          return {
            where: async () => undefined,
          };
        },
      };
    },
  };

  const executor = {
    select() {
      return {
        from(table: unknown) {
          if (
            table &&
            typeof table === 'object' &&
            'family' in table &&
            'pattern' in table &&
            'blueprint' in table
          ) {
            return {
              where() {
                return {
                  limit: async () => state.formulaRows,
                };
              },
            };
          }

          if (
            table &&
            typeof table === 'object' &&
            'rank' in table &&
            'details' in table
          ) {
            return {
              where: async () => state.materialRows,
            };
          }

          if (
            table &&
            typeof table === 'object' &&
            'realm' in table &&
            'spirit_stones' in table
          ) {
            return {
              where() {
                return {
                  limit: async () => (state.cultivatorRow ? [state.cultivatorRow] : []),
                };
              },
            };
          }

          if (
            table &&
            typeof table === 'object' &&
            'quality' in table &&
            'spec' in table
          ) {
            return {
              where() {
                return {
                  limit: async () => state.consumableRows,
                };
              },
            };
          }

          throw new Error('unexpected table');
        },
      };
    },
    transaction: async (callback: (tx: any) => Promise<void>) => callback(tx),
  };

  return {
    addConsumableToInventoryMock: vi.fn(),
    executorState: state,
    generateFormulaBatchDescriptionMock: vi.fn(),
    generateFormulaRecordCopyMock: vi.fn(),
    getExecutorMock: vi.fn(() => executor),
    redisDelMock: vi.fn(),
    redisSetMock: vi.fn(),
  };
});

vi.mock('@server/lib/drizzle/db', () => ({
  getExecutor: getExecutorMock,
}));

vi.mock('@server/lib/redis', () => ({
  redis: {
    del: redisDelMock,
    get: vi.fn(),
    set: redisSetMock,
  },
}));

vi.mock('./cultivatorService', () => ({
  addConsumableToInventory: addConsumableToInventoryMock,
}));

vi.mock('./AlchemyNarrativeEnricher', () => ({
  AlchemyNarrativeEnricher: class AlchemyNarrativeEnricher {
    generateFormulaBatchDescription = generateFormulaBatchDescriptionMock;
    generateFormulaRecordCopy = generateFormulaRecordCopyMock;
  },
}));

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildCultivationGain } from '@shared/lib/alchemyProgress';
import type { PillSpec } from '@shared/types/consumable';
import { craftFromFormula } from './AlchemyFormulaService';

describe('craftFromFormula narrative copy', () => {
  beforeEach(() => {
    executorState.formulaRows = [
      {
        id: 'formula-1',
        cultivatorId: 'cultivator-1',
        name: '回春丹方',
        description: '此方偏走木性生机，炉势圆融而不躁进。',
        family: 'healing',
        pattern: {
          requiredTags: ['healing'],
          optionalTags: ['mana'],
          dominantElement: '木',
          minQuality: '真品',
          slotCount: 1,
        },
        blueprint: {
          operations: [
            { type: 'restore_resource', resource: 'hp', mode: 'percent', value: 0.12 },
            { type: 'change_gauge', gauge: 'pillToxicity', delta: 4 },
            { type: 'remove_status', status: 'minor_wound' },
          ],
          consumeRules: {
            scene: 'out_of_battle_only',
            quotaCategory: 'none',
          },
          targetStability: 78,
          targetToxicity: 6,
        },
        mastery: {
          level: 2,
          exp: 1,
        },
        createdAt: new Date('2026-05-15T00:00:00.000Z'),
        updatedAt: new Date('2026-05-15T00:00:00.000Z'),
      },
    ];
    executorState.materialRows = [
      {
        id: 'm1',
        cultivatorId: 'cultivator-1',
        name: '回春草',
        rank: '真品',
        quantity: 1,
        element: '木',
        type: 'herb',
        details: {
          alchemyProfile: {
            effectTags: ['healing', 'mana'],
            potency: 26,
            toxicity: 2,
            stability: 72,
          },
        },
      },
    ];
    executorState.cultivatorRow = {
      id: 'cultivator-1',
      userId: 'user-1',
      realm: '筑基',
      spirit_stones: 50000,
    };
    executorState.consumableRows = [];
    redisSetMock.mockReset();
    redisDelMock.mockReset();
    addConsumableToInventoryMock.mockReset();
    generateFormulaBatchDescriptionMock.mockReset();
    generateFormulaRecordCopyMock.mockReset();
    redisSetMock.mockResolvedValue('OK');
    generateFormulaRecordCopyMock.mockResolvedValue(null);
  });

  it('keeps formula-derived pill name and uses generated batch description', async () => {
    generateFormulaBatchDescriptionMock.mockResolvedValueOnce({
      description: '此炉木气贴合丹方原意，药息温润而稳，回春之势收得尤为干净。',
    });

    const result = await craftFromFormula('cultivator-1', 'formula-1', ['m1']);

    expect(result.consumable.name).toBe('回春');
    expect(result.consumable.description).toBe(
      '此炉木气贴合丹方原意，药息温润而稳，回春之势收得尤为干净。',
    );
    expect(generateFormulaBatchDescriptionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        formulaName: '回春丹方',
        formulaDescription: '此方偏走木性生机，炉势圆融而不躁进。',
        masteryLevel: 2,
      }),
    );
  });

  it('falls back to template batch description when llm copy is unavailable', async () => {
    generateFormulaBatchDescriptionMock.mockResolvedValueOnce(null);

    const result = await craftFromFormula('cultivator-1', 'formula-1', ['m1']);

    expect(result.consumable.name).toBe('回春');
    expect(result.consumable.description).toContain('依《回春丹方》炉意炼成');
    expect(result.consumable.description).toContain('药力拟合');
  });

  it('normalizes healing wound removal by the current crafted quality', async () => {
    generateFormulaBatchDescriptionMock.mockResolvedValueOnce(null);
    executorState.cultivatorRow = {
      ...executorState.cultivatorRow,
      spirit_stones: 100000,
    };
    executorState.materialRows = [
      {
        ...executorState.materialRows[0],
        rank: '天品',
      },
    ];

    const result = await craftFromFormula('cultivator-1', 'formula-1', ['m1']);

    expect(result.consumable.quality).toBe('天品');
    expect(result.consumable.spec.kind).toBe('pill');
    expect((result.consumable.spec as PillSpec).operations).toContainEqual({
      type: 'remove_status',
      status: 'near_death',
    });
  });

  it('recalculates cultivation gain by the current crafter realm instead of blueprint value', async () => {
    generateFormulaBatchDescriptionMock.mockResolvedValueOnce(null);
    executorState.formulaRows = [
      {
        ...executorState.formulaRows[0],
        name: '养元丹方',
        description: '此方偏收金水养气之势，重在缓积道基。',
        family: 'cultivation',
        pattern: {
          requiredTags: ['cultivation'],
          slotCount: 1,
        },
        blueprint: {
          operations: [
            { type: 'gain_progress', target: 'cultivation_exp', value: 9999 },
            { type: 'change_gauge', gauge: 'pillToxicity', delta: 9 },
          ],
          consumeRules: {
            scene: 'out_of_battle_only',
            quotaCategory: 'cultivation',
          },
          targetStability: 72,
          targetToxicity: 9,
        },
      },
    ];
    executorState.materialRows = [
      {
        ...executorState.materialRows[0],
        name: '金霞芝',
        element: '金',
        details: {
          alchemyProfile: {
            effectTags: ['cultivation'],
            potency: 26,
            toxicity: 2,
            stability: 72,
          },
        },
      },
    ];
    executorState.cultivatorRow = {
      ...executorState.cultivatorRow,
      realm: '筑基',
    };

    const result = await craftFromFormula('cultivator-1', 'formula-1', ['m1']);

    expect(result.consumable.name).toBe('养元');
    expect(result.consumable.spec.kind).toBe('pill');
    expect((result.consumable.spec as PillSpec).consumeRules.quotaCategory).toBe(
      'cultivation',
    );
    expect((result.consumable.spec as PillSpec).operations).toContainEqual({
      type: 'gain_progress',
      target: 'cultivation_exp',
      value: buildCultivationGain('筑基', '真品'),
    });
    expect((result.consumable.spec as PillSpec).operations).not.toContainEqual({
      type: 'gain_progress',
      target: 'cultivation_exp',
      value: 9999,
    });
  });
});
