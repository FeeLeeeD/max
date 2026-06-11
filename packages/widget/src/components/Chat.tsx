import { useChatStore } from "@/store/chatStore";
import { ChatHeader } from "@/components/ChatHeader";
import { MessageList } from "@/components/MessageList";
import { Composer } from "@/components/Composer";

// Top-level chat container (the Figma frame: rounded surface card with a header
// divider on top, the scrollable message region, and the composer footer).
//
// This is the only place that reaches the store for actions; child components
// either receive callbacks or read state via selectors. No component calls the
// API directly — everything goes through the store (see widget-data-layer rule).
export function Chat() {
  const sendMessage = useChatStore((s) => s.sendMessage);
  const reset = useChatStore((s) => s.reset);
  const isLoading = useChatStore((s) => s.isLoading);

  return (
    // DERIVED: not in Figma — review. The frame is a fixed-size surface; for a
    // standalone web page we center it, cap the width, and fill the viewport
    // height, collapsing to full-bleed on narrow screens.
    <div className="flex min-h-svh justify-center bg-max-surface-muted sm:p-6">
      <div className="flex h-svh w-full max-w-[960px] flex-col overflow-hidden bg-max-surface sm:h-auto sm:max-h-[calc(100svh-3rem)] sm:rounded-bubble sm:border sm:border-max-card-border sm:shadow-sm">
        <ChatHeader onClose={reset} />
        <MessageList />
        <Composer onSend={(content) => void sendMessage(content)} isLoading={isLoading} />
      </div>
    </div>
  );
}
