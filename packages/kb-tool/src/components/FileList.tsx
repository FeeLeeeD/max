import { useFilesStore } from '@/store/filesStore';
import { FileListItem } from './FileListItem';
import { Button } from '@/components/ui/button';
import { Plus, Play, Trash2 } from 'lucide-react';

interface Props {
  onAddFiles: () => void;
  onStartProcessing: () => void;
}

export function FileList({ onAddFiles, onStartProcessing }: Props) {
  const files = useFilesStore((s) => s.files);
  const clearAll = useFilesStore((s) => s.clearAll);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold">Files to process</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {files.length} file{files.length !== 1 ? 's' : ''} selected
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onAddFiles}>
            <Plus className="mr-2 h-4 w-4" /> Add more
          </Button>
          <Button variant="outline" onClick={clearAll}>
            <Trash2 className="mr-2 h-4 w-4" /> Clear all
          </Button>
          <Button onClick={onStartProcessing} disabled={files.length === 0}>
            <Play className="mr-2 h-4 w-4" /> Start processing
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {files.map((file) => (
          <FileListItem key={file.id} file={file} />
        ))}
      </div>
    </div>
  );
}
