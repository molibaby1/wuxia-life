/**
 * P8.1 headless persona runner — config and result types.
 */

import type { ChoiceScoreDiagnostic } from '../../p8/types';
import type { P8Persona } from '../../p8/types';
import type { GameState } from '../../types/eventTypes';
import type { GameProcessRecord } from '../../types/simulationRecordTypes';
import type { ExperienceTrace } from './experienceTraceTypes';


export type HeadlessPlayabilityRuntimePath = 'headless_server' | 'local_direct';

export interface HeadlessPersonaRunConfig {
  persona: P8Persona;
  endAge: number;
  catalogVersion: string;
  maxSteps?: number;
  /** Optional deterministic seed override for trace/replay runs. */

  seed?: number;

  /** Disabled by default so existing P8 runs keep their current data path. */

  experienceTrace?: boolean;

}

export interface HeadlessPersonaRunResult {
  personaId: string;
  finalAge: number;
  isAlive: boolean;
  deathReason: string | null;
  /** Post-run engine state for metrics (not pre-action snapshots from records). */
  finalGameState: GameState;
  records: GameProcessRecord[];
  choiceDiagnostics: ChoiceScoreDiagnostic[];
  activeActionSelectionReasons: Array<{ age: number; actionId: string; reason: string }>;
  totalChoices: number;
  totalActiveActions: number;
  randomSeed: number;
  catalogVersion: string;
  stepsExecuted: number;
  stoppedReason: 'end_age' | 'terminal' | 'max_steps';
  experienceTrace?: ExperienceTrace;

}
