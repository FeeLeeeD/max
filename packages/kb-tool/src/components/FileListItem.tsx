import type { KbFile } from "@/types";
import { useFilesStore } from "@/store/filesStore";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  Clock,
  FileText,
  Loader2,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";

interface Props {
  file: KbFile;
  onOpenReview: (fileId: string) => void;
  onOpenExtraction: (fileId: string) => void;
}

export function FileListItem({ file, onOpenReview, onOpenExtraction }: Props) {
  const removeFile = useFilesStore((s) => s.removeFile);
  const updateStatus = useFilesStore((s) => s.updateStatus);

  const removeDisabled =
    file.status === "anonymizing" || file.status === "extracting";

  const isBusy = file.status === "anonymizing" || file.status === "extracting";

  return (
    <div className="kb-row" data-state={isBusy ? "busy" : undefined}>
      <span
        aria-hidden
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ${ICON_RING[file.status]}`}
      >
        <FileText className="h-4 w-4" />
      </span>

      <div className="min-w-0 flex-1 text-left">
        <p className="truncate font-medium leading-tight">{file.name}</p>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-mono tabular-nums">
            {formatBytes(file.size)}
          </span>
          <span aria-hidden>·</span>
          <StatusLabel status={file.status} />
        </div>
      </div>

      <StatusAction
        file={file}
        onOpenReview={onOpenReview}
        onOpenExtraction={onOpenExtraction}
        onRetry={() => updateStatus(file.id, "selected")}
      />

      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => removeFile(file.id)}
        disabled={removeDisabled}
        aria-label="Remove file"
        title={removeDisabled ? "Cannot remove while processing" : "Remove file"}
        className="text-muted-foreground hover:text-destructive"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

const ICON_RING: Record<KbFile["status"], string> = {
  selected: "bg-muted/60 text-muted-foreground ring-border/80",
  anonymizing: "bg-primary/10 text-primary ring-primary/20",
  anonymized: "bg-chart-2/10 text-chart-2 ring-chart-2/25",
  anonymization_confirmed: "bg-muted/60 text-muted-foreground ring-border/80",
  extracting: "bg-primary/10 text-primary ring-primary/20",
  extracted: "bg-primary/10 text-primary ring-primary/25",
  saved: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/25 dark:text-emerald-400",
  error: "bg-destructive/10 text-destructive ring-destructive/25",
};

function StatusLabel({ status }: { status: KbFile["status"] }) {
  switch (status) {
    case "selected":
      return (
        <span className="inline-flex items-center gap-1">
          <CircleDashed className="h-3 w-3" />
          Ready
        </span>
      );
    case "anonymizing":
      return (
        <span className="inline-flex items-center gap-1 text-primary">
          <Loader2 className="h-3 w-3 animate-spin" />
          Anonymizing
        </span>
      );
    case "anonymized":
      return (
        <span className="inline-flex items-center gap-1 text-chart-2">
          <CheckCircle2 className="h-3 w-3" />
          Anonymized
        </span>
      );
    case "anonymization_confirmed":
      return (
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Queued for extraction
        </span>
      );
    case "extracting":
      return (
        <span className="inline-flex items-center gap-1 text-primary">
          <Loader2 className="h-3 w-3 animate-spin" />
          Extracting
        </span>
      );
    case "extracted":
      return (
        <span className="inline-flex items-center gap-1 text-primary">
          <Sparkles className="h-3 w-3" />
          Extracted
        </span>
      );
    case "saved":
      return (
        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-3 w-3" />
          Saved
        </span>
      );
    case "error":
      return (
        <span className="inline-flex items-center gap-1 text-destructive">
          <AlertCircle className="h-3 w-3" />
          Error
        </span>
      );
  }
}

interface StatusActionProps {
  file: KbFile;
  onOpenReview: (fileId: string) => void;
  onOpenExtraction: (fileId: string) => void;
  onRetry: () => void;
}

function StatusAction({
  file,
  onOpenReview,
  onOpenExtraction,
  onRetry,
}: StatusActionProps) {
  switch (file.status) {
    case "anonymized":
      return (
        <Button
          variant="outline"
          size="sm"
          className="border-chart-2/40 bg-chart-2/10 text-chart-2 hover:bg-chart-2/15 hover:text-chart-2"
          onClick={() => onOpenReview(file.id)}
        >
          Review anonymization
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      );

    case "extracted":
      return (
        <Button
          variant="outline"
          size="sm"
          className="border-primary/40 bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
          onClick={() => onOpenExtraction(file.id)}
        >
          Review extraction
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      );

    case "saved":
      return (
        <Button
          variant="ghost"
          size="sm"
          className="max-w-[320px] gap-1.5 px-2 text-xs text-emerald-700 hover:bg-emerald-500/10 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
          onClick={() => onOpenExtraction(file.id)}
          title={
            file.savedAs ? `Saved as ${file.savedAs}` : "Saved (filename unknown)"
          }
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span className="truncate">
            <span className="opacity-70">Saved as</span>{" "}
            <span className="font-mono">{file.savedAs ?? "—"}</span>
          </span>
        </Button>
      );

    case "error":
      return (
        <div className="flex shrink-0 items-center gap-2">
          <span
            className="flex max-w-[280px] items-center gap-1.5 truncate text-xs text-destructive"
            title={file.error ?? "Unknown error"}
          >
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{file.error ?? "Unknown error"}</span>
          </span>
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RotateCcw className="h-3.5 w-3.5" />
            Retry
          </Button>
        </div>
      );

    default:
      return null;
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
