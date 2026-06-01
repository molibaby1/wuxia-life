/**
 * Replay log contract types (P4 US-012).
 *
 * @see docs/contracts/replay-log-contract.md
 */

import type { SourcePlatform, SnapshotCurrentTime } from './gameStateSnapshot';

export const REPLAY_LOG_VERSION = '1.0.0' as const;

export type ReplayActionType = 'choice' | 'auto_event' | 'save_load' | 'terminal';

export interface ReplayLogMetadata {
  replayVersion: typeof REPLAY_LOG_VERSION;
  engineVersion: string;
  eventCatalogVersion: string;
  initialSeed: string | number;
  startSnapshotHash: string;
  platform: SourcePlatform;
  createdAt: number;
  lifeId?: string;
}

export interface ReplayLogEntryBase {
  sequence: number;
  actionType: ReplayActionType;
  age: number;
  timestamp: SnapshotCurrentTime;
  snapshotHashBefore: string;
  snapshotHashAfter: string;
  eventId?: string;
  choiceId?: string;
  outcomeId?: string;
  randomDrawIndex?: number;
}

export interface ReplayChoiceEntry extends ReplayLogEntryBase {
  actionType: 'choice';
  eventId: string;
  choiceId: string;
}

export interface ReplayAutoEventEntry extends ReplayLogEntryBase {
  actionType: 'auto_event';
  eventId: string;
}

export interface ReplaySaveLoadEntry extends ReplayLogEntryBase {
  actionType: 'save_load';
  saveSlotId?: string;
  saveLabel?: string;
}

export interface ReplayTerminalEntry extends ReplayLogEntryBase {
  actionType: 'terminal';
  terminalReason: 'death' | 'ending' | 'manual_stop';
  eventId?: string;
}

export type ReplayLogEntry =
  | ReplayChoiceEntry
  | ReplayAutoEventEntry
  | ReplaySaveLoadEntry
  | ReplayTerminalEntry;

export interface ReplayLog {
  metadata: ReplayLogMetadata;
  entries: ReplayLogEntry[];
}
