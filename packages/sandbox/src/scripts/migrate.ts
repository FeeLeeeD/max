import { runMigrations } from "../migrator.js";
import { closePool } from "../db.js";

try {
  const { applied, skipped } = await runMigrations();
  console.log(
    `Migrations complete: ${applied.length} applied, ${skipped.length} skipped.`,
  );
  await closePool();
  process.exit(0);
} catch (err) {
  console.error("Migration failed:", err);
  await closePool().catch(() => {});
  process.exit(1);
}
