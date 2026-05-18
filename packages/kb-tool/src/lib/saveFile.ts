import { useFilesStore } from '@/store/filesStore';

export async function saveToFile(fileId: string): Promise<void> {
  const file = useFilesStore.getState().files.find((f) => f.id === fileId);
  if (!file) {
    throw new Error(`File not found: ${fileId}`);
  }

  const content = file.editedContent ?? file.extractedContent;
  if (!content) {
    throw new Error('Nothing to save — extraction has not produced content yet.');
  }

  if (!window.showSaveFilePicker) {
    throw new Error('File System Access API is unavailable in this browser.');
  }

  const base = file.name.replace(/\.[^/.]+$/, '');
  const suggestedName = `${base}.extracted.md`;

  let handle: FileSystemFileHandle;
  try {
    handle = await window.showSaveFilePicker({
      suggestedName,
      types: [
        {
          description: 'Markdown file',
          accept: { 'text/markdown': ['.md'] },
        },
      ],
    });
  } catch (err) {
    // User pressed Cancel in the native save dialog. Swallow silently.
    if (err instanceof DOMException && err.name === 'AbortError') {
      return;
    }
    throw err;
  }

  const writable = await handle.createWritable();
  await writable.write(content);
  await writable.close();

  useFilesStore.getState().markSaved(fileId, handle.name);
}
