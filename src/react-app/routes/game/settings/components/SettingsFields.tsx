import { cn } from '@shared/lib/cn';
import type { ReactNode } from 'react';

export function SettingsField({
  label,
  value,
  action,
  mono = false,
}: {
  label: ReactNode;
  value: ReactNode;
  action?: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="border-ink/15 border-b border-dashed py-3">
      <div className="text-battle-muted text-[0.75rem] tracking-[0.18em]">
        {label}
      </div>
      <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2">
        <span
          className={cn(
            'text-ink min-w-0 break-all text-[0.95rem]',
            mono && 'font-mono text-[0.88rem]',
          )}
        >
          {value}
        </span>
        {action}
      </div>
    </div>
  );
}
