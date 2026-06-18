import { Bug, CheckCircle2, XCircle } from "lucide-react";
import { useChatStore } from "@/store/chatStore";
import { cn } from "@/lib/utils";

// DERIVED: not in Figma — review. This is a dev-only surface for the internal
// test harness, intentionally not part of the design. It exists to make
// threshold calibration eyeball-able: it lists EVERY retrieved chunk with its
// score and whether it cleared `minScore`, so we can see WHY Max answered or
// refused. Styled deliberately as a utilitarian "debug" panel (monospace
// scores, subtle background, explicit pass/fail dots) so it reads as a tool,
// not as part of the answer. Reads store only — no fetch, no logic.
export function RetrievalDebugPanel() {
  const retrieval = useChatStore((s) => s.lastRetrieval);
  const minScore = useChatStore((s) => s.lastMinScore);
  const wasRefused = useChatStore((s) => s.lastWasRefused);

  if (retrieval.length === 0) return null;

  // The API returns items in retrieval order, which is score order; sort
  // defensively so the visual is always top-down by score.
  const items = [...retrieval].sort((a, b) => b.score - a.score);
  const topScore = items[0]?.score ?? null;

  return (
    <div className="mt-1 w-full rounded-card border border-dashed border-max-card-border bg-max-surface-muted px-3 py-2 font-mono text-xs leading-5 text-max-text-80">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-max-text-30">
        <span className="flex items-center gap-1 font-medium uppercase tracking-wide text-max-text-80">
          <Bug className="size-3.5" />
          Debug: retrieval
        </span>
        <span>
          threshold{" "}
          <span className="text-max-text-100">
            {minScore != null ? minScore.toFixed(3) : "—"}
          </span>
        </span>
        <span>
          top{" "}
          <span className="text-max-text-100">
            {topScore != null ? topScore.toFixed(3) : "—"}
          </span>
        </span>
        {/* DERIVED: red/green semantic colors (not theme tokens) on purpose —
            this debug surface needs a clear refuse/answer signal. */}
        <span
          className={cn(
            "rounded-[3px] px-1.5 py-0.5 font-medium",
            wasRefused
              ? "bg-red-100 text-red-700"
              : "bg-emerald-100 text-emerald-700",
          )}
        >
          {wasRefused ? "REFUSED" : "ANSWERED"}
        </span>
      </div>

      <ul className="mt-2 flex flex-col gap-1.5">
        {items.map((item, i) => {
          const label = item.title ?? item.source;
          const heading = item.headingPath?.length
            ? item.headingPath.join(" › ")
            : null;
          return (
            <li
              key={`${item.source}-${item.chunkIndex}-${i}`}
              className="flex items-start gap-2"
            >
              {/* DERIVED: red/green pass/fail dot (not theme tokens) on purpose. */}
              {item.passedThreshold ? (
                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
              ) : (
                <XCircle className="mt-0.5 size-3.5 shrink-0 text-red-500" />
              )}
              <span
                className={cn(
                  "w-12 shrink-0 tabular-nums",
                  item.passedThreshold
                    ? "text-max-text-100"
                    : "text-max-text-30",
                )}
              >
                {item.score.toFixed(3)}
              </span>
              <div
                className={cn(
                  "flex min-w-0 flex-1 flex-col",
                  !item.passedThreshold && "text-max-text-30",
                )}
              >
                <span className="truncate text-max-text-80">
                  {label}
                  {heading && (
                    <span className="text-max-text-30"> — {heading}</span>
                  )}
                </span>
                {item.contentPreview && (
                  <span className="line-clamp-2 text-max-text-30 no-underline">
                    {item.contentPreview}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
