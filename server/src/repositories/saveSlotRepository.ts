import type { Queryable } from '../db/pool.js';
import { newId } from '../util/ids.js';

export interface SaveSlotRow {
  id: string;
  device_id: string;
  slot_index: number;
  label: string;
  current_snapshot_id: string | null;
  version: number;
  created_at: Date;
  updated_at: Date;
}

export async function ensureDeviceSlots(db: Queryable, deviceId: string): Promise<SaveSlotRow[]> {
  const existing = await db.query<SaveSlotRow>(
    'SELECT * FROM save_slots WHERE device_id = $1 ORDER BY slot_index',
    [deviceId],
  );
  if (existing.rows.length === 3) return existing.rows;
  const indexes = [1, 2, 3];
  for (const slotIndex of indexes) {
    const found = existing.rows.find(row => row.slot_index === slotIndex);
    if (!found) {
      await db.query(
        `INSERT INTO save_slots (id, device_id, slot_index, label, version)
         VALUES ($1, $2, $3, $4, 0)`,
        [newId(), deviceId, slotIndex, `存档 ${slotIndex}`],
      );
    }
  }
  const refreshed = await db.query<SaveSlotRow>(
    'SELECT * FROM save_slots WHERE device_id = $1 ORDER BY slot_index',
    [deviceId],
  );
  return refreshed.rows;
}

export async function getSlotByDeviceAndIndex(
  db: Queryable,
  deviceId: string,
  slotIndex: number,
): Promise<SaveSlotRow | null> {
  const result = await db.query<SaveSlotRow>(
    'SELECT * FROM save_slots WHERE device_id = $1 AND slot_index = $2',
    [deviceId, slotIndex],
  );
  return result.rows[0] ?? null;
}

export async function updateSlotPointer(
  db: Queryable,
  slotId: string,
  expectedVersion: number,
  snapshotId: string,
): Promise<SaveSlotRow | null> {
  const result = await db.query<SaveSlotRow>(
    `UPDATE save_slots
     SET current_snapshot_id = $3, version = version + 1, updated_at = NOW()
     WHERE id = $1 AND version = $2
     RETURNING *`,
    [slotId, expectedVersion, snapshotId],
  );
  return result.rows[0] ?? null;
}

export async function clearSlot(
  db: Queryable,
  slotId: string,
): Promise<void> {
  await db.query(
    `UPDATE save_slots
     SET current_snapshot_id = NULL, version = 0, updated_at = NOW()
     WHERE id = $1`,
    [slotId],
  );
}
