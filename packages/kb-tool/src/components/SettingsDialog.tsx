import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  clearSettings,
  getPortkeyApiKey,
  getPortkeyVirtualKey,
  setPortkeyApiKey,
  setPortkeyVirtualKey,
} from "@/lib/settings";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: Props) {
  const [apiKey, setApiKey] = useState("");
  const [virtualKey, setVirtualKey] = useState("");

  useEffect(() => {
    if (open) {
      setApiKey(getPortkeyApiKey() ?? "");
      setVirtualKey(getPortkeyVirtualKey() ?? "");
    }
  }, [open]);

  const handleSave = () => {
    const trimmedApi = apiKey.trim();
    const trimmedVirtual = virtualKey.trim();

    if (!trimmedApi) {
      alert("Portkey API Key is required.");
      return;
    }

    setPortkeyApiKey(trimmedApi);
    if (trimmedVirtual) {
      setPortkeyVirtualKey(trimmedVirtual);
    } else {
      // Clearing the virtual key when the user blanks it out is the
      // least-surprising behaviour.
      localStorage.removeItem("maxkb_portkey_virtual_key");
    }

    onOpenChange(false);
  };

  const handleClearAll = () => {
    if (
      !confirm(
        "Clear all stored settings? You will need to re-enter your API key.",
      )
    ) {
      return;
    }
    clearSettings();
    setApiKey("");
    setVirtualKey("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure your Portkey credentials. Keys are stored locally in your
            browser.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="portkey-api-key">
              Portkey API Key <span className="text-destructive">*</span>
            </Label>
            <Input
              id="portkey-api-key"
              type="password"
              placeholder="..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="portkey-virtual-key">
              Portkey Virtual Key (optional)
            </Label>
            <Input
              id="portkey-virtual-key"
              type="password"
              placeholder="anthropic-..."
              value={virtualKey}
              onChange={(e) => setVirtualKey(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
            <p className="text-xs text-muted-foreground">
              Leave blank if your Portkey config doesn't require a virtual key.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-row !justify-between sm:!justify-between">
          <Button
            variant="link"
            className="px-0 text-muted-foreground hover:text-destructive"
            onClick={handleClearAll}
          >
            Clear all settings
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
