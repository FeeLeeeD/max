import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useChatStore } from "@/store/chatStore";
import { cn } from "@/lib/utils";

// The Figma "Thumbs" block sits under the assistant answer (icons + layout from
// Figma). All behavior lives in the store (L3/L3.5): this component only reads
// `lastFeedback` / `lastLogId` and dispatches `submitFeedback`. Toggle/undo,
// optimistic update, and null-logId guarding already happen there.
export function FeedbackButtons() {
  const lastFeedback = useChatStore((s) => s.lastFeedback);
  const lastLogId = useChatStore((s) => s.lastLogId);
  const submitFeedback = useChatStore((s) => s.submitFeedback);

  // DERIVED: not in Figma — review. When the server's log write failed there's
  // no logId to attach feedback to, so both controls are disabled (the store
  // would no-op anyway) with a title explaining why.
  const disabled = lastLogId === null;

  // DERIVED: not in Figma — review. The active rating is shown with the accent
  // color (matches the Figma "Thumbs" block) plus a filled icon for a clearer
  // selected state; the inactive control stays muted.

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label="Helpful"
        aria-pressed={lastFeedback === "up"}
        onClick={() => submitFeedback("up")}
        disabled={disabled}
        title={disabled ? "Feedback unavailable for this answer" : undefined}
        className={cn(
          "rounded-[3px] p-0.5 text-max-text-30 transition-colors hover:text-max-text-80 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:text-max-text-30",
          lastFeedback === "up" && "text-max-link",
        )}
      >
        <ThumbsUp className={cn("size-4", lastFeedback === "up" && "fill-current")} />
      </button>
      <button
        type="button"
        aria-label="Not helpful"
        aria-pressed={lastFeedback === "down"}
        onClick={() => submitFeedback("down")}
        disabled={disabled}
        title={disabled ? "Feedback unavailable for this answer" : undefined}
        className={cn(
          "rounded-[3px] p-0.5 text-max-text-30 transition-colors hover:text-max-text-80 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:text-max-text-30",
          lastFeedback === "down" && "text-max-link",
        )}
      >
        <ThumbsDown className={cn("size-4", lastFeedback === "down" && "fill-current")} />
      </button>
    </div>
  );
}
