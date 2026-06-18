import { useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { SendHorizontal } from "lucide-react";
import maxAvatar from "@/assets/max-avatar.svg";
import { Button } from "@/components/ui/button";

interface ComposerProps {
  onSend: (content: string) => void;
  isLoading: boolean;
}

// Footer composer from both Figma frames: Max mascot, an inline borderless
// input, and the primary blue send button.
export function Composer({ onSend, isLoading }: ComposerProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canSend = value.trim().length > 0 && !isLoading;

  const submit = () => {
    if (!canSend) return;
    onSend(value);
    setValue("");
    // Reset the auto-grown height after sending.
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    textareaRef.current?.focus();
  };

  // DERIVED: not in Figma — review. The frame doesn't specify keyboard
  // behavior; Enter sends, Shift+Enter inserts a newline (standard chat UX).
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <form
      className="flex shrink-0 items-center gap-4 border-t border-max-divider px-6 py-2"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <img
        src={maxAvatar}
        alt=""
        aria-hidden="true"
        className="h-[60px] w-[50px] shrink-0 object-contain"
      />
      <div className="flex flex-1 items-center gap-3 py-3">
        <label htmlFor="max-composer" className="sr-only">
          Ask Max a question
        </label>
        <textarea
          id="max-composer"
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            // Auto-grow up to the max-height set in CSS.
            e.target.style.height = "auto";
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
          onKeyDown={onKeyDown}
          placeholder="Ask the Max"
          aria-label="Ask Max a question"
          className="max-h-32 flex-1 resize-none bg-transparent text-base leading-6 text-max-text-60 outline-none placeholder:text-max-text-60"
        />
        <Button
          type="submit"
          size="icon"
          aria-label="Send message"
          disabled={!canSend}
          className="size-8 shrink-0 rounded-card bg-max-primary text-max-primary-foreground hover:bg-max-primary/90"
        >
          <SendHorizontal className="size-4" />
        </Button>
      </div>
    </form>
  );
}
