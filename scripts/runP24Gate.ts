#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import { WUXIA_WORLD_PROFILE } from '../src/narrative/worldProfile';
import { assembleP24GateReport, formatP24GateMarkdown } from '../src/p24/reportBuilder';
import {
  buildPlaytestCalibrationMatrix,
  formatCalibrationMatrixMarkdown,
} from '../src/p24/validationMatrix';
import { runBoundedRcCalibrationWave } from '../src/p24/validationSlices';

const REPORTS_DIR = path.join(process.cwd(), 'docs/test-reports');

function main(): void {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });

  const gate = assembleP24GateReport(WUXIA_WORLD_PROFILE);
  const matrix = buildPlaytestCalibrationMatrix();
  const rcWave = runBoundedRcCalibrationWave(matrix);

  const payload = { gate, matrix, rcWave };

  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p24-gate-latest.json'),
    JSON.stringify(payload, null, 2),
    'utf8',
  );
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p24-gate-latest.md'),
    [formatP24GateMarkdown(gate), '', formatCalibrationMatrixMarkdown(matrix)].join('\n'),
    'utf8',
  );
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p24-calibration-matrix-latest.json'),
    JSON.stringify(matrix, null, 2),
    'utf8',
  );
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p24-rc-calibration-wave.json'),
    JSON.stringify(rcWave, null, 2),
    'utf8',
  );

  console.log(`P24 gate decision: ${gate.decision}`);
  if (gate.decision === 'fail') process.exit(1);
}

main();
