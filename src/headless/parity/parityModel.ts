/**
 * Dual-track parity model (P5 US-021).
 */

import { deriveLifeMemorySummary } from '../../core/deriveLifeMemorySummary';
import type { LifeMemorySummary } from '../../types/lifeMemory';
import type { GameState } from '../../types/eventTypes';

export type ParityMismatchCategory =
  | 'snapshot_hash'
  | 'feedback'
  | 'route_state'
  | 'life_memory'
  | 'event_history';

export interface ParityComparisonFields {
  snapshotHash: string;
  feedbackDigest: string;
  routeStateJson: string;
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
  return clone;
}

export function digestGameState(state: GameState): ParityComparisonFields {
  const routeStateJson = JSON.stringify(state.routeStates ?? {});
  const lifeMemoryJson = JSON.stringify(
    stripVolatileLifeMemory(deriveLifeMemorySummary(state)),
  );
  const eventHistoryDigest = JSON.stringify(
    (state.eventHistory ?? []).map(e => ({
      eventId: e.eventId,
      age: e.age,
      selectedChoice: e.selectedChoice,
    })),
  );
  return {
    snapshotHash: '',
    feedbackDigest: '',
    routeStateJson,
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
    ['route_state', 'routeStateJson'],
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
