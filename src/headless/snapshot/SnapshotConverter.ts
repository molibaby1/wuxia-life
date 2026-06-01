/**
 * Snapshot conversion boundary (P5 US-010 / US-011).
 */

import type { GameStateSnapshot, GameStateSnapshotMetadata } from '../../contracts/gameStateSnapshot';
import { GAME_STATE_SNAPSHOT_SCHEMA_VERSION } from '../../contracts/gameStateSnapshot';
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

const FORBIDDEN_TOP_LEVEL = ['statistics', 'currentEvent', 'availableChoices'] as const;

export class DefaultSnapshotConverter implements SnapshotConverter {
  toSnapshot(
    state: GameState,
    options: {
      eventCatalogVersion: string;
      sourcePlatform: GameStateSnapshotMetadata['sourcePlatform'];
      time: TimeSource;
    },
  ): GameStateSnapshot {
    if (!state.player?.name) {
      throw new SnapshotConversionError('MISSING_PLAYER', 'Cannot serialize snapshot without player');
    }
    const now = options.time.now();
    const {
      player,
      flags,
      eventHistory,
      relations,
      routeStates,
      routeHistory,
      lifePath,
      identity,
      karma,
      criticalChoices,
      achievements,
      inventory,
      ending,
      currentTime,
      saveVersion,
      lastSavedAt,
      gameTimestamp,
    } = state;
    const { flags: playerFlags, events: _legacyEvents, items: _legacyItems, ...playerCore } = player;

    return {
      metadata: {
        schemaVersion: GAME_STATE_SNAPSHOT_SCHEMA_VERSION,
        engineVersion: 'p5-headless',
        eventCatalogVersion: options.eventCatalogVersion,
        createdAt: state.lastSavedAt ?? now,
        updatedAt: now,
        sourcePlatform: options.sourcePlatform,
        saveVersion: state.saveVersion,
      },
      state: {
        player: {
          ...playerCore,
          flags: playerFlags,
        },
        flags: { ...flags, ...(playerFlags ?? {}) },
        relations,
        eventHistory: [...(eventHistory ?? [])],
        currentTime,
        routeStates,
        routeHistory,
        lifePath,
        identity,
        karma,
        criticalChoices,
        achievements,
        inventory,
        ending,
        saveVersion,
        lastSavedAt,
        gameTimestamp,
      },
    };
  }

  fromSnapshot(snapshot: GameStateSnapshot): GameState {
    for (const key of FORBIDDEN_TOP_LEVEL) {
      if (key in (snapshot.state as Record<string, unknown>)) {
        throw new SnapshotConversionError(
          'SNAPSHOT_FORBIDDEN_FIELD',
          `Forbidden snapshot field: ${key}`,
        );
      }
    }
    const { player, flags, ...rest } = snapshot.state;
    if (!player?.name) {
      throw new SnapshotConversionError('SNAPSHOT_INVALID', 'Snapshot missing player.name');
    }
    const mergedFlags = { ...flags, ...(player.flags ?? {}) };
    const hydrated: GameState = {
      ...(rest as Omit<GameState, 'player' | 'flags'>),
      player: {
        ...player,
        flags: mergedFlags,
      } as GameState['player'],
      flags: mergedFlags,
      saveVersion: snapshot.metadata.saveVersion ?? snapshot.state.saveVersion,
      lastSavedAt: snapshot.metadata.updatedAt,
      gameTimestamp: snapshot.metadata.updatedAt,
    };
    return hydrated;
  }
}

export const defaultSnapshotConverter = new DefaultSnapshotConverter();
