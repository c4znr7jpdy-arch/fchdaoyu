import { LingGenMini } from '@app/components/func/LingGen';
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
  resolveTowerFloorKind,
  type TowerBlessingId,
  type TowerSeasonMeta,
  type TowerSettlement,
  type TowerState,
} from '@shared/lib/tower';
import { REALM_VALUES, type RealmType } from '@shared/types/constants';
import { InkBadge } from '@app/components/ui/InkBadge';
import { InkButton } from '@app/components/ui/InkButton';
import { InkCard } from '@app/components/ui/InkCard';
import { StatusCard } from '@app/components/cultivator/StatusCard';
import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import { TowerBattlePanel } from './components/TowerBattlePanel';
import { TowerLeaderboard } from './components/TowerLeaderboard';

const TOWER_SCENE_NAME = '蜃楼幻境';

function formatSeasonReset(nextResetAt: string) {
  const date = new Date(nextResetAt);
  return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function formatDepthLabel(floor: number) {
  return `第 ${floor} 重`;
}

function describeFloorPressure(floor: number) {
  const kind = resolveTowerFloorKind(floor);
  if (kind === 'boss') return '主影';
  if (kind === 'elite') return '异化幻影';
  return '寻常幻影';
}

function describeEncounterLabel(kind: TowerProbeResponse['encounter']['kind']) {
  if (kind === 'boss') return '压阵主影';
  if (kind === 'elite') return '异化幻影';
  return '寻常幻影';
}

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
  return Object.entries(blessings)
    .flatMap(([id, stacks]) => {
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

function resourceLine(state: TowerState, maxHp: number, maxMp: number) {
  return {
    hp: `${state.condition.resources.hp.current} / ${maxHp}`,
    mp: `${state.condition.resources.mp.current} / ${maxMp}`,
  };
}

function TowerAside({
  season,
  state,
  settlement,
  maxHp,
  maxMp,
  onReset,
}: {
  season?: TowerSeasonMeta;
  state: TowerState | null;
  settlement?: TowerSettlement;
  maxHp: number;
  maxMp: number;
  onReset: () => Promise<boolean>;
}) {
  const blessings = state ? summarizeBlessings(state.blessings) : [];
  const resources = state ? resourceLine(state, maxHp, maxMp) : null;

  return (
    <>
      <GameSceneAsideSection title="境中留痕">
        {state ? (
          <div className="space-y-2 text-sm leading-7">
            <div>当前所至：{formatDepthLabel(state.currentFloor)}</div>
            <div>本周最高：{formatDepthLabel(state.highestFloorCleared)}</div>
            {resources ? (
              <>
                <div>境内气血：{resources.hp}</div>
                <div>境内法力：{resources.mp}</div>
              </>
            ) : null}
            {season ? <div>境门改换：{formatSeasonReset(season.nextResetAt)}</div> : null}
          </div>
        ) : (
          <p className="text-sm leading-7">本周尚未入境。</p>
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

      {blessings.length > 0 ? (
        <GameSceneAsideSection title="已承机缘">
          <div className="space-y-2 text-sm leading-7">
            {blessings.map((item) => (
              <div key={item.id}>
                {item.definition.name} · {item.stacks}/{item.definition.maxStacks}
              </div>
            ))}
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

function TowerEncounterCard({
  probe,
  loading,
  onRetryProbe,
  onStartBattle,
}: {
  probe: TowerProbeResponse | null;
  loading: boolean;
  onRetryProbe: () => void;
  onStartBattle: () => void;
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

  return (
    <GameSceneSection title="眼前幻影">
      <InkCard className="space-y-4 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="font-semibold">
              {formatDepthLabel(probe.encounter.floor)} ·{' '}
              {describeEncounterLabel(probe.encounter.kind)}
            </div>
            <div className="text-ink-secondary mt-1 text-sm">
              {enemy.name} · {probe.encounter.realm} {probe.encounter.realmStage}
            </div>
          </div>
          <InkBadge tier={probe.encounter.realm}>
            {describeFloorPressure(probe.encounter.floor)}
          </InkBadge>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>体魄：{enemy.attributes.vitality}</div>
          <div>灵力：{enemy.attributes.spirit}</div>
          <div>悟性：{enemy.attributes.wisdom}</div>
          <div>身法：{enemy.attributes.speed}</div>
          <div className="col-span-2">神识：{enemy.attributes.willpower}</div>
        </div>

        <LingGenMini spiritualRoots={enemy.spiritual_roots} />

        {enemy.background ? (
          <p className="text-ink-secondary text-sm leading-7">
            {enemy.background}
          </p>
        ) : null}

        <div className="flex justify-end">
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
  onChoose,
}: {
  state: TowerState;
  processing: boolean;
  onChoose: (blessingId: TowerBlessingId) => Promise<void>;
}) {
  return (
    <GameSceneSection title="残留机缘">
      <div className="grid gap-3 md:grid-cols-3">
        {state.pendingBlessingChoices.map((choice) => (
          <InkCard key={choice.id} className="flex flex-col gap-3 p-4">
            <div>
              <div className="font-semibold">{choice.name}</div>
              <div className="text-ink-secondary mt-2 text-sm leading-7">
                {choice.description}
              </div>
            </div>
            <div className="text-ink-secondary text-xs">
              当前 {choice.currentStacks} 层 → 选后 {choice.nextStacks} 层 / 上限 {choice.maxStacks}
            </div>
            <InkButton
              variant="primary"
              disabled={processing}
              onClick={() => void onChoose(choice.id)}
            >
              承此机缘
            </InkButton>
          </InkCard>
        ))}
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
  const {
    cultivator,
    finalAttributes,
    isLoading: cultivatorLoading,
    refreshCultivator,
  } = useCultivator();
  const { payload, setPayload, loading } = useTowerState(!!cultivator);
  const { startRun, probeBattle, chooseBlessing, resetRun, processing } =
    useTowerActions();
  const [selectedRealm, setSelectedRealm] = useState<RealmType | null>(null);
  const activeRealm = selectedRealm ?? cultivator?.realm ?? REALM_VALUES[0];
  const { payload: leaderboardPayload, loading: leaderboardLoading } =
    useTowerLeaderboard(!!cultivator, activeRealm);
  const [battleId, setBattleId] = useState<string | null>(null);
  const [probe, setProbe] = useState<TowerProbeResponse | null>(null);
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
    setBattleId(null);
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
  };

  useEffect(() => {
    const activeBattleId = towerState?.activeBattleId;
    if (towerState?.status !== 'WAITING_BATTLE' || !activeBattleId) {
      probeRequestBattleIdRef.current = null;
      return;
    }

    if (encounterProbe || battleId || processing) {
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
    battleId,
    encounterProbe,
    processing,
    towerState?.activeBattleId,
    towerState?.status,
    setPayload,
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
      aside={towerState ? (
        <TowerAside
          season={season}
          state={towerState}
          settlement={settlement}
          maxHp={maxHp}
          maxMp={maxMp}
          onReset={handleResetRun}
        />
      ) : undefined}
    >
      {!battleId && (!towerState || towerState.status === 'READY') ? (
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

      {towerState?.condition.statuses.length ? (
        <GameSceneSection title="残余状态">
          <StatusCard buffs={towerState.condition.statuses} />
        </GameSceneSection>
      ) : null}

      {battleId && cultivator ? (
        <TowerBattlePanel
          battleId={battleId}
          player={cultivator}
          onComplete={(data) => {
            setBattleId(null);
            const nextSeason = season ?? payload?.season ?? leaderboardPayload?.season;
            if (nextSeason) {
              setPayload({
                season: nextSeason,
                state: data.towerState,
                settlement: data.settlement,
              });
            }
            setProbe(null);
            probeRequestBattleIdRef.current = null;
            if (data.milestoneReward) {
              void refreshCultivator();
            }
          }}
        />
      ) : null}

      {!battleId && towerState?.status === 'WAITING_BATTLE' ? (
        <TowerEncounterCard
          probe={encounterProbe}
          loading={processing}
          onRetryProbe={() => void handleProbeBattle()}
          onStartBattle={() =>
            setBattleId(encounterProbe?.battleId ?? towerState.activeBattleId ?? null)
          }
        />
      ) : null}

      {!battleId && towerState?.status === 'CHOOSING_BLESSING' ? (
        <TowerBlessingChoices
          state={towerState}
          processing={processing}
          onChoose={handleChooseBlessing}
        />
      ) : null}

      {!battleId && settlement ? (
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
  );
}
