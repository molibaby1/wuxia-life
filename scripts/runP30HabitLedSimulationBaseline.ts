#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import { runP30HabitLedSimulationBaseline } from '../src/p25/p30HabitLedSimulationBaselines';

const REPORTS_DIR = path.join(process.cwd(), 'docs/test-reports');

function main(): void {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  const metrics = runP30HabitLedSimulationBaseline();

  const jsonPath = path.join(REPORTS_DIR, 'p30-habit-led-sim-baseline-metrics.json');
  fs.writeFileSync(jsonPath, JSON.stringify(metrics, null, 2), 'utf8');

  const md = [
    '# P30 Habit-Led Sim Baseline Delta',
    '',
    `Generated: ${metrics.generatedAt}`,
    '',
    '## Command',
    '',
    '```bash',
    metrics.command,
    '```',
    '',
    '## Delta vs P29 Closure Baseline',
    '',
    'P29 representative paths (`jianghu_renown_path`, `medical_sage_path`) direct-seed achievement flags. P30 habit-led fixtures seed `lifeStates.*` + P27–P29 bridge flags only.',
    '',
    '| Outcome | P29 direct-flag unlock | P30 habit-led unlock | P30 partial progress (stats ok, key_choices gap) | Trace-linked P27–P29 events |',
    '| --- | --- | --- | --- | --- |',
    `| \`jianghu_renown_sage\` | ${(metrics.p29DirectFlagBaseline.jianghu_renown_path_unlockRate * 100).toFixed(0)}% | ${(metrics.habitLedObservability.jianghu_renown_sage.unlockRate * 100).toFixed(0)}% | ${(metrics.habitLedObservability.jianghu_renown_sage.partialProgressRate * 100).toFixed(0)}% | ${metrics.habitLedObservability.jianghu_renown_sage.traceLinkedEventCount} |`,
    `| \`medical_sage_healer\` | ${(metrics.p29DirectFlagBaseline.medical_sage_path_unlockRate * 100).toFixed(0)}% | ${(metrics.habitLedObservability.medical_sage_healer.unlockRate * 100).toFixed(0)}% | ${(metrics.habitLedObservability.medical_sage_healer.partialProgressRate * 100).toFixed(0)}% | ${metrics.habitLedObservability.medical_sage_healer.traceLinkedEventCount} |`,
    '',
    '## Interpretation',
    '',
    metrics.deltaSummary,
    '',
    '## Habit-led path snapshots',
    '',
    ...metrics.habitLedObservability.jianghu_renown_sage.paths.map(
      s =>
        `- \`${s.pathId}\` → \`${s.outcomeId}\`: unlocked=${s.unlocked}, bridgeFlags=[${s.bridgeFlagsPresent.join(', ')}], socialMomentum=${s.habitAxisValue}`,
    ),
    ...metrics.habitLedObservability.medical_sage_healer.paths.map(
      s =>
        `- \`${s.pathId}\` → \`${s.outcomeId}\`: unlocked=${s.unlocked}, bridgeFlags=[${s.bridgeFlagsPresent.join(', ')}], studyHabit=${s.habitAxisValue}`,
    ),
    '',
  ].join('\n');

  const mdPath = path.join(REPORTS_DIR, 'p30-habit-led-sim-baseline-delta.md');
  fs.writeFileSync(mdPath, md, 'utf8');

  console.log(`Wrote ${jsonPath}`);
  console.log(`Wrote ${mdPath}`);
}

main();
