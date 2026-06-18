import { useRef } from "react";
import { useChatStore } from "@/store/chatStore";
import { MessageBubble } from "@/components/MessageBubble";
import { FeedbackButtons } from "@/components/FeedbackButtons";
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

  // Only the newest assistant answer animates, and only one that arrived during
  // this session (anything present at mount renders statically). When a new
  // message is appended the previous answer is no longer the last index, so its
  // `animate` flips to false and it freezes at full text — which also makes a
  // new send instantly settle an in-progress reveal. No store change needed:
  // this is derived purely from the messages array in the component layer.
  const initialCountRef = useRef(messages.length);
  const lastIndex = messages.length - 1;
  const animateIndex =
    messages[lastIndex]?.role === "assistant" && lastIndex >= initialCountRef.current
      ? lastIndex
      : -1;

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
          // refusal note, sources, and feedback thumbs. The store tracks only
          // the last answer's logId/feedback, so older answers get no thumbs.
          return (
            <div key={i} className="flex w-full flex-col items-start gap-2">
              <MessageBubble
                role="assistant"
                content={message.content}
                animate={i === animateIndex}
              />
              {isLast && lastWasRefused && <RefusalNote />}
              {isLast && <Sources sources={lastSources} />}
              {isLast && <FeedbackButtons />}
            </div>
          );
        })
      )}

      {isLoading && <LoadingIndicator />}
      {error && <ErrorNotice message={error} />}
    </div>
  );
}
