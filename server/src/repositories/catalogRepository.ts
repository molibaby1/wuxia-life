import type { EventBundleResponse } from '../../../src/contracts/eventCatalog.js';
import type { Queryable } from '../db/pool.js';
import { ApiError } from '../errors/apiError.js';

export interface CatalogVersionRow {
  catalog_version: string;
  content_hash: string;
  status: string;
  metadata: Record<string, unknown>;
  bundle: EventBundleResponse;
  created_at: Date;
}

export async function getCatalogByVersion(
  db: Queryable,
  version: string,
): Promise<CatalogVersionRow | null> {
  const result = await db.query<CatalogVersionRow>(
    'SELECT * FROM event_catalog_versions WHERE catalog_version = $1',
    [version],
  );
  const row = result.rows[0];
  if (!row) return null;
  if (typeof row.bundle === 'string') {
    row.bundle = JSON.parse(row.bundle) as EventBundleResponse;
  }
  if (typeof row.metadata === 'string') {
    row.metadata = JSON.parse(row.metadata) as Record<string, unknown>;
  }
  return row;
}

export async function upsertCatalogVersion(
  db: Queryable,
  params: {
    catalogVersion: string;
    contentHash: string;
    status: string;
    metadata: Record<string, unknown>;
    bundle: EventBundleResponse;
  },
): Promise<string> {
  const existing = await getCatalogByVersion(db, params.catalogVersion);
  if (existing && existing.content_hash !== params.contentHash) {
    throw new ApiError(
      409,
      'VALIDATION_ERROR',
      'Catalog version content hash cannot change',
      { catalogVersion: params.catalogVersion },
    );
  }
  await db.query(
    `INSERT INTO event_catalog_versions (catalog_version, content_hash, status, metadata, bundle)
     VALUES ($1,$2,$3,$4::jsonb,$5::jsonb)
     ON CONFLICT (catalog_version) DO NOTHING`,
    [
      params.catalogVersion,
      params.contentHash,
      params.status,
      JSON.stringify(params.metadata),
      JSON.stringify(params.bundle),
    ],
  );
  return params.catalogVersion;
}

export function incrementPatchVersion(version: string): string {
  const parts = version.split('.');
  if (parts.length !== 3 || parts.some(p => !/^\d+$/.test(p))) {
    return `${version}-1`;
  }
  const [major, minor, patch] = parts.map(Number);
  return `${major}.${minor}.${patch + 1}`;
}
