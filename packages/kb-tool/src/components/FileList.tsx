import { useFilesStore } from '@/store/filesStore';
import { FileListItem } from './FileListItem';
import { Button } from '@/components/ui/button';
import { Plus, Play, Trash2 } from 'lucide-react';

interface Props {
  onAddFiles: () => void;
  onStartProcessing: () => void;
  onOpenReview: (fileId: string) => void;
}

export function FileList({ onAddFiles, onStartProcessing, onOpenReview }: Props) {
  const files = useFilesStore((s) => s.files);
  const clearAll = useFilesStore((s) => s.clearAll);

  const selectedCount = files.filter((f) => f.status === 'selected').length;
  const hasSelected = selectedCount > 0;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold">Files to process</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {files.length} file{files.length !== 1 ? 's' : ''} loaded
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onAddFiles}>
            <Plus className="mr-2 h-4 w-4" /> Add more
          </Button>
          <Button variant="outline" onClick={clearAll}>
            <Trash2 className="mr-2 h-4 w-4" /> Clear all
          </Button>
          <Button
            onClick={onStartProcessing}
            disabled={!hasSelected}
            title={
              hasSelected
                ? undefined
                : 'Extraction (Phase 4) is not yet implemented.'
            }
          >
            <Play className="mr-2 h-4 w-4" />
            {hasSelected
              ? `Start anonymization (${selectedCount} file${selectedCount !== 1 ? 's' : ''})`
              : 'Continue'}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {files.map((file) => (
          <FileListItem
            key={file.id}
            file={file}
            onOpenReview={onOpenReview}
          />
        ))}
      </div>
    </div>
  );
}
