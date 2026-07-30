import { GameProcessSimulator } from '../tests/GameProcessSimulator';
import type { GameProcessReport } from '../src/types/simulationRecordTypes';
import { GOLDEN_ROMANCE_FAMILY_SAMPLE_ID } from './romanceFamilyArcTelemetry';

/** P3-EVAL / golden-line deterministic end age (US-002 §5.1, US-017). */
export const P3_EVAL_END_AGE = 50;

/** Golden life line age ceiling — aligned with P3-EVAL (US-017). */
export const GOLDEN_LINE_END_AGE = P3_EVAL_END_AGE;

export type GoldenLineRouteTrack = 'sect' | 'wanderer' | 'demonic';

export type GoldenLineSimulationSample = {
  id: string;
  personaName: string;
  gender: 'male' | 'female';
  seed: number;
  choiceTendency: 'balanced' | 'martial' | 'wealth' | 'relationship' | 'risk_averse';
  routeTrack?: GoldenLineRouteTrack;
  description: string;
};

export const GOLDEN_LINE_SAMPLES: GoldenLineSimulationSample[] = [
  {
    id: 'golden-sect',
    personaName: '顾清和',
    gender: 'male',
    seed: 301,
    choiceTendency: 'martial',
    routeTrack: 'sect',
    description: 'PRD orthodox/sect priority route (0–50)',
  },
  {
    id: 'golden-wanderer',
    personaName: '叶行舟',
    gender: 'male',
    seed: 302,
    choiceTendency: 'relationship',
    routeTrack: 'wanderer',
    description: 'PRD wandering hero priority route (0–50)',
  },
  {
    id: 'golden-demonic',
    personaName: '沈夜',
    gender: 'male',
    seed: 303,
    choiceTendency: 'risk_averse',
    routeTrack: 'demonic',
    description: 'PRD demonic path priority route (0–50)',
  },
  {
    id: 'golden-neutral-baseline',
    personaName: '林素心',
    gender: 'female',
    seed: 304,
    choiceTendency: 'balanced',
    description: 'Neutral baseline without route-track bias (0–50)',
  },
];

/** P3-RF: deterministic romance/family regression (US-010, arc_rf_mingyue). */
export const GOLDEN_ROMANCE_FAMILY_SAMPLE: GoldenLineSimulationSample = {
  id: GOLDEN_ROMANCE_FAMILY_SAMPLE_ID,
  personaName: '沈照霜',
  gender: 'female',
  seed: 305,
  choiceTendency: 'relationship',
  description: 'P3-RF romance/family arc regression (0–50)',
};

/** P3-EVAL trust queue: golden routes + romance/family primary sample (US-002 §2.1). */
export const P3_EVAL_SAMPLES: GoldenLineSimulationSample[] = [
  ...GOLDEN_LINE_SAMPLES,
  GOLDEN_ROMANCE_FAMILY_SAMPLE,
];

export type GoldenLineReplayRecord = {
  age: number;
  eventId: string;
  choiceId?: string;
  outcomeText?: string;
  routeFlags: string[];
  appliedEffects?: unknown[];
};

export type GoldenLineSimulationRun = {
  sample: GoldenLineSimulationSample;
  report: GameProcessReport;
  replay: GoldenLineReplayRecord[];
};

function extractRouteFlags(gameState: GameProcessReport['records'][0]['gameState']): string[] {
  const flags = gameState.player?.flags ?? {};
  return Object.keys(flags)
    .filter(key => key.startsWith('route_') && flags[key])
    .sort();
}

function toReplayRecord(record: GameProcessReport['records'][number]): GoldenLineReplayRecord {
  return {
    age: record.age,
    eventId: record.eventId,
    choiceId: record.selectedChoice?.id,
    outcomeText: record.outcomeText,
    routeFlags: extractRouteFlags(record.gameState),
  };
}

export function buildGoldenLineReplay(report: GameProcessReport): GoldenLineReplayRecord[] {
  return report.records
    .filter(record => record.age <= GOLDEN_LINE_END_AGE)
    .map(toReplayRecord);
}

export async function runGoldenLineSimulation(
  sample: GoldenLineSimulationSample,
): Promise<GoldenLineSimulationRun> {
  const simulator = new GameProcessSimulator({
    playerName: sample.personaName,
    gender: sample.gender,
    simulateYears: GOLDEN_LINE_END_AGE,
    runUntilDeath: false,
    ageRange: { startAge: 0, endAge: GOLDEN_LINE_END_AGE },
    seed: sample.seed,
    choiceTendency: sample.choiceTendency,
    routeTrack: sample.routeTrack,
    sampleId: sample.id,
    maxEvents: 200,
    verbose: false,
    enableAutoSave: false,
    enableManualSave: false,
    enableSaveRestore: false,
  });

  const report = await simulator.simulate();
  return {
    sample,
    report,
    replay: buildGoldenLineReplay(report),
  };
}

export async function runAllGoldenLineSimulations(): Promise<GoldenLineSimulationRun[]> {
  const runs: GoldenLineSimulationRun[] = [];
  for (const sample of GOLDEN_LINE_SAMPLES) {
    runs.push(await runGoldenLineSimulation(sample));
  }
  return runs;
}

export async function runP3EvalSimulation(
  sample: GoldenLineSimulationSample,
): Promise<GoldenLineSimulationRun> {
  const simulator = new GameProcessSimulator({
    playerName: sample.personaName,
    gender: sample.gender,
    simulateYears: P3_EVAL_END_AGE,
    runUntilDeath: false,
    ageRange: { startAge: 0, endAge: P3_EVAL_END_AGE },
    seed: sample.seed,
    choiceTendency: sample.choiceTendency,
    routeTrack: sample.routeTrack,
    sampleId: sample.id,
    maxEvents: 200,
    verbose: false,
    enableAutoSave: false,
    enableManualSave: false,
    enableSaveRestore: false,
  });

  const report = await simulator.simulate();
  return {
    sample,
    report,
    replay: report.records
      .filter(record => record.age <= P3_EVAL_END_AGE)
      .map(toReplayRecord),
  };
}

export async function runAllP3EvalSimulations(): Promise<GoldenLineSimulationRun[]> {
  const runs: GoldenLineSimulationRun[] = [];
  for (const sample of P3_EVAL_SAMPLES) {
    runs.push(await runP3EvalSimulation(sample));
  }
  return runs;
}
