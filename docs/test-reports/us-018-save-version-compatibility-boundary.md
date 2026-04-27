# US-018 Save Version and Compatibility Boundary

## Goal

Define a P2 save version strategy that prevents silent corruption when loading legacy or future-incompatible saves.

## Decisions

- P2 save schema marker: `saveVersion = "2.0.0-p2"` (written on every `saveGame` / `autoSave`).
- Readable legacy range in P2: `1.0.0` to `2.x`.
- Unsupported save behavior:
  - Missing `saveVersion` -> reject load.
  - Legacy below `1.0.0` -> reject load.
  - Future major above `2` -> reject load.
  - Rejection behavior is fail-close: return `null` and log compatibility warning.
- Full historical migration is explicitly out of scope for P2.

## Implementation notes

- Added compatibility contract in `src/core/SaveManager.ts`:
  - `P2_SAVE_SCHEMA_VERSION`
  - `P2_MIN_READABLE_SAVE_VERSION`
  - `P2_MAX_READABLE_SAVE_VERSION`
  - `evaluateSaveCompatibility(...)`
- Added normalized save stamping path:
  - `applyP2SaveVersionMarker(...)` writes `saveVersion`, `lastSavedAt`, `gameTimestamp`.
- Enforced compatibility check on read paths:
  - `loadGame(...)`
  - `loadAutoSave(...)`

## Verification

- `tests/AllTests.ts`
  - `兼容性测试 - P2 存档版本标记写入`
  - `兼容性测试 - P2 可读版本边界`
