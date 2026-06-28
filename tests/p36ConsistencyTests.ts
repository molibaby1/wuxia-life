/**
 * P36 extended consequence consistency regression — isolated entry.
 * Runs independently: npm exec tsx tests/p36ConsistencyTests.ts
 */
import {
  runP36ExtendedConsequenceConsistencySlice,
  type P36ConsistencySliceResult,
} from '../src/p25/p36ConsequenceConsistencySlice';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function testLifetimeTraceFixtures(result: P36ConsistencySliceResult): void {
  const fixtures = result.lifetimeTracePaths;
  assert(fixtures.length === 3, 'three P34/P35 lifetime trace fixtures');
  assert(
    fixtures.some(f => f.id === 'p34_medical_habit_zero_lifetime'),
    'includes P34 medical lifetime',
  );
  assert(
    fixtures.some(f => f.id === 'p35_mixed_healer_swordsman_habit_zero_lifetime'),
    'includes P35 mixed lifetime',
  );
  assert(
    fixtures.some(f => f.id === 'p35_pinnacle_myth_legend_habit_zero_lifetime'),
    'includes P35 pinnacle lifetime',
  );
}

function testExtendedConsistencySlice(result: P36ConsistencySliceResult): void {
  assert(result.lifetimeTracePathCount === 3, 'three lifetime traces audited');
  assert(result.pathCount >= 8, 'P25 + P34/P35 paths combined');
  assert(result.highSeverityContradictionCount === 0, `high severity: ${JSON.stringify(result.findings)}`);
  assert(result.section8Item3Status === 'Met', '§8 item 3 Met in extended slice');
  assert(result.passed, 'extended consistency slice passes');
  for (const trace of result.perTraceFindings) {
    assert(trace.findings.length === 0, `${trace.pathId} has contradictions`);
  }
}

function main(): void {
  const result = runP36ExtendedConsequenceConsistencySlice();
  testLifetimeTraceFixtures(result);
  testExtendedConsistencySlice(result);
  console.log('p36ConsistencyTests: all passed');
}

main();
