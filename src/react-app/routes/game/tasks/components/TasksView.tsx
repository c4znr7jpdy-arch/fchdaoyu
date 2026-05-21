import { BreakthroughTaskCard } from '@app/components/feature/tasks/BreakthroughTaskCard';
import {
  GameSceneAsideSection,
  GameSceneFrame,
  GameSceneSection,
} from '@app/components/game-shell';
import { InkNotice } from '@app/components/ui';
import { useTaskList } from '@app/lib/hooks/useTaskList';
import { useCultivator } from '@app/lib/contexts/CultivatorContext';

export function TasksView() {
  const { cultivator, isLoading } = useCultivator();
  const { tasks, loading, error } = useTaskList(cultivator?.id);

  if (isLoading && !cultivator) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="loading-tip">卷宗尚在归档……</p>
      </div>
    );
  }

  if (!cultivator) {
    return (
      <div className="flex h-full items-center justify-center px-4">
        <InkNotice>当前没有活跃角色，无法查看任务。</InkNotice>
      </div>
    );
  }

  const activeTasks = tasks.filter((task) => task.status === 'active');
  const completedTasks = tasks.filter((task) => task.status === 'completed');

  return (
    <GameSceneFrame
      title="任务中心"
      aside={
        <>
          <GameSceneAsideSection title="卷宗摘要">
            <div className="space-y-2 text-sm leading-7">
              <p>进行中：{activeTasks.length}</p>
              <p>已完成：{completedTasks.length}</p>
              <p className="text-ink-secondary">
                首版只收录破境相关任务，用来承接大境界突破的前置条件。
              </p>
            </div>
          </GameSceneAsideSection>

          <GameSceneAsideSection title="行事准则">
            <div className="space-y-2 text-sm leading-7">
              <p>大境界突破不再只看修为条。</p>
              <p>先把前置做完，再回静室冲关。</p>
            </div>
          </GameSceneAsideSection>
        </>
      }
    >
      <GameSceneSection title="进行中">
        {loading ? (
          <p className="text-sm text-ink-secondary">正在推演当前任务……</p>
        ) : error ? (
          <InkNotice>{error}</InkNotice>
        ) : activeTasks.length === 0 ? (
          <p className="text-sm leading-7 text-ink-secondary">
            当前没有进行中的破境任务。若已临大境界圆满，回静室或稍后刷新即可生成。
          </p>
        ) : (
          <div className="space-y-4">
            {activeTasks.map((task) => (
              <BreakthroughTaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </GameSceneSection>

      <GameSceneSection title="已完成">
        {completedTasks.length === 0 ? (
          <p className="text-sm leading-7 text-ink-secondary">
            还没有归档完成的破境任务。
          </p>
        ) : (
          <div className="space-y-4">
            {completedTasks.map((task) => (
              <BreakthroughTaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </GameSceneSection>
    </GameSceneFrame>
  );
}
