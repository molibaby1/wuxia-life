import type { Queryable } from '../db/pool.js';
import { newId } from '../util/ids.js';

export type SessionStatus = 'active' | 'terminal' | 'revoked';

export interface GameSessionRow {
  id: string;
  device_id: string;
  save_slot_id: string | null;
  token_hash: string;
  engine_version: string;
  event_catalog_version: string;
  status: SessionStatus;
  created_at: Date;
  updated_at: Date;
}

export async function insertSession(
  db: Queryable,
  params: {
    deviceId: string;
    saveSlotId: string;
    tokenHash: string;
    engineVersion: string;
    eventCatalogVersion: string;
    status?: SessionStatus;
  },
): Promise<GameSessionRow> {
  const id = newId();
  const result = await db.query<GameSessionRow>(
    `INSERT INTO game_sessions (
      id, device_id, save_slot_id, token_hash,
      engine_version, event_catalog_version, status
    ) VALUES ($1,$2,$3,$4,$5,$6,$7)
    RETURNING *`,
    [
      id,
      params.deviceId,
      params.saveSlotId,
      params.tokenHash,
      params.engineVersion,
      params.eventCatalogVersion,
      params.status ?? 'active',
    ],
  );
  return result.rows[0]!;
}

export async function getSessionById(db: Queryable, sessionId: string): Promise<GameSessionRow | null> {
  const result = await db.query<GameSessionRow>(
    'SELECT * FROM game_sessions WHERE id = $1',
    [sessionId],
  );
  return result.rows[0] ?? null;
}

export async function findSessionByTokenHash(
  db: Queryable,
  tokenHash: string,
): Promise<GameSessionRow | null> {
  const result = await db.query<GameSessionRow>(
    'SELECT * FROM game_sessions WHERE token_hash = $1',
    [tokenHash],
  );
  return result.rows[0] ?? null;
}

export async function updateSessionStatus(
  db: Queryable,
  sessionId: string,
  status: SessionStatus,
): Promise<void> {
  await db.query(
    'UPDATE game_sessions SET status = $2, updated_at = NOW() WHERE id = $1',
    [sessionId, status],
  );
}
