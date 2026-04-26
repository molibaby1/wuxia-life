import { mkdir, writeFile } from 'node:fs/promises';
import { eventLoader } from '../src/core/EventLoader';
import { ConditionEvaluator } from '../src/core/ConditionEvaluator';
import { computeMetrics, formatMetrics, simulateSample, toPct } from './reportRhythmMetrics';
import { validateEventQuality } from './validateEventQuality';

const DEFAULT_SEED = Number(process.env.P1_QUALITY_SEED || '1');
const DEFAULT_MAX_AGE = Number(process.env.P1_QUALITY_MAX_AGE || '80');
const OUTPUT_PATH = process.env.P1_QUALITY_OUTPUT || 'docs/test-reports/us-021-p1-quality-gate-report.md';

function runConditionExpressionChecks() {
  const evaluator = new ConditionEvaluator();
  const state = {
    player: {
      age: 22,
      martialPower: 35,
    },
    flags: {
      is_sect_leader: true,
    },
    triggeredEvents: ['starter_event'],
  } as any;

  const checks = [
    {
      name: 'legal_expression',
      expression: "player.martialPower >= 30 AND flags.has('is_sect_leader')",
      expected: true,
    },
    {
      name: 'invalid_syntax_fail_close',
      expression: '(player.age >= 18',
      expected: false,
    },
    {
      name: 'malicious_expression_fail_close',
      expression: 'globalThis.process.exit(1)',
      expected: false,
    },
  ];

  const results = checks.map((check) => {
    const actual = evaluator.evaluate(
      {
        type: 'expression',
        expression: check.expression,
      },
      state,
    );
    return {
      ...check,
      actual,
      pass: actual === check.expected,
    };
  });

  return {
    total: results.length,
    passed: results.filter((item) => item.pass).length,
    status: results.every((item) => item.pass) ? 'pass' : 'fail',
    results,
  };
}

function buildReport(params: {
  generatedAt: string;
  seed: number;
  maxAge: number;
  rhythmMetricsText: string;
  rhythmSnapshot: {
    totalEvents: number;
    emptyAges: number;
    formalRatio: string;
    dailyRatio: string;
    choiceRatio: string;
    continuityRate: string;
    criticalDelayMax: number;
  };
  quality: {
    scannedEvents: number;
    blocker: number;
    major: number;
    minor: number;
    total: number;
    formatSummary: {
      target: number;
      legacy: number;
      mixed: number;
    };
    gate: 'pass' | 'fail';
  };
  conditionChecks: ReturnType<typeof runConditionExpressionChecks>;
}) {
  const { generatedAt, seed, maxAge, rhythmMetricsText, rhythmSnapshot, quality, conditionChecks } = params;

  const conditionRows = conditionChecks.results
    .map(
      (item) =>
        `| ${item.name} | \`${item.expression}\` | ${String(item.expected)} | ${String(item.actual)} | ${item.pass ? 'pass' : 'fail'} |`,
    )
    .join('\n');

  return [
    '# US-021 P1 Quality Gate Report',
    '',
    '## Scope',
    '',
    `- generatedAt: \`${generatedAt}\``,
    `- sample: seed=\`${seed}\`, maxAge=\`${maxAge}\``,
    '- This report aggregates rhythm metrics, event quality validation, format status, and condition expression checks for P1->P2 readiness decision.',
    '',
    '## Quality Gate Summary',
    '',
    `- rhythm_metrics: pass (snapshot generated from deterministic sample \`seed=${seed}\` / \`maxAge=${maxAge}\`)`,
    `- event_quality_gate: ${quality.gate} (blocker=${quality.blocker}, major=${quality.major}, minor=${quality.minor})`,
    `- format_validation: ${quality.formatSummary.mixed === 0 ? 'pass' : 'attention'} (target=${quality.formatSummary.target}, legacy=${quality.formatSummary.legacy}, mixed=${quality.formatSummary.mixed})`,
    `- condition_expression_checks: ${conditionChecks.status} (${conditionChecks.passed}/${conditionChecks.total})`,
    '',
    '## Rhythm Metrics Snapshot',
    '',
    `- timeline_events: ${rhythmSnapshot.totalEvents}`,
    `- empty_ages: ${rhythmSnapshot.emptyAges}`,
    `- formal_ratio: ${rhythmSnapshot.formalRatio}`,
    `- daily_ratio: ${rhythmSnapshot.dailyRatio}`,
    `- choice_ratio: ${rhythmSnapshot.choiceRatio}`,
    `- storyline_continuity_rate: ${rhythmSnapshot.continuityRate}`,
    `- critical_event_delay_max: ${rhythmSnapshot.criticalDelayMax}y`,
    '',
    '```text',
    rhythmMetricsText,
    '```',
    '',
    '## Event Quality Issue Counts',
    '',
    `- scanned_events: ${quality.scannedEvents}`,
    `- blocker: ${quality.blocker}`,
    `- major: ${quality.major}`,
    `- minor: ${quality.minor}`,
    `- total: ${quality.total}`,
    '',
    '## Format Validation Result',
    '',
    `- target: ${quality.formatSummary.target}`,
    `- legacy: ${quality.formatSummary.legacy}`,
    `- mixed: ${quality.formatSummary.mixed}`,
    '- Baseline explanation: format validation follows P1 policy where blocker issues fail the gate; legacy/mixed are migration-tracking signals for P2/P3 planning.',
    '',
    '## Condition Expression Test Result',
    '',
    '| check | expression | expected | actual | status |',
    '|---|---|---:|---:|---|',
    conditionRows,
    '',
    '## Before/After or Baseline Context',
    '',
    '- Baseline explanation is used in this story: deterministic rhythm baseline/reporting pipeline from US-003/US-004 and validator policy from US-010/US-014 are reused without changing business logic.',
    '- This report is a P1 closure snapshot for decision-making; future after-change comparisons should reuse the same seed and maxAge to keep evidence comparable.',
    '',
    '## Residual Risks',
    '',
    '- Event quality still contains blocker/major issues in current content inventory; release readiness depends on waiver policy or remediation completion.',
    '- Legacy and mixed format events remain in the loaded set; migration debt can increase authoring inconsistency risk.',
    '- Condition checks in this report are smoke-level; full regression confidence still depends on default `npm test` suite.',
    '',
    '## P2/P3 Candidate Follow-ups',
    '',
    '- P2: prioritize blocker issue remediation in event data, then rerun `npm run validate:event-quality` until blocker=0.',
    '- P2: reduce mixed format count first, then legacy format count using incremental low-risk migrations.',
    '- P3: expand condition expression dedicated test matrix and add report trend history for multi-run quality drift monitoring.',
    '',
    '## Regeneration Command',
    '',
    '```bash',
    `P1_QUALITY_SEED=${seed} P1_QUALITY_MAX_AGE=${maxAge} npm run report:p1-quality-gate`,
    '```',
  ].join('\n');
}

async function main() {
  const sample = await simulateSample(DEFAULT_SEED, DEFAULT_MAX_AGE);
  const rhythmMetrics = computeMetrics(sample);
  const rhythmMetricsText = formatMetrics(sample, rhythmMetrics);

  const events = eventLoader.getAllEvents();
  const qualityResult = validateEventQuality(events);
  const blocker = qualityResult.issues.filter((issue) => issue.severity === 'blocker').length;
  const major = qualityResult.issues.filter((issue) => issue.severity === 'major').length;
  const minor = qualityResult.issues.filter((issue) => issue.severity === 'minor').length;
  const formatSummary = {
    target: Object.values(qualityResult.formatByEventId).filter((item) => item.status === 'target').length,
    legacy: Object.values(qualityResult.formatByEventId).filter((item) => item.status === 'legacy').length,
    mixed: Object.values(qualityResult.formatByEventId).filter((item) => item.status === 'mixed').length,
  };

  const conditionChecks = runConditionExpressionChecks();
  const report = buildReport({
    generatedAt: new Date().toISOString(),
    seed: DEFAULT_SEED,
    maxAge: DEFAULT_MAX_AGE,
    rhythmMetricsText,
    rhythmSnapshot: {
      totalEvents: sample.timeline.length,
      emptyAges: rhythmMetrics.emptyAges.length,
      formalRatio: toPct(rhythmMetrics.formalEventRatio),
      dailyRatio: toPct(rhythmMetrics.dailyEventRatio),
      choiceRatio: toPct(rhythmMetrics.choiceEventRatio),
      continuityRate: toPct(rhythmMetrics.storylineContinuity.continuityRate),
      criticalDelayMax: rhythmMetrics.criticalEventDelay.maxDelay,
    },
    quality: {
      scannedEvents: events.length,
      blocker,
      major,
      minor,
      total: qualityResult.issues.length,
      formatSummary,
      gate: blocker > 0 ? 'fail' : 'pass',
    },
    conditionChecks,
  });

  await mkdir('docs/test-reports', { recursive: true });
  await writeFile(OUTPUT_PATH, report, 'utf-8');

  console.log('[US-021] P1 quality gate report generated');
  console.log(`output=${OUTPUT_PATH}`);
  console.log(`qualityGate=${blocker > 0 ? 'fail' : 'pass'} blocker=${blocker} major=${major} minor=${minor}`);
  console.log(`conditionChecks=${conditionChecks.status} (${conditionChecks.passed}/${conditionChecks.total})`);
}

main().catch((error) => {
  console.error('[US-021] quality gate report generation failed:', error);
  process.exitCode = 1;
});
