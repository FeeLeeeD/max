import { CircleAlert } from "lucide-react";

interface ErrorNoticeProps {
  message: string;
}

// DERIVED: not in Figma — review. No error frame is provided. Styled from the
// same card language (rounded-card, gap, type scale) but tinted with the
// existing destructive theme token to read as an error.
export function ErrorNotice({ message }: ErrorNoticeProps) {
  return (
    <div
      role="alert"
      className="flex w-full items-start gap-3 rounded-card border border-destructive/30 bg-destructive/5 px-3 py-2"
    >
      <CircleAlert className="mt-0.5 size-5 shrink-0 text-destructive" />
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="text-base font-medium leading-6 text-max-text-100">
          Something went wrong
        </p>
        <p className="break-words text-sm leading-5 text-max-text-30">
          {message}
        </p>
      </div>
    </div>
  );
}
