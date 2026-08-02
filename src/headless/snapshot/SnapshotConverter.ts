/**
 * Snapshot conversion boundary (P5 US-010 / US-011).
 */

import type { GameStateSnapshot, GameStateSnapshotMetadata } from '../../contracts/gameStateSnapshot';
import { GAME_STATE_SNAPSHOT_SCHEMA_VERSION } from '../../contracts/gameStateSnapshot';
import {
  assertCanonicalGameState,
  assertCanonicalSnapshot,
  CanonicalValidationError,
  cloneCanonicalJsonValue,
  CANONICAL_SNAPSHOT_PLAYER_KEYS,
  CANONICAL_SNAPSHOT_STATE_KEYS,
} from '../../contracts/validation/canonicalGameStateValidation';
import type { GameState } from '../../types/eventTypes';
import type { TimeSource } from '../adapters/timeSource';

export type SnapshotConversionErrorCode =
  | 'SNAPSHOT_INVALID'
  | 'SNAPSHOT_FORBIDDEN_FIELD'
  | 'MISSING_PLAYER';

export class SnapshotConversionError extends Error {
  constructor(
    readonly code: SnapshotConversionErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'SnapshotConversionError';
  }
}

export interface SnapshotConverter {
  toSnapshot(
    state: GameState,
    options: {
      eventCatalogVersion: string;
      sourcePlatform: GameStateSnapshotMetadata['sourcePlatform'];
      time: TimeSource;
    },
  ): GameStateSnapshot;
  fromSnapshot(snapshot: GameStateSnapshot): GameState;
}

function assertBoundary(value: unknown, kind: 'state' | 'snapshot'): void {
  try {
    if (kind === 'state') assertCanonicalGameState(value);
    else assertCanonicalSnapshot(value);
  } catch (error) {
    if (error instanceof CanonicalValidationError) {
      const forbidden = error.issues.some(issue => issue.code === 'forbidden');
      throw new SnapshotConversionError(forbidden ? 'SNAPSHOT_FORBIDDEN_FIELD' : 'SNAPSHOT_INVALID', error.message);
    }
    throw error;
  }
}

function pickAllowed(source: Record<string, unknown>, keys: readonly string[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(source, key)) result[key] = source[key];
  }
  return result;
}

export class DefaultSnapshotConverter implements SnapshotConverter {
  toSnapshot(
    state: GameState,
    options: {
      eventCatalogVersion: string;
      sourcePlatform: GameStateSnapshotMetadata['sourcePlatform'];
      time: TimeSource;
    },
  ): GameStateSnapshot {
    assertBoundary(state, 'state');
    const now = options.time.now();
    const player = cloneCanonicalJsonValue(pickAllowed(state.player as unknown as Record<string, unknown>, CANONICAL_SNAPSHOT_PLAYER_KEYS));
    const snapshotState = cloneCanonicalJsonValue(pickAllowed(state as unknown as Record<string, unknown>, CANONICAL_SNAPSHOT_STATE_KEYS));
    snapshotState.player = player;
    snapshotState.facts = cloneCanonicalJsonValue(state.facts);
    snapshotState.flags = cloneCanonicalJsonValue(state.flags);
    snapshotState.relations = cloneCanonicalJsonValue(state.relations);
    snapshotState.eventHistory = cloneCanonicalJsonValue(state.eventHistory);
    const snapshot: GameStateSnapshot = {
      metadata: {
        schemaVersion: GAME_STATE_SNAPSHOT_SCHEMA_VERSION,
        engineVersion: 'p5-headless',
        eventCatalogVersion: options.eventCatalogVersion,
        createdAt: state.lastSavedAt ?? now,
        updatedAt: now,
        sourcePlatform: options.sourcePlatform,
      },
      state: {
        ...snapshotState,
        player: player as unknown as GameStateSnapshot['state']['player'],
        facts: cloneCanonicalJsonValue(state.facts),
        flags: cloneCanonicalJsonValue(state.flags),
        relations: cloneCanonicalJsonValue(state.relations),
        eventHistory: cloneCanonicalJsonValue(state.eventHistory),
      } as GameStateSnapshot['state'],
    };
    assertBoundary(snapshot, 'snapshot');
    return snapshot;
  }

  fromSnapshot(snapshot: GameStateSnapshot): GameState {
    assertBoundary(snapshot, 'snapshot');
    const state = cloneCanonicalJsonValue(pickAllowed(snapshot.state as unknown as Record<string, unknown>, CANONICAL_SNAPSHOT_STATE_KEYS));
    const sourcePlayer = snapshot.state.player as unknown as Record<string, unknown>;
    const player = cloneCanonicalJsonValue(pickAllowed(sourcePlayer, CANONICAL_SNAPSHOT_PLAYER_KEYS));
    state.player = player;
    const hydrated: GameState = {
      player: player as unknown as GameState['player'],
      facts: state.facts as GameState['facts'],
      flags: state.flags as GameState['flags'],
      relations: state.relations as GameState['relations'],
      eventHistory: state.eventHistory as GameState['eventHistory'],
    };
    Object.assign(hydrated, state);
    assertBoundary(hydrated, 'state');
    return hydrated;
  }
}

export const defaultSnapshotConverter = new DefaultSnapshotConverter();
