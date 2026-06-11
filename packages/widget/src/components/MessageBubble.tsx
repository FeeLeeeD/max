import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
}

// User and assistant message variants from the Figma "Right message" /
// "Left message" blocks. The user message is a muted rounded bubble; the
// assistant answer is plain text on the surface (no bubble), per Figma.
//
// Answers render as PLAIN TEXT with line breaks preserved (whitespace-pre-wrap).
// No markdown parsing and no typewriter effect — the full answer appears at
// once. See the response notes about a possible markdown renderer later (W4+).
export function MessageBubble({ role, content }: MessageBubbleProps) {
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

  return (
    <p className="whitespace-pre-wrap break-words text-base leading-6 text-max-text-80">
      {content}
    </p>
  );
}
