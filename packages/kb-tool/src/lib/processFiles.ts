import { toast } from 'sonner';
import { useFilesStore } from '@/store/filesStore';
import { anonymize } from './anonymize';
import { runWithConcurrency } from './concurrency';

const ANONYMIZATION_CONCURRENCY = 3;

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
