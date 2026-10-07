import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { canonicalJson, sha256Hex } from '../../scripts/evolution/phase0/provenance';
import {
  BOUNDED_FORMAL_EVENT_ALLOWED_WRITE_PATHS,
  BOUNDED_FORMAL_EVENT_AUTHORING_SAFE_PROJECTION_V1,
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
  readBoundedFormalEventParticipantEvidence,
} from '../../scripts/evolution/autonomousAuthoring/boundedFormalEventParticipantEvidence';
import {
  buildBoundedFormalEventTrialAuthorizationCandidate,
  captureBoundedFormalEventRepositorySnapshot,
  validateFreshBoundedFormalEventAuthorizationCandidate,
} from '../../scripts/evolution/autonomousAuthoring/boundedFormalEventTrialAuthorization';
import {
  buildBoundedFormalEventParticipantGenerationManifest,
  consumeBoundedFormalEventParticipantGenerationManifest,
  validateFreshBoundedFormalEventParticipantGenerationManifest,
} from '../../scripts/evolution/autonomousAuthoring/boundedFormalEventParticipantGenerationAuthorization';
import {
  prepareBoundedFormalEventTrial,
} from '../../scripts/evolution/autonomousAuthoring/prepareBoundedFormalEventTrial';
import {
  runBoundedFormalEventProposalParticipant,
} from '../../scripts/evolution/autonomousAuthoring/runBoundedFormalEventProposalParticipant';
import {
  runBoundedFormalEventReviewParticipant,
} from '../../scripts/evolution/autonomousAuthoring/runBoundedFormalEventReviewParticipant';
import {
  referenceParticipantBindingLockSha256,
  type ReferenceParticipantBindingLockV1,
} from '../../scripts/evolution/operator/referenceParticipantBinding';
import {
  runStructuredParticipantExecution,
  type StructuredParticipantExecutionResult,
} from '../../scripts/evolution/problemAgnosticSolution/runStructuredParticipantExecution';
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

function testBindingLock(modelConfigured = 'deterministic-formal-event-test'): ReferenceParticipantBindingLockV1 {
  return {
    schemaVersion: 'reference-participant-binding-lock-v1',
    bindingId: 'CODEX_CURRENT',
    provider: 'codex-local-subagent',
    executableRealPath: process.execPath,
    executableVersion: process.version,
    modelConfigured,
    reasoningEffort: 'medium',
    ambientCodexConfigPath: join(tmpdir(), 'formal-event-test-codex-config.toml'),
    ambientCodexConfigSha256: 'ABSENT',
    nativeEnvelopeAssistance: {
      enabled: true,
      schemaRef: 'scripts/evolution/operator/codexJsonObjectEnvelope.schema.json',
      schemaSha256: 'a'.repeat(64),
    },
  };
}

function deterministicParticipant(rawOutput: string, onStart?: () => void) {
  return {
    executable: process.execPath,
    timeoutMs: 10_000,
    bindingMetadata: { bindingId: 'deterministic-fake-participant' },
    buildArgs: () => {
      onStart?.();
      return ['-e', `process.stdout.write(${JSON.stringify(rawOutput)})`];
    },
  };
}

function fakeBindingResolver(rawByModel: Record<string, string>) {
  return async (input: { repositoryRoot: string; lock: ReferenceParticipantBindingLockV1 }) => ({
    bindingId: input.lock.bindingId,
    provider: input.lock.provider,
    executable: input.lock.executableRealPath,
    executableVersion: input.lock.executableVersion,
    participant: deterministicParticipant(rawByModel[input.lock.modelConfigured] ?? '{}'),
    participantMode: 'local-subagent',
  }) as never;
}

function canonicalFakeProposal(invocationRef: string, id = nextUnusedFixtureEventId()) {
  return {
    ...validProposal(uniqueCandidatePayload(id)),
    proposedBy: `bounded-formal-event-proposal:${invocationRef}`,
  };
}

function canonicalFakeReview(proposal: ReturnType<typeof canonicalFakeProposal>, invocationRef: string) {
  return {
    ...validReview(proposal),
    reviewerRef: `bounded-formal-event-review:${invocationRef}`,
  };
}

async function buildFakeGenerationManifest(input: {
  repositoryRoot: string;
  manifestPath: string;
  proposalInvocationRef: string;
  proposalBindingLock: ReferenceParticipantBindingLockV1;
  reviewerInvocationRef: string;
  reviewerBindingLock: ReferenceParticipantBindingLockV1;
}) {
  const manifest = await buildBoundedFormalEventParticipantGenerationManifest({
    ...input,
  }, {
    resolveProposalBindingFromLock: fakeBindingResolver({}),
    resolveReviewerBindingFromLock: fakeBindingResolver({}),
  });
  return {
    ...manifest,
    consumeManifest: fakeGenerationManifestConsumer(join(dirname(input.manifestPath), 'consumption')),
  };
}

function fakeGenerationManifestConsumer(consumptionRoot: string) {
  return (input: Parameters<typeof consumeBoundedFormalEventParticipantGenerationManifest>[0]) =>
    consumeBoundedFormalEventParticipantGenerationManifest({ ...input, consumptionRoot });
}

async function testParticipantGenerationPreflightManifest(): Promise<void> {
  const repositoryRoot = process.cwd();
  const root = await mkdtemp(join(tmpdir(), 'bounded-formal-event-preflight-manifest-'));
  const proposalInvocationRef = 'preflight-author-v1';
  const reviewerInvocationRef = 'preflight-reviewer-v1';
  const proposalLock = testBindingLock('preflight-proposal');
  const reviewerLock = testBindingLock('preflight-reviewer');
  const manifestPath = join(root, 'preflight-manifest.json');
  const consumptionRoot = join(root, 'consumption');
  let modelJobs = 0;
  const resolveBindingFromLock = async (input: { repositoryRoot: string; lock: ReferenceParticipantBindingLockV1 }) => {
    const resolved = await fakeBindingResolver({})(input);
    return {
      ...resolved,
      participant: deterministicParticipant('{}', () => { modelJobs += 1; }),
    } as never;
  };

  try {
    const built = await buildBoundedFormalEventParticipantGenerationManifest({
      repositoryRoot,
      proposalInvocationRef,
      proposalBindingLock: proposalLock,
      reviewerInvocationRef,
      reviewerBindingLock: reviewerLock,
      manifestPath,
    }, {
      resolveProposalBindingFromLock: resolveBindingFromLock,
      resolveReviewerBindingFromLock: resolveBindingFromLock,
    });
    const { manifest } = built;
    assert.equal(modelJobs, 0, 'Host preflight manifest creation must not start Participant jobs');
    assert.equal(manifest.schemaVersion, 'bounded-formal-event-participant-generation-preflight-manifest-v1');
    assert.equal(manifest.generationInputRef, 'bounded-formal-event-participant-generation-input-v1.json');
    assert.equal(manifest.repository.branch, 'dev');
    assert.equal(manifest.requirementSha256, sha256Hex(canonicalJson(validateAuthoringRequirementV1(
      HUMAN_DIRECT_FORMAL_EVENT_REFERENCE_REQUIREMENT,
    ))));
    assert.deepEqual(manifest.contract, {
      contractId: BOUNDED_FORMAL_EVENT_CONTRACT_ID,
      contractVersion: BOUNDED_FORMAL_EVENT_CONTRACT_VERSION,
    });
    assert.deepEqual(manifest.participantBindingLockSha256, {
      proposal: referenceParticipantBindingLockSha256(proposalLock),
      reviewer: referenceParticipantBindingLockSha256(reviewerLock),
    });
    assert.equal(manifest.proposalInvocationRef, proposalInvocationRef);
    assert.equal(manifest.reviewerInvocationRef, reviewerInvocationRef);
    assert.match(manifest.proposalPromptSha256, /^[a-f0-9]{64}$/);
    assert.match(manifest.reviewerPromptTemplateSha256, /^[a-f0-9]{64}$/);
    assert.deepEqual(manifest.budget, {
      allowedParticipantJobs: 4,
      proposalMaximumJobs: 2,
      reviewerMaximumJobs: 2,
    });
    for (const forbiddenField of ['approvalState', 'humanApprovedSha256', 'humanAuthorizationRef']) {
      assert.equal(forbiddenField in manifest, false, `preflight manifest must not contain ${forbiddenField}`);
    }
    assert.equal(built.canonicalBytes.toString('utf8'), canonicalJson(manifest));
    assert.equal(sha256Hex(built.canonicalBytes), built.canonicalSha256);

    const evidence = await readBoundedFormalEventParticipantEvidence(repositoryRoot);
    const manifestRef = { manifestPath, manifestSha256: built.canonicalSha256 };
    await assert.rejects(() => validateFreshBoundedFormalEventParticipantGenerationManifest({
      repositoryRoot,
      manifestRef: { ...manifestRef, manifestSha256: 'f'.repeat(64) },
      role: 'proposal',
      invocationRef: proposalInvocationRef,
      bindingLock: proposalLock,
      evidence,
    }, {
      resolveProposalBindingFromLock: resolveBindingFromLock,
      resolveReviewerBindingFromLock: resolveBindingFromLock,
    }), /SHA-256 does not match/i);
    await validateFreshBoundedFormalEventParticipantGenerationManifest({
      repositoryRoot,
      manifestRef,
      role: 'proposal',
      invocationRef: proposalInvocationRef,
      bindingLock: proposalLock,
      evidence,
    }, {
      resolveProposalBindingFromLock: resolveBindingFromLock,
      resolveReviewerBindingFromLock: resolveBindingFromLock,
    });

    const proposalConsumptionRef = await consumeBoundedFormalEventParticipantGenerationManifest({
      repositoryRoot,
      manifestRef,
      consumptionRoot,
      role: 'proposal',
      invocationRef: proposalInvocationRef,
      bindingLockSha256: referenceParticipantBindingLockSha256(proposalLock),
    });
    const proposal = canonicalFakeProposal(proposalInvocationRef);
    await validateFreshBoundedFormalEventParticipantGenerationManifest({
      repositoryRoot,
      manifestRef,
      role: 'reviewer',
      invocationRef: reviewerInvocationRef,
      bindingLock: reviewerLock,
      evidence,
      proposalParticipant: {
        ok: true,
        proposal,
        invocationRef: proposalInvocationRef,
        participantRef: `bounded-formal-event-proposal:${proposalInvocationRef}`,
        bindingLockSha256: referenceParticipantBindingLockSha256(proposalLock),
        generationManifestSha256: built.canonicalSha256,
        generationManifestConsumptionRef: proposalConsumptionRef,
      },
    }, {
      resolveProposalBindingFromLock: resolveBindingFromLock,
      resolveReviewerBindingFromLock: resolveBindingFromLock,
    });
    const reviewerConsumptionRef = await consumeBoundedFormalEventParticipantGenerationManifest({
      repositoryRoot,
      manifestRef,
      consumptionRoot,
      role: 'reviewer',
      invocationRef: reviewerInvocationRef,
      bindingLockSha256: referenceParticipantBindingLockSha256(reviewerLock),
    });
    assert.notEqual(proposalConsumptionRef, reviewerConsumptionRef);
    assert.equal(modelJobs, 0, 'manifest freshness checks and consumption must not start Participant jobs');

    const proposalMarker = JSON.parse(await readFile(join(consumptionRoot, proposalConsumptionRef), 'utf8')) as Record<string, unknown>;
    assert.deepEqual(Object.keys(proposalMarker).sort(), [
      'bindingLockSha256',
      'generationManifestSha256',
      'invocationRef',
      'maximumParticipantJobs',
      'role',
      'schemaVersion',
    ]);
    assert.equal(proposalMarker.generationManifestSha256, built.canonicalSha256);
    assert.equal(proposalMarker.role, 'proposal');
    assert.equal(proposalMarker.invocationRef, proposalInvocationRef);
    assert.equal(proposalMarker.bindingLockSha256, referenceParticipantBindingLockSha256(proposalLock));
    assert.equal(proposalMarker.maximumParticipantJobs, 2);
    await assert.rejects(() => consumeBoundedFormalEventParticipantGenerationManifest({
      repositoryRoot,
      manifestRef,
      consumptionRoot,
      role: 'proposal',
      invocationRef: proposalInvocationRef,
      bindingLockSha256: referenceParticipantBindingLockSha256(proposalLock),
    }), /already been consumed/i);

    await assert.rejects(() => validateFreshBoundedFormalEventParticipantGenerationManifest({
      repositoryRoot,
      manifestRef,
      role: 'proposal',
      invocationRef: proposalInvocationRef,
      bindingLock: { ...proposalLock, modelConfigured: 'changed-preflight-binding' },
      evidence,
    }, {
      resolveProposalBindingFromLock: resolveBindingFromLock,
      resolveReviewerBindingFromLock: resolveBindingFromLock,
    }), /exact preflight-manifest Participant input/i);
    await assert.rejects(() => validateFreshBoundedFormalEventParticipantGenerationManifest({
      repositoryRoot,
      manifestRef,
      role: 'proposal',
      invocationRef: proposalInvocationRef,
      bindingLock: proposalLock,
      evidence: { ...evidence, currentEventIds: [...evidence.currentEventIds, 'drifted_event_id'] },
    }, {
      resolveProposalBindingFromLock: resolveBindingFromLock,
      resolveReviewerBindingFromLock: resolveBindingFromLock,
    }), /exact preflight-manifest Participant input|stale/i);
    await assert.rejects(() => validateFreshBoundedFormalEventParticipantGenerationManifest({
      repositoryRoot,
      manifestRef,
      role: 'proposal',
      invocationRef: proposalInvocationRef,
      bindingLock: proposalLock,
      evidence,
    }, {
      captureRepositorySnapshot: async () => ({
        ...manifest.repository,
        authoritativeFingerprintSha256: 'b'.repeat(64),
      }),
      resolveProposalBindingFromLock: resolveBindingFromLock,
      resolveReviewerBindingFromLock: resolveBindingFromLock,
    }), /stale because the dev commit or authoritative repository fingerprint changed/i);

    const tamperedManifestRef = async (label: string, mutate: (packet: Record<string, unknown>) => void) => {
      const caseRoot = join(root, label);
      const caseManifestPath = join(caseRoot, 'preflight-manifest.json');
      const generated = await buildBoundedFormalEventParticipantGenerationManifest({
        repositoryRoot,
        proposalInvocationRef,
        proposalBindingLock: proposalLock,
        reviewerInvocationRef,
        reviewerBindingLock: reviewerLock,
        manifestPath: caseManifestPath,
      }, {
        resolveProposalBindingFromLock: resolveBindingFromLock,
        resolveReviewerBindingFromLock: resolveBindingFromLock,
      });
      const packet = JSON.parse(await readFile(generated.generationInputPath, 'utf8')) as Record<string, unknown>;
      mutate(packet);
      const packetBytes = Buffer.from(canonicalJson(packet), 'utf8');
      await writeFile(generated.generationInputPath, packetBytes);
      const tamperedManifest = {
        ...generated.manifest,
        generationInputSha256: sha256Hex(packetBytes),
      };
      const manifestBytes = Buffer.from(canonicalJson(tamperedManifest), 'utf8');
      await writeFile(caseManifestPath, manifestBytes);
      return { manifestPath: caseManifestPath, manifestSha256: sha256Hex(manifestBytes) };
    };
    const requirementDrift = await tamperedManifestRef('requirement-drift', packet => {
      packet.requirement = { ...(packet.requirement as Record<string, unknown>), requirementId: 'drifted-requirement' };
      packet.requirementSha256 = sha256Hex(canonicalJson(packet.requirement));
    });
    await assert.rejects(() => validateFreshBoundedFormalEventParticipantGenerationManifest({
      repositoryRoot,
      manifestRef: requirementDrift,
      role: 'proposal',
      invocationRef: proposalInvocationRef,
      bindingLock: proposalLock,
      evidence,
    }, {
      resolveProposalBindingFromLock: resolveBindingFromLock,
      resolveReviewerBindingFromLock: resolveBindingFromLock,
    }), /not the fixed Human-direct Requirement/i);
    const contractDrift = await tamperedManifestRef('contract-drift', packet => {
      packet.contract = { contractId: BOUNDED_FORMAL_EVENT_CONTRACT_ID, contractVersion: 99 };
    });
    await assert.rejects(() => validateFreshBoundedFormalEventParticipantGenerationManifest({
      repositoryRoot,
      manifestRef: contractDrift,
      role: 'proposal',
      invocationRef: proposalInvocationRef,
      bindingLock: proposalLock,
      evidence,
    }, {
      resolveProposalBindingFromLock: resolveBindingFromLock,
      resolveReviewerBindingFromLock: resolveBindingFromLock,
    }), /Contract identity is invalid/i);
    const promptDrift = await tamperedManifestRef('prompt-drift', packet => {
      (packet.proposalParticipant as Record<string, unknown>).promptSha256 = 'c'.repeat(64);
    });
    await assert.rejects(() => validateFreshBoundedFormalEventParticipantGenerationManifest({
      repositoryRoot,
      manifestRef: promptDrift,
      role: 'proposal',
      invocationRef: proposalInvocationRef,
      bindingLock: proposalLock,
      evidence,
    }, {
      resolveProposalBindingFromLock: resolveBindingFromLock,
      resolveReviewerBindingFromLock: resolveBindingFromLock,
    }), /prompt|provenance/i);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

async function testParticipantGenerationPreflightAdapters(): Promise<void> {
  const repositoryRoot = process.cwd();
  const evidence = await readBoundedFormalEventParticipantEvidence(repositoryRoot);
  const root = await mkdtemp(join(tmpdir(), 'bounded-formal-event-preflight-adapters-'));
  const proposalInvocationRef = 'preflight-adapter-author-v1';
  const reviewerInvocationRef = 'preflight-adapter-reviewer-v1';
  const proposalLock = testBindingLock('preflight-adapter-proposal');
  const reviewerLock = testBindingLock('preflight-adapter-reviewer');
  const proposal = canonicalFakeProposal(proposalInvocationRef);
  const review = canonicalFakeReview(proposal, reviewerInvocationRef);
  let proposalJobs = 0;
  let reviewerJobs = 0;
  let workspaceNumber = 0;
  let validProposalWorkspaceRoot = '';
  let validReviewerWorkspaceRoot = '';
  const bindingResolver = (rawByModel: Record<string, string>) => async (input: {
    repositoryRoot: string;
    lock: ReferenceParticipantBindingLockV1;
  }) => {
    const resolved = await fakeBindingResolver(rawByModel)(input);
    return {
      ...resolved,
      participant: deterministicParticipant(rawByModel[input.lock.modelConfigured] ?? '{}', () => {
        if (input.lock.modelConfigured === proposalLock.modelConfigured) proposalJobs += 1;
        if (input.lock.modelConfigured === reviewerLock.modelConfigured) reviewerJobs += 1;
      }),
    } as never;
  };
  const built = await buildFakeGenerationManifest({
    repositoryRoot,
    manifestPath: join(root, 'preflight-manifest.json'),
    proposalInvocationRef,
    proposalBindingLock: proposalLock,
    reviewerInvocationRef,
    reviewerBindingLock: reviewerLock,
  });
  const manifestDependencies = {
    resolveProposalBindingFromLock: fakeBindingResolver({}),
    resolveReviewerBindingFromLock: fakeBindingResolver({}),
  };
  const runProposal = async (
    label: string,
    manifestRef = built.manifestRef,
    dependencies: Parameters<typeof runBoundedFormalEventProposalParticipant>[1] = {},
  ) => {
    workspaceNumber += 1;
    const workspaceRoot = join(root, `proposal-workspace-${workspaceNumber}`);
    if (label === 'valid') validProposalWorkspaceRoot = workspaceRoot;
    await mkdir(workspaceRoot, { recursive: true });
    return runBoundedFormalEventProposalParticipant({
      repositoryRoot,
      workspaceRoot,
      destinationRoot: join(root, `proposal-observability-${label}-${workspaceNumber}`),
      invocationRef: proposalInvocationRef,
      bindingLock: proposalLock,
      generationManifestRef: manifestRef,
      evidence,
    }, {
      resolveBindingFromLock: bindingResolver({ [proposalLock.modelConfigured]: JSON.stringify(proposal) }),
      consumeManifest: built.consumeManifest,
      manifestDependencies,
      ...dependencies,
    } as never);
  };
  const runReviewer = async (
    label: string,
    proposalParticipant: Awaited<ReturnType<typeof runProposal>>,
    inputEvidence = evidence,
    dependencies: Parameters<typeof runBoundedFormalEventReviewParticipant>[1] = {},
  ) => {
    workspaceNumber += 1;
    const workspaceRoot = join(root, `reviewer-workspace-${workspaceNumber}`);
    if (label === 'valid') validReviewerWorkspaceRoot = workspaceRoot;
    await mkdir(workspaceRoot, { recursive: true });
    return runBoundedFormalEventReviewParticipant({
      repositoryRoot,
      workspaceRoot,
      destinationRoot: join(root, `reviewer-observability-${label}-${workspaceNumber}`),
      invocationRef: reviewerInvocationRef,
      bindingLock: reviewerLock,
      proposalParticipant,
      generationManifestRef: built.manifestRef,
      evidence: inputEvidence,
    }, {
      resolveBindingFromLock: bindingResolver({ [reviewerLock.modelConfigured]: JSON.stringify(review) }),
      consumeManifest: built.consumeManifest,
      manifestDependencies,
      ...dependencies,
    } as never);
  };

  try {
    await assert.rejects(() => runProposal('bad-digest', {
      ...built.manifestRef,
      manifestSha256: 'f'.repeat(64),
    }), /manifest|Human-approved Gate A/i);
    assert.equal(proposalJobs, 0, 'invalid manifest digest must fail before Proposal job starts');

    const tamperedPath = join(root, 'tampered', 'preflight-manifest.json');
    const tampered = await buildFakeGenerationManifest({
      repositoryRoot,
      manifestPath: tamperedPath,
      proposalInvocationRef: 'tampered-preflight-author-v1',
      proposalBindingLock: testBindingLock('tampered-proposal'),
      reviewerInvocationRef: 'tampered-preflight-reviewer-v1',
      reviewerBindingLock: testBindingLock('tampered-reviewer'),
    });
    const tamperedBytes = Buffer.from(canonicalJson({ ...tampered.manifest, extra: 'tampered' }), 'utf8');
    await writeFile(tamperedPath, tamperedBytes);
    await assert.rejects(() => runProposal('tampered', {
      manifestPath: tamperedPath,
      manifestSha256: sha256Hex(tamperedBytes),
    }), /exactly|manifest|Human-approved Gate A/i);
    assert.equal(proposalJobs, 0, 'tampered manifest must fail before Proposal job starts');

    await assert.rejects(() => runProposal('stale-repository', built.manifestRef, {
      manifestDependencies: {
        ...manifestDependencies,
        captureRepositorySnapshot: async () => ({
          ...built.manifest.repository,
          authoritativeFingerprintSha256: 'd'.repeat(64),
        }),
      },
    } as never), /stale|Human-approved Gate A/i);
    assert.equal(proposalJobs, 0, 'stale repository manifest must fail before Proposal job starts');

    const author = await runProposal('valid');
    assert.equal(author.ok, true);
    assert.deepEqual(author.proposal, validateBoundedFormalEventProposalV2(proposal, evidence.currentEventIds));
    assert.equal(author.generationManifestSha256, built.canonicalSha256);
    assert.equal(author.generationManifestConsumptionRef,
      `bounded-formal-event-generation-manifest-consumed-${built.canonicalSha256}-proposal.json`);
    assert.equal('generationHumanAuthorizationRef' in author, false);
    assert.equal('humanAuthorizationRef' in author, false);
    assert.equal(proposalJobs, 1);
    const proposalFiles = await readdir(join(root, 'proposal-observability-valid-4'));
    assert.ok(proposalFiles.includes('participant-prompt.txt'));

    await assert.rejects(() => runProposal('replay'), /already been consumed/i);
    assert.equal(proposalJobs, 1, 'replaying one manifest role must not start another Proposal job');

    const beforeReview = reviewerJobs;
    await assert.rejects(() => runReviewer('repository-drift', author, evidence, {
      manifestDependencies: {
        ...manifestDependencies,
        captureRepositorySnapshot: async () => ({
          ...built.manifest.repository,
          authoritativeFingerprintSha256: 'e'.repeat(64),
        }),
      },
    } as never), /stale|Human-approved Gate A/i);
    assert.equal(reviewerJobs, beforeReview, 'repository drift after Proposal must fail before Reviewer job');
    await assert.rejects(() => runReviewer('evidence-drift', author, {
      ...evidence,
      currentEventIds: [...evidence.currentEventIds, 'drifted_event_id'],
    }), /preflight-manifest Participant input|Human-approved Gate A/i);
    assert.equal(reviewerJobs, beforeReview, 'evidence drift after Proposal must fail before Reviewer job');
    await assert.rejects(() => runReviewer('binding-drift', author, evidence, {
      manifestDependencies: {
        ...manifestDependencies,
        resolveReviewerBindingFromLock: async () => { throw new Error('fresh Reviewer binding drift'); },
      },
    } as never), /fresh Reviewer binding drift/i);
    assert.equal(reviewerJobs, beforeReview, 'binding drift after Proposal must fail before Reviewer job');

    const reviewer = await runReviewer('valid', author);
    assert.equal(reviewer.ok, true);
    assert.equal(reviewer.generationManifestSha256, built.canonicalSha256);
    assert.equal(reviewer.generationManifestConsumptionRef,
      `bounded-formal-event-generation-manifest-consumed-${built.canonicalSha256}-reviewer.json`);
    assert.equal('generationHumanAuthorizationRef' in reviewer, false);
    assert.notEqual(author.participantRef, reviewer.participantRef);
    assert.notEqual(author.invocationRef, reviewer.invocationRef);
    assert.notEqual(validProposalWorkspaceRoot, validReviewerWorkspaceRoot);
    assert.equal(reviewerJobs, 1, 'one valid Reviewer input starts exactly one independent Reviewer job');
    const reviewerFiles = await readdir(join(root, 'reviewer-observability-valid-9'));
    assert.ok(reviewerFiles.includes('participant-prompt.txt'));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
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
  assert.equal(BOUNDED_FORMAL_EVENT_AUTHORING_SAFE_PROJECTION_V1.maxNewEvents, 1);
  assert.equal(BOUNDED_FORMAL_EVENT_AUTHORING_SAFE_PROJECTION_V1.narrativeContinuity.futureHook, 'NONE');
  assert.deepEqual(BOUNDED_FORMAL_EVENT_AUTHORING_SAFE_PROJECTION_V1.allowedWritePaths, BOUNDED_FORMAL_EVENT_ALLOWED_WRITE_PATHS);
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

async function testFormalEventParticipantAdapters(): Promise<void> {
  const repositoryRoot = process.cwd();
  const evidence = await readBoundedFormalEventParticipantEvidence(repositoryRoot);
  const root = await mkdtemp(join(tmpdir(), 'bounded-formal-event-participants-'));
  let caseNumber = 0;
  const runProposalCase = async (
    name: string,
    rawOutput: string,
    fixedInvocationRef?: string,
    fixedReviewerInvocationRef?: string,
  ) => {
    caseNumber += 1;
    const currentCase = caseNumber;
    const invocationRef = fixedInvocationRef ?? `proposal-${name}-${caseNumber}`;
    const reviewerInvocationRef = fixedReviewerInvocationRef ?? `reviewer-for-${invocationRef}`;
    const workspaceRoot = join(root, `proposal-workspace-${caseNumber}`);
    const destinationRoot = join(root, `proposal-observability-${caseNumber}`);
    await mkdir(workspaceRoot, { recursive: true });
    const bindingLock = testBindingLock(`fake-proposal-${caseNumber}`);
    const reviewerBindingLock = testBindingLock(`fake-reviewer-for-${caseNumber}`);
    const generationManifest = await buildFakeGenerationManifest({
      repositoryRoot,
      manifestPath: join(root, `preflight-${currentCase}`, 'preflight-manifest.json'),
      proposalInvocationRef: invocationRef,
      proposalBindingLock: bindingLock,
      reviewerInvocationRef,
      reviewerBindingLock,
    });
    const output = await runBoundedFormalEventProposalParticipant({
      repositoryRoot,
      workspaceRoot,
      destinationRoot,
      invocationRef,
      bindingLock,
      generationManifestRef: generationManifest.manifestRef,
      evidence,
    }, {
      resolveBindingFromLock: fakeBindingResolver({ [bindingLock.modelConfigured]: rawOutput }),
      consumeManifest: generationManifest.consumeManifest,
      manifestDependencies: {
        resolveProposalBindingFromLock: fakeBindingResolver({}),
        resolveReviewerBindingFromLock: fakeBindingResolver({}),
      },
    });
    return { output, generationManifest, reviewerInvocationRef, reviewerBindingLock, destinationRoot };
  };
  const runReviewCase = async (
    name: string,
    authorCase: Awaited<ReturnType<typeof runProposalCase>>,
    rawOutput: string,
  ) => {
    caseNumber += 1;
    const invocationRef = authorCase.reviewerInvocationRef;
    const workspaceRoot = join(root, `review-workspace-${caseNumber}`);
    const destinationRoot = join(root, `review-observability-${caseNumber}`);
    await mkdir(workspaceRoot, { recursive: true });
    const output = await runBoundedFormalEventReviewParticipant({
      repositoryRoot,
      workspaceRoot,
      destinationRoot,
      invocationRef,
      bindingLock: authorCase.reviewerBindingLock,
      proposalParticipant: authorCase.output,
      generationManifestRef: authorCase.generationManifest.manifestRef,
      evidence,
    }, {
      resolveBindingFromLock: fakeBindingResolver({ [authorCase.reviewerBindingLock.modelConfigured]: rawOutput }),
      consumeManifest: authorCase.generationManifest.consumeManifest,
      manifestDependencies: {
        resolveProposalBindingFromLock: fakeBindingResolver({}),
        resolveReviewerBindingFromLock: fakeBindingResolver({}),
      },
    });
    return { output, destinationRoot };
  };
  try {
    const authorInvocationRef = 'author-valid-001';
    const reviewerInvocationRef = 'reviewer-valid-001';
    const proposal = canonicalFakeProposal(authorInvocationRef);
    const authorCase = await runProposalCase('valid', JSON.stringify(proposal), authorInvocationRef, reviewerInvocationRef);
    const author = authorCase.output;
    assert.equal(author.ok, true);
    assert.deepEqual(author.proposal, validateBoundedFormalEventProposalV2(proposal, evidence.currentEventIds));
    assert.equal(author.participantRef, proposal.proposedBy);
    assert.equal(author.execution.ok, true);
    const authorFiles = await readdir(authorCase.destinationRoot);
    assert.ok(authorFiles.includes('participant-prompt.txt'));
    assert.ok(authorFiles.includes('participant-binding.json'));
    assert.ok(authorFiles.includes('terminal-attempt-0.txt'));
    const authorPrompt = await readFile(join(authorCase.destinationRoot, 'participant-prompt.txt'), 'utf8');
    assert.ok(authorPrompt.includes(`"requirementId": "${HUMAN_DIRECT_FORMAL_EVENT_REFERENCE_REQUIREMENT.requirementId}"`));
    assert.ok(authorPrompt.includes('existingEventIdsToAvoid'));
    assert.ok(!authorPrompt.includes(proposal.contractPayload!.events[0]!.id));

    const review = canonicalFakeReview(proposal, reviewerInvocationRef);
    const reviewerCase = await runReviewCase('valid', authorCase, JSON.stringify(review));
    const reviewer = reviewerCase.output;
    assert.equal(reviewer.ok, true);
    assert.deepEqual(reviewer.review, validateBoundedFormalEventReviewAssessmentV2(review));
    assert.equal(reviewer.participantRef, review.reviewerRef);
    assert.notEqual(reviewer.participantRef, author.participantRef);
    assert.notEqual(reviewer.invocationRef, author.invocationRef);
    assert.equal(reviewer.proposalSha256, sha256Hex(canonicalJson(proposal)));
    const reviewerPrompt = await readFile(join(reviewerCase.destinationRoot, 'participant-prompt.txt'), 'utf8');
    assert.ok(reviewerPrompt.includes('Proposal to review:'));
    assert.ok(reviewerPrompt.includes(proposal.contractPayload!.events[0]!.id));

    const invalidProposalCases: Array<[string, string]> = [
      ['invalid-json', '{not-json'],
      ['wrong-schema', JSON.stringify({ ...proposal, schemaVersion: 'autonomous-authoring-proposal-v1' })],
      ['preschool-v1', JSON.stringify({
        schemaVersion: 'autonomous-authoring-proposal-v1',
        contractId: 'preschool-shared-neutral-passive-capacity-v1',
        contractVersion: 1,
        contractPayload: null,
      })],
      ['multiple-events', JSON.stringify({
        ...canonicalFakeProposal('proposal-multiple-events'),
        contractPayload: {
          ...uniqueCandidatePayload(),
          events: [uniqueCandidatePayload().events[0], uniqueCandidatePayload().events[0]],
        },
      })],
      ['forbidden-effect', JSON.stringify((() => {
        const value = canonicalFakeProposal('proposal-forbidden-effect');
        const event = value.contractPayload!.events[0] as unknown as Record<string, unknown>;
        const choices = event.choices as Array<Record<string, unknown>>;
        const choice = choices[0]!;
        const effects = choice.effects as Array<Record<string, unknown>>;
        effects.push({ type: 'flag_set', flag: 'unauthorized_flag', value: true });
        return value;
      })())],
      ['wrong-requirement', JSON.stringify({
        ...canonicalFakeProposal('proposal-wrong-requirement'),
        requirement: {
          ...HUMAN_DIRECT_FORMAL_EVENT_REFERENCE_REQUIREMENT,
          requirementId: 'another-formal-event-requirement',
        },
      })],
    ];
    for (const [name, rawOutput] of invalidProposalCases) {
      const result = (await runProposalCase(name, rawOutput)).output;
      assert.equal(result.ok, false, `${name} must fail closed`);
      assert.equal(result.proposal, undefined);
    }

    const invalidReviewCases: Array<[string, (sourceProposal: NonNullable<typeof author.proposal>, reviewerRef: string) => string]> = [
      ['invalid-json', () => '{not-json'],
      ['wrong-schema', (sourceProposal, reviewerRef) => JSON.stringify({
        ...canonicalFakeReview(sourceProposal, reviewerRef),
        schemaVersion: 'autonomous-authoring-review-assessment-v1',
      })],
      ['wrong-proposal-sha', (sourceProposal, reviewerRef) => JSON.stringify({
        ...canonicalFakeReview(sourceProposal, reviewerRef),
        proposalSha256: 'f'.repeat(64),
      })],
      ['author-identity', sourceProposal => JSON.stringify({
        ...canonicalFakeReview(sourceProposal, 'unused-reviewer-ref'),
        reviewerRef: sourceProposal.proposedBy,
      })],
    ];
    for (const [name, makeRawOutput] of invalidReviewCases) {
      const invalidProposalInvocationRef = `review-source-${name}`;
      const invalidProposal = canonicalFakeProposal(invalidProposalInvocationRef);
      const invalidAuthorCase = await runProposalCase(
        `review-source-${name}`,
        JSON.stringify(invalidProposal),
        invalidProposalInvocationRef,
      );
      assert.equal(invalidAuthorCase.output.ok, true);
      const sourceProposal = invalidAuthorCase.output.proposal!;
      const result = (await runReviewCase(
        name,
        invalidAuthorCase,
        makeRawOutput(sourceProposal, invalidAuthorCase.reviewerInvocationRef),
      )).output;
      assert.equal(result.ok, false, `${name} must fail closed`);
      assert.equal(result.review, undefined);
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

async function testReviewerAdmissionGuards(): Promise<void> {
  const proposal = canonicalFakeProposal('admission-guard-author');
  const acceptableReview = canonicalFakeReview(proposal, 'admission-guard-reviewer');
  const common = {
    repositoryRoot: process.cwd(),
    requirement: HUMAN_DIRECT_FORMAL_EVENT_REFERENCE_REQUIREMENT,
    proposal,
    observedLifeStates: { trainingHabit: 2, businessHabit: 2 },
  };
  const rejectedReviews = [
    { ...acceptableReview, reviewerRef: proposal.proposedBy },
    { ...acceptableReview, proposalSha256: 'f'.repeat(64) },
    { ...acceptableReview, conformance: 'NON_CONFORMING' as const },
    { ...acceptableReview, requirementCoverage: 'NOT_COVERED' as const },
    { ...acceptableReview, blockers: ['does not satisfy the fixed Requirement'] },
  ];
  for (const review of rejectedReviews) {
    const admission = await evaluateBoundedFormalEventAdmission({ ...common, review });
    assert.equal(admission.status, 'REVIEW_REJECTED');
  }
}

async function testFakeParticipantPreparationBuildsPreflightManifest(): Promise<void> {
  const repositoryRoot = process.cwd();
  const root = await mkdtemp(join(tmpdir(), 'bounded-formal-event-preparation-'));
  const proposalInvocationRef = 'preparation-author-v1';
  const reviewerInvocationRef = 'preparation-reviewer-v1';
  const proposal = canonicalFakeProposal(proposalInvocationRef, 'test_preparation_formal_event');
  const review = canonicalFakeReview(proposal, reviewerInvocationRef);
  const proposalLock = testBindingLock('fake-formal-proposal');
  const reviewerLock = testBindingLock('fake-formal-reviewer');
  const proposalWorkspaceRoot = join(root, 'proposal-workspace');
  const reviewerWorkspaceRoot = join(root, 'reviewer-workspace');
  await Promise.all([
    mkdir(proposalWorkspaceRoot, { recursive: true }),
    mkdir(reviewerWorkspaceRoot, { recursive: true }),
  ]);
  const starts = { proposal: 0, reviewer: 0 };
  const resolver = (rawByModel: Record<string, string>) => async (input: {
    repositoryRoot: string;
    lock: ReferenceParticipantBindingLockV1;
  }) => {
    const resolved = await fakeBindingResolver(rawByModel)(input);
    return {
      ...resolved,
      participant: deterministicParticipant(rawByModel[input.lock.modelConfigured] ?? '{}', () => {
        if (input.lock.modelConfigured === proposalLock.modelConfigured) starts.proposal += 1;
        if (input.lock.modelConfigured === reviewerLock.modelConfigured) starts.reviewer += 1;
      }),
    } as never;
  };
  const preflightManifestPath = join(root, 'preflight', 'preflight-manifest.json');
  const executionManifestPath = join(root, 'execution', 'execution-manifest.json');
  const consumptionRoot = join(root, 'consumption');
  const resolveBindingFromLock = resolver({
    [proposalLock.modelConfigured]: JSON.stringify(proposal),
    [reviewerLock.modelConfigured]: JSON.stringify(review),
  });
  const manifestDependencies = {
    resolveProposalBindingFromLock: fakeBindingResolver({}),
    resolveReviewerBindingFromLock: fakeBindingResolver({}),
  };
  try {
    const preparation = await prepareBoundedFormalEventTrial({
      repositoryRoot,
      proposalWorkspaceRoot,
      proposalDestinationRoot: join(root, 'proposal-observability'),
      proposalInvocationRef,
      proposalBindingLock: proposalLock,
      reviewerWorkspaceRoot,
      reviewerDestinationRoot: join(root, 'reviewer-observability'),
      reviewerInvocationRef,
      reviewerBindingLock: reviewerLock,
      observedLifeStates: { trainingHabit: 2, businessHabit: 2 },
      preflightManifestPath,
      executionManifestPath,
    }, {
      proposalDependencies: {
        resolveBindingFromLock,
        consumeManifest: fakeGenerationManifestConsumer(consumptionRoot),
        manifestDependencies,
      } as never,
      reviewerDependencies: {
        resolveBindingFromLock,
        consumeManifest: fakeGenerationManifestConsumer(consumptionRoot),
        manifestDependencies,
      } as never,
      manifestDependencies,
    } as never);
    assert.equal(preparation.status, 'ELIGIBLE');
    assert.equal(preparation.admission.status, 'ELIGIBLE');
    assert.equal(preparation.proposal.ok, true);
    assert.equal(preparation.reviewer.ok, true);
    assert.notEqual(preparation.proposal.participantRef, preparation.reviewer.participantRef);
    assert.notEqual(preparation.proposal.invocationRef, preparation.reviewer.invocationRef);
    assert.equal(starts.proposal, 1);
    assert.equal(starts.reviewer, 1);
    const manifestBytes = await readFile(preflightManifestPath);
    const manifest = JSON.parse(manifestBytes.toString('utf8')) as Record<string, unknown>;
    assert.equal(sha256Hex(manifestBytes), preparation.proposal.generationManifestSha256);
    assert.equal(preparation.reviewer.generationManifestSha256, preparation.proposal.generationManifestSha256);
    assert.equal('approvalState' in manifest, false);
    assert.equal('generationHumanAuthorizationRef' in preparation.proposal, false);
    assert.equal('generationHumanAuthorizationRef' in preparation.reviewer, false);
    assert.equal('authorizationCandidate' in preparation, false);
    assert.equal(await readFile(preflightManifestPath, 'utf8'), canonicalJson(manifest));
    assert.equal(await readFile(executionManifestPath).then(() => true).catch(() => false), false);

    const failedProposalInvocationRef = 'preparation-invalid-author-v1';
    const failedReviewerInvocationRef = 'preparation-invalid-reviewer-v1';
    const failedProposalLock = testBindingLock('failed-formal-proposal');
    const failedReviewerLock = testBindingLock('failed-formal-reviewer');
    const failedRoots = {
      proposal: join(root, 'failed-proposal-workspace'),
      reviewer: join(root, 'failed-reviewer-workspace'),
    };
    await Promise.all([
      mkdir(failedRoots.proposal, { recursive: true }),
      mkdir(failedRoots.reviewer, { recursive: true }),
    ]);
    const failedStarts = { proposal: 0, reviewer: 0 };
    const failedResolver = (rawByModel: Record<string, string>) => async (input: {
      repositoryRoot: string;
      lock: ReferenceParticipantBindingLockV1;
    }) => {
      const resolved = await fakeBindingResolver(rawByModel)(input);
      return {
        ...resolved,
        participant: deterministicParticipant(rawByModel[input.lock.modelConfigured] ?? '{}', () => {
          if (input.lock.modelConfigured === failedProposalLock.modelConfigured) failedStarts.proposal += 1;
          if (input.lock.modelConfigured === failedReviewerLock.modelConfigured) failedStarts.reviewer += 1;
        }),
      } as never;
    };
    const failedPreparation = await prepareBoundedFormalEventTrial({
      repositoryRoot,
      proposalWorkspaceRoot: failedRoots.proposal,
      proposalDestinationRoot: join(root, 'failed-proposal-observability'),
      proposalInvocationRef: failedProposalInvocationRef,
      proposalBindingLock: failedProposalLock,
      reviewerWorkspaceRoot: failedRoots.reviewer,
      reviewerDestinationRoot: join(root, 'failed-reviewer-observability'),
      reviewerInvocationRef: failedReviewerInvocationRef,
      reviewerBindingLock: failedReviewerLock,
      observedLifeStates: { trainingHabit: 2, businessHabit: 2 },
      preflightManifestPath: join(root, 'failed', 'preflight-manifest.json'),
      executionManifestPath: join(root, 'failed', 'execution-manifest.json'),
    }, {
      proposalDependencies: {
        resolveBindingFromLock: failedResolver({ [failedProposalLock.modelConfigured]: '{not-json' }),
        consumeManifest: fakeGenerationManifestConsumer(join(root, 'failed-consumption')),
        manifestDependencies,
      } as never,
      reviewerDependencies: {
        resolveBindingFromLock: failedResolver({ [failedReviewerLock.modelConfigured]: JSON.stringify(review) }),
        consumeManifest: fakeGenerationManifestConsumer(join(root, 'failed-consumption')),
        manifestDependencies,
      } as never,
      manifestDependencies,
    } as never);
    assert.equal(failedPreparation.status, 'PREPARATION_FAILED');
    assert.equal(failedStarts.reviewer, 0, 'Proposal terminal failure must prevent Reviewer execution');
    assert.ok(failedStarts.proposal > 0);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

testAuthoringRequirementV1();
testExplicitRouting();
await testBoundedFormalEventContract();
await testApplicabilityAndAdmission();
if (process.env.BOUNDED_FORMAL_EVENT_SHADOW_REGRESSION_EVENT_ID === undefined) {
  await testParticipantGenerationPreflightManifest();
  await testParticipantGenerationPreflightAdapters();
  await testFormalEventParticipantAdapters();
  await testReviewerAdmissionGuards();
}
await testShadowVerificationUsesAuthoritativeBaseline();
await testShadowVerificationRejectsForbiddenChangedFile();
await testVerifierRejectsDuplicateEventId();
await testShadowTrialRequiresSeparateHumanAuthorization();
if (process.env.BOUNDED_FORMAL_EVENT_SHADOW_REGRESSION_EVENT_ID === undefined) {
  await testFakeParticipantPreparationBuildsPreflightManifest();
}
if (process.env.BOUNDED_FORMAL_EVENT_SHADOW_REGRESSION_EVENT_ID === undefined) {
  await testDeterministicShadowExecutionPipeline();
}
console.log('boundedFormalEventAuthoring.test.ts: ok');
