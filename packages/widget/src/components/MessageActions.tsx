import { useState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip } from "radix-ui";

// The Figma "Thumbs" block sits under each assistant answer. The icons and
// layout come from Figma, but the behavior does NOT.
//
// DERIVED: not in Figma — review. There is no feedback endpoint in the store or
// API, so this is presentation-only: the selection is local cosmetic state and
// is intentionally not sent anywhere. Wire to a real endpoint in a later step.
export function MessageActions() {
  const [vote, setVote] = useState<"up" | "down" | null>(null);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label="Helpful"
        aria-pressed={vote === "up"}
        onClick={() => setVote((v) => (v === "up" ? null : "up"))}
        className={cn(
          "rounded-[3px] p-0.5 text-max-text-30 transition-colors hover:text-max-text-80",
          vote === "up" && "text-max-link",
        )}
        disabled
      >
        <ThumbsUp className="size-4" />
      </button>
      <button
        type="button"
        aria-label="Not helpful"
        aria-pressed={vote === "down"}
        onClick={() => setVote((v) => (v === "down" ? null : "down"))}
        className={cn(
          "rounded-[3px] p-0.5 text-max-text-30 transition-colors hover:text-max-text-80",
          vote === "down" && "text-max-link",
        )}
        disabled
      >
        <ThumbsDown className="size-4" />
      </button>
    </div>
  );
}
