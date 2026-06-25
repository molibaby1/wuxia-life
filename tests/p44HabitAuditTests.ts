import {
  AUDIT_VERSION,
  AGE_BANDS,
  runArchetypeDifferentiationAudit,
  runHabitCoverageAudit,
  runLegacyFlagDriftAudit,
  runP44HabitOperatorAudit,
  runRecapAbsorptionAudit,
  type HabitCoverageAuditResult,
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

function testLegacyDriftAuditShape(): void {
  const result = runLegacyFlagDriftAudit();
  assert(result.hits.length > 0, 'legacy drift should find known compatibility hits');
  assert(result.allowedCount + result.suspiciousCount === result.hits.length, 'hit counts must reconcile');

  const contentHits = result.hits.filter((hit) => hit.file.startsWith('src/data/lines/'));
  assert(contentHits.length > 0, 'should scan content pools for legacy references');
  assert(
    contentHits.every((hit) => hit.classification === 'allowed_compatibility'),
    'content co-gates with lifeStates should classify as allowed compatibility',
  );
}

function testArchetypeDifferentiationAudit(): void {
  const coverage = runHabitCoverageAudit();
  const result = runArchetypeDifferentiationAudit(coverage);
  assert(result.axes.length === SHAPING_AXES.length, 'archetype audit should cover all axes');

  const training = result.axes.find((axis) => axis.axis === 'trainingHabit');
  assert(training != null, 'trainingHabit report missing');
  assert(training.differentiation === 'strong', 'trainingHabit should have strong differentiation after P42');

  const business = result.axes.find((axis) => axis.axis === 'businessHabit');
  assert(business != null, 'businessHabit report missing');
  assert(
    business.differentiation === 'partial' || business.differentiation === 'thin',
    'businessHabit should remain partial or thin differentiation',
  );
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
  assert(Array.isArray(result.legacyDrift.hits), 'legacyDrift.hits required');
  assert(Array.isArray(result.archetypeDifferentiation.axes), 'archetypeDifferentiation.axes required');
  assert(typeof result.recapAbsorption.allRequiredEngineSurfacesWired === 'boolean', 'recap flag required');
}

function testP42ChildhoodReaderPresent(coverage: HabitCoverageAuditResult): void {
  const childhoodStudy = coverage.readers.find(
    (reader) => reader.eventId === 'p42_study_habit_childhood_copybook',
  );
  assert(childhoodStudy != null, 'P42 childhood study reader should be inventoried');
  assert(childhoodStudy.bands.includes('childhood'), 'childhood copybook should map to childhood band');
}

function main(): void {
  testCoverageAuditShape();
  testLegacyDriftAuditShape();
  testArchetypeDifferentiationAudit();
  testRecapAbsorptionAudit();
  testFullAuditEnvelope();
  testP42ChildhoodReaderPresent(runHabitCoverageAudit());
  console.log('p44HabitAuditTests: all passed');
}

main();
