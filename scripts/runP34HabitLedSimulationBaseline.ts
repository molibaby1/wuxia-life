#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import {
  formatP34LifetimeBaselineMarkdown,
  runP34LifetimeSimBaseline,
} from '../src/p25/p34HabitLedSimulationBaselines';

const REPORTS_DIR = path.join(process.cwd(), 'artifacts/reports');

function main(): void {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  const metrics = runP34LifetimeSimBaseline();

  const jsonPath = path.join(REPORTS_DIR, 'p34-lifetime-sim-baseline-metrics.json');
  fs.writeFileSync(jsonPath, JSON.stringify(metrics, null, 2), 'utf8');

  const mdPath = path.join(REPORTS_DIR, 'p34-lifetime-sim-baseline-delta.md');
  fs.writeFileSync(mdPath, formatP34LifetimeBaselineMarkdown(metrics), 'utf8');

  console.log(`Wrote ${jsonPath}`);
  console.log(`Wrote ${mdPath}`);
}

main();
