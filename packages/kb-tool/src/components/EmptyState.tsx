import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

interface Props {
  onPickFiles: () => void;
}

export function EmptyState({ onPickFiles }: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <Upload className="h-16 w-16 text-muted-foreground mb-6" />

      <h2 className="text-2xl font-semibold mb-2">Select files to process</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        Choose <b>.md</b> or <b>.txt</b> files containing customer
        conversations, meeting transcripts, or articles. They will be anonymized
        and structured for the knowledge base.
      </p>

      <Button size="lg" onClick={onPickFiles} className="mt-4">
        <Upload className="mr-2 h-4 w-4" />
        Select files
      </Button>
    </div>
  );
}
