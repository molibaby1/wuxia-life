#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import { WUXIA_WORLD_PROFILE } from '../src/narrative/worldProfile';
import { assembleP16GateReport, formatP16GateMarkdown } from '../src/p16/reportBuilder';
import { runOriginChoiceLuckSlice, runOriginVarianceSlice } from '../src/p16/validationSlices';

const REPORTS_DIR = path.join(process.cwd(), 'docs/test-reports');

function main(): void {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });

  const report = assembleP16GateReport(WUXIA_WORLD_PROFILE);
  const originSlice = runOriginVarianceSlice();
  const luckSlice = runOriginChoiceLuckSlice();

  const payload = {
    gate: report,
    originVarianceSlice: originSlice,
    originChoiceLuckSlice: luckSlice,
  };

  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p16-gate-latest.json'),
    JSON.stringify(payload, null, 2),
    'utf8',
  );
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p16-gate-latest.md'),
    formatP16GateMarkdown(report),
    'utf8',
  );
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p16-origin-variance-slice.json'),
    JSON.stringify(originSlice, null, 2),
    'utf8',
  );
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p16-origin-choice-luck-slice.json'),
    JSON.stringify(luckSlice, null, 2),
    'utf8',
  );

  console.log(`P16 gate decision: ${report.decision}`);
  console.log('Wrote docs/test-reports/p16-gate-latest.{json,md}');
  console.log('Wrote docs/test-reports/p16-origin-variance-slice.json');
  console.log('Wrote docs/test-reports/p16-origin-choice-luck-slice.json');

  if (report.decision === 'fail') {
    process.exit(1);
  }
}

main();
