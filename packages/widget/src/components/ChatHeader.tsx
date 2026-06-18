import { X } from "lucide-react";

interface ChatHeaderProps {
  onClose?: () => void;
}

// Header bar from both Figma frames: leading back icon, title + "FAQ" tag,
// trailing close icon, with the bottom hairline divider.
export function ChatHeader({ onClose }: ChatHeaderProps) {
  return (
    <header className="flex h-[76px] shrink-0 items-center gap-4 border-b border-max-divider px-6 py-2">
      {/* DERIVED: not in Figma — review. The frame shows a back arrow for a
          thread-list nav we don't have here, so it's decorative/disabled. */}
      {/* <button
        type="button"
        aria-label="Back"
        disabled
        className="flex size-5 shrink-0 items-center justify-center text-max-text-60 disabled:opacity-40"
      >
        <ChevronLeft className="size-5" />
      </button> */}

      <div className="flex min-w-0 flex-1 items-center gap-2">
        {/* DERIVED: not in Figma — review. The frame's title is the active
            question (we have no per-thread subject), so we use a product title. */}
        <p className="min-w-0 flex-1 truncate text-lg font-semibold leading-[1.4] tracking-[-0.01em] text-max-text-60">
          Max <span className="font-mono font-normal">[testing]</span>
        </p>
        <span className="text-xs text-max-text-30">v0.0.2</span>
      </div>

      {/* DERIVED: not in Figma — review. No widget host to close in this page,
          so the close icon clears the conversation (store.reset) instead. */}
      <button
        type="button"
        aria-label="Clear conversation"
        onClick={onClose}
        className="flex size-5 shrink-0 items-center justify-center text-max-text-60 transition-colors hover:text-max-text-100"
      >
        <X className="size-5" />
      </button>
    </header>
  );
}
