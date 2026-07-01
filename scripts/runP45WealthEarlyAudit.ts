#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import { GameProcessSimulator } from '../tests/GameProcessSimulator';
import { getP8PersonaById } from '../src/p8/personas';
import { formatWealthEarlyAuditMarkdown, summarizeWealthEarlyAudit } from '../src/p45/wealthEarlyAudit';

const REPORTS_DIR = path.join(process.cwd(), 'docs/test-reports');
const MD_PATH = path.join(REPORTS_DIR, 'p45-wealth-early-audit.md');
const JSON_PATH = path.join(REPORTS_DIR, 'p45-wealth-early-audit.json');

async function main(): Promise<void> {
  const persona = getP8PersonaById('p8-wealth-shen');
  if (!persona) {
    throw new Error('Missing p8-wealth-shen');
  }
  const simulator = new GameProcessSimulator({
    playerName: persona.id,
    gender: persona.gender,
    seed: persona.seed,
    choiceTendency: persona.choiceTendency,
    p8PersonaId: persona.id,
    simulateYears: 20,
    runUntilDeath: false,
    ageRange: { startAge: 0, endAge: 20 },
    maxEvents: 140,
    enableAutoSave: false,
    enableManualSave: false,
    enableSaveRestore: false,
    verbose: false,
    sampleId: persona.id,
  });
  const report = await withSuppressedConsole(() => simulator.simulate());
  const audit = summarizeWealthEarlyAudit(report);
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  fs.writeFileSync(JSON_PATH, JSON.stringify(audit, null, 2), 'utf8');
  fs.writeFileSync(MD_PATH, formatWealthEarlyAuditMarkdown(audit), 'utf8');
  console.log(formatWealthEarlyAuditMarkdown(audit));
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
