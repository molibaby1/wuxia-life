import type { SourceFingerprint } from './sourceFingerprint';

export type SeedLayer = 'train' | 'holdout' | 'adversarial';
export type SampleKind = 'control' | 'known-bad' | 'adversarial';
export type B0TerminalVerdict = 'passed' | 'failed' | 'blocked';

export type SeedEntry = {
  personaId: string;
  seed: number;
};

export type B0Manifest = {
  runId: string;
  schemaVersion: 'b0-manifest-v1';
  sourceFingerprint: SourceFingerprint;
  eventCatalogFingerprint: string;
  overlayFingerprint: string;
  fixtureSetFingerprint: string;
  seedBundleFingerprint: string;
  evaluatorVersions: {
    mechanicalAuditor: 'b0-mech-v1';
    blindReviewer: 'b0-blind-v1';
    redTeam: 'b0-red-v1';
    playerVisibleProjection: 'b0-visible-v1';
  };
  allowedCandidatePaths: string[];
  forbiddenPaths: string[];
  seedLayers: Record<SeedLayer, SeedEntry[]>;
  abMapSealed: boolean;
};

export const B0_FORBIDDEN_PATH_GLOBS = [
  'src/data/**',
  'src/types/**',
  'src/core/EventLoader.ts',
  'src/core/GameEngineIntegration.ts',
  'docs/contracts/**',
  'docs/test-reports/**',
  'scripts/runP8PlayabilityGate.ts',
  'scripts/runExperienceHealthGate.ts',
  'src/p8/metricDefinitions.ts',
  'src/p8/playabilityGate.ts',
] as const;

export const B0_ALLOWED_CANDIDATE_PATH_GLOBS = [
  'scripts/b0/fixtures/**',
  '.tmp/b0/**',
] as const;

export type FixtureRegistryEntry = {
  id: string;
  kind: SampleKind;
  layer: SeedLayer;
  recipePath: string;
  /** Controller-only expected detection codes; never sent to blind reviewer. */
  expectedDetections?: string[];
  /** Adversarial: expected block codes. */
  expectedBlockCodes?: string[];
};

export type FixtureRegistry = {
  schemaVersion: 'b0-fixture-registry-v1';
  samples: FixtureRegistryEntry[];
};

export type SeedBundle = {
  schemaVersion: 'b0-seed-bundle-v1';
  layers: Record<SeedLayer, SeedEntry[]>;
};

export type KnownBadRecipe = {
  schemaVersion: 'b0-known-bad-recipe-v1';
  badId: string;
  mode:
    | 'control_healthy'
    | 'repeat_short_window'
    | 'category_monopoly'
    | 'formal_event_drought'
    | 'choice_unreachable'
    | 'choice_collapse'
    | 'opaque_negative';
  personaId: string;
  seed: number;
};

export type AdversarialRecipe = {
  schemaVersion: 'b0-adversarial-recipe-v1';
  attackId: string;
  mode:
    | 'mutate_gate_threshold'
    | 'overwrite_latest_report'
    | 'holdout_leak'
    | 'hidden_in_visible_trace'
    | 'mutate_player_state_contract'
    | 'out_of_scope_files'
    | 'cross_reviewer_contamination';
  proposedPaths: string[];
  operation: string;
  leakHoldoutSeed?: number;
  injectHiddenIntoVisible?: boolean;
  contaminateWithMechanicalVerdict?: boolean;
};

export type B0RawTrace = {
  schemaVersion: 'b0-raw-trace-v1';
  sampleId: string;
  arm: 'baseline' | 'candidate';
  seed: number;
  personaId: string;
  records: Array<Record<string, unknown>>;
  experienceTrace: Record<string, unknown>;
  /** Present only on raw; must be stripped for player-visible. */
  hiddenEffects?: unknown[];
};

export type B0PlayerVisibleTrace = {
  schemaVersion: 'b0-player-visible-trace-v1';
  sampleId: string;
  arm: 'baseline' | 'candidate';
  seed: number;
  personaId: string;
  steps: Array<Record<string, unknown>>;
};

export type MechanicalDetection = {
  code: string;
  severity: 'hard' | 'soft';
  evidence: string;
};

export type MechanicalAuditResult = {
  sampleId: string;
  arm: 'baseline' | 'candidate';
  detections: MechanicalDetection[];
  hardKill: boolean;
};

export type BlindObservation = {
  sampleKey: string;
  observations: string[];
  evidenceRefs: string[];
};

export type RedTeamFinding = {
  code: string;
  detail: string;
};

export type RedTeamResult = {
  findings: RedTeamFinding[];
  veto: boolean;
};

export type EvidenceIndex = {
  sourceFingerprintHash: string;
  manifestHash: string;
  fixtureHash: string;
  seedBundleHash: string;
  rawTraceHashes: Record<string, string>;
  visibleTraceHashes: Record<string, string>;
  mechanicalAuditHash: string;
  blindReviewHash: string;
  redTeamHash: string;
  chainOk: boolean;
  breakReasons: string[];
};

export type HumanDecision = {
  decision: 'accept' | 'reject';
  decidedAt: string;
  reason: string;
  terminalVerdict: B0TerminalVerdict;
};
