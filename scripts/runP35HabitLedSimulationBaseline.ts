#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import {
  formatP35MixedPinnacleBaselineMarkdown,
  runP35MixedPinnacleSimBaseline,
} from '../src/p25/p35HabitLedSimulationBaselines';

const REPORTS_DIR = path.join(process.cwd(), 'docs/test-reports');

function main(): void {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  const metrics = runP35MixedPinnacleSimBaseline();

  const jsonPath = path.join(REPORTS_DIR, 'p35-mixed-pinnacle-sim-baseline-metrics.json');
  fs.writeFileSync(jsonPath, JSON.stringify(metrics, null, 2), 'utf8');

  const mdPath = path.join(REPORTS_DIR, 'p35-mixed-pinnacle-sim-baseline-delta.md');
  fs.writeFileSync(mdPath, formatP35MixedPinnacleBaselineMarkdown(metrics), 'utf8');

  console.log(`Wrote ${jsonPath}`);
  console.log(`Wrote ${mdPath}`);
}

main();
