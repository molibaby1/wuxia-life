#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import {
  formatP37AdditionalMixedPinnacleBaselineMarkdown,
  runP37AdditionalMixedPinnacleSimBaseline,
} from '../src/p25/p37HabitLedSimulationBaselines';

const REPORTS_DIR = path.join(process.cwd(), 'docs/test-reports');

function main(): void {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  const metrics = runP37AdditionalMixedPinnacleSimBaseline();

  const jsonPath = path.join(REPORTS_DIR, 'p37-additional-mixed-pinnacle-sim-baseline-metrics.json');
  fs.writeFileSync(jsonPath, JSON.stringify(metrics, null, 2), 'utf8');

  const mdPath = path.join(REPORTS_DIR, 'p37-additional-mixed-pinnacle-sim-baseline-delta.md');
  fs.writeFileSync(mdPath, formatP37AdditionalMixedPinnacleBaselineMarkdown(metrics), 'utf8');

  console.log(`Wrote ${jsonPath}`);
  console.log(`Wrote ${mdPath}`);
}

main();
