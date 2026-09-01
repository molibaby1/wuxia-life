import type { GameProcessReport } from '../src/types/simulationRecordTypes';
import {
  evaluatePayoffGate,
  PAYOFF_RATE_THRESHOLD,
  type PayoffSampleSegmentMetrics,
} from './goldenLinePayoffGate';
import type { GoldenLineReplayRecord, GoldenLineSimulationRun } from './goldenLineSimulation';
import { P3_EVAL_END_AGE } from './goldenLineSimulation';

export type SimulationLifeSegment = '0-30' | '31-50';

export type SegmentDeathStatus = {
  isAliveAtSegmentEnd: boolean;
  deathReason: string | null;
  diedInSegment: boolean;
};

export type SegmentPayoffStatus = PayoffSampleSegmentMetrics & {
  threshold: number;
  pass: boolean;
};

export type SimulationSegmentMetrics = {
  segment: SimulationLifeSegment;
  ageRange: { min: number; max: number };
  eventCount: number;
  choiceCount: number;
  routeFlags: string[];
  deathStatus: SegmentDeathStatus;
  payoffStatus: SegmentPayoffStatus;
};

export type P3EvalSegmentReport = {
  sampleId: string;
  routeTrack: string | null;
  seed: number;
  finalAge: number;
  isAlive: boolean;
  youth: SimulationSegmentMetrics;
  midlife: SimulationSegmentMetrics;
};

function segmentAgeBounds(segment: SimulationLifeSegment): { min: number; max: number } {
  return segment === '0-30' ? { min: 0, max: 30 } : { min: 31, max: P3_EVAL_END_AGE };
}

function recordsInSegment(
  records: GameProcessReport['records'],
  segment: SimulationLifeSegment,
): GameProcessReport['records'] {
  const { min, max } = segmentAgeBounds(segment);
  return records.filter(record => record.age >= min && record.age <= max);
}

function replayInSegment(
  replay: GoldenLineReplayRecord[],
  segment: SimulationLifeSegment,
): GoldenLineReplayRecord[] {
  const { min, max } = segmentAgeBounds(segment);
  return replay.filter(record => record.age >= min && record.age <= max);
}

function lastReplayInSegment(
  replay: GoldenLineReplayRecord[],
  segment: SimulationLifeSegment,
): GoldenLineReplayRecord | undefined {
  const segmentReplay = replayInSegment(replay, segment);
  return segmentReplay[segmentReplay.length - 1];
}

function buildDeathStatus(
  report: GameProcessReport,
  segment: SimulationLifeSegment,
): SegmentDeathStatus {
  const { min, max } = segmentAgeBounds(segment);
  const diedInSegment = report.records.some(
    record =>
      record.age >= min &&
      record.age <= max &&
      record.gameState.player?.alive === false,
  );
  const segmentRecords = recordsInSegment(report.records, segment);
  const lastRecord = segmentRecords[segmentRecords.length - 1];
  const aliveAtEnd = lastRecord?.gameState.player?.alive ?? report.isAlive;

  return {
    isAliveAtSegmentEnd: aliveAtEnd,
    deathReason: report.deathReason,
    diedInSegment,
  };
}

function buildPayoffStatus(
  payoffMetrics: PayoffSampleSegmentMetrics,
): SegmentPayoffStatus {
  const rate = payoffMetrics.simulatedPayoffRate;
  return {
    ...payoffMetrics,
    threshold: PAYOFF_RATE_THRESHOLD,
    pass: payoffMetrics.keyChoicesMade === 0 ? true : rate >= PAYOFF_RATE_THRESHOLD,
  };
}

function buildSegmentMetrics(
  run: GoldenLineSimulationRun,
  segment: SimulationLifeSegment,
  payoffMetrics: PayoffSampleSegmentMetrics,
): SimulationSegmentMetrics {
  const segmentRecords = recordsInSegment(run.report.records, segment);
  const finalReplay = lastReplayInSegment(run.replay, segment);

  return {
    segment,
    ageRange: segmentAgeBounds(segment),
    eventCount: segmentRecords.length,
    choiceCount: segmentRecords.filter(record => record.eventType === 'choice').length,
    routeFlags: finalReplay?.routeFlags ?? [],
    deathStatus: buildDeathStatus(run.report, segment),
    payoffStatus: buildPayoffStatus(payoffMetrics),
  };
}

export function buildP3EvalSegmentReport(run: GoldenLineSimulationRun): P3EvalSegmentReport {
  const payoffSample = evaluatePayoffGate([run]).summary.samples.find(
    sample => sample.id === run.sample.id,
  );
  if (!payoffSample) {
    throw new Error(`Missing payoff summary for sample ${run.sample.id}`);
  }

  return {
    sampleId: run.sample.id,
    routeTrack: run.sample.routeTrack ?? null,
    seed: run.sample.seed,
    finalAge: run.report.finalAge,
    isAlive: run.report.isAlive,
    youth: buildSegmentMetrics(run, '0-30', payoffSample.segmentYouth),
    midlife: buildSegmentMetrics(run, '31-50', payoffSample.segmentMidlife),
  };
}

export function buildAllP3EvalSegmentReports(
  runs: GoldenLineSimulationRun[],
): P3EvalSegmentReport[] {
  return runs.map(buildP3EvalSegmentReport);
}
