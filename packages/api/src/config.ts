// Importing the sandbox config triggers its dotenv load of the root .env
// before we read any API-specific vars below — so PORT/ALLOWED_ORIGINS set in
// .env are picked up, and DATABASE_URL/PORTKEY_API_KEY are validated at startup.
import "@max/sandbox/config";

const port = Number(process.env.PORT ?? 8000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error(`PORT must be a valid port number, got "${process.env.PORT}".`);
}

// Comma-separated list; '*' means allow any origin (dev default). Consumed by
// CORS in a later step — read here so config stays the single source of truth.
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "*")
  .split(",")
  .map((o) => o.trim())
  .filter((o) => o.length > 0);

// Shared bearer token guarding the /admin routes. Optional: when unset the
// admin surface is disabled (the middleware returns 503), so we don't throw.
const adminToken = process.env.ADMIN_TOKEN || undefined;

export const apiConfig = Object.freeze({
  port,
  allowedOrigins,
  adminToken,
});

export type ApiConfig = typeof apiConfig;
