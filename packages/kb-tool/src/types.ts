export type FileStatus =
  | 'selected'
  | 'anonymizing'
  | 'anonymized'
  | 'anonymization_confirmed'
  | 'extracting'
  | 'extracted'
  | 'saved'
  | 'error';

export interface KbFile {
  id: string;
  name: string;
  size: number;
  originalContent: string;
  status: FileStatus;
  error?: string;

  anonymizedContent?: string;
  anonymizationReplacements?: Replacement[];
  extractedContent?: string;
}

export interface Replacement {
  original: string;
  replacement: string;
  category: 'person' | 'company' | 'email' | 'phone' | 'url' | 'id' | 'other';
}
