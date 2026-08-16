#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import { WUXIA_WORLD_PROFILE } from '../src/narrative/worldProfile';
import { buildLibraryCoverageMatrix, formatCoverageMatrixMarkdown } from '../src/p22/coverageMatrix';
import { evaluateAllPoolCoverage } from '../src/p22/coverageEvaluation';
import { assembleP22GateReport, formatP22GateMarkdown } from '../src/p22/reportBuilder';
import { detectWeakSpots } from '../src/p22/weakSpotDetection';
import {
  runExpansionValidations,
  runExpansionWave,
  runLiveOpsTuningComparisonSlice,
  runWaveValidations,
} from '../src/p22/validationSlices';

const REPORTS_DIR = path.join(process.cwd(), 'artifacts/reports');

function main(): void {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });

  const gate = assembleP22GateReport(WUXIA_WORLD_PROFILE);
  const matrix = buildLibraryCoverageMatrix();
  const poolSnapshots = evaluateAllPoolCoverage();
  const weakSpots = detectWeakSpots();
  const tuningSlice = runLiveOpsTuningComparisonSlice();
  const expansions = runExpansionValidations();
  const waves = runWaveValidations();
  const wave = runExpansionWave();

  const payload = {
    gate,
    coverageMatrix: matrix,
    poolSnapshots,
    weakSpots,
    tuningComparison: tuningSlice,
    expansions,
    waves,
    expansionWave: wave,
  };

  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p22-gate-latest.json'),
    JSON.stringify(payload, null, 2),
    'utf8',
  );
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p22-gate-latest.md'),
    [formatP22GateMarkdown(gate), '', formatCoverageMatrixMarkdown(matrix)].join('\n'),
    'utf8',
  );
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p22-coverage-matrix-latest.json'),
    JSON.stringify(matrix, null, 2),
    'utf8',
  );
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p22-expansion-wave.json'),
    JSON.stringify(wave, null, 2),
    'utf8',
  );

  console.log(`P22 gate decision: ${gate.decision}`);
  if (gate.decision === 'fail') process.exit(1);
}

main();
