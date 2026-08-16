/**
 * P39 extended content pool consistency regression — isolated entry.
 * Runs independently: npm exec tsx tests/p39ContentPoolConsistencyTests.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import {
  P39_CONTENT_POOL_SAMPLE_PATHS,
  runP39ExtendedContentPoolConsistencySlice,
  type P39ConsistencySliceResult,
} from '../src/p25/p39ContentPoolConsistencySlice';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function testPathCoverage(result: P39ConsistencySliceResult): void {
  assert(result.pathCount >= 12, `at least 12 audited paths, got ${result.pathCount}`);
  assert(result.p36BaselinePathCount === 8, 'P36 baseline unchanged at 8 paths');
  assert(result.p37LifetimeTracePathCount === 2, 'two P37 lifetime traces');
  assert(result.contentPoolSamplePathCount >= 2, 'at least two pool sample paths');

  const lifetimeIds = result.lifetimeTracePaths.map(p => p.id);
  assert(
    lifetimeIds.includes('p37_mixed_merchant_patron_habit_zero_lifetime'),
    'includes P37 merchant_martial_patron trace',
  );
  assert(
    lifetimeIds.includes('p37_pinnacle_founding_patriarch_habit_zero_lifetime'),
    'includes P37 founding_patriarch trace',
  );

  const poolIds = result.contentPoolSamplePaths.map(p => p.id);
  for (const sample of P39_CONTENT_POOL_SAMPLE_PATHS) {
    assert(poolIds.includes(sample.id), `includes pool sample ${sample.id}`);
  }
}

function testConsistencySlice(result: P39ConsistencySliceResult): void {
  assert(result.highSeverityContradictionCount === 0, `high severity: ${JSON.stringify(result.findings)}`);
  assert(result.section8Item3Status === 'Met', '§8 item 3 Met in extended pool slice');
  assert(result.passed, 'extended content pool consistency slice passes');
  assert(result.p36Baseline.highSeverityContradictionCount === 0, 'P36 baseline carry-forward');

  for (const trace of result.perPathFindings) {
    const high = trace.findings.filter(f => f.severity === 'high' || f.severity === 'critical');
    assert(high.length === 0, `${trace.pathId} has high/critical contradictions`);
  }
}

function testPlayabilityGateCarryForward(): void {
  const gatePath = path.join(process.cwd(), 'tests/fixtures/gates/p8-playability-gate-latest.json');
  assert(fs.existsSync(gatePath), 'p8-playability-gate-latest.json must exist under tests/fixtures/gates');
  const gate = JSON.parse(fs.readFileSync(gatePath, 'utf8')) as { decision?: string };
  const decision = gate.decision?.toUpperCase();
  assert(decision === 'PASS', `gate:playability must remain PASS, got ${gate.decision}`);
}

function main(): void {
  const result = runP39ExtendedContentPoolConsistencySlice();
  testPathCoverage(result);
  testConsistencySlice(result);
  testPlayabilityGateCarryForward();
  console.log('p39ContentPoolConsistencyTests: all passed');
}

main();
