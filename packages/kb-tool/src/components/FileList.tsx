import { useFilesStore } from "@/store/filesStore";
import { FileListItem } from "./FileListItem";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  CheckCircle2,
  CircleDashed,
  Loader2,
  Play,
  Plus,
  Trash2,
} from "lucide-react";
import type { FileStatus } from "@/types";

interface Props {
  onAddFiles: () => void;
  onStartProcessing: () => void;
  onOpenReview: (fileId: string) => void;
  onOpenExtraction: (fileId: string) => void;
}

export function FileList({
  onAddFiles,
  onStartProcessing,
  onOpenReview,
  onOpenExtraction,
}: Props) {
  const files = useFilesStore((s) => s.files);
  const clearAll = useFilesStore((s) => s.clearAll);

  const counts = countByStatus(files);
  const selected = counts.selected;
  const inProgress = counts.anonymizing + counts.extracting;
  const review =
    counts.anonymized + counts.anonymization_confirmed + counts.extracted;
  const saved = counts.saved;
  const errored = counts.error;

  const hasSelected = selected > 0;
  const isBusy = inProgress > 0;

  return (
    <div className="space-y-5">
      <div className="kb-surface flex flex-wrap items-center justify-between gap-4 px-5 py-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex flex-col">
            <p className="text-sm font-semibold leading-tight">
              Files to process
            </p>
            <p className="text-xs text-muted-foreground">
              {files.length} file{files.length !== 1 ? "s" : ""} loaded
            </p>
          </div>

          <span className="kb-divider hidden h-6 w-px sm:block" aria-hidden />

          <div className="flex flex-wrap items-center gap-1.5">
            <StatusChip
              icon={<CircleDashed className="h-3.5 w-3.5" />}
              label="Ready"
              value={selected}
              tone="muted"
            />
            <StatusChip
              icon={<Loader2 className="h-3.5 w-3.5 animate-spin" />}
              label="In progress"
              value={inProgress}
              tone="primary"
              hideIfZero
            />
            <StatusChip
              icon={<CheckCircle2 className="h-3.5 w-3.5" />}
              label="Awaiting review"
              value={review}
              tone="info"
              hideIfZero
            />
            <StatusChip
              icon={<CheckCircle2 className="h-3.5 w-3.5" />}
              label="Saved"
              value={saved}
              tone="success"
              hideIfZero
            />
            <StatusChip
              icon={<AlertCircle className="h-3.5 w-3.5" />}
              label="Errors"
              value={errored}
              tone="destructive"
              hideIfZero
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={onAddFiles}>
            <Plus className="h-4 w-4" /> Add more
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            disabled={isBusy}
            title={isBusy ? "Cannot clear while processing" : "Clear all files"}
          >
            <Trash2 className="h-4 w-4" /> Clear all
          </Button>

          {hasSelected && (
            <Button onClick={onStartProcessing} size="sm" className="gap-1.5">
              <Play className="h-4 w-4" />
              Start anonymization
              <span className="ml-0.5 rounded-md bg-primary-foreground/15 px-1.5 py-0.5 text-[11px] font-medium tabular-nums">
                {selected}
              </span>
            </Button>
          )}
        </div>
      </div>

      <ul className="space-y-2">
        {files.map((file) => (
          <li key={file.id} className="kb-fade-up">
            <FileListItem
              file={file}
              onOpenReview={onOpenReview}
              onOpenExtraction={onOpenExtraction}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

type Tone = "muted" | "primary" | "info" | "success" | "destructive";

const TONE_CLASSES: Record<Tone, string> = {
  muted: "text-muted-foreground border-border/80 bg-card/70",
  primary:
    "text-primary border-primary/25 bg-primary/8 dark:bg-primary/15",
  info: "text-chart-2 border-chart-2/30 bg-chart-2/10",
  success: "text-emerald-700 border-emerald-500/30 bg-emerald-500/10 dark:text-emerald-300",
  destructive:
    "text-destructive border-destructive/30 bg-destructive/10",
};

interface StatusChipProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: Tone;
  hideIfZero?: boolean;
}

function StatusChip({ icon, label, value, tone, hideIfZero }: StatusChipProps) {
  if (hideIfZero && value === 0) return null;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${TONE_CLASSES[tone]}`}
      aria-label={`${value} ${label.toLowerCase()}`}
    >
      {icon}
      <span>{label}</span>
      <span className="rounded bg-foreground/5 px-1.5 py-0.5 font-mono text-[11px] tabular-nums dark:bg-foreground/10">
        {value}
      </span>
    </span>
  );
}

function countByStatus(files: { status: FileStatus }[]) {
  const c: Record<FileStatus, number> = {
    selected: 0,
    anonymizing: 0,
    anonymized: 0,
    anonymization_confirmed: 0,
    extracting: 0,
    extracted: 0,
    saved: 0,
    error: 0,
  };
  for (const f of files) c[f.status]++;
  return c;
}
