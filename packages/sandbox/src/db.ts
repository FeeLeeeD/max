import pg from "pg";
import { config } from "./config.js";

const { Pool } = pg;

// Conditional TLS driven by the single config.databaseSsl signal (see
// config.ts for precedence). Managed Postgres requires TLS; local Docker does
// not, so when disabled we pass no `ssl` option (unchanged local behavior).
//
// rejectUnauthorized: false encrypts the connection but does NOT validate the
// server certificate chain — acceptable for this deployment. Future hardening:
// supply the provider's CA cert and set rejectUnauthorized: true.
export const pool = new Pool({
  connectionString: config.databaseUrl,
  ...(config.databaseSsl ? { ssl: { rejectUnauthorized: false } } : {}),
});

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  sql: string,
  params?: ReadonlyArray<unknown>,
): Promise<T[]> {
  const result = await pool.query<T>(sql, params as unknown[] | undefined);
  return result.rows;
}

export async function closePool(): Promise<void> {
  await pool.end();
}
