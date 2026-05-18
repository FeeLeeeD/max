import { useFilesStore } from "@/store/filesStore";
import { pickFiles } from "@/lib/filePicker";
import { isChromiumBased } from "@/lib/browser";
import { BrowserGate } from "@/components/BrowserGate";
import { EmptyState } from "@/components/EmptyState";
import { FileList } from "@/components/FileList";

function App() {
  const files = useFilesStore((s) => s.files);
  const addFiles = useFilesStore((s) => s.addFiles);

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
      alert("Could not read files. See console for details.");
    }
  };

  const handleStartProcessing = () => {
    console.log("Start processing:", useFilesStore.getState().files);
    alert(`Would now process ${files.length} files (Phase 3 — coming next).`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <h1 className="text-xl font-bold">MAX Knowledge Base Tool</h1>
          <p className="text-xs text-muted-foreground">
            Anonymize and structure documents for the RAG knowledge base
          </p>
        </div>
      </header>

      <main>
        {files.length === 0 ? (
          <EmptyState onPickFiles={handlePickFiles} />
        ) : (
          <FileList
            onAddFiles={handlePickFiles}
            onStartProcessing={handleStartProcessing}
          />
        )}
      </main>
    </div>
  );
}

export default App;
