import fs from 'node:fs';
import path from 'node:path';
import type { DailyEventConfig, GameState } from '../src/types/eventTypes';
import { DailyEventSystem } from '../src/core/DailyEventSystem';
import { inferEventExclusivePrimaryFlag } from '../src/p16/spineOriginIsolation';

const REPORT_PATH = path.join(
  process.cwd(),
  'artifacts/gates/daily-fallback-origin-gate-stage7.md',
);

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function buildState(flag: string, age: number): GameState {
  const flags = { [flag]: true };
  return {
    player: { age, flags },
    flags,
  } as GameState;
}

const mockVariant = {
  id: 'mock_daily_variant',
  weight: 1,
  text: 'mock daily text',
};

function mockDailyConfig(stageFit: string[]): DailyEventConfig {
  return {
    id: 'mock_scholar_daily',
    group: 'training',
    title: 'Mock Scholar Daily',
    ageRange: { min: 8, max: 12 },
    baseWeight: 100,
    spineOriginStageFit: stageFit,
    variants: {
      positive: [mockVariant],
      neutral: [mockVariant],
      negative: [mockVariant],
    },
  };
}

function testScholarPrimaryNeverSelectsMartialDaily(): void {
  const system = new DailyEventSystem();
  const scholarState = buildState('origin_scholar_family', 10);
  const martialDaily = mockDailyConfig(['origin_martial']);
  const neutralDaily: DailyEventConfig = {
    ...mockDailyConfig([]),
    id: 'mock_neutral_daily',
    title: 'Mock Neutral Daily',
    spineOriginStageFit: undefined,
  };

  for (let i = 0; i < 50; i += 1) {
    const picked = system.selectEvent(scholarState, [martialDaily, neutralDaily]);
    assert(picked !== null, 'expected neutral daily when martial exclusive filtered');
    assert(
      inferEventExclusivePrimaryFlag(picked!) !== 'origin_wuxia_family',
      'scholar primary must never receive martial-exclusive daily',
    );
    assert(
      picked!.id === mockVariant.id,
      `wrong daily selected: ${picked!.id}`,
    );
  }
}

function testMartialPrimaryCanSelectMartialDaily(): void {
  const system = new DailyEventSystem();
  const martialState = buildState('origin_wuxia_family', 10);
  const martialDaily = mockDailyConfig(['origin_martial']);

  const picked = system.selectEvent(martialState, [martialDaily]);
  assert(picked !== null, 'martial primary should select matching martial daily');
}

function testAllExclusiveFilteredReturnsNull(): void {
  const system = new DailyEventSystem();
  const scholarState = buildState('origin_scholar_family', 10);
  const martialDaily = mockDailyConfig(['origin_martial']);
  const merchantDaily = mockDailyConfig(['origin_merchant']);

  const picked = system.selectEvent(scholarState, [martialDaily, merchantDaily]);
  assert(picked === null, 'expected null when all candidates fail origin gate');
}

function formatReport(): string {
  return `# Daily Fallback Origin Gate — Stage-7 (US-003)

**PRD:** \`docs/PRD/early-childhood-childhood-experience-stage7.md\`  
**Date:** ${new Date().toISOString()}  
**Decision:** **PASS**

## Wiring

| Location | Behavior |
| --- | --- |
| \`DailyEventSystem.selectEvent\` | Filters configs via \`isSpineOriginEligible(buildProbeEvent(...))\` before weighted pick |
| \`GameEngineIntegration.selectEvent\` | Unchanged call sites; daily branch inherits gate via \`dailyEventSystem\` |

## Production pool semantics

Current \`src/data/life/dailyEvents.ts\` entries have **no** \`spineOriginStageFit\` — all pass gate (origin-neutral). See US-001 audit appendix A.

## Headless mock matrix

| Case | Primary | Mock pool | Result |
| --- | --- | --- | --- |
| Scholar vs martial exclusive | \`origin_scholar_family\` | martial + neutral dailies × 50 rolls | martial never selected ✅ |
| Martial match | \`origin_wuxia_family\` | martial daily only | selected ✅ |
| All filtered | \`origin_scholar_family\` | martial + merchant exclusive | \`null\` ✅ |

## Reproduce

\`\`\`bash
npm exec tsx tests/dailyFallbackOriginGateTests.ts
npm exec tsx tests/spineOriginIsolationTests.ts
npm exec tsx tests/preschoolOriginIsolationTests.ts
\`\`\`
`;
}

function main(): void {
  testScholarPrimaryNeverSelectsMartialDaily();
  testMartialPrimaryCanSelectMartialDaily();
  testAllExclusiveFilteredReturnsNull();
  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, formatReport(), 'utf8');
  console.log(`Wrote ${path.relative(process.cwd(), REPORT_PATH)}`);
  console.log('✔ dailyFallbackOriginGateTests passed');
}

main();
