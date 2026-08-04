#!/usr/bin/env tsx
import * as fs from 'node:fs';
import * as path from 'node:path';
import pg from 'pg';
import { ensureDeviceSlots, updateSlotPointer } from '../../server/src/repositories/saveSlotRepository';
import { insertSnapshot } from '../../server/src/repositories/snapshotRepository';
import type { GameStateSnapshot } from '../../src/contracts/gameStateSnapshot';
import type { LateLifeCheckpointManifest } from './lateLifeBaselineTypes';

const { Client } = pg;
const root = process.cwd();
const manifestPath = path.join(root, '.tmp/late-life-active-action-baseline/checkpoints/manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as LateLifeCheckpointManifest;
const checkpointId = process.argv[2];
if (!checkpointId) throw new Error('usage: tsx installLateLifeApiFixture.ts <checkpoint-id>');
const entry = manifest.checkpoints.find(item => item.id === checkpointId);
if (!entry) throw new Error(`unknown checkpoint ${checkpointId}`);

const client = new Client({ connectionString: process.env.DATABASE_URL ?? 'postgres://wuxia:wuxia@localhost:5532/wuxia_p6b' });
await client.connect();
try {
  const deviceResult = await client.query<{ id: string }>(
    'SELECT id FROM anonymous_devices ORDER BY created_at DESC LIMIT 1',
  );
  const deviceId = deviceResult.rows[0]?.id;
  if (!deviceId) throw new Error('no anonymous device; create a Browser API session first');
  const slots = await ensureDeviceSlots(client, deviceId);
  const slot = slots.find(item => item.slot_index === 1);
  if (!slot) throw new Error('slot 1 not found');
  const sessionResult = await client.query<{ id: string }>(
    'SELECT id FROM game_sessions WHERE device_id = $1 AND save_slot_id = $2 ORDER BY created_at DESC LIMIT 1',
    [deviceId, slot.id],
  );
  const sessionId = sessionResult.rows[0]?.id;
  if (!sessionId) throw new Error('no API session for latest Browser device');
  const snapshot = JSON.parse(fs.readFileSync(path.join(root, entry.snapshotPath), 'utf8')) as GameStateSnapshot;
  const catalogResult = await client.query<{ catalog_version: string }>(
    "SELECT catalog_version FROM event_catalog_versions WHERE status = 'active' ORDER BY catalog_version DESC LIMIT 1",
  );
  const activeCatalogVersion = catalogResult.rows[0]?.catalog_version;
  if (!activeCatalogVersion) throw new Error('no active event catalog version');
  snapshot.metadata.sourcePlatform = 'web-browser';
  snapshot.metadata.engineVersion = 'p6b-headless';
  snapshot.metadata.eventCatalogVersion = activeCatalogVersion;
  const inserted = await insertSnapshot(client, {
    saveSlotId: slot.id,
    sessionId,
    slotVersion: slot.version + 1,
    snapshot,
    engineVersion: 'p6b-headless',
    eventCatalogVersion: activeCatalogVersion,
  });
  const updated = await updateSlotPointer(client, slot.id, slot.version, inserted.id);
  if (!updated) throw new Error(`slot version changed while installing ${entry.id}`);
  const logPath = path.join(root, '.tmp/late-life-active-action-baseline/api-fixture-log.jsonl');
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  fs.appendFileSync(logPath, `${JSON.stringify({ checkpointId: entry.id, snapshotId: inserted.id, slotVersion: updated.version, deviceId, sessionId, installedAt: new Date().toISOString() })}\n`);
  console.log(JSON.stringify({ checkpointId: entry.id, snapshotId: inserted.id, slotVersion: updated.version }));
} finally {
  await client.end();
}
