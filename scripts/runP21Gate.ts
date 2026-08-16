#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import { WUXIA_WORLD_PROFILE } from '../src/narrative/worldProfile';
import { evaluateContentConstraints, formatConstraintReportMarkdown } from '../src/p21/constraintEvaluation';
import { buildProductionValidationMatrix, formatProductionMatrixMarkdown } from '../src/p21/productionMatrix';
import { assembleP21GateReport, formatP21GateMarkdown } from '../src/p21/reportBuilder';
import {
  runContentSampleValidations,
  runOptimizationWave,
  runTuningComparisonSlice,
} from '../src/p21/validationSlices';

const REPORTS_DIR = path.join(process.cwd(), 'artifacts/reports');

function main(): void {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });

  const gate = assembleP21GateReport(WUXIA_WORLD_PROFILE);
  const matrix = buildProductionValidationMatrix();
  const constraintReport = evaluateContentConstraints(WUXIA_WORLD_PROFILE);
  const tuningSlice = runTuningComparisonSlice();
  const contentSamples = runContentSampleValidations();
  const wave = runOptimizationWave();

  const payload = {
    gate,
    productionMatrix: matrix,
    constraintReport,
    tuningComparison: tuningSlice,
    contentSamples,
    optimizationWave: wave,
  };

  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p21-gate-latest.json'),
    JSON.stringify(payload, null, 2),
    'utf8',
  );
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p21-gate-latest.md'),
    [
      formatP21GateMarkdown(gate),
      '',
      formatProductionMatrixMarkdown(matrix),
      '',
      formatConstraintReportMarkdown(constraintReport),
    ].join('\n'),
    'utf8',
  );
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p21-production-matrix-latest.json'),
    JSON.stringify(matrix, null, 2),
    'utf8',
  );
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p21-tuning-comparison-slice.json'),
    JSON.stringify(tuningSlice, null, 2),
    'utf8',
  );
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p21-optimization-wave.json'),
    JSON.stringify(wave, null, 2),
    'utf8',
  );

  console.log(`P21 gate decision: ${gate.decision}`);
  if (gate.decision === 'fail') process.exit(1);
}

main();
