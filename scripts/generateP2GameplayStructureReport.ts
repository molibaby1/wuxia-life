import { mkdir, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { GameProcessSimulator } from '../tests/GameProcessSimulator';
import type { GameProcessReport } from '../src/types/simulationRecordTypes';
import { evaluateSimulationGate } from './gameplaySimulationGate';
import { formatDiagnosticsMarkdownSection } from './gameplaySimulationDiagnostics';

const OUTPUT_PATH = process.env.P2_GAMEPLAY_STRUCTURE_OUTPUT || 'artifacts/reports/us-023-p2-gameplay-structure-report.md';

type CoverageCheck = {
  key: string;
  label: string;
  patterns: string[];
};

const CHOICE_FEEDBACK_CHECKS: CoverageCheck[] = [
  {
    key: 'manual_case_exists',
    label: 'manual_choice_feedback_case',
    patterns: ['runChoiceFeedbackManualCoverageCase'],
  },
  {
    key: 'auto_case_exists',
    label: 'auto_resolve_choice_feedback_case',
    patterns: ['runChoiceFeedbackAutoResolveFallbackCase'],
  },
  {
    key: 'stat_impact_assertion',
    label: 'stat_impact_assertion',
    patterns: ['feedback?.player.statImpacts[0]?.stat'],
  },
  {
    key: 'relationship_impact_assertion',
    label: 'relationship_impact_assertion',
    patterns: ['feedback?.player.relationshipImpacts[0]?.relationId'],
  },
  {
    key: 'route_impact_assertion',
    label: 'route_impact_assertion',
    patterns: ['feedback?.player.routeImpact?.from', 'feedback?.player.routeImpact?.to'],
  },
  {
    key: 'long_term_flag_assertion',
    label: 'long_term_flag_assertion',
    patterns: ['feedback?.player.longTermFlags.some'],
  },
  {
    key: 'fallback_assertion',
    label: 'fallback_text_assertion',
    patterns: ['feedback?.diagnostic.fallbackUsed === true', 'feedback?.player.narrativeResult'],
  },
];

const SAMPLE_CONFIGS = [
  { id: 'martial-riser', playerName: '凌霄', gender: 'male' as const, seed: 11, choiceTendency: 'martial' as const },
  { id: 'merchant-weaver', playerName: '沈绫', gender: 'female' as const, seed: 37, choiceTendency: 'wealth' as const },
  { id: 'bond-keeper', playerName: '顾晚', gender: 'female' as const, seed: 73, choiceTendency: 'relationship' as const },
];

function findMetricValue(
  rows: ReturnType<typeof evaluateSimulationGate>['blockingMetrics'],
  key: string,
): string {
  const row = rows.find(item => item.key === key);
  if (!row || row.actualValue === null) {
    return 'N/A';
  }
  return `${(row.actualValue * 100).toFixed(2)}%`;
}

function runChoiceFeedbackCoverageScan() {
  const source = readFileSync('tests/AllTests.ts', 'utf-8');
  const results = CHOICE_FEEDBACK_CHECKS.map(check => {
    const pass = check.patterns.every(pattern => source.includes(pattern));
    return {
      ...check,
      pass,
    };
  });

  return {
    results,
    total: results.length,
    passed: results.filter(item => item.pass).length,
  };
}

function computeSaveConsistencySummary(reports: GameProcessReport[]) {
  const totalChecks = reports.reduce((sum, report) => sum + report.persistenceConsistency.totalChecks, 0);
  const passedChecks = reports.reduce((sum, report) => sum + report.persistenceConsistency.passedChecks, 0);
  const failedChecks = reports.reduce((sum, report) => sum + report.persistenceConsistency.failedChecks, 0);
  const passRate = totalChecks > 0 ? (passedChecks / totalChecks) * 100 : 100;
  return {
    totalChecks,
    passedChecks,
    failedChecks,
    passRate,
  };
}

function buildReport(params: {
  generatedAt: string;
  choiceFeedbackCoverage: ReturnType<typeof runChoiceFeedbackCoverageScan>;
  gate: ReturnType<typeof evaluateSimulationGate>;
  saveConsistency: ReturnType<typeof computeSaveConsistencySummary>;
  sampleReports: GameProcessReport[];
}) {
  const { generatedAt, choiceFeedbackCoverage, gate, saveConsistency, sampleReports } = params;
  const diagnosticsSection = formatDiagnosticsMarkdownSection(sampleReports);
  const metricRows = [...gate.blockingMetrics, ...gate.warningMetrics, ...gate.infoMetrics]
    .map(item => {
      const actual = item.actualValue === null ? 'N/A' : item.key === 'save_count'
        ? item.actualValue.toFixed(2)
        : `${(item.actualValue * 100).toFixed(2)}%`;
      return `| ${item.key} | ${item.severity} | ${actual} | ${item.status} | ${item.detail} |`;
    })
    .join('\n');

  const coverageRows = choiceFeedbackCoverage.results
    .map(item => `| ${item.label} | ${item.pass ? 'pass' : 'fail'} |`)
    .join('\n');

  const sampleRows = sampleReports
    .map(report => {
      const ending = report.statistics.endingSummary || report.deathReason || 'unknown';
      return `| ${report.config.playerName} | ${report.randomSeed ?? 'random'} | ${report.totalEvents} | ${report.totalChoices} | ${report.totalSaves} | ${report.totalLoads} | ${ending} |`;
    })
    .join('\n');

  return [
    '# US-023 P2 Gameplay Structure Report',
    '',
    '## Scope',
    '',
    `- generatedAt: \`${generatedAt}\``,
    '- sample strategy: fixed 3 persona samples (`martial-riser`, `merchant-weaver`, `bond-keeper`), complete-life simulation, save-restore enabled',
    '- evidence sources: `tests/AllTests.ts` (choice feedback coverage), `GameProcessSimulator` sample reports, `gameplaySimulationGate` metric evaluation',
    '',
    '## Acceptance Coverage',
    '',
    `- choice feedback coverage: ${choiceFeedbackCoverage.passed}/${choiceFeedbackCoverage.total}`,
    `- route completion rate: ${routeCompletionRate}`,
    `- route breakage rate: ${routeBreakageRate}`,
    `- simulation metrics: ${gate.decision === 'pass' ? 'pass' : 'fail'} (blocking fail count: ${gate.blockingMetrics.filter(item => item.status === 'fail').length})`,
    `- save consistency: ${saveConsistency.passedChecks}/${saveConsistency.totalChecks} (${saveConsistency.passRate.toFixed(2)}%)`,
    '',
    '## Choice Feedback Coverage Detail',
    '',
    '| coverage item | status |',
    '|---|---|',
    coverageRows,
    '',
    '## Simulation Sample Snapshot',
    '',
    '| persona | seed | total events | total choices | saves | loads | ending |',
    '|---|---:|---:|---:|---:|---:|---|',
    sampleRows,
    '',
    '## Simulation Metrics',
    '',
    '| metric | severity | actual | status | detail |',
    '|---|---|---:|---|---|',
    metricRows,
    '',
    '## Save Consistency',
    '',
    `- total consistency checks: ${saveConsistency.totalChecks}`,
    `- passed checks: ${saveConsistency.passedChecks}`,
    `- failed checks: ${saveConsistency.failedChecks}`,
    `- pass rate: ${saveConsistency.passRate.toFixed(2)}%`,
    '',
    diagnosticsSection,
    '## Residual Risks',
    '',
    '- Current route metrics are aggregated by final route lifecycle state, which can hide per-route progression volatility within one life.',
    '- Choice feedback coverage is assertion-source driven (test presence); it confirms regression coverage existence but not narrative quality scoring.',
    '- Current simulation snapshot contains warning/info-level metric breaches (for example route completion/death/save count), so P3 kickoff should bind follow-up thresholds and trend tracking before tightening release gates.',
    '',
    '## P3 Candidate Follow-ups',
    '',
    '- Split route completion/breakage metrics by route type (`main`/`secondary`) and add trend tracking across baseline snapshots.',
    '- Add narrative quality scoring for choice feedback (clarity/completeness) rather than structural assertions only.',
    '- Promote save consistency from aggregate pass-rate to mismatch taxonomy dashboard (field-level trend and root-cause buckets).',
    '',
    '## Regeneration Command',
    '',
    '```bash',
    'npm run report:p2-gameplay-structure',
    '```',
  ].join('\n');
}

async function main() {
  const choiceFeedbackCoverage = runChoiceFeedbackCoverageScan();
  const sampleReports: GameProcessReport[] = [];

  for (const sample of SAMPLE_CONFIGS) {
    const simulator = new GameProcessSimulator({
      playerName: sample.playerName,
      gender: sample.gender,
      simulateYears: 85,
      runUntilDeath: true,
      seed: sample.seed,
      choiceTendency: sample.choiceTendency,
      autoSaveMode: 'age',
      saveAgeInterval: 5,
      saveEventInterval: 10,
      enableSaveRestore: true,
      verbose: false,
    });
    const report = await simulator.simulate();
    sampleReports.push(report);
  }

  const gate = evaluateSimulationGate(sampleReports, []);
  const saveConsistency = computeSaveConsistencySummary(sampleReports);
  const reportContent = buildReport({
    generatedAt: new Date().toISOString(),
    choiceFeedbackCoverage,
    gate,
    saveConsistency,
    sampleReports,
  });

  await mkdir('artifacts/reports', { recursive: true });
  await writeFile(OUTPUT_PATH, reportContent, 'utf-8');

  console.log('[US-023] P2 gameplay structure report generated');
  console.log(`output=${OUTPUT_PATH}`);
  console.log(`choiceFeedbackCoverage=${choiceFeedbackCoverage.passed}/${choiceFeedbackCoverage.total}`);
  console.log(`saveConsistency=${saveConsistency.passedChecks}/${saveConsistency.totalChecks}`);
}

main().catch((error) => {
  console.error('[US-023] P2 gameplay structure report generation failed:', error);
  process.exitCode = 1;
});
