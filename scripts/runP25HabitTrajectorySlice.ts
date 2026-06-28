#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import {
  formatP25HabitTrajectorySliceMarkdown,
  runP25HabitTrajectorySlice,
} from '../src/p25/habitTrajectorySlice';

const REPORTS_DIR = path.join(process.cwd(), 'docs/test-reports');

function main(): void {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  const result = runP25HabitTrajectorySlice();

  const jsonPath = path.join(REPORTS_DIR, 'p25-habit-trajectory-slice.json');
  fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2), 'utf8');
  const mdPath = path.join(REPORTS_DIR, 'p25-habit-trajectory-slice.md');
  fs.writeFileSync(mdPath, formatP25HabitTrajectorySliceMarkdown(result), 'utf8');

  console.log(`Wrote ${jsonPath} decision=${result.passed ? 'PASS' : 'FAIL'}`);
  if (!result.passed) {
    process.exitCode = 1;
  }
}

main();
