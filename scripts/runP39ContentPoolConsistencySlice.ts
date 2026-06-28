#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import {
  formatP39ConsistencySliceMarkdown,
  runP39ExtendedContentPoolConsistencySlice,
} from '../src/p25/p39ContentPoolConsistencySlice';

const REPORTS_DIR = path.join(process.cwd(), 'docs/test-reports');

function main(): void {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  const result = runP39ExtendedContentPoolConsistencySlice();

  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p39-content-pool-consistency-slice.json'),
    JSON.stringify(result, null, 2),
    'utf8',
  );
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p39-content-pool-consistency-slice.md'),
    formatP39ConsistencySliceMarkdown(result),
    'utf8',
  );

  console.log(
    `P39 content pool consistency slice: ${result.passed ? 'PASS' : 'FAIL'} (paths=${result.pathCount}, highSeverity=${result.highSeverityContradictionCount}, findings=${result.findings.length})`,
  );
  if (!result.passed) process.exit(1);
}

main();
