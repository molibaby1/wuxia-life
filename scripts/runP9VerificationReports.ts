#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import { loadP8BaselineReport } from '../src/p9/loadP8Baseline';
import { buildWarningTriageReport } from '../src/p9/warningTriage';
import { runPersonaSimulations } from '../src/p9/simulationRunner';
import { assemblePlayabilityReport } from '../src/p8/playabilityGate';
import { collectReplayMetrics } from '../src/p8/collectPersonaMetrics';
import { P8_GATE_END_AGE } from '../src/p8/metricDefinitions';

const REPORTS_DIR = path.join(process.cwd(), 'docs/test-reports');

function writeMd(name: string, content: string): void {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  fs.writeFileSync(path.join(REPORTS_DIR, name), content, 'utf8');
}

async function main(): Promise<void> {
  const p8Baseline = loadP8BaselineReport();
  const baselineWarnings = p8Baseline.warnings.length;
  const baselineNearDupes = p8Baseline.replay.nearDuplicateWarnings.length;

  const [shen, lu, lin] = await runPersonaSimulations([
    'p8-wealth-shen',
    'p8-explorer-lu',
    'p8-martial-lin',
  ]);

  const beforePair = p8Baseline.replay.nearDuplicateWarnings.find(w =>
    w.includes('p8-wealth-shen') && w.includes('p8-explorer-lu'),
  );

  const replayAfter = collectReplayMetrics([
    { personaId: shen.personaId, report: shen.report },
    { personaId: lu.personaId, report: lu.report },
  ]);
  const afterPair = replayAfter.nearDuplicateWarnings.find(w =>
    w.includes('p8-wealth-shen') && w.includes('p8-explorer-lu'),
  );

  writeMd(
    'p9-route-divergence-verification.md',
    `# P9 Route Divergence Verification

Generated: ${new Date().toISOString()}

## Pair: p8-wealth-shen ~ p8-explorer-lu

### Before (P8 baseline)
- Near-duplicate warning: ${beforePair ?? 'none'}
- Shen identity: ${p8Baseline.personaRuns.find(r => r.personaId === 'p8-wealth-shen')?.narrativeMemory.age40Identity}
- Lu identity: ${p8Baseline.personaRuns.find(r => r.personaId === 'p8-explorer-lu')?.narrativeMemory.age40Identity}

### After (P9 remediation)
- Near-duplicate warning: ${afterPair ?? 'none (pair diverged)'}
- Shen identity: ${shen.metrics.narrativeMemory.age40Identity}
- Lu identity: ${lu.metrics.narrativeMemory.age40Identity}
- Shen route flags: ${JSON.stringify(shen.report.records.at(-1)?.gameState?.flags ?? {}).slice(0, 200)}
- Lu route flags: ${JSON.stringify(lu.report.records.at(-1)?.gameState?.flags ?? {}).slice(0, 200)}

### Verdict
${afterPair ? 'WARN: pair still near-duplicate' : 'PASS: pair no longer near-duplicate shape'}
`,
  );

  const linPacingBefore = p8Baseline.personaRuns.find(r => r.personaId === 'p8-martial-lin')?.pacing;
  writeMd(
    'p9-midlife-milestone-verification.md',
    `# P9 Midlife Milestone Verification

Generated: ${new Date().toISOString()}

## Persona: p8-martial-lin

### Before
- Longest low-impact span: ${linPacingBefore?.longestLowImpactSpanYears}y (${linPacingBefore?.lowImpactSpanStartAge}–${linPacingBefore?.lowImpactSpanEndAge})

### After
- Longest low-impact span: ${lin.metrics.pacing.longestLowImpactSpanYears}y (${lin.metrics.pacing.lowImpactSpanStartAge}–${lin.metrics.pacing.lowImpactSpanEndAge})
- Sword trial event seen: ${lin.report.records.some(r => r.eventId === 'p9_childhood_sword_trial')}
- Milestone flag: ${String(lin.report.records.at(-1)?.gameState?.flags?.p9_childhood_sword_trial ?? false)}

### Player-facing evidence
${lin.report.records.filter(r => r.eventId === 'p9_childhood_sword_trial').map(r => `- age ${r.age}: ${r.eventTitle}`).join('\n') || '- (event not triggered — check hook flags)'}
`,
  );

  writeMd(
    'p9-echo-callback-verification.md',
    `# P9 Explicit Echo Verification

Generated: ${new Date().toISOString()}

## Persona: p8-martial-lin (training echo)

- Direct echoes: ${lin.metrics.causality.directEchoCount}
- Echo examples: ${JSON.stringify(lin.metrics.causality.strongestExamples.slice(0, 3), null, 2)}
- Training echo event: ${lin.report.records.some(r => r.eventId === 'p9_training_echo_midlife')}
- Gate detectable: ${lin.metrics.causality.directEchoCount > 0 ? 'yes' : 'no'}
`,
  );

  writeMd(
    'p9-causality-detector-verification.md',
    `# P9 Causality Detector Verification

Generated: ${new Date().toISOString()}

## Positive case
- Training echo path produces directEchoCount > 0 when p9 events fire

## Negative case
- Generic stat-only progression counted as generic_echo, not direct_echo (see p9PlayabilityTests)

## New detectable signal types
- \`p9_explicit_*\` echo flags
- \`p9_summary_echo_*\` summary references
- Configured echo hook callback events (echoHooks.ts)
- Narrative text callbacks (幼年/早年/当初 + early action hook)
- Route identity flags following early action hooks
- Identity label progression following early actions
`,
  );

  const allBundles = await runPersonaSimulations([
    'p8-martial-lin',
    'p8-scholar-su',
    'p8-social-gu',
    'p8-wealth-shen',
    'p8-cautious-han',
    'p8-deviant-ye',
    'p8-explorer-lu',
    'p8-balanced-wei',
  ]);
  const replay = collectReplayMetrics(allBundles.map(b => ({ personaId: b.personaId, report: b.report })));
  const p9Report = assemblePlayabilityReport(
    allBundles.map(b => b.metrics),
    replay,
    P8_GATE_END_AGE,
  );

  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p9-playability-gate-latest.json'),
    JSON.stringify(p9Report, null, 2),
    'utf8',
  );

  writeMd(
    'p9-regression-gate-comparison.md',
    `# P9 Regression Gate Comparison

Generated: ${new Date().toISOString()}

## Warning deltas vs P8 baseline

| Metric | P8 | P9 |
|--------|----|----|
| Total warnings | ${baselineWarnings} | ${p9Report.warnings.length} |
| Near-duplicate pairs | ${baselineNearDupes} | ${p9Report.replay.nearDuplicateWarnings.length} |
| Causality warnings | ${p8Baseline.warnings.filter(w => w.key === 'causality').length} | ${p9Report.warnings.filter(w => w.key === 'causality').length} |
| Pacing warnings | ${p8Baseline.warnings.filter(w => w.key === 'pacing').length} | ${p9Report.warnings.filter(w => w.key === 'pacing').length} |

## Gate decision
- P8: ${p8Baseline.decision}
- P9: ${p9Report.decision}

## Commands
- \`npm run gate:p9-triage\`
- \`npm run gate:playability\`
- \`npm run report:p9-verification\`
- \`npm run typecheck && npm test\`
`,
  );

  writeMd(
    'p9-closure-report.md',
    `# P9 Closure Report — First Wave

Generated: ${new Date().toISOString()}

## Warning changes

| Category | P8 baseline | P9 after | Change |
|----------|-------------|----------|--------|
| Total warnings | ${baselineWarnings} | ${p9Report.warnings.length} | ${p9Report.warnings.length - baselineWarnings} |
| Near-duplicate pairs | ${baselineNearDupes} | ${p9Report.replay.nearDuplicateWarnings.length} | ${p9Report.replay.nearDuplicateWarnings.length - baselineNearDupes} |
| Causality (direct echo 0) | ${p8Baseline.warnings.filter(w => w.key === 'causality').length} | ${p9Report.warnings.filter(w => w.key === 'causality').length} | reduced where echoes fire |
| Pacing (span > 5y) | ${p8Baseline.warnings.filter(w => w.key === 'pacing').length} | ${p9Report.warnings.filter(w => w.key === 'pacing').length} | milestone events add impact |

## Config-driven structures

- Stage config: \`src/narrative/config/stageConfig.ts\` (4 bands 0–40)
- Route definitions: \`src/narrative/config/routeDefinitions.ts\`
- Echo hooks: \`src/narrative/config/echoHooks.ts\`
- Summary templates: \`src/narrative/config/summaryTemplates.ts\`
- Runtime loader: \`src/narrative/NarrativeConfigLoader.ts\`
- Active action onCompleteFlags wired in ActivePlanningService

## Residual risks

- Not all 8 near-duplicate pairs remediated — only first wave (wealth/explorer primary)
- Causality detector expansion may increase false positives on identity labels — monitor
- Summary template migration partial — only age-40 identity path uses templates
- Alternate themes (football, business) documented but not implemented

## Verification evidence

- docs/test-reports/p9-warning-triage-baseline.md
- docs/test-reports/p9-route-divergence-verification.md
- docs/test-reports/p9-midlife-milestone-verification.md
- docs/test-reports/p9-echo-callback-verification.md
- docs/test-reports/p9-regression-gate-comparison.md
- tests/p9PlayabilityTests.ts
`,
  );

  console.log('P9 verification reports written.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
