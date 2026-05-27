import { BattlePlaybackPanel } from '@app/components/feature/battle/BattlePlaybackPanel';
import { useBattlePlaybackState } from '@app/components/feature/battle/useBattlePlaybackState';
import { CombatResultDialog } from '@app/components/feature/battle/v5/CombatResultDialog';
import { GameSceneSection } from '@app/components/game-shell';
import { InkButton } from '@app/components/ui/InkButton';
import { useTowerBattle, type TowerBattleCallbackData } from '@app/lib/hooks/tower/useTowerBattle';
import type { Cultivator } from '@shared/types/cultivator';
import { useEffect, useRef, useState } from 'react';

interface TowerBattlePanelProps {
  battleId: string;
  player: Cultivator;
  onComplete: (data: TowerBattleCallbackData) => void;
}

export function TowerBattlePanel({
  battleId,
  player,
  onComplete,
}: TowerBattlePanelProps) {
  const { battleResult, loading, executeBattle } = useTowerBattle();
  const playback = useBattlePlaybackState(battleResult);
  const [callbackData, setCallbackData] = useState<TowerBattleCallbackData | null>(null);
  const hasExecutedRef = useRef(false);

  useEffect(() => {
    if (hasExecutedRef.current) {
      return;
    }
    hasExecutedRef.current = true;

    const runBattle = async () => {
      const result = await executeBattle(battleId);
      if (result?.callbackData) {
        setCallbackData(result.callbackData);
      }
    };

    void runBattle();
  }, [battleId, executeBattle]);

  return (
    <GameSceneSection title="战局回响">
      {loading && !battleResult ? (
        <p className="loading-tip py-10 text-center">正在演化这一重幻影的战局……</p>
      ) : null}

      <BattlePlaybackPanel battleResult={battleResult} playback={playback} />

      {battleResult ? (
        <div className="mt-4 flex justify-end">
          <InkButton
            variant="primary"
            disabled={!playback.isPlaybackFinished || !callbackData}
            onClick={() => {
              if (callbackData) {
                onComplete(callbackData);
              }
            }}
          >
            {callbackData?.isFinished ? '查看此行回响' : '回到幻境'}
          </InkButton>
        </div>
      ) : null}

      <CombatResultDialog
        key={`tower-${battleResult?.turns}-${battleResult?.winner.id ?? 'unknown'}`}
        dialogKey={`tower-${battleResult?.turns}-${battleResult?.winner.id ?? 'unknown'}`}
        open={!!battleResult && playback.isPlaybackFinished}
        title={battleResult?.winner.id === player.id ? '战斗胜利' : '战斗失利'}
        content={
          <p className="leading-8">
            {battleResult?.winner.id === player.id
              ? '这一重幻影已散，回去承接下一缕机缘。'
              : '你在此处败退，本周幻境也随之在这里收束。'}
          </p>
        }
      />
    </GameSceneSection>
  );
}
