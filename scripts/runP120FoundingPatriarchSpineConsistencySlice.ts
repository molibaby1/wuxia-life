#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import {
  formatP120FoundingPatriarchSpineConsistencyMarkdown,
  runP120FoundingPatriarchSpineConsistencySlice,
} from '../src/p25/p120FoundingPatriarchSpineConsistencySlice';

const REPORTS_DIR = path.join(process.cwd(), 'artifacts/reports');

function main(): void {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  const result = runP120FoundingPatriarchSpineConsistencySlice();

  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p120-founding-patriarch-spine-consistency-slice.json'),
    JSON.stringify(result, null, 2),
    'utf8',
  );
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p120-founding-patriarch-spine-consistency-slice.md'),
    formatP120FoundingPatriarchSpineConsistencyMarkdown(result),
    'utf8',
  );

  console.log(
    `P120 founding-patriarch spine consistency: ${result.passed ? 'PASS' : 'FAIL'} (paths=${result.pathCount}, highSeverity=${result.highSeverityContradictionCount})`,
  );
  if (!result.passed) process.exit(1);
}

main();
