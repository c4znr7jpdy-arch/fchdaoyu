import Link from '@app/components/router/AppLink';
import { InkBadge, Tier } from '../ui';
import type { GameHudSnapshot } from './useGameHudModel';

function HudMeter({
  label,
  display,
  percent,
  tone,
}: GameHudSnapshot['metrics'][number]) {
  const toneClass =
    tone === 'hp'
      ? 'bg-crimson'
      : tone === 'mp'
        ? 'bg-teal'
        : tone === 'progress'
          ? 'bg-ink'
          : 'bg-wood';

  return (
    <div className="min-w-0 space-y-0.5">
      <div className="flex items-center justify-between gap-1.5 text-[0.62rem] leading-3.5 md:gap-2 md:text-[0.74rem] md:leading-4">
        <span className="text-battle-muted shrink-0 tracking-[0.12em]">
          {label}
        </span>
        <span className="text-ink shrink-0 text-right font-mono text-[0.66rem] md:text-[0.8rem]">
          {display}
        </span>
      </div>
      <div className="bg-battle-faint h-[3px] min-w-0 overflow-hidden">
        <div
          className={`${toneClass} h-full`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export function GameTopHud({ snapshot }: { snapshot: GameHudSnapshot | null }) {
  if (!snapshot) return null;

  return (
    <header className="border-ink/10 border-b border-dashed">
      <Link
        href="/game/cultivator"
        className="mx-auto block w-full max-w-5xl px-2.5 py-2 text-left sm:px-3 md:px-6"
      >
        <div className="grid grid-cols-[minmax(0,0.96fr)_minmax(0,1.04fr)] gap-2 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-5">
          <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-2 md:gap-4">
            <div
              aria-hidden="true"
              className="border-ink/12 bg-bgpaper/85 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-dashed sm:w-16 md:h-16"
            >
              <img
                src="/assets/daoyou_logo.png"
                alt=""
                className="h-10 w-10 object-contain md:h-12 md:w-12"
              />
            </div>

            <div className="min-w-0 space-y-2">
              <div className="flex min-w-0 items-end gap-1.5 md:gap-2.5">
                <div className="font-heading min-w-0 truncate text-2xl leading-none md:text-3xl">
                  {snapshot.name}
                </div>
                {snapshot.title ? (
                  <div className="text-crimson hidden text-xs md:inline-block md:text-sm">
                    <span className="truncate">「{snapshot.title}」</span>
                  </div>
                ) : null}
              </div>

              <div className="flex min-w-0 flex-wrap gap-x-2 gap-y-0.5 text-xs leading-3.5 md:gap-x-4 md:text-sm">
                <div className="bg-ink/5 border-ink/15 flex min-w-0 gap-2 rounded border border-dashed p-1">
                  <span className="text-battle-muted shrink-0">状态</span>
                  <span className="text-ink truncate">
                    {snapshot.statusText}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="min-w-0">
            <div className="mb-1 flex items-center justify-end gap-2 text-xs md:text-sm">
              <InkBadge
                className="text-[0.68rem] md:text-sm"
                compact
                tier={snapshot.realm as Tier}
              >
                {snapshot.realmStage}
              </InkBadge>
              <span>/</span>
              <div className="flex items-center justify-between gap-2">
                <span className="text-battle-muted shrink-0">灵石</span>
                <span className="text-ink shrink-0 text-right">
                  {snapshot.spiritStones}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 md:gap-x-4 md:gap-y-2">
              {snapshot.metrics.map(({ key, ...metric }) => (
                <HudMeter key={key} {...metric} />
              ))}
            </div>
          </div>
        </div>
      </Link>
    </header>
  );
}
