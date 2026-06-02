# P6B Automatic Save Policy (US-020)

## When the Server Persists

- **New game**: initial immutable snapshot, slot pointer, and `session_created` replay row in the same transaction as session creation.
- **Choice execution**: after successful choice and automatic progression chain, new snapshot + replay rows + slot version increment atomically.
- **Terminal state**: session status set to `terminal` with `terminal` replay action.
- **Manual save**: explicit `POST /v1/sessions/{id}/save` when server state hash differs from slot snapshot.

## When the Server Does Not Persist

- Failed or rejected choices (validation errors, stale version conflicts).
- Authentication failures.
- UI-only pacing delays, animations, or auto-play timers on the Web client.

## Client Responsibility

The Web client must send `expectedSlotVersion` and `expectedSnapshotId` on mutating calls. On HTTP `409`, stop submitting further mutations and prompt the player to reload the current save list.
