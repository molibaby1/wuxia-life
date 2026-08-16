#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import { runNpmGate } from '../src/p25/gateProbe';
import {
  formatPinnacleBaselineMarkdown,
  runP25PinnacleBaseline,
} from '../src/p25/pinnacleSimulationBaselines';

const REPORTS_DIR = path.join(process.cwd(), 'artifacts/reports');

function main(): void {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  const metrics = runP25PinnacleBaseline();
  metrics.gatePlayability = runNpmGate('gate:playability', 'npm run gate:playability');
  metrics.gateP20 = runNpmGate('gate:p20', 'npm run gate:p20');

  const jsonPath = path.join(REPORTS_DIR, 'p25-pinnacle-baseline-metrics.json');
  fs.writeFileSync(jsonPath, JSON.stringify(metrics, null, 2), 'utf8');
  const mdPath = path.join(REPORTS_DIR, 'p25-pinnacle-baseline-metrics.md');
  fs.writeFileSync(mdPath, formatPinnacleBaselineMarkdown(metrics), 'utf8');

  console.log(`Wrote ${jsonPath}`);
  console.log(
    `pinnacleMax=${metrics.pinnacleMaxUnlockRate.toFixed(3)} mainstreamMedian=${metrics.mainstreamMedianUnlockRate.toFixed(3)} attribution=${(metrics.failureAttributionRate * 100).toFixed(1)}%`,
  );
  if (!metrics.pinnacleRateBelowMainstreamMedian || !metrics.failureAttributionMeetsThreshold) {
    process.exitCode = 1;
  }
}

main();
