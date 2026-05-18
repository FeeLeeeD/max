import type { KbFile } from '@/types';
import { useFilesStore } from '@/store/filesStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  RotateCcw,
  X,
} from 'lucide-react';

interface Props {
  file: KbFile;
  onOpenReview: (fileId: string) => void;
  onOpenExtraction: (fileId: string) => void;
}

export function FileListItem({ file, onOpenReview, onOpenExtraction }: Props) {
  const removeFile = useFilesStore((s) => s.removeFile);
  const updateStatus = useFilesStore((s) => s.updateStatus);

  const removeDisabled =
    file.status === 'anonymizing' || file.status === 'extracting';

  return (
    <Card className="p-4 flex-row items-center gap-4">
      <FileText className="h-5 w-5 text-muted-foreground shrink-0" />

      <div className="flex-1 min-w-0 text-left">
        <p className="font-medium truncate">{file.name}</p>
        <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
      </div>

      <StatusIndicator
        file={file}
        onOpenReview={onOpenReview}
        onOpenExtraction={onOpenExtraction}
        onRetry={() => updateStatus(file.id, 'selected')}
      />

      <Button
        variant="ghost"
        size="icon"
        onClick={() => removeFile(file.id)}
        disabled={removeDisabled}
        aria-label="Remove file"
        title={removeDisabled ? 'Cannot remove while processing' : 'Remove file'}
      >
        <X className="h-4 w-4" />
      </Button>
    </Card>
  );
}

interface StatusProps {
  file: KbFile;
  onOpenReview: (fileId: string) => void;
  onOpenExtraction: (fileId: string) => void;
  onRetry: () => void;
}

function StatusIndicator({
  file,
  onOpenReview,
  onOpenExtraction,
  onRetry,
}: StatusProps) {
  switch (file.status) {
    case 'selected':
      return (
        <span className="text-xs text-muted-foreground shrink-0">Ready</span>
      );

    case 'anonymizing':
      return (
        <span className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Anonymizing…
        </span>
      );

    case 'anonymized':
      return (
        <Button
          variant="outline"
          size="sm"
          className="border-blue-500/40 bg-blue-500/10 text-blue-700 hover:bg-blue-500/15 hover:text-blue-700 dark:text-blue-300"
          onClick={() => onOpenReview(file.id)}
        >
          Review anonymization →
        </Button>
      );

    case 'anonymization_confirmed':
      return (
        <span className="text-xs text-muted-foreground shrink-0">
          Queued for extraction
        </span>
      );

    case 'extracting':
      return (
        <span className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Extracting…
        </span>
      );

    case 'extracted':
      return (
        <Button
          variant="outline"
          size="sm"
          className="border-purple-500/40 bg-purple-500/10 text-purple-700 hover:bg-purple-500/15 hover:text-purple-700 dark:text-purple-300"
          onClick={() => onOpenExtraction(file.id)}
        >
          Review extraction →
        </Button>
      );

    case 'saved':
      return (
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 px-2 text-xs text-emerald-700 hover:bg-emerald-500/10 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 max-w-[320px]"
          onClick={() => onOpenExtraction(file.id)}
          title={
            file.savedAs ? `Saved as ${file.savedAs}` : 'Saved (filename unknown)'
          }
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span className="truncate">
            Saved as <span className="font-mono">{file.savedAs ?? '—'}</span>
          </span>
        </Button>
      );

    case 'error':
      return (
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="flex items-center gap-1.5 text-xs text-destructive max-w-[280px] truncate"
            title={file.error ?? 'Unknown error'}
          >
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{file.error ?? 'Unknown error'}</span>
          </span>
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Retry
          </Button>
        </div>
      );
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
