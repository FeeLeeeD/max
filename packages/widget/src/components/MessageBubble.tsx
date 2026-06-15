import { cn } from "@/lib/utils";
import { useTypewriter, usePrefersReducedMotion } from "@/hooks/useTypewriter";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  // Whether this answer should type out. Only the newest assistant answer is
  // asked to animate; MessageList decides this and freezes everything else.
  // User messages ignore it. Refusal answers animate like any normal answer
  // (the separate RefusalNote carries the low-confidence signal).
  animate?: boolean;
}

// User and assistant message variants from the Figma "Right message" /
// "Left message" blocks. The user message is a muted rounded bubble; the
// assistant answer is plain text on the surface (no bubble), per Figma.
//
// Answers render as PLAIN TEXT with line breaks preserved (whitespace-pre-wrap).
// No markdown parsing. The W4 typewriter (assistant only) is a presentational
// reveal over the already-complete answer — see AssistantAnswer below.
export function MessageBubble({ role, content, animate = false }: MessageBubbleProps) {
  if (role === "user") {
    return (
      <div className="flex w-full flex-col items-end">
        <div className="flex max-w-[600px] items-center justify-center rounded-bubble rounded-br-none bg-max-surface-muted p-4">
          <p className="whitespace-pre-wrap break-words text-base leading-6 text-max-text-60">
            {content}
          </p>
        </div>
      </div>
    );
  }

  return <AssistantAnswer content={content} animate={animate} />;
}

const ANSWER_CLASS =
  "whitespace-pre-wrap break-words text-base leading-6 text-max-text-80";

function AssistantAnswer({ content, animate }: { content: string; animate: boolean }) {
  const prefersReducedMotion = usePrefersReducedMotion();

  // Reduced motion, or a message that isn't the newest answer, shows the full
  // text immediately (no reveal).
  const enabled = animate && !prefersReducedMotion;
  const { displayed, isDone, skip } = useTypewriter(content, { enabled });

  // Static path: full answer, normally exposed to assistive tech, plain layout.
  if (!enabled) {
    return <p className={ANSWER_CLASS}>{content}</p>;
  }

  const remaining = content.slice(displayed.length);

  // Accessibility / layout notes:
  // - The visible, animating text is aria-hidden so screen readers are NOT
  //   spammed character-by-character.
  // - The COMPLETE answer is exposed once via the sr-only node; the enclosing
  //   MessageList log (aria-live="polite") announces it a single time when the
  //   message is appended. The node structure stays identical from first frame
  //   through completion, so finishing the reveal doesn't trigger a re-announce.
  // - The not-yet-typed remainder is rendered transparently to reserve the
  //   answer's final height from the start. This prevents reflow jumps as
  //   characters appear and lets W3's scroll-to-bottom land correctly.
  return (
    // DERIVED: not in Figma — review. Clicking the still-typing answer skips the
    // reveal. Minimal affordance: no new visible element, just a pointer cursor
    // while typing.
    <p
      className={cn(ANSWER_CLASS, !isDone && "cursor-pointer")}
      onClick={isDone ? undefined : skip}
      title={isDone ? undefined : "Skip animation"}
    >
      <span aria-hidden="true">
        {displayed}
        <span className="opacity-0">{remaining}</span>
      </span>
      <span className="sr-only">{content}</span>
    </p>
  );
}
