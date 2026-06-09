#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import { WUXIA_WORLD_PROFILE } from '../src/narrative/worldProfile';
import { assembleP18GateReport, formatP18GateMarkdown } from '../src/p18/reportBuilder';
import {
  runContinuityComparisonSlice,
  runInheritedBurdenComparisonSlice,
  runUnderinvestmentComparisonSlice,
} from '../src/p18/validationSlices';

const REPORTS_DIR = path.join(process.cwd(), 'docs/test-reports');

function main(): void {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });

  const report = assembleP18GateReport(WUXIA_WORLD_PROFILE);
  const continuitySlice = runContinuityComparisonSlice();
  const burdenSlice = runInheritedBurdenComparisonSlice();
  const underinvestSlice = runUnderinvestmentComparisonSlice();

  const payload = {
    gate: report,
    continuityComparison: continuitySlice,
    inheritedBurdenComparison: burdenSlice,
    underinvestmentComparison: underinvestSlice,
  };

  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p18-gate-latest.json'),
    JSON.stringify(payload, null, 2),
    'utf8',
  );
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p18-gate-latest.md'),
    formatP18GateMarkdown(report),
    'utf8',
  );
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p18-continuity-comparison-slice.json'),
    JSON.stringify(continuitySlice, null, 2),
    'utf8',
  );
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p18-inherited-burden-comparison-slice.json'),
    JSON.stringify(burdenSlice, null, 2),
    'utf8',
  );
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p18-underinvestment-comparison-slice.json'),
    JSON.stringify(underinvestSlice, null, 2),
    'utf8',
  );

  console.log(`P18 gate decision: ${report.decision}`);
  console.log('Wrote docs/test-reports/p18-gate-latest.{json,md}');
  console.log('Wrote docs/test-reports/p18-*-comparison-slice.json');

  if (report.decision === 'fail') {
    process.exit(1);
  }
}

main();
