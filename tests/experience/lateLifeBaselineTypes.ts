import type { GameStateSnapshot } from '../../src/contracts/gameStateSnapshot';
import type { PlanningOptionDto, SessionPhase } from '../../src/contracts/sessionProgression';

export type LateLifePersonaKey = 'martial' | 'wealth' | 'balanced';
export type LateLifeTargetAge = 30 | 45 | 60 | 75;

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

export function snapshotForManifest(snapshot: GameStateSnapshot): GameStateSnapshot {
  return JSON.parse(JSON.stringify(snapshot)) as GameStateSnapshot;
}
