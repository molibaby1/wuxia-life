#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import {
  formatConsistencySliceMarkdown,
  runP25ConsequenceConsistencySlice,
} from '../src/p25/validationSlices';

const REPORTS_DIR = path.join(process.cwd(), 'artifacts/reports');

function main(): void {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  const result = runP25ConsequenceConsistencySlice();

  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p25-consequence-consistency-slice.json'),
    JSON.stringify(result, null, 2),
    'utf8',
  );
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p25-consequence-consistency-slice.md'),
    formatConsistencySliceMarkdown(result),
    'utf8',
  );

  console.log(`P25 consistency slice: ${result.passed ? 'PASS' : 'FAIL'} (${result.findings.length} findings)`);
  if (!result.passed) process.exit(1);
}

main();
