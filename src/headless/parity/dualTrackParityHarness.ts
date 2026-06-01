/**
 * Dual-track parity harness (P5 US-022 / US-023).
 *
 * `snapshotHash` is a SHA-256 fingerprint of route + life memory + record-aligned
 * event history + feedback digests (not raw transport bytes; avoids setback/RNG noise).
 */

import { gameEngine } from '../../core/GameEngineIntegration';
import { GameProcessSimulator, type GameProcessRecord } from '../../../tests/GameProcessSimulator';
import {
  GOLDEN_LINE_SAMPLES,
  GOLDEN_ROMANCE_FAMILY_SAMPLE,
  type GoldenLineSimulationSample,
} from '../../../scripts/goldenLineSimulation';
import { HeadlessEngineSessionImpl } from '../session/HeadlessEngineSessionImpl';
import { defaultSnapshotConverter } from '../snapshot/SnapshotConverter';
import {
  buildParityFingerprint,
  compareParityFields,
  digestGameState,
  digestRecordAlignedEventHistory,
  type ParityReport,
} from './parityModel';
import { filterReplayExecutableRecords } from './simulatorRecordReplay';
import type { RouteTrack } from './routeTrackFixtures';

export const P5_PARITY_SAMPLES: GoldenLineSimulationSample[] = [
  ...GOLDEN_LINE_SAMPLES,
  GOLDEN_ROMANCE_FAMILY_SAMPLE,
];

const P3_EVAL_END_AGE = 50;

export function feedbackDigestFromRecords(records: GameProcessRecord[]): string {
  return filterReplayExecutableRecords(records)
    .map(record => record.outcomeText ?? '')
    .join('|');
}

function filterRecordsForParity(records: GameProcessRecord[]): GameProcessRecord[] {
  return records.filter(record => record.age <= P3_EVAL_END_AGE);
}

async function runHeadlessFromRecords(
  sample: GoldenLineSimulationSample,
  records: GameProcessRecord[],
): Promise<{ finalState: ReturnType<typeof defaultSnapshotConverter.fromSnapshot>; outcomeTexts: string[] }> {
  const session = HeadlessEngineSessionImpl.createForReplay({
    randomSeed: sample.seed,
    catalogVersion: '1.0.0',
  });
  const replay = await session.replaySimulatorRecords(
    {
      playerName: sample.personaName,
      gender: sample.gender,
      routeTrack: sample.routeTrack as RouteTrack | undefined,
    },
    records,
  );
  return {
    finalState: replay.finalState,
    outcomeTexts: replay.outcomeTexts,
  };
}

export async function runDualTrackParity(sample: GoldenLineSimulationSample): Promise<ParityReport> {
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
  const referenceReport = await simulator.simulate();
  const parityRecords = filterRecordsForParity(referenceReport.records);
  const referenceState = JSON.parse(JSON.stringify(gameEngine.getGameState())) as ReturnType<
    typeof gameEngine.getGameState
  >;
  if (!referenceState.player || parityRecords.length === 0) {
    return {
      sampleId: sample.id,
      passed: false,
      mismatches: [
        {
          category: 'snapshot_hash',
          step: 0,
          field: 'reference',
          reference: 'empty',
          headless: 'n/a',
          blocking: true,
        },
      ],
    };
  }

  gameEngine.reset();
  const headlessRun = await runHeadlessFromRecords(sample, parityRecords);
  const referenceDigest = digestGameState(referenceState);
  const headlessDigest = digestGameState(headlessRun.finalState);
  referenceDigest.eventHistoryDigest = digestRecordAlignedEventHistory(
    referenceState,
    parityRecords,
  );
  headlessDigest.eventHistoryDigest = digestRecordAlignedEventHistory(
    headlessRun.finalState,
    parityRecords,
  );
  referenceDigest.feedbackDigest = feedbackDigestFromRecords(parityRecords);
  headlessDigest.feedbackDigest = headlessRun.outcomeTexts.join('|');

  referenceDigest.snapshotHash = buildParityFingerprint(referenceDigest);
  headlessDigest.snapshotHash = buildParityFingerprint(headlessDigest);

  return compareParityFields(sample.id, referenceDigest, headlessDigest);
}

export async function runAllDualTrackParity(): Promise<ParityReport[]> {
  const reports: ParityReport[] = [];
  for (const sample of P5_PARITY_SAMPLES) {
    reports.push(await runDualTrackParity(sample));
  }
  return reports;
}
