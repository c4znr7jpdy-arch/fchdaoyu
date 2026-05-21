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

export function BreakthroughTaskCard({
  task,
  className,
}: {
  task: TaskInstance;
  className?: string;
}) {
  const currentStage = task.snapshot.stages.find((stage) => stage.current);

  return (
    <div
      className={cn(
        'border-ink/10 bg-[rgba(248,243,230,0.82)] space-y-4 border border-dashed p-4',
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold tracking-[0.08em] text-ink">
              {task.snapshot.title}
            </p>
            <StatusPill
              text={task.status === 'completed' ? '前置已成' : '仍在筹备'}
              tone={task.status === 'completed' ? 'ready' : 'pending'}
            />
          </div>
          <p className="text-xs text-ink-secondary">
            {task.snapshot.fromRealm} → {task.snapshot.toRealm}
          </p>
        </div>
      </div>

      <p className="text-sm leading-7 text-ink-secondary">{task.snapshot.summary}</p>

      {currentStage ? (
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-ink">{currentStage.title}</p>
            <p className="text-xs leading-6 text-ink-secondary">
              {currentStage.description}
            </p>
          </div>

          <div className="space-y-2 text-sm leading-7">
            {currentStage.objectives.map((objective) => (
              <div
                key={objective.id}
                className="border-ink/10 flex items-start justify-between gap-3 border-b border-dashed pb-2 last:border-b-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="text-ink">{objective.title}</p>
                  <p className="text-xs text-ink-secondary">
                    {objective.progressText}
                  </p>
                </div>
                <span
                  className={cn(
                    'shrink-0 text-xs',
                    objective.completed ? 'text-emerald-700' : 'text-amber-900',
                  )}
                >
                  {objective.completed ? '已成' : '未成'}
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {currentStage.links.map((link) => (
              <InkButton key={`${task.id}:${link.href}:${link.label}`} href={link.href}>
                {link.label}
              </InkButton>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm font-medium text-emerald-800">前置条件已全部满足</p>
          <p className="text-xs leading-6 text-ink-secondary">
            现在可以回静室正式冲击 {task.snapshot.toRealm}。
          </p>
          <div className="flex flex-wrap gap-2">
            <InkButton href="/game/retreat" variant="primary">
              返回静室
            </InkButton>
          </div>
        </div>
      )}
    </div>
  );
}
