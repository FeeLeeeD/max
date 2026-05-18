import { create } from 'zustand';
import type { KbFile, FileStatus } from '@/types';

interface FilesState {
  files: KbFile[];

  addFiles: (newFiles: Omit<KbFile, 'id' | 'status'>[]) => void;
  removeFile: (id: string) => void;
  updateStatus: (id: string, status: FileStatus, error?: string) => void;
  clearAll: () => void;
}

export const useFilesStore = create<FilesState>()((set) => ({
  files: [],

  addFiles: (newFiles) =>
    set((state) => ({
      files: [
        ...state.files,
        ...newFiles.map((f) => ({
          ...f,
          id: crypto.randomUUID(),
          status: 'selected' as FileStatus,
        })),
      ],
    })),

  removeFile: (id) =>
    set((state) => ({
      files: state.files.filter((f) => f.id !== id),
    })),

  updateStatus: (id, status, error) =>
    set((state) => ({
      files: state.files.map((f) =>
        f.id === id ? { ...f, status, error } : f,
      ),
    })),

  clearAll: () => set({ files: [] }),
}));
