import { WorldChatChannel } from './WorldChatChannel';
import { useWorldChatHostModel } from './useWorldChatHostModel';
import { getWorldChatMessageBody } from './worldChatSummary';

function WorldChatDispatchBar() {
  const {
    latestMessage,
    newMessageCount,
    openDrawer,
    closeDrawer,
    isDrawerOpen,
    isWorldChatRoute,
  } = useWorldChatHostModel();

  if (isWorldChatRoute) {
    return null;
  }

  const previewBody = latestMessage
    ? getWorldChatMessageBody(latestMessage)
    : '暂无新声';
  const sender = latestMessage?.senderName ?? '万界频道';
  const handleToggleDrawer = () => {
    if (isDrawerOpen) {
      closeDrawer();
      return;
    }

    openDrawer();
  };

  return (
    <div className="battle-dock border-battle-rule-strong border-t border-dashed">
      <div className="mx-auto max-w-5xl px-3 py-1.5 md:px-6">
        <button
          type="button"
          onClick={handleToggleDrawer}
          className="hover:text-crimson flex w-full items-center gap-2 px-0 py-1.5 text-left transition"
        >
          <span
            aria-hidden="true"
            className="shrink-0 text-sm leading-none"
          >
            🔔
          </span>
          <div className="min-w-0 flex-1 truncate text-sm leading-6">
            <span className="text-battle-muted">{sender}：</span>
            <span className="text-ink">{previewBody}</span>
          </div>
          {newMessageCount > 0 ? (
            <span className="bg-crimson text-bgpaper inline-flex min-w-4 shrink-0 items-center justify-center rounded-full px-1 text-[0.62rem] leading-4">
              {newMessageCount}
            </span>
          ) : null}
          <span className="text-battle-muted shrink-0 text-sm whitespace-nowrap">
            [全部]
          </span>
        </button>
      </div>
    </div>
  );
}

function WorldChatDockDrawer() {
  const { closeDrawer, isDrawerOpen, isWorldChatRoute } = useWorldChatHostModel();

  if (!isDrawerOpen || isWorldChatRoute) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-[calc(100%+0.25rem)] z-30 px-3 md:px-6">
      <section className="border-battle-rule-strong bg-bgpaper pointer-events-auto mx-auto flex h-[min(54svh,28rem)] max-w-5xl flex-col overflow-hidden border border-dashed shadow backdrop-blur-sm">
        <div className="border-battle-rule-strong flex items-center justify-between gap-3 border-b border-dashed px-4 py-2.5">
          <div className="text-ink min-w-0 text-base leading-6">世界传音</div>
          <button
            type="button"
            onClick={closeDrawer}
            className="text-battle-muted hover:text-crimson shrink-0 text-sm whitespace-nowrap transition"
          >
            [收起]
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-3">
          <WorldChatChannel variant="drawer" />
        </div>
      </section>
    </div>
  );
}

export function WorldChatHost() {
  return (
    <div className="relative z-20">
      <WorldChatDockDrawer />
      <WorldChatDispatchBar />
    </div>
  );
}
