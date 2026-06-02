import { runMigrations } from '../../server/src/db/migrate.js';
import { getPool, closePool } from '../../server/src/db/pool.js';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

export async function runMigrationTests(databaseUrl: string): Promise<void> {
  const first = await runMigrations(databaseUrl);
  const second = await runMigrations(databaseUrl);
  assert(second.length === 0, 'second run applies nothing');
  const pool = getPool(databaseUrl);
  const result = await pool.query('SELECT version FROM schema_migrations');
  assert(result.rowCount! >= 1, 'migration row recorded');
  if (first.length > 0) {
    assert(first.some(v => v.startsWith('001_')), 'fresh migration applies initial schema');
  }
  await closePool();
}
