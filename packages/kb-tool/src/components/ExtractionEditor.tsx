import { useEffect, useState } from "react";
import MDEditor from "@uiw/react-md-editor";
import { Loader2, Sparkles, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useFilesStore } from "@/store/filesStore";
import { extract } from "@/lib/extract";
import { saveToFile } from "@/lib/saveFile";
import { toast } from "sonner";

interface Props {
  fileId: string;
  onClose: () => void;
}

const EDITOR_VERTICAL_CHROME_PX = 200;

export function ExtractionEditor({ fileId, onClose }: Props) {
  const file = useFilesStore((s) => s.files.find((f) => f.id === fileId));
  const updateEditedContent = useFilesStore((s) => s.updateEditedContent);
  const setExtractionResult = useFilesStore((s) => s.setExtractionResult);

  const [regenerating, setRegenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [instructions, setInstructions] = useState("");
  const [editorHeight, setEditorHeight] = useState(
    () => Math.floor(window.innerHeight * 0.9) - EDITOR_VERTICAL_CHROME_PX,
  );

  useEffect(() => {
    const onResize = () => {
      setEditorHeight(
        Math.floor(window.innerHeight * 0.9) - EDITOR_VERTICAL_CHROME_PX,
      );
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (!file || (!file.extractedContent && !file.editedContent)) {
    return null;
  }

  const value = file.editedContent ?? file.extractedContent ?? "";
  const isSaved = file.status === "saved";

  const runRegeneration = async (extraInstructions?: string) => {
    if (!file.anonymizedContent) {
      toast.error("Cannot regenerate — no anonymized content on this file.");
      return;
    }
    setRegenerating(true);
    try {
      const markdown = await extract(file.anonymizedContent, extraInstructions);
      setExtractionResult(fileId, markdown);
      setShowInstructions(false);
      setInstructions("");
      toast.success("Extraction regenerated.");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error("Regeneration failed", { description: message });
    } finally {
      setRegenerating(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveToFile(fileId);
      // saveToFile returns silently on user-cancel; only close if status flipped.
      const after = useFilesStore.getState().files.find((f) => f.id === fileId);
      if (after?.status === "saved") {
        toast.success(`Saved as ${after.savedAs}`);
        onClose();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error("Save failed", { description: message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-none! w-[90vw] sm:max-w-none! h-[90vh] p-0 gap-0 flex flex-col overflow-hidden"
        showCloseButton
      >
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-3 flex-wrap">
            <span>
              Edit extraction —{" "}
              <span className="font-mono text-foreground/80">{file.name}</span>
            </span>
            {isSaved && file.savedAs && (
              <Badge
                variant="outline"
                className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-mono"
              >
                Saved as {file.savedAs}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Review and edit the extracted markdown. Regenerate to re-run
            extraction. Save to write the markdown to disk.
          </DialogDescription>
        </DialogHeader>

        <div
          className="flex-1 min-h-0 px-6 py-4 overflow-hidden"
          data-color-mode="light"
        >
          {regenerating ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Regenerating extraction…
            </div>
          ) : (
            <MDEditor
              value={value}
              onChange={(val) => updateEditedContent(fileId, val ?? "")}
              preview="live"
              height={editorHeight}
              visibleDragbar={false}
            />
          )}
        </div>

        {showInstructions && (
          <div className="px-6 pb-4 border-t pt-4 bg-muted/30">
            <div className="flex items-start justify-between gap-2 mb-2">
              <label
                htmlFor="regenerate-instructions"
                className="text-sm font-medium"
              >
                Additional instructions for regeneration
              </label>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => {
                  setShowInstructions(false);
                  setInstructions("");
                }}
                aria-label="Close instructions"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
            <Textarea
              id="regenerate-instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Group all delivery-window questions into a single section. Drop the small talk about weather."
              rows={3}
              disabled={regenerating}
            />
            <div className="flex justify-end mt-2">
              <Button
                size="sm"
                onClick={() => runRegeneration(instructions)}
                disabled={regenerating || !instructions.trim()}
              >
                {regenerating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                )}
                Apply
              </Button>
            </div>
          </div>
        )}

        <DialogFooter className="px-6 py-4 border-t flex-row justify-between! sm:justify-between!">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => runRegeneration()}
              disabled={regenerating || saving}
            >
              {regenerating && !showInstructions ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              ) : (
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              )}
              Regenerate
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowInstructions((v) => !v)}
              disabled={regenerating || saving}
            >
              {showInstructions
                ? "Hide instructions"
                : "Regenerate with instructions…"}
            </Button>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={regenerating || saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              ) : null}
              {isSaved ? "Save as…" : "Save"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
