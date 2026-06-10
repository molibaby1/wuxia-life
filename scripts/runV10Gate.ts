#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import { WUXIA_WORLD_PROFILE } from '../src/narrative/worldProfile';
import { assembleV10GateReport, formatV10GateMarkdown } from '../src/v10/reportBuilder';
import { buildPlaytestCalibrationMatrix } from '../src/p24/validationMatrix';
import { runBoundedRcCalibrationWave } from '../src/p24/validationSlices';

const REPORTS_DIR = path.join(process.cwd(), 'docs/test-reports');

function main(): void {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });

  const gate = assembleV10GateReport(WUXIA_WORLD_PROFILE);
  const matrix = buildPlaytestCalibrationMatrix();
  const rcWave = runBoundedRcCalibrationWave(matrix);

  const payload = { gate, matrix, rcWave };

  fs.writeFileSync(
    path.join(REPORTS_DIR, 'v1-0-gate-latest.json'),
    JSON.stringify(payload, null, 2),
    'utf8',
  );
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'v1-0-gate-latest.md'),
    formatV10GateMarkdown(gate),
    'utf8',
  );
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'v1-0-launch-readiness-matrix-latest.json'),
    JSON.stringify(matrix, null, 2),
    'utf8',
  );
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'v1-0-rc-closure-wave.json'),
    JSON.stringify(rcWave, null, 2),
    'utf8',
  );

  console.log(`v1.0 RC gate decision: ${gate.decision}`);
  if (gate.decision === 'fail') process.exit(1);
}

main();
