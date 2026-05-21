const {
  addConsumableToInventoryMock,
  buildDiscoveryCandidateMock,
  executorState,
  generateImprovisedPillCopyMock,
  getExecutorMock,
  redisDelMock,
  redisSetMock,
} = vi.hoisted(() => {
  const state = {
    consumableRows: [] as any[],
    cultivatorRow: null as any,
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
    buildDiscoveryCandidateMock: vi.fn(),
    executorState: state,
    generateImprovisedPillCopyMock: vi.fn(),
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
    set: redisSetMock,
  },
}));

vi.mock('./cultivatorService', () => ({
  addConsumableToInventory: addConsumableToInventoryMock,
}));

vi.mock('./AlchemyFormulaService', () => ({
  buildDiscoveryCandidate: buildDiscoveryCandidateMock,
}));

vi.mock('./AlchemyNarrativeEnricher', () => ({
  AlchemyNarrativeEnricher: class AlchemyNarrativeEnricher {
    generateImprovisedPillCopy = generateImprovisedPillCopyMock;
  },
}));

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAlchemyService } from './alchemyServiceV2';

describe('processAlchemyCraft narrative copy', () => {
  beforeEach(() => {
    executorState.materialRows = [
      {
        id: 'm1',
        cultivatorId: 'cultivator-1',
        name: '青岚草',
        rank: '真品',
        quantity: 1,
        element: '木',
        type: 'herb',
        details: {
          alchemyProfile: {
            effectTags: ['healing'],
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
      spirit_stones: 50000,
    };
    executorState.consumableRows = [];
    redisSetMock.mockReset();
    redisDelMock.mockReset();
    addConsumableToInventoryMock.mockReset();
    buildDiscoveryCandidateMock.mockReset();
    generateImprovisedPillCopyMock.mockReset();
    redisSetMock.mockResolvedValue('OK');
    buildDiscoveryCandidateMock.mockResolvedValue(null);
  });

  it('uses generated pill copy when llm succeeds', async () => {
    generateImprovisedPillCopyMock.mockResolvedValueOnce({
      name: '回春散',
      description: '木气徐徐归拢，炉息温和，丹成后自有一缕生机护住受损经脉。',
    });
    const service = createAlchemyService({
      resolve: vi.fn().mockResolvedValue({
        targetTags: ['healing'],
        focusMode: 'focused',
      }),
    } as any);

    const result = await service.processAlchemyCraft('cultivator-1', ['m1'], {
      userPrompt: '疗伤为主',
    });

    expect(result.consumable.name).toBe('回春散');
    expect(result.consumable.description).toBe(
      '木气徐徐归拢，炉息温和，丹成后自有一缕生机护住受损经脉。',
    );
    expect(generateImprovisedPillCopyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        family: 'healing',
        materialNames: ['青岚草'],
        targetTags: ['healing'],
        userPrompt: '疗伤为主',
      }),
    );
  });

  it('falls back to rule copy when llm copy is unavailable', async () => {
    generateImprovisedPillCopyMock.mockResolvedValueOnce(null);
    const service = createAlchemyService({
      resolve: vi.fn().mockResolvedValue({
        targetTags: ['healing'],
        focusMode: 'focused',
      }),
    } as any);

    const result = await service.processAlchemyCraft('cultivator-1', ['m1'], {
      userPrompt: '疗伤为主',
    });

    expect(result.consumable.name).toBe('青木疗伤丹');
    expect(result.consumable.description).toContain('以青岚草熔炼而成');
    expect(result.consumable.description).toContain('丹意取向「疗伤为主」');
  });
});
