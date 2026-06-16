import { serve } from "@hono/node-server";
import { closePool } from "@max/sandbox/db";
import { runMigrations } from "@max/sandbox/migrator";
import { app } from "./app.js";
import { apiConfig } from "./config.js";

// Apply pending migrations BEFORE the server starts accepting requests. This is
// opt-in (RUN_MIGRATIONS_ON_BOOT) so local dev keeps running migrations via the
// CLI. Fail-fast: a migration error exits non-zero rather than serving traffic
// against an un-migrated schema — the correct behavior for a deploy.
if (apiConfig.runMigrationsOnBoot) {
  try {
    const { applied, skipped } = await runMigrations();
    console.log(
      `Migrations on boot: ${applied.length} applied, ${skipped.length} skipped.`,
    );
  } catch (err) {
    console.error("Migrations on boot failed, refusing to start:", err);
    await closePool().catch(() => {});
    process.exit(1);
  }
}

// Bind 0.0.0.0 explicitly. @hono/node-server already listens on all interfaces
// when hostname is omitted, but being explicit guarantees reachability inside a
// container (a localhost/127.0.0.1 bind would only accept connections from
// within the container and break Railway/Docker health checks and routing).
const server = serve(
  { fetch: app.fetch, port: apiConfig.port, hostname: "0.0.0.0" },
  (info) => {
    console.log(`Server listening on http://${info.address}:${info.port}`);
  },
);

let shuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\nReceived ${signal}, shutting down...`);

  server.close(async (err) => {
    if (err) {
      console.error("Error closing server:", err);
    }
    try {
      await closePool();
    } catch (poolErr) {
      console.error("Error closing database pool:", poolErr);
    }
    process.exit(err ? 1 : 0);
  });
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
