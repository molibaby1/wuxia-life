import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  buildCohortEvidenceBundle,
  cohortEvidenceItems,
  collectPressureEntriesFromObservable,
  loadCohortRunArtifacts,
} from '../../scripts/evolution/crossRunCohortInvestigation/cohortEvidence';
import {
  COHORT_REGISTRATIONS,
  COHORT_SIGNAL_LINES,
  assertSignalLinesPresentInText,
  buildCohortPlan,
  validateCohortRegistrations,
  writeCohortPlanCreateOnly,
} from '../../scripts/evolution/crossRunCohortInvestigation/cohortPlan';
import {
  buildInvestigationEvidence,
} from '../../scripts/evolution/hypothesisInvestigation/buildInvestigationEvidence';
import type { HypothesisInvestigationSource } from '../../scripts/evolution/hypothesisInvestigation/loadHypothesisInvestigationSource';
import type { ExternalFeedbackSource } from '../../scripts/evolution/improvementHypothesis/loadExternalFeedbackSource';
import { canonicalJson, sha256Hex } from '../../scripts/evolution/phase0/provenance';
import {
  serializeObservablePayload,
  type ObservablePayload,
} from '../../src/evolution/playerObservableTranscript';
import type { HeadlessApiPlayerSurfaceTrace } from '../../src/headless/playability/playerSurfaceCapture';
import { projectHeadlessApiPlayerObservablePayload } from '../../src/evolution/wuxiaPlayerObservableProjector';

function surfaceWithPressure(): HeadlessApiPlayerSurfaceTrace {
  return {
    schemaVersion: 'headless-api-player-surface-source-v1',
    steps: [
      {
        sequence: 1,
        kind: 'active_action_result',
        age: 40,
        actionId: 'action_study_basic',
        presentationCards: [{
          title: '读书',
          body: '你又读了一季。',
          metaLines: ['银两已用尽，当前可见资源压力较高。', '学识 +1'],
        }],
      },
      {
        sequence: 2,
        kind: 'active_action_result',
        age: 41,
        actionId: 'action_study_basic',
        presentationCards: [{
          title: '读书',
          body: '继续读书。',
          metaLines: ['学识 +1'],
        }],
      },
    ],
  };
}

function surfaceWithoutPressure(): HeadlessApiPlayerSurfaceTrace {
  return {
    schemaVersion: 'headless-api-player-surface-source-v1',
    steps: [
      {
        sequence: 1,
        kind: 'active_action_result',
        age: 40,
        actionId: 'action_study_basic',
        presentationCards: [{
          title: '读书',
          body: '你又读了一季。',
          metaLines: ['学识 +1'],
        }],
      },
    ],
  };
}

function payloadFromSurface(surface: HeadlessApiPlayerSurfaceTrace): ObservablePayload {
  return projectHeadlessApiPlayerObservablePayload(surface);
}

function testCohortPlanRoster(): void {
  const plan = buildCohortPlan();
  assert.equal(plan.registrations.length, 8);
  assert.deepEqual(
    plan.registrations.map(entry => [entry.cohortRunId, entry.personaId, entry.seed]),
    COHORT_REGISTRATIONS.map(entry => [entry.cohortRunId, entry.personaId, entry.seed]),
  );
  assert.equal(plan.anchorExcluded.personaId, 'p8-scholar-su');
  assert.equal(plan.anchorExcluded.seed, 101);
  assert.deepEqual([...plan.signalLines], [...COHORT_SIGNAL_LINES]);
  validateCohortRegistrations(plan.registrations);
  assert.throws(
    () => validateCohortRegistrations(plan.registrations.slice(0, 7)),
    /count must be 8/,
  );
  assert.throws(
    () => validateCohortRegistrations([
      ...plan.registrations,
      { cohortRunId: 'cohort-run-000009', personaId: 'p8-martial-lin', seed: 809 },
    ]),
    /count must be 8/,
  );
  assert.throws(
    () => validateCohortRegistrations([
      { cohortRunId: 'cohort-run-000001', personaId: 'p8-scholar-su', seed: 101 },
      ...plan.registrations.slice(1),
    ]),
    /must not be a cohort registration|mismatch/,
  );
}

async function testCohortPlanCreateOnly(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'wuxia-cohort-plan-'));
  const path = join(root, 'cohort-plan.json');
  const first = await writeCohortPlanCreateOnly(path);
  assert.equal(first.plan.registrations.length, 8);
  await assert.rejects(() => writeCohortPlanCreateOnly(path), /already exists/);
}

function testSignalPreflight(): void {
  assertSignalLinesPresentInText(
    `visible: ${COHORT_SIGNAL_LINES[0]} and ${COHORT_SIGNAL_LINES[1]}`,
  );
  assert.throws(
    () => assertSignalLinesPresentInText('no signals here'),
    /preregistered signal missing/,
  );
}

function testExactSignalMatchAndDenominator(): void {
  const plan = buildCohortPlan();
  const withPressure = surfaceWithPressure();
  const withoutPressure = surfaceWithoutPressure();
  const pressureEntries = collectPressureEntriesFromObservable(
    payloadFromSurface(withPressure),
    withPressure,
  );
  assert.equal(pressureEntries.length, 1);
  assert.equal(pressureEntries[0]?.matchedSignalLine, COHORT_SIGNAL_LINES[0]);
  assert.equal(pressureEntries[0]?.actionId, 'action_study_basic');

  const runs = COHORT_REGISTRATIONS.map((registration, index) => ({
    cohortRunId: registration.cohortRunId,
    payload: payloadFromSurface(index === 0 ? withPressure : withoutPressure),
    surface: index === 0 ? withPressure : withoutPressure,
  }));
  const bundle = buildCohortEvidenceBundle({ plan, runs });
  assert.equal(bundle.denominator, 8);
  assert.equal(bundle.runsWithPressureCount, 1);
  assert.deepEqual(bundle.runsWithPressure, ['cohort-run-000001']);
  assert.deepEqual(bundle.runsWithoutPressure, [
    'cohort-run-000002',
    'cohort-run-000003',
    'cohort-run-000004',
    'cohort-run-000005',
    'cohort-run-000006',
    'cohort-run-000007',
    'cohort-run-000008',
  ]);
  assert.equal(bundle.totalOccurrences, 1);
  assert.equal(bundle.runs.length, 8);
  assert.equal(bundle.runs[7]?.pressureEntryCount, 0);
  assert.equal(bundle.runs[0]?.pressureEntryCount, 1);
  assert.deepEqual(bundle.runs[0]?.pressureAgeRange, { min: 40, max: 40 });
  assert.equal(bundle.runs[7]?.pressureAgeRange, null);
}

function testParticipantRedaction(): void {
  const plan = buildCohortPlan();
  const surface = surfaceWithPressure();
  const runs = COHORT_REGISTRATIONS.map(registration => ({
    cohortRunId: registration.cohortRunId,
    payload: payloadFromSurface(surface),
    surface,
  }));
  const bundle = buildCohortEvidenceBundle({ plan, runs });
  const items = cohortEvidenceItems(bundle);
  const serialized = canonicalJson({ bundle, items });
  assert.equal(serialized.includes('p8-'), false);
  assert.equal(/"personaId"|"personaName"|"seed"|prevalenceScore|confidenceScore|significance|populationProbability|"verdict"/.test(serialized), false);
  for (const registration of COHORT_REGISTRATIONS) {
    assert.equal(serialized.includes(registration.cohortRunId), true);
  }
}

async function writeMinimalGameRun(
  root: string,
  surface: HeadlessApiPlayerSurfaceTrace,
): Promise<string> {
  const gameRunPath = join(root, 'game-runs', 'ae-fresh-problem-transfer-001');
  await mkdir(join(gameRunPath, 'internal'), { recursive: true });
  await mkdir(join(gameRunPath, 'inputs'), { recursive: true });
  await writeFile(
    join(gameRunPath, 'internal', 'player-surface-source.json'),
    canonicalJson(surface),
  );
  await writeFile(
    join(gameRunPath, 'inputs', 'catalog.json'),
    canonicalJson({
      schemaVersion: 'phase0-catalog-input-v1',
      events: [{
        id: 'family_study',
        type: 'story',
        category: 'life',
        title: '读书',
        text: '读书',
        weight: 1,
        storyLine: 'family_life',
        choices: [],
      }],
    }),
  );
  return gameRunPath;
}

async function testObservableSerializationGate(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'wuxia-cohort-serialization-'));
  const surface = surfaceWithPressure();
  const gameRunPath = await writeMinimalGameRun(root, surface);
  const payload = payloadFromSurface(surface);
  const payloadPath = join(gameRunPath, 'reviewer-input', 'observable-payload.json');
  await mkdir(join(gameRunPath, 'reviewer-input'), { recursive: true });
  await writeFile(payloadPath, `${serializeObservablePayload(payload)}\n`);
  await assert.rejects(
    () => loadCohortRunArtifacts({ gameRunPath }),
    /serialization mismatch/,
  );
  await writeFile(payloadPath, serializeObservablePayload(payload));
  const loaded = await loadCohortRunArtifacts({ gameRunPath });
  assert.deepEqual(loaded.payload, payload);
}

function buildSource(input: {
  gameRunPath: string;
  surface: HeadlessApiPlayerSurfaceTrace;
}): HypothesisInvestigationSource {
  const projected = projectHeadlessApiPlayerObservablePayload(input.surface);
  const observablePayloadBytes = serializeObservablePayload(projected);
  const feedback = {
    overallImpression: '银两压力明显。',
    observations: [
      { feedback: '晚局反复出现银两压力。', evidenceRefs: ['entry-000001'] },
    ],
  };
  const feedbackBytes = canonicalJson(feedback);
  const mefSource: ExternalFeedbackSource = {
    runRef: 'ae-fresh-problem-transfer-001',
    feedbackInvocationRef: 'ae-fresh-problem-transfer-001-deepseek-player-feedback-001',
    experimentRootHash: 'a'.repeat(64),
    observablePayloadHash: 'b'.repeat(64),
    feedbackHash: 'c'.repeat(64),
    observablePayloadBytes,
    feedbackBytes,
    rawFeedbackParticipantResponse: feedbackBytes,
    observablePayload: projected,
    feedback,
  };
  const selectedHypothesis = {
    hypothesisId: 'hypothesis-000001',
    hypothesis: '晚局银两压力反复出现。',
    observedBasis: 'participant 提到银两压力。',
    feedbackRefs: ['overallImpression'],
    evidenceRefs: ['entry-000001'],
    unknowns: ['是否在其他 run 中常见。'],
    productSignificance: '可能影响晚局体验。',
  };
  return {
    runRef: 'ae-fresh-problem-transfer-001',
    hypothesisId: 'hypothesis-000001',
    feedbackInvocationRef: mefSource.feedbackInvocationRef,
    hypothesisInvocationRef: 'ae-fresh-problem-transfer-001-deepseek-improvement-hypothesis-001',
    experimentRootHash: mefSource.experimentRootHash,
    observablePayloadHash: mefSource.observablePayloadHash,
    feedbackHash: mefSource.feedbackHash,
    hypothesesHash: 'd'.repeat(64),
    selectedHypothesisHash: 'e'.repeat(64),
    selectedHypothesis,
    sourceHypothesesBytes: '{}',
    sourceHypothesisInvocationBytes: '{}',
    mefSource,
    gameRunPath: input.gameRunPath,
  };
}

async function testCohortV1Composition(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'wuxia-cohort-v1-'));
  const surface = surfaceWithPressure();
  const gameRunPath = await writeMinimalGameRun(root, surface);
  const source = buildSource({ gameRunPath, surface });

  const longitudinal = await buildInvestigationEvidence({
    source,
    evidenceMode: 'longitudinal-v1',
  });
  const longitudinalHash = sha256Hex(canonicalJson(longitudinal));

  const plan = buildCohortPlan();
  const zero = surfaceWithoutPressure();
  const bundle = buildCohortEvidenceBundle({
    plan,
    runs: COHORT_REGISTRATIONS.map((registration, index) => ({
      cohortRunId: registration.cohortRunId,
      payload: payloadFromSurface(index === 0 ? surface : zero),
      surface: index === 0 ? surface : zero,
    })),
  });
  const cohort = await buildInvestigationEvidence({
    source,
    evidenceMode: 'cohort-v1',
    cohortEvidence: { items: cohortEvidenceItems(bundle) },
  });

  assert.equal(cohort.schemaVersion, 'hypothesis-investigation-evidence-v3');
  assert.equal(cohort.evidenceMode, 'cohort-v1');
  assert.equal(cohort.items.some(item => item.evidenceId === 'cohort:summary'), true);
  assert.equal(cohort.items.some(item => item.evidenceId === 'cohort:cohort-run-000008'), true);
  for (const item of longitudinal.items) {
    const match = cohort.items.find(candidate => candidate.evidenceId === item.evidenceId);
    assert.ok(match);
    assert.equal(canonicalJson(match), canonicalJson(item));
  }
  assert.equal(
    sha256Hex(canonicalJson(await buildInvestigationEvidence({
      source,
      evidenceMode: 'longitudinal-v1',
    }))),
    longitudinalHash,
  );
  assert.equal(canonicalJson(cohort), canonicalJson(await buildInvestigationEvidence({
    source,
    evidenceMode: 'cohort-v1',
    cohortEvidence: { items: cohortEvidenceItems(bundle) },
  })));
  const forbidden = canonicalJson(cohort);
  assert.equal(forbidden.includes('p8-martial-lin'), false);
  assert.equal(forbidden.includes('"seed"'), false);
}

export async function runCrossRunCohortInvestigationTests(): Promise<void> {
  testCohortPlanRoster();
  await testCohortPlanCreateOnly();
  testSignalPreflight();
  testExactSignalMatchAndDenominator();
  testParticipantRedaction();
  await testObservableSerializationGate();
  await testCohortV1Composition();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCrossRunCohortInvestigationTests()
    .then(() => console.log('crossRunCohortInvestigation.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
