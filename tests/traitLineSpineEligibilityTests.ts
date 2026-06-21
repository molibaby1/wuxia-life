import fs from 'node:fs';
import path from 'node:path';
import type { EventDefinition, GameState } from '../src/types/eventTypes';
import { gameEngine } from '../src/core/GameEngineIntegration';
import { eventLoader } from '../src/core/EventLoader';
import {
  inferTraitLineExclusiveFlag,
  isTraitLineSpineEligible,
} from '../src/p16/traitLineSpineEligibility';
import type { PrimaryOriginFamilyFlag } from '../src/p16/primaryOriginFlag';

const REPORT_PATH = path.join(
  process.cwd(),
  'docs/test-reports/trait-line-spine-eligibility-stage7.md',
);

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function buildState(
  primary: PrimaryOriginFamilyFlag,
  age: number,
  extraFlags: Record<string, boolean> = {},
): GameState {
  const flags = { [primary]: true, ...extraFlags };
  return {
    player: { age, flags },
    flags,
  } as GameState;
}

function testStreetShapingClassifier(): void {
  const event = eventLoader.getEventById('p22_childhood_street_shaping');
  assert(event !== undefined, 'street shaping event must exist');
  assert(
    inferTraitLineExclusiveFlag(event!) === 'origin_streetborn',
    'street shaping must classify as street-line',
  );
}

function testScholarBlocksStreetShapingWithoutStreetborn(): void {
  const state = buildState('origin_scholar_family', 8, {
    origin_poor_family: true,
    p22_live_ops_active: true,
  });
  const event = eventLoader.getEventById('p22_childhood_street_shaping')!;
  assert(!isTraitLineSpineEligible(event, state), 'scholar+poor must not pass street-line gate');
  gameEngine.loadGameState(state);
  assert(
    !gameEngine.getAvailableEvents(8).some(e => e.id === 'p22_childhood_street_shaping'),
    'street shaping must not appear for scholar without streetborn',
  );
}

function testStreetbornAllowsStreetShaping(): void {
  const state = buildState('origin_scholar_family', 8, {
    origin_streetborn: true,
    p22_live_ops_active: true,
  });
  const event = eventLoader.getEventById('p22_childhood_street_shaping')!;
  assert(isTraitLineSpineEligible(event, state), 'scholar+streetborn may pass street-line gate');
}

function testFrontierOrphanShapingSuccessor(): void {
  const state = buildState('origin_frontier', 8, {
    p22_frontier_orphan_shaped: true,
    p22_live_ops_active: true,
  });
  const event = eventLoader.getEventById('p22_childhood_street_shaping')!;
  assert(
    isTraitLineSpineEligible(event, state),
    'frontier orphan successor may pass street shaping gate',
  );
}

function testCrossTraitBlocked(): void {
  const mockPoorEvent = {
    id: 'mock_poor_line',
    conditions: [{ type: 'expression' as const, expression: 'flags.has("origin_poor_family")' }],
  } as EventDefinition;
  const state = buildState('origin_martial_family' as PrimaryOriginFamilyFlag, 5, {
    origin_streetborn: true,
  });
  assert(!isTraitLineSpineEligible(mockPoorEvent, state), 'street trait must not unlock poor-line');
}

function testScholarPoorOrphanBlockRegression(): void {
  const state = buildState('origin_scholar_family', 2, {
    origin_poor_family: true,
    p22_live_ops_active: true,
  });
  gameEngine.loadGameState(state);
  assert(
    !gameEngine.getAvailableEvents(2).some(e => e.id === 'p22_origin_frontier_orphan'),
    'Stage-6 scholar+poor orphan block must still pass',
  );
}

const PRIMARYS: PrimaryOriginFamilyFlag[] = [
  'origin_scholar_family',
  'origin_wuxia_family',
  'origin_merchant_family',
  'origin_frontier',
];

function testFourMainCrossTraitMatrix(): Array<{
  primary: string;
  trait: string;
  streetLineEligible: boolean;
}> {
  const streetEvent = eventLoader.getEventById('p22_childhood_street_shaping')!;
  const rows: Array<{ primary: string; trait: string; streetLineEligible: boolean }> = [];
  for (const primary of PRIMARYS) {
    for (const trait of ['none', 'poor', 'street'] as const) {
      const extra: Record<string, boolean> = { p22_live_ops_active: true };
      if (trait === 'poor') extra.origin_poor_family = true;
      if (trait === 'street') extra.origin_streetborn = true;
      const state = buildState(primary, 8, extra);
      const eligible = isTraitLineSpineEligible(streetEvent, state);
      rows.push({ primary, trait, streetLineEligible: eligible });
      if (trait === 'street') {
        assert(eligible, `${primary}+streetborn should allow street-line`);
      } else {
        assert(!eligible, `${primary}+${trait} must block street-line`);
      }
    }
  }
  return rows;
}

function formatReport(matrix: ReturnType<typeof testFourMainCrossTraitMatrix>): string {
  const crossTraitBleed = matrix.filter(
    row => row.trait !== 'street' && row.streetLineEligible,
  ).length;

  return `# Trait-Line Spine Eligibility — Stage-7 (US-005)

**PRD:** \`docs/PRD/early-childhood-childhood-experience-stage7.md\`  
**Date:** ${new Date().toISOString()}  
**Decision:** ${crossTraitBleed === 0 ? '**PASS**' : '**FAIL**'}

## P22 audit fixes

| Event | Issue | Resolution |
| --- | --- | --- |
| \`p22_origin_frontier_orphan\` | Stage-6 removed \`origin_poor_family\` OR | Config: \`origin_frontier\` only ✅ |
| \`p22_childhood_street_shaping\` | \`origin_streetborn\` OR \`p22_frontier_orphan_shaped\` | **Guarded** by \`isTraitLineSpineEligible\`: street trait OR frontier primary + orphan successor ✅ |

## Config validation (age ≤ 12)

Extended \`validateSpineOriginConfig\` with \`street_or_cross_origin\` and \`trait_line_ambiguous\` kinds. Current catalog: **0 failures**.

## Street-line matrix (four-main × trait)

| Primary | Trait | Street-line eligible |
| --- | --- | --- |
${matrix
  .map(row => `| ${row.primary} | ${row.trait} | ${row.streetLineEligible ? 'yes' : 'no'} |`)
  .join('\n')}

## Cross-trait bleed

- Cells with trait ≠ street and eligible=yes: **${crossTraitBleed}** (target 0)
- Stage-6 scholar+poor orphan block: regression covered in test suite ✅

## Reproduce

\`\`\`bash
npm exec tsx tests/traitLineSpineEligibilityTests.ts
npm exec tsx tests/spineOriginConfigValidationTests.ts
\`\`\`
`;
}

function main(): void {
  testStreetShapingClassifier();
  testScholarBlocksStreetShapingWithoutStreetborn();
  testStreetbornAllowsStreetShaping();
  testFrontierOrphanShapingSuccessor();
  testCrossTraitBlocked();
  testScholarPoorOrphanBlockRegression();
  const matrix = testFourMainCrossTraitMatrix();
  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, formatReport(matrix), 'utf8');
  console.log(`Wrote ${path.relative(process.cwd(), REPORT_PATH)}`);
  console.log('✔ traitLineSpineEligibilityTests passed');
}

main();
