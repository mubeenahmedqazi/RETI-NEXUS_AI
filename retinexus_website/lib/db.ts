import { Pool } from 'pg';

let pool: Pool | null = null;

/** Shared, lazily-created connection pool to the same Neon Postgres the portal uses. Read-only lookups only. */
export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 5,
    });
  }
  return pool;
}
