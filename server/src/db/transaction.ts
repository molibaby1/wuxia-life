import type { Queryable } from './pool.js';
import { getPool } from './pool.js';

export async function withTransaction<T>(
  databaseUrl: string,
  fn: (client: Queryable) => Promise<T>,
): Promise<T> {
  const client = await getPool(databaseUrl).connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
