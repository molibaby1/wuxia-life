#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import { runNpmGate } from '../src/p25/gateProbe';
import {
  formatMixedBaselineMarkdown,
  runP25MixedBaseline,
} from '../src/p25/mixedSimulationBaselines';

const REPORTS_DIR = path.join(process.cwd(), 'artifacts/reports');

function main(): void {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  const metrics = runP25MixedBaseline();
  metrics.gatePlayability = runNpmGate('gate:playability', 'npm run gate:playability');
  metrics.gateP20 = runNpmGate('gate:p20', 'npm run gate:p20');

  const jsonPath = path.join(REPORTS_DIR, 'p25-mixed-baseline-metrics.json');
  fs.writeFileSync(jsonPath, JSON.stringify(metrics, null, 2), 'utf8');
  const mdPath = path.join(REPORTS_DIR, 'p25-mixed-baseline-metrics.md');
  fs.writeFileSync(mdPath, formatMixedBaselineMarkdown(metrics), 'utf8');

  console.log(`Wrote ${jsonPath}`);
  console.log(
    `mixedRates=${Object.entries(metrics.mixedUnlockRates).map(([k, v]) => `${k}:${(v * 100).toFixed(1)}%`).join(' ')}`,
  );
  if (metrics.gatePlayability !== 'PASS' || metrics.gateP20 !== 'PASS') {
    process.exitCode = 1;
  }
}

main();
