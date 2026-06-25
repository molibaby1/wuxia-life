#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import { GameProcessSimulator } from '../tests/GameProcessSimulator';
import {
  P45_CHECKPOINT_AGES,
  P45_REPLAY_MATRIX,
  formatP45TrajectoryMarkdown,
  summarizeTrajectoryRun,
  type P45TrajectoryReport,
} from '../src/p45/trajectoryReplay';
import { getP8PersonaById } from '../src/p8/personas';

const REPORTS_DIR = path.join(process.cwd(), 'docs/test-reports');
const JSON_PATH = path.join(REPORTS_DIR, 'p45-trajectory-replay-latest.json');
const MD_PATH = path.join(REPORTS_DIR, 'p45-trajectory-replay-latest.md');

async function main(): Promise<void> {
  const summaries = [];

  for (const entry of P45_REPLAY_MATRIX) {
    const persona = getP8PersonaById(entry.personaId);
    if (!persona) {
      throw new Error(`Missing persona ${entry.personaId}`);
    }
    const simulator = new GameProcessSimulator({
      playerName: entry.personaId,
      gender: persona.gender,
      seed: entry.seed,
      choiceTendency: persona.choiceTendency,
      p8PersonaId: entry.personaId,
      simulateYears: 40,
      runUntilDeath: false,
      ageRange: { startAge: 0, endAge: 40 },
      maxEvents: 220,
      enableAutoSave: false,
      enableManualSave: false,
      enableSaveRestore: false,
      verbose: false,
      sampleId: entry.personaId,
    });
    const report = await withSuppressedConsole(() => simulator.simulate());
    summaries.push(summarizeTrajectoryRun({
      personaLabel: entry.personaLabel,
      personaId: entry.personaId,
      seed: entry.seed,
      report,
    }));
  }

  const payload: P45TrajectoryReport = {
    generatedAt: new Date().toISOString(),
    ageWindow: { startAge: 0, endAge: 40 },
    checkpointAges: [...P45_CHECKPOINT_AGES],
    summaries,
  };

  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  fs.writeFileSync(JSON_PATH, JSON.stringify(payload, null, 2), 'utf8');
  fs.writeFileSync(MD_PATH, formatP45TrajectoryMarkdown(payload), 'utf8');

  console.log(formatP45TrajectoryMarkdown(payload));
  console.log(`\nJSON: ${JSON_PATH}`);
  console.log(`Markdown: ${MD_PATH}`);
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

main().catch(err => {
  console.error(err);
  process.exit(1);
});
