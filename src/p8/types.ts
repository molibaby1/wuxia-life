/**
 * P8 playability gate — shared types.
 */

export type PersonaActionStrategy =
  | 'training'
  | 'study'
  | 'socializing'
  | 'business'
  | 'travel'
  | 'balanced';

export type PersonaRiskPreference = 'low' | 'medium' | 'high';
export type PersonaRelationshipPreference = 'low' | 'medium' | 'high';
export type PersonaAgeBand = '0-20' | '20-30' | '30-40';

export type PersonaGoalEvidenceType =
  | 'flag'
  | 'route_state'
  | 'stat_threshold'
  | 'relationship'
  | 'event_id'
  | 'action_category_count';

export interface PersonaGoalEvidenceSpec {
  flag?: string;
  flagValue?: unknown;
  routeKey?: string;
  routeMinStage?: number;
  stat?: string;
  statMin?: number;
  relationshipKey?: string;
  eventId?: string;
  actionCategory?: string;
  actionCategoryMinCount?: number;
}

export interface PersonaGoal {
  id: string;
  label: string;
  ageBand: PersonaAgeBand;
  evidenceTypes: PersonaGoalEvidenceType[];
  evidenceSpec: PersonaGoalEvidenceSpec;
}

export interface P8Persona {
  id: string;
  name: string;
  gender: 'male' | 'female';
  seed: number;
  strategy: PersonaActionStrategy;
  strategySummary: string;
  routePreference: string;
  riskPreference: PersonaRiskPreference;
  relationshipPreference: PersonaRelationshipPreference;
  choiceTendency: 'balanced' | 'martial' | 'wealth' | 'relationship' | 'risk_averse';
  shortTermGoals: PersonaGoal[];
}

export interface PersonaActionCandidate {
  actionId: string;
  category: string;
  name: string;
}

export interface PersonaActionStrategyInput {
  persona: P8Persona;
  availableActions: PersonaActionCandidate[];
  age: number;
  focusStreakCategory: string | null;
  focusStreakCount: number;
}

export interface PersonaActionStrategyOutput {
  actionId: string;
  reason: string;
}

export interface ChoiceScoreDiagnostic {
  eventId: string;
  selectedChoiceId: string;
  selectedScore: number;
  runnerUpChoiceId: string | null;
  runnerUpScore: number | null;
  personaId: string;
}

export type P8MetricKey =
  | 'agency'
  | 'causality'
  | 'achievement'
  | 'frustration'
  | 'replayability'
  | 'pacing'
  | 'narrative_memory';

export type P8MetricSeverity = 'blocker' | 'warning' | 'info';
export type P8MeasurementSurface = 'simulation' | 'browser' | 'human_only';
export type P8MetricStatus = 'pass' | 'warning' | 'fail';

export interface P8MetricDefinition {
  key: P8MetricKey;
  label: string;
  intent: string;
  scoringSurface: string;
  severity: P8MetricSeverity;
  measurementSurface: P8MeasurementSurface;
  threshold?: number;
  thresholdMax?: number;
  thresholdMin?: number;
  nonBlocking?: boolean;
}

export interface P8MetricVerdict {
  key: P8MetricKey;
  status: P8MetricStatus;
  severity: P8MetricSeverity;
  detail: string;
  evidence: unknown[];
  threshold?: number;
  actualValue?: number | string | null;
}

export interface P8PersonaRunMetrics {
  personaId: string;
  personaName: string;
  agency: AgencyMetricPayload;
  causality: CausalityMetricPayload;
  achievement: AchievementMetricPayload;
  frustration: FrustrationMetricPayload;
  pacing: PacingMetricPayload;
  narrativeMemory: NarrativeMemoryPayload;
  choiceDiagnostics: ChoiceScoreDiagnostic[];
  activeActionSelectionReasons: Array<{ age: number; actionId: string; reason: string }>;
}

export interface AgencyMetricPayload {
  activeActionCount: number;
  storyEventCount: number;
  choiceEventCount: number;
  forcedEventCount: number;
  activeActionByCategory: Record<string, number>;
  repeatedSameActionStreakMax: number;
  repeatedStreakExamples: Array<{ actionId: string; streak: number; startAge: number }>;
}

export interface CausalityEcho {
  kind: 'direct' | 'generic_stat';
  age: number;
  description: string;
  reference: string;
}

export interface CausalityMetricPayload {
  directEchoCount: number;
  genericEchoCount: number;
  strongestExamples: CausalityEcho[];
  tooFewEchoes: boolean;
}

export type GoalAchievementStatus = 'achieved' | 'missed' | 'unavailable';

export interface GoalAchievementResult {
  goalId: string;
  label: string;
  ageBand: PersonaAgeBand;
  status: GoalAchievementStatus;
  evidence: string[];
}

export interface AchievementMetricPayload {
  goals: GoalAchievementResult[];
  achievedCount: number;
  missedCount: number;
  unavailableCount: number;
}

export type FrustrationClassification = 'warned' | 'explained' | 'recoverable' | 'opaque';

export interface FrustrationSetback {
  age: number;
  classification: FrustrationClassification;
  description: string;
  eventId?: string;
}

export interface FrustrationMetricPayload {
  setbacks: FrustrationSetback[];
  opaqueCount: number;
  opaqueRatio: number;
  opaqueExamples: FrustrationSetback[];
}

export interface PacingMetricPayload {
  longestLowImpactSpanYears: number;
  lowImpactSpanStartAge: number | null;
  lowImpactSpanEndAge: number | null;
}

export interface NarrativeMemoryPayload {
  earlyLife: string;
  turningPoint: string;
  age40Identity: string;
  evidenceCitations: Array<{ age: number; kind: string; text: string }>;
  missingTurningPoint: boolean;
  missingIdentity: boolean;
}

export interface ReplaySimilarityPair {
  personaA: string;
  personaB: string;
  score: number;
}

export interface ReplayMetricPayload {
  pairwiseSimilarities: ReplaySimilarityPair[];
  similarityClusters: string[][];
  nearDuplicateWarnings: string[];
}

export type P8PlayabilityRuntimePath = 'headless_server' | 'local_direct';

export interface P8PlayabilityReportMeta {
  runtimePath: P8PlayabilityRuntimePath;
  catalogVersion: string;
  engineVersion: string;
  p8GateEndAge: number;
  generatedAt: string;
}

export interface P8PlayabilityReport {
  schemaVersion: 'p8-v1';
  generatedAt: string;
  runtimePath?: P8PlayabilityRuntimePath;
  catalogVersion?: string;
  engineVersion?: string;
  decision: 'pass' | 'fail';
  endAge: number;
  personaRuns: P8PersonaRunMetrics[];
  replay: ReplayMetricPayload;
  verdicts: P8MetricVerdict[];
  blockingFailures: P8MetricVerdict[];
  warnings: P8MetricVerdict[];
}
