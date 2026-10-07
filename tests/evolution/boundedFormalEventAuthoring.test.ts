import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { canonicalJson, sha256Hex } from '../../scripts/evolution/phase0/provenance';
import {
  BOUNDED_FORMAL_EVENT_ALLOWED_WRITE_PATHS,
  BOUNDED_FORMAL_EVENT_CONTRACT_ID,
  BOUNDED_FORMAL_EVENT_CONTRACT_VERSION,
  assessBoundedFormalEventApplicability,
  deriveBoundedFormalEventPredicateEvidence,
  validateBoundedFormalEventPayload,
} from '../../src/evolution/boundedFormalEventAuthoringContract';
import {
  HUMAN_DIRECT_FORMAL_EVENT_REFERENCE_REQUIREMENT,
} from '../../src/evolution/boundedFormalEventReferenceRequirement';
import {
  validateAuthoringRequirementV1,
} from '../../src/evolution/authoringRequirementContract';
import {
  validateBoundedFormalEventProposalV2,
  validateBoundedFormalEventReviewAssessmentV2,
} from '../../src/evolution/boundedFormalEventProposalContract';
import {
  validateAuthoringProposalByIdentity,
  validateAuthoringAdmissionByIdentity,
} from '../../src/evolution/authoringContractRouting';
import {
  validateBoundedFormalEventShadowResultV2,
} from '../../src/evolution/boundedFormalEventShadowResultContract';
import {
  evaluateBoundedFormalEventAdmission,
  readBoundedFormalEventPredicateEvidence,
} from '../../scripts/evolution/autonomousAuthoring/evaluateBoundedFormalEventAdmission';
import {
  verifyBoundedFormalEventShadowAuthoring,
} from '../../scripts/evolution/autonomousAuthoring/verifyBoundedFormalEventShadowAuthoring';
import {
  runBoundedFormalEventShadowTrial,
} from '../../scripts/evolution/autonomousAuthoring/runBoundedFormalEventShadowTrial';
import {
  executeBoundedFormalEventShadowAuthoring,
} from '../../scripts/evolution/autonomousAuthoring/executeBoundedFormalEventShadowAuthoring';
import { captureAuthoritativeFingerprint } from '../../scripts/evolution/problemAgnosticSolution/agentWorkspace';
import { EventLoader } from '../../src/core/EventLoader';
import { eventConditionsPassForHabitState } from '../../src/evolution/boundedFormalEventAuthoringContract';

function validChoicePayload() {
  return {
    events: [{
      id: 'test_formal_event',
      version: '1.0.0',
      category: 'main_story',
      priority: 1,
      weight: 40,
      ageRange: { min: 18, max: 30 },
      triggers: [{ type: 'age_reach', value: 18 }],
      conditions: [{
        type: 'expression',
        expression: 'lifeStates.trainingHabit >= 2 && lifeStates.businessHabit >= 2',
      }],
      content: {
        title: 'Test event',
        text: 'A test-only event body for validator coverage.',
        description: 'Not an authoritative catalog event.',
      },
      eventType: 'choice',
      choices: [{
        id: 'continue_both',
        text: 'Test-only choice',
        effects: [{ type: 'stat_modify', target: 'knowledge', value: 1, operator: 'add' }],
      }],
    }],
    narrativeContinuity: {
      pastEvidenceRefs: ['human-direct:formal-event-training-business-reference'],
      presentRequiredContextIndexes: [0, 1],
      presentNarrativePath: 'content.text',
      futureOutcomeRefs: [{ kind: 'choice_effect', choiceId: 'continue_both', effectIndex: 0 }],
      futureHook: 'NONE',
    },
  };
}

function validAutoPayload() {
  const payload = validChoicePayload();
  const event = payload.events[0]!;
  const autoEvent = {
    ...event,
    id: 'test_formal_auto_event',
    eventType: 'auto',
    autoEffects: [{ type: 'status_add', status: 'fatigued' }],
  };
  delete (autoEvent as Record<string, unknown>).choices;
  return {
    ...payload,
    events: [autoEvent],
    narrativeContinuity: {
      ...payload.narrativeContinuity,
      futureOutcomeRefs: [{ kind: 'auto_effect', effectIndex: 0 }],
    },
  };
}

function validProposal(payload: unknown = uniqueCandidatePayload()) {
  return {
    schemaVersion: 'autonomous-authoring-proposal-v2',
    contractId: BOUNDED_FORMAL_EVENT_CONTRACT_ID,
    contractVersion: BOUNDED_FORMAL_EVENT_CONTRACT_VERSION,
    requirement: HUMAN_DIRECT_FORMAL_EVENT_REFERENCE_REQUIREMENT,
    proposedBy: 'participant:author-1',
    applicabilityClaim: 'APPLICABLE',
    contractPayload: payload,
  };
}

function uniqueCandidatePayload(id = nextUnusedFixtureEventId()) {
  const payload = validChoicePayload();
  payload.events[0]!.id = id;
  return payload;
}

function nextUnusedFixtureEventId(): string {
  const existingIds = new Set(EventLoader.getInstance().getAllEvents().map(event => event.id));
  for (let suffix = 1; suffix <= 10_000; suffix += 1) {
    const candidate = `test_bounded_formal_event_fixture_${suffix}`;
    if (!existingIds.has(candidate)) return candidate;
  }
  throw new Error('Unable to allocate a fixture Event ID outside the current Event catalog');
}

function validReview(proposal: ReturnType<typeof validProposal>) {
  return {
    schemaVersion: 'autonomous-authoring-review-assessment-v2',
    contractId: BOUNDED_FORMAL_EVENT_CONTRACT_ID,
    contractVersion: BOUNDED_FORMAL_EVENT_CONTRACT_VERSION,
    requirementSha256: sha256Hex(canonicalJson(proposal.requirement)),
    proposalSha256: sha256Hex(canonicalJson(proposal)),
    reviewerRef: 'participant:reviewer-1',
    decision: 'ACCEPT',
    applicabilityAssessment: 'APPLICABLE',
    conformance: 'CONFORMING',
    executionEnvelope: 'WITHIN_ENVELOPE',
    requirementCoverage: 'COVERED',
    pastPresentFutureAssessment: 'COHERENT',
    assessment: 'The references, present situation, and bounded outcome form a coherent event candidate.',
    blockers: [],
  };
}

function testAuthoringRequirementV1(): void {
  const requirement = validateAuthoringRequirementV1(HUMAN_DIRECT_FORMAL_EVENT_REFERENCE_REQUIREMENT);
  assert.equal(requirement.source.kind, 'HUMAN_DIRECT');
  assert.equal(requirement.target, 'FORMAL_EVENT');
  assert.equal('gapClassification' in requirement, false);

  assert.doesNotThrow(() => validateAuthoringRequirementV1({
    ...requirement,
    requirementId: 'diagnosed-problem-requirement',
    source: { kind: 'DIAGNOSED_PROBLEM', refs: ['problem:gap-17'] },
  }));
  assert.throws(() => validateAuthoringRequirementV1({
    ...requirement,
    source: { kind: 'AE_GUESSED', refs: ['x'] },
  }), /source.kind/);
  assert.throws(() => validateAuthoringRequirementV1({ ...requirement, target: 'PERSON' }), /target/);
  assert.throws(() => validateAuthoringRequirementV1({ ...requirement, intent: '  ' }), /intent/);
  assert.throws(() => validateAuthoringRequirementV1({ ...requirement, requiredContext: [] }), /requiredContext/);
  assert.throws(() => validateAuthoringRequirementV1({ ...requirement, authorityRefs: [] }), /authorityRefs/);
  assert.throws(() => validateAuthoringRequirementV1({ ...requirement, executionAuthority: true }), /unknown field/);
}

async function testBoundedFormalEventContract(): Promise<void> {
  assert.equal(BOUNDED_FORMAL_EVENT_CONTRACT_ID, 'bounded-formal-event-authoring-v1');
  assert.equal(BOUNDED_FORMAL_EVENT_CONTRACT_VERSION, 1);
  assert.deepEqual(BOUNDED_FORMAL_EVENT_ALLOWED_WRITE_PATHS, [
    'src/data/lines/p22-content-expansions.json',
    'tests/evolution/boundedFormalEventAuthoring.test.ts',
  ]);

  const choice = validateBoundedFormalEventPayload(
    uniqueCandidatePayload(),
    HUMAN_DIRECT_FORMAL_EVENT_REFERENCE_REQUIREMENT,
  );
  assert.equal(choice.events.length, 1);
  assert.equal(choice.events[0]?.eventType, 'choice');
  const auto = validateBoundedFormalEventPayload(
    { ...validAutoPayload(), events: [{ ...validAutoPayload().events[0]!, id: 'codex_bounded_formal_auto_candidate' }] },
    HUMAN_DIRECT_FORMAL_EVENT_REFERENCE_REQUIREMENT,
  );
  assert.equal(auto.events[0]?.eventType, 'auto');

  assert.throws(() => validateBoundedFormalEventPayload({
    ...validChoicePayload(),
    events: [...validChoicePayload().events, ...validChoicePayload().events],
  }, HUMAN_DIRECT_FORMAL_EVENT_REFERENCE_REQUIREMENT), /exactly one Event/i);

  assert.throws(() => validateBoundedFormalEventPayload({
    ...uniqueCandidatePayload(),
    narrativeContinuity: { ...validChoicePayload().narrativeContinuity, futureHook: 'FOLLOW_UP_EVENT' },
  }, HUMAN_DIRECT_FORMAL_EVENT_REFERENCE_REQUIREMENT), /futureHook/i);

  assert.throws(() => validateBoundedFormalEventPayload(
    uniqueCandidatePayload('p42_training_habit_youth_sparring'),
    HUMAN_DIRECT_FORMAL_EVENT_REFERENCE_REQUIREMENT,
    ['p42_training_habit_youth_sparring'],
  ), /already exists/i);

  const incompleteCoverage = uniqueCandidatePayload();
  incompleteCoverage.narrativeContinuity.presentRequiredContextIndexes = [0];
  assert.throws(() => validateBoundedFormalEventPayload(
    incompleteCoverage,
    HUMAN_DIRECT_FORMAL_EVENT_REFERENCE_REQUIREMENT,
  ), /requiredContext|coverage/i);

  assert.doesNotThrow(() => validateBoundedFormalEventPayload(
    uniqueCandidatePayload(),
    HUMAN_DIRECT_FORMAL_EVENT_REFERENCE_REQUIREMENT,
  ), 'requirement coverage is carried by explicit context mapping and independent review, not keyword matching');

  const flagEffect = validChoicePayload();
  flagEffect.events[0]!.choices[0]!.effects[0] = { type: 'flag_set', target: 'new_flag', value: true } as never;
  assert.throws(() => validateBoundedFormalEventPayload(flagEffect, HUMAN_DIRECT_FORMAL_EVENT_REFERENCE_REQUIREMENT), /effect|flag/i);

  for (const legacyStat of ['externalSkill', 'internalSkill', 'qinggong']) {
    const legacyTarget = uniqueCandidatePayload();
    legacyTarget.events[0]!.choices[0]!.effects[0] = { type: 'stat_modify', target: legacyStat, value: 1, operator: 'add' } as never;
    assert.throws(() => validateBoundedFormalEventPayload(legacyTarget, HUMAN_DIRECT_FORMAL_EVENT_REFERENCE_REQUIREMENT), /target|stat/i);
  }

  for (const nonCanonicalStat of ['charisma', 'businessAcumen', 'influence', 'wealthCapacity', 'merchantNetwork']) {
    const outOfModelTarget = uniqueCandidatePayload();
    outOfModelTarget.events[0]!.choices[0]!.effects[0] = {
      type: 'stat_modify', target: nonCanonicalStat, value: 1, operator: 'add',
    } as never;
    assert.throws(() => validateBoundedFormalEventPayload(
      outOfModelTarget,
      HUMAN_DIRECT_FORMAL_EVENT_REFERENCE_REQUIREMENT,
    ), /target|stat/i);
  }

  const newFactEffect = uniqueCandidatePayload();
  newFactEffect.events[0]!.choices[0]!.effects[0] = { type: 'fact_add', fact: 'new_fact', value: true } as never;
  assert.throws(() => validateBoundedFormalEventPayload(newFactEffect, HUMAN_DIRECT_FORMAL_EVENT_REFERENCE_REQUIREMENT), /effect|fact/i);

  const randomCondition = validChoicePayload();
  randomCondition.events[0]!.conditions[0]!.expression = 'lifeStates.trainingHabit >= 2 || flags.has("business")';
  assert.throws(() => validateBoundedFormalEventPayload(randomCondition, HUMAN_DIRECT_FORMAL_EVENT_REFERENCE_REQUIREMENT), /condition|predicate/i);

  const externalWritePath = [...BOUNDED_FORMAL_EVENT_ALLOWED_WRITE_PATHS, 'src/core/EventLoader.ts'];
  assert.throws(() => validateBoundedFormalEventProposalV2({
    ...validProposal(),
    contractPayload: { ...validChoicePayload(), allowedWritePaths: externalWritePath },
  }), /unauthorized field|write path/i);
}

async function createShadowFixture() {
  const root = await mkdtemp(join(tmpdir(), 'bounded-formal-event-shadow-'));
  const authoritativeRoot = join(root, 'authoritative');
  const shadowRoot = join(root, 'shadow');
  const catalogPath = join(authoritativeRoot, 'src/data/lines/p22-content-expansions.json');
  const focusedTestPath = join(authoritativeRoot, 'tests/evolution/boundedFormalEventAuthoring.test.ts');
  const trainingPrecedent = {
    id: 'p42_training_habit_youth_sparring',
    conditions: [{ type: 'expression', expression: 'lifeStates.trainingHabit >= 2' }],
  };
  const businessPrecedent = {
    id: 'p42_business_habit_youth_stall',
    conditions: [{ type: 'expression', expression: 'lifeStates.businessHabit >= 2' }],
  };
  await mkdir(join(authoritativeRoot, 'src/data/lines'), { recursive: true });
  await mkdir(join(authoritativeRoot, 'tests/evolution'), { recursive: true });
  await writeFile(catalogPath, `${JSON.stringify([trainingPrecedent], null, 2)}\n`);
  await writeFile(join(authoritativeRoot, 'src/data/lines/merchant.json'), `${JSON.stringify([businessPrecedent], null, 2)}\n`);
  await writeFile(focusedTestPath, 'const existingFocusedRegression = true;\n');
  await cp(authoritativeRoot, shadowRoot, { recursive: true });

  const proposal = validProposal(uniqueCandidatePayload());
  const review = validReview(proposal);
  const admission = await evaluateBoundedFormalEventAdmission({
    repositoryRoot: authoritativeRoot,
    requirement: HUMAN_DIRECT_FORMAL_EVENT_REFERENCE_REQUIREMENT,
    proposal,
    review,
    observedLifeStates: { trainingHabit: 2, businessHabit: 2 },
  });
  return { root, authoritativeRoot, shadowRoot, catalogPath, focusedTestPath, proposal, review, admission };
}

async function appendCandidateToShadow(fixture: Awaited<ReturnType<typeof createShadowFixture>>): Promise<void> {
  const catalogPath = join(fixture.shadowRoot, 'src/data/lines/p22-content-expansions.json');
  const focusedTestPath = join(fixture.shadowRoot, 'tests/evolution/boundedFormalEventAuthoring.test.ts');
  const existing = JSON.parse(await readFile(catalogPath, 'utf8')) as unknown[];
  const candidate = (fixture.proposal as ReturnType<typeof validProposal>).contractPayload;
  const event = (candidate as ReturnType<typeof validChoicePayload>).events[0];
  existing.push(event);
  await writeFile(catalogPath, `${JSON.stringify(existing, null, 2)}\n`);
  await writeFile(focusedTestPath, `${await readFile(focusedTestPath, 'utf8')}\n// candidate regression: ${event!.id}\n`);
}

async function testShadowVerificationUsesAuthoritativeBaseline(): Promise<void> {
  const fixture = await createShadowFixture();
  try {
    await appendCandidateToShadow(fixture);
    const result = await verifyBoundedFormalEventShadowAuthoring({
      authoritativeRoot: fixture.authoritativeRoot,
      shadowRoot: fixture.shadowRoot,
      requirement: HUMAN_DIRECT_FORMAL_EVENT_REFERENCE_REQUIREMENT,
      proposal: fixture.proposal,
      review: fixture.review,
      admission: fixture.admission,
      focusedTestExitCode: 0,
      existingEventIds: [],
    });
    assert.equal(result.terminalStatus, 'SHADOW_AUTHORING_VERIFIED');
    assert.equal(result.canonicalChanges.length, 2);
    assert.equal(result.authoritativeFingerprintBefore, result.authoritativeFingerprintAfter);
    assert.deepEqual(result.canonicalChanges.map(change => change.path), [...BOUNDED_FORMAL_EVENT_ALLOWED_WRITE_PATHS].sort());
    assert.equal(result.checks.bothHabitConditions, 'PASS');
    assert.equal(result.checks.eventLoaderShape, 'PASS');
    assert.equal(result.checks.conditionEvaluator, 'PASS');
    assert.equal(result.checks.effectAllowlist, 'PASS');
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
}

async function testShadowVerificationRejectsForbiddenChangedFile(): Promise<void> {
  const fixture = await createShadowFixture();
  try {
    await appendCandidateToShadow(fixture);
    await mkdir(join(fixture.shadowRoot, 'src/core'), { recursive: true });
    await writeFile(join(fixture.shadowRoot, 'src/core/unauthorized.ts'), 'export {};\n');
    await assert.rejects(() => verifyBoundedFormalEventShadowAuthoring({
      authoritativeRoot: fixture.authoritativeRoot,
      shadowRoot: fixture.shadowRoot,
      requirement: HUMAN_DIRECT_FORMAL_EVENT_REFERENCE_REQUIREMENT,
      proposal: fixture.proposal,
      review: fixture.review,
      admission: fixture.admission,
      focusedTestExitCode: 0,
      existingEventIds: EventLoader.getInstance().getAllEvents().map(event => event.id),
    }), /changed paths must be exactly/i);
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
}

async function testVerifierRejectsDuplicateEventId(): Promise<void> {
  const fixture = await createShadowFixture();
  try {
    await appendCandidateToShadow(fixture);
    await assert.rejects(() => verifyBoundedFormalEventShadowAuthoring({
      authoritativeRoot: fixture.authoritativeRoot,
      shadowRoot: fixture.shadowRoot,
      requirement: HUMAN_DIRECT_FORMAL_EVENT_REFERENCE_REQUIREMENT,
      proposal: fixture.proposal,
      review: fixture.review,
      admission: fixture.admission,
      focusedTestExitCode: 0,
      existingEventIds: [
        ((fixture.proposal as ReturnType<typeof validProposal>).contractPayload as ReturnType<typeof validChoicePayload>).events[0]!.id,
      ],
    }), /already exists|not unique/i);
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
}

async function testShadowTrialRequiresSeparateHumanAuthorization(): Promise<void> {
  const fixture = await createShadowFixture();
  try {
    await assert.rejects(() => runBoundedFormalEventShadowTrial({
      authoritativeRoot: fixture.authoritativeRoot,
      shadowRoot: fixture.shadowRoot,
      artifactRoot: join(fixture.shadowRoot, 'trial-artifacts'),
      proposal: fixture.proposal,
      review: fixture.review,
      observedLifeStates: { trainingHabit: 2, businessHabit: 2 },
    }), /outside the shadow workspace/i);

    const result = await runBoundedFormalEventShadowTrial({
      authoritativeRoot: fixture.authoritativeRoot,
      shadowRoot: fixture.shadowRoot,
      artifactRoot: join(fixture.root, 'trial-artifacts'),
      proposal: fixture.proposal,
      review: fixture.review,
      observedLifeStates: { trainingHabit: 2, businessHabit: 2 },
    });
    assert.equal(result.result.terminalStatus, 'EXECUTION_AUTHORIZATION_REQUIRED');
    assert.equal(result.result.participantJobs, 0);
    assert.equal(result.focusedTest, null);
    assert.equal(result.verification, null);
    await assert.rejects(
      readFile(join(fixture.root, 'trial-artifacts/result.json')),
      error => (error as NodeJS.ErrnoException).code === 'ENOENT',
    );
    await assert.rejects(() => runBoundedFormalEventShadowTrial({
      authoritativeRoot: fixture.authoritativeRoot,
      shadowRoot: fixture.shadowRoot,
      artifactRoot: join(fixture.root, 'trial-artifacts'),
      proposal: fixture.proposal,
      review: fixture.review,
      observedLifeStates: { trainingHabit: 2, businessHabit: 2 },
      humanAuthorizationArtifactPath: join(fixture.root, 'authorization.json'),
    }), /must be supplied together/i);
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
}

async function testDeterministicShadowExecutionPipeline(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'bounded-formal-event-pipeline-'));
  const authoritativeRoot = process.cwd();
  const workspaceDestinationRoot = join(root, 'workspace');
  const proposalPayload = uniqueCandidatePayload();
  const proposal = validProposal(proposalPayload);
  const review = validReview(proposal);
  const requirement = HUMAN_DIRECT_FORMAL_EVENT_REFERENCE_REQUIREMENT;
  const initialFingerprint = await captureAuthoritativeFingerprint(authoritativeRoot);
  const authoritativeCatalog = JSON.parse(
    await readFile(join(authoritativeRoot, 'src/data/lines/p22-content-expansions.json'), 'utf8'),
  ) as unknown[];
  const admission = await evaluateBoundedFormalEventAdmission({
    repositoryRoot: authoritativeRoot,
    requirement,
    proposal,
    review,
    observedLifeStates: { trainingHabit: 2, businessHabit: 2 },
  });
  assert.equal(admission.status, 'ELIGIBLE');
  assert.equal(admission.applicability.status, 'APPLICABLE');
  assert.notEqual(review.reviewerRef, proposal.proposedBy);

  try {
    const forbiddenProposal = {
      ...proposal,
      contractPayload: {
        ...proposalPayload,
        events: [...proposalPayload.events, { ...proposalPayload.events[0]!, id: 'second_shadow_event' }],
      },
    };
    await assert.rejects(() => executeBoundedFormalEventShadowAuthoring({
      authoritativeRoot,
      workspaceDestinationRoot,
      requirement,
      proposal: forbiddenProposal,
      review,
      admission,
      observedLifeStates: { trainingHabit: 2, businessHabit: 2 },
    }), /exactly one Event/i);

    const existingEventId = EventLoader.getInstance().getAllEvents()[0]?.id;
    assert.ok(existingEventId);
    const duplicateProposal = {
      ...proposal,
      contractPayload: {
        ...proposalPayload,
        events: [{ ...proposalPayload.events[0]!, id: existingEventId }],
      },
    };
    await assert.rejects(() => executeBoundedFormalEventShadowAuthoring({
      authoritativeRoot,
      workspaceDestinationRoot,
      requirement,
      proposal: duplicateProposal,
      review,
      admission,
      observedLifeStates: { trainingHabit: 2, businessHabit: 2 },
    }), /already exists/i);

    const occupiedDestination = join(root, 'occupied-workspace');
    const occupiedShadowRoot = join(occupiedDestination, 'shadow-authoring');
    await mkdir(occupiedShadowRoot, { recursive: true });
    const unexpectedShadowFile = join(occupiedShadowRoot, 'unexpected.txt');
    await writeFile(unexpectedShadowFile, 'pre-existing shadow data\n');
    await assert.rejects(() => executeBoundedFormalEventShadowAuthoring({
      authoritativeRoot,
      workspaceDestinationRoot: occupiedDestination,
      requirement,
      proposal,
      review,
      admission,
      observedLifeStates: { trainingHabit: 2, businessHabit: 2 },
    }));
    assert.equal(await readFile(unexpectedShadowFile, 'utf8'), 'pre-existing shadow data\n');

    const output = await executeBoundedFormalEventShadowAuthoring({
      authoritativeRoot,
      workspaceDestinationRoot,
      requirement,
      proposal,
      review,
      admission,
      observedLifeStates: { trainingHabit: 2, businessHabit: 2 },
    });
    assert.equal(output.execution.status, 'EXECUTED');
    assert.equal(output.execution.participantJobs, 0);
    assert.equal(output.focusedTest.exitCode, 0);
    assert.ok(output.focusedTest.output.includes(`bounded-formal-event-shadow-regression:${proposalPayload.events[0]!.id}:ok`));
    assert.equal(output.execution.shadowBaselineFingerprint, initialFingerprint);
    assert.equal(output.execution.authoritativeFingerprintAfter, initialFingerprint);
    assert.deepEqual(output.execution.canonicalChangedFileRefs, [...BOUNDED_FORMAL_EVENT_ALLOWED_WRITE_PATHS]);

    const materializedCatalog = JSON.parse(
      await readFile(join(output.shadowRoot, 'src/data/lines/p22-content-expansions.json'), 'utf8'),
    ) as unknown[];
    assert.equal(materializedCatalog.length, authoritativeCatalog.length + 1);
    assert.deepEqual(materializedCatalog.slice(0, authoritativeCatalog.length), authoritativeCatalog);
    assert.deepEqual(
      materializedCatalog[materializedCatalog.length - 1],
      proposalPayload.events[0],
    );

    const verification = await verifyBoundedFormalEventShadowAuthoring({
      authoritativeRoot,
      shadowRoot: output.shadowRoot,
      requirement,
      proposal,
      review,
      admission,
      executionResult: output.execution,
      focusedTestExitCode: output.focusedTest.exitCode,
    });
    assert.equal(verification.terminalStatus, 'SHADOW_AUTHORING_VERIFIED');
    assert.equal(verification.executionResultSha256, sha256Hex(canonicalJson(output.execution)));
    assert.deepEqual(verification.canonicalChanges.map(change => change.path), [...BOUNDED_FORMAL_EVENT_ALLOWED_WRITE_PATHS].sort());

    const forbiddenShadowFile = join(output.shadowRoot, 'src/core/EventLoader.ts');
    await writeFile(forbiddenShadowFile, `${await readFile(forbiddenShadowFile, 'utf8')}\n// forbidden shadow mutation\n`);
    await assert.rejects(() => verifyBoundedFormalEventShadowAuthoring({
      authoritativeRoot,
      shadowRoot: output.shadowRoot,
      requirement,
      proposal,
      review,
      admission,
      executionResult: output.execution,
      focusedTestExitCode: output.focusedTest.exitCode,
    }), /execution result does not match|changed paths must be exactly/i);
    assert.equal(await captureAuthoritativeFingerprint(authoritativeRoot), initialFingerprint);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

async function testApplicabilityAndAdmission(): Promise<void> {
  const evidence = deriveBoundedFormalEventPredicateEvidence([
    {
      path: 'src/data/lines/p22-content-expansions.json',
      events: [{
        id: 'p42_training_habit_youth_sparring',
        conditions: [{ type: 'expression', expression: 'lifeStates.trainingHabit >= 2' }],
      }],
    },
    {
      path: 'src/data/lines/merchant.json',
      events: [{
        id: 'p42_business_habit_youth_stall',
        conditions: [{ type: 'expression', expression: 'lifeStates.businessHabit >= 2' }],
      }],
    },
  ]);
  assert.equal(evidence.status, 'SUPPORTED');
  assert.deepEqual(evidence.thresholds, { trainingHabit: 2, businessHabit: 2 });
  assert.equal(assessBoundedFormalEventApplicability(
    HUMAN_DIRECT_FORMAL_EVENT_REFERENCE_REQUIREMENT,
    { trainingHabit: 2, businessHabit: 2 },
    evidence,
  ).status, 'APPLICABLE');
  assert.equal(assessBoundedFormalEventApplicability(
    HUMAN_DIRECT_FORMAL_EVENT_REFERENCE_REQUIREMENT,
    { trainingHabit: 2, businessHabit: 0 },
    evidence,
  ).status, 'NOT_APPLICABLE');

  const event = validateBoundedFormalEventPayload(
    uniqueCandidatePayload(),
    HUMAN_DIRECT_FORMAL_EVENT_REFERENCE_REQUIREMENT,
  ).events[0];
  assert.equal(eventConditionsPassForHabitState(event, { trainingHabit: 2, businessHabit: 2 }), true);
  assert.equal(eventConditionsPassForHabitState(event, { trainingHabit: 2, businessHabit: 0 }), false);
  assert.equal(eventConditionsPassForHabitState(event, { trainingHabit: 0, businessHabit: 2 }), false);
  assert.equal(assessBoundedFormalEventApplicability(
    HUMAN_DIRECT_FORMAL_EVENT_REFERENCE_REQUIREMENT,
    { trainingHabit: 0, businessHabit: 2 },
    evidence,
  ).status, 'NOT_APPLICABLE');
  assert.equal(assessBoundedFormalEventApplicability({
    ...HUMAN_DIRECT_FORMAL_EVENT_REFERENCE_REQUIREMENT,
    source: { kind: 'DIAGNOSED_PROBLEM', refs: ['problem:gap-17'] },
  }, { trainingHabit: 2, businessHabit: 2 }, evidence).status, 'INSUFFICIENT_EVIDENCE');
  assert.equal(assessBoundedFormalEventApplicability({
    ...HUMAN_DIRECT_FORMAL_EVENT_REFERENCE_REQUIREMENT,
    requiredContext: ['The character is good at business.'],
  }, { trainingHabit: 2, businessHabit: 2 }, evidence).status, 'INSUFFICIENT_EVIDENCE');

  const driftedEvidence = deriveBoundedFormalEventPredicateEvidence([
    {
      path: 'src/data/lines/p22-content-expansions.json',
      events: [{
        id: 'p42_training_habit_youth_sparring',
        conditions: [{ type: 'expression', expression: 'lifeStates.trainingHabit >= 3' }],
      }],
    },
    {
      path: 'src/data/lines/merchant.json',
      events: [{
        id: 'p42_business_habit_youth_stall',
        conditions: [{ type: 'expression', expression: 'lifeStates.businessHabit >= 2' }],
      }],
    },
  ]);
  assert.equal(driftedEvidence.status, 'INSUFFICIENT_EVIDENCE');

  const movedPrecedents = deriveBoundedFormalEventPredicateEvidence([
    {
      path: 'src/data/lines/merchant.json',
      events: [{
        id: 'p42_training_habit_youth_sparring',
        conditions: [{ type: 'expression', expression: 'lifeStates.trainingHabit >= 2' }],
      }, {
        id: 'p42_business_habit_youth_stall',
        conditions: [{ type: 'expression', expression: 'lifeStates.businessHabit >= 2' }],
      }],
    },
    { path: 'src/data/lines/p22-content-expansions.json', events: [] },
  ]);
  assert.equal(movedPrecedents.status, 'INSUFFICIENT_EVIDENCE');
  assert.equal((await readBoundedFormalEventPredicateEvidence(process.cwd())).status, 'SUPPORTED');

  const proposal = validateBoundedFormalEventProposalV2(validProposal());
  const review = validateBoundedFormalEventReviewAssessmentV2(validReview(validProposal()));
  assert.equal(review.reviewerRef === proposal.proposedBy, false);

  const admission = await evaluateBoundedFormalEventAdmission({
    repositoryRoot: process.cwd(),
    requirement: HUMAN_DIRECT_FORMAL_EVENT_REFERENCE_REQUIREMENT,
    proposal: validProposal(),
    review: validReview(validProposal()),
    observedLifeStates: { trainingHabit: 2, businessHabit: 2 },
  });
  assert.equal(admission.status, 'ELIGIBLE');
  assert.equal(admission.maxNewEvents, 1);
  assert.equal(validateAuthoringAdmissionByIdentity(admission).schemaVersion, 'autonomous-authoring-admission-v2');
  assert.throws(() => validateAuthoringAdmissionByIdentity({
    ...admission,
    contractId: 'future-contract',
  }), /unknown.*route|contractId/i);

  const noReview = await evaluateBoundedFormalEventAdmission({
    repositoryRoot: process.cwd(),
    requirement: HUMAN_DIRECT_FORMAL_EVENT_REFERENCE_REQUIREMENT,
    proposal: validProposal(),
    review: undefined,
    observedLifeStates: { trainingHabit: 2, businessHabit: 2 },
  });
  assert.notEqual(noReview.status, 'ELIGIBLE', 'Requirement + proposal alone must not authorize execution');

  const makeBoundaryCase = (requiredCapability: 'PERSISTENT_PERSON' | 'NEW_RUNTIME_OR_SCHEMA' | 'SECOND_EVENT') => {
    const requirement = {
      ...HUMAN_DIRECT_FORMAL_EVENT_REFERENCE_REQUIREMENT,
      requirementId: `formal-event-boundary-${requiredCapability.toLowerCase()}`,
      intent: `Fixture explicitly requires ${requiredCapability}; this text is never parsed by applicability.`,
    };
    return {
      requirement,
      evidence: {
        requirementId: requirement.requirementId,
        sourceRef: requirement.source.refs[0]!,
        requiredCapability,
      },
    };
  };
  for (const requiredCapability of ['PERSISTENT_PERSON', 'NEW_RUNTIME_OR_SCHEMA', 'SECOND_EVENT'] as const) {
    const boundary = makeBoundaryCase(requiredCapability);
    const result = assessBoundedFormalEventApplicability(
      boundary.requirement,
      null,
      driftedEvidence,
      boundary.evidence,
    );
    assert.equal(result.status, 'CONTRACT_CHANGE_REQUIRED');
    assert.equal(result.requirementBoundaryEvidence?.requiredCapability, requiredCapability);
  }

  const unboundBoundary = makeBoundaryCase('PERSISTENT_PERSON');
  assert.equal(assessBoundedFormalEventApplicability(
    unboundBoundary.requirement,
    { trainingHabit: 2, businessHabit: 2 },
    evidence,
    { ...unboundBoundary.evidence, requirementId: 'another-requirement' },
  ).status, 'INSUFFICIENT_EVIDENCE');

  const changeBoundary = makeBoundaryCase('PERSISTENT_PERSON');
  const changeProposal = {
    ...validProposal(null),
    requirement: changeBoundary.requirement,
    applicabilityClaim: 'CONTRACT_CHANGE_REQUIRED',
    contractPayload: null,
  };
  const changeReview = {
    ...validReview(changeProposal),
    applicabilityAssessment: 'CONTRACT_CHANGE_REQUIRED',
  };
  const changeAdmission = await evaluateBoundedFormalEventAdmission({
    repositoryRoot: process.cwd(),
    requirement: changeBoundary.requirement,
    proposal: changeProposal,
    review: changeReview,
    observedLifeStates: { trainingHabit: 2, businessHabit: 2 },
    requirementBoundaryEvidence: changeBoundary.evidence,
  });
  assert.equal(changeAdmission.status, 'CONTRACT_CHANGE_REQUIRED');
  assert.equal(changeAdmission.applicability.status, 'CONTRACT_CHANGE_REQUIRED');
  assert.equal(changeAdmission.applicability.requirementBoundaryEvidence?.requiredCapability, 'PERSISTENT_PERSON');
}

function testExplicitRouting(): void {
  const v2 = validProposal();
  assert.equal(validateAuthoringProposalByIdentity(v2).schemaVersion, 'autonomous-authoring-proposal-v2');
  const preschoolProposal = {
    schemaVersion: 'autonomous-authoring-proposal-v1',
    contractId: 'preschool-shared-neutral-passive-capacity-v1',
    contractVersion: 1,
    gapClassification: 'CONTENT_GAP',
    gapSubtype: 'CONTENT_CAPACITY_GAP',
    applicabilityClaim: 'NOT_APPLICABLE',
    authorityRefs: ['docs/governance/product-decisions.md'],
    sourceEvidenceRefs: ['source/example.json'],
    responsibilities: [],
    contractPayload: null,
  };
  assert.equal(validateAuthoringProposalByIdentity(preschoolProposal).schemaVersion, 'autonomous-authoring-proposal-v1');
  assert.throws(() => validateAuthoringProposalByIdentity({
    ...v2,
    contractId: 'future-contract',
  }), /unknown|contractId/i);
  assert.throws(() => validateAuthoringProposalByIdentity({
    ...v2,
    contractVersion: 2,
  }), /@2|version/i);

  const fingerprint = 'a'.repeat(64);
  const result = validateBoundedFormalEventShadowResultV2({
    schemaVersion: 'shadow-authoring-result-v2',
    terminalStatus: 'EXECUTION_AUTHORIZATION_REQUIRED',
    contractId: BOUNDED_FORMAL_EVENT_CONTRACT_ID,
    contractVersion: BOUNDED_FORMAL_EVENT_CONTRACT_VERSION,
    requirementSha256: null,
    proposalSha256: null,
    reviewSha256: null,
    admissionSha256: null,
    humanAuthorizationRef: null,
    humanAuthorizationSha256: null,
    eventId: null,
    canonicalChangedFileRefs: [],
    verificationArtifactRef: null,
    authoritativeFingerprintBefore: fingerprint,
    authoritativeFingerprintAfter: fingerprint,
    participantJobs: 0,
  });
  assert.equal(result.contractId, BOUNDED_FORMAL_EVENT_CONTRACT_ID);
  assert.throws(() => validateBoundedFormalEventShadowResultV2({
    ...result,
    contractId: 'unknown-contract',
  }), /identity/i);
  const verifiedResult = validateBoundedFormalEventShadowResultV2({
    ...result,
    terminalStatus: 'SHADOW_AUTHORING_VERIFIED',
    requirementSha256: fingerprint,
    proposalSha256: fingerprint,
    reviewSha256: fingerprint,
    admissionSha256: fingerprint,
    humanAuthorizationRef: 'human-auth:formal-event-v1',
    humanAuthorizationSha256: fingerprint,
    eventId: 'verified_formal_event',
    canonicalChangedFileRefs: [...BOUNDED_FORMAL_EVENT_ALLOWED_WRITE_PATHS],
    verificationArtifactRef: 'verification.json',
    participantJobs: 1,
  });
  assert.equal(verifiedResult.terminalStatus, 'SHADOW_AUTHORING_VERIFIED');
  assert.throws(() => validateBoundedFormalEventShadowResultV2({
    ...verifiedResult,
    canonicalChangedFileRefs: ['src/core/EventLoader.ts'],
  }), /exact bounded Formal Event write surface/i);
}

testAuthoringRequirementV1();
testExplicitRouting();
await testBoundedFormalEventContract();
await testApplicabilityAndAdmission();
await testShadowVerificationUsesAuthoritativeBaseline();
await testShadowVerificationRejectsForbiddenChangedFile();
await testVerifierRejectsDuplicateEventId();
await testShadowTrialRequiresSeparateHumanAuthorization();
if (process.env.BOUNDED_FORMAL_EVENT_SHADOW_REGRESSION_EVENT_ID === undefined) {
  await testDeterministicShadowExecutionPipeline();
}
console.log('boundedFormalEventAuthoring.test.ts: ok');
