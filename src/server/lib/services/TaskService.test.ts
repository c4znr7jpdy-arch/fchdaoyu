import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  createCultivatorTaskMock,
  findActiveCultivatorRecordByIdMock,
  findCultivatorTaskByDefinitionMock,
  findCultivatorTaskByIdMock,
  getCultivatorByIdUnsafeMock,
  listCultivatorBreakthroughPillsMock,
  listCultivatorTasksMock,
  listCultivatorTechniqueQualitiesMock,
  updateCultivatorTaskMock,
} = vi.hoisted(() => ({
  createCultivatorTaskMock: vi.fn(),
  findActiveCultivatorRecordByIdMock: vi.fn(),
  findCultivatorTaskByDefinitionMock: vi.fn(),
  findCultivatorTaskByIdMock: vi.fn(),
  getCultivatorByIdUnsafeMock: vi.fn(),
  listCultivatorBreakthroughPillsMock: vi.fn(),
  listCultivatorTasksMock: vi.fn(),
  listCultivatorTechniqueQualitiesMock: vi.fn(),
  updateCultivatorTaskMock: vi.fn(),
}));

vi.mock('@server/lib/repositories/cultivatorRepository', () => ({
  findActiveCultivatorRecordById: findActiveCultivatorRecordByIdMock,
  listCultivatorBreakthroughPills: listCultivatorBreakthroughPillsMock,
  listCultivatorTechniqueQualities: listCultivatorTechniqueQualitiesMock,
}));

vi.mock('./cultivatorService', () => ({
  getCultivatorByIdUnsafe: getCultivatorByIdUnsafeMock,
}));

vi.mock('@server/lib/repositories/taskRepository', () => ({
  createCultivatorTask: createCultivatorTaskMock,
  findCultivatorTaskByDefinition: findCultivatorTaskByDefinitionMock,
  findCultivatorTaskById: findCultivatorTaskByIdMock,
  listCultivatorTasks: listCultivatorTasksMock,
  updateCultivatorTask: updateCultivatorTaskMock,
}));

vi.mock('./simulateBattleV5', () => ({
  simulateBattleV5: vi.fn(),
}));

import { TaskService } from './TaskService';

function createCultivatorRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'cultivator-1',
    userId: 'user-1',
    name: '韩立',
    title: null,
    gender: null,
    origin: null,
    personality: null,
    background: null,
    prompt: '谨慎求道',
    realm: '炼气',
    realm_stage: '圆满',
    age: 28,
    lifespan: 120,
    closedDoorYearsTotal: 12,
    status: 'active',
    diedAt: null,
    vitality: 18,
    spirit: 22,
    wisdom: 24,
    speed: 16,
    willpower: 25,
    spirit_stones: 320,
    last_yield_at: new Date('2026-05-21T00:00:00.000Z'),
    max_skills: 4,
    balance_notes: null,
    condition: {
      statuses: [],
    },
    cultivation_progress: {
      cultivation_exp: 3000,
      exp_cap: 3000,
      comprehension_insight: 55,
      breakthrough_failures: 0,
      bottleneck_state: true,
      inner_demon: false,
      deviation_risk: 0,
    },
    createdAt: new Date('2026-05-20T00:00:00.000Z'),
    updatedAt: new Date('2026-05-21T00:00:00.000Z'),
    ...overrides,
  } as any;
}

function createFoundationTaskRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'task-1',
    cultivatorId: 'cultivator-1',
    definitionId: 'major_breakthrough_炼气_筑基',
    category: 'breakthrough_major',
    status: 'active',
    currentStage: 'foundation-pill',
    objectives: [
      {
        objectiveId: 'craft-pill',
        completed: false,
      },
      {
        objectiveId: 'clear-garden',
        completed: true,
        progressValue: 1,
        completedAt: '2026-05-21T00:00:00.000Z',
        updatedAt: '2026-05-21T00:00:00.000Z',
      },
    ],
    metadata: {
      fromRealm: '炼气',
      toRealm: '筑基',
      taskTheme: 'foundation',
    },
    completedAt: null,
    createdAt: new Date('2026-05-21T00:00:00.000Z'),
    updatedAt: new Date('2026-05-21T00:00:00.000Z'),
    ...overrides,
  } as any;
}

describe('TaskService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createCultivatorTaskMock.mockReset();
    findActiveCultivatorRecordByIdMock.mockReset();
    findCultivatorTaskByDefinitionMock.mockReset();
    findCultivatorTaskByIdMock.mockReset();
    getCultivatorByIdUnsafeMock.mockReset();
    listCultivatorBreakthroughPillsMock.mockReset();
    listCultivatorTasksMock.mockReset();
    listCultivatorTechniqueQualitiesMock.mockReset();
    updateCultivatorTaskMock.mockReset();
    findCultivatorTaskByIdMock.mockResolvedValue(null);
    createCultivatorTaskMock.mockResolvedValue(null);
  });

  it('syncs task progress from lightweight context without loading full cultivator', async () => {
    const record = createCultivatorRecord();
    const taskRecord = createFoundationTaskRecord();

    findActiveCultivatorRecordByIdMock.mockResolvedValue(record);
    listCultivatorTechniqueQualitiesMock.mockResolvedValue([]);
    listCultivatorBreakthroughPillsMock.mockResolvedValue([
      {
        spec: {
          kind: 'pill',
          family: 'breakthrough',
          operations: [],
          consumeRules: {
            scene: 'out_of_battle_only',
            countsTowardLongTermQuota: true,
          },
          alchemyMeta: {
            source: 'improvised',
            sourceMaterials: ['火灵草'],
            stability: 74,
            toxicityRating: 12,
            tags: ['breakthrough'],
            breakthroughTargetRealm: '筑基',
            breakthroughLabel: '筑基丹',
          },
        },
        quantity: 1,
      },
    ]);
    findCultivatorTaskByDefinitionMock.mockResolvedValue(taskRecord);
    listCultivatorTasksMock.mockResolvedValue([taskRecord]);
    updateCultivatorTaskMock.mockResolvedValue({
      ...taskRecord,
      status: 'completed',
      currentStage: null,
      objectives: [
        {
          objectiveId: 'craft-pill',
          completed: true,
          progressValue: 1,
          completedAt: '2026-05-21T00:00:00.000Z',
          updatedAt: '2026-05-21T00:00:00.000Z',
        },
        taskRecord.objectives[1],
      ],
      completedAt: new Date('2026-05-21T00:00:00.000Z'),
    });

    const tasks = await TaskService.syncCultivatorTasks('cultivator-1');

    expect(getCultivatorByIdUnsafeMock).not.toHaveBeenCalled();
    expect(updateCultivatorTaskMock).toHaveBeenCalledTimes(1);
    expect(tasks[0]).toMatchObject({
      id: 'task-1',
      status: 'completed',
      snapshot: {
        isCompleted: true,
        currentStageId: null,
      },
    });
  });

  it('reuses one lightweight context load in major breakthrough gate checks', async () => {
    const record = createCultivatorRecord();
    const taskRecord = createFoundationTaskRecord();

    findActiveCultivatorRecordByIdMock.mockResolvedValue(record);
    listCultivatorTechniqueQualitiesMock.mockResolvedValue([{ quality: '玄品' }]);
    listCultivatorBreakthroughPillsMock.mockResolvedValue([]);
    findCultivatorTaskByDefinitionMock.mockResolvedValue(taskRecord);
    listCultivatorTasksMock.mockResolvedValue([taskRecord]);

    const gate = await TaskService.getMajorBreakthroughGate('cultivator-1');

    expect(gate).toMatchObject({
      required: true,
      blocked: true,
      task: {
        id: 'task-1',
      },
    });
    expect(findActiveCultivatorRecordByIdMock).toHaveBeenCalledTimes(1);
    expect(listCultivatorTechniqueQualitiesMock).toHaveBeenCalledTimes(1);
    expect(listCultivatorBreakthroughPillsMock).toHaveBeenCalledTimes(1);
    expect(getCultivatorByIdUnsafeMock).not.toHaveBeenCalled();
  });
});
