import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import routeConflictTable from '../src/data/route-conflict-table.json';
import { buildDeathRiskTelemetry } from './deathRiskTelemetry';
import {
  GOLDEN_LINE_SAMPLES,
  P3_EVAL_END_AGE,
  type GoldenLineRouteTrack,
  type GoldenLineSimulationRun,
  runAllGoldenLineSimulations,
} from './goldenLineSimulation';
import type { GameProcessReport } from '../tests/GameProcessSimulator';

/** US-002 §5.2 — minimum midlife route content per priority route. */
export const MIN_MIDLIFE_ROUTE_EVENTS = 3;
export const MIN_MIDLIFE_MANUAL_CHOICES = 2;
export const MIDLIFE_AGE_MIN = 31;
export const MIDLIFE_AGE_MAX = P3_EVAL_END_AGE;

export const WANDERER_MIDLIFE_EVENT_IDS = [
  'hero_old_case_returns',
  'hero_reputation_backlash',
  'hero_ally_pays_price',
  'hero_gray_judgment',
  'hero_freedom_settlement',
] as const;

const ACTIVE_LIFECYCLES = new Set(
  routeConflictTable.contradictionGateInput.activeLifecycles as string[],
);

export type MidlifeGateMetric =
  | 'continuity'
  | 'midlife_route_events'
  | 'midlife_manual_choices'
  | 'death_without_warning'
  | 'route_contradiction';

export type MidlifeGateFinding = {
  metric: MidlifeGateMetric;
  sampleId: string;
  age?: number;
  eventId?: string;
  detail: string;
  actual?: number;
  threshold?: number;
};

export type MidlifeGateResult = {
  pass: boolean;
  findings: MidlifeGateFinding[];
  failures: MidlifeGateFinding[];
  simulations: GoldenLineSimulationRun[];
};

function getStrongExclusionPairs(): Array<{ routeA: string; routeB: string }> {
  return routeConflictTable.priorityRoutePairs
    .filter(pair => pair.level === 'strong_exclusion')
    .map(pair => ({ routeA: pair.routeA, routeB: pair.routeB }));
}

function isRouteActive(
  routeStates: Record<string, { lifecycle: string; lockedIn: boolean }> | undefined,
  routeId: string,
): boolean {
  const state = routeStates?.[routeId];
  if (!state) {
    return false;
  }
  return ACTIVE_LIFECYCLES.has(state.lifecycle);
}

function detectRouteContradictions(
  routeStates: Record<string, { lifecycle: string; lockedIn: boolean }> | undefined,
): Array<{ routeA: string; routeB: string }> {
  const contradictions: Array<{ routeA: string; routeB: string }> = [];
  for (const pair of getStrongExclusionPairs()) {
    if (isRouteActive(routeStates, pair.routeA) && isRouteActive(routeStates, pair.routeB)) {
      contradictions.push(pair);
    }
  }
  return contradictions;
}

export function isMidlifeRouteEvent(
  routeTrack: GoldenLineRouteTrack,
  eventId: string,
): boolean {
  switch (routeTrack) {
    case 'sect':
      return eventId.startsWith('sect_midlife');
    case 'demonic':
      return eventId.startsWith('demonic_midlife');
    case 'wanderer':
      return (WANDERER_MIDLIFE_EVENT_IDS as readonly string[]).includes(eventId);
    default:
      return false;
  }
}

function midlifeRecords(report: GameProcessReport): GameProcessReport['records'] {
  return report.records.filter(
    record => record.age >= MIDLIFE_AGE_MIN && record.age <= MIDLIFE_AGE_MAX,
  );
}

function lastMidlifeRecord(
  report: GameProcessReport,
): GameProcessReport['records'][number] | undefined {
  const records = midlifeRecords(report);
  return records[records.length - 1];
}

function evaluatePriorityRouteMidlife(run: GoldenLineSimulationRun): MidlifeGateFinding[] {
  const findings: MidlifeGateFinding[] = [];
  const { sample, report } = run;
  const routeTrack = sample.routeTrack;
  if (!routeTrack) {
    return findings;
  }

  const sampleId = sample.id;

  if (!report.isAlive || report.finalAge < MIDLIFE_AGE_MAX) {
    findings.push({
      metric: 'continuity',
      sampleId,
      age: report.finalAge,
      detail: `Priority route must reach age ${MIDLIFE_AGE_MAX} alive; got age=${report.finalAge}, alive=${report.isAlive}`,
    });
  }

  const segmentRecords = midlifeRecords(report);
  const routeEvents = segmentRecords.filter(record =>
    isMidlifeRouteEvent(routeTrack, record.eventId),
  );
  const manualChoices = routeEvents.filter(record => record.eventType === 'choice');

  if (routeEvents.length < MIN_MIDLIFE_ROUTE_EVENTS) {
    const last = routeEvents[routeEvents.length - 1];
    findings.push({
      metric: 'midlife_route_events',
      sampleId,
      age: last?.age ?? MIDLIFE_AGE_MIN,
      eventId: last?.eventId,
      actual: routeEvents.length,
      threshold: MIN_MIDLIFE_ROUTE_EVENTS,
      detail: `Midlife route events=${routeEvents.length} < required ${MIN_MIDLIFE_ROUTE_EVENTS}`,
    });
  }

  if (manualChoices.length < MIN_MIDLIFE_MANUAL_CHOICES) {
    const last = manualChoices[manualChoices.length - 1] ?? routeEvents[routeEvents.length - 1];
    findings.push({
      metric: 'midlife_manual_choices',
      sampleId,
      age: last?.age ?? MIDLIFE_AGE_MIN,
      eventId: last?.eventId,
      actual: manualChoices.length,
      threshold: MIN_MIDLIFE_MANUAL_CHOICES,
      detail: `Midlife manual choices=${manualChoices.length} < required ${MIN_MIDLIFE_MANUAL_CHOICES}`,
    });
  }

  const diedInMidlife = segmentRecords.some(
    record => record.gameState.player?.alive === false,
  );
  if (diedInMidlife) {
    const deathRecord = [...segmentRecords]
      .reverse()
      .find(record => record.gameState.player?.alive === false);
    const telemetry = buildDeathRiskTelemetry(report, sampleId);
    findings.push({
      metric: telemetry?.deathWithoutWarning ? 'death_without_warning' : 'continuity',
      sampleId,
      age: deathRecord?.age ?? report.finalAge,
      eventId: deathRecord?.eventId ?? telemetry?.deathEventId,
      detail: telemetry?.deathWithoutWarning
        ? `Midlife death without readable warning at age ${deathRecord?.age ?? report.finalAge} (cause=${telemetry.deathCauseId})`
        : `Midlife death at age ${deathRecord?.age ?? report.finalAge} (cause=${telemetry?.deathCauseId ?? 'unknown'})`,
    });
  }

  const finalMidlife = lastMidlifeRecord(report);
  const contradictions = detectRouteContradictions(finalMidlife?.gameState.routeStates);
  for (const pair of contradictions) {
    findings.push({
      metric: 'route_contradiction',
      sampleId,
      age: finalMidlife?.age ?? MIDLIFE_AGE_MAX,
      detail: `Route contradiction: ${pair.routeA} and ${pair.routeB} both active (strong_exclusion)`,
    });
  }

  return findings;
}

export function evaluateMidlifeGate(
  simulations: GoldenLineSimulationRun[],
): MidlifeGateResult {
  const priorityRuns = simulations.filter(run => run.sample.routeTrack);
  const findings = priorityRuns.flatMap(evaluatePriorityRouteMidlife);
  const failures = findings;

  return {
    pass: failures.length === 0,
    findings,
    failures,
    simulations: priorityRuns,
  };
}

export async function runMidlifeGate(options?: {
  quiet?: boolean;
}): Promise<MidlifeGateResult> {
  if (options?.quiet) {
    process.env.WUXIA_ENGINE_QUIET = '1';
  }

  const prioritySamples = GOLDEN_LINE_SAMPLES.filter(sample => sample.routeTrack);
  if (!options?.quiet) {
    console.log(
      `\n[midlife-gate] Running ${prioritySamples.length} priority-route deterministic 0–${MIDLIFE_AGE_MAX} samples...\n`,
    );
  }

  const allRuns = await runAllGoldenLineSimulations();
  const priorityRuns = allRuns.filter(run => run.sample.routeTrack);

  if (!options?.quiet) {
    for (const run of priorityRuns) {
      const segment = midlifeRecords(run.report);
      const routeTrack = run.sample.routeTrack!;
      const routeCount = segment.filter(record =>
        isMidlifeRouteEvent(routeTrack, record.eventId),
      ).length;
      console.log(
        `  ✓ ${run.sample.id} finalAge=${run.report.finalAge} midlifeRouteEvents=${routeCount} alive=${run.report.isAlive}`,
      );
    }
  }

  return evaluateMidlifeGate(allRuns);
}

export function formatMidlifeGateFailure(finding: MidlifeGateFinding): string {
  const parts = [
    finding.sampleId,
    finding.age !== undefined ? `age=${finding.age}` : null,
    finding.eventId ? `event=${finding.eventId}` : null,
    `metric=${finding.metric}`,
    finding.detail,
  ].filter(Boolean);
  return parts.join(' | ');
}

export function writeMidlifeGateReport(result: MidlifeGateResult): string {
  const reportDir = resolve('docs/test-reports');
  const reportPath = resolve(reportDir, 'p3-midlife-gate.md');
  const lines = [
    '# P3 Midlife Gate (US-024)',
    '',
    `生成时间：${new Date().toISOString()}`,
    '',
    `结果：**${result.pass ? 'PASS' : 'FAIL'}**`,
    '',
    '## Thresholds',
    '',
    `- midlife age range: **${MIDLIFE_AGE_MIN}–${MIDLIFE_AGE_MAX}**`,
    `- minimum route events per priority route: **${MIN_MIDLIFE_ROUTE_EVENTS}**`,
    `- minimum manual choices per priority route: **${MIN_MIDLIFE_MANUAL_CHOICES}**`,
    '',
    '## Priority-route samples',
    '',
    '| Sample | Route | Final age | Alive | Midlife route events | Midlife manual choices |',
    '| --- | --- | ---: | --- | ---: | ---: |',
  ];

  for (const run of result.simulations) {
    const routeTrack = run.sample.routeTrack!;
    const segment = midlifeRecords(run.report);
    const routeEvents = segment.filter(record =>
      isMidlifeRouteEvent(routeTrack, record.eventId),
    );
    const manualChoices = routeEvents.filter(record => record.eventType === 'choice');
    lines.push(
      `| ${run.sample.id} | ${routeTrack} | ${run.report.finalAge} | ${run.report.isAlive ? 'yes' : 'no'} | ${routeEvents.length} | ${manualChoices.length} |`,
    );
  }

  if (result.failures.length > 0) {
    lines.push('', '## Failures', '', '| Sample | Age | Event | Metric | Detail |', '| --- | ---: | --- | --- | --- |');
    for (const finding of result.failures) {
      lines.push(
        `| ${finding.sampleId} | ${finding.age ?? '—'} | ${finding.eventId ?? '—'} | ${finding.metric} | ${finding.detail.replace(/\|/g, '\\|')} |`,
      );
    }
  } else {
    lines.push('', '## Failures', '', '_None — all priority-route midlife checks passed._');
  }

  lines.push('', 'Regenerate: `npm run gate:midlife`');
  mkdirSync(reportDir, { recursive: true });
  writeFileSync(reportPath, `${lines.join('\n')}\n`, 'utf8');
  return reportPath;
}
