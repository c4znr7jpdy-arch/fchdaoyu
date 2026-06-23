import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react';
import { getPlayerActive } from '@/lib/client/game';
import type { PlayerActiveResponse } from '@shared/contracts/player';
import type { Cultivator } from '@shared/types/cultivator';

type PlayerState = {
  cultivator: Cultivator | null;
  cultivators: PlayerActiveResponse['data']['cultivators'];
  unreadMailCount: number;
  hasActive: boolean;
  hasDead: boolean;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const PlayerContext = createContext<PlayerState>({
  cultivator: null,
  cultivators: [],
  unreadMailCount: 0,
  hasActive: false,
  hasDead: false,
  loading: true,
  error: null,
  refresh: async () => {},
});

export function usePlayer() {
  return useContext(PlayerContext);
}

export function PlayerProvider({ children }: PropsWithChildren) {
  const [cultivator, setCultivator] = useState<Cultivator | null>(null);
  const [cultivators, setCultivators] = useState<PlayerActiveResponse['data']['cultivators']>([]);
  const [unreadMailCount, setUnreadMailCount] = useState(0);
  const [hasActive, setHasActive] = useState(false);
  const [hasDead, setHasDead] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getPlayerActive();
      if (result.success && result.data) {
        setCultivator(result.data.activeCultivator?.cultivator ?? null);
        setCultivators(result.data.cultivators ?? []);
        setUnreadMailCount(result.data.unreadMailCount ?? 0);
        setHasActive(result.meta?.hasActive ?? false);
        setHasDead(result.meta?.hasDead ?? false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <PlayerContext.Provider
      value={{ cultivator, cultivators, unreadMailCount, hasActive, hasDead, loading, error, refresh }}
    >
      {children}
    </PlayerContext.Provider>
  );
}
