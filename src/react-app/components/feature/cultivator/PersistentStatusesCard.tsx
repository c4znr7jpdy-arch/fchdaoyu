import { GameSceneSection } from '@app/components/game-shell/GameSceneSection';
import { useCultivator } from '@app/lib/contexts/CultivatorContext';
import { getPillToxicityStage, isConditionStatusActive } from '@shared/lib/condition';
import { getConditionStatusTemplate } from '@shared/lib/conditionStatusRegistry';
import { getAllTrackConfigs } from '@shared/lib/trackConfigRegistry';
import { cn } from '@shared/lib/cn';
import { getResourceLabel } from '@shared/lib/resourceText';
import type { ConditionTrackPath } from '@shared/types/condition';
import { useState } from 'react';

const TRACK_ORDER: ConditionTrackPath[] = [
  'marrow_wash',
  'tempering.vitality',
  'tempering.spirit',
  'tempering.wisdom',
  'tempering.speed',
  'tempering.willpower',
];

function formatRemainingTime(expiresAt: string | undefined, now: number): string {
  if (!expiresAt) return '永久';
  const expiresAtMs = Date.parse(expiresAt);
  if (!Number.isFinite(expiresAtMs)) return '永久';

  const remaining = expiresAtMs - now;
  if (remaining <= 0) return '已过期';

  const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
  const hours = Math.floor(remaining / (60 * 60 * 1000));
  const minutes = Math.floor(remaining / (60 * 1000));

  if (days >= 1) return `${days}日`;
  if (hours >= 1) return `${hours}时`;
  return `${minutes}分`;
}

function usePersistentStatusState() {
  const { cultivator, finalAttributes } = useCultivator();
  const [now] = useState(() => Date.now());

  if (!cultivator) return null;
  const statuses = (cultivator.condition?.statuses ?? []).filter((status) =>
    isConditionStatusActive(status, new Date(now)),
  );
  const maxHp = Math.max(0, Math.floor(finalAttributes?.maxHp ?? 0));
  const maxMp = Math.max(0, Math.floor(finalAttributes?.maxMp ?? 0));
  const currentHp = Math.max(
    0,
    Math.floor(cultivator.condition?.resources.hp.current ?? maxHp),
  );
  const currentMp = Math.max(
    0,
    Math.floor(cultivator.condition?.resources.mp.current ?? maxMp),
  );
  const pillToxicity = Math.max(
    0,
    Math.floor(cultivator.condition?.gauges.pillToxicity ?? 0),
  );
  const pillToxicityStage = getPillToxicityStage(cultivator.condition);
  const trackConfigs = getAllTrackConfigs().sort(
    (left, right) =>
      TRACK_ORDER.indexOf(left.key) - TRACK_ORDER.indexOf(right.key),
  );
  const trackEntries = trackConfigs
    .map((config) => {
      const state =
        config.key === 'marrow_wash'
          ? cultivator.condition?.tracks.marrowWash
          : cultivator.condition?.tracks.tempering[
              config.key.replace('tempering.', '') as keyof NonNullable<
                typeof cultivator.condition
              >['tracks']['tempering']
            ];
      const level = state?.level ?? 0;
      const progress = state?.progress ?? 0;
      const threshold = config.thresholdByLevel(level);
      return {
        config,
        level,
        progress,
        threshold,
      };
    });

  return {
    currentHp,
    currentMp,
    cultivator,
    maxHp,
    maxMp,
    now,
    pillToxicity,
    pillToxicityStage,
    statuses,
    trackEntries,
  };
}

function CompactInfoRow({
  icon,
  label,
  note,
  value,
  trailing,
  muted = false,
}: {
  icon: string;
  label: string;
  note?: string;
  value?: string;
  trailing?: string;
  muted?: boolean;
}) {
  const hasMeta = Boolean(value) || Boolean(trailing);

  return (
    <div
      className={cn(
        'border-ink/10 flex items-start justify-between gap-3 border-b border-dashed py-2.5 last:border-b-0',
        muted && 'opacity-60',
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span className="shrink-0 text-base leading-6" aria-hidden="true">
          {icon}
        </span>
        <div className="min-w-0">
          <div className="text-ink text-sm leading-6">{label}</div>
          {note ? (
            <div className="text-ink-secondary text-xs leading-5">{note}</div>
          ) : null}
        </div>
      </div>
      {hasMeta ? (
        <div className="shrink-0 text-right">
          {value ? (
            <div className="text-ink text-sm font-semibold leading-6">
              {value}
            </div>
          ) : null}
          {trailing ? (
            <div className="text-ink-secondary text-xs leading-5">
              {trailing}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function CultivatorCurrentStatusSection() {
  const state = usePersistentStatusState();

  if (!state) {
    return null;
  }

  const showResourceState =
    state.currentHp < state.maxHp ||
    state.currentMp < state.maxMp ||
    state.pillToxicity > 0;

  if (!showResourceState && state.statuses.length === 0) {
    return null;
  }

  return (
    <GameSceneSection title="当前状态" contentClassName="space-y-2">
      {showResourceState ? (
        <div>
          <CompactInfoRow
            icon="❤️"
            label={getResourceLabel('hp')}
            note="当前 / 上限"
            value={`${state.currentHp} / ${state.maxHp}`}
          />
          <CompactInfoRow
            icon="💧"
            label={getResourceLabel('mp')}
            note="当前 / 上限"
            value={`${state.currentMp} / ${state.maxMp}`}
          />
          <CompactInfoRow
            icon="☠️"
            label="丹毒"
            note={state.pillToxicityStage.label}
            value={`${state.pillToxicity}`}
          />
        </div>
      ) : null}

      {state.statuses.map((status, index) => {
        const template = getConditionStatusTemplate(status.key);
        return (
          <CompactInfoRow
            key={`${status.key}:${index}`}
            icon={template?.display.icon ?? '💫'}
            label={template?.name ?? status.key}
            note={
              template?.display.shortDesc ?? template?.description ?? '长期状态影响'
            }
            value={
              status.duration.kind === 'time'
                ? formatRemainingTime(status.duration.expiresAt, state.now)
                : undefined
            }
            trailing={
              typeof status.usesRemaining === 'number' && status.usesRemaining > 0
                ? `${status.usesRemaining}次`
                : undefined
            }
          />
        );
      })}
    </GameSceneSection>
  );
}

export function CultivatorTrackSection() {
  const state = usePersistentStatusState();

  if (!state || state.trackEntries.length === 0) {
    return null;
  }

  return (
    <GameSceneSection title="洗髓与炼体">
      <div>
        {state.trackEntries.map(({ config, level, progress, threshold }) => (
          <CompactInfoRow
            key={config.key}
            icon={config.key === 'marrow_wash' ? '🫧' : '🥋'}
            label={config.name}
            note={config.shortDesc}
            value={`Lv.${level}`}
            trailing={`${progress} / ${threshold}`}
            muted={level === 0 && progress === 0}
          />
        ))}
      </div>
    </GameSceneSection>
  );
}
