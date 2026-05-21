import { fetchTaskList } from '@app/lib/tasks/taskClient';
import type { TaskInstance, TaskStatus } from '@shared/types/task';
import { useCallback, useEffect, useState } from 'react';

export function useTaskList(
  cultivatorId: string | undefined,
  status?: TaskStatus,
) {
  const [tasks, setTasks] = useState<TaskInstance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const reload = useCallback(async () => {
    if (!cultivatorId) {
      setTasks([]);
      setError(undefined);
      return;
    }

    setLoading(true);
    setError(undefined);

    try {
      const response = await fetchTaskList(status);
      setTasks(response.data.tasks);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : '获取任务列表失败',
      );
    } finally {
      setLoading(false);
    }
  }, [cultivatorId, status]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    tasks,
    loading,
    error,
    reload,
    setTasks,
  };
}
