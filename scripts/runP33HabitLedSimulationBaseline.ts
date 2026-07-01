#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import {
  formatP33RuntimeBaselineMarkdown,
  runP33RuntimeSimBaseline,
} from '../src/p25/p33HabitLedSimulationBaselines';

const REPORTS_DIR = path.join(process.cwd(), 'docs/test-reports');

function main(): void {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  const metrics = runP33RuntimeSimBaseline();

  const jsonPath = path.join(REPORTS_DIR, 'p33-runtime-sim-baseline-metrics.json');
  fs.writeFileSync(jsonPath, JSON.stringify(metrics, null, 2), 'utf8');

  const mdPath = path.join(REPORTS_DIR, 'p33-runtime-sim-baseline-delta.md');
  fs.writeFileSync(mdPath, formatP33RuntimeBaselineMarkdown(metrics), 'utf8');

  console.log(`Wrote ${jsonPath}`);
  console.log(`Wrote ${mdPath}`);
}

main();
