import { Info } from "lucide-react";

// DERIVED: not in Figma — review. There is no refusal/low-confidence frame in
// the provided designs. When chatStore.lastWasRefused is true the answer still
// renders, but we add this subtle muted note (same type scale + muted token as
// the rest of the assistant column) to signal it's a low-confidence response.
export function RefusalNote() {
  return (
    <div className="flex items-center gap-2 text-sm leading-5 text-max-text-30">
      <Info className="size-4 shrink-0" />
      <span>Max wasn&rsquo;t confident about this — double-check before relying on it.</span>
    </div>
  );
}
