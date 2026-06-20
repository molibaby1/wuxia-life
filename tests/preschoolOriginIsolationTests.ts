import fs from 'node:fs';
import path from 'node:path';
import type { GameState } from '../src/types/eventTypes';
import {
  getPreschoolPassiveEntries,
  isForeignExclusivePreschoolEntry,
  isNeutralOnlyPreschoolEntry,
  isPreschoolPassiveEligible,
  selectPreschoolPassiveEntry,
  validatePreschoolPassiveOriginTags,
  type PreschoolExclusiveOriginTag,
} from '../src/data/preschoolPassiveSpine';

const REPORT_PATH = path.join(
  process.cwd(),
  'docs/test-reports/preschool-origin-isolation-stage5.md',
);

const ORIGIN_CASES: Array<{
  label: string;
  flag: string;
  tag: PreschoolExclusiveOriginTag;
}> = [
  { label: '书香门第', flag: 'origin_scholar_family', tag: 'scholar' },
  { label: '武林世家', flag: 'origin_wuxia_family', tag: 'martial' },
  { label: '商贾之家', flag: 'origin_merchant_family', tag: 'merchant' },
  { label: '边疆异族', flag: 'origin_frontier', tag: 'frontier' },
];

const AGES = [3, 4, 5, 6, 7] as const;
const ROLLS_PER_CELL = 30;
const SCHOLAR_SPOT_ROLLS = 100;

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function buildOriginState(flag: string, age: number, eventHistory: GameState['eventHistory'] = []): GameState {
  return {
    player: { age, flags: { [flag]: true } },
    flags: { [flag]: true },
    eventHistory,
  } as GameState;
}

function playerOriginTags(flag: string): Set<string> {
  const caseDef = ORIGIN_CASES.find(item => item.flag === flag)!;
  return new Set<string>(['neutral', caseDef.tag]);
}

function isForeignPick(id: string, playerTag: PreschoolExclusiveOriginTag, age: number): boolean {
  const entry = getPreschoolPassiveEntries(age).find(item => item.id === id);
  if (!entry) return false;
  return isForeignExclusivePreschoolEntry(entry, playerTag);
}

function runScholarAge4SpotCheck(): { foreignHits: number; samples: string[] } {
  const state = buildOriginState('origin_scholar_family', 4);
  const foreignSamples: string[] = [];
  let foreignHits = 0;
  for (let i = 0; i < SCHOLAR_SPOT_ROLLS; i += 1) {
    const picked = selectPreschoolPassiveEntry(state, () => Math.random());
    if (isForeignPick(picked.id, 'scholar', 4)) {
      foreignHits += 1;
      foreignSamples.push(picked.id);
    }
  }
  assert(foreignHits === 0, `scholar age 4 × ${SCHOLAR_SPOT_ROLLS}: expected 0 foreign ids, got ${foreignHits}`);
  return { foreignHits, samples: foreignSamples };
}

function runExhaustionFallbackTest(): void {
  const age = 5;
  const originTag = 'scholar';
  const tags = playerOriginTags('origin_scholar_family');
  const ageEntries = getPreschoolPassiveEntries(age);
  const scholarHistory = ageEntries
    .filter(entry => isPreschoolPassiveEligible(entry, tags) && !isNeutralOnlyPreschoolEntry(entry))
    .map(entry => ({ eventId: entry.id }));

  const state = buildOriginState('origin_scholar_family', age, scholarHistory);
  const picked = selectPreschoolPassiveEntry(state, () => 0);
  assert(
    isNeutralOnlyPreschoolEntry(picked) || picked.id === 'preschool_passive_gap',
    `exhausted scholar pool must pick neutral or gap, got ${picked.id}`,
  );
  assert(
    !isForeignExclusivePreschoolEntry(picked, originTag),
    `exhausted scholar pool must not pick foreign entry ${picked.id}`,
  );
}

function runFourOriginMatrix(): Array<{
  label: string;
  tag: PreschoolExclusiveOriginTag;
  age: number;
  rolls: number;
  foreignHits: number;
  foreignIds: string[];
}> {
  const rows: Array<{
    label: string;
    tag: PreschoolExclusiveOriginTag;
    age: number;
    rolls: number;
    foreignHits: number;
    foreignIds: string[];
  }> = [];

  for (const origin of ORIGIN_CASES) {
    for (const age of AGES) {
      const state = buildOriginState(origin.flag, age);
      const foreignIds: string[] = [];
      for (let i = 0; i < ROLLS_PER_CELL; i += 1) {
        const picked = selectPreschoolPassiveEntry(state, () => Math.random());
        if (isForeignPick(picked.id, origin.tag, age)) {
          foreignIds.push(picked.id);
        }
      }
      rows.push({
        label: origin.label,
        tag: origin.tag,
        age,
        rolls: ROLLS_PER_CELL,
        foreignHits: foreignIds.length,
        foreignIds: [...new Set(foreignIds)],
      });
      assert(
        foreignIds.length === 0,
        `${origin.label} age ${age} × ${ROLLS_PER_CELL}: foreign ids ${[...new Set(foreignIds)].join(', ')}`,
      );
    }
  }
  return rows;
}

function formatReport(
  matrix: Awaited<ReturnType<typeof runFourOriginMatrix>>,
  scholarSpot: ReturnType<typeof runScholarAge4SpotCheck>,
): string {
  const totalRolls = matrix.reduce((sum, row) => sum + row.rolls, 0);
  const totalForeign = matrix.reduce((sum, row) => sum + row.foreignHits, 0);
  const pass = totalForeign === 0 && scholarSpot.foreignHits === 0;

  return `# Preschool Origin Isolation — Stage-5 (US-005)

**PRD:** \`docs/PRD/early-childhood-preschool-origin-isolation.md\`  
**Date:** ${new Date().toISOString()}  
**Decision:** ${pass ? '**PASS**' : '**FAIL**'}

## Summary

| Check | Result |
| --- | --- |
| Scholar age 4 × ${SCHOLAR_SPOT_ROLLS} rolls (US-002) | ${scholarSpot.foreignHits === 0 ? '**PASS**' : '**FAIL**'} (${scholarSpot.foreignHits} foreign) |
| Four origins × ages 3–7 × ${ROLLS_PER_CELL} rolls | ${totalForeign === 0 ? '**PASS**' : '**FAIL**'} (${totalForeign}/${totalRolls} foreign) |
| Scholar exhaustion → neutral/gap only (US-003) | **PASS** |

## Matrix (foreign exclusive id hits)

| Origin | Age | Rolls | Foreign hits | Foreign ids |
| --- | --- | --- | --- | --- |
${matrix
  .map(
    row =>
      `| ${row.label} | ${row.age} | ${row.rolls} | ${row.foreignHits} | ${row.foreignIds.length ? row.foreignIds.join(', ') : '—'} |`,
  )
  .join('\n')}

## Commands

\`\`\`bash
npm exec tsx tests/preschoolOriginIsolationTests.ts
npm run gate:p16
npm run gate:playability
\`\`\`
`;
}

export function runPreschoolOriginIsolationTests(): void {
  const scholarSpot = runScholarAge4SpotCheck();
  runExhaustionFallbackTest();
  const matrix = runFourOriginMatrix();

  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, formatReport(matrix, scholarSpot), 'utf8');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runPreschoolOriginIsolationTests();
  console.log('preschoolOriginIsolationTests: ok');
  console.log(`Wrote ${path.relative(process.cwd(), REPORT_PATH)}`);
}
