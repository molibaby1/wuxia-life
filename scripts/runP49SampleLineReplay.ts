#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import { GameProcessSimulator } from '../tests/GameProcessSimulator';
import {
  P49_CHECKPOINT_AGES,
  P49_SAMPLE_LINE_MATRIX,
  buildCrossLineComparison,
  formatP49CrossLineMarkdown,
  formatP49ReplayMarkdown,
  summarizeSampleLineRun,
  type P49SampleLineReplayReport,
} from '../src/p49/sampleLineReplay';

const REPORTS_DIR = path.join(process.cwd(), 'docs/test-reports');
const JSON_PATH = path.join(REPORTS_DIR, 'p49-sample-lines-replay-latest.json');
const MD_PATH = path.join(REPORTS_DIR, 'p49-sample-lines-replay-latest.md');
const CROSS_LINE_PATH = path.join(REPORTS_DIR, 'p49-sample-lines-cross-line-comparison-latest.md');

async function runMatrix(): Promise<P49SampleLineReplayReport> {
  const lines = [];

  for (const entry of P49_SAMPLE_LINE_MATRIX) {
    const simulator = new GameProcessSimulator({
      playerName: entry.personaName,
      gender: entry.gender,
      seed: entry.seed,
      choiceTendency: entry.choiceTendency,
      routeTrack: entry.routeTrack,
      p8PersonaId: entry.p8PersonaId,
      simulateYears: 50,
      runUntilDeath: false,
      ageRange: { startAge: 0, endAge: 50 },
      maxEvents: 280,
      enableAutoSave: false,
      enableManualSave: false,
      enableSaveRestore: false,
      verbose: false,
      sampleId: entry.sampleId,
    });
    const report = await withSuppressedConsole(() => simulator.simulate());
    lines.push(summarizeSampleLineRun({ entry, report }));
  }

  return {
    generatedAt: new Date().toISOString(),
    checkpointAges: [...P49_CHECKPOINT_AGES],
    lines,
  };
}

async function withSuppressedConsole<T>(run: () => Promise<T>): Promise<T> {
  const originalLog = console.log;
  const originalWarn = console.warn;
  console.log = () => {};
  console.warn = () => {};
  try {
    return await run();
  } finally {
    console.log = originalLog;
    console.warn = originalWarn;
  }
}

async function main(): Promise<void> {
  const report = await runMatrix();
  const comparison = buildCrossLineComparison(report);

  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  fs.writeFileSync(JSON_PATH, JSON.stringify({ ...report, crossLineComparison: comparison }, null, 2), 'utf8');
  fs.writeFileSync(MD_PATH, formatP49ReplayMarkdown(report), 'utf8');
  fs.writeFileSync(CROSS_LINE_PATH, formatP49CrossLineMarkdown(report, comparison), 'utf8');

  console.log(formatP49ReplayMarkdown(report));
  console.log('\n---\n');
  console.log(formatP49CrossLineMarkdown(report, comparison));
  console.log(`\nJSON: ${JSON_PATH}`);
  console.log(`Markdown: ${MD_PATH}`);
  console.log(`Cross-line: ${CROSS_LINE_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
