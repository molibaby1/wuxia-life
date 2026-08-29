import type { GameStateSnapshot } from '../../src/contracts/gameStateSnapshot';
import type { PlanningOptionDto, SessionPhase } from '../../src/contracts/sessionProgression';

export type LateLifePersonaKey = 'martial' | 'wealth' | 'balanced';
export type LateLifeTargetAge = 30 | 45 | 60 | 75;

export type DecisionReadability = 'CLEAR' | 'PARTIALLY_CLEAR' | 'UNCLEAR' | 'MISLEADING';
export type LongTermEcho = 'IMMEDIATE_ONLY' | 'STATE_ECHO' | 'EVENT_ECHO' | 'SUMMARY_ECHO' | 'ENDING_ECHO';
export type ResultRepetition = 'UNIQUE' | 'EXACT_REPEAT' | 'TEMPLATE_REPEAT' | 'SEMANTIC_REPEAT';

export interface PublicStateFingerprint {
  age: number;
  martialPower: number;
  constitution?: number;
  knowledge: number;
  businessAcumen: number;
  connections: number;
  reputation: number;
  healthStatus: string;
  affiliation: string | null;
  title: string | null;
  alive: boolean;
  endingId: string | null;
}

export interface CheckpointManifestEntry {
  id: string;
  personaKey: LateLifePersonaKey;
  personaId: string;
  seed: number;
  targetAge: LateLifeTargetAge;
  actualAge: number;
  phase: Extract<SessionPhase, 'active_planning'>;
  snapshotPath: string;
  browserExportPath: string;
  snapshotHash: string;
  publicFingerprint: PublicStateFingerprint;
  planningOptions: PlanningOptionDto[];
}

export interface LateLifeCheckpointManifest {
  schemaVersion: 1;
  generatedAt: string;
  catalogVersion: string;
  checkpoints: CheckpointManifestEntry[];
  terminalBeforeTarget: Array<{
    personaKey: LateLifePersonaKey;
    seed: number;
    targetAge: LateLifeTargetAge;
    age: number;
    endingId: string | null;
  }>;
}

export interface PublicActionCandidate {
  actionId: string;
  text: string;
  description: string;
  rewardSummary: string;
  costSummary: string;
  riskLevel: string;
  category: string;
}

export interface DecisionObservation {
  sequence: number;
  checkpointId: string;
  personaKey: LateLifePersonaKey;
  seed: number;
  age: number;
  source: 'browser-local';
  preChoice: PublicStateFingerprint;
  candidates: PublicActionCandidate[];
  selectedActionId: string;
  publicReason: string;
  result: {
    postChoice: PublicStateFingerprint;
    actionSummary: unknown | null;
    disturbanceNarrative: unknown | null;
    periodSummary: unknown | null;
    continuationEventIds: string[];
  };
  presentation: {
    readable: DecisionReadability;
    repetition: ResultRepetition;
    longTermEcho: LongTermEcho;
    note: string;
  };
  oracle?: {
    browserChoice: string;
    oracleChoice: string;
    same: boolean;
    reason: string;
  };
}

export interface BrowserParityRecord {
  checkpointId: string;
  restorePath: 'local-save-import-and-load';
  snapshotFingerprint: PublicStateFingerprint;
  browserFingerprint: PublicStateFingerprint;
  visibleCandidates: PublicActionCandidate[];
  phase: SessionPhase;
  consoleErrors: string[];
  horizontalOverflow: { desktop: boolean; mobile390: boolean };
  ok: boolean;
  firstDifference?: string;
}

export interface FailureFingerprint {
  command: string;
  exitCode: number;
  failedSuites: string[];
  failedRules: string[];
  failedEvents: string[];
  blockers: string[];
  warnings: string[];
}

export function snapshotForManifest(snapshot: GameStateSnapshot): GameStateSnapshot {
  return JSON.parse(JSON.stringify(snapshot)) as GameStateSnapshot;
}
