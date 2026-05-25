import { cn } from '@shared/lib/cn';
import type { ReactNode } from 'react';

interface HomeUrgentRowProps {
  title: ReactNode;
  summary: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function HomeUrgentRow({
  title,
  summary,
  action,
  className,
}: HomeUrgentRowProps) {
  return (
    <div
      className={cn(
        'border-ink/10 flex items-start gap-3 border-b border-dashed py-2 sm:items-center',
        className,
      )}
    >
      <div className="min-w-0 flex flex-1 items-start gap-2 sm:items-center">
        <div className="text-ink flex shrink-0 items-center gap-1 text-sm font-semibold tracking-[0.04em]">
          {title}
        </div>
        <div className="text-ink-secondary min-w-0 flex-1 break-words text-sm leading-6">
          {summary}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
