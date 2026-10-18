import type { HeadlessProgressionVolatileState } from '../../../src/headless/session/sessionTypes.js';

// Non-authoritative presentation data is scoped to an exact snapshot. Settled
// summaries are always overwritten from the database checkpoint on load.
const volatileBySnapshotId = new Map<string, HeadlessProgressionVolatileState>();

export function getSnapshotVolatileState(snapshotId: string): HeadlessProgressionVolatileState | null {
  return volatileBySnapshotId.get(snapshotId) ?? null;
}

export function setSnapshotVolatileState(
  snapshotId: string,
  state: HeadlessProgressionVolatileState,
): void {
  volatileBySnapshotId.set(snapshotId, state);
}

export function clearSnapshotVolatileState(snapshotId: string): void {
  volatileBySnapshotId.delete(snapshotId);
}
