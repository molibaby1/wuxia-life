#!/usr/bin/env tsx
/**
 * P4 US-024: Contract test suite entry.
 *
 * Runs all contract tests without browser, backend, or database.
 */

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const tsxBin = join(process.cwd(), 'node_modules', '.bin', 'tsx');

const suites = [
  'snapshotContract.test.ts',
  'choiceExecutionContract.test.ts',
  'replayContract.test.ts',
  'catalogContract.test.ts',
  'contractValidation.test.ts',
  'saveSchemaContract.test.ts',
];

console.log('=== P4 Contract Test Suite ===\n');

let failed = 0;

for (const suite of suites) {
  const path = join(__dirname, suite);
  console.log(`--- ${suite} ---`);
  const result = spawnSync(tsxBin, [path], { stdio: 'inherit', cwd: process.cwd() });
  if (result.status !== 0) {
    failed += 1;
    console.error(`\n❌ ${suite} failed\n`);
  } else {
    console.log('');
  }
}

if (failed > 0) {
  console.error(`❌ ${failed} contract suite(s) failed`);
  process.exit(1);
}

console.log('✅ All P4 contract test suites passed');
