import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { runMigrations } from '../../server/src/db/migrate.js';
import { getPool, closePool } from '../../server/src/db/pool.js';

const { Pool } = pg;

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

export async function runCheckpointMigrationIsolationTest(databaseUrl: string): Promise<void> {
  const isolatedPool = new Pool({ connectionString: databaseUrl });
  const client = await isolatedPool.connect();
  const schema = `checkpoint_migration_${randomUUID().replace(/-/g, '')}`;
  let schemaCreated = false;
  let clientReleased = false;
  try {
    await client.query(`CREATE SCHEMA "${schema}"`);
    schemaCreated = true;
    await client.query(`SET search_path TO "${schema}"`);
    const initial = await readFile(path.resolve('server/migrations/001_initial_schema.sql'), 'utf8');
    const checkpoint = await readFile(path.resolve('server/migrations/002_progression_checkpoints.sql'), 'utf8');
    await client.query(initial);

    const deviceId = randomUUID();
    const occupiedSlotId = randomUUID();
    const terminalSlotId = randomUUID();
    const deadSlotId = randomUUID();
    const emptySlotId = randomUUID();
    const sessionId = randomUUID();
    const occupiedSnapshotId = randomUUID();
    const terminalSnapshotId = randomUUID();
    const deadSnapshotId = randomUUID();
    await client.query('INSERT INTO anonymous_devices (id, token_hash) VALUES ($1, $2)', [deviceId, `hash-${deviceId}`]);
    const emptyDeviceId = randomUUID();
    await client.query('INSERT INTO anonymous_devices (id, token_hash) VALUES ($1, $2)', [emptyDeviceId, `hash-${emptyDeviceId}`]);
    for (const [slotId, slotIndex] of [[occupiedSlotId, 1], [terminalSlotId, 2], [deadSlotId, 3]] as const) {
      await client.query('INSERT INTO save_slots (id, device_id, slot_index) VALUES ($1, $2, $3)', [slotId, deviceId, slotIndex]);
    }
    await client.query('INSERT INTO save_slots (id, device_id, slot_index) VALUES ($1, $2, 1)', [emptySlotId, emptyDeviceId]);
    await client.query(
      `INSERT INTO game_sessions (id, device_id, save_slot_id, token_hash, engine_version, event_catalog_version, status)
       VALUES ($1, $2, $3, $4, 'test', 'test', 'active')`,
      [sessionId, deviceId, occupiedSlotId, `token-${sessionId}`],
    );
    for (const [snapshotId, slotId, state] of [
      [occupiedSnapshotId, occupiedSlotId, { player: { alive: true }, ending: null }],
      [terminalSnapshotId, terminalSlotId, { player: { alive: true }, ending: { id: 'ending' } }],
      [deadSnapshotId, deadSlotId, { player: { alive: false }, ending: null }],
    ] as const) {
      await client.query(
        `INSERT INTO game_snapshots (
           id, save_slot_id, session_id, slot_version, schema_version, engine_version,
           event_catalog_version, content_hash, snapshot
         ) VALUES ($1, $2, $3, 1, '3.16.0', 'test', 'test', $4, $5::jsonb)`,
        [snapshotId, slotId, sessionId, `hash-${snapshotId}`, JSON.stringify({ state })],
      );
      await client.query('UPDATE save_slots SET current_snapshot_id = $1 WHERE id = $2', [snapshotId, slotId]);
    }
    const originalSnapshots = await client.query(
      'SELECT id, snapshot, content_hash FROM game_snapshots ORDER BY id',
    );
    await client.query("INSERT INTO schema_migrations (version) VALUES ('001_initial_schema')");
    client.release();
    await isolatedPool.end();
    clientReleased = true;

    const isolatedUrl = new URL(databaseUrl);
    isolatedUrl.searchParams.set('options', `-c search_path=${schema}`);
    const firstApplication = await runMigrations(isolatedUrl.toString());
    const secondApplication = await runMigrations(isolatedUrl.toString());
    await closePool();
    assert(firstApplication.includes('002_progression_checkpoints'), 'migration runner applies checkpoint migration in isolated schema');
    assert(secondApplication.length === 0, 'migration runner repeat applies nothing in isolated schema');

    const verifyPool = new Pool({ connectionString: databaseUrl });
    const verify = await verifyPool.connect();
    await verify.query(`SET search_path TO "${schema}"`);
    const rows = await verify.query<{ save_slot_id: string; snapshot_id: string; checkpoint_state: string }>(
      'SELECT save_slot_id, snapshot_id, checkpoint_state FROM save_slot_progression_checkpoints ORDER BY save_slot_id',
    );
    const bySlot = new Map(rows.rows.map(row => [row.save_slot_id, row.checkpoint_state]));
    assert(bySlot.get(occupiedSlotId) === 'legacy_unknown', 'occupied nonterminal snapshot backfills as legacy_unknown');
    assert(bySlot.get(terminalSlotId) === 'clear', 'terminal snapshot backfills as clear');
    assert(bySlot.get(deadSlotId) === 'clear', 'dead player snapshot backfills as clear without ending');
    assert(!bySlot.has(emptySlotId), 'empty slot has no checkpoint row');
    assert(rows.rowCount === 3, 'migration creates one checkpoint for each occupied slot');
    const crossSlot = await verify.query(
      `UPDATE save_slot_progression_checkpoints SET snapshot_id = $1 WHERE save_slot_id = $2`,
      [terminalSnapshotId, occupiedSlotId],
    ).then(() => false, () => true);
    assert(crossSlot, 'composite foreign key rejects a snapshot owned by another slot');
    const nonObjectPayload = await verify.query(
      `UPDATE save_slot_progression_checkpoints SET payload = '[]'::jsonb WHERE save_slot_id = $1`,
      [occupiedSlotId],
    ).then(() => false, () => true);
    assert(nonObjectPayload, 'payload JSONB constraint rejects non-object values');
    const snapshotsAfter = await verify.query('SELECT id, snapshot, content_hash FROM game_snapshots ORDER BY id');
    assert(JSON.stringify(snapshotsAfter.rows) === JSON.stringify(originalSnapshots.rows), 'migration preserves snapshot JSON and content hashes');
    await verify.query('RESET search_path');
    verify.release();
    await verifyPool.end();
  } finally {
    if (schemaCreated) {
      const cleanup = new Pool({ connectionString: databaseUrl });
      await cleanup.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`).catch(() => undefined);
      await cleanup.end();
    }
    if (!clientReleased) client.release();
    await isolatedPool.end().catch(() => undefined);
  }
}

export async function runMigrationTests(databaseUrl: string): Promise<void> {
  await runCheckpointMigrationIsolationTest(databaseUrl);
  await runMigrations(databaseUrl);
  const second = await runMigrations(databaseUrl);
  assert(second.length === 0, 'second run applies nothing');
  const pool = getPool(databaseUrl);
  const result = await pool.query('SELECT version FROM schema_migrations');
  assert(result.rowCount! >= 1, 'migration row recorded');
  const checkpointTable = await pool.query<{ exists: string | null }>(
    "SELECT to_regclass('save_slot_progression_checkpoints') AS exists",
  );
  assert(checkpointTable.rows[0]?.exists !== null, 'progression checkpoint migration creates its table');
  const checkpointMigration = await pool.query<{ version: string }>(
    "SELECT version FROM schema_migrations WHERE version = '002_progression_checkpoints'",
  );
  assert(checkpointMigration.rowCount === 1, 'progression checkpoint migration is recorded');
  await closePool();
}
