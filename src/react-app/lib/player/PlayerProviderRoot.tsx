import { useCultivatorBundle } from '@app/lib/hooks/useCultivatorBundle';
import type { ReactNode } from 'react';
import { PlayerContext } from './playerContext';

export function PlayerProvider({ children }: { children: ReactNode }) {
  const playerState = useCultivatorBundle();

  return (
    <PlayerContext.Provider value={playerState}>
      {children}
    </PlayerContext.Provider>
  );
}
