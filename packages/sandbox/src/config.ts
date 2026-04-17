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

export const config = Object.freeze({
  databaseUrl,
  projectRoot,
});

export type Config = typeof config;
