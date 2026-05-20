export type WhitelistType = 'company' | 'person' | 'product' | 'other';

export interface WhitelistEntry {
  name: string;
  type: WhitelistType;
}

const STORAGE_KEY = 'maxkb_whitelist';

const VALID_TYPES: ReadonlySet<WhitelistType> = new Set([
  'company',
  'person',
  'product',
  'other',
]);

export const DEFAULT_WHITELIST: WhitelistEntry[] = [
  { name: 'Seventh Sense', type: 'company' },
  { name: 'Telepath Data', type: 'company' },
  { name: '7th Sense', type: 'company' },
  { name: 'Mike', type: 'person' },
  { name: 'Erik', type: 'person' },
  { name: 'HubSpot', type: 'product' },
  { name: 'Salesforce', type: 'product' },
  { name: 'Marketo', type: 'product' },
  { name: 'Mailchimp', type: 'product' },
  { name: 'Pardot', type: 'product' },
  { name: 'Zoom', type: 'product' },
  { name: 'Slack', type: 'product' },
  { name: 'Cloudflare', type: 'product' },
  { name: 'Google', type: 'product' },
  { name: 'Microsoft', type: 'product' },
  { name: 'Adobe', type: 'product' },
];

export function getWhitelist(): WhitelistEntry[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    setWhitelist(DEFAULT_WHITELIST);
    return [...DEFAULT_WHITELIST];
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error('not an array');

    const valid: WhitelistEntry[] = [];
    for (const entry of parsed) {
      if (!entry || typeof entry !== 'object') continue;
      const e = entry as Record<string, unknown>;
      if (
        typeof e.name === 'string' &&
        e.name.trim().length > 0 &&
        typeof e.type === 'string' &&
        VALID_TYPES.has(e.type as WhitelistType)
      ) {
        valid.push({ name: e.name.trim(), type: e.type as WhitelistType });
      }
    }
    return valid;
  } catch {
    console.warn('Corrupted whitelist in localStorage, resetting to defaults');
    setWhitelist(DEFAULT_WHITELIST);
    return [...DEFAULT_WHITELIST];
  }
}

export function setWhitelist(entries: WhitelistEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function resetWhitelistToDefaults(): void {
  setWhitelist(DEFAULT_WHITELIST);
}
