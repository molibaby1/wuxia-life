/**
 * Dual-track parity model (P5 US-021).
 */

import * as crypto from 'node:crypto';
import { deriveLifeMemorySummary } from '../../core/deriveLifeMemorySummary';
import type { LifeMemorySummary } from '../../types/lifeMemory';
import type { GameState } from '../../types/eventTypes';
import type { GameProcessRecord } from '../../types/simulationRecordTypes';
import {
  ACTIVE_ACTION_EVENT_PREFIX,
  isActiveActionReplayEventId,
} from '../../core/activePlanning/activeActionReplay';

export type ParityMismatchCategory =
  | 'snapshot_hash'
  | 'feedback'
  | 'route_flags'
  | 'life_memory'
  | 'event_history';

export interface ParityComparisonFields {
  snapshotHash: string;
  feedbackDigest: string;
  routeFlagsJson: string;
  lifeMemoryJson: string;
  eventHistoryDigest: string;
}

export interface ParityMismatch {
  category: ParityMismatchCategory;
  step: number;
  field: string;
  reference: string;
  headless: string;
  blocking: boolean;
}

export interface ParityReport {
  sampleId: string;
  passed: boolean;
  mismatches: ParityMismatch[];
}

const VOLATILE_SNAPSHOT_KEYS = ['updatedAt', 'createdAt', 'contentHash', 'gameTimestamp', 'lastSavedAt'];

export function normalizeSnapshotForHash(snapshot: unknown): unknown {
  const clone = JSON.parse(JSON.stringify(snapshot)) as Record<string, unknown>;
  const metadata = clone.metadata as Record<string, unknown> | undefined;
  if (metadata) {
    for (const key of VOLATILE_SNAPSHOT_KEYS) {
      delete metadata[key];
    }
  }
  const state = clone.state as Record<string, unknown> | undefined;
  if (state) {
    for (const key of VOLATILE_SNAPSHOT_KEYS) {
      delete state[key];
    }
  }
  return clone;
}

function sortedEventHistory(state: GameState) {
  return [...(state.eventHistory ?? [])]
    .map(e => ({
      eventId: e.eventId,
      age: e.age,
      selectedChoice: e.selectedChoice,
    }))
    .sort((a, b) => {
      const ageDelta = (a.age ?? 0) - (b.age ?? 0);
      if (ageDelta !== 0) return ageDelta;
      return a.eventId.localeCompare(b.eventId);
    });
}

const MISSING_HISTORY_CHOICE = '__MISSING__';

function isParityFormalEventRecord(record: GameProcessRecord): boolean {
  if (record.eventId === 'no_event') return false;
  if (record.progressionKind === 'active_action') return false;
  if (isActiveActionReplayEventId(record.eventId)) return false;
  if (record.eventId.startsWith(ACTIVE_ACTION_EVENT_PREFIX)) return false;
  return true;
}

export function digestRecordAlignedEventHistory(
  state: GameState,
  records: GameProcessRecord[],
): string {
  const history = sortedEventHistory(state);
  const aligned = records
    .filter(isParityFormalEventRecord)
    .map(record => {
      const match = history.find(
        entry => entry.eventId === record.eventId && entry.age === record.age,
      );
      const selectedChoice = match?.selectedChoice ?? MISSING_HISTORY_CHOICE;
      return {
        eventId: record.eventId,
        age: record.age,
        selectedChoice,
      };
    });
  return JSON.stringify(aligned);
}

/** Canonical end-state fingerprint for parity (route + memory + events + feedback). */
export function buildParityFingerprint(digest: ParityComparisonFields): string {
  return crypto
    .createHash('sha256')
    .update(
      [
        digest.routeFlagsJson,
        digest.lifeMemoryJson,
        digest.eventHistoryDigest,
        digest.feedbackDigest,
      ].join('\n'),
    )
    .digest('hex');
}

export function digestGameState(state: GameState): ParityComparisonFields {
  const routeFlags = Object.fromEntries(
    Object.entries(state.flags ?? {}).filter(([key]) => key.startsWith('route_')),
  );
  const routeFlagsJson = JSON.stringify(routeFlags);
  const lifeMemoryJson = JSON.stringify(
    stripVolatileLifeMemory(deriveLifeMemorySummary(state)),
  );
  const eventHistoryDigest = JSON.stringify(sortedEventHistory(state));
  return {
    snapshotHash: '',
    feedbackDigest: '',
    routeFlagsJson,
    lifeMemoryJson,
    eventHistoryDigest,
  };
}

function stripVolatileLifeMemory(summary: LifeMemorySummary): LifeMemorySummary {
  return summary;
}

export function compareParityFields(
  sampleId: string,
  reference: ParityComparisonFields,
  headless: ParityComparisonFields,
): ParityReport {
  const mismatches: ParityMismatch[] = [];
  const pairs: Array<[ParityMismatchCategory, keyof ParityComparisonFields]> = [
    ['snapshot_hash', 'snapshotHash'],
    ['feedback', 'feedbackDigest'],
    ['route_flags', 'routeFlagsJson'],
    ['life_memory', 'lifeMemoryJson'],
    ['event_history', 'eventHistoryDigest'],
  ];
  pairs.forEach(([category, field], index) => {
    if (reference[field] !== headless[field]) {
      mismatches.push({
        category,
        step: index,
        field,
        reference: reference[field],
        headless: headless[field],
        blocking: true,
      });
    }
  });
  return { sampleId, passed: mismatches.length === 0, mismatches };
}

export function isBlockingMismatch(report: ParityReport): boolean {
  return report.mismatches.some(m => m.blocking);
}
