# Save Migration Strategy (P4 US-018)

Strategy for future save schema migrations. No migration files are added in P4.

## 1. Naming and Ordering

- Migration id: `migrate_<from>_to_<to>` (e.g. `migrate_1_0_0_to_1_1_0`)
- Ordered chain per major schema line; no branching shortcuts
- Each migration is idempotent on already-migrated payloads

## 2. Allowed Operations

- Rename fields with explicit mapping
- Add optional fields with defaults
- Split/merge nested objects with documented transforms
- Strip forbidden/volatile fields
- Bump metadata version fields

## 3. Forbidden Shortcuts

- Blind deep merge of unknown client payloads
- Skipping intermediate migrations
- Persisting derived fields as canonical
- Silent discard of unrecognized persisted fields without audit log

## 4. Rollback Expectations

- Failed migration must not overwrite original blob
- Return diagnostic error with migration step id
- Partial writes forbidden; atomic replace only

## 5. Fixture Requirements (Future)

Each migration must ship:

- Pre-migration fixture (minimal + representative)
- Post-migration expected fixture
- Round-trip test through full chain from oldest supported version

## 6. Non-Goals

- No database implementation
- No migration files in P4
