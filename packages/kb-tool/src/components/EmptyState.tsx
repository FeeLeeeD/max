import { Button } from "@/components/ui/button";
import { FileText, FolderOpen, ShieldCheck, Sparkles } from "lucide-react";

interface Props {
  onPickFiles: () => void;
}

export function EmptyState({ onPickFiles }: Props) {
  return (
    <div className="kb-surface relative overflow-hidden p-8 sm:p-10">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 right-0 h-64 w-64 rounded-full bg-primary/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -left-10 h-72 w-72 rounded-full bg-chart-2/15 blur-3xl"
      />

      <div className="relative grid gap-8 sm:grid-cols-[1.1fr_1fr] sm:items-center">
        <div className="text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/70 px-3 py-1 text-xs text-muted-foreground">
            <FileText className="h-3.5 w-3.5 text-primary" />
            Markdown &amp; plain text
          </div>

          <h3 className="mt-4 text-2xl font-semibold tracking-tight">
            Pick the files you want to process
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Customer conversations, meeting transcripts, support threads,
            internal notes &mdash; anything in <code>.md</code> or{" "}
            <code>.txt</code>. Files are read in your browser and never leave
            your device until you save the result.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button size="lg" onClick={onPickFiles} className="gap-2">
              <FolderOpen className="h-4 w-4" />
              Select files
            </Button>
            <span className="text-xs text-muted-foreground">
              You can add more later.
            </span>
          </div>
        </div>

        <ul className="grid gap-3 text-sm">
          <Feature
            icon={<ShieldCheck className="h-4 w-4" />}
            title="Anonymized first"
            body="Names, emails, phones, URLs and IDs are detected and replaced before extraction."
          />
          <Feature
            icon={<Sparkles className="h-4 w-4" />}
            title="Structured for RAG"
            body="Output is clean Markdown — predictable headings, no chit-chat, ready to chunk."
          />
          <Feature
            icon={<FolderOpen className="h-4 w-4" />}
            title="Local-only"
            body="Files are read with the File System Access API. Nothing is uploaded by this app."
          />
        </ul>
      </div>
    </div>
  );
}

interface FeatureProps {
  icon: React.ReactNode;
  title: string;
  body: string;
}

function Feature({ icon, title, body }: FeatureProps) {
  return (
    <li className="flex gap-3 rounded-lg border border-border/70 bg-background/50 p-3 supports-backdrop-filter:backdrop-blur-md">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary ring-1 ring-primary/20">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{body}</p>
      </div>
    </li>
  );
}
