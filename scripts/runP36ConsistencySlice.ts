#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import {
  formatP36ConsistencySliceMarkdown,
  runP36ExtendedConsequenceConsistencySlice,
} from '../src/p25/p36ConsequenceConsistencySlice';

const REPORTS_DIR = path.join(process.cwd(), 'artifacts/reports');

function main(): void {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  const result = runP36ExtendedConsequenceConsistencySlice();

  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p36-consequence-consistency-slice.json'),
    JSON.stringify(result, null, 2),
    'utf8',
  );
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p36-consequence-consistency-slice.md'),
    formatP36ConsistencySliceMarkdown(result),
    'utf8',
  );

  console.log(
    `P36 consistency slice: ${result.passed ? 'PASS' : 'FAIL'} (highSeverity=${result.highSeverityContradictionCount}, findings=${result.findings.length})`,
  );
  if (!result.passed) process.exit(1);
}

main();
