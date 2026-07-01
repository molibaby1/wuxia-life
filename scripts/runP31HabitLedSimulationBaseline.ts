#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import { runP31HabitLedSimulationBaseline } from '../src/p25/p31HabitLedSimulationBaselines';

const REPORTS_DIR = path.join(process.cwd(), 'docs/test-reports');

function main(): void {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  const metrics = runP31HabitLedSimulationBaseline();

  const jsonPath = path.join(REPORTS_DIR, 'p31-habit-led-sim-baseline-metrics.json');
  fs.writeFileSync(jsonPath, JSON.stringify(metrics, null, 2), 'utf8');

  const md = [
    '# P31 Habit-Led Sim Baseline Delta',
    '',
    `Generated: ${metrics.generatedAt}`,
    '',
    '## Command',
    '',
    '```bash',
    metrics.command,
    '```',
    '',
    '## Delta vs P30 Closure Baseline',
    '',
    'P30 habit-led fixtures seed `lifeStates.*` + P27–P29 bridge flags only (0% unlock). P31 applies threshold-gated key-choice bridges before composite eval.',
    '',
    '| Outcome | P30 habit-led unlock | P31 habit-led unlock (bridges) | Delta |',
    '| --- | --- | --- | --- |',
    `| \`jianghu_renown_sage\` | ${(metrics.p30HabitLedBaseline.jianghu_renown_sage_unlockRate * 100).toFixed(0)}% | ${(metrics.p31HabitLedUnlock.jianghu_renown_sage.unlockRate * 100).toFixed(0)}% | +${((metrics.p31HabitLedUnlock.jianghu_renown_sage.unlockRate - metrics.p30HabitLedBaseline.jianghu_renown_sage_unlockRate) * 100).toFixed(0)}pp |`,
    `| \`medical_sage_healer\` | ${(metrics.p30HabitLedBaseline.medical_sage_healer_unlockRate * 100).toFixed(0)}% | ${(metrics.p31HabitLedUnlock.medical_sage_healer.unlockRate * 100).toFixed(0)}% | +${((metrics.p31HabitLedUnlock.medical_sage_healer.unlockRate - metrics.p30HabitLedBaseline.medical_sage_healer_unlockRate) * 100).toFixed(0)}pp |`,
    '',
    '## Interpretation',
    '',
    metrics.deltaSummary,
    '',
    '## P31 bridge-resolved path snapshots',
    '',
    ...metrics.p31HabitLedUnlock.jianghu_renown_sage.paths.map(
      s =>
        `- \`${s.pathId}\` → \`${s.outcomeId}\`: unlocked=${s.unlocked}, keyChoicesMet=${s.keyChoicesMet}, bridgeFlags=[${s.bridgeFlagsPresent.join(', ')}]`,
    ),
    ...metrics.p31HabitLedUnlock.medical_sage_healer.paths.map(
      s =>
        `- \`${s.pathId}\` → \`${s.outcomeId}\`: unlocked=${s.unlocked}, keyChoicesMet=${s.keyChoicesMet}, bridgeFlags=[${s.bridgeFlagsPresent.join(', ')}]`,
    ),
    '',
  ].join('\n');

  const mdPath = path.join(REPORTS_DIR, 'p31-habit-led-sim-baseline-delta.md');
  fs.writeFileSync(mdPath, md, 'utf8');

  console.log(`Wrote ${jsonPath}`);
  console.log(`Wrote ${mdPath}`);
}

main();
