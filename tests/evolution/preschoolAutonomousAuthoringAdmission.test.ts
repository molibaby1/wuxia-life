import assert from 'node:assert/strict';
import { copyFile, mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  evaluatePreschoolAutonomousAuthoringAdmission,
} from '../../scripts/evolution/autonomousAuthoring/evaluatePreschoolAuthoringAdmission';
import { buildPreschoolAutonomousAuthoringContractPacket } from '../../scripts/evolution/autonomousAuthoring/buildPreschoolContractPacket';
import { runCandidateLane } from '../../scripts/evolution/runCandidateLane';
import { infantPassiveNarrativeCatalog } from '../../src/data/infantPassiveNarrativeCatalog';
import { getPreschoolPassiveEntries, isPreschoolPassiveEligible } from '../../src/data/preschoolPassiveSpine';
import type { WorkspaceAgentParticipantOptions } from '../../scripts/evolution/problemAgnosticSolution/agentParticipant';
import { canonicalJson } from '../../scripts/evolution/phase0/provenance';
import { projectHeadlessApiPlayerObservablePayload } from '../../src/evolution/wuxiaPlayerObservableProjector';
import { serializeObservablePayload } from '../../src/evolution/playerObservableTranscript';
import { HEADLESS_API_PLAYER_SURFACE_SOURCE_VERSION } from '../../src/headless/playability/playerSurfaceCapture';
import {
  validateAutonomousAuthoringAdmission,
  validatePreschoolCapacityEvidence,
  type PreschoolCapacityEvidenceV1,
} from '../../src/evolution/autonomousAuthoringAdmissionContract';
import { validateSolutionWork, type SolutionOptionV1 } from '../../src/evolution/solutionWorkContract';
import { validateSolutionReview, type SolutionReviewV1 } from '../../src/evolution/solutionReviewContract';
import type { AutonomousAuthoringProposalV1 } from '../../src/evolution/autonomousAuthoringContract';
import { PRESCHOOL_SHARED_NEUTRAL_ALLOWED_WRITE_PATHS } from '../../src/evolution/preschoolSharedNeutralAuthoringContract';
import type { PreschoolSharedNeutralAuthoringCardV1 } from '../../src/evolution/preschoolSharedNeutralAuthoringContract';

const RUN_REF = 'cohort-run-000001';
const CONTRACT_ID = 'preschool-shared-neutral-passive-capacity-v1';
const SOURCE_AUTHORITY = 'docs/superpowers/specs/2026-09-24-contract-constrained-autonomous-authoring-v1-design.md';

function catalogEntries() {
  return [
    { id: 'preschool_martial_seed', title: 'Seed', text: 'Seed.', originTags: ['martial'], ageMin: 3, ageMax: 4 },
    { id: 'preschool_neutral_age_four', title: 'Four', text: 'Four.', originTags: ['neutral'], ageMin: 4, ageMax: 4 },
    { id: 'preschool_martial_age_five', title: 'Five', text: 'Five.', originTags: ['martial'], ageMin: 5, ageMax: 7 },
    { id: 'preschool_neutral_through_seven', title: 'Shared', text: 'Shared.', originTags: ['neutral'], ageMin: 5, ageMax: 7 },
    { id: 'preschool_martial_age_six', title: 'Six', text: 'Six.', originTags: ['martial'], ageMin: 6, ageMax: 7 },
    { id: 'preschool_neutral_age_seven', title: 'Seven', text: 'Seven.', originTags: ['neutral'], ageMin: 7, ageMax: 7 },
    { id: 'preschool_scholar_foreign', title: 'Foreign', text: 'Foreign.', originTags: ['scholar'], ageMin: 5, ageMax: 7 },
  ];
}

function responsibility(index: number) {
  return {
    responsibilityId: `responsibility-${String(index).padStart(6, '0')}`,
    primaryLifeFunction: `shared life function ${index}`,
    playerVisibleNeed: `visible need ${index}`,
    evidenceRefs: ['source/observable-payload.json'],
  };
}

function card(index: number): PreschoolSharedNeutralAuthoringCardV1 {
  const item = responsibility(index);
  return {
    responsibilityId: item.responsibilityId,
    primaryLifeFunction: item.primaryLifeFunction,
    playerVisibleNeed: item.playerVisibleNeed,
    developmentalAgeJustification: {
      ageMin: 4,
      whyNotEarlier: 'The child needs more coordination.',
      whyFromThisAge: 'The child can now join the activity.',
      whyThroughAgeSeven: 'The need remains useful through age seven.',
    },
    concreteSceneConcept: 'A child helps with a shared task.',
    existingContentDistinction: {
      closestEntryIds: ['preschool_scholar_foreign'],
      sharedSemanticArea: 'Shared activity.',
      specificDistinction: 'This scene has a different responsibility.',
    },
    actorClass: 'TRANSIENT_ROLE_ONLY',
    pastEvidenceConsumed: 'NONE',
    meaningfulPlayerDecision: 'NONE',
    durableResult: 'EVENT_HISTORY_ID_ONLY',
    futureHook: 'NONE',
    originPortability: 'The scene works across origins.',
    scopeCheck: 'CONTRACT_PRESERVING',
    proposedEntry: {
      id: `preschool_neutral_admission_${index}_memory`,
      title: `Shared memory ${index}`,
      text: 'A short shared childhood scene.',
      originTags: ['neutral'],
      ageMin: 4,
      ageMax: 7,
    },
  };
}

function proposal(input: {
  claim?: AutonomousAuthoringProposalV1['applicabilityClaim'];
  count?: number;
} = {}): AutonomousAuthoringProposalV1 {
  const claim = input.claim ?? 'APPLICABLE';
  const count = input.count ?? 1;
  const responsibilities = claim === 'APPLICABLE'
    ? Array.from({ length: count }, (_, index) => responsibility(index + 1))
    : [];
  return {
    schemaVersion: 'autonomous-authoring-proposal-v1',
    contractId: CONTRACT_ID,
    contractVersion: 1,
    gapClassification: 'CONTENT_GAP',
    gapSubtype: 'CONTENT_CAPACITY_GAP',
    applicabilityClaim: claim,
    authorityRefs: ['docs/governance/product-decisions.md'],
    sourceEvidenceRefs: ['source/observable-payload.json'],
    responsibilities,
    contractPayload: claim === 'APPLICABLE' && count <= 8
      ? { schemaVersion: 'preschool-shared-neutral-passive-authoring-payload-v1', cards: responsibilities.map((_, index) => card(index + 1)) }
      : null,
  };
}

function option(authoring = proposal()): SolutionOptionV1 {
  return validateSolutionWork({
    schemaVersion: 'solution-work-v1',
    status: 'OPTIONS',
    problemId: 'problem-admission',
    options: [{
      optionId: 'option-000001',
      proposedChange: 'Author bounded shared-neutral passive entries.',
      rationale: 'It addresses the observed content gap.',
      repoRefs: ['src/data/lines/preschool-passive-spine.json'],
      artifactRefs: ['source/observable-payload.json'],
      changeScope: 'program',
      expectedPlayerObservableDifference: 'More distinct childhood memories.',
      risks: [],
      unknowns: [],
      autonomousAuthoring: authoring,
    }],
    recommendedOptionId: 'option-000001',
    summary: 'One bounded proposal.',
    repoRefs: [],
    artifactRefs: [],
  }).options[0]!;
}

function review(input: {
  decision?: SolutionReviewV1['decision'];
  assessment?: SolutionReviewV1['autonomousAuthoringAssessment'];
} = {}): SolutionReviewV1 {
  const decision = input.decision ?? 'ACCEPT_OPTION';
  return validateSolutionReview({
    schemaVersion: 'solution-review-v1',
    problemId: 'problem-admission',
    decision,
    ...(decision === 'ACCEPT_OPTION'
      ? { acceptedOptionId: 'option-000001', scopeAssessment: 'code_required' as const, executionAuthorityAssessment: 'WITHIN_CURRENT_AUTHORITY' as const }
      : {}),
    autonomousAuthoringAssessment: input.assessment ?? {
      schemaVersion: 'autonomous-authoring-review-assessment-v1',
      contractId: CONTRACT_ID,
      contractVersion: 1,
      applicabilityAssessment: 'APPLICABLE',
      conformance: 'CONFORMING',
      executionEnvelope: 'WITHIN_ENVELOPE',
      assessment: 'The player-visible evidence supports a missing life function.',
      blockers: [],
    },
    assessment: 'Reviewed against the player-visible evidence and current catalog.',
    repoRefs: [],
    artifactRefs: ['source/observable-payload.json'],
    concerns: [],
  });
}

async function createRepositoryFixture(parent: string, options: {
  authority?: boolean;
  entries?: ReturnType<typeof catalogEntries>;
  mutateAcceptedAuthority?: boolean;
} = {}): Promise<string> {
  const root = join(parent, options.authority === false
    ? 'stale-repository'
    : options.mutateAcceptedAuthority
      ? 'mutated-authority-repository'
      : 'current-repository');
  await mkdir(join(root, 'src/data/lines'), { recursive: true });
  await writeFile(join(root, 'src/data/lines/preschool-passive-spine.json'), JSON.stringify({ entries: options.entries ?? catalogEntries() }));
  if (options.authority !== false) {
    for (const ref of [
      'docs/governance/product-decisions.md',
      'docs/product/content-authoring-workflow-contract-design.md',
      SOURCE_AUTHORITY,
    ]) {
      const target = join(root, ref);
      await mkdir(join(target, '..'), { recursive: true });
      await copyFile(join(process.cwd(), ref), target);
    }
    if (options.mutateAcceptedAuthority) {
      const path = join(root, SOURCE_AUTHORITY);
      const accepted = await readFile(path, 'utf8');
      const mutated = accepted.replace(
        '# Contract-Constrained Autonomous Authoring v1',
        '# Contract-Constrained Autonomous Authoring V1',
      );
      assert.notEqual(mutated, accepted);
      assert.ok(mutated.includes('**HUMAN ACCEPTED — 2026-09-24**'));
      await writeFile(path, mutated);
    }
  }
  return root;
}

async function writeSource(sourceRoot: string, steps: unknown[]): Promise<void> {
  const path = join(sourceRoot, 'game-runs', RUN_REF, 'internal/player-surface-source.json');
  await mkdir(join(path, '..'), { recursive: true });
  await writeFile(path, JSON.stringify({ schemaVersion: 'headless-api-player-surface-source-v1', steps }));
}

function passive(sequence: number, age: number, passiveEntryIds: string[]) {
  return {
    sequence,
    kind: 'passive_narrative' as const,
    age,
    passiveEntryIds,
    presentationCards: [{ title: `Memory ${sequence}`, body: `Visible memory ${sequence}.` }],
  };
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  }
}

function expectedEffectiveCatalogForFixture() {
  return [
    ...infantPassiveNarrativeCatalog.filter(entry => entry.ageMin >= 3 && entry.ageMax <= 7),
    ...catalogEntries(),
  ];
}

function structuralEvidence(): PreschoolCapacityEvidenceV1 {
  return {
    schemaVersion: 'preschool-capacity-evidence-v1',
    runRef: RUN_REF,
    evidenceMode: 'STRUCTURAL_EXHAUSTION',
    canonicalOriginTag: 'martial',
    preConsumedEntryIds: ['preschool_martial_seed', 'child_martial_wooden_dummy', 'toddler_martial_watch', 'toddler_neutral_season'],
    beats: [
      { sequence: 1, age: 4, selectedEntryId: 'preschool_neutral_age_four', kind: 'AUTHORED', legalUnconsumedCountBeforeSelection: 1 },
      { sequence: 2, age: 5, selectedEntryId: 'preschool_martial_age_five', kind: 'AUTHORED', legalUnconsumedCountBeforeSelection: 2 },
      { sequence: 3, age: 5, selectedEntryId: 'preschool_neutral_through_seven', kind: 'AUTHORED', legalUnconsumedCountBeforeSelection: 1 },
      { sequence: 4, age: 5, selectedEntryId: 'preschool_passive_gap', kind: 'GAP', legalUnconsumedCountBeforeSelection: 0 },
    ],
    demandBeats: 4,
    authoredBeats: 3,
    gapBeats: 1,
    foreignOriginLeakCount: 0,
    duplicateAuthoredCount: 0,
  };
}

function input(repositoryRoot: string, sourceRoot: string, selectedOption = option(), reviewer = review()) {
  return {
    repositoryRoot,
    sourceRoot,
    sourceRunRef: RUN_REF,
    selectedOption,
    review: reviewer,
    proposalSha256: 'a'.repeat(64),
    reviewSha256: 'b'.repeat(64),
  };
}

async function testExactAuthorityPacketAndAdmissionIdentity(): Promise<void> {
  const temporaryRoot = await mkdtemp(join(tmpdir(), 'preschool-authority-identity-'));
  try {
    const sourceRoot = join(temporaryRoot, 'source');
    await mkdir(sourceRoot, { recursive: true });
    const repositoryRoot = await createRepositoryFixture(temporaryRoot);
    const acceptedPacket = await buildPreschoolAutonomousAuthoringContractPacket({ repositoryRoot });
    assert.equal(
      acceptedPacket.authoritySourceSha256,
      'bbaa62ed26baa416dc094156189472b8c4ea9b5b84cb4e5dac9a575ddb2ffdbb',
    );
    assert.equal(acceptedPacket.productionPath, 'src/data/lines/preschool-passive-spine.json');
    assert.deepEqual(acceptedPacket.testPaths, [
      'tests/preschoolPassiveSpineTests.ts',
      'tests/annualPassiveMemoryTests.ts',
    ]);
    assert.deepEqual(PRESCHOOL_SHARED_NEUTRAL_ALLOWED_WRITE_PATHS, [
      'src/data/lines/preschool-passive-spine.json',
      'tests/preschoolPassiveSpineTests.ts',
      'tests/annualPassiveMemoryTests.ts',
    ]);

    const mutatedRepositoryRoot = await createRepositoryFixture(temporaryRoot, { mutateAcceptedAuthority: true });
    const mutatedSpec = await readFile(join(mutatedRepositoryRoot, SOURCE_AUTHORITY), 'utf8');
    assert.ok(mutatedSpec.includes('**HUMAN ACCEPTED — 2026-09-24**'));
    const mutatedPacketOutcome = await buildPreschoolAutonomousAuthoringContractPacket({
      repositoryRoot: mutatedRepositoryRoot,
    }).then(() => 'returned', () => 'rejected');
    const mutatedAdmission = await evaluatePreschoolAutonomousAuthoringAdmission(
      input(mutatedRepositoryRoot, sourceRoot),
    );
    assert.deepEqual({
      packet: mutatedPacketOutcome,
      admission: mutatedAdmission.status,
    }, {
      packet: 'rejected',
      admission: 'AUTHORITY_STALE',
    });
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
}

export async function runPreschoolAutonomousAuthoringAdmissionTests(): Promise<void> {
  const temporaryRoot = await mkdtemp(join(tmpdir(), 'preschool-authoring-admission-'));
  try {
    const repositoryRoot = await createRepositoryFixture(temporaryRoot);
    const sourceRoot = join(temporaryRoot, 'source');
    await mkdir(sourceRoot, { recursive: true });

    const runtimeAgeFour = getPreschoolPassiveEntries(4);
    assert.ok(runtimeAgeFour.some(entry => entry.id === 'toddler_martial_watch'));
    assert.ok(runtimeAgeFour.some(entry => entry.id === 'toddler_neutral_season'));

    await writeSource(sourceRoot, [
      passive(1, 3, ['preschool_martial_seed']),
      passive(2, 4, ['toddler_martial_watch']),
    ]);
    const legacySelected = await evaluatePreschoolAutonomousAuthoringAdmission(input(repositoryRoot, sourceRoot));
    assert.equal(legacySelected.status, 'ELIGIBLE');
    assert.deepEqual(legacySelected.capacityEvidence?.preConsumedEntryIds, ['preschool_martial_seed']);
    assert.equal(legacySelected.capacityEvidence?.beats[0]?.selectedEntryId, 'toddler_martial_watch');

    await writeSource(sourceRoot, [
      passive(1, 3, ['child_martial_wooden_dummy']),
      passive(2, 4, ['preschool_neutral_age_four']),
    ]);
    const legacyOriginEvidence = await evaluatePreschoolAutonomousAuthoringAdmission(input(repositoryRoot, sourceRoot));
    assert.equal(legacyOriginEvidence.status, 'ELIGIBLE');
    assert.deepEqual(legacyOriginEvidence.capacityEvidence?.preConsumedEntryIds, ['child_martial_wooden_dummy']);

    const preConsumedForPool = new Set(['preschool_martial_seed']);
    const expectedAgeFourPool = expectedEffectiveCatalogForFixture().filter(entry =>
      isPreschoolPassiveEligible(entry, new Set(['martial']))
      && entry.ageMin <= 4
      && entry.ageMax >= 4
      && !preConsumedForPool.has(entry.id),
    );
    assert.ok(expectedAgeFourPool.some(entry => entry.id === 'toddler_martial_watch'));
    assert.ok(expectedAgeFourPool.some(entry => entry.id === 'toddler_neutral_season'));
    const legacyPoolEvidence = validatePreschoolCapacityEvidence({
      schemaVersion: 'preschool-capacity-evidence-v1',
      runRef: RUN_REF,
      evidenceMode: 'SEMANTIC_VARIETY',
      canonicalOriginTag: 'martial',
      preConsumedEntryIds: [...preConsumedForPool],
      beats: [{
        sequence: 1,
        age: 4,
        selectedEntryId: 'preschool_neutral_age_four',
        kind: 'AUTHORED',
        legalUnconsumedCountBeforeSelection: expectedAgeFourPool.length,
      }],
      demandBeats: 1,
      authoredBeats: 1,
      gapBeats: 0,
      foreignOriginLeakCount: 0,
      duplicateAuthoredCount: 0,
    });
    const legacyPoolAdmission = await evaluatePreschoolAutonomousAuthoringAdmission({
      ...input(repositoryRoot, sourceRoot),
      fixedCapacityEvidence: legacyPoolEvidence,
    });
    assert.equal(legacyPoolAdmission.status, 'ELIGIBLE');
    assert.equal(
      legacyPoolAdmission.capacityEvidence?.beats[0]?.legalUnconsumedCountBeforeSelection,
      expectedAgeFourPool.length,
    );

    await writeSource(sourceRoot, [
      passive(1, 3, ['child_martial_wooden_dummy']),
      passive(2, 5, ['child_scholar_copybook']),
    ]);
    const foreignLegacy = await evaluatePreschoolAutonomousAuthoringAdmission(input(repositoryRoot, sourceRoot));
    assert.equal(foreignLegacy.status, 'NOT_APPLICABLE');

    await writeSource(sourceRoot, [
      passive(1, 3, ['child_martial_wooden_dummy']),
      passive(2, 5, ['toddler_martial_watch']),
    ]);
    const ageIllegalLegacy = await evaluatePreschoolAutonomousAuthoringAdmission(input(repositoryRoot, sourceRoot));
    assert.equal(ageIllegalLegacy.status, 'NOT_APPLICABLE');

    await writeSource(sourceRoot, [
      passive(1, 3, ['child_martial_wooden_dummy']),
      passive(2, 4, ['child_martial_wooden_dummy']),
    ]);
    const reusedLegacy = await evaluatePreschoolAutonomousAuthoringAdmission(input(repositoryRoot, sourceRoot));
    assert.equal(reusedLegacy.status, 'NOT_APPLICABLE');

    await writeSource(sourceRoot, [
      passive(1, 3, ['preschool_martial_seed']),
      passive(2, 4, ['preschool_passive_gap']),
    ]);
    const skippedLegalEntry = await evaluatePreschoolAutonomousAuthoringAdmission(input(repositoryRoot, sourceRoot));
    assert.equal(skippedLegalEntry.status, 'NOT_APPLICABLE');

    await writeSource(sourceRoot, [
      passive(1, 3, ['preschool_martial_seed']),
      { sequence: 2, kind: 'passive_narrative', age: 4 },
    ]);
    const missingPackedIds = await evaluatePreschoolAutonomousAuthoringAdmission(input(repositoryRoot, sourceRoot));
    assert.equal(missingPackedIds.status, 'INSUFFICIENT_EVIDENCE');

    await writeSource(sourceRoot, [
      passive(1, 3, ['preschool_martial_seed']),
      passive(2, 5, ['preschool_scholar_foreign']),
    ]);
    const foreignOrigin = await evaluatePreschoolAutonomousAuthoringAdmission(input(repositoryRoot, sourceRoot));
    assert.equal(foreignOrigin.status, 'NOT_APPLICABLE');

    await writeSource(sourceRoot, []);
    const missingEvidence = await evaluatePreschoolAutonomousAuthoringAdmission(input(repositoryRoot, sourceRoot));
    assert.equal(missingEvidence.status, 'INSUFFICIENT_EVIDENCE');

    const overBudget = await evaluatePreschoolAutonomousAuthoringAdmission(
      input(repositoryRoot, sourceRoot, option(proposal({ count: 9 })), review({
        decision: 'ESCALATE',
        assessment: {
          schemaVersion: 'autonomous-authoring-review-assessment-v1',
          contractId: CONTRACT_ID,
          contractVersion: 1,
          applicabilityAssessment: 'APPLICABLE',
          conformance: 'CONFORMING',
          executionEnvelope: 'EXECUTION_ENVELOPE_EXCEEDED',
          assessment: 'The minimum responsibility set exceeds the pilot limit.',
          blockers: ['The minimum set contains nine responsibilities.'],
        },
      })),
    );
    assert.equal(overBudget.status, 'EXECUTION_ENVELOPE_EXCEEDED');

    for (const claim of ['NOT_APPLICABLE', 'INSUFFICIENT_EVIDENCE', 'CONTRACT_CHANGE_REQUIRED'] as const) {
      const mapped = await evaluatePreschoolAutonomousAuthoringAdmission(
        input(repositoryRoot, sourceRoot, option(proposal({ claim }))),
      );
      assert.equal(mapped.status, claim);
    }

    const staleRepositoryRoot = await createRepositoryFixture(temporaryRoot, { authority: false });
    const stale = await evaluatePreschoolAutonomousAuthoringAdmission(
      input(staleRepositoryRoot, sourceRoot, option(), review()),
    );
    assert.equal(stale.status, 'AUTHORITY_STALE');

    const structural = await evaluatePreschoolAutonomousAuthoringAdmission({
      ...input(repositoryRoot, sourceRoot),
      fixedCapacityEvidence: structuralEvidence(),
    });
    assert.equal(structural.status, 'ELIGIBLE');
    assert.equal(structural.capacityEvidence?.evidenceMode, 'STRUCTURAL_EXHAUSTION');
    assert.equal(structural.capacityEvidence?.preConsumedEntryIds[0], 'preschool_martial_seed');

    await writeSource(sourceRoot, [
      passive(1, 3, ['preschool_martial_seed', 'child_martial_wooden_dummy', 'toddler_martial_watch', 'toddler_neutral_season']),
      passive(2, 4, ['preschool_neutral_age_four']),
      passive(3, 5, ['preschool_martial_age_five']),
      passive(4, 5, ['preschool_neutral_through_seven']),
      passive(5, 5, ['preschool_passive_gap']),
    ]);
    const naturalStructural = await evaluatePreschoolAutonomousAuthoringAdmission(input(repositoryRoot, sourceRoot));
    assert.equal(naturalStructural.status, 'ELIGIBLE');
    assert.equal(naturalStructural.capacityEvidence?.evidenceMode, 'STRUCTURAL_EXHAUSTION');

    const unreferenced = proposal();
    unreferenced.sourceEvidenceRefs = [];
    unreferenced.responsibilities[0]!.evidenceRefs = [];
    const missingParticipantRefs = await evaluatePreschoolAutonomousAuthoringAdmission(
      input(repositoryRoot, sourceRoot, option(unreferenced)),
    );
    assert.equal(missingParticipantRefs.status, 'INSUFFICIENT_EVIDENCE');

    const wrongScope = await evaluatePreschoolAutonomousAuthoringAdmission(
      input(repositoryRoot, sourceRoot, { ...option(), changeScope: 'configuration' }),
    );
    assert.equal(wrongScope.status, 'CONTRACT_CHANGE_REQUIRED');

    await writeSource(sourceRoot, [
      passive(1, 3, ['preschool_martial_seed', 'child_martial_wooden_dummy', 'toddler_martial_watch', 'toddler_neutral_season']),
      passive(2, 4, ['preschool_neutral_age_four']),
      passive(3, 5, ['preschool_martial_age_five']),
      passive(4, 6, ['preschool_martial_age_six']),
      passive(5, 7, ['preschool_neutral_age_seven']),
    ]);
    const semanticVariety = await evaluatePreschoolAutonomousAuthoringAdmission(input(repositoryRoot, sourceRoot));
    assert.equal(semanticVariety.status, 'ELIGIBLE');
    assert.equal(semanticVariety.capacityEvidence?.evidenceMode, 'SEMANTIC_VARIETY');
    assert.ok(
      semanticVariety.capacityEvidence?.beats.every(beat => beat.legalUnconsumedCountBeforeSelection > 0),
      'semantic-variety evidence must not claim a structural capacity deficit',
    );

    assert.throws(
      () => validateAutonomousAuthoringAdmission({ ...structural, extra: true }),
      /unknown field.*extra/i,
    );

    const invalidFixedSourceRoot = join(temporaryRoot, 'missing-fixed-source');
    const invalidFixed = await evaluatePreschoolAutonomousAuthoringAdmission({
      ...input(repositoryRoot, invalidFixedSourceRoot),
      fixedCapacityEvidence: { ...structuralEvidence(), beats: [] },
    });
    assert.equal(invalidFixed.status, 'INSUFFICIENT_EVIDENCE');

    const emptySemanticEvidence = await evaluatePreschoolAutonomousAuthoringAdmission({
      ...input(repositoryRoot, invalidFixedSourceRoot),
      fixedCapacityEvidence: {
        ...structuralEvidence(),
        evidenceMode: 'SEMANTIC_VARIETY',
        preConsumedEntryIds: ['preschool_martial_seed', 'child_martial_wooden_dummy', 'toddler_martial_watch', 'toddler_neutral_season'],
        beats: [],
        demandBeats: 0,
        authoredBeats: 0,
        gapBeats: 0,
      },
    });
    assert.equal(emptySemanticEvidence.status, 'INSUFFICIENT_EVIDENCE');

    const participant: WorkspaceAgentParticipantOptions = {
      executable: 'test-participant',
      buildArgs: () => [],
    };
    const laneRoot = join(temporaryRoot, 'candidate-lane');
    const sourceSteps = [
      passive(1, 3, ['preschool_martial_seed', 'child_martial_wooden_dummy', 'toddler_martial_watch', 'toddler_neutral_season']),
      passive(2, 4, ['preschool_neutral_age_four']),
      passive(3, 5, ['preschool_martial_age_five']),
      passive(4, 5, ['preschool_neutral_through_seven']),
      passive(5, 5, ['preschool_passive_gap']),
    ];
    await writeSource(sourceRoot, sourceSteps);
    const sourceSurface = {
      schemaVersion: HEADLESS_API_PLAYER_SURFACE_SOURCE_VERSION,
      steps: sourceSteps,
    } as const;
    const observableBytes = serializeObservablePayload(
      projectHeadlessApiPlayerObservablePayload(sourceSurface),
    );
    await mkdir(join(sourceRoot, 'source'), { recursive: true });
    await mkdir(join(sourceRoot, `feedback-runs/${RUN_REF}`), { recursive: true });
    await mkdir(join(sourceRoot, `hypothesis-runs/${RUN_REF}`), { recursive: true });
    await writeFile(join(sourceRoot, 'source/observable-payload.json'), observableBytes);
    await writeFile(join(sourceRoot, `feedback-runs/${RUN_REF}/feedback.json`), JSON.stringify({ overallImpression: 'Observed.', observations: [] }));
    await writeFile(join(sourceRoot, `hypothesis-runs/${RUN_REF}/hypotheses.json`), JSON.stringify({ hypotheses: [] }));
    const rawIds = sourceSteps.flatMap(step => step.passiveEntryIds);
    let reviewerRan = false;
    const laneResult = await runCandidateLane({
      repositoryRoot,
      sourceRoot,
      laneRoot,
      poolId: 'candidate-pool-admission',
      candidateRef: 'candidate-pool-admission/hypothesis-000001',
      candidate: {
        hypothesisId: 'hypothesis-000001',
        hypothesis: 'The observed passive memories need more semantic variety.',
        observedBasis: 'Several player-visible memories repeat the same kind of activity.',
        feedbackRefs: ['overallImpression'],
        evidenceRefs: [],
        unknowns: ['The full cause remains unknown.'],
        productSignificance: 'Distinct childhood memories improve the experience.',
      },
      sourceIndex: 0,
      hypothesisSetRef: `hypothesis-runs/${RUN_REF}/hypotheses.json`,
      hypothesisSetSha256: 'c'.repeat(64),
      sourceRunRef: RUN_REF,
      sourceExperimentRootHash: 'd'.repeat(64),
      sourceFingerprintSha256: 'e'.repeat(64),
      observablePayloadRef: 'source/observable-payload.json',
      externalFeedbackRef: `feedback-runs/${RUN_REF}/feedback.json`,
      improvementHypothesisRef: `hypothesis-runs/${RUN_REF}/hypotheses.json`,
      authorityRefs: ['docs/governance/product-decisions.md'],
      participant,
      participantMode: 'local-subagent',
      dependencies: {
        captureAuthoritativeFingerprint: async () => 'f'.repeat(64),
        assertAuthoritativeFingerprintUnchanged: async () => undefined,
        runSolutionAgent: async agentInput => {
          const serialized = JSON.stringify(agentInput);
          for (const id of rawIds) assert.equal(serialized.includes(id), false, `Solution input must not receive Host source ID ${id}`);
          assert.equal(await pathExists(join(agentInput.workspaceRoot, 'game-runs', RUN_REF, 'internal/player-surface-source.json')), false);
          return {
            ok: true,
            result: validateSolutionWork({
              schemaVersion: 'solution-work-v1',
              status: 'OPTIONS',
              problemId: 'problem-admission',
              options: [option().autonomousAuthoring ? {
                ...option(),
                autonomousAuthoring: {
                  ...option().autonomousAuthoring!,
                  sourceEvidenceRefs: ['source/observable-payload.json'],
                },
              } : option()],
              recommendedOptionId: 'option-000001',
              summary: 'One bounded proposal.',
              repoRefs: [],
              artifactRefs: [],
            }),
            invocationPath: join(agentInput.destinationRoot, 'invocation.json'),
            rawOutputPath: join(agentInput.destinationRoot, 'raw-output.txt'),
            resultPath: join(agentInput.destinationRoot, 'result.json'),
          };
        },
        runSolutionReviewer: async reviewerInput => {
          reviewerRan = true;
          assert.equal(await pathExists(join(laneRoot, 'autonomous-authoring-admission.json')), false, 'admission must be written only after Reviewer completion');
          const serialized = JSON.stringify(reviewerInput);
          for (const id of rawIds) assert.equal(serialized.includes(id), false, `Reviewer input must not receive Host source ID ${id}`);
          assert.equal(await pathExists(join(reviewerInput.workspaceRoot, 'autonomous-authoring-admission.json')), false);
          return {
            ok: true,
            review: review(),
            invocationPath: join(reviewerInput.destinationRoot, 'invocation.json'),
            rawOutputPath: join(reviewerInput.destinationRoot, 'raw-output.txt'),
            reviewPath: join(reviewerInput.destinationRoot, 'review.json'),
          };
        },
      },
    });
    assert.equal(laneResult.status, 'completed');
    assert.equal(reviewerRan, true);
    assert.equal(laneResult.decision.route, 'READY_FOR_SHADOW_AUTHORING');
    assert.equal(laneResult.decision.reasonCode, 'ACCEPTED_AUTONOMOUS_AUTHORING_SCOPE');
    assert.equal(laneResult.effectiveSolutionPath, join(laneRoot, 'solution-agent/result.json'));
    assert.equal(laneResult.effectiveReviewPath, join(laneRoot, 'reviewer-agent/review.json'));
    assert.equal(laneResult.autonomousAuthoringAdmissionPath, join(laneRoot, 'autonomous-authoring-admission.json'));
    const persistedAdmission = JSON.parse(await readFile(join(laneRoot, 'autonomous-authoring-admission.json'), 'utf8'));
    assert.equal(persistedAdmission.status, 'ELIGIBLE');
    for (const manifestRef of [
      'agent-workspaces/solution/.agent-workspace-manifest.json',
      'agent-workspaces/reviewer/.agent-workspace-manifest.json',
    ]) {
      const manifest = JSON.parse(await readFile(join(laneRoot, manifestRef), 'utf8')) as {
        entries: Array<{ path: string }>;
      };
      assert.equal(manifest.entries.some(entry => entry.path.includes('autonomous-authoring-admission.json')), false);
    }
    assert.equal(
      (await readFile(join(laneRoot, 'autonomous-authoring-contract-packet.json'), 'utf8')).includes('passiveEntryIds'),
      false,
    );
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  (process.argv[2] === '--authority-only'
    ? testExactAuthorityPacketAndAdmissionIdentity()
    : runPreschoolAutonomousAuthoringAdmissionTests())
    .then(() => console.log('preschoolAutonomousAuthoringAdmission.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
