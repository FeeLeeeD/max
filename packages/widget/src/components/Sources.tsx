import { useState } from "react";
import { ChevronDown, FileText } from "lucide-react";
import type { ChatSource } from "@/api/chatClient";
import { cn } from "@/lib/utils";

interface SourcesProps {
  sources: ChatSource[];
}

// Renders a value the API gives as either a 0–1 similarity or a raw score.
function formatScore(score: number): string {
  if (score > 0 && score <= 1) return `${Math.round(score * 10000) / 100}%`;
  return score.toFixed(2);
}

// Each source CARD follows the Figma "Card" design under the assistant answer
// (icon chip + title + meta line + trailing slot).
//
// DERIVED: not in Figma — review. The collapsible wrapper, the preview line,
// and the trailing score badge are extrapolated from the same visual language:
// Figma shows a single always-visible card with a "FAQ" link in the trailing
// slot and no score/preview. lastSources can hold several results, so we wrap
// them in an unobtrusive collapsible and surface score + preview from our data.
export function Sources({ sources }: SourcesProps) {
  // DERIVED: not in Figma — review (collapsed by default to stay unobtrusive).
  const [open, setOpen] = useState(false);

  if (sources.length === 0) return null;

  return (
    <div className="flex w-full flex-col gap-2">
      {/* DERIVED: not in Figma — review (collapsible trigger). */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-fit items-center gap-1 text-sm leading-5 text-max-text-30 transition-colors hover:text-max-text-80"
      >
        <ChevronDown
          className={cn(
            "size-4 transition-transform",
            open && "rotate-180",
          )}
        />
        {sources.length} {sources.length === 1 ? "source" : "sources"}
      </button>

      {open && (
        <ul className="flex flex-col gap-2">
          {sources.map((source, i) => {
            const title = source.title ?? source.source;
            const showMeta = source.title != null && source.source.length > 0;
            return (
              <li
                key={`${source.source}-${i}`}
                className="flex items-center gap-3 rounded-card border border-max-card-border bg-max-card px-3 py-2"
              >
                <div className="flex items-center rounded-icon bg-max-icon-bg p-3">
                  <FileText className="size-6 text-max-text-80" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="truncate text-base font-medium leading-6 text-max-text-100">
                    {title}
                  </p>
                  {showMeta && (
                    <p className="truncate text-sm leading-5 text-max-text-30">
                      {source.source}
                    </p>
                  )}
                  {/* DERIVED: not in Figma — review (snippet preview). */}
                  {source.preview && (
                    <p className="line-clamp-2 text-sm leading-5 text-max-text-30">
                      {source.preview}
                    </p>
                  )}
                </div>
                {/* DERIVED: not in Figma — review (score badge in trailing slot). */}
                <span className="shrink-0 text-sm leading-6 text-max-link">
                  {formatScore(source.score)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
