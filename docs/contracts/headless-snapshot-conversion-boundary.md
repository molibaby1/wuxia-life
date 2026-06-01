# Headless Snapshot Conversion Boundary (P5 US-010)

## Responsibilities

- **Runtime state:** `GameState` in `src/types/eventTypes.ts` (may include derived `statistics`, Vue-held proxies in Web path).
- **Transport state:** `GameStateSnapshot` in `src/contracts/gameStateSnapshot.ts` (plain JSON, versioned metadata).

`DefaultSnapshotConverter` in `src/headless/snapshot/SnapshotConverter.ts` implements both directions.

## Field treatment

| Class | Fields | Rule |
| --- | --- | --- |
| Persisted | `player` core, `flags`, `relations`, `eventHistory`, `routeStates`, `routeHistory`, `lifePath`, `identity`, `karma`, `criticalChoices`, `inventory`, `ending`, time/save metadata | Round-trip required |
| Derived | `statistics`, life memory summary | Omit from snapshot; recompute on read |
| Volatile | `currentEvent`, `availableChoices`, UI feedback | Never serialized |
| Deprecated | `player.events`, `player.items`, legacy `triggeredEvents` | Map to canonical fields on read; omit on write when possible |
| Forbidden | Volatile session keys inside `state` payload | `fromSnapshot` rejects |

## Errors

| Code | When |
| --- | --- |
| `MISSING_PLAYER` | Serialize without `player.name` |
| `SNAPSHOT_INVALID` | Hydrate without required player |
| `SNAPSHOT_FORBIDDEN_FIELD` | Volatile keys present in `state` |

## Catalog version

`metadata.eventCatalogVersion` is required on serialize; hydrate validates via catalog read service.
