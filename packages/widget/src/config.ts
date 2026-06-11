const DEFAULT_API_URL = "http://localhost:8000";

// Single source of truth for the backend base URL. Trailing slash is trimmed
// so callers can join paths predictably with `${apiUrl}/chat`.
export const apiUrl = (import.meta.env.VITE_API_URL ?? DEFAULT_API_URL).replace(
  /\/+$/,
  "",
);
