# Save Schema Versioning Policy (P4 US-017)

Policy for future persisted save compatibility without implementing migrations in P4.

## 1. Version Format

| Field | Format | Example |
| --- | --- | --- |
| `schemaVersion` | Semver (snapshot contract) | `3.1.0` |
| `saveVersion` | Client save payload tag | `2.0.0-p2` |
| `engineVersion` | Package/engine semver | `0.0.0` |
| `eventCatalogVersion` | Catalog bundle semver | `1.0.0` |

## 2. Compatibility States

| State | Meaning | Action |
| --- | --- | --- |
| `readable` | Exact schema match | Load directly |
| `migratable` | Within supported backward range | Run ordered migrations |
| `unsupported_legacy` | Below minimum supported | Reject with upgrade message |
| `unsupported_future` | Newer than client | Reject with client update message |

## 3. Supported Range (Initial)

- Snapshot schema `3.1.x` readable without migration.
- Client save `2.0.0-p2` remains a separate client save tag; it does not provide a migration path for the incompatible snapshot shape.
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
- No save behavior changes.
