import pg from "pg";
import { config } from "./config.js";

const { Pool } = pg;

export const pool = new Pool({ connectionString: config.databaseUrl });

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
