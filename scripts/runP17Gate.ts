#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import { WUXIA_WORLD_PROFILE } from '../src/narrative/worldProfile';
import { assembleP17GateReport, formatP17GateMarkdown } from '../src/p17/reportBuilder';
import { runMidLateLifeValidationSlice } from '../src/p17/validationSlices';

const REPORTS_DIR = path.join(process.cwd(), 'docs/test-reports');

function main(): void {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });

  const report = assembleP17GateReport(WUXIA_WORLD_PROFILE);
  const validationSlice = runMidLateLifeValidationSlice();

  const payload = {
    gate: report,
    midLateLifeSlice: validationSlice,
  };

  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p17-gate-latest.json'),
    JSON.stringify(payload, null, 2),
    'utf8',
  );
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p17-gate-latest.md'),
    formatP17GateMarkdown(report),
    'utf8',
  );
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p17-mid-late-life-slice.json'),
    JSON.stringify(validationSlice, null, 2),
    'utf8',
  );

  console.log(`P17 gate decision: ${report.decision}`);
  console.log('Wrote docs/test-reports/p17-gate-latest.{json,md}');
  console.log('Wrote docs/test-reports/p17-mid-late-life-slice.json');

  if (report.decision === 'fail') {
    process.exit(1);
  }
}

main();
