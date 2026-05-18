import { create } from 'zustand';
import type { KbFile, FileStatus, Replacement } from '@/types';

interface FilesState {
  files: KbFile[];

  addFiles: (newFiles: Omit<KbFile, 'id' | 'status'>[]) => void;
  removeFile: (id: string) => void;
  updateStatus: (id: string, status: FileStatus, error?: string) => void;
  clearAll: () => void;

  setAnonymizationResult: (
    id: string,
    anonymizedContent: string,
    replacements: Replacement[],
  ) => void;
  confirmAnonymization: (id: string) => void;
  rejectAnonymization: (id: string) => void;
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

  setAnonymizationResult: (id, anonymizedContent, replacements) =>
    set((state) => ({
      files: state.files.map((f) =>
        f.id === id
          ? {
              ...f,
              status: 'anonymized' as FileStatus,
              anonymizedContent,
              anonymizationReplacements: replacements,
              error: undefined,
            }
          : f,
      ),
    })),

  confirmAnonymization: (id) =>
    set((state) => ({
      files: state.files.map((f) =>
        f.id === id
          ? { ...f, status: 'anonymization_confirmed' as FileStatus }
          : f,
      ),
    })),

  rejectAnonymization: (id) =>
    set((state) => ({
      files: state.files.map((f) =>
        f.id === id
          ? {
              ...f,
              status: 'selected' as FileStatus,
              anonymizedContent: undefined,
              anonymizationReplacements: undefined,
              error: undefined,
            }
          : f,
      ),
    })),
}));
