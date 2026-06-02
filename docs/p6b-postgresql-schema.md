# P6B PostgreSQL Schema (US-003)

## Tables

### `schema_migrations`

| Column | Type | Notes |
| --- | --- | --- |
| `version` | `TEXT PRIMARY KEY` | Migration id e.g. `001_initial` |
| `applied_at` | `TIMESTAMPTZ NOT NULL` | Runner bookkeeping |

### `anonymous_devices`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `UUID PRIMARY KEY` | Server-generated |
| `token_hash` | `TEXT NOT NULL UNIQUE` | SHA-256 of peppered device token |
| `created_at` | `TIMESTAMPTZ NOT NULL` | |
| `updated_at` | `TIMESTAMPTZ NOT NULL` | |

### `save_slots`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `UUID PRIMARY KEY` | |
| `device_id` | `UUID NOT NULL REFERENCES anonymous_devices(id) ON DELETE CASCADE` | |
| `slot_index` | `SMALLINT NOT NULL CHECK (slot_index BETWEEN 1 AND 3)` | |
| `label` | `TEXT NOT NULL DEFAULT ''` | |
| `current_snapshot_id` | `UUID REFERENCES game_snapshots(id) ON DELETE SET NULL` | Nullable when empty |
| `version` | `INTEGER NOT NULL DEFAULT 0` | Optimistic concurrency |
| `created_at` | `TIMESTAMPTZ NOT NULL` | |
| `updated_at` | `TIMESTAMPTZ NOT NULL` | |

**Constraints**: `UNIQUE (device_id, slot_index)`.

### `game_sessions`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `UUID PRIMARY KEY` | |
| `device_id` | `UUID NOT NULL REFERENCES anonymous_devices(id) ON DELETE CASCADE` | |
| `save_slot_id` | `UUID REFERENCES save_slots(id) ON DELETE SET NULL` | |
| `token_hash` | `TEXT NOT NULL UNIQUE` | Session token hash |
| `engine_version` | `TEXT NOT NULL` | |
| `event_catalog_version` | `TEXT NOT NULL` | |
| `status` | `TEXT NOT NULL CHECK (status IN ('active','terminal','revoked'))` | |
| `created_at` | `TIMESTAMPTZ NOT NULL` | |
| `updated_at` | `TIMESTAMPTZ NOT NULL` | |

**Indexes**: `(device_id, status)`, `(save_slot_id)`.

### `game_snapshots`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `UUID PRIMARY KEY` | |
| `save_slot_id` | `UUID NOT NULL REFERENCES save_slots(id) ON DELETE CASCADE` | |
| `session_id` | `UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE` | |
| `slot_version` | `INTEGER NOT NULL` | Version at write time |
| `schema_version` | `TEXT NOT NULL` | |
| `engine_version` | `TEXT NOT NULL` | |
| `event_catalog_version` | `TEXT NOT NULL` | |
| `content_hash` | `TEXT NOT NULL` | Server-computed |
| `snapshot` | `JSONB NOT NULL` | Immutable `GameStateSnapshot` |
| `created_at` | `TIMESTAMPTZ NOT NULL` | |

**Rule**: No `UPDATE` on `snapshot` JSONB (append-only).

### `replay_actions`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `UUID PRIMARY KEY` | |
| `session_id` | `UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE` | |
| `save_slot_id` | `UUID NOT NULL REFERENCES save_slots(id) ON DELETE CASCADE` | |
| `sequence_number` | `INTEGER NOT NULL` | Monotonic per session |
| `action_type` | `TEXT NOT NULL` | See action types below |
| `event_id` | `TEXT` | |
| `choice_id` | `TEXT` | |
| `snapshot_hash_before` | `TEXT` | |
| `snapshot_hash_after` | `TEXT` | |
| `payload` | `JSONB NOT NULL DEFAULT '{}'` | |
| `created_at` | `TIMESTAMPTZ NOT NULL` | |

**Constraints**: `UNIQUE (session_id, sequence_number)`.

**Action types**: `session_created`, `session_restored`, `choice_executed`, `automatic_progression`, `manual_save`, `terminal`.

### `event_catalog_versions`

| Column | Type | Notes |
| --- | --- | --- |
| `catalog_version` | `TEXT PRIMARY KEY` | e.g. `1.0.0` |
| `content_hash` | `TEXT NOT NULL` | |
| `status` | `TEXT NOT NULL` | `active` / `deprecated` |
| `metadata` | `JSONB NOT NULL` | |
| `bundle` | `JSONB NOT NULL` | `EventBundleResponse` shape |
| `created_at` | `TIMESTAMPTZ NOT NULL` | |

**Rule**: Reject insert/update when `content_hash` would change for existing version.

## Canonical vs Non-Canonical Storage

| Stored (canonical) | Not stored as source of truth |
| --- | --- |
| `GameStateSnapshot` JSONB | `LifeMemorySummary` (derived on read via headless) |
| Replay action rows | Vue `engineState`, `isProcessing`, UI pacing timers |
| Catalog bundle for pinned version | Volatile choice feedback cache |
| Slot version + snapshot pointer | Client-submitted state deltas |

## Deletion Rules

- Deleting a device cascades slots, sessions, snapshots, and replay rows for that ownership tree.
- Snapshots are not updated in place; history remains until cascade from slot/device deletion.
