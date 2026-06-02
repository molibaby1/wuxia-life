import type { GameStateSnapshot } from '../../../src/contracts/gameStateSnapshot.js';
import { validateGameStateSnapshot } from '../../../src/contracts/validation/contractValidation.js';
import { computeContentHash } from '../crypto/tokens.js';
import type { Queryable } from '../db/pool.js';
import { ApiError, validationError } from '../errors/apiError.js';
import { newId } from '../util/ids.js';

export interface GameSnapshotRow {
  id: string;
  save_slot_id: string;
  session_id: string;
  slot_version: number;
  schema_version: string;
  engine_version: string;
  event_catalog_version: string;
  content_hash: string;
  snapshot: GameStateSnapshot;
  created_at: Date;
}

export function canonicalSnapshotStateJson(snapshot: GameStateSnapshot): string {
  return JSON.stringify(snapshot.state);
}

export function buildSnapshotIntegrity(snapshot: GameStateSnapshot): {
  contentHash: string;
  schemaVersion: string;
  engineVersion: string;
  eventCatalogVersion: string;
} {
  const validated = validateGameStateSnapshot(snapshot);
  if (validated.ok === false) {
    throw validationError('Invalid snapshot contract', { errors: validated.errors });
  }
  const value = validated.value;
  return {
    contentHash: computeContentHash(canonicalSnapshotStateJson(value)),
    schemaVersion: value.metadata.schemaVersion,
    engineVersion: value.metadata.engineVersion,
    eventCatalogVersion: value.metadata.eventCatalogVersion,
  };
}

export async function insertSnapshot(
  db: Queryable,
  params: {
    saveSlotId: string;
    sessionId: string;
    slotVersion: number;
    snapshot: GameStateSnapshot;
    engineVersion: string;
    eventCatalogVersion: string;
  },
): Promise<GameSnapshotRow> {
  const canonical: GameStateSnapshot = {
    ...params.snapshot,
    metadata: {
      ...params.snapshot.metadata,
      engineVersion: params.engineVersion,
      eventCatalogVersion: params.eventCatalogVersion,
    },
  };
  const integrity = buildSnapshotIntegrity(canonical);
  const id = newId();
  const result = await db.query<GameSnapshotRow>(
    `INSERT INTO game_snapshots (
      id, save_slot_id, session_id, slot_version,
      schema_version, engine_version, event_catalog_version,
      content_hash, snapshot
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb)
    RETURNING *`,
    [
      id,
      params.saveSlotId,
      params.sessionId,
      params.slotVersion,
      integrity.schemaVersion,
      params.engineVersion,
      params.eventCatalogVersion,
      integrity.contentHash,
      JSON.stringify(canonical),
    ],
  );
  return result.rows[0]!;
}

export async function getSnapshotById(
  db: Queryable,
  snapshotId: string,
): Promise<GameSnapshotRow | null> {
  const result = await db.query<GameSnapshotRow>(
    'SELECT * FROM game_snapshots WHERE id = $1',
    [snapshotId],
  );
  const row = result.rows[0];
  if (!row) return null;
  if (typeof row.snapshot === 'string') {
    row.snapshot = JSON.parse(row.snapshot) as GameStateSnapshot;
  }
  return row;
}

export function assertSnapshotCompatibility(
  snapshot: GameSnapshotRow,
  engineVersion: string,
  catalogVersion: string,
): void {
  if (snapshot.engine_version !== engineVersion) {
    throw new ApiError(422, 'ENGINE_VERSION_UNSUPPORTED', 'Snapshot engine version mismatch', {
      expected: engineVersion,
      actual: snapshot.engine_version,
    });
  }
  if (snapshot.event_catalog_version !== catalogVersion) {
    throw new ApiError(422, 'CATALOG_VERSION_UNSUPPORTED', 'Snapshot catalog version mismatch', {
      expected: catalogVersion,
      actual: snapshot.event_catalog_version,
    });
  }
}
