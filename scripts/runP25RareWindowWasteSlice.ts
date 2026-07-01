#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import {
  formatRareWindowWasteMarkdown,
  runP25RareWindowWasteSlice,
} from '../src/p25/rareWindowWasteSlice';

const REPORTS_DIR = path.join(process.cwd(), 'docs/test-reports');

function main(): void {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  const result = runP25RareWindowWasteSlice();
  const jsonPath = path.join(REPORTS_DIR, 'p25-rare-window-waste-slice.json');
  fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2), 'utf8');
  const mdPath = path.join(REPORTS_DIR, 'p25-rare-window-waste-slice.md');
  fs.writeFileSync(mdPath, formatRareWindowWasteMarkdown(result), 'utf8');
  console.log(`Wrote ${jsonPath} passed=${result.passed}`);
  if (!result.passed) process.exitCode = 1;
}

main();
