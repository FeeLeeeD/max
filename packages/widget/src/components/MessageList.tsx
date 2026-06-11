import { useEffect, useRef } from "react";
import { useChatStore } from "@/store/chatStore";
import { MessageBubble } from "@/components/MessageBubble";
import { MessageActions } from "@/components/MessageActions";
import { LoadingIndicator } from "@/components/LoadingIndicator";
import { Sources } from "@/components/Sources";
import { RefusalNote } from "@/components/RefusalNote";
import { ErrorNotice } from "@/components/ErrorNotice";
import { EmptyState } from "@/components/EmptyState";

// Scrollable conversation region (Figma "Recent block"). Reads chat state from
// the store via selectors — no props, no direct API access.
export function MessageList() {
  const messages = useChatStore((s) => s.messages);
  const isLoading = useChatStore((s) => s.isLoading);
  const error = useChatStore((s) => s.error);
  const lastSources = useChatStore((s) => s.lastSources);
  const lastWasRefused = useChatStore((s) => s.lastWasRefused);

  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the newest message whenever the conversation grows or the
  // loading indicator toggles.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isLoading]);

  const isEmpty = messages.length === 0 && !isLoading && !error;

  return (
    <div
      className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-2"
      role="log"
      aria-live="polite"
      aria-busy={isLoading}
    >
      {isEmpty ? (
        <EmptyState />
      ) : (
        messages.map((message, i) => {
          const isLast = i === messages.length - 1;

          if (message.role === "user") {
            return (
              <MessageBubble
                key={i}
                role="user"
                content={message.content}
              />
            );
          }

          // Assistant column: answer, then (for the latest answer only) the
          // refusal note and sources, then the feedback thumbs.
          return (
            <div key={i} className="flex w-full flex-col items-start gap-2">
              <MessageBubble role="assistant" content={message.content} />
              {isLast && lastWasRefused && <RefusalNote />}
              {isLast && <Sources sources={lastSources} />}
              <MessageActions />
            </div>
          );
        })
      )}

      {isLoading && <LoadingIndicator />}
      {error && <ErrorNotice message={error} />}

      <div ref={bottomRef} />
    </div>
  );
}
