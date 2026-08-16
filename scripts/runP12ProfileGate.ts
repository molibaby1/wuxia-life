#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import { WUXIA_WORLD_PROFILE } from '../src/narrative/worldProfile';
import { validateWorldProfileForGate } from '../src/p12/profileVerification';
import { assembleP12ProfileGateReport, formatP12GateMarkdown } from '../src/p12/reportBuilder';

const REPORTS_DIR = path.join(process.cwd(), 'artifacts/reports');

function main(): void {
  const smoke = validateWorldProfileForGate(WUXIA_WORLD_PROFILE);
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p12-profile-smoke-latest.json'),
    JSON.stringify(smoke, null, 2),
    'utf8',
  );

  const report = assembleP12ProfileGateReport(WUXIA_WORLD_PROFILE);
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p12-profile-gate-latest.json'),
    JSON.stringify(report, null, 2),
    'utf8',
  );
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p12-profile-gate-latest.md'),
    formatP12GateMarkdown(report),
    'utf8',
  );

  console.log(`P12 profile gate decision: ${report.decision}`);
  console.log('Wrote artifacts/reports/p12-profile-gate-latest.{json,md}');
  console.log('Wrote artifacts/reports/p12-profile-smoke-latest.json');

  if (report.decision === 'fail') {
    process.exit(1);
  }
}

main();
