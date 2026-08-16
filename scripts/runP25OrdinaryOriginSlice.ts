#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import {
  formatOrdinaryOriginSliceMarkdown,
  runP25OrdinaryOriginSlice,
} from '../src/p25/ordinaryOriginTrajectorySlice';

const REPORTS_DIR = path.join(process.cwd(), 'artifacts/reports');

function main(): void {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  const result = runP25OrdinaryOriginSlice();

  const jsonPath = path.join(REPORTS_DIR, 'p25-ordinary-origin-slice.json');
  fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2), 'utf8');
  const mdPath = path.join(REPORTS_DIR, 'p25-ordinary-origin-slice.md');
  fs.writeFileSync(mdPath, formatOrdinaryOriginSliceMarkdown(result), 'utf8');

  console.log(`Wrote ${jsonPath} decision=${result.passed ? 'PASS' : 'FAIL'}`);
  if (!result.passed) {
    process.exitCode = 1;
  }
}

main();
