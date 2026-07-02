/**
 * P120 founding-patriarch spine consistency regression — isolated entry.
 * Runs independently: npm exec tsx tests/p120FoundingPatriarchSpineConsistencyTests.ts
 */
import {
  buildP113P119FoundingPatriarchSpineFixtures,
  runP120FoundingPatriarchSpineConsistencySlice,
} from '../src/p25/p120FoundingPatriarchSpineConsistencySlice';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function testSpinePathCoverage(): void {
  const paths = buildP113P119FoundingPatriarchSpineFixtures();
  assert(paths.length === 2, `expected 2 spine paths, got ${paths.length}`);
  const ids = paths.map(p => p.id);
  assert(
    ids.includes('p120_founding_patriarch_spine_rule_keeper_endgame'),
    'includes rule_keeper endgame spine',
  );
  assert(
    ids.includes('p120_founding_patriarch_spine_alliance_bearer_endgame'),
    'includes alliance_bearer endgame spine',
  );
}

function testConsistencySlice(result: ReturnType<typeof runP120FoundingPatriarchSpineConsistencySlice>): void {
  assert(result.spinePathCount === 2, 'two P113–P119 spine traces');
  assert(result.pathCount >= 15, `at least 15 total paths (P39+spine), got ${result.pathCount}`);
  assert(result.highSeverityContradictionCount === 0, `high severity: ${JSON.stringify(result.findings)}`);
  assert(result.section8Item3SpineExtension === 'Met', '§8 item 3 spine extension Met');
  assert(result.passed, 'P120 founding-patriarch spine consistency passes');

  for (const trace of result.perPathFindings) {
    const high = trace.findings.filter(f => f.severity === 'high' || f.severity === 'critical');
    assert(high.length === 0, `${trace.pathId} has high/critical contradictions`);
  }
}

function main(): void {
  testSpinePathCoverage();
  const result = runP120FoundingPatriarchSpineConsistencySlice();
  testConsistencySlice(result);
  console.log('p120FoundingPatriarchSpineConsistencyTests: all passed');
}

main();
