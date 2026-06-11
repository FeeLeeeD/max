// Loading state from the Figma "Thinking on answer..." frame: a small green
// dot followed by the status text, shown in the assistant column while a
// request is in flight. This is NOT a typewriter — it's a static waiting
// indicator (the answer renders in full once it arrives).
export function LoadingIndicator() {
  return (
    <div
      className="flex w-full items-center gap-2"
      role="status"
      aria-live="polite"
    >
      <span className="flex size-6 items-center justify-center">
        <span className="size-2 animate-pulse rounded-full bg-max-success" />
      </span>
      <p className="flex-1 text-base leading-6 text-max-text-80">
        Thinking on answer...
      </p>
    </div>
  );
}
