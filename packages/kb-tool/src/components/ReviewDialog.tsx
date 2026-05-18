import { useMemo } from "react";
import ReactDiffViewer, { DiffMethod } from "react-diff-viewer-continued";
import { CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFilesStore } from "@/store/filesStore";
import type { Replacement } from "@/types";

interface Props {
  fileId: string;
  onClose: () => void;
}

const CATEGORY_STYLES: Record<Replacement["category"], string> = {
  person: "bg-blue-500/15 text-blue-700 border-blue-500/30 dark:text-blue-300",
  company:
    "bg-purple-500/15 text-purple-700 border-purple-500/30 dark:text-purple-300",
  email:
    "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-300",
  phone:
    "bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-300",
  url: "bg-cyan-500/15 text-cyan-700 border-cyan-500/30 dark:text-cyan-300",
  id: "bg-pink-500/15 text-pink-700 border-pink-500/30 dark:text-pink-300",
  other: "bg-muted text-muted-foreground border-border",
};

interface GroupedReplacement {
  original: string;
  replacement: string;
  category: Replacement["category"];
  count: number;
}

export function ReviewDialog({ fileId, onClose }: Props) {
  const file = useFilesStore((s) => s.files.find((f) => f.id === fileId));
  const confirmAnonymization = useFilesStore((s) => s.confirmAnonymization);
  const rejectAnonymization = useFilesStore((s) => s.rejectAnonymization);

  const grouped = useMemo<GroupedReplacement[]>(() => {
    if (!file?.anonymizationReplacements) return [];

    return groupReplacements(
      file.anonymizationReplacements,
      file.originalContent,
    );
  }, [file?.anonymizationReplacements, file?.originalContent]);

  if (!file || !file.anonymizedContent || !file.anonymizationReplacements) {
    return null;
  }

  const isConfirmed = file.status === "anonymization_confirmed";

  const handleConfirm = () => {
    confirmAnonymization(fileId);
    onClose();
  };

  const handleReject = () => {
    rejectAnonymization(fileId);
    onClose();
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
              Review anonymization —{" "}
              <span className="font-mono text-foreground/80">{file.name}</span>
            </span>
            {isConfirmed && (
              <Badge
                variant="outline"
                className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 gap-1"
              >
                <CheckCircle2 className="h-3 w-3" />
                Confirmed
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Review the side-by-side diff and the list of replacements, then
            confirm or reject.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          defaultValue="diff"
          className="flex-1 flex flex-col min-h-0 gap-0"
        >
          <div className="px-6 pt-3 pb-3 border-b">
            <TabsList>
              <TabsTrigger value="diff">Diff view</TabsTrigger>
              <TabsTrigger value="replacements">
                Replacements ({grouped.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="diff" className="flex-1 min-h-0 overflow-auto">
            <ReactDiffViewer
              oldValue={file.originalContent}
              newValue={file.anonymizedContent}
              splitView={true}
              compareMethod={DiffMethod.WORDS}
              leftTitle="Original"
              rightTitle="Anonymized"
            />
          </TabsContent>

          <TabsContent
            value="replacements"
            className="flex-1 min-h-0 overflow-hidden px-6 py-4 m-0"
          >
            {grouped.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No replacements were made — the model found nothing to
                anonymize.
              </p>
            ) : (
              <ScrollArea className="h-full pr-4">
                <ul className="space-y-2">
                  {grouped.map((g, i) => (
                    <li
                      key={`${g.original}__${g.replacement}__${i}`}
                      className="flex items-center gap-3 rounded-md border p-3"
                    >
                      <Badge
                        variant="outline"
                        className={`${CATEGORY_STYLES[g.category]} uppercase tracking-wide`}
                      >
                        {g.category}
                      </Badge>

                      <div className="flex-1 min-w-0 font-mono text-xs flex items-center gap-2 overflow-hidden">
                        <span
                          className="truncate text-foreground"
                          title={g.original}
                        >
                          {g.original}
                        </span>
                        <span className="text-muted-foreground shrink-0">
                          →
                        </span>
                        <span
                          className="truncate text-foreground"
                          title={g.replacement}
                        >
                          {g.replacement}
                        </span>
                      </div>
                      {g.count > 1 && (
                        <Badge
                          variant="secondary"
                          className="font-mono shrink-0"
                        >
                          ×{g.count}
                        </Badge>
                      )}
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="px-6 py-4 border-t">
          {isConfirmed ? (
            <>
              <Button variant="destructive" onClick={handleReject}>
                Re-anonymize
              </Button>
              <Button onClick={onClose}>Done</Button>
            </>
          ) : (
            <>
              <Button variant="destructive" onClick={handleReject}>
                Reject
              </Button>
              <Button onClick={handleConfirm}>Confirm anonymization</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Dedupes by (original, replacement) and counts occurrences in the original
// text. We use split-and-count because the LLM may emit a single replacement
// entry even for the 5 places "John Smith" appears.
function groupReplacements(
  replacements: Replacement[],
  originalContent: string,
): GroupedReplacement[] {
  const map = new Map<string, GroupedReplacement>();
  for (const r of replacements) {
    const key = `${r.original}\u0000${r.replacement}`;
    if (map.has(key)) continue;
    const count =
      r.original.length === 0
        ? 1
        : Math.max(1, originalContent.split(r.original).length - 1);
    map.set(key, {
      original: r.original,
      replacement: r.replacement,
      category: r.category,
      count,
    });
  }
  return Array.from(map.values());
}
