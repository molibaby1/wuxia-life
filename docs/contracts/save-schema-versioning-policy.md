# Save Schema Versioning Policy (P4 US-017)

Policy for the current strict save contract. This repository does not implement backward migrations.

## 1. Version Format

| Field | Format | Example |
| --- | --- | --- |
| `schemaVersion` | Semver (snapshot contract) | `3.11.0` |
| `saveVersion` | Optional state provenance tag | Current runtime value only; it does not widen the accepted schema |
| `engineVersion` | Package/engine semver | `0.0.0` |
| `eventCatalogVersion` | Catalog bundle semver | `1.0.0` |

## 2. Compatibility States

| State | Meaning | Action |
| --- | --- | --- |
| `readable` | Exact schema match | Load directly |
| `migratable` | Not a runtime state | External tooling must recreate a current snapshot |
| `unsupported_legacy` | Below minimum supported | Reject with upgrade message |
| `unsupported_future` | Newer than client | Reject with client update message |

## 3. Supported Range (Initial)

- Snapshot schema `3.11.0` is the only accepted contract line. `3.10.x` and earlier snapshots are rejected. `lifePath.focus` is a forbidden unknown field at both top-level and nested `stateSnapshot` boundaries. `player.lifeStates` contains exactly `trainingHabit`, `studyHabit`, and `businessHabit`; `familyBond` and `socialMomentum` are forbidden unknown keys. There is no migration, compatibility, fallback, cleaning, conversion, or history reconstruction.
- Browser and Headless persistence now use only Snapshot schema `3.11.0`. The old P2 raw `GameState` save shape is not readable and is not migrated.
- Catalog version mismatch: reject execution, allow read-only inspection when safe.

## 4. Reject Instead of Migrate

Reject when:

- Forbidden/volatile fields dominate payload
- Schema major version unsupported
- Checksum/hash integrity failure
- Migration chain incomplete or failed mid-way

## 5. Messages

| Audience | Example |
| --- | --- |
| Player | 「存档版本过旧，无法读取。」 / 「请更新客户端后再打开此存档。」 |
| Diagnostic | `SAVE_SCHEMA_UNSUPPORTED`, `SAVE_MIGRATION_FAILED`, `SAVE_FORBIDDEN_FIELDS` |

## 6. Non-Goals

- No migration implementation in P4.
- Save, autosave, import, and load all validate the canonical Snapshot before persistence or hydration. Missing or invalid required state is rejected; no fallback fills missing fields.
