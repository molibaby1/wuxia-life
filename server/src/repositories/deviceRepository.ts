import type { Queryable } from '../db/pool.js';
import { newId } from '../util/ids.js';

export interface AnonymousDeviceRow {
  id: string;
  token_hash: string;
  created_at: Date;
  updated_at: Date;
}

export async function findDeviceByTokenHash(
  db: Queryable,
  tokenHash: string,
): Promise<AnonymousDeviceRow | null> {
  const result = await db.query<AnonymousDeviceRow>(
    'SELECT * FROM anonymous_devices WHERE token_hash = $1',
    [tokenHash],
  );
  return result.rows[0] ?? null;
}

export async function insertDevice(db: Queryable, tokenHash: string): Promise<AnonymousDeviceRow> {
  const id = newId();
  const result = await db.query<AnonymousDeviceRow>(
    `INSERT INTO anonymous_devices (id, token_hash)
     VALUES ($1, $2)
     RETURNING *`,
    [id, tokenHash],
  );
  return result.rows[0]!;
}
