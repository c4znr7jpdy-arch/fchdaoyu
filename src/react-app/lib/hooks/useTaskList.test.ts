import type { TaskInstance } from '@shared/types/task';
import { describe, expect, it } from 'vitest';
import {
  createTaskListRequestKey,
  deriveTaskListViewState,
} from './useTaskList';

function createTask(id: string): TaskInstance {
  return {
    id,
    templateId: `template-${id}`,
    category: 'major_breakthrough',
    title: `${id}-task`,
    description: `${id}-description`,
    status: 'active',
    cultivatorId: 'cultivator-1',
    createdAt: '2026-05-25T00:00:00.000Z',
    updatedAt: '2026-05-25T00:00:00.000Z',
    metadata: {
      fromRealm: '炼气',
      toRealm: '筑基',
    },
    objectives: [],
    rewards: [],
  };
}

describe('useTaskList helpers', () => {
  it('builds a stable request key from cultivator and status filters', () => {
    expect(createTaskListRequestKey('cultivator-1', 'active')).toBe(
      'cultivator-1:active',
    );
    expect(createTaskListRequestKey(undefined)).toBe(':');
  });

  it('hides stale task results while a new request key is loading', () => {
    const view = deriveTaskListViewState(
      {
        requestKey: 'cultivator-1:active',
        tasks: [createTask('task-1')],
        loading: false,
        error: undefined,
      },
      'cultivator-1:completed',
      'cultivator-1',
    );

    expect(view).toEqual({
      tasks: [],
      loading: true,
      error: undefined,
    });
  });
});
