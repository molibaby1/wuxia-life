#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import {
  formatP32RuntimeBaselineMarkdown,
  runP32RuntimeSimBaseline,
} from '../src/p25/p32HabitLedSimulationBaselines';

const REPORTS_DIR = path.join(process.cwd(), 'docs/test-reports');

function main(): void {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  const metrics = runP32RuntimeSimBaseline();

  const jsonPath = path.join(REPORTS_DIR, 'p32-runtime-sim-baseline-metrics.json');
  fs.writeFileSync(jsonPath, JSON.stringify(metrics, null, 2), 'utf8');

  const mdPath = path.join(REPORTS_DIR, 'p32-runtime-sim-baseline-delta.md');
  fs.writeFileSync(mdPath, formatP32RuntimeBaselineMarkdown(metrics), 'utf8');

  console.log(`Wrote ${jsonPath}`);
  console.log(`Wrote ${mdPath}`);
}

main();
