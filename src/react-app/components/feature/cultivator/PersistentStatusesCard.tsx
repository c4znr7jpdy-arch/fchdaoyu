import { GameSceneSection } from '@app/components/game-shell/GameSceneSection';
import { useCultivator } from '@app/lib/contexts/CultivatorContext';
import { getPillToxicityStage, isConditionStatusActive } from '@shared/lib/condition';
import { getConditionStatusTemplate } from '@shared/lib/conditionStatusRegistry';
import { getAllTrackConfigs } from '@shared/lib/trackConfigRegistry';
import { useState } from 'react';

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
  const trackConfigs = getAllTrackConfigs();
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
    })
    .filter(
      (entry) =>
        entry.config.key === 'marrow_wash' ||
        entry.level > 0 ||
        entry.progress > 0,
    )
    .sort((left, right) => {
      if (left.config.key === 'marrow_wash') return -1;
      if (right.config.key === 'marrow_wash') return 1;
      return 0;
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

function StatusMetric({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="bg-ink/5 border-ink/10 border border-dashed px-3 py-2 text-sm">
      <div className="opacity-60">{label}</div>
      <div className="text-ink mt-1 font-semibold">{value}</div>
      {note ? <div className="mt-1 text-xs opacity-60">{note}</div> : null}
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
      <div className="grid grid-cols-3 gap-2">
        <StatusMetric
          label="气血"
          value={`${state.currentHp} / ${state.maxHp}`}
        />
        <StatusMetric
          label="真元"
          value={`${state.currentMp} / ${state.maxMp}`}
        />
        <StatusMetric
          label="丹毒"
          value={`${state.pillToxicity}`}
          note={state.pillToxicityStage.label}
        />
      </div>

      {state.statuses.map((status, index) => {
        const template = getConditionStatusTemplate(status.key);
        return (
          <div
            key={`${status.key}:${index}`}
            className="bg-ink/5 border-ink/10 flex items-center justify-between gap-3 border border-dashed px-3 py-2"
          >
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span className="shrink-0 text-lg">
                {template?.display.icon ?? '💫'}
              </span>
              <div className="min-w-0">
                <div className="text-ink text-sm font-medium">
                  {template?.name ?? status.key}
                </div>
                <div className="text-xs opacity-60">
                  {template?.display.shortDesc ?? template?.description ?? '长期状态影响'}
                </div>
              </div>
            </div>
            <div className="shrink-0 text-right text-xs">
              {status.duration.kind === 'time' ? (
                <div className="font-semibold">
                  {formatRemainingTime(status.duration.expiresAt, state.now)}
                </div>
              ) : null}
              {typeof status.usesRemaining === 'number' &&
              status.usesRemaining > 0 ? (
                <div className="opacity-60">{status.usesRemaining}次</div>
              ) : null}
            </div>
          </div>
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
      <div className="border-ink/15 overflow-hidden border border-dashed">
        {state.trackEntries.map(({ config, level, progress, threshold }) => (
          <div
            key={config.key}
            className="border-ink/10 flex items-center justify-between gap-3 border-b border-dashed px-3 py-2 text-sm last:border-b-0"
          >
            <span className="text-ink min-w-0">{config.name}</span>
            <div className="flex shrink-0 items-center gap-3">
              <span className="font-semibold">Lv.{level}</span>
              <span className="font-mono text-xs">
                {progress} / {threshold}
              </span>
            </div>
          </div>
        ))}
      </div>
    </GameSceneSection>
  );
}
