import { GameSceneSection, GameSceneTabs } from '@app/components/game-shell';
import { InkCard } from '@app/components/ui/InkCard';
import { InkSelect } from '@app/components/ui/InkSelect';
import type { TowerLeaderboardEntry } from '@shared/lib/tower';
import { REALM_VALUES, type RealmType } from '@shared/types/constants';

interface TowerLeaderboardProps {
  activeRealm: RealmType;
  entries: TowerLeaderboardEntry[];
  loading: boolean;
  onRealmChange: (realm: RealmType) => void;
}

function formatReachedAt(value: string) {
  const date = new Date(value);
  return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function TowerLeaderboard({
  activeRealm,
  entries,
  loading,
  onRealmChange,
}: TowerLeaderboardProps) {
  return (
    <GameSceneSection title="留名榜">
      <InkCard className="min-w-0 overflow-hidden space-y-4 p-4">
        <div className="md:hidden">
          <InkSelect
            value={activeRealm}
            onChange={(value) => onRealmChange(value as RealmType)}
            className="w-full"
          >
            {REALM_VALUES.map((realm) => (
              <option key={realm} value={realm}>
                {realm}榜
              </option>
            ))}
          </InkSelect>
        </div>

        <GameSceneTabs
          className="hidden md:block"
          items={REALM_VALUES.map((realm) => ({
            label: `${realm}榜`,
            value: realm,
          }))}
          activeValue={activeRealm}
          onChange={(value) => onRealmChange(value as RealmType)}
        />

        {loading ? (
          <p className="loading-tip py-6 text-center">正在校准榜位……</p>
        ) : entries.length === 0 ? (
          <p className="text-ink-secondary py-6 text-center text-sm">
            本周此境尚无人留名。
          </p>
        ) : (
          <div className="max-h-80 space-y-3 overflow-y-auto pr-1 md:max-h-[30rem]">
            {entries.map((entry) => (
              <div
                key={`${entry.recordedRealm}:${entry.cultivatorId}`}
                className="border-ink/15 flex flex-col gap-2 border-b border-dashed pb-3 last:border-b-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-crimson min-w-12 text-sm font-semibold">
                      第 {entry.rank} 名
                    </span>
                    <span className="truncate font-semibold">
                      {entry.name}
                      {entry.title ? `「${entry.title}」` : ''}
                    </span>
                    {entry.isSelf ? (
                      <span className="text-ink-secondary text-xs">你</span>
                    ) : null}
                  </div>
                  <div className="text-ink-secondary mt-1 text-xs">
                    当前境界：{entry.realm} {entry.realmStage} · 破层时刻：
                    {formatReachedAt(entry.firstReachedAt)}
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-ink text-lg font-semibold">
                    {entry.highestFloor} 重
                  </div>
                  <div className="text-ink-secondary text-xs">
                    记入 {entry.recordedRealm} 榜
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </InkCard>
    </GameSceneSection>
  );
}
