#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import { WUXIA_WORLD_PROFILE } from '../src/narrative/worldProfile';
import { assembleP20GateReport, formatP20GateMarkdown } from '../src/p20/reportBuilder';
import {
  runArchetypeDifferentiationSlice,
  runArchetypeRegressionMatrix,
  runPacingDifferentiationSlice,
  runReplayabilityValidationComparison,
  runRepetitionOverlapSlice,
} from '../src/p20/validationSlices';

const REPORTS_DIR = path.join(process.cwd(), 'docs/test-reports');

function main(): void {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });

  const report = assembleP20GateReport(WUXIA_WORLD_PROFILE);
  const archetypeSlice = runArchetypeDifferentiationSlice();
  const repetitionSlice = runRepetitionOverlapSlice();
  const pacingSlice = runPacingDifferentiationSlice();
  const comparison = runReplayabilityValidationComparison();
  const regression = runArchetypeRegressionMatrix();

  const payload = {
    gate: report,
    archetypeDifferentiation: archetypeSlice,
    repetitionOverlap: repetitionSlice,
    pacingDifferentiation: pacingSlice,
    replayabilityValidation: comparison,
    archetypeRegressionMatrix: regression,
  };

  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p20-gate-latest.json'),
    JSON.stringify(payload, null, 2),
    'utf8',
  );
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p20-gate-latest.md'),
    formatP20GateMarkdown(report),
    'utf8',
  );
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p20-archetype-regression-matrix.json'),
    JSON.stringify(regression, null, 2),
    'utf8',
  );
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p20-replayability-comparison-slice.json'),
    JSON.stringify(comparison, null, 2),
    'utf8',
  );
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p20-pacing-comparison-slice.json'),
    JSON.stringify(pacingSlice, null, 2),
    'utf8',
  );

  console.log(`P20 gate decision: ${report.decision}`);
  console.log('Wrote docs/test-reports/p20-gate-latest.{json,md}');
  console.log('Wrote docs/test-reports/p20-*-comparison-slice.json');

  if (report.decision === 'fail') {
    process.exit(1);
  }
}

main();
