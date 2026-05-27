import { useInkUI } from '@app/components/providers/InkUIProvider';
import {
  GameSceneAsideSection,
  GameSceneFrame,
  GameSceneLoading,
  GameSceneNote,
  GameSceneSection,
} from '@app/components/game-shell';
import { useCultivator } from '@app/lib/contexts/CultivatorContext';
import {
  useTowerActions,
  type TowerProbeResponse,
} from '@app/lib/hooks/tower/useTowerActions';
import { useTowerLeaderboard } from '@app/lib/hooks/tower/useTowerLeaderboard';
import { useTowerState } from '@app/lib/hooks/tower/useTowerState';
import {
  getTowerBlessingDefinition,
  getTowerBlessingEffectPreview,
  type TowerBattleContext,
  type TowerBlessingId,
  type TowerSeasonMeta,
  type TowerSettlement,
  type TowerState,
} from '@shared/lib/tower';
import { getConditionStatusTemplate } from '@shared/lib/conditionStatusRegistry';
import { REALM_VALUES, type RealmType } from '@shared/types/constants';
import { InkBadge } from '@app/components/ui/InkBadge';
import { InkButton } from '@app/components/ui/InkButton';
import { InkCard } from '@app/components/ui/InkCard';
import {
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router';
import { TowerBlessingDetailModal } from './components/TowerBlessingDetailModal';
import { TowerEnemyDetailModal } from './components/TowerEnemyDetailModal';
import { TowerLeaderboard } from './components/TowerLeaderboard';
import {
  describeEncounterLabel,
  describeFloorPressure,
  formatDepthLabel,
  formatSeasonReset,
} from './utils';

const TOWER_SCENE_NAME = '蜃楼幻境';

function buildScenePulse(args: {
  state: TowerState | null;
  settlement?: TowerSettlement;
  season?: TowerSeasonMeta;
}) {
  const resetLine = args.season
    ? `下次境门改换：${formatSeasonReset(args.season.nextResetAt)}。`
    : null;

  if (!args.state) {
    return {
      summary:
        '蜃气本周方聚。踏入之后，境内气血、法力与外界断开，各自记账。',
      resetLine,
    };
  }

  if (args.state.status === 'FINISHED') {
    return {
      summary:
        args.settlement?.endReason === 'clear'
          ? '百重幻影已尽数散去，本周这一回幻境已被你走到尽头。'
          : `本周已在${formatDepthLabel(args.state.currentFloor)}止步，榜上最高留痕仍会保留。`,
      resetLine,
    };
  }

  return {
    summary: `你已行至${formatDepthLabel(args.state.currentFloor)}，境中气息仍停在上一场交手之后。`,
    resetLine,
  };
}

function summarizeBlessings(blessings: TowerState['blessings']) {
  return Object.entries(blessings).flatMap(([id, stacks]) => {
    if (typeof stacks !== 'number' || stacks <= 0) {
      return [];
    }

    const blessingId = id as TowerBlessingId;
    return [
      {
        id: blessingId,
        stacks,
        definition: getTowerBlessingDefinition(blessingId),
      },
    ];
  });
}

function getMeterPercent(current: number, max: number) {
  if (!Number.isFinite(max) || max <= 0) {
    return 0;
  }

  const percent = (current / max) * 100;
  return Math.max(0, Math.min(100, percent));
}

function TowerRunResourceMeter({
  label,
  current,
  max,
  tone,
}: {
  label: string;
  current: number;
  max: number;
  tone: 'hp' | 'mp';
}) {
  const percent = getMeterPercent(current, max);
  const toneClass = tone === 'hp' ? 'bg-crimson' : 'bg-teal';

  return (
    <div className="min-w-0 space-y-1.5">
      <div className="flex items-center justify-between gap-2 text-[0.68rem] leading-4 sm:text-[0.72rem]">
        <span className="text-battle-muted shrink-0 tracking-[0.14em]">
          {label}
        </span>
        <span className="text-ink shrink-0 text-right font-mono text-[0.72rem] sm:text-[0.82rem]">
          {current} / {max}
        </span>
      </div>
      <div className="bg-battle-faint h-[5px] min-w-0 overflow-hidden rounded-full">
        <div
          className={`${toneClass} h-full rounded-full`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function TowerAside({
  season,
  state,
  settlement,
  onReset,
}: {
  season?: TowerSeasonMeta;
  state: TowerState | null;
  settlement?: TowerSettlement;
  onReset: () => Promise<boolean>;
}) {
  return (
    <>
      <GameSceneAsideSection title="境门时刻">
        {season ? (
          <div className="space-y-2 text-sm leading-7">
            <div>下次改换：{formatSeasonReset(season.nextResetAt)}</div>
            <div>本周留痕随境门一并改写。</div>
          </div>
        ) : (
          <p className="text-sm leading-7">天象未明，暂难测定境门轮替。</p>
        )}
      </GameSceneAsideSection>

      {settlement ? (
        <GameSceneAsideSection title="此行止处">
          <div className="space-y-2 text-sm leading-7">
            <div>最高所至：{formatDepthLabel(settlement.highestFloorCleared)}</div>
            <div>
              终局：
              {settlement.endReason === 'clear'
                ? '百重尽破'
                : `止于${formatDepthLabel(settlement.finalFloor)}`}
            </div>
          </div>
        </GameSceneAsideSection>
      ) : null}

      {state ? (
        <GameSceneAsideSection title="再启此境">
          <InkButton variant="secondary" className="w-full" onClick={onReset}>
            重开本周幻境
          </InkButton>
        </GameSceneAsideSection>
      ) : null}
    </>
  );
}

function TowerRunStatusCard({
  state,
  maxHp,
  maxMp,
  onOpenBlessing,
  onOpenStatuses,
}: {
  state: TowerState;
  maxHp: number;
  maxMp: number;
  onOpenBlessing: (blessingId: TowerBlessingId, currentStacks: number) => void;
  onOpenStatuses: () => void;
}) {
  const blessings = summarizeBlessings(state.blessings);
  const statusSummary = state.condition.statuses.length
    ? state.condition.statuses
        .map((status) => {
          const template = getConditionStatusTemplate(status.key);
          const label = template?.name ?? status.key;
          return status.stacks > 1 ? `${label} ${status.stacks} 层` : label;
        })
        .join('，')
    : '暂无明显伤势，境中气息尚稳。';

  return (
    <GameSceneSection title="塔中留痕">
      <InkCard className="space-y-4 p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:items-start">
          <div className="grid grid-cols-2 gap-2.5">
            <div className="border-ink/12 bg-ink/5 space-y-1 rounded-none border border-dashed px-3 py-2.5">
              <div className="text-ink-secondary text-[0.68rem] tracking-[0.14em]">
                当前所至
              </div>
              <div className="text-base font-semibold sm:text-lg">
                {formatDepthLabel(state.currentFloor)}
              </div>
            </div>
            <div className="border-ink/12 bg-ink/5 space-y-1 rounded-none border border-dashed px-3 py-2.5">
              <div className="text-ink-secondary text-[0.68rem] tracking-[0.14em]">
                本周最高
              </div>
              <div className="text-base font-semibold sm:text-lg">
                {formatDepthLabel(state.highestFloorCleared)}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <TowerRunResourceMeter
              label="境内气血"
              current={state.condition.resources.hp.current}
              max={maxHp}
              tone="hp"
            />
            <TowerRunResourceMeter
              label="境内法力"
              current={state.condition.resources.mp.current}
              max={maxMp}
              tone="mp"
            />
          </div>
        </div>

        <div className="border-ink/15 border-t border-dashed pt-4">
          <div className="flex items-center justify-between gap-3">
            <div className="font-semibold">伤势与余痕</div>
            {state.condition.statuses.length > 0 ? (
              <button
                type="button"
                className="text-ink-secondary hover:text-ink text-xs underline decoration-dotted underline-offset-4 transition-colors"
                onClick={onOpenStatuses}
              >
                查看详情
              </button>
            ) : null}
          </div>
          <p className="text-ink-secondary mt-2 text-sm leading-7">
            {statusSummary}
          </p>
        </div>

        <div className="border-ink/15 border-t border-dashed pt-4">
          <div className="font-semibold">已承机缘</div>
          {blessings.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {blessings.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="border-ink/15 hover:border-crimson/35 hover:text-ink rounded-none border border-dashed px-2 py-1 text-left text-sm transition-colors"
                  onClick={() => onOpenBlessing(item.id, item.stacks)}
                >
                  {item.definition.name} · {item.stacks}/{item.definition.maxStacks}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-ink-secondary mt-2 text-sm leading-7">
              尚未承接塔中机缘。
            </p>
          )}
        </div>
      </InkCard>
    </GameSceneSection>
  );
}

function TowerEncounterCard({
  probe,
  loading,
  onRetryProbe,
  onStartBattle,
  onOpenDetail,
}: {
  probe: TowerProbeResponse | null;
  loading: boolean;
  onRetryProbe: () => void;
  onStartBattle: () => void;
  onOpenDetail: () => void;
}) {
  if (!probe) {
    return (
      <GameSceneSection title="眼前幻影">
        <InkCard className="space-y-4 p-4">
          <p className="text-sm leading-7">
            这重幻影尚未显形，需先凝神照见其轮廓，方可入境交手。
          </p>
          <div className="flex justify-end">
            <InkButton
              variant="primary"
              disabled={loading}
              onClick={onRetryProbe}
            >
              {loading ? '照见中...' : '照见前路幻影'}
            </InkButton>
          </div>
        </InkCard>
      </GameSceneSection>
    );
  }

  const enemy = probe.enemy;
  const atmosphereCopy =
    enemy.description ??
    enemy.background ??
    '那道幻影已在塔中凝实，正静候你踏入此战。';

  return (
    <GameSceneSection title="眼前幻影">
      <InkCard className="space-y-5 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-ink-secondary text-sm">
              {formatDepthLabel(probe.encounter.floor)} ·{' '}
              {describeEncounterLabel(probe.encounter.kind)}
            </div>
            <div className="mt-2 text-[1.35rem] leading-tight font-semibold">
              {enemy.name}
            </div>
            <div className="text-ink-secondary mt-1 text-sm leading-7">
              {probe.encounter.realm} {probe.encounter.realmStage}
              {enemy.title ? ` · 「${enemy.title}」` : ''}
            </div>
          </div>
          <InkBadge tier={probe.encounter.realm}>
            {describeFloorPressure(probe.encounter.floor)}
          </InkBadge>
        </div>

        <p className="text-sm leading-8">{atmosphereCopy}</p>

        <div className="flex justify-end gap-4">
          <InkButton variant="secondary" onClick={onOpenDetail}>
            查看详情
          </InkButton>
          <InkButton variant="primary" onClick={onStartBattle}>
            入境交手
          </InkButton>
        </div>
      </InkCard>
    </GameSceneSection>
  );
}

function TowerBlessingChoices({
  state,
  processing,
  currentHp,
  maxHp,
  currentMp,
  maxMp,
  onChoose,
  onOpenDetail,
}: {
  state: TowerState;
  processing: boolean;
  currentHp: number;
  maxHp: number;
  currentMp: number;
  maxMp: number;
  onChoose: (blessingId: TowerBlessingId) => Promise<void>;
  onOpenDetail: (
    blessingId: TowerBlessingId,
    currentStacks: number,
    nextStacks: number,
  ) => void;
}) {
  const [focusedId, setFocusedId] = useState<TowerBlessingId | null>(
    state.pendingBlessingChoices[0]?.id ?? null,
  );

  useEffect(() => {
    setFocusedId((current) => {
      if (
        current &&
        state.pendingBlessingChoices.some((choice) => choice.id === current)
      ) {
        return current;
      }

      return state.pendingBlessingChoices[0]?.id ?? null;
    });
  }, [state.pendingBlessingChoices]);

  return (
    <GameSceneSection title="残留机缘">
      <div className="grid gap-4 md:grid-cols-3">
        {state.pendingBlessingChoices.map((choice) => {
          const isFocused = focusedId === choice.id;
          const preview = getTowerBlessingEffectPreview({
            blessingId: choice.id,
            currentStacks: choice.currentStacks,
            nextStacks: choice.nextStacks,
            currentHp,
            maxHp,
            currentMp,
            maxMp,
          });

          return (
            <InkCard
              key={choice.id}
              variant={isFocused ? 'highlighted' : 'default'}
              className={isFocused ? 'md:-translate-y-1' : ''}
            >
              <div className="flex h-full flex-col gap-4 p-4">
                <button
                  type="button"
                  className="min-w-0 text-left"
                  onClick={() => setFocusedId(choice.id)}
                >
                  <div className="text-lg font-semibold">{choice.name}</div>
                  <div className="text-ink-secondary mt-2 text-sm leading-7">
                    {choice.description}
                  </div>
                  <div className="text-ink-secondary mt-3 text-xs leading-6">
                    当前 {choice.currentStacks} 层 → 选后 {choice.nextStacks} 层 / 上限{' '}
                    {choice.maxStacks}
                  </div>
                  <div className="mt-3 space-y-1 text-sm leading-7">
                    <p>{preview.currentLabel}</p>
                    <p className="text-ink-secondary">选后：{preview.nextLabel}</p>
                  </div>
                </button>

                <div className="mt-auto flex items-center justify-between gap-3">
                  <button
                    type="button"
                    className="text-ink-secondary hover:text-ink text-xs underline decoration-dotted underline-offset-4 transition-colors"
                    onClick={() =>
                      onOpenDetail(choice.id, choice.currentStacks, choice.nextStacks)
                    }
                  >
                    查看详情
                  </button>
                  {isFocused ? (
                    <InkButton
                      variant="primary"
                      disabled={processing}
                      onClick={() => void onChoose(choice.id)}
                    >
                      承此机缘
                    </InkButton>
                  ) : (
                    <span className="text-ink-secondary text-xs">聚神选此机缘</span>
                  )}
                </div>
              </div>
            </InkCard>
          );
        })}
      </div>
    </GameSceneSection>
  );
}

function TowerSettlementSection({
  settlement,
  onRestart,
}: {
  settlement: TowerSettlement;
  onRestart: () => Promise<void>;
}) {
  return (
    <GameSceneSection title="此行回响">
      <InkCard className="space-y-4 p-5">
        <div className="space-y-2">
          <div className="text-lg font-semibold">
            {settlement.endReason === 'clear'
              ? '百重幻影尽散，本周这一回已走到尽头。'
              : `此行止于${formatDepthLabel(settlement.finalFloor)}。`}
          </div>
          <div className="text-ink-secondary text-sm leading-7">
            本周最高所至：{formatDepthLabel(settlement.highestFloorCleared)}
          </div>
        </div>

        {settlement.milestoneRewards.length > 0 ? (
          <div className="space-y-2">
            <div className="font-semibold">此行已得机缘</div>
            <div className="space-y-2 text-sm leading-7">
              {settlement.milestoneRewards.map((reward) => (
                <div key={`${reward.floor}-${reward.grantedAt}`}>
                  {formatDepthLabel(reward.floor)} · {reward.tier} 级奖励 ·
                  {reward.rewards.map((item) => `${item.type} +${item.value}`).join('，')}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex justify-end">
          <InkButton variant="primary" onClick={() => void onRestart()}>
            重开本周幻境
          </InkButton>
        </div>
      </InkCard>
    </GameSceneSection>
  );
}

export default function TowerPage() {
  const { cultivator, finalAttributes, isLoading: cultivatorLoading } =
    useCultivator();
  const { openDialog } = useInkUI();
  const navigate = useNavigate();
  const { payload, setPayload, loading } = useTowerState(!!cultivator);
  const { startRun, probeBattle, chooseBlessing, resetRun, processing } =
    useTowerActions();
  const [selectedRealm, setSelectedRealm] = useState<RealmType | null>(null);
  const activeRealm = selectedRealm ?? cultivator?.realm ?? REALM_VALUES[0];
  const { payload: leaderboardPayload, loading: leaderboardLoading } =
    useTowerLeaderboard(!!cultivator, activeRealm);
  const [probe, setProbe] = useState<TowerProbeResponse | null>(null);
  const [selectedBlessingDetail, setSelectedBlessingDetail] = useState<{
    blessingId: TowerBlessingId;
    currentStacks: number;
    nextStacks?: number;
  } | null>(null);
  const [isEnemyDetailOpen, setIsEnemyDetailOpen] = useState(false);
  const probeRequestBattleIdRef = useRef<string | null>(null);

  const towerState = payload?.state ?? null;
  const settlement = payload?.settlement;
  const season = payload?.season ?? leaderboardPayload?.season;
  const maxHp = finalAttributes?.maxHp ?? 0;
  const maxMp = finalAttributes?.maxMp ?? 0;
  const scenePulse = buildScenePulse({
    state: towerState,
    settlement,
    season,
  });
  const blessings = useMemo(
    () => (towerState ? summarizeBlessings(towerState.blessings) : []),
    [towerState],
  );
  const encounterProbe =
    towerState?.status === 'WAITING_BATTLE' &&
    probe?.battleId === towerState.activeBattleId
      ? probe
      : null;
  const encounterContext: TowerBattleContext | null = encounterProbe
    ? {
        battleId: encounterProbe.battleId,
        encounter: encounterProbe.encounter,
        enemy: encounterProbe.enemy,
      }
    : null;
  const requestProbeBattleInEffect = useEffectEvent(() => probeBattle());

  const handleStartRun = async () => {
    const data = await startRun();
    if (!data) return;
    setPayload(data);
    setProbe(null);
    probeRequestBattleIdRef.current = null;
  };

  const handleResetRun = async () => {
    const success = await resetRun();
    if (!success) return false;
    setPayload((current) =>
      current?.season ?? leaderboardPayload?.season
        ? {
            season: current?.season ?? leaderboardPayload!.season,
            state: null,
            settlement: undefined,
          }
        : null,
    );
    setProbe(null);
    probeRequestBattleIdRef.current = null;
    return true;
  };

  const handleProbeBattle = async () => {
    const data = await probeBattle();
    if (!data) return false;
    probeRequestBattleIdRef.current = data.battleId;
    setPayload({
      season: data.season,
      state: data.state,
    });
    setProbe(data);
    return true;
  };

  const handleChooseBlessing = async (blessingId: TowerBlessingId) => {
    const data = await chooseBlessing(blessingId);
    if (!data) return;
    setPayload(data);
    setProbe(null);
    probeRequestBattleIdRef.current = null;
    setSelectedBlessingDetail(null);
  };

  const handleOpenStatusDetails = () => {
    if (!towerState || towerState.condition.statuses.length === 0) {
      return;
    }

    openDialog({
      title: '塔中伤势与余痕',
      confirmLabel: '知晓',
      cancelLabel: null,
      content: (
        <div className="space-y-3 text-sm leading-7">
          {towerState.condition.statuses.map((status, index) => {
            const template = getConditionStatusTemplate(status.key);
            return (
              <div key={`${status.key}:${index}`} className="space-y-1">
                <div className="font-semibold">
                  {template?.name ?? status.key}
                  {status.stacks > 1 ? ` · ${status.stacks} 层` : ''}
                </div>
                <div className="text-ink-secondary">
                  {template?.description ?? '未知状态'}
                </div>
                {template?.effectDetails?.length ? (
                  <div className="text-ink-secondary">
                    {template.effectDetails.join(' ')}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ),
    });
  };

  useEffect(() => {
    const activeBattleId = towerState?.activeBattleId;
    if (towerState?.status !== 'WAITING_BATTLE' || !activeBattleId) {
      probeRequestBattleIdRef.current = null;
      return;
    }

    if (encounterProbe || processing) {
      return;
    }

    if (probeRequestBattleIdRef.current === activeBattleId) {
      return;
    }

    probeRequestBattleIdRef.current = activeBattleId;
    let cancelled = false;

    const loadProbe = async () => {
      const data = await requestProbeBattleInEffect();
      if (!data || cancelled) {
        return;
      }
      probeRequestBattleIdRef.current = data.battleId;
      setPayload({
        season: data.season,
        state: data.state,
      });
      setProbe(data);
    };

    void loadProbe();

    return () => {
      cancelled = true;
    };
  }, [
    encounterProbe,
    processing,
    requestProbeBattleInEffect,
    setPayload,
    towerState?.activeBattleId,
    towerState?.status,
  ]);

  if (cultivatorLoading || loading) {
    return <GameSceneLoading message="幻境正在聚形……" />;
  }

  if (!cultivator) {
    return (
      <GameSceneFrame title={TOWER_SCENE_NAME}>
        <GameSceneNote>需先有活跃角色，方可踏入这重幻境。</GameSceneNote>
      </GameSceneFrame>
    );
  }

  return (
    <>
      <GameSceneFrame
        title={TOWER_SCENE_NAME}
        variant="workflow"
        headerMeta={
          <GameSceneNote>
            <p className="text-sm leading-7">{scenePulse.summary}</p>
            {scenePulse.resetLine ? (
              <p className="text-sm leading-7">{scenePulse.resetLine}</p>
            ) : null}
          </GameSceneNote>
        }
        aside={
          season ? (
            <TowerAside
              season={season}
              state={towerState}
              settlement={settlement}
              onReset={handleResetRun}
            />
          ) : undefined
        }
      >
        {!towerState || towerState.status === 'READY' ? (
          <GameSceneSection title="眼前一步">
            <InkCard className="space-y-4 p-5">
              <div className="flex flex-wrap items-center gap-3">
                <InkBadge tone="accent">周常幻境</InkBadge>
                {towerState ? (
                  <InkBadge tier={cultivator.realm}>
                    {`已至${formatDepthLabel(towerState.currentFloor)}`}
                  </InkBadge>
                ) : (
                  <InkBadge tier={cultivator.realm}>本周未入境</InkBadge>
                )}
              </div>

              {!towerState ? (
                <>
                  <p className="text-sm leading-7">
                    蜃气每周只聚成这一回。入境之后，外界伤势、丹药与恢复都不再干涉此地，只看你此刻道身与沿途机缘能把名号留到多深。
                  </p>
                  <div className="flex justify-end">
                    <InkButton
                      variant="primary"
                      disabled={processing}
                      onClick={() => void handleStartRun()}
                    >
                      踏入本周幻境
                    </InkButton>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm leading-7">
                    {formatDepthLabel(towerState.currentFloor)}的幻影已经凝实。
                    先照见其形，再决定何时入境交手。
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-sm leading-7">
                    <span>本周最高：{formatDepthLabel(towerState.highestFloorCleared)}</span>
                    <span>眼前压势：{describeFloorPressure(towerState.currentFloor)}</span>
                    <span>已承机缘：{blessings.length} 类</span>
                  </div>
                  <div className="flex justify-end">
                    <InkButton
                      variant="primary"
                      disabled={processing}
                      onClick={() => void handleProbeBattle()}
                    >
                      照见前路幻影
                    </InkButton>
                  </div>
                </>
              )}
            </InkCard>
          </GameSceneSection>
        ) : null}

        {towerState ? (
          <TowerRunStatusCard
            state={towerState}
            maxHp={maxHp}
            maxMp={maxMp}
            onOpenBlessing={(blessingId, currentStacks) =>
              setSelectedBlessingDetail({
                blessingId,
                currentStacks,
              })
            }
            onOpenStatuses={handleOpenStatusDetails}
          />
        ) : null}

        {towerState?.status === 'WAITING_BATTLE' ? (
          <TowerEncounterCard
            probe={encounterProbe}
            loading={processing}
            onRetryProbe={() => void handleProbeBattle()}
            onOpenDetail={() => setIsEnemyDetailOpen(true)}
            onStartBattle={() => {
              const nextBattleId =
                encounterProbe?.battleId ?? towerState.activeBattleId ?? null;
              if (!nextBattleId) {
                return;
              }

              navigate(`/game/tower/battle?battleId=${encodeURIComponent(nextBattleId)}`);
            }}
          />
        ) : null}

        {towerState?.status === 'CHOOSING_BLESSING' ? (
          <TowerBlessingChoices
            state={towerState}
            processing={processing}
            currentHp={towerState.condition.resources.hp.current}
            maxHp={maxHp}
            currentMp={towerState.condition.resources.mp.current}
            maxMp={maxMp}
            onChoose={handleChooseBlessing}
            onOpenDetail={(blessingId, currentStacks, nextStacks) =>
              setSelectedBlessingDetail({
                blessingId,
                currentStacks,
                nextStacks,
              })
            }
          />
        ) : null}

        {settlement ? (
          <TowerSettlementSection
            settlement={settlement}
            onRestart={async () => {
              const success = await handleResetRun();
              if (success) {
                await handleStartRun();
              }
            }}
          />
        ) : null}

        <TowerLeaderboard
          activeRealm={activeRealm}
          entries={leaderboardPayload?.entries ?? []}
          loading={leaderboardLoading}
          onRealmChange={setSelectedRealm}
        />
      </GameSceneFrame>

      <TowerEnemyDetailModal
        context={encounterContext}
        isOpen={isEnemyDetailOpen}
        onClose={() => setIsEnemyDetailOpen(false)}
      />
      <TowerBlessingDetailModal
        blessingId={selectedBlessingDetail?.blessingId ?? null}
        isOpen={!!selectedBlessingDetail}
        onClose={() => setSelectedBlessingDetail(null)}
        currentStacks={selectedBlessingDetail?.currentStacks ?? 0}
        nextStacks={selectedBlessingDetail?.nextStacks}
        currentHp={towerState?.condition.resources.hp.current}
        maxHp={maxHp}
        currentMp={towerState?.condition.resources.mp.current}
        maxMp={maxMp}
      />
    </>
  );
}
