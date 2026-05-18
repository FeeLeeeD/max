const PORTKEY_KEY = 'maxkb_portkey_api_key';
const PORTKEY_VIRTUAL_KEY = 'maxkb_portkey_virtual_key';

export function getPortkeyApiKey(): string | null {
  return localStorage.getItem(PORTKEY_KEY);
}

export function getPortkeyVirtualKey(): string | null {
  return localStorage.getItem(PORTKEY_VIRTUAL_KEY);
}

export function setPortkeyApiKey(key: string): void {
  localStorage.setItem(PORTKEY_KEY, key);
}

export function setPortkeyVirtualKey(key: string): void {
  localStorage.setItem(PORTKEY_VIRTUAL_KEY, key);
}

export function clearSettings(): void {
  localStorage.removeItem(PORTKEY_KEY);
  localStorage.removeItem(PORTKEY_VIRTUAL_KEY);
}

export function hasRequiredSettings(): boolean {
  return Boolean(getPortkeyApiKey());
}
