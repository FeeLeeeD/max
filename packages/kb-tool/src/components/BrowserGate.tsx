import { AlertTriangle, Globe } from "lucide-react";

export function BrowserGate() {
  return (
    <div className="flex min-h-svh items-center justify-center px-6 py-10">
      <div className="kb-surface relative max-w-lg overflow-hidden p-8 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-amber-500/15 blur-3xl"
        />
        <div className="relative">
          <span className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 ring-1 ring-amber-500/30 dark:text-amber-400">
            <AlertTriangle className="h-6 w-6" />
          </span>
          <h1 className="text-xl font-semibold tracking-tight">
            Chromium browser required
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This tool uses the File System Access API, which is only available
            in Chromium-based browsers.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Please open this app in{" "}
            <strong className="text-foreground">Chrome</strong>,{" "}
            <strong className="text-foreground">Edge</strong>, Brave, or Arc.
          </p>

          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-xs text-muted-foreground">
            <Globe className="h-3.5 w-3.5" />
            Tested on Chrome 120+
          </div>
        </div>
      </div>
    </div>
  );
}
