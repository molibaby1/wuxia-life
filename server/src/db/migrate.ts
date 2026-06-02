import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Queryable } from './pool.js';
import { getPool, closePool } from './pool.js';

const migrationsDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../migrations',
);

export async function ensureMigrationsTable(client: Queryable): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

export async function listPendingMigrations(client: Queryable): Promise<string[]> {
  await ensureMigrationsTable(client);
  const files = (await readdir(migrationsDir))
    .filter(name => name.endsWith('.sql'))
    .sort();
  const applied = await client.query<{ version: string }>(
    'SELECT version FROM schema_migrations ORDER BY version',
  );
  const appliedSet = new Set(applied.rows.map(row => row.version));
  return files.filter(file => !appliedSet.has(file.replace(/\.sql$/, '')));
}

export async function runMigrations(databaseUrl: string): Promise<string[]> {
  const pool = getPool(databaseUrl);
  const client = await pool.connect();
  const appliedVersions: string[] = [];
  try {
    await ensureMigrationsTable(client);
    const files = (await readdir(migrationsDir))
      .filter(name => name.endsWith('.sql'))
      .sort();
    for (const file of files) {
      const version = file.replace(/\.sql$/, '');
      const exists = await client.query(
        'SELECT 1 FROM schema_migrations WHERE version = $1',
        [version],
      );
      if (exists.rowCount && exists.rowCount > 0) continue;
      const sql = await readFile(path.join(migrationsDir, file), 'utf8');
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (version) VALUES ($1)',
          [version],
        );
        await client.query('COMMIT');
        appliedVersions.push(version);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
  } finally {
    client.release();
  }
  return appliedVersions;
}

export async function migrateCli(databaseUrl: string): Promise<void> {
  try {
    const applied = await runMigrations(databaseUrl);
    if (applied.length === 0) {
      console.log('No pending migrations.');
    } else {
      console.log(`Applied migrations: ${applied.join(', ')}`);
    }
  } finally {
    await closePool();
  }
}
