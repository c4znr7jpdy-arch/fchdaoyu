import { InkButton } from '@app/components/ui/InkButton';
import { cn } from '@shared/lib/cn';
import type { TaskInstance } from '@shared/types/task';

function StatusPill({
  text,
  tone,
}: {
  text: string;
  tone: 'ready' | 'pending';
}) {
  return (
    <span
      className={cn(
        'rounded-full border px-2 py-0.5 text-[11px] tracking-[0.08em]',
        tone === 'ready'
          ? 'border-emerald-700/25 bg-emerald-50 text-emerald-800'
          : 'border-amber-700/25 bg-amber-50 text-amber-900',
      )}
    >
      {text}
    </span>
  );
}

export function DailyTaskCard({
  task,
  className,
}: {
  task: TaskInstance;
  className?: string;
}) {
  const currentStage =
    task.snapshot.stages.find((stage) => stage.current) ?? task.snapshot.stages[0] ?? null;
  const rewardSummary = task.snapshot.rewardSummary ?? task.metadata.rewardSummary ?? [];

  return (
    <div
      className={cn(
        'space-y-4 border border-dashed border-ink/10 bg-[rgba(248,243,230,0.72)] p-4',
        className,
      )}
    >
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-base font-semibold tracking-[0.04em] text-ink">
            {task.snapshot.title}
          </p>
          <StatusPill
            text={task.status === 'completed' ? '今日已成' : '今日待办'}
            tone={task.status === 'completed' ? 'ready' : 'pending'}
          />
        </div>
        <p className="text-sm leading-7 text-ink-secondary">
          {currentStage?.description ?? task.snapshot.summary}
        </p>
      </div>

      {currentStage ? (
        <div className="space-y-2 text-sm leading-7">
          {currentStage.objectives.map((objective) => (
            <div key={objective.id} className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-ink">{objective.title}</p>
                <p className="text-xs leading-6 text-ink-secondary">
                  当前进度：{objective.progressText}
                </p>
              </div>
              <span
                className={cn(
                  'shrink-0 text-xs',
                  objective.completed ? 'text-emerald-700' : 'text-ink-secondary',
                )}
              >
                {objective.completed ? '已成' : '待办'}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      <div className="space-y-1 text-xs leading-6 text-ink-secondary">
        {rewardSummary.length > 0 ? (
          <p>完成奖励：{rewardSummary.join('，')}</p>
        ) : null}
        <p>每日凌晨重置</p>
      </div>

      {task.status !== 'completed' && currentStage && currentStage.links.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {currentStage.links.map((link) => (
            <InkButton key={`${task.id}:${link.href}:${link.label}`} href={link.href}>
              {link.label}
            </InkButton>
          ))}
        </div>
      ) : null}
    </div>
  );
}
