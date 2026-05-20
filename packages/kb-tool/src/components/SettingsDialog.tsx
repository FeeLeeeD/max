import { useEffect, useState } from "react";
import { Plus, RotateCcw, X } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  clearSettings,
  getPortkeyApiKey,
  getPortkeyVirtualKey,
  setPortkeyApiKey,
  setPortkeyVirtualKey,
} from "@/lib/settings";
import {
  DEFAULT_WHITELIST,
  getWhitelist,
  setWhitelist,
} from "@/lib/whitelist";
import type { WhitelistEntry, WhitelistType } from "@/lib/whitelist";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TYPE_BADGE_CLASSES: Record<WhitelistType, string> = {
  company:
    "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200",
  person:
    "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-200",
  product:
    "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-200",
  other:
    "bg-gray-100 text-gray-800 dark:bg-gray-800/40 dark:text-gray-200",
};

const TYPE_LABEL: Record<WhitelistType, string> = {
  company: "Company",
  person: "Person",
  product: "Product",
  other: "Other",
};

const TYPE_OPTIONS: WhitelistType[] = ["company", "person", "product", "other"];

export function SettingsDialog({ open, onOpenChange }: Props) {
  const [apiKey, setApiKey] = useState("");
  const [virtualKey, setVirtualKey] = useState("");
  const [whitelistEntries, setWhitelistEntries] = useState<WhitelistEntry[]>(
    [],
  );

  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<WhitelistType>("company");
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setApiKey(getPortkeyApiKey() ?? "");
      setVirtualKey(getPortkeyVirtualKey() ?? "");
      setWhitelistEntries(getWhitelist());
      setAddOpen(false);
      setNewName("");
      setNewType("company");
      setAddError(null);
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
      localStorage.removeItem("maxkb_portkey_virtual_key");
    }

    setWhitelist(whitelistEntries);

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

  const handleAddEntry = () => {
    const trimmed = newName.trim();
    if (!trimmed) {
      setAddError("Name is required.");
      return;
    }
    const dupe = whitelistEntries.some(
      (e) => e.name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (dupe) {
      setAddError(`"${trimmed}" is already in the whitelist.`);
      return;
    }
    setWhitelistEntries((prev) => [...prev, { name: trimmed, type: newType }]);
    setNewName("");
    setNewType("company");
    setAddError(null);
    setAddOpen(false);
  };

  const handleCancelAdd = () => {
    setNewName("");
    setNewType("company");
    setAddError(null);
    setAddOpen(false);
  };

  const handleRemoveEntry = (index: number) => {
    setWhitelistEntries((prev) => prev.filter((_, i) => i !== index));
  };

  const handleResetDefaults = () => {
    if (
      !confirm(
        "This will replace your current whitelist with the defaults. Continue?",
      )
    ) {
      return;
    }
    setWhitelistEntries([...DEFAULT_WHITELIST]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure your Portkey credentials and anonymization whitelist.
            Everything is stored locally in your browser.
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

          <Separator className="my-2" />

          <div className="grid gap-2">
            <div className="flex items-baseline justify-between gap-2">
              <Label>Anonymization whitelist</Label>
              <span className="text-xs text-muted-foreground">
                {whitelistEntries.length}{" "}
                {whitelistEntries.length === 1 ? "entry" : "entries"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Names in this list will never be replaced during anonymization.
            </p>

            <div className="mt-1 max-h-[300px] overflow-y-auto rounded-md border border-border/70 bg-background/40">
              {whitelistEntries.length === 0 ? (
                <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                  No entries. Anything will be anonymized.
                </div>
              ) : (
                <ul className="divide-y divide-border/60">
                  {whitelistEntries.map((entry, i) => (
                    <li
                      key={`${entry.name}-${i}`}
                      className="flex items-center justify-between gap-2 px-3 py-1.5"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <Badge
                          className={cn(
                            "shrink-0",
                            TYPE_BADGE_CLASSES[entry.type],
                          )}
                        >
                          {TYPE_LABEL[entry.type]}
                        </Badge>
                        <span className="truncate text-sm">{entry.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label={`Remove ${entry.name}`}
                        onClick={() => handleRemoveEntry(i)}
                      >
                        <X />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {addOpen ? (
              <div className="mt-2 grid gap-2 rounded-md border border-border/70 bg-background/40 p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Input
                    autoFocus
                    placeholder="Name (e.g. Demandbase)"
                    value={newName}
                    onChange={(e) => {
                      setNewName(e.target.value);
                      if (addError) setAddError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddEntry();
                      } else if (e.key === "Escape") {
                        e.preventDefault();
                        handleCancelAdd();
                      }
                    }}
                    autoComplete="off"
                    spellCheck={false}
                    className="flex-1"
                  />
                  <Select
                    value={newType}
                    onValueChange={(v) => setNewType(v as WhitelistType)}
                  >
                    <SelectTrigger className="w-full sm:w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPE_OPTIONS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {TYPE_LABEL[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {addError && (
                  <p className="text-xs text-destructive">{addError}</p>
                )}
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelAdd}
                  >
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleAddEntry}>
                    Add
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-2 flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAddOpen(true)}
                >
                  <Plus />
                  Add new entry
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={handleResetDefaults}
                >
                  <RotateCcw />
                  Reset to defaults
                </Button>
              </div>
            )}
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
