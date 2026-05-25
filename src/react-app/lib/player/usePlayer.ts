import { useContext } from 'react';
import { PlayerContext, type PlayerState } from './playerContext';

export function usePlayer(): PlayerState {
  const context = useContext(PlayerContext);

  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }

  return context;
}
