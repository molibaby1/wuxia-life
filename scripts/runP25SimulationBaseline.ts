#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import { runP25ConsequenceConsistencySlice } from '../src/p25/validationSlices';
import {
  P25_SIMULATION_BASELINE_CONFIG,
  runP25SimulationBaseline,
} from '../src/p25/simulationBaselines';

const REPORTS_DIR = path.join(process.cwd(), 'artifacts/reports');

function main(): void {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  const metrics = runP25SimulationBaseline();
  const consistency = runP25ConsequenceConsistencySlice();
  metrics.highSeverityContradictionCount = consistency.criticalCount;

  const outPath = path.join(REPORTS_DIR, 'p25-lifetime-simulation-baseline-metrics.json');
  fs.writeFileSync(outPath, JSON.stringify(metrics, null, 2), 'utf8');

  const md = [
    '# P25 Simulation Acceptance Baseline (US-006)',
    '',
    `Generated: ${metrics.generatedAt}`,
    '',
    '## Command',
    '',
    '```bash',
    P25_SIMULATION_BASELINE_CONFIG.command,
    '```',
    '',
    `Samples: ${metrics.config.sampleCount} (seeds ${metrics.config.seedStart}–${metrics.config.seedEnd})`,
    '',
    '## Metrics',
    '',
    `- pathDivergenceProxy: ${metrics.pathDivergenceProxy.toFixed(3)}`,
    `- highSeverityContradictionCount: ${metrics.highSeverityContradictionCount}`,
    '',
    '### Achievement unlock rates',
    '',
    ...Object.entries(metrics.achievementUnlockRates).map(
      ([id, rate]) => `- \`${id}\`: ${(rate * 100).toFixed(1)}%`,
    ),
    '',
    '## Wave 1 acceptance direction',
    '',
    metrics.wave1AcceptanceDirection,
    '',
  ].join('\n');

  fs.writeFileSync(path.join(REPORTS_DIR, 'p25-lifetime-simulation-baseline-metrics.md'), md, 'utf8');
  console.log(`Wrote ${outPath}`);
  console.log(`pathDivergenceProxy=${metrics.pathDivergenceProxy.toFixed(3)}`);
}

main();
