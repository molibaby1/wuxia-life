# Future Database Model Boundary (P4 US-019)

Conceptual persistence models for future backend planning. No ORM, driver, or server in P4.

## 1. Collections / Tables

| Entity | Primary id | Purpose |
| --- | --- | --- |
| `users` | `userId` | Account identity (future) |
| `save_slots` | `slotId` | Named save slot per user/device |
| `game_snapshots` | `snapshotId` | Canonical `GameStateSnapshot` blob |
| `replay_logs` | `replayLogId` | Audit/replay log linked to life |
| `event_catalog_versions` | `catalogVersion` | Immutable event bundle metadata |
| `migration_records` | `migrationId` | Applied save migration audit |

## 2. Relationships

- `users` 1—N `save_slots`
- `save_slots` 1—1 current `game_snapshots` (historical versions optional)
- `save_slots` 0—1 `replay_logs` (or 1—N if chunked)
- `game_snapshots` N—1 `event_catalog_versions` (pinned at save time)
- `migration_records` N—1 `game_snapshots` or source blob id

## 3. Canonical vs Derived

| Canonical | Derived (do not store as source of truth) |
| --- | --- |
| `GameStateSnapshot.state` | `LifeMemorySummary` |
| Replay choice/auto entries | UI session state |
| Catalog version metadata | Event inventory QA counts |
| Migration audit rows | Player-facing feedback text cache |

## 4. Forbidden Storage

- Vue reactive proxies or functions
- Volatile engine counters not defined in snapshot contract
- Raw debug console buffers
- Full undeclared event catalog in every snapshot row
- Client-only trust fields (unverified deltas)

## 5. Non-Goals

- No database driver, ORM, migration file, or server
