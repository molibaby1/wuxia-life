import {
  AUDIT_VERSION,
  AGE_BANDS,
  runArchetypeDifferentiationAudit,
  runHabitCoverageAudit,
  runCanonicalOperatorAudit,
  runP44HabitOperatorAudit,
  runRecapAbsorptionAudit,
  type P44HabitOperatorAuditResult,
} from '../src/p44/habitOperatorAudit';
import { SHAPING_AXES } from '../src/utils/habitShapingSummary';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function testCoverageAuditShape(): void {
  const result = runHabitCoverageAudit();
  assert(result.readers.length > 0, 'coverage audit should inventory gated readers');
  assert(result.gaps.length > 0, 'expected at least one coverage gap in current pool');

  for (const axis of SHAPING_AXES) {
    const row = result.matrix[axis.key];
    assert(typeof row.total === 'number', `matrix missing total for ${axis.key}`);
    for (const band of AGE_BANDS) {
      assert(typeof row[band.id] === 'number', `matrix missing band ${band.id} for ${axis.key}`);
    }
  }

  for (const gap of result.gaps) {
    assert(gap.severity === 'gap', 'gap entries must use severity gap');
    assert(gap.readerCount === 0, 'gap readerCount must be 0');
  }
  for (const low of result.lowDensity) {
    assert(low.severity === 'low_density', 'low density entries must use severity low_density');
    assert(low.readerCount === 1, 'low density readerCount must be 1');
  }
}

function testCanonicalOperatorAuditShape(): void {
  const result = runCanonicalOperatorAudit();
  assert(result.producerCount > 0, 'canonical audit should find explicit practice producers');
  assert(result.consumerCount > 0, 'canonical audit should find practice trajectory consumers');
  assert(result.forbiddenReferences.length === 0, 'removed compatibility and identity helpers must stay absent');
  assert(result.blockers.length === 0, 'global multipliers must not read practice habits');
}

function testArchetypeDifferentiationAudit(): void {
  const coverage = runHabitCoverageAudit();
  const result = runArchetypeDifferentiationAudit(coverage);
  assert(result.axes.length === SHAPING_AXES.length, 'archetype audit should cover all axes');

  assert(result.axes.every((axis) => axis.axis === 'socialMomentum' || axis.axis === 'familyBond'), 'only social/family axes remain');
  assert(result.convergenceWarnings.length > 0, 'should surface at least one convergence warning');
}

function testRecapAbsorptionAudit(): void {
  const result = runRecapAbsorptionAudit();
  assert(result.wiredSurfaces.length >= 4, 'expected core engine recap surfaces wired');
  assert(result.allRequiredEngineSurfacesWired, 'required engine recap surfaces should be wired');
  assert(
    result.unwiredSurfaces.some((surface) => surface.surface === 'Ending UI'),
    'Ending UI should remain documented deferred surface',
  );
}

function testFullAuditEnvelope(): void {
  const result: P44HabitOperatorAuditResult = runP44HabitOperatorAudit();
  assert(result.auditVersion === AUDIT_VERSION, 'audit version mismatch');
  assert(result.generatedAt.length > 0, 'generatedAt required');
  assert(result.coverage.readers.length > 0, 'envelope coverage required');
  assert(typeof result.operatorAudit.producerCount === 'number', 'operator audit producer count required');
  assert(typeof result.operatorAudit.consumerCount === 'number', 'operator audit consumer count required');
  assert(Array.isArray(result.archetypeDifferentiation.axes), 'archetypeDifferentiation.axes required');
  assert(typeof result.recapAbsorption.allRequiredEngineSurfacesWired === 'boolean', 'recap flag required');
}

function main(): void {
  testCoverageAuditShape();
  testCanonicalOperatorAuditShape();
  testArchetypeDifferentiationAudit();
  testRecapAbsorptionAudit();
  testFullAuditEnvelope();
  console.log('p44HabitAuditTests: all passed');
}

main();
