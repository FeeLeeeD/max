import { toast } from 'sonner';
import { useFilesStore } from '@/store/filesStore';
import { anonymize } from './anonymize';
import { extract } from './extract';
import { runWithConcurrency } from './concurrency';

const ANONYMIZATION_CONCURRENCY = 3;
const EXTRACTION_CONCURRENCY = 3;

export async function processBatchAnonymization(): Promise<void> {
  const { files, updateStatus, setAnonymizationResult } =
    useFilesStore.getState();


  const toProcess = files.filter((f) => f.status === 'selected' || f.status === 'error');
  if (toProcess.length === 0) return;

  for (const file of toProcess) {
    updateStatus(file.id, 'anonymizing');
  }

  await runWithConcurrency(toProcess, ANONYMIZATION_CONCURRENCY, async (file) => {
    try {
      const result = await anonymize(file.originalContent);
      setAnonymizationResult(file.id, result.anonymizedText, result.replacements);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      updateStatus(file.id, 'error', message);
      toast.error(`Anonymization failed: ${file.name}`, {
        description: message,
      });
    }
  });
}

export async function processBatchExtraction(): Promise<void> {
  const { files, updateStatus, setExtractionResult } = useFilesStore.getState();

  const toProcess = files.filter((f) => f.status === 'anonymization_confirmed');
  if (toProcess.length === 0) return;

  for (const file of toProcess) {
    updateStatus(file.id, 'extracting');
  }

  await runWithConcurrency(toProcess, EXTRACTION_CONCURRENCY, async (file) => {
    try {
      const markdown = await extract(file.anonymizedContent!);
      setExtractionResult(file.id, markdown);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      updateStatus(file.id, 'error', message);
      toast.error(`Extraction failed: ${file.name}`, {
        description: message,
      });
    }
  });
}

// Guard against multiple concurrent batch runs being triggered by rapid
// state changes (e.g. user confirming anonymization on several files quickly).
// We loop until the queue is drained so that files confirmed *during* a batch
// still get processed without waiting for the next subscribe event.
let extractionInFlight = false;

export async function maybeStartExtraction(): Promise<void> {
  if (extractionInFlight) return;
  extractionInFlight = true;

  try {
    while (true) {
      const { files } = useFilesStore.getState();
      const hasPending = files.some(
        (f) => f.status === 'anonymization_confirmed',
      );
      if (!hasPending) break;
      await processBatchExtraction();
    }
  } finally {
    extractionInFlight = false;
  }
}
