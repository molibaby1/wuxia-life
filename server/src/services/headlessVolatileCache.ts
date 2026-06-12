import type { HeadlessProgressionVolatileState } from '../../../src/headless/session/sessionTypes.js';

const volatileBySessionId = new Map<string, HeadlessProgressionVolatileState>();
const volatileBySnapshotId = new Map<string, HeadlessProgressionVolatileState>();

export function getSessionVolatileState(sessionId: string): HeadlessProgressionVolatileState | null {
  return volatileBySessionId.get(sessionId) ?? null;
}

export function getSnapshotVolatileState(snapshotId: string): HeadlessProgressionVolatileState | null {
  return volatileBySnapshotId.get(snapshotId) ?? null;
}

export function resolveVolatileState(
  sessionId: string,
  snapshotId: string,
): HeadlessProgressionVolatileState | null {
  return getSessionVolatileState(sessionId) ?? getSnapshotVolatileState(snapshotId);
}

export function setSessionVolatileState(
  sessionId: string,
  snapshotId: string,
  state: HeadlessProgressionVolatileState,
): void {
  volatileBySessionId.set(sessionId, state);
  volatileBySnapshotId.set(snapshotId, state);
}

export function clearSessionVolatileState(sessionId: string, snapshotId?: string): void {
  volatileBySessionId.delete(sessionId);
  if (snapshotId) {
    volatileBySnapshotId.delete(snapshotId);
  }
}
