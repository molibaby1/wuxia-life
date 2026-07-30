import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  evaluatePayoffGate,
  type PayoffGateEvaluation,
  type PayoffBlockReason,
  type PayoffFindingType,
  type PayoffSegment,
} from './goldenLinePayoffGate';
import eventAssetManifest from '../src/data/event-asset-manifest.json';
import { validateEventQuality } from './validateEventQuality';
import { scanGoldenLineFeedback } from './reportGoldenLineFeedback';
import { eventLoader } from '../src/core/EventLoader';
import {
  GOLDEN_LINE_END_AGE,
  type GoldenLineSimulationRun,
  runAllP3EvalSimulations,
} from './goldenLineSimulation';

const MAX_EVENT_GAP_YEARS = 2;
const MIN_MANUAL_CHOICES = 6;

type GateSeverity = 'blocker' | 'warning' | 'info';

export type GoldenLineGateFinding = {
  gate: string;
  severity: GateSeverity;
  status: 'pass' | 'fail' | 'warning';
  sampleId?: string;
  detail: string;
  age?: number;
  eventId?: string;
  choiceId?: string;
  expectedPayoffEventIds?: string[];
  blockReason?: PayoffBlockReason;
  findingType?: PayoffFindingType;
  segment?: PayoffSegment;
  gapId?: string;
};

export type GoldenLineGateResult = {
  pass: boolean;
  findings: GoldenLineGateFinding[];
  simulations: GoldenLineSimulationRun[];
  activeScope: ActiveScopeReclassification;
  feedbackIssueCount: number;
  payoffEvaluation: PayoffGateEvaluation;
};

type ManifestEvent = {
  eventId: string;
  status: string;
};

export type ActiveScopeReclassification = {
  activeBlockerCount: number;
  totalIssueCount: number;
  deferredWarningCount: number;
  candidateWarningCount: number;
  activeBlockers: Array<{ eventId: string; issueType: string; explanation: string }>;
  summaryByStatus: Record<string, { blocker: number; major: number; minor: number }>;
};

const PRIORITY_ROUTE_EXPECTATIONS: Record<
  string,
  { primaryFlag: string }
> = {
  sect: { primaryFlag: 'route_orthodox' },
  wanderer: { primaryFlag: 'route_wanderer' },
  demonic: { primaryFlag: 'route_demonic' },
};

function isMeaningfulRecord(eventId: string): boolean {
  return eventId !== 'no_event';
}

function evaluateContinuityForRun(run: GoldenLineSimulationRun): GoldenLineGateFinding[] {
  const findings: GoldenLineGateFinding[] = [];
  const { sample, report, replay } = run;
  const sampleId = sample.id;

  if (!report.isAlive || report.finalAge < GOLDEN_LINE_END_AGE) {
    findings.push({
      gate: 'continuity',
      severity: 'blocker',
      status: 'fail',
      sampleId,
      detail: `Golden scenario must reach age ${GOLDEN_LINE_END_AGE} alive; got age=${report.finalAge}, alive=${report.isAlive}, death=${report.deathReason ?? 'n/a'}`,
      age: report.finalAge,
    });
  }

  if (report.totalChoices < MIN_MANUAL_CHOICES) {
    findings.push({
      gate: 'continuity',
      severity: 'blocker',
      status: 'fail',
      sampleId,
      detail: `Manual choice events=${report.totalChoices} < required ${MIN_MANUAL_CHOICES}`,
    });
  }

  const meaningful = replay.filter(record => isMeaningfulRecord(record.eventId));
  for (let index = 1; index < meaningful.length; index += 1) {
    const prev = meaningful[index - 1];
    const current = meaningful[index];
    const gap = current.age - prev.age;
    if (gap > MAX_EVENT_GAP_YEARS) {
      findings.push({
        gate: 'continuity',
        severity: 'blocker',
        status: 'fail',
        sampleId,
        detail: `Unexplained event gap ${gap}y between ${prev.eventId} (age ${prev.age}) and ${current.eventId} (age ${current.age}); max ${MAX_EVENT_GAP_YEARS}y`,
        age: current.age,
        eventId: current.eventId,
      });
    }
  }

  if (findings.length === 0) {
    findings.push({
      gate: 'continuity',
      severity: 'info',
      status: 'pass',
      sampleId,
      detail: `Continuity OK: manualChoices=${report.totalChoices}, finalAge=${report.finalAge}`,
    });
  }

  return findings;
}

function evaluateRouteHealth(runs: GoldenLineSimulationRun[]): GoldenLineGateFinding[] {
  const findings: GoldenLineGateFinding[] = [];
  const routeSamples = runs.filter(run => run.sample.routeTrack);

  let entryHits = 0;

  for (const run of routeSamples) {
    const track = run.sample.routeTrack!;
    const expectation = PRIORITY_ROUTE_EXPECTATIONS[track];
    const final = run.replay[run.replay.length - 1];
    if (!final || !expectation) {
      continue;
    }

    const hasEntry = final.routeFlags.includes(expectation.primaryFlag);
    if (hasEntry) {
      entryHits += 1;
    } else {
      findings.push({
        gate: 'route_health',
        severity: 'blocker',
        status: 'fail',
        sampleId: run.sample.id,
        detail: `Missing route entry flag ${expectation.primaryFlag} for track ${track}`,
        age: final.age,
      });
    }

  }

  const routeCount = routeSamples.length;
  findings.push({
    gate: 'route_health',
    severity: 'info',
    status: 'pass',
    detail: `entryRate=${routeCount ? ((entryHits / routeCount) * 100).toFixed(0) : 'n/a'}%`,
  });

  for (const run of runs) {
    if (run.sample.routeTrack) {
      continue;
    }
    const final = run.replay[run.replay.length - 1];
    void final;
  }

  return findings;
}

function evaluateFeedbackGate(): GoldenLineGateFinding[] {
  const issues = scanGoldenLineFeedback();
  if (issues.length === 0) {
    return [
      {
        gate: 'feedback',
        severity: 'info',
        status: 'pass',
        detail: 'All active golden-line manual choices have explicit player-facing feedback',
      },
    ];
  }

  return issues.map(issue => ({
    gate: 'feedback',
    severity: 'blocker',
    status: 'fail',
    detail: `${issue.reason}`,
    eventId: issue.eventId,
    choiceId: issue.choiceId,
  }));
}

function loadManifestStatusByEventId(): Map<string, string> {
  const events = (eventAssetManifest as { events: ManifestEvent[] }).events;
  return new Map(events.map(entry => [entry.eventId, entry.status]));
}

function reclassifyActiveScopeIssues(): ActiveScopeReclassification {
  const statusByEventId = loadManifestStatusByEventId();
  const qualityIssues = validateEventQuality(eventLoader.getAllEvents()).issues;

  const summaryByStatus: ActiveScopeReclassification['summaryByStatus'] = {};
  const activeBlockers: ActiveScopeReclassification['activeBlockers'] = [];
  let deferredWarningCount = 0;
  let candidateWarningCount = 0;

  for (const issue of qualityIssues) {
    const status = statusByEventId.get(issue.eventId) ?? 'unknown';
    if (!summaryByStatus[status]) {
      summaryByStatus[status] = { blocker: 0, major: 0, minor: 0 };
    }
    summaryByStatus[status][issue.severity] += 1;

    const isElevatedSeverity = issue.severity === 'blocker' || issue.severity === 'major';
    if (status === 'active' && issue.severity === 'blocker') {
      activeBlockers.push({
        eventId: issue.eventId,
        issueType: issue.issueType,
        explanation: issue.explanation,
      });
    } else if ((status === 'deferred' || status === 'candidate') && isElevatedSeverity) {
      if (status === 'deferred') {
        deferredWarningCount += 1;
      } else {
        candidateWarningCount += 1;
      }
    }
  }

  return {
    activeBlockerCount: activeBlockers.length,
    totalIssueCount: qualityIssues.length,
    deferredWarningCount,
    candidateWarningCount,
    activeBlockers,
    summaryByStatus,
  };
}

function evaluateActiveScopeGate(
  reclassification: ActiveScopeReclassification,
): GoldenLineGateFinding[] {
  const findings: GoldenLineGateFinding[] = [
    {
      gate: 'active_scope',
      severity: 'info',
      status: 'pass',
      detail: `activeBlockers=${reclassification.activeBlockerCount}, totalIssues=${reclassification.totalIssueCount}, deferredWarnings=${reclassification.deferredWarningCount}, candidateWarnings=${reclassification.candidateWarningCount}`,
    },
  ];

  for (const blocker of reclassification.activeBlockers.slice(0, 20)) {
    findings.push({
      gate: 'active_scope',
      severity: 'blocker',
      status: 'fail',
      eventId: blocker.eventId,
      detail: `${blocker.issueType}: ${blocker.explanation}`,
    });
  }

  if (reclassification.activeBlockers.length > 20) {
    findings.push({
      gate: 'active_scope',
      severity: 'blocker',
      status: 'fail',
      detail: `…and ${reclassification.activeBlockers.length - 20} more active-scope blockers`,
    });
  }

  return findings;
}

export function evaluateGoldenLineGates(
  simulations: GoldenLineSimulationRun[],
): GoldenLineGateResult {
  const findings: GoldenLineGateFinding[] = [];
  const payoffEvaluation = evaluatePayoffGate(simulations);

  for (const run of simulations) {
    findings.push(...evaluateContinuityForRun(run));
  }

  findings.push(...payoffEvaluation.findings);
  findings.push(...evaluateRouteHealth(simulations));
  findings.push(...evaluateFeedbackGate());

  const activeScope = reclassifyActiveScopeIssues();
  findings.push(...evaluateActiveScopeGate(activeScope));

  const feedbackIssueCount = scanGoldenLineFeedback().length;
  const pass = !findings.some(finding => finding.severity === 'blocker' && finding.status === 'fail');

  return {
    pass,
    findings,
    simulations,
    activeScope,
    feedbackIssueCount,
    payoffEvaluation,
  };
}

export async function runGoldenLineExperienceGates(options?: {
  quiet?: boolean;
  simulations?: GoldenLineSimulationRun[];
}): Promise<GoldenLineGateResult> {
  if (options?.quiet) {
    process.env.WUXIA_ENGINE_QUIET = '1';
  }

  const simulations =
    options?.simulations ?? (await runAllP3EvalSimulations());

  if (!options?.quiet) {
    console.log(
      `\n[golden-line-gate] Running ${simulations.length} P3-EVAL deterministic 0–${GOLDEN_LINE_END_AGE} scenarios...\n`,
    );
    for (const run of simulations) {
      console.log(
        `  ✓ ${run.sample.id} finalAge=${run.report.finalAge} events=${run.report.totalEvents} choices=${run.report.totalChoices}`,
      );
    }
  }

  return evaluateGoldenLineGates(simulations);
}

export function writeGoldenLineGateReport(result: GoldenLineGateResult): string {
  const reportDir = resolve('docs/test-reports');
  const reportPath = resolve(reportDir, 'product-experience-governance-golden-line-gates.md');
  const lines = [
    '# Product Experience Governance — Golden Line Gates (PXG4)',
    '',
    `生成时间：${new Date().toISOString()}`,
    '',
    `结果：**${result.pass ? 'PASS' : 'FAIL'}**`,
    '',
    '## Active scope summary',
    '',
    `- active blockers: **${result.activeScope.activeBlockerCount}**`,
    `- total quality issues: ${result.activeScope.totalIssueCount}`,
    `- deferred warnings (major+): ${result.activeScope.deferredWarningCount}`,
    `- candidate warnings (major+): ${result.activeScope.candidateWarningCount}`,
    '',
    '## Simulation samples',
    '',
    '| Sample | Route track | Final age | Choices |',
    '| --- | --- | --- | --- |',
  ];

  for (const run of result.simulations) {
    lines.push(
      `| ${run.sample.id} | ${run.sample.routeTrack ?? 'neutral'} | ${run.report.finalAge} | ${run.report.totalChoices} |`,
    );
  }

  lines.push('', '## Payoff coverage (static vs simulated)', '');
  const payoffSummary = result.payoffEvaluation.summary;
  lines.push(
    `- static map: **${(payoffSummary.staticPayoffRate * 100).toFixed(1)}%**`,
    `- simulated threshold: **${payoffSummary.simulatedPayoffThreshold * 100}%**`,
    `- missed opportunities (simulated_gap): **${payoffSummary.missedOpportunityCount}**`,
    `- never-reached key choices: **${payoffSummary.neverReachedKeyChoiceCount}**`,
    '',
    '| Sample | Sim rate | Static | Pass |',
    '| --- | ---: | ---: | --- |',
  );
  for (const sample of payoffSummary.samples) {
    lines.push(
      `| ${sample.id} | ${(sample.simulatedPayoffRate * 100).toFixed(1)}% | ${(payoffSummary.staticPayoffRate * 100).toFixed(1)}% | ${sample.pass ? 'yes' : 'no'} |`,
    );
  }

  const payoffGaps = result.payoffEvaluation.missedOpportunities.filter(
    opportunity => opportunity.findingType === 'simulated_gap',
  );
  if (payoffGaps.length > 0) {
    lines.push(
      '',
      '## Missed payoff opportunities',
      '',
      '| Sample | Choice | Expected payoff | Block reason |',
      '| --- | --- | --- | --- |',
    );
    for (const gap of payoffGaps) {
      lines.push(
        `| ${gap.sampleId} | ${gap.choiceId} @ ${gap.keyChoiceEventId} | ${gap.expectedPayoffEventIds.join(', ')} | ${gap.blockReason} |`,
      );
    }
  }

  lines.push('', '## Gate findings', '', '| Gate | Severity | Status | Detail |', '| --- | --- | --- | --- |');
  for (const finding of result.findings) {
    if (finding.status === 'pass' && finding.severity === 'info') {
      continue;
    }
    lines.push(
      `| ${finding.gate} | ${finding.severity} | ${finding.status} | ${finding.detail.replace(/\|/g, '\\|')} |`,
    );
  }

  lines.push('', 'Regenerate: `npm run gate:golden-line`');
  mkdirSync(reportDir, { recursive: true });
  writeFileSync(reportPath, `${lines.join('\n')}\n`, 'utf8');
  return reportPath;
}
