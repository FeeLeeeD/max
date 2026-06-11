import maxAvatar from "@/assets/max-avatar.svg";

// DERIVED: not in Figma — review. No empty/first-run frame is provided. Reuses
// the Max mascot from the composer and the design's type scale + muted tokens
// to fill the message region before the first question is asked.
export function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
      <img
        src={maxAvatar}
        alt=""
        aria-hidden="true"
        className="h-16 w-16 object-contain"
      />
      <div className="flex flex-col gap-1">
        <p className="text-lg font-semibold leading-[1.4] tracking-[-0.01em] text-max-text-100">
          Ask Max anything
        </p>
        <p className="text-base leading-6 text-max-text-30">
          Answers come straight from your FAQ knowledge base.
        </p>
      </div>
    </div>
  );
}
