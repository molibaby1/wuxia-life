import type { GameProcessRecord } from '../types/simulationRecordTypes';
import type { GameState } from '../types/eventTypes';
import type { RouteSignalPoint } from '../narrative/config/routeDefinitions';

/** Normalized stage expectation keys aligned with stageConfig.expectedSignals. */
export type StageSignalKey =
  | 'origin'
  | 'childhood_choice'
  | 'early_active_action'
  | 'route_entry'
  | 'training_milestone'
  | 'first_turning_point'
  | 'route_reinforcement'
  | 'identity_signal'
  | 'relationship_shift'
  | 'route_divergence'
  | 'achievement'
  | 'age40_identity';

/** Normalized route coverage keys for reinforcement / divergence / identity. */
export type RouteCoverageKind = 'entry' | 'reinforcement' | 'divergence' | 'identity';

export type StageGapCause = 'no-content' | 'weak-scheduling' | 'weak-detection';

export interface NarrativeRoutePointRef {
  routeId: string;
  kind: RouteCoverageKind;
  ageBand: string;
  eventId?: string;
  flagKey?: string;
}

export interface NarrativeSchedulingMetadata {
  stageSignals?: StageSignalKey[];
  routePoints?: NarrativeRoutePointRef[];
}

export interface SignalDetectionInput {
  records: GameProcessRecord[];
  finalState?: GameState;
  ageMin?: number;
  ageMax?: number;
}

export interface DetectedSignal {
  key: StageSignalKey;
  ages: number[];
  sources: string[];
}

export interface StageBaselineEntry {
  stageId: string;
  ageBand: string;
  expectedSignals: StageSignalKey[];
  detectedSignals: DetectedSignal[];
  missingSignals: StageSignalKey[];
}

export interface StageGapEntry {
  stageId: string;
  signal: StageSignalKey;
  cause: StageGapCause;
  example: string;
}

export interface RoutePointAuditEntry {
  routeId: string;
  routeLabel: string;
  point: RouteSignalPoint;
  observed: boolean;
  observationSources: string[];
}

export interface RouteBaselineEntry {
  routeId: string;
  routeLabel: string;
  personaIds: string[];
  points: RoutePointAuditEntry[];
  neverScheduledPoints: RoutePointAuditEntry[];
}

export interface NarrativeSchedulingContext {
  age: number;
  stageId: string | null;
  expectedStageSignals: StageSignalKey[];
  satisfiedStageSignals: StageSignalKey[];
  missingStageSignals: StageSignalKey[];
}

export interface P11SchedulingGateReport {
  schemaVersion: 'p11-scheduling-v1';
  generatedAt: string;
  decision: 'pass' | 'warning' | 'fail';
  stageCoverage: StageBaselineEntry[];
  stageGaps: StageGapEntry[];
  routeCoverage: RouteBaselineEntry[];
  summary: {
    stageBandsWithGaps: number;
    routePointsNeverScheduled: number;
    notes: string[];
  };
}
