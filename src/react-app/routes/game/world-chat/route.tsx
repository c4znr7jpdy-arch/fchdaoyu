import { GameSceneFrame } from '@app/components/game-shell';
import { WorldChatChannel } from '@app/components/feature/world-chat/WorldChatChannel';

export default function WorldChatPage() {
  return (
    <GameSceneFrame title="世界传音">
      <WorldChatChannel variant="page" />
    </GameSceneFrame>
  );
}
