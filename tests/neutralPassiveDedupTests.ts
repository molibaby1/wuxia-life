import fs from 'node:fs';
import path from 'node:path';
import type { GameState } from '../src/types/eventTypes';
import {
  NEUTRAL_PASSIVE_TITLE_DEDUP_WINDOW,
  selectPreschoolPassiveEntry,
} from '../src/data/preschoolPassiveSpine';
import { shouldRecordPassiveNarrativeInHistory } from '../src/data/infantPassiveNarratives';

const REPORT_PATH = path.join(
  process.cwd(),
  'docs/test-reports/neutral-passive-dedup-stage7.md',
);

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function buildScholarState(age: number, eventHistory: GameState['eventHistory'] = []): GameState {
  return {
    player: { age, flags: { origin_scholar_family: true } },
    flags: { origin_scholar_family: true },
    eventHistory,
  } as GameState;
}

function pickWithHistory(state: GameState, random: () => number) {
  const entry = selectPreschoolPassiveEntry(state, random);
  if (shouldRecordPassiveNarrativeInHistory(entry.id)) {
    state.eventHistory = [
      ...(state.eventHistory ?? []),
      { eventId: entry.id, age: state.player?.age ?? 0 },
    ];
  }
  return entry;
}

function measureConsecutiveAndTopTitle(
  rolls: number,
  random: () => number,
): { maxConsecutive: number; topShare: number; topTitle: string; counts: Record<string, number> } {
  const state = buildScholarState(3);
  let lastTitle: string | null = null;
  let streak = 0;
  let maxConsecutive = 0;
  const counts: Record<string, number> = {};

  for (let i = 0; i < rolls; i += 1) {
    state.player!.age = 3 + (i % 5);
    const entry = pickWithHistory(state, random);
    counts[entry.title] = (counts[entry.title] ?? 0) + 1;
    if (entry.title === lastTitle) {
      streak += 1;
      maxConsecutive = Math.max(maxConsecutive, streak + 1);
    } else {
      streak = 0;
    }
    lastTitle = entry.title;
  }

  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]!;
  return {
    maxConsecutive,
    topShare: top[1] / rolls,
    topTitle: top[0],
    counts,
  };
}

function runWithoutDedupSimulation(seed: number, rolls: number) {
  // Baseline from US-001 audit (same seed family, no history accumulation dedup)
  const random = seededRandom(seed);
  const state = buildScholarState(4);
  let lastTitle: string | null = null;
  let streak = 0;
  let maxConsecutive = 0;
  const counts: Record<string, number> = {};

  for (let i = 0; i < rolls; i += 1) {
    const entry = selectPreschoolPassiveEntry({ ...state, eventHistory: [] }, random);
    counts[entry.title] = (counts[entry.title] ?? 0) + 1;
    if (entry.title === lastTitle) {
      streak += 1;
      maxConsecutive = Math.max(maxConsecutive, streak + 1);
    } else {
      streak = 0;
    }
    lastTitle = entry.title;
  }
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]!;
  return { maxConsecutive, topShare: top[1] / rolls, topTitle: top[0], counts };
}

function testConsecutiveCap(): void {
  const stats = measureConsecutiveAndTopTitle(120, seededRandom(7));
  assert(
    stats.maxConsecutive <= 2,
    `expected max consecutive ≤2, got ${stats.maxConsecutive}`,
  );
}

function testFiftyRollDiversity(): void {
  const state = buildScholarState(3);
  const random = seededRandom(99);
  const counts: Record<string, number> = {};
  for (let i = 0; i < 50; i += 1) {
    state.player!.age = 3 + (i % 5);
    const entry = pickWithHistory(state, random);
    counts[entry.title] = (counts[entry.title] ?? 0) + 1;
  }
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]!;
  const topShare = top[1] / 50;
  assert(
    topShare <= 0.25,
    `expected top title share ≤25%, got ${(topShare * 100).toFixed(1)}% (${top[0]})`,
  );
}

function formatReport(before: ReturnType<typeof runWithoutDedupSimulation>, after: ReturnType<typeof measureConsecutiveAndTopTitle>): string {
  const beforeTop = Object.entries(before.counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const afterTop = Object.entries(after.counts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return `# Neutral Passive Title Deduplication — Stage-7 (US-007)

**PRD:** \`docs/PRD/early-childhood-childhood-experience-stage7.md\`  
**Date:** ${new Date().toISOString()}  
**Decision:** **PASS**

## Implementation

| Constant | Value |
| --- | --- |
| \`NEUTRAL_PASSIVE_TITLE_DEDUP_WINDOW\` | ${NEUTRAL_PASSIVE_TITLE_DEDUP_WINDOW} |

Applied in \`selectPreschoolPassiveEntry\` after \`isPreschoolPassiveEligible\`; falls through neutral-only → gap when all titles suppressed.

## Scholar age 4 — before (no history dedup, 80 picks, seed=42)

| Metric | Value |
| --- | --- |
| Max consecutive same title | ${before.maxConsecutive} |
| Top title share | ${(before.topShare * 100).toFixed(1)}% (${before.topTitle}) |

Top titles:

| Title | Count |
| --- | --- |
${beforeTop.map(([t, c]) => `| ${t} | ${c} |`).join('\n')}

## Scholar age 4/5 — after (history + title dedup)

| Metric | Value |
| --- | --- |
| Max consecutive same title | ${after.maxConsecutive} (target ≤2) |
| Top title share (50 rolls @ age 5) | ${(after.topShare * 100).toFixed(1)}% (${after.topTitle}) (target ≤25%) |

Top titles (50 rolls, seed=99):

| Title | Count |
| --- | --- |
${afterTop.map(([t, c]) => `| ${t} | ${c} |`).join('\n')}

## Reproduce

\`\`\`bash
npm exec tsx tests/neutralPassiveDedupTests.ts
npm exec tsx tests/preschoolOriginIsolationTests.ts
\`\`\`
`;
}

function testLateChildhoodGapDedup(): void {
  const state = buildScholarState(9);
  const random = seededRandom(202);
  let lastTitle: string | null = null;
  let streak = 0;
  let maxConsecutive = 0;
  for (let i = 0; i < 40; i += 1) {
    state.player!.age = 8 + (i % 5);
    const entry = pickWithHistory(state, random);
    if (entry.title === lastTitle) {
      streak += 1;
      maxConsecutive = Math.max(maxConsecutive, streak + 1);
    } else {
      streak = 0;
    }
    lastTitle = entry.title;
  }
  assert(maxConsecutive <= 2, `age 8–12 gap dedup expected ≤2 consecutive, got ${maxConsecutive}`);
}

function main(): void {
  const before = runWithoutDedupSimulation(42, 80);
  testConsecutiveCap();
  testFiftyRollDiversity();
  testLateChildhoodGapDedup();
  const after = measureConsecutiveAndTopTitle(50, seededRandom(99));
  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, formatReport(before, after), 'utf8');
  console.log(`Wrote ${path.relative(process.cwd(), REPORT_PATH)}`);
  console.log('✔ neutralPassiveDedupTests passed');
}

main();
