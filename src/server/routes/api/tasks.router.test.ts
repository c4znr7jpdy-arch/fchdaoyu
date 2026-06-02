import { Hono } from 'hono';

const {
  claimTaskRewardMock,
  listCultivatorTasksMock,
  getCultivatorTaskMock,
  runTaskChallengeMock,
} = vi.hoisted(() => ({
  claimTaskRewardMock: vi.fn(),
  listCultivatorTasksMock: vi.fn(),
  getCultivatorTaskMock: vi.fn(),
  runTaskChallengeMock: vi.fn(),
}));

vi.mock('@server/lib/hono/middleware', () => ({
  requireActiveCultivator: () => async (context: any, next: () => Promise<void>) => {
    context.set('user', {
      id: 'user-1',
    });
    context.set('cultivator', {
      id: 'cultivator-1',
    });
    await next();
  },
}));

vi.mock('@server/lib/services/TaskService', () => ({
  TaskService: {
    claimTaskReward: claimTaskRewardMock,
    listCultivatorTasks: listCultivatorTasksMock,
    getCultivatorTask: getCultivatorTaskMock,
    runTaskChallenge: runTaskChallengeMock,
  },
}));

import taskRouter from './tasks.router';

function createApp() {
  return new Hono().route('/api/tasks', taskRouter);
}

describe('tasks router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists tasks by status', async () => {
    listCultivatorTasksMock.mockResolvedValueOnce([
      {
        id: 'task-1',
        status: 'active',
      },
    ]);

    const response = await createApp().request('/api/tasks?status=active');

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: {
        tasks: [
          {
            id: 'task-1',
            status: 'active',
          },
        ],
      },
    });
    expect(listCultivatorTasksMock).toHaveBeenCalledWith(
      'cultivator-1',
      'active',
    );
  });

  it('returns task detail when the task exists', async () => {
    getCultivatorTaskMock.mockResolvedValueOnce({
      id: 'task-9',
      status: 'completed',
      snapshot: {
        title: '筑基前引',
      },
    });

    const response = await createApp().request('/api/tasks/task-9');

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: {
        task: {
          id: 'task-9',
          status: 'completed',
          snapshot: {
            title: '筑基前引',
          },
        },
      },
    });
    expect(getCultivatorTaskMock).toHaveBeenCalledWith(
      'cultivator-1',
      'task-9',
    );
  });

  it('maps challenge conflicts to 409 responses', async () => {
    runTaskChallengeMock.mockRejectedValueOnce(
      new Error('当前阶段没有可执行的试炼挑战'),
    );

    const response = await createApp().request('/api/tasks/task-2/challenge', {
      method: 'POST',
    });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: '当前阶段没有可执行的试炼挑战',
    });
  });

  it('claims tutorial rewards through the active user and cultivator', async () => {
    claimTaskRewardMock.mockResolvedValueOnce({
      task: {
        id: 'task-1',
        status: 'completed',
      },
      rewards: ['修为 x40'],
    });

    const response = await createApp().request('/api/tasks/task-1/claim-reward', {
      method: 'POST',
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: {
        task: {
          id: 'task-1',
          status: 'completed',
        },
        rewards: ['修为 x40'],
      },
    });
    expect(claimTaskRewardMock).toHaveBeenCalledWith(
      'user-1',
      'cultivator-1',
      'task-1',
    );
  });
});
