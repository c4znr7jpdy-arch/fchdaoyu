import { PropsWithChildren } from 'react';
import { PlayerProvider } from '@/lib/player-context';
import './app.css';

function App({ children }: PropsWithChildren) {
  return <PlayerProvider>{children}</PlayerProvider>;
}

export default App;
