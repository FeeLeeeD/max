import type { KbFile } from '@/types';
import { useFilesStore } from '@/store/filesStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, X } from 'lucide-react';

interface Props {
  file: KbFile;
}

export function FileListItem({ file }: Props) {
  const removeFile = useFilesStore((s) => s.removeFile);

  return (
    <Card className="p-4 flex-row items-center gap-4">
      <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />

      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{file.name}</p>
        <p className="text-xs text-muted-foreground">
          {formatBytes(file.size)}
        </p>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => removeFile(file.id)}
        aria-label="Remove file"
      >
        <X className="h-4 w-4" />
      </Button>
    </Card>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
