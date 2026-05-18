export interface PickedFile {
  name: string;
  size: number;
  content: string;
}

export async function pickFiles(): Promise<PickedFile[]> {
  if (!window.showOpenFilePicker) {
    throw new Error('File System Access API is unavailable in this browser.');
  }

  let handles: FileSystemFileHandle[];
  try {
    handles = await window.showOpenFilePicker({
      multiple: true,
      types: [
        {
          description: 'Text files',
          accept: { 'text/plain': ['.txt', '.md'] },
        },
      ],
    });
  } catch (err) {
    // User pressed Cancel in the native picker.
    if (err instanceof DOMException && err.name === 'AbortError') {
      return [];
    }
    throw new Error(
      `Failed to open file picker: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  const picked: PickedFile[] = [];
  for (const handle of handles) {
    const file = await handle.getFile();
    const content = await file.text();
    picked.push({ name: file.name, size: file.size, content });
  }
  return picked;
}
