import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { config as loadEnv } from "dotenv";

// Resolve the monorepo root relative to this file so the sandbox package
// reads the same .env regardless of the cwd the script is launched from.
const here = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(here, "../../..");

loadEnv({ path: resolve(projectRoot, ".env") });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env at the project root and set DATABASE_URL.",
  );
}

const portkeyApiKey = process.env.PORTKEY_API_KEY;
if (!portkeyApiKey) {
  throw new Error(
    "PORTKEY_API_KEY is not set. Copy .env.example to .env at the project root and set PORTKEY_API_KEY. " +
      "Get your key at https://portkey.ai/docs",
  );
}

const voyageApiKey = process.env.VOYAGE_API_KEY;
if (!voyageApiKey) {
  throw new Error(
    "VOYAGE_API_KEY is not set. Copy .env.example to .env at the project root and set VOYAGE_API_KEY. " +
      "Get your key at https://dashboard.voyageai.com",
  );
}

export const config = Object.freeze({
  databaseUrl,
  portkeyApiKey,
  portkeyVirtualKey: process.env.PORTKEY_VIRTUAL_KEY || undefined,
  portkeyConfig: process.env.PORTKEY_CONFIG || undefined,
  voyageApiKey,
  projectRoot,
});

export type Config = typeof config;
