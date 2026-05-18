import { resolveGameScene } from '@app/lib/router/routeTitle';
import { cn } from '@shared/lib/cn';
import type { ReactNode } from 'react';
import { useMatches } from 'react-router';

const sceneGroupLabel: Record<string, string> = {
  cultivation: '静修',
  travel: '行路',
  craft: '造化',
  trade: '交易',
  service: '见闻',
};

export interface GameSceneFrameProps {
  title?: ReactNode;
  description?: ReactNode;
  headerMeta?: ReactNode;
  actionBar?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
  variant?: 'default' | 'lite' | 'workflow';
  contentClassName?: string;
}

export function GameSceneLoading({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center px-4">
      <p className="loading-tip">{message}</p>
    </div>
  );
}

export function GameSceneAsideSection({
  title,
  children,
  className,
}: {
  title: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'border-battle-rule-strong border border-dashed bg-[rgba(248,243,230,0.88)] px-4 py-4',
        className,
      )}
    >
      <div className="text-battle-muted mb-2 text-xs tracking-[0.2em]">
        {title}
      </div>
      {children}
    </section>
  );
}

function normalizeSceneText(value: ReactNode): string | null {
  if (typeof value === 'string' || typeof value === 'number') {
    return `${value}`.replace(/[【】[\]\s]/g, '').trim();
  }

  return null;
}

function SceneStrip({
  group,
  label,
  summary,
}: {
  group: string | null;
  label: string;
  summary: string | null;
}) {
  return (
    <div className="border-battle-rule-strong border-b border-dashed pb-3">
      <div className="min-w-0">
        <div className="flex flex-wrap items-end gap-x-2 gap-y-1 md:gap-x-3">
          <div className="font-heading text-ink text-[1.45rem] leading-none md:text-[1.8rem]">
            {label}
          </div>
          {group ? (
            <>
              <div className="text-battle-muted text-sm leading-none">/</div>
              <div className="text-battle-muted font-sans text-[0.78rem] leading-none tracking-[0.16em] md:text-[0.82rem]">
                {group}
              </div>
            </>
          ) : null}
        </div>
        <div className="text-ink-secondary mt-2 min-w-0 text-sm leading-6">
          {summary ?? '此处事务已收束，按眼前所需行事即可。'}
        </div>
      </div>
    </div>
  );
}

export function GameSceneFrame({
  title,
  description,
  headerMeta,
  actionBar,
  aside,
  children,
  variant = 'default',
  contentClassName,
}: GameSceneFrameProps) {
  const matches = useMatches();
  const scene = resolveGameScene(matches);
  const sceneGroup = scene?.group ? sceneGroupLabel[scene.group] : null;
  const normalizedTitle = normalizeSceneText(title);
  const contentTitle =
    normalizedTitle && normalizedTitle !== normalizeSceneText(scene?.label)
      ? title
      : null;
  const sceneSummary =
    scene?.summary?.trim() ||
    (typeof description === 'string' ? description.trim() : null) ||
    null;
  const frameWidthClass = variant === 'lite' ? 'max-w-4xl' : 'max-w-5xl';
  const contentSpacingClass =
    variant === 'default' ? 'mt-4 space-y-5' : 'mt-4 space-y-4';
  const asideWidthClass =
    variant === 'workflow'
      ? 'lg:grid-cols-[minmax(0,1fr)_280px]'
      : 'lg:grid-cols-[minmax(0,1fr)_240px]';

  return (
    <div className="battle-scroll h-full overflow-y-auto">
      <div
        className={cn(
          'mx-auto w-full px-3 py-3 md:px-6 md:py-4',
          frameWidthClass,
        )}
      >
        <div className={cn('grid gap-4', aside ? asideWidthClass : '')}>
          <section className="border-battle-rule-strong animate-fade-in border border-dashed bg-[rgba(248,243,230,0.88)] px-4 py-4 md:px-5 md:py-5">
            <SceneStrip
              group={sceneGroup}
              label={scene?.label ?? normalizeSceneText(title) ?? '道途'}
              summary={sceneSummary}
            />

            {contentTitle ? (
              <div className="border-battle-rule-strong mt-4 border-b border-dashed pb-3">
                <h1 className="font-heading text-ink text-xl md:text-2xl">
                  {contentTitle}
                </h1>
              </div>
            ) : null}

            {headerMeta ? <div className="mt-4">{headerMeta}</div> : null}

            <div className={cn(contentSpacingClass, contentClassName)}>
              {children}
            </div>

            {actionBar ? (
              <div className="border-battle-rule-strong mt-5 border-t border-dashed pt-4">
                {actionBar}
              </div>
            ) : null}
          </section>

          {aside ? <aside className="space-y-4">{aside}</aside> : null}
        </div>
      </div>
    </div>
  );
}
