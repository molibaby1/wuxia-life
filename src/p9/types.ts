import type { P8PlayabilityReport, P8PersonaRunMetrics } from '../p8/types';
import type { GameProcessRecord, GameProcessReport } from '../../tests/GameProcessSimulator';

export type WarningBucket = 'replayability' | 'pacing' | 'causality' | 'other';

export interface WarningTriageEntry {
  metric: string;
  personaId: string;
  personaName: string;
  detail: string;
  bucket: WarningBucket;
  evidence: unknown[];
}

export interface P9WarningTriageReport {
  schemaVersion: 'p9-triage-v1';
  generatedAt: string;
  sourceReport: string;
  baselineDecision: string;
  totalWarnings: number;
  byBucket: Record<WarningBucket, WarningTriageEntry[]>;
  allWarnings: WarningTriageEntry[];
}

export type PacingSpanClassification = 'no-content' | 'weak-feedback' | 'weak-differentiation';

export interface PacingSpanActivity {
  events: Array<{ age: number; title: string; kind: string }>;
  actions: Array<{ age: number; actionId: string }>;
  routeChanges: Array<{ age: number; signal: string }>;
  summaryChanges: Array<{ age: number; text: string }>;
}

export interface AnnotatedPacingSpan {
  personaId: string;
  personaName: string;
  startAge: number;
  endAge: number;
  spanYears: number;
  classification: PacingSpanClassification;
  activity: PacingSpanActivity;
}

export interface P9PacingAnnotationReport {
  schemaVersion: 'p9-pacing-v1';
  generatedAt: string;
  spans: AnnotatedPacingSpan[];
}

export interface ReplayPairComparison {
  personaA: string;
  personaB: string;
  similarityScore: number;
  routeTags: { a: string; b: string; tooSimilar: boolean };
  actionDistribution: { a: Record<string, number>; b: Record<string, number>; tooSimilar: boolean };
  summaryIdentity: { a: string; b: string; tooSimilar: boolean };
  achievementOutcomes: { a: string[]; b: string[]; tooSimilar: boolean };
  similarDimensions: string[];
}

export interface P9ReplayComparisonReport {
  schemaVersion: 'p9-replay-v1';
  generatedAt: string;
  pairs: ReplayPairComparison[];
}

export type CausalityRootCauseClass = 'missing-content-echo' | 'implicit-only-echo' | 'detector-too-strict';

export interface CausalityPersonaClassification {
  personaId: string;
  personaName: string;
  directEchoCount: number;
  classification: CausalityRootCauseClass;
  evidenceExample: string;
  implicitSignals: string[];
}

export interface P9CausalityRootCauseReport {
  schemaVersion: 'p9-causality-v1';
  generatedAt: string;
  personas: CausalityPersonaClassification[];
}

export type RemediationLayer = 'content' | 'config' | 'runtime';

export interface RankedRootCause {
  rank: number;
  title: string;
  bucket: WarningBucket;
  affectedPersonas: string[];
  ageBands: string[];
  likelyFixLayer: RemediationLayer;
  summary: string;
}

export interface P9RootCauseRankingReport {
  schemaVersion: 'p9-root-cause-v1';
  generatedAt: string;
  rootCauses: RankedRootCause[];
}

export interface PersonaSimulationBundle {
  personaId: string;
  report: GameProcessReport;
  records: GameProcessRecord[];
  metrics: P8PersonaRunMetrics;
}

export interface P9AnalysisContext {
  p8Report: P8PlayabilityReport;
  simulations: PersonaSimulationBundle[];
}
