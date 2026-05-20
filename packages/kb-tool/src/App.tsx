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
import { Settings, ShieldCheck, Sparkles } from "lucide-react";

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
        description:
          err instanceof Error ? err.message : "Check console for details.",
      });
    });
  };

  const hasFiles = files.length > 0;

  return (
    <div className="relative min-h-svh text-foreground">
      <header className="kb-glass-bar sticky top-0 z-30">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3.5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div
                aria-hidden
                className="absolute inset-0 -z-10 rounded-xl bg-linear-to-br from-primary/30 to-transparent blur-md"
              />
              <img
                src="/max.png"
                alt="MAX"
                width={40}
                height={40}
                className="rounded-lg ring-1 ring-border/70"
              />
            </div>
            <div className="leading-tight">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold tracking-tight">
                  MAX Knowledge Base
                </h1>
                <span className="kb-pill py-0.5! text-[10px]! uppercase tracking-wider">
                  Tool
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Anonymize and structure documents for the RAG knowledge base
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="kb-pill hidden sm:inline-flex">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              Local-only processing
            </span>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Settings"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="relative">
        <div className="mx-auto max-w-5xl px-6 pt-10 pb-16">
          {!hasFiles && (
            <section className="kb-fade-up mb-10 text-center">
              <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/70 px-3 py-1 text-xs text-muted-foreground supports-backdrop-filter:backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Anonymize · Structure · Save
              </div>
              <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
                Turn raw conversations into{" "}
                <span className="bg-linear-to-br from-primary to-foreground/80 bg-clip-text text-transparent">
                  clean knowledge
                </span>
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-pretty text-sm text-muted-foreground sm:text-[15px]">
                Drop in <code>.md</code> or <code>.txt</code> files. We&apos;ll
                strip personal details and produce structured Markdown ready
                for your RAG pipeline.
              </p>
            </section>
          )}

          <div className="kb-fade-up">
            {hasFiles ? (
              <FileList
                onAddFiles={handlePickFiles}
                onStartProcessing={handleStartProcessing}
                onOpenReview={setReviewFileId}
                onOpenExtraction={setExtractionFileId}
              />
            ) : (
              <EmptyState onPickFiles={handlePickFiles} />
            )}
          </div>
        </div>
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
