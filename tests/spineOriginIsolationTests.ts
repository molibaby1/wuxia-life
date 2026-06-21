import fs from 'node:fs';
import path from 'node:path';
import type { EventDefinition, GameState } from '../src/types/eventTypes';
import { gameEngine } from '../src/core/GameEngineIntegration';
import { eventLoader } from '../src/core/EventLoader';
import {
  inferEventExclusivePrimaryFlag,
  isForeignExclusiveSpineEvent,
  isSpineOriginEligible,
  SPINE_ORIGIN_EXCLUSIVE_AGE_MAX,
} from '../src/p16/spineOriginIsolation';
import {
  resolvePrimaryOriginFamilyFlag,
  type PrimaryOriginFamilyFlag,
} from '../src/p16/primaryOriginFlag';

const REPORT_PATH = path.join(
  process.cwd(),
  'docs/test-reports/spine-origin-isolation-stage6.md',
);

const ORIGIN_CASES: Array<{ label: string; flag: PrimaryOriginFamilyFlag }> = [
  { label: '书香门第', flag: 'origin_scholar_family' },
  { label: '武林世家', flag: 'origin_wuxia_family' },
  { label: '商贾之家', flag: 'origin_merchant_family' },
  { label: '边疆异族', flag: 'origin_frontier' },
];

const AGES = [1, 2, 3, 4, 5, 6, 7] as const;
const ROLLS_PER_CELL = 30;

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function buildState(flag: PrimaryOriginFamilyFlag, age: number, extraFlags: Record<string, boolean> = {}): GameState {
  const flags = { [flag]: true, ...extraFlags };
  return {
    player: { age, flags },
    flags,
  } as GameState;
}

function testPrimaryResolverScholarOverPoor(): void {
  const state = buildState('origin_scholar_family', 2, {
    origin_poor_family: true,
    p22_live_ops_active: true,
  });
  assert(
    resolvePrimaryOriginFamilyFlag(state) === 'origin_scholar_family',
    'scholar primary must win over origin_poor_family trait flag',
  );
}

function testPrimaryResolverNullBeforeOriginBackground(): void {
  const age0 = { player: { age: 0, flags: {} }, flags: {} } as GameState;
  assert(resolvePrimaryOriginFamilyFlag(age0) === null, 'age 0 without primary flags must return null');

  const poorOnly = {
    player: { age: 1, flags: { origin_poor_family: true } },
    flags: { origin_poor_family: true },
  } as GameState;
  assert(
    resolvePrimaryOriginFamilyFlag(poorOnly) === null,
    'age 1 with only origin_poor_family must return null (not a four-main primary)',
  );
}

function testScholarBlocksFrontierOrphan(): void {
  const state = buildState('origin_scholar_family', 2, {
    origin_poor_family: true,
    p22_live_ops_active: true,
  });
  gameEngine.loadGameState(state);
  const orphan = eventLoader.getEventById('p22_origin_frontier_orphan');
  assert(orphan !== undefined, 'orphan event must exist');
  assert(
    !isSpineOriginEligible(orphan!, 'origin_scholar_family', 2),
    'orphan must be ineligible for scholar primary',
  );
  assert(
    !gameEngine.getAvailableEvents(2).some(e => e.id === 'p22_origin_frontier_orphan'),
    'orphan must not appear in scholar getAvailableEvents',
  );
}

function testFrontierOrphanSelectableAfterConfigFix(): void {
  const state = buildState('origin_frontier', 2, { p22_live_ops_active: true });
  gameEngine.loadGameState(state);
  assert(
    gameEngine.getAvailableEvents(2).some(e => e.id === 'p22_origin_frontier_orphan'),
    'frontier primary must see orphan after condition fix',
  );
}

function collectForeignIds(
  flag: PrimaryOriginFamilyFlag,
  age: number,
  extraFlags: Record<string, boolean> = {},
): string[] {
  const state = buildState(flag, age, extraFlags);
  gameEngine.loadGameState(state);
  const foreign: string[] = [];
  for (const event of gameEngine.getAvailableEvents(age)) {
    if (isForeignExclusiveSpineEvent(event, flag)) {
      foreign.push(event.id);
    }
  }
  return foreign;
}

function runFourOriginMatrix(): Array<{
  label: string;
  flag: PrimaryOriginFamilyFlag;
  age: number;
  rolls: number;
  foreignIds: string[];
}> {
  const rows: Array<{
    label: string;
    flag: PrimaryOriginFamilyFlag;
    age: number;
    rolls: number;
    foreignIds: string[];
  }> = [];

  for (const origin of ORIGIN_CASES) {
    for (const age of AGES) {
      const seenForeign = new Set<string>();
      for (let i = 0; i < ROLLS_PER_CELL; i += 1) {
        for (const id of collectForeignIds(origin.flag, age, { p22_live_ops_active: true })) {
          seenForeign.add(id);
        }
      }
      const foreignIds = [...seenForeign];
      rows.push({
        label: origin.label,
        flag: origin.flag,
        age,
        rolls: ROLLS_PER_CELL,
        foreignIds,
      });
      assert(
        foreignIds.length === 0,
        `${origin.label} age ${age}: foreign ids ${foreignIds.join(', ')}`,
      );
    }
  }
  return rows;
}

function formatReport(matrix: Awaited<ReturnType<typeof runFourOriginMatrix>>): string {
  const totalForeign = matrix.reduce((sum, row) => sum + row.foreignIds.length, 0);
  const pass = totalForeign === 0;

  return `# Spine Origin Isolation — Stage-6 (US-005)

**PRD:** \`docs/PRD/early-childhood-spine-origin-isolation.md\`  
**Date:** ${new Date().toISOString()}  
**Decision:** ${pass ? '**PASS**' : '**FAIL**'}  
**Age band:** 0–${SPINE_ORIGIN_EXCLUSIVE_AGE_MAX} (matrix ages ${AGES.join(', ')})  
**Rolls per cell:** ${ROLLS_PER_CELL} \`getAvailableEvents\` scans

## Reproduce

\`\`\`bash
npm exec tsx tests/spineOriginIsolationTests.ts
\`\`\`

## Matrix (origin × age × forbidden ids)

| Origin | Age | Forbidden ids seen |
| --- | --- | --- |
${matrix
  .map(row => `| ${row.label} | ${row.age} | ${row.foreignIds.length === 0 ? '—' : row.foreignIds.join(', ')} |`)
  .join('\n')}

## Summary

- Total foreign exclusive ids across matrix: **${totalForeign}** (target 0)
- Scholar + \`origin_poor_family\` + live_ops: orphan blocked ✅
- Frontier primary: orphan available when conditions match ✅
`;
}

function main(): void {
  testPrimaryResolverScholarOverPoor();
  testPrimaryResolverNullBeforeOriginBackground();
  testScholarBlocksFrontierOrphan();
  testFrontierOrphanSelectableAfterConfigFix();
  const matrix = runFourOriginMatrix();
  const report = formatReport(matrix);
  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, report, 'utf8');
  console.log(`Wrote ${path.relative(process.cwd(), REPORT_PATH)}`);
  console.log('✔ spineOriginIsolationTests passed');
}

main();
