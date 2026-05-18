import { useEffect, useState } from "react";
import { useFilesStore } from "@/store/filesStore";
import { pickFiles } from "@/lib/filePicker";
import { isChromiumBased } from "@/lib/browser";
import { hasRequiredSettings } from "@/lib/settings";
import {
  maybeStartExtraction,
  processBatchAnonymization,
} from "@/lib/processFiles";
import { BrowserGate } from "@/components/BrowserGate";
import { EmptyState } from "@/components/EmptyState";
import { ExtractionEditor } from "@/components/ExtractionEditor";
import { FileList } from "@/components/FileList";
import { ReviewDialog } from "@/components/ReviewDialog";
import { SettingsDialog } from "@/components/SettingsDialog";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Settings } from "lucide-react";

function App() {
  const files = useFilesStore((s) => s.files);
  const addFiles = useFilesStore((s) => s.addFiles);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [reviewFileId, setReviewFileId] = useState<string | null>(null);
  const [extractionFileId, setExtractionFileId] = useState<string | null>(null);

  useEffect(() => {
    if (!hasRequiredSettings()) {
      setSettingsOpen(true);
    }
  }, []);

  // Auto-start extraction whenever a file enters 'anonymization_confirmed'.
  // The maybeStartExtraction helper guards against re-entry and loops until
  // the queue is drained, so it's safe to fire on every state change.
  useEffect(() => {
    const unsubscribe = useFilesStore.subscribe((state) => {
      const hasPending = state.files.some(
        (f) => f.status === "anonymization_confirmed",
      );
      if (hasPending) {
        maybeStartExtraction().catch((err) =>
          console.error("Extraction batch failed:", err),
        );
      }
    });
    return unsubscribe;
  }, []);

  if (!isChromiumBased()) {
    return <BrowserGate />;
  }

  const handlePickFiles = async () => {
    try {
      const picked = await pickFiles();
      if (picked.length === 0) return;

      addFiles(
        picked.map((p) => ({
          name: p.name,
          size: p.size,
          originalContent: p.content,
        })),
      );
    } catch (err) {
      console.error("File picker error:", err);
      toast.error("Could not read files", {
        description: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const handleStartProcessing = () => {
    if (!hasRequiredSettings()) {
      setSettingsOpen(true);
      return;
    }
    processBatchAnonymization().catch((err) => {
      console.error("Batch processing failed:", err);
      toast.error("Batch processing encountered an error", {
        description: err instanceof Error ? err.message : "Check console for details.",
      });
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">MAX Knowledge Base Tool</h1>
            <p className="text-xs text-muted-foreground">
              Anonymize and structure documents for the RAG knowledge base
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Settings"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main>
        {files.length === 0 ? (
          <EmptyState onPickFiles={handlePickFiles} />
        ) : (
          <FileList
            onAddFiles={handlePickFiles}
            onStartProcessing={handleStartProcessing}
            onOpenReview={setReviewFileId}
            onOpenExtraction={setExtractionFileId}
          />
        )}
      </main>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      {reviewFileId && (
        <ReviewDialog
          fileId={reviewFileId}
          onClose={() => setReviewFileId(null)}
        />
      )}
      {extractionFileId && (
        <ExtractionEditor
          fileId={extractionFileId}
          onClose={() => setExtractionFileId(null)}
        />
      )}
      <Toaster richColors position="bottom-right" />
    </div>
  );
}

export default App;
