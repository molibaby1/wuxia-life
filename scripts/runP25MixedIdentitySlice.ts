#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import {
  formatMixedIdentityMarkdown,
  runP25MixedIdentitySlice,
} from '../src/p25/mixedIdentitySlice';

const REPORTS_DIR = path.join(process.cwd(), 'artifacts/reports');

function main(): void {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  const result = runP25MixedIdentitySlice();

  const jsonPath = path.join(REPORTS_DIR, 'p25-mixed-identity-slice.json');
  fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2), 'utf8');
  const mdPath = path.join(REPORTS_DIR, 'p25-mixed-identity-slice.md');
  fs.writeFileSync(mdPath, formatMixedIdentityMarkdown(result), 'utf8');

  console.log(`Wrote ${jsonPath}`);
  console.log(`Decision: ${result.passed ? 'PASS' : 'FAIL'}`);
  if (!result.passed) {
    process.exitCode = 1;
  }
}

main();
