#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import { WUXIA_WORLD_PROFILE } from '../src/narrative/worldProfile';
import { assembleP19GateReport, formatP19GateMarkdown } from '../src/p19/reportBuilder';
import {
  runEndgameCategoryComparisonSlice,
  runHistoricalMemoryComparisonSlice,
  runPreEndgameClosureComparisonSlice,
} from '../src/p19/validationSlices';

const REPORTS_DIR = path.join(process.cwd(), 'docs/test-reports');

function main(): void {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });

  const report = assembleP19GateReport(WUXIA_WORLD_PROFILE);
  const categorySlice = runEndgameCategoryComparisonSlice();
  const memorySlice = runHistoricalMemoryComparisonSlice();
  const closureSlice = runPreEndgameClosureComparisonSlice();

  const payload = {
    gate: report,
    endgameCategoryComparison: categorySlice,
    historicalMemoryComparison: memorySlice,
    preEndgameClosureComparison: closureSlice,
  };

  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p19-gate-latest.json'),
    JSON.stringify(payload, null, 2),
    'utf8',
  );
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p19-gate-latest.md'),
    formatP19GateMarkdown(report),
    'utf8',
  );
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p19-endgame-comparison-slice.json'),
    JSON.stringify(categorySlice, null, 2),
    'utf8',
  );
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p19-historical-memory-comparison-slice.json'),
    JSON.stringify(memorySlice, null, 2),
    'utf8',
  );
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p19-pre-endgame-closure-comparison-slice.json'),
    JSON.stringify(closureSlice, null, 2),
    'utf8',
  );

  console.log(`P19 gate decision: ${report.decision}`);
  console.log('Wrote docs/test-reports/p19-gate-latest.{json,md}');
  console.log('Wrote docs/test-reports/p19-*-comparison-slice.json');

  if (report.decision === 'fail') {
    process.exit(1);
  }
}

main();
