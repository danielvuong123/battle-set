import pg from 'pg';

const { Pool } = pg;

export const pool = new Pool({
  host:     process.env.PGHOST     ?? 'localhost',
  port:     Number(process.env.PGPORT ?? 5432),
  database: process.env.PGDATABASE ?? 'battleset',
  user:     process.env.PGUSER     ?? 'battleset',
  password: process.env.PGPASSWORD ?? '',
});

export async function query<T extends pg.QueryResultRow>(
  sql: string,
  params?: unknown[]
): Promise<pg.QueryResult<T>> {
  return pool.query<T>(sql, params);
}
