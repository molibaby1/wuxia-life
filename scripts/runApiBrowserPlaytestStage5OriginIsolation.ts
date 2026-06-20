/**
 * US-006: Stage-5 preschool passive origin bleed detector.
 * Drives HeadlessEngineSessionImpl (same engine as P6B API) for 书香门第 35 steps.
 */

import fs from 'node:fs';
import path from 'node:path';
import { CHOICE_EXECUTION_REQUEST_VERSION } from '../src/contracts/choiceExecution';
import { HeadlessEngineSessionImpl } from '../src/headless/session/HeadlessEngineSessionImpl';
import type { HeadlessEngineSession } from '../src/headless/session/HeadlessEngineSession';
import { progressUntilChoiceOrTerminal } from '../src/headless/progressionLoop';
import {
  findPreschoolPassiveEntryById,
  isForeignExclusivePreschoolEntry,
  resolvePreschoolPassiveEntryByTitle,
} from '../src/data/preschoolPassiveSpine';
import type { EventDefinition } from '../src/types/eventTypes';

const REPORT_PATH = path.join(
  process.cwd(),
  'docs/test-reports/api-browser-playtest-stage5-origin-isolation.md',
);
const MAX_STEPS = 35;
const PLAYER_ORIGIN_TAG = 'scholar' as const;
const SCHOLAR_ORIGIN_CHOICE = 'origin_scholar_family';

interface BleedFlag {
  step: number;
  age: number;
  passiveTitle: string;
  passiveId: string;
  originTags: string[];
}

interface StepLog {
  step: number;
  age: number;
  phase: string;
  passiveTitle?: string;
  bleed?: BleedFlag;
}


function pickChoiceId(
  event: EventDefinition,
  dtoChoices: Array<{ id: string; text: string; available: boolean }>,
): string | null {
  const available = dtoChoices.filter(c => c.available);
  const pool = available.length > 0 ? available : dtoChoices;
  if (pool.length === 0) return null;
  if (event.id === 'origin_background') {
    const match = pool.find(c => c.id === SCHOLAR_ORIGIN_CHOICE);
    if (match) return match.id;
  }
  if (event.id === 'childhood_preference') {
    const scholar = pool.find(c => c.id.includes('scholar') || c.text.includes('读书'));
    if (scholar) return scholar.id;
  }
  return pool[0]?.id ?? null;
}

async function runStoryEventStep(session: HeadlessEngineSession): Promise<void> {
  let pending = session.describePendingEvent();
  if (!pending) {
    pending = await session.getNextEvent();
    if (!pending) return;
  }

  if (!pending.requiresChoice) {
    await session.progressAutomatic({ maxSteps: 8 });
    await progressUntilChoiceOrTerminal(session);
    return;
  }

  const choiceId = pickChoiceId(pending.raw, pending.event.choices ?? []);
  if (!choiceId) {
    await progressUntilChoiceOrTerminal(session);
    return;
  }

  const snap = session.serialize();
  await session.executeChoice({
    requestVersion: CHOICE_EXECUTION_REQUEST_VERSION,
    snapshotRef: { snapshot: snap },
    action: { eventId: pending.raw.id, choiceId },
  });
  await progressUntilChoiceOrTerminal(session);
}

async function runActivePlanningStep(session: HeadlessEngineSession): Promise<void> {
  const options = session.getPlanningOptions();
  if (options.length === 0) {
    await session.getNextEvent();
    return;
  }
  await session.executeActiveAction(options[0]!.actionId);
  if (session.getSessionPhase() === 'action_summary') {
    await session.acknowledgeProgression('action_summary');
  }
  if (session.getSessionPhase() === 'disturbance_narrative') {
    await session.acknowledgeProgression('disturbance');
  }
}

function detectPassiveBleed(step: number, age: number, title: string): BleedFlag | undefined {
  if (age < 3 || age > 7) return undefined;
  const entry = resolvePreschoolPassiveEntryByTitle(title, age);
  if (!entry) return undefined;
  if (!isForeignExclusivePreschoolEntry(entry, PLAYER_ORIGIN_TAG)) return undefined;
  return {
    step,
    age,
    passiveTitle: title,
    passiveId: entry.id,
    originTags: entry.originTags,
  };
}

function collectHistoryBleed(state: ReturnType<HeadlessEngineSession['getRuntimeState']>): BleedFlag[] {
  const flags: BleedFlag[] = [];
  for (const record of state.eventHistory ?? []) {
    const age = record.age ?? 0;
    if (age < 3 || age > 7) continue;
    const entry = findPreschoolPassiveEntryById(record.eventId);
    if (!entry) continue;
    if (!isForeignExclusivePreschoolEntry(entry, PLAYER_ORIGIN_TAG)) continue;
    flags.push({
      step: 0,
      age,
      passiveTitle: entry.title,
      passiveId: entry.id,
      originTags: entry.originTags,
    });
  }
  return flags;
}

async function runPlaytest(): Promise<{ logs: StepLog[]; bleedFlags: BleedFlag[] }> {
  const session = HeadlessEngineSessionImpl.create({
    playerName: '林文澜',
    gender: 'female',
    catalogVersion: '1.0.0',
    randomSeed: 52001,
  });
  await progressUntilChoiceOrTerminal(session);

  const logs: StepLog[] = [];
  const bleedFlags: BleedFlag[] = [];

  for (let step = 1; step <= MAX_STEPS; step += 1) {
    const age = session.getRuntimeState().player?.age ?? 0;
    const phase = session.getSessionPhase();

    let passiveTitle: string | undefined;
    let bleed: BleedFlag | undefined;
    if (phase === 'passive_progression') {
      session.ensurePassivePresentation();
      passiveTitle = session.getProgressionVolatileState().passiveNarrative?.title;
      if (passiveTitle) {
        bleed = detectPassiveBleed(step, age, passiveTitle);
        if (bleed) bleedFlags.push(bleed);
      }
    }

    logs.push({ step, age, phase, passiveTitle, bleed });

    switch (phase) {
      case 'terminal':
        break;
      case 'story_event':
        await runStoryEventStep(session);
        break;
      case 'active_planning':
        await runActivePlanningStep(session);
        break;
      case 'action_summary':
        await session.acknowledgeProgression('action_summary');
        break;
      case 'disturbance_narrative':
        await session.acknowledgeProgression('disturbance');
        break;
      case 'passive_progression':
        await session.acknowledgeProgression('passive_continue');
        if (session.getSessionPhase() === 'period_summary') {
          await session.acknowledgeProgression('period_summary');
          await progressUntilChoiceOrTerminal(session);
        }
        break;
      case 'period_summary':
        await session.acknowledgeProgression('period_summary');
        await progressUntilChoiceOrTerminal(session);
        break;
      default:
        await progressUntilChoiceOrTerminal(session);
    }

    if (session.getTerminalState()) break;
  }

  for (const historyBleed of collectHistoryBleed(session.getRuntimeState())) {
    if (!bleedFlags.some(flag => flag.passiveId === historyBleed.passiveId && flag.age === historyBleed.age)) {
      bleedFlags.push(historyBleed);
    }
  }

  return { logs, bleedFlags };
}

function formatReport(result: Awaited<ReturnType<typeof runPlaytest>>): string {
  const { logs, bleedFlags } = result;
  const pass = bleedFlags.length === 0;
  const passiveSteps = logs.filter(l => l.passiveTitle && l.age >= 3 && l.age <= 7);
  const finalAge = logs[logs.length - 1]?.age ?? 0;

  return `# API Browser Playtest — Stage-5 Origin Isolation (US-006)

**PRD:** \`docs/PRD/early-childhood-preschool-origin-isolation.md\`  
**Date:** ${new Date().toISOString()}  
**Driver:** \`HeadlessEngineSessionImpl\` (same engine as P6B API)  
**Origin:** 书香门第 (\`origin_scholar_family\`)  
**Steps:** ${logs.length} (max ${MAX_STEPS})

## Acceptance

| Criterion | Result |
| --- | --- |
| Cross-origin passive bleed flags (ages 3–7) | ${pass ? '**PASS**' : '**FAIL**'} (${bleedFlags.length} flags) |
| Scholar ${MAX_STEPS}-step run | ${logs.length >= MAX_STEPS ? '**PASS**' : '**PARTIAL**'} (finalAge=${finalAge}) |

## Bleed flags

${
  bleedFlags.length === 0
    ? '_None — no foreign exclusive passive ids detected._'
    : bleedFlags
        .map(
          f =>
            `- Step ${f.step || 'history'} age ${f.age}: \`${f.passiveId}\` (${f.passiveTitle}) tags=${JSON.stringify(f.originTags)}`,
        )
        .join('\n')
}

## Passive steps ages 3–7

| Step | Age | Title | Bleed |
| --- | --- | --- | --- |
${passiveSteps
  .map(l => `| ${l.step} | ${l.age} | ${l.passiveTitle ?? '—'} | ${l.bleed ? `**${l.bleed.passiveId}**` : '—'} |`)
  .join('\n')}

## Command

\`\`\`bash
npm exec tsx scripts/runApiBrowserPlaytestStage5OriginIsolation.ts
\`\`\`
`;
}

async function main(): Promise<void> {
  const result = await runPlaytest();
  const md = formatReport(result);
  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, md, 'utf8');
  console.log(`Wrote ${path.relative(process.cwd(), REPORT_PATH)}`);
  console.log(`Steps: ${result.logs.length}, bleed flags: ${result.bleedFlags.length}`);
  if (result.bleedFlags.length > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
