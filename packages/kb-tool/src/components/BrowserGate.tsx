import { AlertTriangle } from 'lucide-react';

export function BrowserGate() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background">
      <div className="max-w-lg text-center">
        <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto mb-6" />
        <h1 className="text-2xl font-semibold mb-3">
          Chromium browser required
        </h1>
        <p className="text-muted-foreground mb-2">
          This tool uses the File System Access API, which is only available
          in Chromium-based browsers.
        </p>
        <p className="text-muted-foreground">
          Please open this app in <strong>Chrome</strong>, <strong>Edge</strong>,
          Brave, or Arc.
        </p>
      </div>
    </div>
  );
}
