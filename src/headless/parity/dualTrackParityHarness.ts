/**
 * Dual-track parity harness (P5 US-022 / US-023).
 */

import * as crypto from 'node:crypto';
import { GameProcessSimulator, type GameProcessRecord } from '../../../tests/GameProcessSimulator';
import {
  GOLDEN_LINE_SAMPLES,
  GOLDEN_ROMANCE_FAMILY_SAMPLE,
  type GoldenLineSimulationSample,
} from '../../../scripts/goldenLineSimulation';
import { HeadlessEngineSessionImpl } from '../session/HeadlessEngineSessionImpl';
import { defaultSnapshotConverter } from '../snapshot/SnapshotConverter';
import {
  compareParityFields,
  digestGameState,
  normalizeSnapshotForHash,
  type ParityReport,
} from './parityModel';
import { CHOICE_EXECUTION_REQUEST_VERSION } from '../../contracts/choiceExecution';

export const P5_PARITY_SAMPLES: GoldenLineSimulationSample[] = [
  ...GOLDEN_LINE_SAMPLES,
  GOLDEN_ROMANCE_FAMILY_SAMPLE,
];

function snapshotHash(snapshot: unknown): string {
  const normalized = normalizeSnapshotForHash(snapshot);
  return crypto.createHash('sha256').update(JSON.stringify(normalized)).digest('hex');
}

async function runHeadlessFromRecords(
  sample: GoldenLineSimulationSample,
  records: GameProcessRecord[],
): Promise<{ finalState: ReturnType<typeof defaultSnapshotConverter.fromSnapshot>; feedbackDigest: string }> {
  const session = HeadlessEngineSessionImpl.create({
    playerName: sample.personaName,
    gender: sample.gender,
    randomSeed: sample.seed,
    catalogVersion: '1.0.0',
  });
  const feedbackLines: string[] = [];

  for (const record of records) {
    if (session.getTerminalState()) break;
    if (record.eventType === 'choice' && record.selectedChoice) {
      const next = await session.getNextEvent();
      if (!next || next.eventId !== record.eventId) {
        break;
      }
      const response = await session.executeChoice({
        requestVersion: CHOICE_EXECUTION_REQUEST_VERSION,
        snapshotRef: { snapshot: session.serialize() },
        action: { eventId: record.eventId, choiceId: record.selectedChoice.id },
      });
      if (response.status === 'success') {
        feedbackLines.push(JSON.stringify(response.feedback));
      }
      continue;
    }
    if (record.eventType === 'auto' || record.eventType === 'ending') {
      await session.getNextEvent();
      await session.progressAutomatic({ maxSteps: 4 });
    }
  }

  const finalState = defaultSnapshotConverter.fromSnapshot(session.serialize());
  return { finalState, feedbackDigest: feedbackLines.join('|') };
}

export async function runDualTrackParity(sample: GoldenLineSimulationSample): Promise<ParityReport> {
  const simulator = new GameProcessSimulator({
    playerName: sample.personaName,
    gender: sample.gender,
    simulateYears: 50,
    runUntilDeath: false,
    ageRange: { startAge: 0, endAge: 50 },
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
  const referenceState = referenceReport.records.at(-1)?.gameState;
  if (!referenceState) {
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

  const headlessRun = await runHeadlessFromRecords(sample, referenceReport.records);
  const referenceDigest = digestGameState(referenceState);
  const headlessDigest = digestGameState(headlessRun.finalState);
  referenceDigest.feedbackDigest = referenceReport.records
    .map(r => r.outcomeText ?? '')
    .join('|');
  headlessDigest.feedbackDigest = headlessRun.feedbackDigest;

  const refSnapshot = defaultSnapshotConverter.toSnapshot(referenceState, {
    eventCatalogVersion: '1.0.0',
    sourcePlatform: 'node-headless',
    time: { now: () => 0 },
  });
  const headlessSnapshot = defaultSnapshotConverter.toSnapshot(headlessRun.finalState, {
    eventCatalogVersion: '1.0.0',
    sourcePlatform: 'node-headless',
    time: { now: () => 0 },
  });
  referenceDigest.snapshotHash = snapshotHash(refSnapshot);
  headlessDigest.snapshotHash = snapshotHash(headlessSnapshot);

  const report = compareParityFields(sample.id, referenceDigest, headlessDigest);
  if (referenceDigest.snapshotHash !== headlessDigest.snapshotHash) {
    report.mismatches.push({
      category: 'snapshot_hash',
      step: 0,
      field: 'snapshotHash',
      reference: referenceDigest.snapshotHash,
      headless: headlessDigest.snapshotHash,
      blocking: true,
    });
    report.passed = false;
  }
  return report;
}

export async function runAllDualTrackParity(): Promise<ParityReport[]> {
  const reports: ParityReport[] = [];
  for (const sample of P5_PARITY_SAMPLES) {
    reports.push(await runDualTrackParity(sample));
  }
  return reports;
}
