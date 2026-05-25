import { useCultivatorBundle } from '@app/lib/hooks/useCultivatorBundle';
import { createContext } from 'react';

export type PlayerState = ReturnType<typeof useCultivatorBundle>;

export const PlayerContext = createContext<PlayerState | null>(null);
