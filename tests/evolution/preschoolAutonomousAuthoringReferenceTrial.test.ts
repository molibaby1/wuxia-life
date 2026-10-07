import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { chmod, mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { WorkspaceAgentJobInput, WorkspaceAgentParticipantOptions } from '../../scripts/evolution/problemAgnosticSolution/agentParticipant';
import type { RunSolutionAgentInput, SolutionAgentRunResult } from '../../scripts/evolution/problemAgnosticSolution/runSolutionAgent';
import { persistParticipantPromptAndBinding } from '../../scripts/evolution/participantObservability';
import {
  assertPreschoolReferenceResponsibilitiesPreserved,
  readAcceptedPreschoolReferenceResponsibilityBrief,
  PRESCHOOL_REFERENCE_TRIAL_ACCEPTED_RESPONSIBILITY_BRIEF_SHA256,
  validatePreschoolReferenceResponsibilityBrief,
} from '../../scripts/evolution/autonomousAuthoring/preschoolReferenceResponsibilityBrief';
import { canonicalJson, sha256Hex } from '../../scripts/evolution/phase0/provenance';
import { parseStoredImprovementHypothesisSet } from '../../src/evolution/improvementHypothesisContract';
import type { AutonomousAuthoringProposalV1 } from '../../src/evolution/autonomousAuthoringContract';
import { captureAuthoritativeFingerprint } from '../../scripts/evolution/problemAgnosticSolution/agentWorkspace';
import {
  buildPreschoolReferenceTrialAuthorizationCandidate,
} from '../../scripts/evolution/autonomousAuthoring/buildPreschoolReferenceTrialAuthorization';
import {
  artifactBackedReferenceParticipantBindingLockSha256,
  referenceParticipantBindingLockSha256,
  type ArtifactBackedReferenceParticipantBindingLockV2,
  type ReferenceParticipantBindingLockV1,
} from '../../scripts/evolution/operator/referenceParticipantBinding';
import { runStructuredParticipantExecution } from '../../scripts/evolution/problemAgnosticSolution/runStructuredParticipantExecution';
import {
  PRESCHOOL_REFERENCE_TRIAL_ACCEPTED_EVIDENCE_SHA256,
  PRESCHOOL_REFERENCE_TRIAL_ACCEPTED_SEALED_OBSERVABLE_PAYLOAD_SHA256,
  admitReferenceTrialAttempt,
  buildPreschoolReferenceTrialVerifiedResult,
  captureReferenceTrialLegacyHistory,
  createPreschoolReferenceTrialOutputRoot,
  createAttemptManifestTransitionToken,
  finalizeReferenceTrialFailure,
  finalizeReferenceTrialSuccess,
  overlayReferenceTrialAuthority,
  prepareReferenceTrialParticipantWorkspace,
  readAttemptParticipantPromptProvenance,
  referenceTrialInvocationRef,
  runPreschoolReferenceArtifactBackedSolutionCommunicationProbe,
  runPreschoolReferenceTrial,
  runPreschoolReferenceTrialCli,
  readExactReferenceObservablePayload,
  TrialParticipantFailure,
  writeAttemptManifest,
  writePreschoolReferenceTrialInputs,
  withParticipantContaminationGuard,
} from '../../scripts/evolution/autonomousAuthoring/runPreschoolReferenceTrial';

const ANSWER_IDS = [
  'preschool_neutral_fair_play',
  'preschool_neutral_self_made_project',
  'preschool_neutral_stand_for_peer',
  'preschool_neutral_first_farewell',
  'preschool_neutral_neighborhood_help',
] as const;

const AUTHORITY_PATHS = [
  'docs/governance/product-decisions.md',
  'docs/product/content-authoring-workflow-contract-design.md',
  'docs/product/auto-evolution-model.md',
] as const;
const HISTORICAL_PRESCHOOL_AUTHORITY_FIXTURE = [
  '### PD-121：Contract-Constrained Autonomous Authoring v1\n',
  '# Content Authoring Workflow Contract v3\nPD-121 shadow authoring exception\nHuman exact-patch promotion\n',
  'Auto Evolution current authority includes PD-121.\n',
] as const;

const RESIDUAL_DESIGN_PATH = 'docs/superpowers/specs/2026-09-23-preschool-residual-content-capacity-authoring-design.md';
const ACCEPTED_DESIGN_PATH = 'docs/superpowers/specs/2026-09-24-contract-constrained-autonomous-authoring-v1-design.md';
const REFERENCE_TRIAL_ROOT_PATH = 'artifacts/evolution/autonomous-authoring/reference-trials/preschool-pver-20260922231805-71297571';
const REFERENCE_TRIAL_ATTEMPTS_PATH = join(REFERENCE_TRIAL_ROOT_PATH, 'attempts');
const REFERENCE_HYPOTHESIS_UNKNOWN = 'Whether the supplied Human-approved responsibilities admit independently authored contract-conforming content instances remains to be determined and independently reviewed.';
const RETRANSMISSION_PROMPT_ARTIFACT = 'participant-envelope-retransmission-prompt-1.txt';
const TEST_PARTICIPANT_BINDING_LOCK: ReferenceParticipantBindingLockV1 = {
  schemaVersion: 'reference-participant-binding-lock-v1',
  bindingId: 'CODEX_CURRENT',
  provider: 'codex-local-subagent',
  executableRealPath: '/synthetic/codex/bin/codex',
  executableVersion: 'codex synthetic-1.0.0',
  modelConfigured: 'gpt-6-luna',
  reasoningEffort: 'max',
  ambientCodexConfigPath: '/synthetic/codex/config.toml',
  ambientCodexConfigSha256: 'a'.repeat(64),
  nativeEnvelopeAssistance: {
    enabled: true,
    schemaRef: 'scripts/evolution/operator/codexJsonObjectEnvelope.schema.json',
    schemaSha256: sha256Hex('{"type":"object"}'),
  },
};
const TEST_PARTICIPANT_BINDING_LOCK_SHA256 = referenceParticipantBindingLockSha256(TEST_PARTICIPANT_BINDING_LOCK);
const TEST_SOLUTION_PARTICIPANT_BINDING_LOCK: ArtifactBackedReferenceParticipantBindingLockV2 = {
  schemaVersion: 'reference-participant-binding-lock-v2',
  bindingId: TEST_PARTICIPANT_BINDING_LOCK.bindingId,
  provider: TEST_PARTICIPANT_BINDING_LOCK.provider,
  executableRealPath: TEST_PARTICIPANT_BINDING_LOCK.executableRealPath,
  executableVersion: TEST_PARTICIPANT_BINDING_LOCK.executableVersion,
  modelConfigured: TEST_PARTICIPANT_BINDING_LOCK.modelConfigured,
  reasoningEffort: TEST_PARTICIPANT_BINDING_LOCK.reasoningEffort,
  ambientCodexConfigPath: TEST_PARTICIPANT_BINDING_LOCK.ambientCodexConfigPath,
  ambientCodexConfigSha256: TEST_PARTICIPANT_BINDING_LOCK.ambientCodexConfigSha256,
  structuredResultDelivery: {
    kind: 'WORKSPACE_ARTIFACT_RECEIPT_V1',
    resultRelativePath: '.evolution-participant/final-result.json',
    receiptSchemaRef: 'scripts/evolution/operator/codexArtifactBackedReceipt.schema.json',
    receiptSchemaSha256: sha256Hex('{"type":"object"}'),
  },
};
const TEST_SOLUTION_PARTICIPANT_BINDING_LOCK_SHA256 = artifactBackedReferenceParticipantBindingLockSha256(
  TEST_SOLUTION_PARTICIPANT_BINDING_LOCK,
);

async function testBindingLockResolver(input: { repositoryRoot: string; lock: ReferenceParticipantBindingLockV1 }): Promise<never> {
  assert.equal(input.repositoryRoot.length > 0, true);
  assert.equal(referenceParticipantBindingLockSha256(input.lock), TEST_PARTICIPANT_BINDING_LOCK_SHA256);
  return {} as never;
}

async function testArtifactBackedBindingLockResolver(input: {
  repositoryRoot: string;
  lock: ArtifactBackedReferenceParticipantBindingLockV2;
}): Promise<never> {
  assert.equal(input.repositoryRoot.length > 0, true);
  assert.equal(
    artifactBackedReferenceParticipantBindingLockSha256(input.lock),
    TEST_SOLUTION_PARTICIPANT_BINDING_LOCK_SHA256,
  );
  return {} as never;
}

async function admitForTest(input: Parameters<typeof admitReferenceTrialAttempt>[0]) {
  return admitReferenceTrialAttempt(input, testBindingLockResolver, testArtifactBackedBindingLockResolver);
}

async function testRetransmissionPromptPersistedBeforeSend(root: string): Promise<void> {
  const threadRef = { provider: 'synthetic-provider', opaqueId: 'thread-000001' };
  const initialOutput = 'Invalid structured terminal envelope';
  const destinationRoot = join(root, 'retransmission-prompt-before-send');
  let deliveredPrompt: string | undefined;
  let continuationBuildCount = 0;
  const participant: WorkspaceAgentParticipantOptions = {
    executable: process.execPath,
    buildArgs: () => ['-e', 'process.stdout.write(process.argv[1])', initialOutput],
    interpretCompletedOutput: ({ stdout, expectedThreadRef }) => ({
      ok: true as const,
      rawOutput: stdout,
      threadRef: expectedThreadRef ?? threadRef,
    }),
    sameThreadContinuation: {
      provider: threadRef.provider,
      buildArgs: job => {
        continuationBuildCount += 1;
        deliveredPrompt = job.prompt;
        assert.equal(readFileSync(join(destinationRoot, RETRANSMISSION_PROMPT_ARTIFACT), 'utf8'), job.prompt);
        return ['-e', 'process.stdout.write(process.argv[1])', '{"accepted":true}'];
      },
    },
  };
  const run = (targetRoot: string) => runStructuredParticipantExecution({
    invocationRef: 'synthetic-retransmission-000001',
    role: 'solution',
    workspaceRoot: root,
    destinationRoot: targetRoot,
    initialPrompt: 'Initial synthetic prompt',
    expectedRoleSchemaName: 'SyntheticResultV1',
    participant,
    retransmissionEnabled: true,
    validateSchema: value => value,
    validateAcceptedResult: async () => undefined,
  });
  const result = await run(destinationRoot);
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.equal(continuationBuildCount, 1, 'successful retransmission must build continuation exactly once');
  const actualBytes = await readFile(join(destinationRoot, RETRANSMISSION_PROMPT_ARTIFACT));
  assert.deepEqual(actualBytes, Buffer.from(deliveredPrompt!));

  const blockedRoot = join(root, 'retransmission-prompt-create-only-failure');
  await put(blockedRoot, RETRANSMISSION_PROMPT_ARTIFACT, 'pre-existing evidence');
  await assert.rejects(run(blockedRoot), /EEXIST/);
  assert.equal(continuationBuildCount, 1, 'blocked retransmission prompt persistence must not build a second continuation');
  assert.equal(await readFile(join(blockedRoot, RETRANSMISSION_PROMPT_ARTIFACT), 'utf8'), 'pre-existing evidence');
}

async function put(root: string, relativePath: string, content: string): Promise<void> {
  const path = join(root, relativePath);
  await mkdir(join(path, '..'), { recursive: true });
  await writeFile(path, content);
}

async function listFiles(root: string, relativePath = ''): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await readdir(join(root, relativePath), { withFileTypes: true })) {
    const child = relativePath ? `${relativePath}/${entry.name}` : entry.name;
    if (entry.isDirectory()) files.push(...await listFiles(root, child));
    else files.push(child);
  }
  return files;
}

function testReferenceResponsibilityBriefContract(): void {
  const brief = {
    schemaVersion: 'preschool-reference-responsibility-brief-v1',
    runRef: 'preschool-pver-20260922231805-71297571',
    responsibilities: [{
      responsibilityRef: 'reference-responsibility-000001',
      primaryLifeFunction: 'Shared play',
      playerVisibleNeed: 'A child needs a shared play experience.',
    }],
  };
  assert.deepEqual(validatePreschoolReferenceResponsibilityBrief(brief), brief);
  assert.throws(() => validatePreschoolReferenceResponsibilityBrief({ ...brief, extra: true }), /unknown field/);
  assert.throws(() => validatePreschoolReferenceResponsibilityBrief({
    ...brief,
    responsibilities: [{ ...brief.responsibilities[0], extra: true }],
  }), /unknown field/);
  assert.throws(() => validatePreschoolReferenceResponsibilityBrief({ ...brief, responsibilities: [] }), /1 through 8/);
  assert.throws(() => validatePreschoolReferenceResponsibilityBrief({
    ...brief,
    responsibilities: Array.from({ length: 9 }, (_, index) => ({
      ...brief.responsibilities[0],
      responsibilityRef: 'reference-responsibility-' + String(index + 1).padStart(6, '0'),
    })),
  }), /1 through 8/);
  assert.throws(() => validatePreschoolReferenceResponsibilityBrief({
    ...brief,
    responsibilities: [{ ...brief.responsibilities[0], responsibilityRef: 'reference-responsibility-000002' }],
  }), /participant order/);
  assert.throws(() => validatePreschoolReferenceResponsibilityBrief({
    ...brief,
    responsibilities: [{ ...brief.responsibilities[0], primaryLifeFunction: '' }],
  }), /non-empty string/);
  assert.throws(() => validatePreschoolReferenceResponsibilityBrief({
    ...brief,
    responsibilities: [{ ...brief.responsibilities[0], playerVisibleNeed: '' }],
  }), /non-empty string/);
  assert.throws(() => validatePreschoolReferenceResponsibilityBrief({ ...brief, runRef: 'wrong-run' }), /runRef/);
}

function testReferenceResponsibilityPreservation(): void {
  const brief = validatePreschoolReferenceResponsibilityBrief({
    schemaVersion: 'preschool-reference-responsibility-brief-v1',
    runRef: 'preschool-pver-20260922231805-71297571',
    responsibilities: [
      { responsibilityRef: 'reference-responsibility-000001', primaryLifeFunction: 'Shared play', playerVisibleNeed: 'Need shared play.' },
      { responsibilityRef: 'reference-responsibility-000002', primaryLifeFunction: 'Farewell', playerVisibleNeed: 'Need a farewell.' },
    ],
  });
  const proposal = {
    applicabilityClaim: 'APPLICABLE',
    responsibilities: brief.responsibilities.map((responsibility, index) => ({
      responsibilityId: 'responsibility-' + String(index + 1).padStart(6, '0'),
      primaryLifeFunction: responsibility.primaryLifeFunction,
      playerVisibleNeed: responsibility.playerVisibleNeed,
      evidenceRefs: [],
    })),
  } as AutonomousAuthoringProposalV1;
  assert.deepEqual(assertPreschoolReferenceResponsibilitiesPreserved({ brief, proposal }), [
    { referenceResponsibilityRef: 'reference-responsibility-000001', proposalResponsibilityId: 'responsibility-000001' },
    { referenceResponsibilityRef: 'reference-responsibility-000002', proposalResponsibilityId: 'responsibility-000002' },
  ]);
  const rejects = (responsibilities: typeof proposal.responsibilities) => assert.throws(
    () => assertPreschoolReferenceResponsibilitiesPreserved({ brief, proposal: { ...proposal, responsibilities } }),
    /reference responsibility/i,
  );
  rejects(proposal.responsibilities.slice(0, 1));
  rejects([...proposal.responsibilities, { ...proposal.responsibilities[0]!, responsibilityId: 'responsibility-000003' }]);
  rejects([...proposal.responsibilities].reverse());
  rejects([{ ...proposal.responsibilities[0]!, primaryLifeFunction: 'Changed' }, proposal.responsibilities[1]!]);
  rejects([{ ...proposal.responsibilities[0]!, playerVisibleNeed: 'Changed' }, proposal.responsibilities[1]!]);
  rejects([{ ...proposal.responsibilities[0]!, evidenceRefs: ['source/observable-payload.json'] }, proposal.responsibilities[1]!]);
}

function testQualifiedLayerAResult(): void {
  const invocationRefs = Object.fromEntries(['solution', 'reviewer', 'shadowAuthoring'].map(role => [role, {
    status: 'AVAILABLE',
    invocationRef: `preschool-pver-20260922231805-71297571/attempt-000900/${role === 'shadowAuthoring' ? 'shadow-authoring' : `${role}-000001`}`,
    artifactRef: `${role}/invocation.json`,
    artifactSha256: 'a'.repeat(64),
    completionEvidence: { artifactRef: `${role}/execution-trace.json`, sha256: 'c'.repeat(64), outcome: 'completed' },
  }])) as any;
  const result = buildPreschoolReferenceTrialVerifiedResult({
    briefSha256: PRESCHOOL_REFERENCE_TRIAL_ACCEPTED_RESPONSIBILITY_BRIEF_SHA256,
    attemptRef: 'attempt-000900',
    attemptManifestRef: 'artifacts/evolution/autonomous-authoring/reference-trials/preschool-pver-20260922231805-71297571/attempts/attempt-000900/attempt-manifest.json',
    executionAuthorization: {
      authorizationRef: 'human-authorization-000900',
      authorizationDigest: 'd'.repeat(64),
      authorizedAt: '2026-09-29T00:00:00.000Z',
    },
    invocationRefs,
    reviewContinuation: null,
    responsibilityMappings: [{
      referenceResponsibilityRef: 'reference-responsibility-000001',
      proposalResponsibilityId: 'responsibility-000001',
    }],
    downstream: {
      status: 'SHADOW_AUTHORING_VERIFIED',
      runRef: 'preschool-pver-20260922231805-71297571',
      newEntryCount: 1,
      changedFiles: ['src/data/lines/preschool-passive-spine.json'],
      promotionPackagePath: '/tmp/synthetic-promotion-package.json',
      promotionPatchPath: '/tmp/synthetic-promotion.patch',
      liveRepositoryFingerprintBefore: 'b'.repeat(64),
      liveRepositoryFingerprintAfter: 'b'.repeat(64),
    },
  });
  assert.deepEqual(result, {
    schemaVersion: 'preschool-reference-trial-result-v3',
    status: 'SHADOW_AUTHORING_VERIFIED',
    validationLayer: 'HISTORICAL_CONTROLLED_DOWNSTREAM_MECHANISM',
    responsibilityProvenance: 'HUMAN_APPROVED_REFERENCE_RESPONSIBILITIES',
    referenceResponsibilityBriefRef: 'source/reference-trial/reference-responsibility-brief.json',
    referenceResponsibilityBriefSha256: PRESCHOOL_REFERENCE_TRIAL_ACCEPTED_RESPONSIBILITY_BRIEF_SHA256,
    referenceResponsibilityAttestationRef: 'source/reference-trial/reference-responsibility-attestation.json',
    responsibilityMappings: [{ referenceResponsibilityRef: 'reference-responsibility-000001', proposalResponsibilityId: 'responsibility-000001' }],
    runRef: 'preschool-pver-20260922231805-71297571',
    attemptRef: 'attempt-000900',
    attemptManifestRef: 'artifacts/evolution/autonomous-authoring/reference-trials/preschool-pver-20260922231805-71297571/attempts/attempt-000900/attempt-manifest.json',
    executionAuthorization: {
      authorizationRef: 'human-authorization-000900',
      authorizationDigest: 'd'.repeat(64),
      authorizedAt: '2026-09-29T00:00:00.000Z',
    },
    invocationRefs,
    reviewContinuation: null,
    newEntryCount: 1,
    changedFiles: ['src/data/lines/preschool-passive-spine.json'],
    promotionPackagePath: '/tmp/synthetic-promotion-package.json',
    promotionPatchPath: '/tmp/synthetic-promotion.patch',
    liveRepositoryFingerprintBefore: 'b'.repeat(64),
    liveRepositoryFingerprintAfter: 'b'.repeat(64),
  });
}

type SyntheticLayerAScenario =
  | 'success'
  | 'reviewer-request-more-work-continuation'
  | 'reviewer-second-request-more-work-terminal'
  | 'revision-insufficient-evidence-terminal'
  | 'revision-escalate-terminal'
  | 'revision-participant-failure'
  | 'rereview-participant-failure'
  | 'continuation-create-only-collision'
  | 'continuation-authorization-drift'
  | 'continuation-history-drift'
  | 'revision-prompt-contamination'
  | 'reviewer-reject'
  | 'reviewer-defer'
  | 'omitted-responsibility'
  | 'reviewer-contract-escalation'
  | 'unauthorized-shadow-path'
  | 'residual-v5-deficit'
  | 'participant-failure'
  | 'reviewer-process-failure'
  | 'shadow-participant-failure'
  | 'artifact-backed-role-schema-failure'
  | 'artifact-backed-receipt-failure'
  | 'solution-id-prefix-collision'
  | 'solution-exact-answer-id'
  | 'reviewer-static-answer-marker'
  | 'reviewer-schema-correction'
  | 'shadow-schema-correction'
  | 'reviewer-continuation-answer-marker'
  | 'reviewer-role-crossover'
  | 'shadow-role-crossover'
  | 'reviewer-initial-fragment-missing'
  | 'reviewer-initial-fragment-duplicated'
  | 'reviewer-initial-fragment-misplaced'
  | 'shadow-initial-fragment-missing'
  | 'shadow-initial-fragment-duplicated'
  | 'shadow-initial-fragment-misplaced'
  | 'binding-drift-at-invocation'
  | 'history-drift-at-binding'
  | 'authorization-drift-after-solution'
  | 'binding-lock-drift-after-reviewer'
  | 'history-drift-after-shadow'
  | 'preparation-stale-authority'
  | 'preflight-observable-unavailable'
  | 'preflight-brief-missing'
  | 'preflight-brief-digest-mismatch'
  | 'preflight-brief-invalid-schema';

async function loadSyntheticPublicRunner(root: string, inputSha256: {
  evidence: string;
  observable: string;
  brief: string;
}, options: {
  suffix?: string;
  reviewerStaticPromptMarker?: string;
  solutionRevisionStaticPromptMarker?: string;
  continuationPromptMarker?: string;
  reviewerTrustedFragmentFault?: 'missing' | 'duplicated' | 'misplaced';
  shadowTrustedFragmentFault?: 'missing' | 'duplicated' | 'misplaced';
} = {}): Promise<typeof runPreschoolReferenceTrial> {
  const sourceRoot = join(root, `synthetic-public-runner-source${options.suffix ? `-${options.suffix}` : ''}`);
  const cloned = spawnSync('git', ['clone', '--quiet', '--shared', process.cwd(), sourceRoot], { encoding: 'utf8' });
  assert.equal(cloned.status, 0, cloned.stderr);
  const linked = spawnSync('ln', ['-s', join(process.cwd(), 'node_modules'), join(sourceRoot, 'node_modules')], { encoding: 'utf8' });
  assert.equal(linked.status, 0, linked.stderr);
  const runnerPath = 'scripts/evolution/autonomousAuthoring/runPreschoolReferenceTrial.ts';
  const shadowAuthoringPath = 'scripts/evolution/autonomousAuthoring/shadowAuthoringExecutionParticipant.ts';
  const verifierPath = 'scripts/evolution/autonomousAuthoring/verifyPreschoolShadowAuthoring.ts';
  const authorityRecognitionPath = 'scripts/evolution/autonomousAuthoring/preschoolAuthorityRecognition.ts';
  const briefPath = 'scripts/evolution/autonomousAuthoring/preschoolReferenceResponsibilityBrief.ts';
  const solutionAgentPath = 'scripts/evolution/problemAgnosticSolution/runSolutionAgent.ts';
  const reviewerPath = 'scripts/evolution/problemAgnosticSolution/runSolutionReviewer.ts';
  const structuredPath = 'scripts/evolution/problemAgnosticSolution/runStructuredParticipantExecution.ts';
  const retransmissionPath = 'scripts/evolution/problemAgnosticSolution/envelopeRetransmission.ts';
  let runnerSource = await readFile(join(process.cwd(), runnerPath), 'utf8');
  for (const [acceptedSha, fixtureSha] of [
    [PRESCHOOL_REFERENCE_TRIAL_ACCEPTED_EVIDENCE_SHA256, inputSha256.evidence],
    [PRESCHOOL_REFERENCE_TRIAL_ACCEPTED_SEALED_OBSERVABLE_PAYLOAD_SHA256, inputSha256.observable],
  ]) {
    assert.equal(runnerSource.split(acceptedSha).length, 2);
    runnerSource = runnerSource.replace(acceptedSha, fixtureSha);
  }
  await writeFile(join(sourceRoot, runnerPath), runnerSource);
  await writeFile(join(sourceRoot, verifierPath), await readFile(join(process.cwd(), verifierPath)));
  await writeFile(join(sourceRoot, authorityRecognitionPath), await readFile(join(process.cwd(), authorityRecognitionPath)));
  await writeFile(join(sourceRoot, solutionAgentPath), await readFile(join(process.cwd(), solutionAgentPath)));
  await writeFile(join(sourceRoot, reviewerPath), await readFile(join(process.cwd(), reviewerPath)));
  if (options.solutionRevisionStaticPromptMarker) {
    const solutionAgentSource = await readFile(join(sourceRoot, solutionAgentPath), 'utf8');
    const promptAnchor = "    'You are a fresh Solution Participant performing one bounded revision in a separate disposable workspace.',";
    assert.equal(solutionAgentSource.split(promptAnchor).length, 2);
    await writeFile(join(sourceRoot, solutionAgentPath), solutionAgentSource.replace(
      promptAnchor,
      `${promptAnchor}\n    ${JSON.stringify(options.solutionRevisionStaticPromptMarker)},`,
    ));
  }
  if (options.continuationPromptMarker) {
    const retransmissionPath = 'scripts/evolution/problemAgnosticSolution/envelopeRetransmission.ts';
    const retransmissionSource = await readFile(join(sourceRoot, retransmissionPath), 'utf8');
    const returnAnchor = '  return [\n';
    assert.equal(retransmissionSource.split(returnAnchor).length, 2);
    await writeFile(join(sourceRoot, retransmissionPath), retransmissionSource.replace(
      returnAnchor,
      `${returnAnchor}    ${JSON.stringify(options.continuationPromptMarker)},\n`,
    ));
  }
  let shadowAuthoringSource = await readFile(join(process.cwd(), shadowAuthoringPath), 'utf8');
  const shadowTrustedFragment = "    'Accepted Cards:',\n    canonicalJson(cards),";
  if (options.shadowTrustedFragmentFault) {
    assert.equal(shadowAuthoringSource.split(shadowTrustedFragment).length, 2);
    const replacement = options.shadowTrustedFragmentFault === 'missing'
      ? ''
      : options.shadowTrustedFragmentFault === 'duplicated'
        ? `${shadowTrustedFragment}\n    '',\n    'The only allowed write paths are exactly these three paths:',\n${shadowTrustedFragment}`
        : "    'Accepted Content:',\n    canonicalJson(cards),";
    shadowAuthoringSource = shadowAuthoringSource.replace(shadowTrustedFragment, replacement);
  }
  await writeFile(join(sourceRoot, shadowAuthoringPath), shadowAuthoringSource);
  if (options.reviewerStaticPromptMarker || options.reviewerTrustedFragmentFault) {
    const reviewerSourcePath = join(process.cwd(), reviewerPath);
    const reviewerSource = await readFile(reviewerSourcePath, 'utf8');
    let patchedReviewerSource = reviewerSource;
    if (options.reviewerStaticPromptMarker) {
      const promptAnchor = "    'Independently inspect the repository and referenced artifacts before reviewing this result.',";
      assert.equal(patchedReviewerSource.split(promptAnchor).length, 2);
      patchedReviewerSource = patchedReviewerSource.replace(
        promptAnchor,
        `${promptAnchor}\n    ${JSON.stringify(options.reviewerStaticPromptMarker)},`,
      );
    }
    const reviewerTrustedFragment = "    'Structured Solution Result:',\n    canonicalJson(solutionWork),";
    if (options.reviewerTrustedFragmentFault) {
      assert.equal(patchedReviewerSource.split(reviewerTrustedFragment).length, 2);
      const replacement = options.reviewerTrustedFragmentFault === 'missing'
        ? ''
        : options.reviewerTrustedFragmentFault === 'duplicated'
          ? `${reviewerTrustedFragment}\n${reviewerTrustedFragment}`
          : "    'Structured Solution Output:',\n    canonicalJson(solutionWork),";
      patchedReviewerSource = patchedReviewerSource.replace(reviewerTrustedFragment, replacement);
    }
    await writeFile(join(sourceRoot, reviewerPath), patchedReviewerSource);
  }
  const briefSource = await readFile(join(process.cwd(), briefPath), 'utf8');
  assert.equal(briefSource.split(PRESCHOOL_REFERENCE_TRIAL_ACCEPTED_RESPONSIBILITY_BRIEF_SHA256).length, 2);
  await writeFile(join(sourceRoot, briefPath), briefSource.replace(
    PRESCHOOL_REFERENCE_TRIAL_ACCEPTED_RESPONSIBILITY_BRIEF_SHA256,
    inputSha256.brief,
  ));
  await writeFile(join(sourceRoot, structuredPath), await readFile(join(process.cwd(), structuredPath)));
  await writeFile(join(sourceRoot, retransmissionPath), await readFile(join(process.cwd(), retransmissionPath)));
  const module = await import(pathToFileURL(join(sourceRoot, runnerPath)).href);
  return module.runPreschoolReferenceTrial as typeof runPreschoolReferenceTrial;
}

async function loadSyntheticArtifactBackedSolutionProbeRunner(root: string, inputSha256: {
  evidence: string;
  observable: string;
  brief: string;
}): Promise<{
  repositoryRoot: string;
  runProbe: typeof runPreschoolReferenceArtifactBackedSolutionCommunicationProbe;
}> {
  const suffix = 'artifact-backed-probe';
  const repositoryRoot = join(root, `synthetic-public-runner-source-${suffix}`);
  await loadSyntheticPublicRunner(root, inputSha256, { suffix });
  const runnerPath = 'scripts/evolution/autonomousAuthoring/runPreschoolReferenceTrial.ts';
  const verifierPath = 'scripts/evolution/autonomousAuthoring/verifyPreschoolShadowAuthoring.ts';
  const briefPath = 'scripts/evolution/autonomousAuthoring/preschoolReferenceResponsibilityBrief.ts';
  const authorityRecognitionPath = 'scripts/evolution/autonomousAuthoring/preschoolAuthorityRecognition.ts';
  for (const [index, path] of AUTHORITY_PATHS.entries()) {
    await writeFile(join(repositoryRoot, path), HISTORICAL_PRESCHOOL_AUTHORITY_FIXTURE[index]!);
  }
  const staged = spawnSync('git', ['-C', repositoryRoot, 'add', '--',
    runnerPath,
    verifierPath,
    briefPath,
    authorityRecognitionPath,
    'scripts/evolution/problemAgnosticSolution/runSolutionAgent.ts',
    'scripts/evolution/problemAgnosticSolution/runSolutionReviewer.ts',
    ...AUTHORITY_PATHS,
  ], { encoding: 'utf8' });
  assert.equal(staged.status, 0, staged.stderr);
  const committed = spawnSync('git', [
    '-C', repositoryRoot,
    '-c', 'user.name=Probe regression fixture',
    '-c', 'user.email=probe-regression-fixture@example.invalid',
    'commit', '--quiet', '-m', 'test: bind synthetic reference probe inputs',
  ], { encoding: 'utf8' });
  assert.equal(committed.status, 0, committed.stderr);
  const module = await import(pathToFileURL(join(repositoryRoot, runnerPath)).href);
  const runProbe: typeof runPreschoolReferenceArtifactBackedSolutionCommunicationProbe =
    module.runPreschoolReferenceArtifactBackedSolutionCommunicationProbe;
  return { repositoryRoot, runProbe };
}

async function writeProbeHistoryAttempt(repositoryRoot: string, state: 'CREATED' | 'RUNNING' | 'FAILED'): Promise<string> {
  const attemptRoot = join(repositoryRoot, REFERENCE_TRIAL_ROOT_PATH, 'attempts/attempt-000012');
  await mkdir(attemptRoot, { recursive: true });
  await writeFile(join(attemptRoot, 'attempt-manifest.json'), `${JSON.stringify({
    schemaVersion: 'preschool-reference-trial-attempt-manifest-v2',
    runRef: 'preschool-pver-20260922231805-71297571',
    attemptRef: 'attempt-000012',
    state,
  })}\n`);
  return attemptRoot;
}

async function testArtifactBackedSolutionProbeHistoryContainment(root: string, inputs: {
  evidencePath: string;
  observablePayloadPath: string;
  responsibilityBriefPath: string;
  evidenceSha256: string;
  observableSha256: string;
  responsibilityBriefSha256: string;
}): Promise<void> {
  const loaded = await loadSyntheticArtifactBackedSolutionProbeRunner(root, {
    evidence: inputs.evidenceSha256,
    observable: inputs.observableSha256,
    brief: inputs.responsibilityBriefSha256,
  });
  const trialRoot = join(loaded.repositoryRoot, REFERENCE_TRIAL_ROOT_PATH);
  const attemptRoot = await writeProbeHistoryAttempt(loaded.repositoryRoot, 'FAILED');
  const solutionStub = (onInvoke?: (input: RunSolutionAgentInput) => Promise<void>) => {
    const calls = { count: 0 };
    return {
      calls,
      dependencies: {
        resolveArtifactBackedReferenceParticipantBindingFromLock: async () => ({
          participant: { executable: 'fake-participant', buildArgs: () => [] },
        } as never),
        runSolutionAgent: async (input: RunSolutionAgentInput): Promise<SolutionAgentRunResult> => {
          calls.count += 1;
          await mkdir(input.destinationRoot, { recursive: true });
          await writeFile(join(input.destinationRoot, 'artifact-backed-validation.json'), JSON.stringify({
            schemaVersion: 'artifact-backed-validation-v1',
            receiptValidationValid: true,
            artifactIntegrityValid: true,
            artifactEnvelopeValid: true,
            roleSchemaValidationAttempted: true,
            roleSchemaValid: true,
          }));
          await writeFile(join(input.destinationRoot, 'execution-trace.json'), JSON.stringify({
            schemaVersion: 'participant-execution-trace-v1',
            invocation: { startedAt: '2026-10-02T00:00:00.000Z', timeoutMs: 1_800_000 },
            events: [{
              seq: 0,
              type: 'participant_terminal_validation',
              elapsedMs: 1,
              envelopeValid: true,
              schemaValidationAttempted: true,
              schemaValid: true,
              accepted: true,
            }],
            terminal: { outcome: 'completed', elapsedMs: 1, lastObservableActivityElapsedMs: 1 },
          }));
          await onInvoke?.(input);
          return {
            ok: true,
            result: {} as never,
            invocationPath: join(input.destinationRoot, 'invocation.json'),
            rawOutputPath: join(input.destinationRoot, 'raw-output.txt'),
            resultPath: join(input.destinationRoot, 'result.json'),
          };
        },
      },
    };
  };
  const probeInput = (probeRef: string, destinationRoot: string) => ({
    liveRepositoryRoot: loaded.repositoryRoot,
    evidencePath: inputs.evidencePath,
    observablePayloadPath: inputs.observablePayloadPath,
    responsibilityBriefPath: inputs.responsibilityBriefPath,
    probeRef,
    destinationRoot,
    participantBindingLock: TEST_SOLUTION_PARTICIPANT_BINDING_LOCK,
  });

  const terminalStub = solutionStub();
  const terminalDestination = join(root, 'artifact-backed-probe-terminal-history-output');
  const terminalResult = await loaded.runProbe(
    probeInput('terminal-history-allowed', terminalDestination),
    terminalStub.dependencies,
  );
  assert.equal(terminalStub.calls.count, 1, 'artifact-backed probe must invoke Solution exactly once');
  assert.equal(terminalResult.status, 'SUCCEEDED');
  assert.equal(terminalResult.solutionOutcome.status, 'SUCCEEDED');
  assert.equal(terminalResult.governedHistoryUnchanged, true);
  assert.equal(terminalResult.governedHistorySha256Before, terminalResult.governedHistorySha256After);
  assert.equal(terminalResult.attempt000012Absent, false);
  assert.equal(terminalResult.authoritativeFingerprintUnchanged, true);
  assert.equal(terminalResult.authoritativeFingerprintBefore, terminalResult.authoritativeFingerprintAfter);
  assert.equal(terminalResult.admissionLockAbsent, true);
  assert.equal(terminalResult.noReviewerShadowPromotion, true);
  assert.equal((await readdir(terminalDestination)).includes('probe-result.json'), true);

  for (const activeState of ['CREATED', 'RUNNING'] as const) {
    await writeProbeHistoryAttempt(loaded.repositoryRoot, activeState);
    const activeStub = solutionStub();
    await assert.rejects(
      loaded.runProbe(
        probeInput(`active-${activeState.toLowerCase()}-blocked`, join(root, `artifact-backed-probe-${activeState.toLowerCase()}-output`)),
        activeStub.dependencies,
      ),
      /Active governed attempt attempt-000012/,
    );
    assert.equal(activeStub.calls.count, 0, `${activeState} history must stop before Solution execution`);
  }
  await writeProbeHistoryAttempt(loaded.repositoryRoot, 'FAILED');

  const admissionLockPath = `${trialRoot}.admission.lock`;
  await mkdir(admissionLockPath);
  const lockedStub = solutionStub();
  try {
    await assert.rejects(
      loaded.runProbe(
        probeInput('admission-lock-blocked', join(root, 'artifact-backed-probe-admission-lock-output')),
        lockedStub.dependencies,
      ),
      /admission lock exists/,
    );
    assert.equal(lockedStub.calls.count, 0);
  } finally {
    await rm(admissionLockPath, { recursive: true, force: true });
  }

  const mutationStub = solutionStub(async () => {
    await writeFile(join(attemptRoot, 'arbitrary-history-mutation.json'), '{"changed":true}\n');
  });
  const mutationResult = await loaded.runProbe(
    probeInput('history-mutation-contained', join(root, 'artifact-backed-probe-history-mutation-output')),
    mutationStub.dependencies,
  );
  assert.equal(mutationStub.calls.count, 1, 'history-mutation probe must invoke Solution exactly once');
  assert.equal(mutationResult.status, 'CONTAINMENT_FAILURE');
  assert.equal(mutationResult.governedHistoryUnchanged, false);
  assert.notEqual(mutationResult.governedHistorySha256Before, mutationResult.governedHistorySha256After);
  assert.equal(mutationResult.authoritativeFingerprintUnchanged, true);
  assert.equal(mutationResult.admissionLockAbsent, true);
  assert.equal(mutationResult.noReviewerShadowPromotion, true);

  const lockMutationStub = solutionStub(async () => {
    await mkdir(admissionLockPath);
  });
  try {
    const lockMutationResult = await loaded.runProbe(
      probeInput('admission-lock-mutation-contained', join(root, 'artifact-backed-probe-admission-lock-mutation-output')),
      lockMutationStub.dependencies,
    );
    assert.equal(lockMutationStub.calls.count, 1, 'admission-lock mutation probe must invoke Solution exactly once');
    assert.equal(lockMutationResult.status, 'CONTAINMENT_FAILURE');
    assert.equal(lockMutationResult.governedHistoryUnchanged, true);
    assert.equal(lockMutationResult.admissionLockAbsent, false);
    assert.equal(lockMutationResult.noReviewerShadowPromotion, true);
  } finally {
    await rm(admissionLockPath, { recursive: true, force: true });
  }
}

function syntheticCapacityEvidence(): Record<string, unknown> {
  const ageFour = [
    'preschool_neutral_waiting_threshold', 'preschool_neutral_new_year_watch',
    'preschool_frontier_tent_smoke', 'preschool_frontier_wind_listen',
    'child_frontier_drill', 'preschool_neutral_kin_visit', 'toddler_neutral_season',
    'preschool_neutral_first_lie', 'preschool_neutral_night_fear',
    'toddler_frontier_wind', 'preschool_frontier_bonfire_tale', 'preschool_neutral_broken_bowl',
  ];
  const ageFive = [
    'preschool_neutral_childhood_fever', 'preschool_frontier_sentry_watch',
    'preschool_neutral_peer_repair', 'preschool_frontier_sand_veil',
    'preschool_neutral_peer_hide_and_seek', 'preschool_neutral_care_sick_family',
    'preschool_neutral_find_way_back', 'preschool_neutral_entrusted_task',
  ];
  const ageSeven = [
    'preschool_neutral_care_younger', 'preschool_frontier_horse_whinny',
    'preschool_neutral_peer_cooperation', 'preschool_neutral_speak_for_self',
    'preschool_frontier_night_patrol', 'preschool_neutral_household_disruption',
  ];
  const beats = [
    ...ageFour.map((selectedEntryId, index) => ({ age: 4, kind: 'AUTHORED', legalUnconsumedCountBeforeSelection: 14 - index, selectedEntryId })),
    ...ageFive.map((selectedEntryId, index) => ({ age: 5, kind: 'AUTHORED', legalUnconsumedCountBeforeSelection: 8 - index, selectedEntryId })),
    { age: 5, kind: 'GAP', legalUnconsumedCountBeforeSelection: 0, selectedEntryId: 'preschool_passive_gap' },
    ...ageSeven.map((selectedEntryId, index) => ({ age: 7, kind: 'AUTHORED', legalUnconsumedCountBeforeSelection: 6 - index, selectedEntryId })),
    ...Array.from({ length: 3 }, () => ({ age: 7, kind: 'GAP', legalUnconsumedCountBeforeSelection: 0, selectedEntryId: 'preschool_passive_gap' })),
  ].map((beat, index) => ({ ...beat, sequence: index + 1 }));
  return {
    schemaVersion: 'preschool-capacity-evidence-v1',
    runRef: 'preschool-pver-20260922231805-71297571',
    evidenceMode: 'STRUCTURAL_EXHAUSTION',
    canonicalOriginTag: 'frontier',
    preConsumedEntryIds: [],
    beats,
    demandBeats: 30,
    authoredBeats: 26,
    gapBeats: 4,
    foreignOriginLeakCount: 0,
    duplicateAuthoredCount: 0,
  };
}

async function assertTrustedFragmentSchemaCorrection(input: {
  outputRoot: string;
  role: 'reviewer' | 'shadowAuthoring';
  boundaryLabel: 'Structured Solution Result' | 'Accepted Cards';
  boundaryContent: unknown;
}): Promise<void> {
  const directory = input.role === 'reviewer' ? 'reviewer-agent' : 'shadow-authoring';
  const exactBoundary = `${input.boundaryLabel}:\n${canonicalJson(input.boundaryContent)}`;
  const initialPrompt = await readFile(join(input.outputRoot, directory, 'participant-prompt.txt'), 'utf8');
  assert.equal(initialPrompt.split(exactBoundary).length - 1, 1, `${input.role} initial prompt must contain its exact trusted boundary once`);

  const correctionPrompt = await readFile(
    join(input.outputRoot, directory, 'participant-envelope-retransmission-prompt-1.txt'),
    'utf8',
  );
  assert.equal(correctionPrompt.includes(`${input.boundaryLabel}:`), false, `${input.role} correction prompt must not repeat its initial trusted boundary`);

  const trace = JSON.parse(await readFile(join(input.outputRoot, directory, 'execution-trace.json'), 'utf8')) as {
    events: Array<{
      type: string;
      attempt?: number;
      schemaValid?: boolean;
      accepted?: boolean;
      failureClass?: string;
      sameThread?: boolean;
    }>;
  };
  const requests = trace.events.filter(event => event.type === 'participant_envelope_retransmission_requested');
  assert.equal(requests.length, 1, `${input.role} must request exactly one correction`);
  assert.equal(requests[0]?.failureClass, 'SCHEMA_FAILURE');
  assert.equal(requests[0]?.sameThread, true);
  assert.equal(
    trace.events.some(event => event.type === 'participant_terminal_validation' && event.attempt === 0 && event.schemaValid === false),
    true,
    `${input.role} attempt 0 must fail Role-schema validation`,
  );
  assert.equal(
    trace.events.some(event => event.type === 'process_start' && event.attempt === 1),
    true,
    `${input.role} correction must start an attempt-1 process`,
  );
  assert.equal(
    trace.events.some(event => event.type === 'participant_terminal_validation'
      && event.attempt === 1 && event.schemaValid === true && event.accepted === true),
    true,
    `${input.role} attempt 1 must pass terminal validation`,
  );
}

async function testSyntheticLayerAEndToEnd(root: string, paths: {
  evidence: string;
  observable: string;
  brief: string;
}, scenario: SyntheticLayerAScenario, runner = runPreschoolReferenceTrial, acceptedBriefFixture?: {
  brief: ReturnType<typeof validatePreschoolReferenceResponsibilityBrief>;
  bytes: Buffer;
  sha256: string;
}): Promise<void> {
  const liveRepositoryRoot = join(root, `synthetic-layer-a-${scenario}-git-clone`);
  const cloned = spawnSync('git', ['clone', '--quiet', '--shared', process.cwd(), liveRepositoryRoot], { encoding: 'utf8' });
  assert.equal(cloned.status, 0, cloned.stderr);
  for (const [index, path] of AUTHORITY_PATHS.entries()) {
    await writeFile(join(liveRepositoryRoot, path), HISTORICAL_PRESCHOOL_AUTHORITY_FIXTURE[index]!);
  }
  const nodeModules = join(process.cwd(), 'node_modules');
  const linked = spawnSync('ln', ['-s', nodeModules, join(liveRepositoryRoot, 'node_modules')], { encoding: 'utf8' });
  assert.equal(linked.status, 0, linked.stderr);
  const accepted = acceptedBriefFixture
    ? { ok: true as const, value: acceptedBriefFixture }
    : await readAcceptedPreschoolReferenceResponsibilityBrief(paths.brief);
  if (!accepted.ok) throw new Error(accepted.reason);
  const brief = accepted.value.brief;
  const ids = brief.responsibilities.map((_, index) => `preschool_neutral_synthetic_reference_${String(index + 1).padStart(2, '0')}`);
  const entries = ids.map((id, index) => ({
    id,
    title: `Synthetic reference ${index + 1}`,
    text: `Synthetic scene for supplied responsibility ${index + 1}; no historical instance answer is used.`,
    originTags: ['neutral'],
    ageMin: 4,
    ageMax: 7,
  }));
  const responsibilities = brief.responsibilities.map((item, index) => ({
    responsibilityId: `responsibility-${String(index + 1).padStart(6, '0')}`,
    primaryLifeFunction: item.primaryLifeFunction,
    playerVisibleNeed: item.playerVisibleNeed,
    evidenceRefs: [],
  }));
  const cards = responsibilities.map((item, index) => ({
    responsibilityId: item.responsibilityId,
    primaryLifeFunction: item.primaryLifeFunction,
    playerVisibleNeed: item.playerVisibleNeed,
    developmentalAgeJustification: {
      ageMin: 4,
      whyNotEarlier: 'The synthetic scenario assumes a basic shared-social understanding.',
      whyFromThisAge: 'The synthetic scenario is legible to a preschool child.',
      whyThroughAgeSeven: 'The synthetic scenario stays small and age-appropriate.',
    },
    concreteSceneConcept: `Synthetic scene ${index + 1} addressing ${item.primaryLifeFunction}.`,
    existingContentDistinction: {
      closestEntryIds: ['preschool_neutral_peer_cooperation'],
      sharedSemanticArea: 'A child interacts with familiar people.',
      specificDistinction: `The synthetic scene addresses supplied responsibility ${index + 1}.`,
    },
    actorClass: 'TRANSIENT_ROLE_ONLY',
    pastEvidenceConsumed: 'NONE',
    meaningfulPlayerDecision: 'NONE',
    durableResult: 'EVENT_HISTORY_ID_ONLY',
    futureHook: 'NONE',
    originPortability: 'No origin-specific people or setting are required.',
    scopeCheck: 'CONTRACT_PRESERVING',
    proposedEntry: entries[index],
  }));
  if (scenario === 'omitted-responsibility') {
    responsibilities.pop();
    cards.pop();
  }
  if (scenario === 'residual-v5-deficit') {
    for (const entry of entries) entry.ageMin = 7;
    for (const card of cards) card.developmentalAgeJustification.ageMin = 7;
  }
  if (scenario === 'solution-id-prefix-collision') {
    ids[0] = 'preschool_neutral_fair_play_result';
    entries[0]!.id = 'preschool_neutral_fair_play_result';
    cards[0]!.proposedEntry.id = 'preschool_neutral_fair_play_result';
  }
  if (scenario === 'shadow-schema-correction') {
    ids[0] = ANSWER_IDS[0];
    entries[0]!.id = ANSWER_IDS[0];
    cards[0]!.proposedEntry.id = ANSWER_IDS[0];
  }
  const observableRef = 'source/reference-trial/observable-payload.json';
  const briefRef = 'source/reference-trial/reference-responsibility-brief.json';
  const attestationRef = 'source/reference-trial/reference-responsibility-attestation.json';
  const catalogRef = 'src/data/lines/preschool-passive-spine.json';
  const problemId = 'problem-hypothesis-000001';
  const solution = {
    schemaVersion: 'solution-work-v1', status: 'OPTIONS', problemId,
    options: [{
      optionId: 'option-000001', proposedChange: 'Append synthetic contract-bound preschool entries.',
      rationale: 'This synthetic fixture exercises supplied responsibilities and the structural capacity gate.',
      repoRefs: [catalogRef], artifactRefs: [observableRef, briefRef], changeScope: 'program',
      expectedPlayerObservableDifference: 'Additional distinct synthetic preschool entries can be selected.',
      risks: [], unknowns: [],
      autonomousAuthoring: {
        schemaVersion: 'autonomous-authoring-proposal-v1',
        contractId: 'preschool-shared-neutral-passive-capacity-v1', contractVersion: 1,
        gapClassification: 'CONTENT_GAP', gapSubtype: 'CONTENT_CAPACITY_GAP',
        applicabilityClaim: 'APPLICABLE', authorityRefs: ['docs/governance/product-decisions.md'],
        sourceEvidenceRefs: [observableRef], responsibilities,
        contractPayload: { schemaVersion: 'preschool-shared-neutral-passive-authoring-payload-v1', cards },
      },
    }],
    recommendedOptionId: 'option-000001', summary: 'Synthetic contract-bound proposal.',
    repoRefs: [catalogRef], artifactRefs: [observableRef, briefRef],
  };
  if (scenario === 'solution-exact-answer-id') solution.summary = ANSWER_IDS[0];
  if (scenario === 'reviewer-static-answer-marker') solution.summary = ANSWER_IDS[0];
  if (scenario === 'reviewer-schema-correction') solution.summary = ANSWER_IDS[0];
  const revisedSolution = structuredClone(solution);
  revisedSolution.summary = 'Fresh bounded revision of the synthetic Solution.';
  revisedSolution.options[0]!.autonomousAuthoring.contractPayload.cards[0]!.existingContentDistinction.specificDistinction =
    'The bounded revision states a sharper life-function distinction grounded in the same supplied responsibility.';
  const revisionNonOption = {
    schemaVersion: 'solution-work-v1',
    status: scenario === 'revision-escalate-terminal' ? 'ESCALATE' : 'INSUFFICIENT_EVIDENCE',
    problemId,
    options: [],
    summary: 'The bounded revision cannot proceed without additional evidence or authority.',
    repoRefs: [catalogRef],
    artifactRefs: [observableRef, briefRef],
  };
  const schemaInvalidSolution = structuredClone(solution);
  schemaInvalidSolution.options[0]!.autonomousAuthoring.contractPayload.cards[0]!.scopeCheck =
    'The scoped changes preserve the authorized Contract.';
  const review = {
    schemaVersion: 'solution-review-v1', problemId, decision: 'ACCEPT_OPTION', acceptedOptionId: 'option-000001',
    scopeAssessment: 'code_required', executionAuthorityAssessment: 'WITHIN_CURRENT_AUTHORITY',
    autonomousAuthoringAssessment: {
      schemaVersion: 'autonomous-authoring-review-assessment-v1',
      contractId: 'preschool-shared-neutral-passive-capacity-v1', contractVersion: 1,
      applicabilityAssessment: 'APPLICABLE', conformance: 'CONFORMING', executionEnvelope: 'WITHIN_ENVELOPE',
      assessment: 'Synthetic one-to-one responsibility preservation and contract conformance.', blockers: [],
    },
    assessment: 'Synthetic Layer A review.', repoRefs: [catalogRef],
    artifactRefs: [observableRef, briefRef, attestationRef], concerns: [],
  };
  const reviewerResult = scenario === 'reviewer-reject' || scenario === 'reviewer-defer' ? {
    schemaVersion: 'solution-review-v1', problemId,
    decision: scenario === 'reviewer-reject' ? 'REJECT' : 'DEFER',
    assessment: 'Synthetic no-continuation Reviewer decision.',
    repoRefs: [catalogRef], artifactRefs: [observableRef, briefRef, attestationRef], concerns: [],
  } : scenario === 'reviewer-request-more-work-continuation'
    || scenario === 'reviewer-second-request-more-work-terminal'
    || scenario === 'continuation-create-only-collision'
    || scenario === 'continuation-authorization-drift'
    || scenario === 'continuation-history-drift'
    || scenario === 'revision-prompt-contamination'
    || scenario === 'revision-insufficient-evidence-terminal'
    || scenario === 'revision-escalate-terminal'
    || scenario === 'revision-participant-failure'
    || scenario === 'rereview-participant-failure' ? {
    schemaVersion: 'solution-review-v1', problemId, decision: 'REQUEST_MORE_WORK',
    assessment: 'A bounded local semantic revision can resolve the review concern.',
    repoRefs: [catalogRef], artifactRefs: [observableRef, briefRef, attestationRef], concerns: ['Clarify the scoped semantic distinction using the supplied context.'],
  } : scenario === 'reviewer-contract-escalation' ? {
    schemaVersion: 'solution-review-v1', problemId, decision: 'ESCALATE',
    autonomousAuthoringAssessment: {
      schemaVersion: 'autonomous-authoring-review-assessment-v1',
      contractId: 'preschool-shared-neutral-passive-capacity-v1', contractVersion: 1,
      applicabilityAssessment: 'CONTRACT_CHANGE_REQUIRED', conformance: 'NON_CONFORMING', executionEnvelope: 'WITHIN_ENVELOPE',
      assessment: 'The proposed farewell needs later recognition of the same person.',
      blockers: ['Later recognition of the same person exceeds transient-role semantics.'],
    },
    assessment: 'A durable relationship interpretation requires Human product-governance review.',
    repoRefs: [catalogRef], artifactRefs: [observableRef, briefRef, attestationRef], concerns: [],
  } : review;
  const reviewerInitialResult = scenario === 'reviewer-schema-correction' || scenario === 'reviewer-role-crossover'
    ? { ...reviewerResult, schemaVersion: 'solution-review-invalid-v1' }
    : scenario === 'reviewer-continuation-answer-marker'
      ? { ...reviewerResult, decision: ANSWER_IDS[0] }
      : reviewerResult;
  const executorResult = {
    schemaVersion: 'shadow-authoring-execution-participant-result-v1',
    status: scenario === 'shadow-schema-correction' || scenario === 'shadow-role-crossover'
      ? 'SHADOW_AUTHORING_VERIFIED'
      : 'completed',
    changedFiles: [catalogRef, 'tests/preschoolPassiveSpineTests.ts', 'tests/annualPassiveMemoryTests.ts'],
    verificationCommandsRun: [], deviations: [],
  };
  const executorScript = [
    "const fs = require('node:fs');",
    "const nodePath = require('node:path');",
    "const path = 'src/data/lines/preschool-passive-spine.json';",
    'const catalog = JSON.parse(fs.readFileSync(path, "utf8"));',
    'catalog.entries.push(...JSON.parse(process.argv[1]));',
    'fs.writeFileSync(path, JSON.stringify(catalog, null, 2) + "\\n");',
    'const ids = JSON.parse(process.argv[2]);',
    'for (const name of ["preschoolPassiveSpineTests.ts", "annualPassiveMemoryTests.ts"]) {',
    '  const block = `\\nimport { readFileSync as readSyntheticCatalog } from "node:fs";\\nif (process.argv[1]?.endsWith(\'${name}\')) {\\n  const rows = JSON.parse(readSyntheticCatalog("src/data/lines/preschool-passive-spine.json", "utf8")).entries;\\n  for (const id of ${JSON.stringify(ids)}) if (!rows.some((row) => row.id === id)) throw new Error("AUTONOMOUS_AUTHORING_MISSING_ENTRY: " + id);\\n}\\n`;',
    '  fs.appendFileSync(`tests/${name}`, block);',
    '}',
    'if (process.argv[4] === "unauthorized-shadow-path") fs.writeFileSync("docs/synthetic-shadow-unauthorized.txt", "outside allowedWritePaths");',
    'if (process.argv[4] === "history-drift-after-shadow") { fs.mkdirSync(nodePath.dirname(process.argv[5]), { recursive: true }); fs.writeFileSync(process.argv[5], "history drift after Shadow"); }',
    'process.stdout.write(process.argv[3]);',
  ].join('\n');
  const jobs: string[] = [];
  let solutionInvocationCount = 0;
  let reviewerInvocationCount = 0;
  let baseDecisionBytesAtRevision: Buffer | undefined;
  let baseSolutionWorkspaceRoot: string | undefined;
  let revisionWorkspaceRoot: string | undefined;
  let baseReviewerWorkspaceRoot: string | undefined;
  let rereviewWorkspaceRoot: string | undefined;
  let solutionBindingLockBytesAtRevision: Buffer | undefined;
  let downstreamBindingLockBytesAtRevision: Buffer | undefined;
  let artifactBackedBindingResolutionCountAtRevision: number | undefined;
  let participantBindingResolutionCountAtRevision: number | undefined;
  let continuationBuildArgsCount = 0;
  const outputRoot = join(liveRepositoryRoot, REFERENCE_TRIAL_ATTEMPTS_PATH, 'attempt-000900');
  const executionAuthorizationPath = join(root, `synthetic-layer-a-${scenario}-authorization.json`);
  const downstreamBindingLockPath = join(outputRoot, 'downstream-participant-binding-lock.json');
  const historyDriftPath = join(liveRepositoryRoot, REFERENCE_TRIAL_ROOT_PATH, 'attempts/attempt-000899/unexpected.txt');
  if (scenario === 'preparation-stale-authority') {
    await put(liveRepositoryRoot, 'docs/product/auto-evolution-model.md', '# Stale Auto Evolution authority fixture.\n');
  }
  const participant: WorkspaceAgentParticipantOptions = {
    executable: process.execPath,
    interpretCompletedOutput: ({ job, stdout, expectedThreadRef }) => {
      if (job.role === 'reviewer'
        && scenario === 'continuation-create-only-collision'
        && reviewerInvocationCount === 1) {
        const continuationRoot = join(outputRoot, 'review-continuation-000001');
        mkdirSync(continuationRoot, { recursive: true });
        writeFileSync(join(continuationRoot, 'revision-request.json'), 'pre-existing continuation evidence\n');
      }
      if (expectedThreadRef === undefined && scenario === 'reviewer-role-crossover' && job.role === 'reviewer') {
        job.role = 'configuration-execution';
      } else if (expectedThreadRef === undefined && scenario === 'shadow-role-crossover' && job.role === 'configuration-execution') {
        job.role = 'reviewer';
      }
      return {
        ok: true as const,
        rawOutput: stdout,
        threadRef: expectedThreadRef ?? { provider: 'synthetic-provider', opaqueId: job.invocationRef },
      };
    },
    sameThreadContinuation: {
      provider: 'synthetic-provider',
      buildArgs: job => {
        continuationBuildArgsCount += 1;
        if (job.role === 'reviewer') {
          return ['-e', 'process.stdout.write(process.argv[1])', JSON.stringify(reviewerResult)];
        }
        if (job.role === 'configuration-execution') {
          return ['-e', 'process.stdout.write(process.argv[1])', JSON.stringify({ ...executorResult, status: 'completed' })];
        }
        throw new Error(`Unexpected synthetic continuation role: ${job.role}`);
      },
    },
    buildArgs: job => {
      jobs.push(job.role);
      if (job.role === 'solution') {
        solutionInvocationCount += 1;
        if (solutionInvocationCount === 1) baseSolutionWorkspaceRoot = job.workspaceRoot;
        if ((scenario === 'reviewer-request-more-work-continuation'
          || scenario === 'reviewer-second-request-more-work-terminal'
          || scenario === 'revision-insufficient-evidence-terminal'
          || scenario === 'revision-escalate-terminal'
          || scenario === 'revision-participant-failure'
          || scenario === 'rereview-participant-failure'
          || scenario === 'revision-prompt-contamination'
          || scenario === 'continuation-authorization-drift'
          || scenario === 'continuation-history-drift') && solutionInvocationCount === 2) {
          revisionWorkspaceRoot = job.workspaceRoot;
          baseDecisionBytesAtRevision = readFileSync(join(outputRoot, 'decision.json'));
          solutionBindingLockBytesAtRevision = readFileSync(join(outputRoot, 'solution-participant-binding-lock.json'));
          downstreamBindingLockBytesAtRevision = readFileSync(join(outputRoot, 'downstream-participant-binding-lock.json'));
          artifactBackedBindingResolutionCountAtRevision = artifactBackedBindingResolutionCount;
          participantBindingResolutionCountAtRevision = participantBindingResolutionCount;
          assert.equal(reviewerInvocationCount, 1, 're-review must wait until after the revision result exists');
          assert.match(job.prompt, /HUMAN_APPROVED_REFERENCE_RESPONSIBILITIES/);
          assert.match(job.prompt, /Clarify the scoped semantic distinction/);
          assert.match(job.prompt, /Artifact-Backed Structured Final Result Receipt V1/);
        }
      } else if (job.role === 'reviewer') {
        reviewerInvocationCount += 1;
        if (reviewerInvocationCount === 1) baseReviewerWorkspaceRoot = job.workspaceRoot;
        if (reviewerInvocationCount === 2) rereviewWorkspaceRoot = job.workspaceRoot;
        if (scenario === 'reviewer-request-more-work-continuation' && reviewerInvocationCount === 2) {
          assert.equal(existsSync(join(outputRoot, 'review-continuation-000001/solution-revision/result.json')), true,
            'fresh Reviewer re-review must not start until the revision result is persisted');
        }
      }
      if (job.role === 'solution' && scenario === 'participant-failure') {
        return ['-e', 'process.stderr.write("synthetic Participant failure"); process.exitCode = 23'];
      }
      if (job.role === 'solution' && scenario === 'revision-participant-failure' && solutionInvocationCount === 2) {
        return ['-e', 'process.stderr.write("synthetic revision Participant failure"); process.exitCode = 23'];
      }
      if (job.role === 'reviewer' && scenario === 'reviewer-process-failure') {
        return ['-e', 'process.stderr.write("synthetic Reviewer runtime failure"); process.exitCode = 23'];
      }
      if (job.role === 'reviewer' && scenario === 'rereview-participant-failure' && reviewerInvocationCount === 2) {
        return ['-e', 'process.stderr.write("synthetic independent re-review Participant failure"); process.exitCode = 23'];
      }
      if (job.role === 'configuration-execution' && scenario === 'shadow-participant-failure') {
        return ['-e', 'process.stderr.write("synthetic Shadow Executor failure"); process.exitCode = 23'];
      }
      if (job.role === 'solution' && scenario === 'artifact-backed-role-schema-failure') {
        const bytes = JSON.stringify(schemaInvalidSolution);
        return ['-e', [
          "const fs = require('node:fs');",
          "const path = require('node:path');",
          "const crypto = require('node:crypto');",
          'const bytes = Buffer.from(process.argv[1]);',
          "const artifactPath = path.resolve('.evolution-participant/final-result.json');",
          'fs.mkdirSync(path.dirname(artifactPath), { recursive: true });',
          'fs.writeFileSync(artifactPath, bytes);',
          "process.stdout.write(JSON.stringify({ schemaVersion: 'artifact-backed-structured-final-result-receipt-v1', bytes: bytes.byteLength, sha256: crypto.createHash('sha256').update(bytes).digest('hex') }));",
        ].join('\n'), bytes];
      }
      if (job.role === 'solution' && scenario === 'artifact-backed-receipt-failure') {
        return ['-e', 'process.stdout.write("invalid structured terminal envelope")'];
      }
      if (job.role === 'solution') {
        const isRevisionInvocation = solutionInvocationCount === 2 && (
          scenario === 'reviewer-request-more-work-continuation'
          || scenario === 'reviewer-second-request-more-work-terminal'
          || scenario === 'revision-insufficient-evidence-terminal'
          || scenario === 'revision-escalate-terminal'
          || scenario === 'revision-participant-failure'
          || scenario === 'rereview-participant-failure'
          || scenario === 'revision-prompt-contamination'
          || scenario === 'continuation-authorization-drift'
          || scenario === 'continuation-history-drift'
        );
        const participantResult = isRevisionInvocation
          ? scenario === 'revision-insufficient-evidence-terminal' || scenario === 'revision-escalate-terminal'
            ? revisionNonOption : revisedSolution
          : solution;
        const bytes = JSON.stringify(participantResult);
        const args = ['-e', [
          "const fs = require('node:fs');",
          "const path = require('node:path');",
          "const crypto = require('node:crypto');",
          'const bytes = Buffer.from(process.argv[1]);',
          "const artifactPath = path.resolve('.evolution-participant/final-result.json');",
          'fs.mkdirSync(path.dirname(artifactPath), { recursive: true });',
          'fs.writeFileSync(artifactPath, bytes);',
          'if (process.argv[2] && process.argv[2] !== "-") { const authorization = JSON.parse(fs.readFileSync(process.argv[2], "utf8")); authorization.authorizationRef += "-drift"; fs.writeFileSync(process.argv[2], JSON.stringify(authorization)); }',
          'if (process.argv[3] && process.argv[3] !== "-") { fs.mkdirSync(path.dirname(process.argv[3]), { recursive: true }); fs.writeFileSync(process.argv[3], "history drift during bounded continuation"); }',
          "process.stdout.write(JSON.stringify({ schemaVersion: 'artifact-backed-structured-final-result-receipt-v1', bytes: bytes.byteLength, sha256: crypto.createHash('sha256').update(bytes).digest('hex') }));",
        ].join('\n'), bytes];
        if (scenario === 'authorization-drift-after-solution'
          || (scenario === 'continuation-authorization-drift' && solutionInvocationCount === 2)) {
          args.push(executionAuthorizationPath);
        }
        if (scenario === 'continuation-history-drift' && solutionInvocationCount === 2) {
          args.push('-', historyDriftPath);
        }
        return args;
      }
      if (job.role === 'reviewer') {
        if (scenario === 'binding-lock-drift-after-reviewer') {
          return ['-e', [
            "const fs = require('node:fs');",
            'const lock = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));',
            'lock.bindingId = `${lock.bindingId}-drift`;',
            'fs.writeFileSync(process.argv[2], JSON.stringify(lock));',
            'process.stdout.write(process.argv[1]);',
          ].join('\n'), JSON.stringify(reviewerInitialResult), downstreamBindingLockPath];
        }
        const participantReview = scenario === 'reviewer-request-more-work-continuation' && reviewerInvocationCount > 1
          ? review : reviewerInitialResult;
        return ['-e', 'process.stdout.write(process.argv[1])', JSON.stringify(participantReview)];
      }
      return ['-e', executorScript, JSON.stringify(entries), JSON.stringify(ids), JSON.stringify(executorResult), scenario, historyDriftPath];
    },
  };
  let participantBindingResolutionCount = 0;
  let artifactBackedBindingResolutionCount = 0;
  const before = await captureAuthoritativeFingerprint(liveRepositoryRoot);
  const trialRoot = join(liveRepositoryRoot, REFERENCE_TRIAL_ROOT_PATH);
  await mkdir(join(trialRoot, 'attempts'), { recursive: true });
  const acknowledgedLegacyHistory = await captureReferenceTrialLegacyHistory(trialRoot);
  const expectedExecutionAuthorizationSha256 = await writeAuthorization(executionAuthorizationPath, authorizationBody({
    acknowledgedLegacyHistory,
    attemptRef: 'attempt-000900',
    authorizationRef: `synthetic-human-authorization-${scenario}`,
  }));
  const trial = runner({
    liveRepositoryRoot,
    evidencePath: paths.evidence,
    observablePayloadPath: paths.observable,
    responsibilityBriefPath: paths.brief,
    attemptRef: 'attempt-000900',
    executionAuthorizationPath,
    expectedExecutionAuthorizationSha256,
  }, {
    resolveReferenceParticipantBindingFromLock: async ({ lock }) => {
      assert.equal(referenceParticipantBindingLockSha256(lock), TEST_PARTICIPANT_BINDING_LOCK_SHA256);
      participantBindingResolutionCount += 1;
      if (scenario === 'binding-drift-at-invocation' && participantBindingResolutionCount === 2) {
        throw new Error('synthetic Participant binding drift at BINDING');
      }
      return { participant } as never;
    },
    resolveArtifactBackedReferenceParticipantBindingFromLock: async ({ lock }) => {
      assert.equal(artifactBackedReferenceParticipantBindingLockSha256(lock), TEST_SOLUTION_PARTICIPANT_BINDING_LOCK_SHA256);
      artifactBackedBindingResolutionCount += 1;
      if (scenario === 'history-drift-at-binding' && artifactBackedBindingResolutionCount === 2) {
        await put(liveRepositoryRoot, `${REFERENCE_TRIAL_ROOT_PATH}/attempts/attempt-000899/unexpected.txt`, 'history drift during binding');
      }
      return { participant } as never;
    },
  });
  if (scenario === 'reviewer-request-more-work-continuation') {
    await assert.doesNotReject(trial, 'the first eligible Reviewer REQUEST_MORE_WORK must enter bounded continuation instead of becoming terminal');
    assert.deepEqual(jobs, ['solution', 'reviewer', 'solution', 'reviewer', 'configuration-execution']);
    assert.ok(baseDecisionBytesAtRevision, 'the create-only base Decision must exist before revision invocation');
    const baseDecisionBytes = await readFile(join(outputRoot, 'decision.json'));
    assert.deepEqual(baseDecisionBytes, baseDecisionBytesAtRevision);
    const continuationRoot = join(outputRoot, 'review-continuation-000001');
    const continuation = JSON.parse(await readFile(join(continuationRoot, 'continuation.json'), 'utf8')) as Record<string, any>;
    assert.equal(continuation.continuationOrdinal, 1);
    assert.deepEqual(continuation.baseDecision, {
      ref: 'decision.json',
      sha256: sha256Hex(baseDecisionBytes),
    });
    assert.equal(continuation.revisionStatus, 'OPTIONS');
    assert.equal(continuation.reReviewStatus, 'ACCEPT_OPTION');
    assert.equal(continuation.participantJobCount, 2);
    assert.equal(continuation.effectiveRoute, 'READY_FOR_SHADOW_AUTHORING');
    const continuationDecision = JSON.parse(await readFile(join(continuationRoot, 'decision.json'), 'utf8')) as Record<string, any>;
    assert.deepEqual(continuation.continuationDecision, {
      ref: 'review-continuation-000001/decision.json',
      sha256: sha256Hex(await readFile(join(continuationRoot, 'decision.json'))),
    });
    assert.equal(continuationDecision.route, continuation.effectiveRoute);
    const revisionBytes = await readFile(join(continuationRoot, 'solution-revision/result.json'));
    const savedRevision = JSON.parse(revisionBytes.toString('utf8')) as typeof revisedSolution;
    assert.deepEqual(savedRevision, revisedSolution);
    const revisionInvocation = JSON.parse(await readFile(join(continuationRoot, 'solution-revision/invocation.json'), 'utf8')) as Record<string, any>;
    assert.equal(revisionInvocation.jobNumber, 3);
    assert.ok(baseSolutionWorkspaceRoot && revisionWorkspaceRoot);
    assert.notEqual(revisionWorkspaceRoot, baseSolutionWorkspaceRoot, 'revision must use a fresh disposable Reference workspace');
    assert.match(revisionWorkspaceRoot, /solution-revision/);
    assert.equal(artifactBackedBindingResolutionCount, artifactBackedBindingResolutionCountAtRevision,
      'revision must reuse the admitted exact Solution binding without re-resolution');
    assert.equal(participantBindingResolutionCount, participantBindingResolutionCountAtRevision,
      're-review must reuse the admitted exact downstream binding without re-resolution');
    assert.deepEqual(
      await readFile(join(outputRoot, 'solution-participant-binding-lock.json')),
      solutionBindingLockBytesAtRevision,
    );
    assert.deepEqual(
      await readFile(join(outputRoot, 'downstream-participant-binding-lock.json')),
      downstreamBindingLockBytesAtRevision,
    );
    assert.equal(revisionInvocation.structuredResultDelivery.kind, 'WORKSPACE_ARTIFACT_RECEIPT_V1');
    const rereviewPrompt = await readFile(join(continuationRoot, 'reviewer-agent/participant-prompt.txt'), 'utf8');
    assert.ok(rereviewPrompt.includes(canonicalJson(revisedSolution)), 'fresh Reviewer must receive the revised Solution');
    assert.ok(rereviewPrompt.includes('Reference Responsibility Brief'));
    assert.ok(rereviewPrompt.includes('reference-responsibility-000001'));
    const rereviewInvocation = JSON.parse(await readFile(join(continuationRoot, 'reviewer-agent/invocation.json'), 'utf8')) as Record<string, any>;
    assert.equal(rereviewInvocation.jobNumber, 4);
    assert.notEqual(rereviewInvocation.invocationRef, JSON.parse(await readFile(join(outputRoot, 'reviewer-agent/invocation.json'), 'utf8')).invocationRef);
    assert.ok(baseReviewerWorkspaceRoot && rereviewWorkspaceRoot);
    assert.notEqual(rereviewWorkspaceRoot, baseReviewerWorkspaceRoot, 're-review must use a fresh independent Reviewer workspace');
    assert.equal(rereviewInvocation.structuredResultDelivery.kind, 'TERMINAL_JSON');
    assert.equal(await readFile(join(continuationRoot, 'solution-revision/raw-output.txt'), 'utf8').then(value => value.includes('artifact-backed-structured-final-result-receipt-v1')), true);
    const admission = JSON.parse(await readFile(join(outputRoot, 'shadow-authoring/admission.json'), 'utf8')) as Record<string, any>;
    assert.equal(
      admission.proposalSha256,
      sha256Hex(canonicalJson(revisedSolution.options[0]!.autonomousAuthoring)),
      'Admission must consume the revised Solution proposal',
    );
    assert.equal(admission.reviewSha256, sha256Hex(canonicalJson(review)), 'Admission must consume the independent re-review');
    assert.notEqual(admission.reviewSha256, sha256Hex(canonicalJson(reviewerResult)), 'Admission must not consume the base REQUEST_MORE_WORK review');
    const shadowPrompt = await readFile(join(outputRoot, 'shadow-authoring/participant-prompt.txt'), 'utf8');
    assert.ok(shadowPrompt.includes(canonicalJson(revisedSolution.options[0]!.autonomousAuthoring.contractPayload.cards)),
      'Shadow must receive Cards from the revised Solution');
    const continuationBytes = await readFile(join(continuationRoot, 'continuation.json'));
    const finalManifest = JSON.parse(await readFile(join(outputRoot, 'attempt-manifest.json'), 'utf8')) as Record<string, any>;
    const finalResult = JSON.parse(await readFile(join(outputRoot, 'trial-result.json'), 'utf8')) as Record<string, any>;
    assert.equal(finalManifest.reviewContinuation.status, 'AVAILABLE');
    assert.equal(finalManifest.reviewContinuation.sha256, sha256Hex(continuationBytes));
    assert.deepEqual(finalResult.reviewContinuation, {
      artifactRef: 'review-continuation-000001/continuation.json',
      sha256: sha256Hex(continuationBytes),
    });
    assert.equal(finalResult.invocationRefs.solution.invocationRef,
      JSON.parse(await readFile(join(outputRoot, 'solution-agent/invocation.json'), 'utf8')).invocationRef,
      'result base Solution provenance remains in its original role slot');
    assert.equal(finalResult.invocationRefs.reviewer.invocationRef,
      JSON.parse(await readFile(join(outputRoot, 'reviewer-agent/invocation.json'), 'utf8')).invocationRef,
      'result base Reviewer provenance remains in its original role slot');
    assert.equal(continuation.effectiveSolution.artifactRef, 'review-continuation-000001/solution-revision/result.json');
    assert.equal(continuation.effectiveReview.artifactRef, 'review-continuation-000001/reviewer-agent/review.json');
    return;
  }
  if (scenario === 'reviewer-second-request-more-work-terminal') {
    await assert.rejects(trial);
    assert.deepEqual(jobs, ['solution', 'reviewer', 'solution', 'reviewer']);
    assert.ok(baseDecisionBytesAtRevision);
    const baseDecisionBytes = await readFile(join(outputRoot, 'decision.json'));
    assert.deepEqual(baseDecisionBytes, baseDecisionBytesAtRevision);
    const continuationRoot = join(outputRoot, 'review-continuation-000001');
    const continuation = JSON.parse(await readFile(join(continuationRoot, 'continuation.json'), 'utf8')) as Record<string, any>;
    assert.equal(continuation.continuationOrdinal, 1);
    assert.deepEqual(continuation.baseDecision, { ref: 'decision.json', sha256: sha256Hex(baseDecisionBytes) });
    assert.equal(continuation.revisionStatus, 'OPTIONS');
    assert.equal(continuation.reReviewStatus, 'REQUEST_MORE_WORK');
    assert.equal(continuation.participantJobCount, 2);
    assert.equal(continuation.effectiveRoute, 'DEFER_MORE_WORK_REQUESTED');
    await assert.rejects(readdir(join(outputRoot, 'review-continuation-000002')),
      { code: 'ENOENT' });
    return;
  }
  if (scenario === 'revision-insufficient-evidence-terminal' || scenario === 'revision-escalate-terminal') {
    await assert.rejects(trial);
    assert.deepEqual(jobs, ['solution', 'reviewer', 'solution']);
    const continuationRoot = join(outputRoot, 'review-continuation-000001');
    const expectedRoute = scenario === 'revision-escalate-terminal' ? 'ESCALATE_HUMAN' : 'DEFER';
    const expectedRevisionStatus = scenario === 'revision-escalate-terminal' ? 'ESCALATE' : 'INSUFFICIENT_EVIDENCE';
    const continuation = JSON.parse(await readFile(join(continuationRoot, 'continuation.json'), 'utf8')) as Record<string, any>;
    assert.equal(continuation.continuationOrdinal, 1);
    assert.equal(continuation.revisionStatus, expectedRevisionStatus);
    assert.equal(continuation.reReviewStatus, 'NOT_RUN');
    assert.equal(continuation.participantJobCount, 1);
    assert.equal(continuation.effectiveRoute, expectedRoute);
    const decision = JSON.parse(await readFile(join(continuationRoot, 'decision.json'), 'utf8')) as Record<string, any>;
    assert.equal(decision.route, expectedRoute);
    await assert.rejects(readdir(join(continuationRoot, 'reviewer-agent')), { code: 'ENOENT' });
    return;
  }
  if (scenario === 'revision-participant-failure' || scenario === 'rereview-participant-failure') {
    await assert.rejects(trial);
    const expectedJobs = scenario === 'revision-participant-failure'
      ? ['solution', 'reviewer', 'solution']
      : ['solution', 'reviewer', 'solution', 'reviewer'];
    assert.deepEqual(jobs, expectedJobs);
    const continuationRoot = join(outputRoot, 'review-continuation-000001');
    const continuation = JSON.parse(await readFile(join(continuationRoot, 'continuation.json'), 'utf8')) as Record<string, any>;
    assert.equal(continuation.continuationOrdinal, 1);
    assert.equal(continuation.participantJobCount, expectedJobs.length - 2);
    assert.ok(continuation.participantFailure, `Participant failure classification must be retained in continuation provenance: ${JSON.stringify(continuation)}`);
    assert.equal(continuation.participantFailure.role, scenario === 'revision-participant-failure' ? 'solution-revision' : 'reviewer-rereview');
    assert.equal(continuation.participantFailure.errorKind, 'process');
    const failedRoleRoot = scenario === 'revision-participant-failure' ? 'solution-revision' : 'reviewer-agent';
    const failure = JSON.parse(await readFile(join(continuationRoot, failedRoleRoot, 'failure.json'), 'utf8')) as Record<string, any>;
    assert.equal(failure.schemaVersion, scenario === 'revision-participant-failure'
      ? 'solution-agent-failure-v1' : 'solution-reviewer-failure-v1');
    assert.equal(failure.errorKind, 'process');
    assert.match(failure.message, /exited with code 23/);
    const failedManifest = JSON.parse(await readFile(join(outputRoot, 'attempt-manifest.json'), 'utf8')) as Record<string, any>;
    assert.equal(failedManifest.state, 'FAILED');
    assert.equal(failedManifest.reviewContinuation.status, 'AVAILABLE', 'failure finalization must validate and retain continuation provenance');
    assert.equal(failedManifest.reviewContinuation.sha256,
      sha256Hex(await readFile(join(continuationRoot, 'continuation.json'))));
    assert.equal(failedManifest.terminalOutcome.errorKind, 'process');
    return;
  }
  if (scenario === 'reviewer-reject' || scenario === 'reviewer-defer') {
    await assert.rejects(trial);
    assert.deepEqual(jobs, ['solution', 'reviewer']);
    await assert.rejects(readdir(join(outputRoot, 'review-continuation-000001')), { code: 'ENOENT' });
    const decision = JSON.parse(await readFile(join(outputRoot, 'decision.json'), 'utf8')) as Record<string, any>;
    assert.equal(decision.inputs.reviewerDecision, scenario === 'reviewer-reject' ? 'REJECT' : 'DEFER');
    assert.equal(decision.route, scenario === 'reviewer-reject' ? 'SKIP' : 'DEFER');
    const terminalManifest = JSON.parse(await readFile(join(outputRoot, 'attempt-manifest.json'), 'utf8')) as Record<string, any>;
    assert.equal(terminalManifest.reviewContinuation, null);
    return;
  }
  if (scenario === 'continuation-create-only-collision') {
    await assert.rejects(trial);
    assert.deepEqual(jobs, ['solution', 'reviewer'], 'a continuation collision must fail before revision or downstream Participant work');
    const collidedRef = join(outputRoot, 'review-continuation-000001/revision-request.json');
    assert.equal(await readFile(collidedRef, 'utf8'), 'pre-existing continuation evidence\n');
    const baseDecision = JSON.parse(await readFile(join(outputRoot, 'decision.json'), 'utf8')) as Record<string, any>;
    assert.equal(baseDecision.route, 'DEFER_MORE_WORK_REQUESTED');
    await assert.rejects(readFile(join(outputRoot, 'review-continuation-000001/continuation.json')), { code: 'ENOENT' });
    const terminalManifest = JSON.parse(await readFile(join(outputRoot, 'attempt-manifest.json'), 'utf8')) as Record<string, any>;
    assert.equal(terminalManifest.state, 'FAILED');
    assert.equal(terminalManifest.reviewContinuation.status, 'CORRUPTED');
    assert.match(terminalManifest.reviewContinuation.diagnostic, /create-only collision/i);
    return;
  }
  if (scenario === 'continuation-authorization-drift' || scenario === 'continuation-history-drift') {
    await assert.rejects(trial);
    assert.deepEqual(jobs, ['solution', 'reviewer', 'solution'], 'drift must stop before fresh Reviewer re-review or downstream admission');
    assert.ok(baseDecisionBytesAtRevision);
    assert.deepEqual(await readFile(join(outputRoot, 'decision.json')), baseDecisionBytesAtRevision);
    const continuationRoot = join(outputRoot, 'review-continuation-000001');
    await assert.rejects(readdir(join(continuationRoot, 'reviewer-agent')), { code: 'ENOENT' });
    await assert.rejects(readdir(join(outputRoot, 'shadow-authoring')), { code: 'ENOENT' });
    const continuation = JSON.parse(await readFile(join(continuationRoot, 'continuation.json'), 'utf8')) as Record<string, any>;
    assert.equal(continuation.status, 'HOST_INTEGRITY_FAILURE', scenario);
    assert.equal(continuation.revisionStatus, 'OPTIONS');
    assert.equal(continuation.reReviewStatus, 'NOT_RUN');
    assert.equal(continuation.participantJobCount, 1);
    assert.equal(continuation.continuationDecision, null);
    assert.equal(continuation.effectiveRoute, null);
    assert.match(continuation.hostFailure.message,
      scenario === 'continuation-authorization-drift' ? /Execution authorization/ : /history changed/);
    const terminalManifest = JSON.parse(await readFile(join(outputRoot, 'attempt-manifest.json'), 'utf8')) as Record<string, any>;
    assert.equal(terminalManifest.state, 'FAILED');
    assert.equal(terminalManifest.reviewContinuation.status, 'AVAILABLE', 'failure finalization must validate drift-failure continuation evidence');
    assert.equal(terminalManifest.reviewContinuation.sha256,
      sha256Hex(await readFile(join(continuationRoot, 'continuation.json'))));
    return;
  }
  if (scenario === 'revision-prompt-contamination') {
    await assert.rejects(trial);
    assert.deepEqual(jobs, ['solution', 'reviewer'], 'contaminated revision prompt must be rejected before Participant process start');
    const continuationRoot = join(outputRoot, 'review-continuation-000001');
    const continuation = JSON.parse(await readFile(join(continuationRoot, 'continuation.json'), 'utf8')) as Record<string, any>;
    assert.equal(continuation.status, 'PARTICIPANT_FAILURE');
    assert.equal(continuation.participantJobCount, 1);
    assert.equal(continuation.participantFailure.role, 'solution-revision');
    const revisionPrompt = await readFile(join(continuationRoot, 'solution-revision/participant-prompt.txt'), 'utf8');
    assert.ok(revisionPrompt.includes(ANSWER_IDS[0]));
    const trace = JSON.parse(await readFile(join(continuationRoot, 'solution-revision/execution-trace.json'), 'utf8')) as {
      events: Array<{ type: string }>;
      terminal: { outcome: string };
    };
    assert.equal(trace.terminal.outcome, 'process_error');
    assert.equal(trace.events.some(event => event.type === 'process_start'), false,
      'the contaminated prompt must be stopped before the Participant process starts');
    await assert.rejects(readdir(join(continuationRoot, 'reviewer-agent')), { code: 'ENOENT' });
    return;
  }
  if (scenario.startsWith('preflight-')) {
    const result = await trial;
    const expectedResultStatus = scenario === 'preflight-observable-unavailable'
      ? 'REFERENCE_OBSERVABLE_PAYLOAD_UNAVAILABLE'
      : 'REFERENCE_RESPONSIBILITY_BRIEF_UNAVAILABLE';
    assert.equal(result.status, expectedResultStatus);
    if (scenario === 'preflight-observable-unavailable') {
      assert.equal(result.reason, 'Exact sealed player-visible reference payload was not supplied or did not match the accepted digest.');
    } else {
      assert.equal(result.reason, scenario === 'preflight-brief-missing'
        ? 'Reference Responsibility Brief file could not be read.'
        : scenario === 'preflight-brief-digest-mismatch'
          ? 'Reference Responsibility Brief digest did not match the accepted digest.'
          : 'Reference Responsibility Brief schema or runRef is invalid.');
    }
    assert.deepEqual(jobs, []);
    assert.equal(participantBindingResolutionCount, 1, 'only admission-time downstream binding validation may run');
    assert.equal(artifactBackedBindingResolutionCount, 1, 'only admission-time Solution binding validation may run');
    const stoppedManifest = JSON.parse(await readFile(join(outputRoot, 'attempt-manifest.json'), 'utf8')) as Record<string, any>;
    assert.equal(stoppedManifest.state, 'STOPPED');
    assert.equal(stoppedManifest.currentStage, 'PREFLIGHT');
    assert.equal(stoppedManifest.authorizationRef, `synthetic-human-authorization-${scenario}`);
    assert.equal(stoppedManifest.authorizationDigest, expectedExecutionAuthorizationSha256);
    assert.equal(stoppedManifest.expectedAuthorizationDigest, expectedExecutionAuthorizationSha256);
    assert.deepEqual(stoppedManifest.terminalOutcome, {
      status: 'REFERENCE_PREFLIGHT_STOPPED',
      stage: 'PREFLIGHT',
      resultStatus: result.status,
      failureMessage: result.reason,
      stopArtifactRef: 'attempt-stop.json',
    });
    assert.deepEqual(JSON.parse(await readFile(join(outputRoot, 'attempt-stop.json'), 'utf8')), {
      schemaVersion: 'preschool-reference-trial-attempt-stop-v1',
      result,
    });
    for (const role of ['solution', 'reviewer', 'shadowAuthoring'] as const) {
      assert.equal(stoppedManifest.participantPromptProvenance[role].status, 'NOT_INVOKED');
      assert.equal(stoppedManifest.invocationRefs[role], null);
    }
    for (const artifact of [
      'solution-agent', 'reviewer-agent', 'shadow-authoring', 'decision.json', 'verification.json',
      'trial-result.json', 'promotion-package.json', 'promotion-package.md', 'promotion.patch',
    ]) await assert.rejects(readdir(join(outputRoot, artifact)), { code: 'ENOENT' });
    assert.equal(await captureAuthoritativeFingerprint(liveRepositoryRoot), before);
    process.stdout.write(`admitted ${scenario}: STOPPED at PREFLIGHT before Participant jobs; authorization and stop provenance retained\n`);
    return;
  }
  const expectedSuccessfulScenario = scenario === 'success'
    || scenario === 'solution-id-prefix-collision'
    || scenario === 'solution-exact-answer-id'
    || scenario === 'reviewer-schema-correction'
    || scenario === 'shadow-schema-correction';
  if (!expectedSuccessfulScenario) {
    const solutionOnlyFailure = scenario === 'participant-failure'
      || scenario === 'authorization-drift-after-solution'
      || scenario === 'artifact-backed-role-schema-failure'
      || scenario === 'artifact-backed-receipt-failure';
    if (scenario === 'binding-drift-at-invocation') {
      await assert.rejects(trial, /synthetic Participant binding drift at BINDING/);
      assert.equal(participantBindingResolutionCount, 2);
    } else if (scenario === 'history-drift-at-binding') {
      await assert.rejects(trial, /Legacy attempt or run-level history changed after authorization admission/);
      assert.equal(artifactBackedBindingResolutionCount, 2);
    } else if (solutionOnlyFailure) {
      if (scenario === 'authorization-drift-after-solution') {
        await assert.rejects(trial, /Execution authorization identity, schema, role-specific binding-lock digest, timestamp, or canonical digest is invalid/);
      } else {
        await assert.rejects(trial, /Solution Participant failed/);
      }
    } else if (scenario === 'reviewer-process-failure') {
      await assert.rejects(trial, /Reviewer Participant failed/);
    } else if (scenario === 'binding-lock-drift-after-reviewer') {
      await assert.rejects(trial, /Persisted role-specific Participant binding lock changed after attempt admission/);
    } else if (scenario === 'history-drift-after-shadow') {
      await assert.rejects(trial, /Legacy attempt or run-level history changed after authorization admission/);
    } else if (scenario === 'preparation-stale-authority') {
      await assert.rejects(trial, /Current PD-121 authority overlay is incomplete or stale/);
    } else if (scenario === 'reviewer-static-answer-marker') {
      await assert.rejects(trial, /Participant-visible contamination detected in prompt: preschool_neutral_fair_play/);
    } else if (scenario === 'reviewer-continuation-answer-marker') {
      await assert.rejects(trial, /Participant-visible contamination detected in prompt: preschool_neutral_fair_play/);
      assert.equal(continuationBuildArgsCount, 0, 'contaminated trusted-fragment continuation must not invoke its underlying buildArgs');
    } else if (scenario.startsWith('reviewer-initial-fragment-') || scenario.startsWith('shadow-initial-fragment-')) {
      await assert.rejects(trial, /Verified current-run output is not present exactly once at its expected prompt boundary\./);
      assert.equal(continuationBuildArgsCount, 0);
    } else if (scenario === 'reviewer-role-crossover' || scenario === 'shadow-role-crossover') {
      await assert.rejects(trial, /Verified current-run output cannot be applied to a different Participant role\./);
      assert.equal(continuationBuildArgsCount, 0, 'role-crossover continuation must not invoke its underlying buildArgs');
    } else if (scenario === 'omitted-responsibility') {
      await assert.rejects(trial);
    } else if (scenario === 'reviewer-contract-escalation') {
      await assert.rejects(trial);
    } else if (scenario === 'shadow-participant-failure') {
      await assert.rejects(trial, /Shadow Executor failed:/);
    } else {
      await assert.rejects(trial, scenario === 'unauthorized-shadow-path'
        ? /Shadow workspace changed paths outside the Contract/
        : /Structural capacity deficit must decrease from a positive value to zero/);
    }
    assert.deepEqual(jobs, scenario === 'binding-drift-at-invocation'
      || scenario === 'history-drift-at-binding'
      || scenario === 'preparation-stale-authority'
      ? []
      : solutionOnlyFailure || scenario === 'reviewer-static-answer-marker'
      ? ['solution']
      : scenario.startsWith('reviewer-initial-fragment-')
        ? ['solution']
      : scenario === 'reviewer-process-failure' || scenario === 'binding-lock-drift-after-reviewer'
        ? ['solution', 'reviewer']
      : scenario === 'omitted-responsibility' || scenario === 'reviewer-contract-escalation'
        ? ['solution', 'reviewer']
        : scenario === 'reviewer-continuation-answer-marker' || scenario === 'reviewer-role-crossover'
          ? ['solution', 'reviewer']
        : scenario.startsWith('shadow-initial-fragment-')
          ? ['solution', 'reviewer']
        : scenario === 'shadow-role-crossover'
          ? ['solution', 'reviewer', 'configuration-execution']
        : ['solution', 'reviewer', 'configuration-execution']);
    const failedManifest = JSON.parse(await readFile(join(outputRoot, 'attempt-manifest.json'), 'utf8')) as Record<string, any>;
    assert.equal(failedManifest.state, 'FAILED');
    if (scenario === 'binding-drift-at-invocation' || scenario === 'history-drift-at-binding') {
      assert.equal(failedManifest.currentStage, 'BINDING');
      assert.equal(failedManifest.terminalOutcome.status, 'FAILED');
      assert.equal(failedManifest.terminalOutcome.errorKind, 'RUNTIME_EXCEPTION');
    }
    if (scenario === 'participant-failure') {
      assert.equal(failedManifest.currentStage, 'SOLUTION');
      assert.equal(failedManifest.terminalOutcome.status, 'FAILED');
      assert.equal(failedManifest.terminalOutcome.errorKind, 'process');
      assert.equal(failedManifest.terminalOutcome.failureArtifactRef, 'solution-agent/failure.json');
      await assert.rejects(readFile(join(outputRoot, 'verification.json')), { code: 'ENOENT' });
    } else if (scenario === 'authorization-drift-after-solution') {
      assert.equal(failedManifest.currentStage, 'SOLUTION');
      assert.equal(failedManifest.terminalOutcome.status, 'FAILED');
      assert.equal(failedManifest.terminalOutcome.errorKind, 'RUNTIME_EXCEPTION');
      assert.match(failedManifest.terminalOutcome.failureMessage, /Execution authorization identity, schema, role-specific binding-lock digest, timestamp, or canonical digest is invalid/);
    } else if (scenario === 'reviewer-process-failure') {
      assert.equal(failedManifest.currentStage, 'REVIEWER');
      assert.equal(failedManifest.terminalOutcome.status, 'FAILED');
      assert.equal(failedManifest.terminalOutcome.errorKind, 'process');
      assert.equal(failedManifest.terminalOutcome.failureArtifactRef, 'reviewer-agent/failure.json');
      const failure = JSON.parse(await readFile(join(outputRoot, 'reviewer-agent/failure.json'), 'utf8')) as Record<string, unknown>;
      assert.equal(failure.errorKind, 'process');
      await readFile(join(outputRoot, 'reviewer-agent/execution-trace.json'));
      await assert.rejects(readFile(join(outputRoot, 'reviewer-agent/review.json')), { code: 'ENOENT' });
    } else if (scenario === 'binding-lock-drift-after-reviewer') {
      assert.equal(failedManifest.currentStage, 'REVIEWER');
      assert.equal(failedManifest.terminalOutcome.status, 'FAILED');
      assert.equal(failedManifest.terminalOutcome.errorKind, 'RUNTIME_EXCEPTION');
      assert.match(failedManifest.terminalOutcome.failureMessage, /Persisted role-specific Participant binding lock changed after attempt admission/);
    } else if (scenario === 'history-drift-after-shadow') {
      assert.equal(failedManifest.currentStage, 'SHADOW_AUTHORING');
      assert.equal(failedManifest.terminalOutcome.status, 'FAILED');
      assert.equal(failedManifest.terminalOutcome.errorKind, 'RUNTIME_EXCEPTION');
      assert.match(failedManifest.terminalOutcome.failureMessage, /Legacy attempt or run-level history changed after authorization admission/);
    } else if (scenario === 'preparation-stale-authority') {
      assert.equal(failedManifest.currentStage, 'PREPARATION');
      assert.equal(failedManifest.terminalOutcome.status, 'FAILED');
      assert.equal(failedManifest.terminalOutcome.errorKind, 'RUNTIME_EXCEPTION');
      assert.match(failedManifest.terminalOutcome.failureMessage, /Current PD-121 authority overlay is incomplete or stale/);
    } else if (scenario === 'artifact-backed-role-schema-failure' || scenario === 'artifact-backed-receipt-failure') {
      assert.equal(failedManifest.currentStage, 'SOLUTION');
    }
    if (scenario === 'shadow-participant-failure') {
      assert.equal(failedManifest.currentStage, 'SHADOW_AUTHORING');
      assert.equal(failedManifest.terminalOutcome.status, 'SHADOW_AUTHORING_EXECUTION_FAILED');
      assert.equal(failedManifest.terminalOutcome.failureArtifactRef, 'shadow-authoring/execution-trace.json');
    } else if (scenario === 'unauthorized-shadow-path') {
      assert.equal(failedManifest.currentStage, 'VERIFICATION');
      assert.equal(failedManifest.terminalOutcome.status, 'SHADOW_AUTHORING_CONFORMANCE_FAILED');
      assert.equal(failedManifest.terminalOutcome.failureArtifactRef, 'verification.json');
    } else if (scenario === 'residual-v5-deficit') {
      assert.equal(failedManifest.currentStage, 'VERIFICATION');
      assert.equal(failedManifest.terminalOutcome.status, 'SHADOW_AUTHORING_VERIFICATION_FAILED');
      assert.equal(failedManifest.terminalOutcome.failureArtifactRef, 'verification.json');
    }
    const invokedPromptRoles = scenario === 'binding-drift-at-invocation'
      || scenario === 'history-drift-at-binding'
      || scenario === 'preparation-stale-authority'
      ? [] as const
      : solutionOnlyFailure
      ? ['solution'] as const
      : scenario === 'reviewer-process-failure' || scenario === 'binding-lock-drift-after-reviewer'
        ? ['solution', 'reviewer'] as const
      : scenario === 'reviewer-static-answer-marker'
        ? ['solution', 'reviewer'] as const
      : scenario.startsWith('reviewer-initial-fragment-')
        ? ['solution', 'reviewer'] as const
      : scenario === 'omitted-responsibility' || scenario === 'reviewer-contract-escalation'
        ? ['solution', 'reviewer'] as const
      : scenario === 'reviewer-continuation-answer-marker' || scenario === 'reviewer-role-crossover'
        ? ['solution', 'reviewer'] as const
        : ['solution', 'reviewer', 'shadowAuthoring'] as const;
    await assertParticipantPromptProvenanceMatchesDisk(outputRoot, failedManifest, [...invokedPromptRoles]);
    if (scenario === 'artifact-backed-role-schema-failure') {
      const validation = JSON.parse(await readFile(join(outputRoot, 'solution-agent/artifact-backed-validation.json'), 'utf8')) as Record<string, any>;
      assert.equal(validation.receiptValidationValid, true);
      assert.equal(validation.artifactIntegrityValid, true);
      assert.equal(validation.artifactEnvelopeValid, true);
      assert.equal(validation.roleSchemaValidationAttempted, true);
      assert.equal(validation.roleSchemaValid, false);
      assert.equal(validation.earliestFailureBoundary, 'ROLE_SCHEMA');
      const trace = JSON.parse(await readFile(join(outputRoot, 'solution-agent/execution-trace.json'), 'utf8')) as { events: Array<{ type: string }> };
      assert.equal(trace.events.some(event => event.type === 'participant_envelope_retransmission_requested'), false);
      await assert.rejects(readFile(join(outputRoot, 'reviewer-agent/invocation.json')), { code: 'ENOENT' });
    }
    for (const role of ['solution', 'reviewer', 'shadowAuthoring'] as const) {
      if (!invokedPromptRoles.includes(role)) assert.equal(failedManifest.participantPromptProvenance[role].status, 'NOT_INVOKED');
    }
    await assert.rejects(readFile(join(outputRoot, 'trial-result.json')), { code: 'ENOENT' });
    await assert.rejects(readFile(join(outputRoot, 'promotion-package.json')), { code: 'ENOENT' });
    await assert.rejects(readFile(join(outputRoot, 'promotion-package.md')), { code: 'ENOENT' });
    await assert.rejects(readFile(join(outputRoot, 'promotion.patch')), { code: 'ENOENT' });
    if (scenario === 'authorization-drift-after-solution'
      || scenario === 'reviewer-process-failure'
      || scenario === 'binding-lock-drift-after-reviewer'
      || scenario === 'history-drift-after-shadow'
      || scenario === 'preparation-stale-authority') {
      if (scenario === 'history-drift-after-shadow') {
        const decision = JSON.parse(await readFile(join(outputRoot, 'decision.json'), 'utf8')) as { route: string };
        assert.equal(decision.route, 'READY_FOR_SHADOW_AUTHORING');
      } else {
        await assert.rejects(readFile(join(outputRoot, 'decision.json')), { code: 'ENOENT' });
      }
      await assert.rejects(readFile(join(outputRoot, 'verification.json')), { code: 'ENOENT' });
    }
    if (scenario === 'unauthorized-shadow-path' || scenario === 'residual-v5-deficit') {
      const verification = JSON.parse(await readFile(join(outputRoot, 'verification.json'), 'utf8')) as Record<string, any>;
      await assertShadowExecutionEvidenceRetained(outputRoot, failedManifest, verification);
      assert.equal(verification.patchSha256, null);
      assert.equal(verification.promotionPatch, null);
    }
    if (scenario === 'unauthorized-shadow-path') {
      const verification = JSON.parse(await readFile(join(outputRoot, 'verification.json'), 'utf8')) as Record<string, any>;
      assert.equal(verification.status, 'SHADOW_AUTHORING_VERIFICATION_FAILED');
      assert.equal(verification.checks.mechanicalConformance, 'FAIL');
      assert.match(verification.failures.join(' '), /outside the Contract.*docs\/synthetic-shadow-unauthorized\.txt/);
    } else if (scenario === 'residual-v5-deficit') {
      const verification = JSON.parse(await readFile(join(outputRoot, 'verification.json'), 'utf8')) as Record<string, any>;
      assert.equal(verification.checks.evidenceBoundedCompletion, 'FAIL');
      assert.match(verification.failures.join(' '), /Structural capacity deficit must decrease from a positive value to zero/);
    }
    if (scenario === 'reviewer-continuation-answer-marker') {
      const correctionPrompt = await readFile(join(outputRoot, 'reviewer-agent/participant-envelope-retransmission-prompt-1.txt'), 'utf8');
      assert.match(correctionPrompt, /preschool_neutral_fair_play/);
      const trace = JSON.parse(await readFile(join(outputRoot, 'reviewer-agent/execution-trace.json'), 'utf8')) as {
        events: Array<{ type: string; attempt?: number; failureClass?: string; sameThread?: boolean }>;
      };
      assert.equal(trace.events.filter(event => event.type === 'participant_envelope_retransmission_requested').length, 1);
      assert.equal(trace.events.some(event => event.type === 'process_start' && event.attempt === 1), false);
    }
    if (scenario === 'reviewer-role-crossover' || scenario === 'shadow-role-crossover') {
      const role = scenario === 'reviewer-role-crossover' ? 'reviewer-agent' : 'shadow-authoring';
      const trace = JSON.parse(await readFile(join(outputRoot, role, 'execution-trace.json'), 'utf8')) as {
        events: Array<{ type: string; attempt?: number; failureClass?: string; sameThread?: boolean }>;
      };
      const requests = trace.events.filter(event => event.type === 'participant_envelope_retransmission_requested');
      assert.equal(requests.length, 1);
      assert.equal(requests[0]?.failureClass, 'SCHEMA_FAILURE');
      assert.equal(requests[0]?.sameThread, true);
      assert.equal(trace.events.some(event => event.type === 'process_start' && event.attempt === 1), false);
    }
    if (scenario === 'omitted-responsibility') {
      const submittedSolution = JSON.parse(await readFile(join(outputRoot, 'solution-agent/result.json'), 'utf8')) as typeof solution;
      const submittedBrief = JSON.parse(await readFile(join(outputRoot, 'source/reference-trial/reference-responsibility-brief.json'), 'utf8')) as typeof brief;
      assert.equal(submittedSolution.options[0]!.autonomousAuthoring.responsibilities.length, 4);
      assert.equal(submittedBrief.responsibilities.length, 5);
      const decision = JSON.parse(await readFile(join(outputRoot, 'decision.json'), 'utf8')) as Record<string, any>;
      assert.equal(decision.route, 'DEFER');
      assert.equal(decision.reasonCode, 'AUTONOMOUS_AUTHORING_INSUFFICIENT_EVIDENCE');
      assert.equal(failedManifest.terminalOutcome.errorKind, 'ROUTED_DECISION');
      assert.equal(failedManifest.terminalOutcome.failureArtifactRef, 'decision.json');
      await assert.rejects(readdir(join(outputRoot, 'shadow-authoring')), { code: 'ENOENT' });
    } else if (scenario === 'reviewer-contract-escalation') {
      const reviewerArtifact = JSON.parse(await readFile(join(outputRoot, 'reviewer-agent/review.json'), 'utf8')) as Record<string, any>;
      assert.equal(reviewerArtifact.decision, 'ESCALATE');
      assert.equal(reviewerArtifact.autonomousAuthoringAssessment.applicabilityAssessment, 'CONTRACT_CHANGE_REQUIRED');
      assert.equal(reviewerArtifact.autonomousAuthoringAssessment.conformance, 'NON_CONFORMING');
      const decision = JSON.parse(await readFile(join(outputRoot, 'decision.json'), 'utf8')) as Record<string, any>;
      assert.equal(decision.route, 'ESCALATE_HUMAN');
      assert.equal(decision.reasonCode, 'EXPLICIT_ESCALATION');
      assert.equal(failedManifest.terminalOutcome.errorKind, 'ROUTED_DECISION');
      assert.equal(failedManifest.terminalOutcome.failureArtifactRef, 'decision.json');
      await assert.rejects(readdir(join(outputRoot, 'shadow-authoring')), { code: 'ENOENT' });
    } else if (scenario !== 'artifact-backed-receipt-failure'
      && scenario !== 'artifact-backed-role-schema-failure'
      && scenario !== 'participant-failure'
      && scenario !== 'reviewer-static-answer-marker'
      && scenario !== 'reviewer-continuation-answer-marker'
      && scenario !== 'reviewer-role-crossover'
      && !scenario.startsWith('reviewer-initial-fragment-')
      && scenario !== 'binding-drift-at-invocation'
      && scenario !== 'history-drift-at-binding'
      && scenario !== 'reviewer-process-failure'
      && scenario !== 'authorization-drift-after-solution'
      && scenario !== 'binding-lock-drift-after-reviewer'
      && scenario !== 'history-drift-after-shadow'
      && scenario !== 'preparation-stale-authority') {
      const decision = JSON.parse(await readFile(join(outputRoot, 'decision.json'), 'utf8')) as { route: string };
      assert.equal(decision.route, 'READY_FOR_SHADOW_AUTHORING');
    }
    const after = await captureAuthoritativeFingerprint(liveRepositoryRoot);
    assert.equal(after, before);
    process.stdout.write(scenario === 'omitted-responsibility'
      ? `historical routed outcome omitted-responsibility: PASS — route=DEFER / AUTONOMOUS_AUTHORING_INSUFFICIENT_EVIDENCE; proposal=4, brief=5; authoritative fingerprint before=${before} after=${after}\n`
      : scenario === 'reviewer-contract-escalation'
        ? 'historical routed outcome reviewer-contract-escalation: PASS — route=ESCALATE_HUMAN / EXPLICIT_ESCALATION; no Shadow or promotion\n'
      : scenario === 'artifact-backed-role-schema-failure'
        ? 'synthetic Artifact-Backed Solution Role-schema failure before Reviewer: PASS\n'
        : `historical integration negative ${scenario}: PASS\n`);
    return;
  }
  const result = await trial;
  assert.equal(result.status, 'SHADOW_AUTHORING_VERIFIED');
  if (result.status !== 'SHADOW_AUTHORING_VERIFIED') throw new Error('synthetic Layer A did not verify');
  assert.equal(result.validationLayer, 'HISTORICAL_CONTROLLED_DOWNSTREAM_MECHANISM');
  assert.equal(result.responsibilityProvenance, 'HUMAN_APPROVED_REFERENCE_RESPONSIBILITIES');
  assert.equal(result.referenceResponsibilityBriefSha256, accepted.value.sha256);
  assert.equal(result.responsibilityMappings.length, brief.responsibilities.length);
  assert.equal(result.newEntryCount, brief.responsibilities.length);
  const succeededManifest = JSON.parse(await readFile(join(outputRoot, 'attempt-manifest.json'), 'utf8')) as Record<string, any>;
  assert.equal(succeededManifest.state, 'SUCCEEDED');
  assert.equal(succeededManifest.schemaVersion, 'preschool-reference-trial-attempt-manifest-v3');
  assert.equal(succeededManifest.terminalOutcome.trialResultRef, 'trial-result.json');
  const verification = JSON.parse(await readFile(join(outputRoot, 'verification.json'), 'utf8')) as Record<string, any>;
  const shadowExecutionPatch = await assertShadowExecutionEvidenceRetained(outputRoot, succeededManifest, verification);
  assert.equal(verification.schemaVersion, 'preschool-reference-trial-shadow-verification-v1');
  assert.deepEqual(Object.keys(verification).sort(), [
    'schemaVersion', 'status', 'checks', 'failures', 'candidateBaselineGitSha',
    'candidateBaselineFingerprintSha256', 'acceptedProposalSha256', 'acceptedReviewSha256',
    'admissionSha256', 'authoritativeFingerprintBefore', 'authoritativeFingerprintAfter',
    'changedFiles', 'commandResults', 'capacityBefore', 'capacityAfter', 'patchSha256', 'promotionPatch',
  ].sort());
  assert.equal(verification.status, 'SHADOW_AUTHORING_VERIFIED');
  if (scenario === 'reviewer-schema-correction') {
    assert.equal(continuationBuildArgsCount, 1);
    assert.equal(canonicalJson(solution).includes(ANSWER_IDS[0]), true);
    await assertTrustedFragmentSchemaCorrection({
      outputRoot,
      role: 'reviewer',
      boundaryLabel: 'Structured Solution Result',
      boundaryContent: solution,
    });
  } else if (scenario === 'shadow-schema-correction') {
    assert.equal(continuationBuildArgsCount, 1);
    await assertTrustedFragmentSchemaCorrection({
      outputRoot,
      role: 'shadowAuthoring',
      boundaryLabel: 'Accepted Cards',
      boundaryContent: cards,
    });
  } else {
    assert.equal(continuationBuildArgsCount, 0);
  }
  assert.ok(Object.values(verification.checks).every(check => check === 'PASS'));
  assert.deepEqual(Object.keys(verification.promotionPatch).sort(), ['byteLength', 'sha256']);
  assert.ok(verification.promotionPatch.byteLength > 0);
  assert.equal(verification.promotionPatch.sha256, verification.patchSha256);
  assert.equal(succeededManifest.artifactRefs.shadowVerification, 'verification.json');
  const artifactBackedValidation = JSON.parse(
    await readFile(join(outputRoot, 'solution-agent/artifact-backed-validation.json'), 'utf8'),
  ) as Record<string, unknown>;
  assert.equal(artifactBackedValidation.schemaVersion, 'artifact-backed-validation-v1');
  assert.equal(artifactBackedValidation.receiptValidationValid, true);
  assert.equal(artifactBackedValidation.artifactIntegrityValid, true);
  assert.equal(artifactBackedValidation.artifactEnvelopeValid, true);
  assert.equal(artifactBackedValidation.roleSchemaValidationAttempted, true);
  assert.equal(artifactBackedValidation.roleSchemaValid, true);
  assert.equal(artifactBackedValidation.accepted, true);
  assert.equal(succeededManifest.roleSpecificParticipantBindings.solution.transport, 'WORKSPACE_ARTIFACT_RECEIPT_V1');
  assert.equal(succeededManifest.roleSpecificParticipantBindings.downstream.transport, 'TERMINAL_JSON');
  assert.equal(
    succeededManifest.roleSpecificParticipantBindings.solution.lockSha256,
    TEST_SOLUTION_PARTICIPANT_BINDING_LOCK_SHA256,
  );
  assert.equal(
    succeededManifest.roleSpecificParticipantBindings.downstream.lockSha256,
    TEST_PARTICIPANT_BINDING_LOCK_SHA256,
  );
  const solutionTransportArtifacts = succeededManifest.artifactRefs as Record<string, string>;
  assert.equal(solutionTransportArtifacts.solutionArtifactBackedValidation, 'solution-agent/artifact-backed-validation.json');
  assert.equal(solutionTransportArtifacts.solutionStructuredResultArtifact, 'solution-agent/structured-result-artifact.raw.json');
  assert.equal(solutionTransportArtifacts.solutionTerminalReceiptRawOutput, 'solution-agent/raw-output.txt');
  assert.equal(solutionTransportArtifacts.solutionValidatedResult, 'solution-agent/result.json');
  assert.deepEqual(
    await readFile(join(outputRoot, 'solution-agent/structured-result-artifact.raw.json')),
    Buffer.from(JSON.stringify(solution)),
  );
  const receipt = JSON.parse(await readFile(join(outputRoot, 'solution-agent/raw-output.txt'), 'utf8')) as Record<string, unknown>;
  assert.equal(receipt.schemaVersion, 'artifact-backed-structured-final-result-receipt-v1');
  await readFile(join(outputRoot, 'solution-agent/invocation.json'));
  await readFile(join(outputRoot, 'solution-agent/execution-trace.json'));
  const validatedSolution = JSON.parse(await readFile(join(outputRoot, 'solution-agent/result.json'), 'utf8'));
  assert.deepEqual(validatedSolution, solution);
  const solutionTrace = JSON.parse(await readFile(join(outputRoot, 'solution-agent/execution-trace.json'), 'utf8')) as {
    events: Array<{ type: string }>;
  };
  assert.equal(solutionTrace.events.some(event => event.type === 'participant_envelope_retransmission_requested'), false);
  const reviewerPrompt = await readFile(join(outputRoot, 'reviewer-agent/participant-prompt.txt'), 'utf8');
  assert.equal(reviewerPrompt.includes(canonicalJson(solution)), true);
  assert.doesNotMatch(reviewerPrompt, /WORKSPACE_ARTIFACT_RECEIPT_V1|Artifact-Backed Receipt/i);
  const shadowPrompt = await readFile(join(outputRoot, 'shadow-authoring/participant-prompt.txt'), 'utf8');
  assert.doesNotMatch(shadowPrompt, /WORKSPACE_ARTIFACT_RECEIPT_V1|Artifact-Backed Receipt/i);
  assert.equal(result.schemaVersion, 'preschool-reference-trial-result-v3');
  const savedResult = JSON.parse(await readFile(join(outputRoot, 'trial-result.json'), 'utf8')) as Record<string, any>;
  assert.equal(savedResult.schemaVersion, 'preschool-reference-trial-result-v3');
  assert.equal(savedResult.reviewContinuation, null);
  assert.equal(savedResult.status, 'SHADOW_AUTHORING_VERIFIED');
  assert.equal(savedResult.attemptRef, succeededManifest.attemptRef);
  assert.equal(savedResult.executionAuthorization.authorizationDigest, succeededManifest.authorizationDigest);
  assert.deepEqual(savedResult.invocationRefs, succeededManifest.invocationRefs);
  await assertParticipantPromptProvenanceMatchesDisk(outputRoot, succeededManifest, ['solution', 'reviewer', 'shadowAuthoring']);
  assert.deepEqual(jobs, ['solution', 'reviewer', 'configuration-execution']);
  assert.equal(await captureAuthoritativeFingerprint(liveRepositoryRoot), before);
  const packageJson = JSON.parse(await readFile(result.promotionPackagePath, 'utf8')) as { schemaVersion: string; authoritativeRepositoryUnchanged: boolean; naturalPverPerformed: boolean };
  assert.equal(packageJson.schemaVersion, 'shadow-authoring-promotion-package-v1');
  assert.equal(packageJson.authoritativeRepositoryUnchanged, true);
  assert.equal(packageJson.naturalPverPerformed, false);
  const promotionPatch = await readFile(result.promotionPatchPath);
  assert.ok(promotionPatch.length > 0);
  assert.deepEqual(shadowExecutionPatch, promotionPatch);
}

async function assertShadowExecutionEvidenceRetained(
  outputRoot: string,
  manifest: Record<string, any>,
  verification: Record<string, any>,
): Promise<Buffer> {
  const artifactRefs = manifest.artifactRefs as Record<string, string>;
  assert.equal(artifactRefs.shadowAdmission, 'shadow-authoring/admission.json');
  assert.equal(artifactRefs.shadowChangeSet, 'shadow-authoring/change-set.json');
  assert.equal(artifactRefs.shadowExecutionPatch, 'shadow-authoring/execution.patch');
  const admissionBytes = await readFile(join(outputRoot, artifactRefs.shadowAdmission));
  const admission = JSON.parse(admissionBytes.toString('utf8')) as Record<string, unknown>;
  assert.deepEqual(admissionBytes, Buffer.from(canonicalJson(admission)));
  if (typeof verification.admissionSha256 === 'string') {
    assert.equal(sha256Hex(admissionBytes), verification.admissionSha256);
  }
  const changeSet = JSON.parse(await readFile(join(outputRoot, artifactRefs.shadowChangeSet), 'utf8')) as {
    schemaVersion: string;
    authoritativeFingerprintBefore: string;
    authoritativeFingerprintAfter: string;
    patchSha256: string;
    patchByteLength: number;
    changes: unknown[];
  };
  assert.equal(changeSet.schemaVersion, 'shadow-authoring-change-set-v1');
  const executionPatch = await readFile(join(outputRoot, artifactRefs.shadowExecutionPatch));
  assert.equal(changeSet.patchSha256, sha256Hex(executionPatch));
  assert.equal(changeSet.patchByteLength, executionPatch.byteLength);
  return executionPatch;
}

function authorizationBody(input: {
  acknowledgedLegacyHistory: unknown;
  attemptRef: string;
  authorizationRef?: string;
  runRef?: string;
  solutionParticipantBindingLock?: ArtifactBackedReferenceParticipantBindingLockV2;
  downstreamParticipantBindingLock?: ReferenceParticipantBindingLockV1;
}): Record<string, unknown> {
  const solutionParticipantBindingLock = input.solutionParticipantBindingLock ?? TEST_SOLUTION_PARTICIPANT_BINDING_LOCK;
  const downstreamParticipantBindingLock = input.downstreamParticipantBindingLock ?? TEST_PARTICIPANT_BINDING_LOCK;
  return {
    schemaVersion: 'preschool-reference-trial-execution-authorization-v3',
    authorizationRef: input.authorizationRef ?? 'human-authorization-000001',
    runRef: input.runRef ?? 'preschool-pver-20260922231805-71297571',
    attemptRef: input.attemptRef,
    authorizedAt: '2026-09-29T00:00:00.000Z',
    acknowledgedLegacyHistory: input.acknowledgedLegacyHistory,
    solutionParticipantBindingLock,
    solutionParticipantBindingLockSha256: artifactBackedReferenceParticipantBindingLockSha256(solutionParticipantBindingLock),
    downstreamParticipantBindingLock,
    downstreamParticipantBindingLockSha256: referenceParticipantBindingLockSha256(downstreamParticipantBindingLock),
  };
}

async function writeAuthorization(path: string, body: Record<string, unknown>, digestOverride?: string): Promise<string> {
  await mkdir(join(path, '..'), { recursive: true });
  const canonicalSha256 = sha256Hex(canonicalJson(body));
  await writeFile(path, `${canonicalJson({
    ...body,
    canonicalSha256: digestOverride ?? canonicalSha256,
  })}\n`);
  return canonicalSha256;
}

async function testAuthorizationCandidateBuilder(root: string): Promise<void> {
  const liveRepositoryRoot = join(root, 'authorization-candidate-builder-fixture');
  await mkdir(liveRepositoryRoot, { recursive: true });
  const trialRoot = await createLegacyAttemptHistory(liveRepositoryRoot);
  const legacyManifestPath = join(trialRoot, 'attempts/attempt-000002/attempt-manifest.json');
  const legacyManifestBytes = Buffer.from(`${JSON.stringify({
    schemaVersion: 'preschool-reference-trial-attempt-manifest-v1',
    runRef: 'preschool-pver-20260922231805-71297571',
    attemptRef: 'attempt-000002',
    state: 'FAILED',
  })}\n`);
  await writeFile(legacyManifestPath, legacyManifestBytes);
  const acknowledgedLegacyHistory = await captureReferenceTrialLegacyHistory(trialRoot);
  assert.equal(acknowledgedLegacyHistory.attempts[0]?.manifestState, 'FAILED');
  assert.equal(
    acknowledgedLegacyHistory.attempts[0]?.artifacts.some(item => item.path === 'attempt-manifest.json' && item.sha256 === sha256Hex(legacyManifestBytes)),
    true,
  );
  const solutionParticipantBindingLockPath = join(root, 'matrix-solution-binding-lock.json');
  const downstreamParticipantBindingLockPath = join(root, 'matrix-downstream-binding-lock.json');
  await writeFile(solutionParticipantBindingLockPath, `${canonicalJson(TEST_SOLUTION_PARTICIPANT_BINDING_LOCK)}\n`, { flag: 'wx' });
  await writeFile(downstreamParticipantBindingLockPath, `${canonicalJson(TEST_PARTICIPANT_BINDING_LOCK)}\n`, { flag: 'wx' });
  const destinationPath = join(liveRepositoryRoot, 'authorization-candidate.json');
  const input = {
    liveRepositoryRoot,
    attemptRef: 'attempt-000006',
    authorizationRef: 'synthetic-human-authorization-builder',
    authorizedAt: '2026-09-30T00:00:00.000Z',
    solutionParticipantBindingLockPath,
    expectedSolutionParticipantBindingLockSha256: TEST_SOLUTION_PARTICIPANT_BINDING_LOCK_SHA256,
    downstreamParticipantBindingLockPath,
    expectedDownstreamParticipantBindingLockSha256: TEST_PARTICIPANT_BINDING_LOCK_SHA256,
    destinationPath,
  };
  const builderResolvers = {
    resolveSolutionBindingFromLock: testArtifactBackedBindingLockResolver,
    resolveDownstreamBindingFromLock: testBindingLockResolver,
  };
  const candidate = await buildPreschoolReferenceTrialAuthorizationCandidate(input, builderResolvers);
  const bytes = await readFile(destinationPath);
  const authorization = JSON.parse(bytes.toString('utf8')) as Record<string, any>;
  assert.equal(candidate.solutionParticipantBindingLockSha256, TEST_SOLUTION_PARTICIPANT_BINDING_LOCK_SHA256);
  assert.equal(candidate.downstreamParticipantBindingLockSha256, TEST_PARTICIPANT_BINDING_LOCK_SHA256);
  assert.equal(authorization.schemaVersion, 'preschool-reference-trial-execution-authorization-v3');
  assert.deepEqual(authorization.acknowledgedLegacyHistory, acknowledgedLegacyHistory);
  assert.deepEqual(authorization.solutionParticipantBindingLock, TEST_SOLUTION_PARTICIPANT_BINDING_LOCK);
  assert.deepEqual(authorization.downstreamParticipantBindingLock, TEST_PARTICIPANT_BINDING_LOCK);
  assert.equal(authorization.solutionParticipantBindingLockSha256, TEST_SOLUTION_PARTICIPANT_BINDING_LOCK_SHA256);
  assert.equal(authorization.downstreamParticipantBindingLockSha256, TEST_PARTICIPANT_BINDING_LOCK_SHA256);
  assert.equal(candidate.canonicalSha256, authorization.canonicalSha256);
  const { canonicalSha256, ...body } = authorization;
  assert.equal(candidate.canonicalSha256, sha256Hex(canonicalJson(body)));
  assert.equal(candidate.rawSha256, sha256Hex(bytes));
  assert.deepEqual(await readFile(legacyManifestPath), legacyManifestBytes);
  await assert.rejects(
    readFile(join(trialRoot, 'attempts/attempt-000006/attempt-manifest.json')),
    { code: 'ENOENT' },
  );
  await assert.rejects(
    buildPreschoolReferenceTrialAuthorizationCandidate(input, builderResolvers),
    { code: 'EEXIST' },
  );

  await assert.rejects(buildPreschoolReferenceTrialAuthorizationCandidate({
    ...input,
    destinationPath: join(liveRepositoryRoot, 'wrong-lock-digest.json'),
    expectedSolutionParticipantBindingLockSha256: '0'.repeat(64),
  }, builderResolvers), /binding lock.*SHA-256/i);
  await assert.rejects(readFile(join(liveRepositoryRoot, 'wrong-lock-digest.json')), { code: 'ENOENT' });
  await assert.rejects(buildPreschoolReferenceTrialAuthorizationCandidate({
    ...input,
    destinationPath: join(liveRepositoryRoot, 'binding-drift.json'),
  }, {
    ...builderResolvers,
    resolveSolutionBindingFromLock: async () => {
    throw new Error('executable version drift');
    },
  }), /executable version drift/);
  await assert.rejects(readFile(join(liveRepositoryRoot, 'binding-drift.json')), { code: 'ENOENT' });

  const forbiddenAttemptRoot = join(liveRepositoryRoot, REFERENCE_TRIAL_ROOT_PATH, 'attempts/attempt-000099');
  await assert.rejects(buildPreschoolReferenceTrialAuthorizationCandidate({
    ...input,
    destinationPath: join(forbiddenAttemptRoot, 'authorization-candidate.json'),
  }, testBindingLockResolver), /outside.*reference-trial history/i);
  await assert.rejects(readdir(forbiddenAttemptRoot), { code: 'ENOENT' });

  const protectedRoot = join(liveRepositoryRoot, 'artifacts/evolution/autonomous-authoring/reference-trials');
  const protectedRootAlias = join(root, 'authorization-candidate-history-alias');
  await symlink(protectedRoot, protectedRootAlias, 'dir');
  const symlinkedAttemptRoot = join(protectedRootAlias, 'preschool-pver-20260922231805-71297571/attempts/attempt-000098');
  await assert.rejects(buildPreschoolReferenceTrialAuthorizationCandidate({
    ...input,
    destinationPath: join(symlinkedAttemptRoot, 'authorization-candidate.json'),
  }, testBindingLockResolver), /outside.*reference-trial history/i);
  await assert.rejects(readdir(symlinkedAttemptRoot), { code: 'ENOENT' });
}

async function createLegacyAttemptHistory(root: string): Promise<string> {
  const trialRoot = join(root, REFERENCE_TRIAL_ROOT_PATH);
  await put(root, `${REFERENCE_TRIAL_ROOT_PATH}/source/reference-trial/improvement-hypothesis.json`, 'run-level hypothesis bytes\n');
  await put(root, `${REFERENCE_TRIAL_ROOT_PATH}/trial-cli-output.log`, 'unnumbered run-level log bytes\n');
  for (const attemptRef of ['attempt-000002', 'attempt-000003', 'attempt-000004', 'attempt-000005']) {
    await put(root, `${REFERENCE_TRIAL_ROOT_PATH}/attempts/${attemptRef}/source/reference-trial/improvement-hypothesis.json`, `${attemptRef} hypothesis bytes\n`);
    await put(root, `${REFERENCE_TRIAL_ROOT_PATH}/attempts/${attemptRef}/trial-cli-output.log`, `${attemptRef} log bytes\n`);
  }
  return trialRoot;
}

async function createLifecycleAttempt(root: string, attemptRef: string): Promise<{
  outputRoot: string;
  manifestPath: string;
  manifest: any;
}> {
  await mkdir(root, { recursive: true });
  const trialRoot = join(root, REFERENCE_TRIAL_ROOT_PATH);
  const history = await captureReferenceTrialLegacyHistory(trialRoot);
  const authorizationPath = join(root, 'authorization.json');
  const expectedExecutionAuthorizationSha256 = await writeAuthorization(
    authorizationPath,
    authorizationBody({ acknowledgedLegacyHistory: history, attemptRef }),
  );
  const admitted = await admitForTest({
    liveRepositoryRoot: root,
    attemptRef,
    executionAuthorizationPath: authorizationPath,
    expectedExecutionAuthorizationSha256,
  });
  return { ...admitted, manifestPath: join(admitted.outputRoot, 'attempt-manifest.json') };
}

async function moveLifecycleAttemptToRunning(
  attempt: { manifestPath: string; manifest: any },
  currentStage: string = 'PREPARATION',
): Promise<void> {
  attempt.manifest.state = 'RUNNING';
  await writeAttemptManifest(attempt.manifestPath, attempt.manifest);
  attempt.manifest.currentStage = currentStage;
  await writeAttemptManifest(attempt.manifestPath, attempt.manifest);
}

function lifecycleExecutionTrace(outcome = 'completed'): string {
  return JSON.stringify({
    schemaVersion: 'participant-execution-trace-v1',
    invocation: { startedAt: '2026-09-29T00:00:00.000Z', timeoutMs: 1000 },
    events: [],
    terminal: { outcome, elapsedMs: 1 },
  });
}

async function writeLifecycleInvocations(
  attempt: { outputRoot: string; manifestPath: string; manifest: any },
  overrides: { corruptRole?: string; omitShadowTrace?: boolean } = {},
): Promise<void> {
  const { outputRoot, manifest } = attempt;
  const roles = [
    ['solution', 'solution-agent'],
    ['reviewer', 'reviewer-agent'],
    ['shadowAuthoring', 'shadow-authoring'],
  ] as const;
  for (const [role, directory] of roles) {
    const invocationRef = referenceTrialInvocationRef(manifest.attemptRef, role === 'shadowAuthoring' ? 'shadow-authoring' : role);
    const path = join(outputRoot, directory);
    await mkdir(path, { recursive: true });
    await writeFile(join(path, 'invocation.json'), JSON.stringify({
      invocationRef: overrides.corruptRole === role ? 'wrong-invocation-ref' : invocationRef,
      ...(role === 'shadowAuthoring' ? {} : { status: 'completed' }),
    }));
    if (!(role === 'shadowAuthoring' && overrides.omitShadowTrace)) {
      await writeFile(join(path, 'execution-trace.json'), lifecycleExecutionTrace());
    }
  }
  await writeLifecycleParticipantPrompts(attempt);
}

async function writeLifecycleParticipantPrompts(
  attempt: { outputRoot: string; manifestPath: string; manifest: any },
  roles: Array<'solution' | 'reviewer' | 'shadowAuthoring'> = ['solution', 'reviewer', 'shadowAuthoring'],
): Promise<void> {
  const promptDirectories = {
    solution: 'solution-agent',
    reviewer: 'reviewer-agent',
    shadowAuthoring: 'shadow-authoring',
  } as const;
  const participant: WorkspaceAgentParticipantOptions = {
    executable: 'synthetic-prompt-provenance-test-participant',
    buildArgs: () => ['unused'],
  };
  for (const role of roles) {
    const artifactRef = `${promptDirectories[role]}/participant-prompt.txt`;
    const logicalPrompt = `synthetic ${role} prompt, distinct from persisted bytes  \n`;
    const persisted = await persistParticipantPromptAndBinding({
      destinationRoot: join(attempt.outputRoot, promptDirectories[role]),
      prompt: logicalPrompt,
      participant,
    });
    assert.equal(persisted.status, 'PASS');
    const provenance = await readAttemptParticipantPromptProvenance(attempt.outputRoot, role);
    const actualBytes = await readFile(join(attempt.outputRoot, artifactRef));
    assert.notEqual(actualBytes.toString('utf8'), logicalPrompt.trim());
    assert.equal(provenance.status, 'AVAILABLE');
    if (provenance.status !== 'AVAILABLE') throw new Error('Persisted participant prompt provenance is unavailable.');
    assert.equal(provenance.sha256, sha256Hex(actualBytes));
    assert.equal(provenance.byteLength, actualBytes.byteLength);
    attempt.manifest.participantPromptProvenance[role] = provenance;
  }
  await writeAttemptManifest(attempt.manifestPath, attempt.manifest);
}

async function assertParticipantPromptProvenanceMatchesDisk(
  outputRoot: string,
  manifest: Record<string, any>,
  roles: Array<'solution' | 'reviewer' | 'shadowAuthoring'>,
): Promise<void> {
  const promptDirectories = {
    solution: 'solution-agent',
    reviewer: 'reviewer-agent',
    shadowAuthoring: 'shadow-authoring',
  } as const;
  for (const role of roles) {
    const provenance = manifest.participantPromptProvenance[role];
    const artifactRef = `${promptDirectories[role]}/participant-prompt.txt`;
    const actualBytes = await readFile(join(outputRoot, artifactRef));
    assert.equal(provenance.role, role);
    assert.equal(provenance.status, 'AVAILABLE');
    assert.equal(provenance.artifactRef, artifactRef);
    assert.equal(provenance.sha256, sha256Hex(actualBytes));
    assert.equal(provenance.byteLength, actualBytes.byteLength);
    let requested = false;
    try {
      const trace = JSON.parse(await readFile(join(outputRoot, promptDirectories[role], 'execution-trace.json'), 'utf8')) as { events: Array<{ type: string }> };
      requested = trace.events.some(event => event.type === 'participant_envelope_retransmission_requested');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
    assert.equal(
      provenance.retransmissionPrompts.length,
      requested ? 1 : 0,
      'retransmission prompt provenance count must match trace requests',
    );
  }
}

async function buildLifecycleSuccessResult(attempt: { outputRoot: string; manifest: any }): Promise<any> {
  const briefSha256 = PRESCHOOL_REFERENCE_TRIAL_ACCEPTED_RESPONSIBILITY_BRIEF_SHA256;
  attempt.manifest.inputSet.responsibilityBrief = {
    inputIdentity: 'RESPONSIBILITY_BRIEF',
    artifactRef: 'source/reference-trial/reference-responsibility-brief.json',
    sha256: briefSha256,
    availability: 'PRESENT',
  };
  await writeAttemptManifest(attempt.manifestPath, attempt.manifest);
  return buildPreschoolReferenceTrialVerifiedResult({
    briefSha256,
    attemptRef: attempt.manifest.attemptRef,
    attemptManifestRef: `artifacts/evolution/autonomous-authoring/reference-trials/${attempt.manifest.runRef}/attempts/${attempt.manifest.attemptRef}/attempt-manifest.json`,
    executionAuthorization: {
      authorizationRef: attempt.manifest.authorizationRef,
      authorizationDigest: attempt.manifest.authorizationDigest,
      authorizedAt: attempt.manifest.authorizedAt,
    },
    invocationRefs: {
      solution: { status: 'AVAILABLE', invocationRef: 'solution', artifactRef: 'solution-agent/invocation.json', artifactSha256: 'a'.repeat(64), completionEvidence: { artifactRef: 'solution-agent/execution-trace.json', sha256: 'b'.repeat(64), outcome: 'completed' } },
      reviewer: { status: 'AVAILABLE', invocationRef: 'reviewer', artifactRef: 'reviewer-agent/invocation.json', artifactSha256: 'a'.repeat(64), completionEvidence: { artifactRef: 'reviewer-agent/execution-trace.json', sha256: 'b'.repeat(64), outcome: 'completed' } },
      shadowAuthoring: { status: 'AVAILABLE', invocationRef: 'shadow', artifactRef: 'shadow-authoring/invocation.json', artifactSha256: 'a'.repeat(64), completionEvidence: { artifactRef: 'shadow-authoring/execution-trace.json', sha256: 'b'.repeat(64), outcome: 'completed' } },
    },
    reviewContinuation: null,
    responsibilityMappings: [{ referenceResponsibilityRef: 'reference-responsibility-000001', proposalResponsibilityId: 'responsibility-000001' }],
    downstream: {
      status: 'SHADOW_AUTHORING_VERIFIED',
      runRef: attempt.manifest.runRef,
      newEntryCount: 1,
      changedFiles: ['src/data/lines/preschool-passive-spine.json'],
      promotionPackagePath: join(attempt.outputRoot, 'promotion-package.json'),
      promotionPatchPath: join(attempt.outputRoot, 'promotion.patch'),
      liveRepositoryFingerprintBefore: 'b'.repeat(64),
      liveRepositoryFingerprintAfter: 'b'.repeat(64),
    },
  });
}

async function testAttemptManifestLifecycle(root: string): Promise<void> {
  const manifestWithoutProtoKey = JSON.parse('{"schemaVersion":"attempt-manifest","payload":{"preserved":"same"}}');
  const manifestWithProtoKey = JSON.parse('{"schemaVersion":"attempt-manifest","payload":{"__proto__":{"preserved":"different"},"preserved":"same"}}');
  assert.notEqual(createAttemptManifestTransitionToken(manifestWithoutProtoKey), createAttemptManifestTransitionToken(manifestWithProtoKey));

  const staleWriter = await createLifecycleAttempt(join(root, 'stale-writer'), 'attempt-000020');
  const staleBytes = await readFile(staleWriter.manifestPath, 'utf8');
  const writerB = structuredClone(staleWriter.manifest);
  writerB.runnerProvenance.branch = 'writer-b';
  const writerBBytes = `${canonicalJson(writerB)}\n`;
  await writeFile(staleWriter.manifestPath, writerBBytes);
  await assert.rejects(writeAttemptManifest(staleWriter.manifestPath, staleWriter.manifest), /transition token/);
  assert.notEqual(await readFile(staleWriter.manifestPath, 'utf8'), staleBytes);
  assert.equal(await readFile(staleWriter.manifestPath, 'utf8'), writerBBytes);

  const fakeStage = await createLifecycleAttempt(join(root, 'fake-stage'), 'attempt-000021');
  const fakeStageBytes = await readFile(fakeStage.manifestPath, 'utf8');
  fakeStage.manifest.currentStage = 'PREPARATION';
  await assert.rejects(writeAttemptManifest(fakeStage.manifestPath, fakeStage.manifest), /before it enters RUNNING/);
  assert.equal(await readFile(fakeStage.manifestPath, 'utf8'), fakeStageBytes);

  const staleFinalizer = await createLifecycleAttempt(join(root, 'stale-finalizer'), 'attempt-000022');
  await moveLifecycleAttemptToRunning(staleFinalizer);
  await writeFile(join(staleFinalizer.outputRoot, 'trial-result.json'), 'writer-b result');
  await writeFile(join(staleFinalizer.outputRoot, 'promotion-package.json'), 'writer-b package');
  const finalizerCallerToken = createAttemptManifestTransitionToken(staleFinalizer.manifest);
  const staleFinalizerDisk = structuredClone(staleFinalizer.manifest);
  staleFinalizerDisk.inputSet.problemPackage.diagnostic = 'writer-b changed the complete manifest token';
  const staleFinalizerBytes = `${canonicalJson(staleFinalizerDisk)}\n`;
  await writeFile(staleFinalizer.manifestPath, staleFinalizerBytes);
  await assert.rejects(finalizeReferenceTrialFailure(
    staleFinalizer.manifestPath,
    staleFinalizer.manifest,
    new Error('stale finalizer'),
    finalizerCallerToken,
  ), /transition token/);
  assert.equal(await readFile(staleFinalizer.manifestPath, 'utf8'), staleFinalizerBytes);
  assert.equal(await readFile(join(staleFinalizer.outputRoot, 'trial-result.json'), 'utf8'), 'writer-b result');
  assert.equal(await readFile(join(staleFinalizer.outputRoot, 'promotion-package.json'), 'utf8'), 'writer-b package');

  const staleLock = await createLifecycleAttempt(join(root, 'stale-lock'), 'attempt-000023');
  const staleLockBytes = await readFile(staleLock.manifestPath, 'utf8');
  const lockPath = `${staleLock.manifestPath}.lock`;
  await mkdir(lockPath);
  await assert.rejects(writeAttemptManifest(staleLock.manifestPath, staleLock.manifest), /lock already exists/i);
  assert.equal(await readFile(staleLock.manifestPath, 'utf8'), staleLockBytes);
  assert.deepEqual(await readdir(lockPath), []);

  const failureSnapshot = await createLifecycleAttempt(join(root, 'failure-snapshot'), 'attempt-000024');
  await moveLifecycleAttemptToRunning(failureSnapshot);
  const failure = new TrialParticipantFailure('process', 'solution-agent/failure.json', 'original failure message');
  const failurePromise = finalizeReferenceTrialFailure(
    failureSnapshot.manifestPath,
    failureSnapshot.manifest,
    failure,
    createAttemptManifestTransitionToken(failureSnapshot.manifest),
  );
  (failure as any).message = 'caller-mutated failure message';
  (failure as any).errorKind = 'timeout';
  (failure as any).failureArtifactRef = 'caller-mutated/failure.json';
  await assert.rejects(failurePromise, error => error === failure);
  const savedFailureSnapshot = JSON.parse(await readFile(failureSnapshot.manifestPath, 'utf8')) as Record<string, any>;
  assert.equal(savedFailureSnapshot.terminalOutcome.failureMessage, 'original failure message');
  assert.equal(savedFailureSnapshot.terminalOutcome.errorKind, 'process');
  assert.equal(savedFailureSnapshot.terminalOutcome.failureArtifactRef, 'solution-agent/failure.json');

  const genericVerificationFailure = await createLifecycleAttempt(join(root, 'generic-verification-failure'), 'attempt-000037');
  await moveLifecycleAttemptToRunning(genericVerificationFailure, 'VERIFICATION');
  await assert.rejects(finalizeReferenceTrialFailure(
    genericVerificationFailure.manifestPath,
    genericVerificationFailure.manifest,
    new Error('synthetic verification infrastructure failure'),
    createAttemptManifestTransitionToken(genericVerificationFailure.manifest),
  ), /synthetic verification infrastructure failure/);
  const genericVerificationManifest = JSON.parse(await readFile(genericVerificationFailure.manifestPath, 'utf8')) as Record<string, any>;
  assert.equal(genericVerificationManifest.terminalOutcome.status, 'FAILED');
  assert.equal(genericVerificationManifest.terminalOutcome.errorKind, 'RUNTIME_EXCEPTION');
  assert.equal(genericVerificationManifest.terminalOutcome.stage, 'VERIFICATION');

  const participantFailure = await createLifecycleAttempt(join(root, 'participant-failure-prompt'), 'attempt-000031');
  await moveLifecycleAttemptToRunning(participantFailure, 'SOLUTION');
  await writeLifecycleParticipantPrompts(participantFailure, ['solution']);
  const participantFailureError = new TrialParticipantFailure('process', 'solution-agent/failure.json', 'synthetic Solution failure');
  await assert.rejects(finalizeReferenceTrialFailure(
    participantFailure.manifestPath,
    participantFailure.manifest,
    participantFailureError,
    createAttemptManifestTransitionToken(participantFailure.manifest),
  ), error => error === participantFailureError);
  const participantFailureManifest = JSON.parse(await readFile(participantFailure.manifestPath, 'utf8')) as Record<string, any>;
  await assertParticipantPromptProvenanceMatchesDisk(participantFailure.outputRoot, participantFailureManifest, ['solution']);
  assert.equal(participantFailureManifest.participantPromptProvenance.reviewer.status, 'NOT_INVOKED');
  assert.equal(participantFailureManifest.participantPromptProvenance.shadowAuthoring.status, 'NOT_INVOKED');

  const successSnapshot = await createLifecycleAttempt(join(root, 'success-snapshot'), 'attempt-000029');
  await moveLifecycleAttemptToRunning(successSnapshot, 'CLEANUP');
  await writeLifecycleInvocations(successSnapshot);
  const successSnapshotResult = await buildLifecycleSuccessResult(successSnapshot);
  const successSnapshotToken = createAttemptManifestTransitionToken(successSnapshot.manifest);
  const successSnapshotRun = finalizeReferenceTrialSuccess(
    successSnapshot.manifestPath,
    successSnapshot.manifest,
    successSnapshotResult,
    successSnapshotToken,
  );
  successSnapshot.manifest.runnerProvenance.branch = 'caller-mutated-after-finalizer-entry';
  successSnapshotResult.changedFiles.push('caller-mutated-after-finalizer-entry.ts');
  await successSnapshotRun;
  const savedSuccessManifest = JSON.parse(await readFile(successSnapshot.manifestPath, 'utf8')) as Record<string, any>;
  const savedSuccessResult = JSON.parse(await readFile(join(successSnapshot.outputRoot, 'trial-result.json'), 'utf8')) as Record<string, any>;
  await assertParticipantPromptProvenanceMatchesDisk(successSnapshot.outputRoot, savedSuccessManifest, ['solution', 'reviewer', 'shadowAuthoring']);
  assert.notEqual(savedSuccessManifest.runnerProvenance.branch, 'caller-mutated-after-finalizer-entry');
  assert.deepEqual(savedSuccessResult.changedFiles, ['src/data/lines/preschool-passive-spine.json']);
  assert.equal(successSnapshot.manifest.state, 'RUNNING');

  const terminalAttempt = await createLifecycleAttempt(join(root, 'terminal-immutable'), 'attempt-000025');
  const terminalFailure = new Error('preflight stop');
  await assert.rejects(finalizeReferenceTrialFailure(
    terminalAttempt.manifestPath,
    terminalAttempt.manifest,
    terminalFailure,
    createAttemptManifestTransitionToken(terminalAttempt.manifest),
  ), error => error === terminalFailure);
  const terminalBytes = await readFile(terminalAttempt.manifestPath, 'utf8');
  assert.equal(JSON.parse(terminalBytes).state, 'STOPPED');
  await assert.rejects(writeAttemptManifest(terminalAttempt.manifestPath, terminalAttempt.manifest), /transition token/);
  assert.equal(await readFile(terminalAttempt.manifestPath, 'utf8'), terminalBytes);

  const cleanupIncomplete = await createLifecycleAttempt(join(root, 'cleanup-incomplete'), 'attempt-000030');
  await moveLifecycleAttemptToRunning(cleanupIncomplete, 'CLEANUP');
  const protectedPromotionDir = join(cleanupIncomplete.outputRoot, 'promotion-package.md');
  const protectedChildDir = join(protectedPromotionDir, 'locked');
  await mkdir(protectedChildDir, { recursive: true });
  await writeFile(join(protectedChildDir, 'residual.md'), 'retained promotion artifact');
  await chmod(protectedPromotionDir, 0o500);
  await chmod(protectedChildDir, 0o500);
  const cleanupError = new Error('synthetic promotion cleanup failure');
  try {
    await assert.rejects(finalizeReferenceTrialFailure(
      cleanupIncomplete.manifestPath,
      cleanupIncomplete.manifest,
      cleanupError,
      createAttemptManifestTransitionToken(cleanupIncomplete.manifest),
    ), error => error === cleanupError);
  } finally {
    await chmod(protectedChildDir, 0o700);
    await chmod(protectedPromotionDir, 0o700);
  }
  const cleanupManifest = JSON.parse(await readFile(cleanupIncomplete.manifestPath, 'utf8')) as Record<string, any>;
  assert.equal(cleanupManifest.state, 'STOPPED');
  assert.equal(cleanupManifest.terminalOutcome.status, 'CLEANUP_INCOMPLETE');
  assert.match(cleanupManifest.terminalOutcome.diagnosticFailures.join(' '), /promotion-package\.md:.*residual artifact remains/);
  assert.equal(await readFile(join(protectedChildDir, 'residual.md'), 'utf8'), 'retained promotion artifact');

  const resultCleanup = await createLifecycleAttempt(join(root, 'result-cleanup-incomplete'), 'attempt-000034');
  await moveLifecycleAttemptToRunning(resultCleanup, 'CLEANUP');
  const residualResultPath = join(resultCleanup.outputRoot, 'trial-result.json');
  await mkdir(join(residualResultPath, 'locked'), { recursive: true });
  await writeFile(join(residualResultPath, 'locked', 'result.json'), 'residual successful result evidence');
  const resultCleanupError = new Error('synthetic failure after result creation');
  await assert.rejects(finalizeReferenceTrialFailure(
    resultCleanup.manifestPath,
    resultCleanup.manifest,
    resultCleanupError,
    createAttemptManifestTransitionToken(resultCleanup.manifest),
  ), error => error === resultCleanupError);
  const resultCleanupManifest = JSON.parse(await readFile(resultCleanup.manifestPath, 'utf8')) as Record<string, any>;
  assert.equal(resultCleanupManifest.state, 'STOPPED');
  assert.equal(resultCleanupManifest.terminalOutcome.status, 'CLEANUP_INCOMPLETE');
  assert.equal(resultCleanupManifest.terminalOutcome.trialResultRef, 'trial-result.json');
  assert.equal(resultCleanupManifest.terminalOutcome.trialResultStatus, 'PRESENT_UNREMOVED');
  assert.match(resultCleanupManifest.terminalOutcome.diagnosticFailures.join(' '), /trial-result\.json: cleanup failed:/);
  assert.match(resultCleanupManifest.terminalOutcome.diagnosticFailures.join(' '), /trial-result\.json: residual artifact remains/);
  assert.deepEqual((await readdir(resultCleanup.outputRoot)).filter(name => name.startsWith('promotion-') || name === 'promotion.patch'), []);
  assert.equal(await readFile(join(residualResultPath, 'locked', 'result.json'), 'utf8'), 'residual successful result evidence');

  const resultCleanupSucceeds = await createLifecycleAttempt(join(root, 'result-cleanup-succeeds'), 'attempt-000035');
  await moveLifecycleAttemptToRunning(resultCleanupSucceeds, 'CLEANUP');
  const removableResultPath = join(resultCleanupSucceeds.outputRoot, 'trial-result.json');
  await writeFile(removableResultPath, 'residual success result evidence');
  const ordinaryCleanupError = new Error('synthetic failure with removable result');
  await assert.rejects(finalizeReferenceTrialFailure(
    resultCleanupSucceeds.manifestPath,
    resultCleanupSucceeds.manifest,
    ordinaryCleanupError,
    createAttemptManifestTransitionToken(resultCleanupSucceeds.manifest),
  ), error => error === ordinaryCleanupError);
  const resultCleanupSucceededManifest = JSON.parse(await readFile(resultCleanupSucceeds.manifestPath, 'utf8')) as Record<string, any>;
  assert.equal(resultCleanupSucceededManifest.state, 'FAILED');
  assert.equal(resultCleanupSucceededManifest.terminalOutcome.status, 'FAILED');
  await assert.rejects(readFile(removableResultPath), { code: 'ENOENT' });
  for (const artifact of ['promotion-package.json', 'promotion-package.md', 'promotion.patch']) {
    await assert.rejects(readFile(join(resultCleanupSucceeds.outputRoot, artifact)), { code: 'ENOENT' });
  }

  const corruptInvocation = await createLifecycleAttempt(join(root, 'corrupt-invocation'), 'attempt-000026');
  await moveLifecycleAttemptToRunning(corruptInvocation, 'CLEANUP');
  corruptInvocation.manifest.inputSet.responsibilityBrief = {
    inputIdentity: 'RESPONSIBILITY_BRIEF', artifactRef: 'source/reference-trial/reference-responsibility-brief.json',
    sha256: 'c'.repeat(64), availability: 'PRESENT',
  };
  await writeAttemptManifest(corruptInvocation.manifestPath, corruptInvocation.manifest);
  await writeLifecycleInvocations(corruptInvocation, { corruptRole: 'solution' });
  const corruptResult = await buildLifecycleSuccessResult(corruptInvocation);
  let corruptError: unknown;
  await assert.rejects(finalizeReferenceTrialSuccess(
    corruptInvocation.manifestPath,
    corruptInvocation.manifest,
    corruptResult,
    createAttemptManifestTransitionToken(corruptInvocation.manifest),
  ), error => {
    corruptError = error;
    return error instanceof Error && /does not match expected ref/.test(error.message);
  });
  await assert.rejects(finalizeReferenceTrialFailure(
    corruptInvocation.manifestPath,
    corruptInvocation.manifest,
    corruptError,
    createAttemptManifestTransitionToken(corruptInvocation.manifest),
  ), error => error === corruptError);
  const corruptSaved = JSON.parse(await readFile(corruptInvocation.manifestPath, 'utf8')) as Record<string, any>;
  assert.equal(corruptSaved.state, 'FAILED');
  assert.equal(corruptSaved.invocationRefs.solution.status, 'CORRUPTED');

  for (const promptMutation of ['missing', 'corrupted'] as const) {
    const promptFailure = await createLifecycleAttempt(join(root, `prompt-${promptMutation}`), promptMutation === 'missing' ? 'attempt-000032' : 'attempt-000033');
    await moveLifecycleAttemptToRunning(promptFailure, 'CLEANUP');
    await writeLifecycleInvocations(promptFailure);
    const solutionPromptPath = join(promptFailure.outputRoot, 'solution-agent/participant-prompt.txt');
    if (promptMutation === 'missing') await rm(solutionPromptPath);
    else await writeFile(solutionPromptPath, 'corrupted persisted prompt bytes\n');
    const promptResult = await buildLifecycleSuccessResult(promptFailure);
    let promptProvenanceError: unknown;
    await assert.rejects(finalizeReferenceTrialSuccess(
      promptFailure.manifestPath,
      promptFailure.manifest,
      promptResult,
      createAttemptManifestTransitionToken(promptFailure.manifest),
    ), error => {
      promptProvenanceError = error;
      return error instanceof Error && /participant prompt/i.test(error.message);
    });
    await assert.rejects(finalizeReferenceTrialFailure(
      promptFailure.manifestPath,
      promptFailure.manifest,
      promptProvenanceError,
      createAttemptManifestTransitionToken(promptFailure.manifest),
    ), error => error === promptProvenanceError);
    const terminalPromptManifest = JSON.parse(await readFile(promptFailure.manifestPath, 'utf8')) as Record<string, any>;
    assert.equal(terminalPromptManifest.state, 'FAILED');
    await assert.rejects(readFile(join(promptFailure.outputRoot, 'trial-result.json')), { code: 'ENOENT' });
  }

  const shadowCompletion = await createLifecycleAttempt(join(root, 'shadow-completion'), 'attempt-000027');
  await moveLifecycleAttemptToRunning(shadowCompletion, 'CLEANUP');
  await writeLifecycleInvocations(shadowCompletion, { omitShadowTrace: true });
  const shadowResult = await buildLifecycleSuccessResult(shadowCompletion);
  await assert.rejects(finalizeReferenceTrialSuccess(
    shadowCompletion.manifestPath,
    shadowCompletion.manifest,
    shadowResult,
    createAttemptManifestTransitionToken(shadowCompletion.manifest),
  ), /completion evidence is missing/i);

  const race = await createLifecycleAttempt(join(root, 'terminal-race'), 'attempt-000028');
  await moveLifecycleAttemptToRunning(race, 'CLEANUP');
  await writeLifecycleInvocations(race);
  const raceResult = await buildLifecycleSuccessResult(race);
  const originalFailure = new Error('racing failure finalizer');
  const expectedToken = createAttemptManifestTransitionToken(race.manifest);
  const raceOutcomes = await Promise.allSettled([
    finalizeReferenceTrialSuccess(race.manifestPath, race.manifest, raceResult, expectedToken),
    finalizeReferenceTrialFailure(race.manifestPath, race.manifest, originalFailure, expectedToken),
  ]);
  const raceManifest = JSON.parse(await readFile(race.manifestPath, 'utf8')) as Record<string, any>;
  assert.ok(['SUCCEEDED', 'FAILED'].includes(raceManifest.state));
  if (raceManifest.state === 'SUCCEEDED') {
    assert.equal(raceOutcomes[0]!.status, 'fulfilled');
    assert.equal(JSON.parse(await readFile(join(race.outputRoot, 'trial-result.json'), 'utf8')).schemaVersion, 'preschool-reference-trial-result-v3');
  } else {
    assert.equal(raceOutcomes[1]!.status, 'rejected');
    await assert.rejects(readFile(join(race.outputRoot, 'trial-result.json')), { code: 'ENOENT' });
  }
}

async function testRetransmissionPromptFinalizationGate(root: string): Promise<void> {
  const createWithRetransmission = async (name: string, runtimeOutcome: string | null = 'COMPLETED'): Promise<{
    attempt: Awaited<ReturnType<typeof createLifecycleAttempt>>;
    result: any;
    promptPath: string;
  }> => {
    const attempt = await createLifecycleAttempt(join(root, name), 'attempt-000029');
    await moveLifecycleAttemptToRunning(attempt, 'CLEANUP');
    await writeLifecycleInvocations(attempt);
    const promptPath = join(attempt.outputRoot, 'solution-agent', RETRANSMISSION_PROMPT_ARTIFACT);
    await writeFile(promptPath, 'exact synthetic retransmission prompt\n');
    const tracePath = join(attempt.outputRoot, 'solution-agent/execution-trace.json');
    const trace = JSON.parse(await readFile(tracePath, 'utf8')) as Record<string, any>;
    trace.events.push({
      seq: 0,
      type: 'participant_envelope_retransmission_requested',
      elapsedMs: 1,
      retransmissionAttempt: 1,
      failureClass: 'ENVELOPE_FAILURE',
      sameThread: true,
    });
    if (runtimeOutcome !== null) trace.events.push({
      seq: 1,
      type: 'participant_envelope_retransmission_completed',
      elapsedMs: 2,
      retransmissionAttempt: 1,
      runtimeOutcome,
    });
    await writeFile(tracePath, JSON.stringify(trace));
    const provenance = await readAttemptParticipantPromptProvenance(attempt.outputRoot, 'solution');
    assert.equal(provenance.status, runtimeOutcome === null ? 'CORRUPTED' : 'AVAILABLE');
    assert.equal(provenance.retransmissionPrompts.length, 1, 'retransmission finalization must persist exactly one requested prompt');
    attempt.manifest.participantPromptProvenance.solution = provenance;
    await writeAttemptManifest(attempt.manifestPath, attempt.manifest);
    return { attempt, result: await buildLifecycleSuccessResult(attempt), promptPath };
  };

  for (const runtimeOutcome of ['COMPLETED', 'TIMEOUT', 'CONTINUATION_FAILURE', 'RUNTIME_FAILURE']) {
    const { attempt } = await createWithRetransmission(`retransmission-outcome-${runtimeOutcome.toLowerCase()}`, runtimeOutcome);
    const provenance = attempt.manifest.participantPromptProvenance.solution;
    assert.equal(provenance.status, 'AVAILABLE', `${runtimeOutcome} must preserve exact prompt provenance`);
    assert.equal(
      provenance.retransmissionPrompts.length,
      1,
      `${runtimeOutcome} retransmission outcome must preserve exactly one persisted prompt`,
    );
    const bytes = await readFile(join(attempt.outputRoot, 'solution-agent', RETRANSMISSION_PROMPT_ARTIFACT));
    assert.equal(provenance.retransmissionPrompts[0].sha256, sha256Hex(bytes));
    assert.equal(provenance.retransmissionPrompts[0].byteLength, bytes.byteLength);
    const successResult = await buildLifecycleSuccessResult(attempt);
    if (runtimeOutcome === 'COMPLETED') {
      await finalizeReferenceTrialSuccess(
        attempt.manifestPath,
        attempt.manifest,
        successResult,
        createAttemptManifestTransitionToken(attempt.manifest),
      );
      assert.equal(JSON.parse(await readFile(attempt.manifestPath, 'utf8')).state, 'SUCCEEDED');
    } else {
      await assert.rejects(finalizeReferenceTrialSuccess(
        attempt.manifestPath,
        attempt.manifest,
        successResult,
        createAttemptManifestTransitionToken(attempt.manifest),
      ), /retransmission.*(?:completion|outcome)|participant prompt provenance/i);
      await assert.rejects(readFile(join(attempt.outputRoot, 'trial-result.json')), { code: 'ENOENT' });
    }
  }

  for (const [name, mutation] of [
    ['retransmission-invalid-runtime-outcome', 'invalid-runtime-outcome'],
    ['retransmission-missing-runtime-outcome', 'missing-runtime-outcome'],
    ['retransmission-unsupported-attempt', 'unsupported-attempt'],
  ] as const) {
    const { attempt, result } = await createWithRetransmission(name);
    const tracePath = join(attempt.outputRoot, 'solution-agent/execution-trace.json');
    const trace = JSON.parse(await readFile(tracePath, 'utf8')) as Record<string, any>;
    if (mutation === 'invalid-runtime-outcome') trace.events[1].runtimeOutcome = 'UNSUPPORTED';
    if (mutation === 'missing-runtime-outcome') delete trace.events[1].runtimeOutcome;
    if (mutation === 'unsupported-attempt') trace.events[0].retransmissionAttempt = 2;
    await writeFile(tracePath, JSON.stringify(trace));
    assert.equal((await readAttemptParticipantPromptProvenance(attempt.outputRoot, 'solution')).status, 'CORRUPTED');
    await assert.rejects(finalizeReferenceTrialSuccess(
      attempt.manifestPath,
      attempt.manifest,
      result,
      createAttemptManifestTransitionToken(attempt.manifest),
    ), /participant prompt provenance/i);
    await assert.rejects(readFile(join(attempt.outputRoot, 'trial-result.json')), { code: 'ENOENT' });
  }

  const requestOnly = await createWithRetransmission('retransmission-request-only', null);
  assert.equal(requestOnly.attempt.manifest.participantPromptProvenance.solution.status, 'CORRUPTED');
  await assert.rejects(finalizeReferenceTrialSuccess(
    requestOnly.attempt.manifestPath,
    requestOnly.attempt.manifest,
    requestOnly.result,
    createAttemptManifestTransitionToken(requestOnly.attempt.manifest),
  ), /participant prompt provenance/i);
  await assert.rejects(readFile(join(requestOnly.attempt.outputRoot, 'trial-result.json')), { code: 'ENOENT' });

  const timeoutFailure = await createWithRetransmission('retransmission-timeout-failure-finalization', 'TIMEOUT');
  const timeoutPromptBeforeFailure = structuredClone(timeoutFailure.attempt.manifest.participantPromptProvenance.solution);
  const timeoutError = new TrialParticipantFailure('timeout', 'solution-agent/failure.json', 'synthetic retransmission timeout');
  await assert.rejects(finalizeReferenceTrialFailure(
    timeoutFailure.attempt.manifestPath,
    timeoutFailure.attempt.manifest,
    timeoutError,
    createAttemptManifestTransitionToken(timeoutFailure.attempt.manifest),
  ), error => error === timeoutError);
  const timeoutFailedManifest = JSON.parse(await readFile(timeoutFailure.attempt.manifestPath, 'utf8')) as Record<string, any>;
  assert.equal(timeoutFailedManifest.state, 'FAILED');
  assert.equal(timeoutFailedManifest.participantPromptProvenance.solution.status, 'AVAILABLE');
  assert.equal(timeoutFailedManifest.participantPromptProvenance.solution.sha256, timeoutPromptBeforeFailure.sha256);
  assert.deepEqual(timeoutFailedManifest.participantPromptProvenance.solution.retransmissionPrompts, timeoutPromptBeforeFailure.retransmissionPrompts);
  const timeoutPromptBytes = await readFile(join(timeoutFailure.attempt.outputRoot, 'solution-agent', RETRANSMISSION_PROMPT_ARTIFACT));
  assert.equal(timeoutFailedManifest.participantPromptProvenance.solution.retransmissionPrompts[0].sha256, sha256Hex(timeoutPromptBytes));
  assert.equal(timeoutFailedManifest.participantPromptProvenance.solution.retransmissionPrompts[0].byteLength, timeoutPromptBytes.byteLength);

  const duplicateCompletion = await createWithRetransmission('retransmission-duplicate-completion');
  const duplicateTracePath = join(duplicateCompletion.attempt.outputRoot, 'solution-agent/execution-trace.json');
  const duplicateTrace = JSON.parse(await readFile(duplicateTracePath, 'utf8')) as Record<string, any>;
  duplicateTrace.events.push({ ...duplicateTrace.events[1], seq: 2, elapsedMs: 3 });
  await writeFile(duplicateTracePath, JSON.stringify(duplicateTrace));
  assert.equal((await readAttemptParticipantPromptProvenance(duplicateCompletion.attempt.outputRoot, 'solution')).status, 'CORRUPTED');
  await assert.rejects(finalizeReferenceTrialSuccess(
    duplicateCompletion.attempt.manifestPath,
    duplicateCompletion.attempt.manifest,
    duplicateCompletion.result,
    createAttemptManifestTransitionToken(duplicateCompletion.attempt.manifest),
  ), /participant prompt provenance/i);

  const orphanCompletion = await createLifecycleAttempt(join(root, 'retransmission-orphan-completion'), 'attempt-000036');
  await moveLifecycleAttemptToRunning(orphanCompletion, 'CLEANUP');
  await writeLifecycleInvocations(orphanCompletion);
  const orphanCompletionTracePath = join(orphanCompletion.outputRoot, 'solution-agent/execution-trace.json');
  const orphanCompletionTrace = JSON.parse(await readFile(orphanCompletionTracePath, 'utf8')) as Record<string, any>;
  orphanCompletionTrace.events.push({ type: 'participant_envelope_retransmission_completed', retransmissionAttempt: 1, runtimeOutcome: 'COMPLETED' });
  await writeFile(orphanCompletionTracePath, JSON.stringify(orphanCompletionTrace));
  assert.equal((await readAttemptParticipantPromptProvenance(orphanCompletion.outputRoot, 'solution')).status, 'CORRUPTED');
  await assert.rejects(finalizeReferenceTrialSuccess(
    orphanCompletion.manifestPath,
    orphanCompletion.manifest,
    await buildLifecycleSuccessResult(orphanCompletion),
    createAttemptManifestTransitionToken(orphanCompletion.manifest),
  ), /participant prompt provenance/i);

  for (const [name, mutation] of [
    ['missing-retransmission-prompt', 'missing'],
    ['corrupt-retransmission-prompt', 'corrupt'],
  ] as const) {
    const { attempt, result, promptPath } = await createWithRetransmission(name);
    const recordedBeforeFailure = structuredClone(attempt.manifest.participantPromptProvenance.solution);
    if (mutation === 'missing') await rm(promptPath);
    else await writeFile(promptPath, 'different bytes\n');
    let finalizationError: unknown;
    await assert.rejects(finalizeReferenceTrialSuccess(
      attempt.manifestPath,
      attempt.manifest,
      result,
      createAttemptManifestTransitionToken(attempt.manifest),
    ), error => {
      finalizationError = error;
      return error instanceof Error && /participant prompt provenance/i.test(error.message);
    });
    await assert.rejects(readFile(join(attempt.outputRoot, 'trial-result.json')), { code: 'ENOENT' });
    if (mutation === 'missing') {
      await assert.rejects(finalizeReferenceTrialFailure(
        attempt.manifestPath,
        attempt.manifest,
        finalizationError,
        createAttemptManifestTransitionToken(attempt.manifest),
      ), error => error === finalizationError);
      const failedManifest = JSON.parse(await readFile(attempt.manifestPath, 'utf8')) as Record<string, any>;
      assert.equal(failedManifest.state, 'FAILED');
      assert.equal(failedManifest.participantPromptProvenance.solution.status, 'CORRUPTED');
      assert.equal(failedManifest.participantPromptProvenance.solution.sha256, recordedBeforeFailure.sha256);
      assert.deepEqual(failedManifest.participantPromptProvenance.solution.retransmissionPrompts, recordedBeforeFailure.retransmissionPrompts);
    }
  }

  const orphan = await createLifecycleAttempt(join(root, 'orphan-retransmission-prompt'), 'attempt-000030');
  await moveLifecycleAttemptToRunning(orphan, 'CLEANUP');
  await writeLifecycleInvocations(orphan);
  await writeFile(join(orphan.outputRoot, 'solution-agent', RETRANSMISSION_PROMPT_ARTIFACT), 'orphan prompt bytes\n');
  const orphanProvenance = await readAttemptParticipantPromptProvenance(orphan.outputRoot, 'solution');
  assert.equal(orphanProvenance.status, 'CORRUPTED');
  await assert.rejects(finalizeReferenceTrialSuccess(
    orphan.manifestPath,
    orphan.manifest,
    await buildLifecycleSuccessResult(orphan),
    createAttemptManifestTransitionToken(orphan.manifest),
  ), /participant prompt provenance/i);
  await assert.rejects(readFile(join(orphan.outputRoot, 'trial-result.json')), { code: 'ENOENT' });
}

async function testExecutionAuthorizationAdmission(root: string): Promise<void> {
  const fixtureRoot = join(root, 'execution-authorization-fixture');
  await mkdir(fixtureRoot, { recursive: true });
  const trialRoot = await createLegacyAttemptHistory(fixtureRoot);
  const history = await captureReferenceTrialLegacyHistory(trialRoot);
  assert.deepEqual(history.attempts.map(item => item.attemptRef), [
    'attempt-000002', 'attempt-000003', 'attempt-000004', 'attempt-000005',
  ]);
  assert.ok(history.attempts.every(item => item.manifestPresent === false));
  assert.ok(history.attempts.every(item => item.artifacts.length > 0));
  assert.ok(history.runLevelMaterial.some(item => item.path === 'source/reference-trial/improvement-hypothesis.json'));
  assert.ok(history.runLevelMaterial.some(item => item.path === 'trial-cli-output.log'));

  const absentAuthorization = await runPreschoolReferenceTrial({
    liveRepositoryRoot: fixtureRoot,
    attemptRef: 'attempt-000006',
    evidencePath: join(fixtureRoot, 'missing-evidence.json'),
  }, {
    resolveReferenceParticipantBindingFromLock: async () => {
      throw new Error('Participant binding must not occur without execution authorization');
    },
  });
  assert.equal(absentAuthorization.status, 'REFERENCE_EXECUTION_AUTHORIZATION_UNAVAILABLE');
  await assert.rejects(
    readFile(join(trialRoot, 'attempts/attempt-000006/attempt-manifest.json')),
    { code: 'ENOENT' },
  );

  const validAuthorizationPath = join(fixtureRoot, 'valid-authorization-without-expected-digest.json');
  await writeAuthorization(validAuthorizationPath, authorizationBody({
    acknowledgedLegacyHistory: history,
    attemptRef: 'attempt-000006',
  }));
  let boundWithoutExpectedDigest = false;
  const absentExpectedDigest = await runPreschoolReferenceTrial({
    liveRepositoryRoot: fixtureRoot,
    attemptRef: 'attempt-000006',
    executionAuthorizationPath: validAuthorizationPath,
    evidencePath: join(fixtureRoot, 'missing-evidence.json'),
  }, {
    resolveReferenceParticipantBindingFromLock: async () => {
      boundWithoutExpectedDigest = true;
      throw new Error('Participant binding must not occur without an external expected digest');
    },
  });
  assert.equal(absentExpectedDigest.status, 'REFERENCE_EXECUTION_AUTHORIZATION_UNAVAILABLE');
  assert.equal(boundWithoutExpectedDigest, false);
  await assert.rejects(
    readFile(join(trialRoot, 'attempts/attempt-000006/attempt-manifest.json')),
    { code: 'ENOENT' },
  );
  const wrongExpectedDigestPath = join(fixtureRoot, 'valid-authorization-wrong-expected-digest.json');
  await writeAuthorization(wrongExpectedDigestPath, authorizationBody({
    acknowledgedLegacyHistory: history,
    attemptRef: 'attempt-000006',
    authorizationRef: 'self-consistent-but-not-human-bound',
  }));
  let boundWithWrongExpectedDigest = false;
  const wrongExpectedDigest = await runPreschoolReferenceTrial({
    liveRepositoryRoot: fixtureRoot,
    attemptRef: 'attempt-000006',
    executionAuthorizationPath: wrongExpectedDigestPath,
    expectedExecutionAuthorizationSha256: '0'.repeat(64),
    evidencePath: join(fixtureRoot, 'missing-evidence.json'),
  }, {
    resolveReferenceParticipantBindingFromLock: async () => {
      boundWithWrongExpectedDigest = true;
      throw new Error('Participant binding must not occur with a mismatched external digest');
    },
  });
  assert.equal(wrongExpectedDigest.status, 'REFERENCE_EXECUTION_AUTHORIZATION_UNAVAILABLE');
  assert.equal(boundWithWrongExpectedDigest, false);
  await assert.rejects(
    readFile(join(trialRoot, 'attempts/attempt-000006/attempt-manifest.json')),
    { code: 'ENOENT' },
  );

  const cliFixtureRoot = join(root, 'cli-legacy-fixture');
  const cliClone = spawnSync('git', ['clone', '--quiet', '--shared', process.cwd(), cliFixtureRoot], { encoding: 'utf8' });
  assert.equal(cliClone.status, 0, cliClone.stderr);
  const cliTrialRoot = await createLegacyAttemptHistory(cliFixtureRoot);
  const originalWorkingDirectory = process.cwd();
  const originalStdoutWrite = process.stdout.write;
  const runCli = async (
    argv: string[],
    dependencies: Parameters<typeof runPreschoolReferenceTrialCli>[1] = {},
  ): Promise<{ code: number; output: string }> => {
    let output = '';
    process.stdout.write = ((chunk: unknown) => {
      output += String(chunk);
      return true;
    }) as typeof process.stdout.write;
    try {
      return { code: await runPreschoolReferenceTrialCli(argv, dependencies), output };
    } finally {
      process.stdout.write = originalStdoutWrite;
    }
  };
  process.chdir(cliFixtureRoot);
  try {
    const missingAuthorization = await runCli(['--attempt-ref', 'attempt-000006']);
    assert.equal(missingAuthorization.code, 1);
    assert.equal(JSON.parse(missingAuthorization.output).status, 'REFERENCE_EXECUTION_AUTHORIZATION_UNAVAILABLE');
    await assert.rejects(readFile(join(cliTrialRoot, 'attempts/attempt-000006/attempt-manifest.json')), { code: 'ENOENT' });
    const invalidPath = await runCli([
      '--attempt-ref', 'attempt-000007', '--execution-authorization', join(root, 'missing-authorization.json'),
      '--execution-authorization-sha256', '0'.repeat(64),
    ]);
    assert.equal(invalidPath.code, 1);
    assert.equal(JSON.parse(invalidPath.output).status, 'REFERENCE_EXECUTION_AUTHORIZATION_UNAVAILABLE');
    await assert.rejects(readFile(join(cliTrialRoot, 'attempts/attempt-000007/attempt-manifest.json')), { code: 'ENOENT' });
    const cliMissingDigestPath = join(root, 'cli-valid-authorization.json');
    await writeAuthorization(cliMissingDigestPath, authorizationBody({
      acknowledgedLegacyHistory: await captureReferenceTrialLegacyHistory(cliTrialRoot),
      attemptRef: 'attempt-000008',
    }));
    const missingExpectedDigest = await runCli([
      '--attempt-ref', 'attempt-000008', '--execution-authorization', cliMissingDigestPath,
    ]);
    assert.equal(missingExpectedDigest.code, 1);
    assert.equal(JSON.parse(missingExpectedDigest.output).status, 'REFERENCE_EXECUTION_AUTHORIZATION_UNAVAILABLE');
    await assert.rejects(readFile(join(cliTrialRoot, 'attempts/attempt-000008/attempt-manifest.json')), { code: 'ENOENT' });
    const cliExactAuthorizationPath = join(root, 'cli-exact-authorization.json');
    const cliExactDigest = await writeAuthorization(cliExactAuthorizationPath, authorizationBody({
      acknowledgedLegacyHistory: await captureReferenceTrialLegacyHistory(cliTrialRoot),
      attemptRef: 'attempt-000009',
      authorizationRef: 'human-approved-cli-exact-binding',
    }));
    const exactExternalDigest = await runCli([
      '--attempt-ref', 'attempt-000009',
      '--execution-authorization', cliExactAuthorizationPath,
      '--execution-authorization-sha256', cliExactDigest,
    ], {
      resolveReferenceParticipantBindingFromLock: testBindingLockResolver,
      resolveArtifactBackedReferenceParticipantBindingFromLock: testArtifactBackedBindingLockResolver,
    });
    assert.equal(exactExternalDigest.code, 1);
    assert.equal(JSON.parse(exactExternalDigest.output).status, 'REFERENCE_EVIDENCE_UNAVAILABLE', exactExternalDigest.output);
    const cliAdmittedManifest = JSON.parse(await readFile(join(cliTrialRoot, 'attempts/attempt-000009/attempt-manifest.json'), 'utf8')) as Record<string, any>;
    assert.equal(cliAdmittedManifest.authorizationDigest, cliExactDigest);
    assert.equal(cliAdmittedManifest.expectedAuthorizationDigest, cliExactDigest);
    const invalidAttemptRef = await runCli(['--attempt-ref', 'attempt-six']);
    assert.equal(invalidAttemptRef.code, 1);
    assert.equal(JSON.parse(invalidAttemptRef.output).status, 'REFERENCE_EXECUTION_AUTHORIZATION_UNAVAILABLE');
    await assert.rejects(readFile(join(cliTrialRoot, 'attempts/attempt-six/attempt-manifest.json')), { code: 'ENOENT' });
  } finally {
    process.chdir(originalWorkingDirectory);
  }

  const authorizationPath = join(fixtureRoot, 'authorization.json');
  const correctBody = authorizationBody({ acknowledgedLegacyHistory: history, attemptRef: 'attempt-000006' });
  const admitted = await (async () => {
    const expectedExecutionAuthorizationSha256 = await writeAuthorization(authorizationPath, correctBody);
    return admitForTest({
      liveRepositoryRoot: fixtureRoot,
      attemptRef: 'attempt-000006',
      executionAuthorizationPath: authorizationPath,
      expectedExecutionAuthorizationSha256,
    });
  })();
  assert.equal(admitted.manifest.state, 'CREATED');
  assert.equal(admitted.manifest.authorizationRef, 'human-authorization-000001');
  assert.equal(admitted.manifest.authorizedAt, '2026-09-29T00:00:00.000Z');
  assert.equal(admitted.manifest.acknowledgedLegacyHistory.attempts.length, 4);
  assert.match(admitted.manifest.authorizationDigest, /^[a-f0-9]{64}$/);
  assert.equal(admitted.manifest.authorizationDigest, admitted.manifest.expectedAuthorizationDigest);
  assert.equal(admitted.manifest.authorizationArtifactPath, authorizationPath);
  assert.equal(admitted.manifest.schemaVersion, 'preschool-reference-trial-attempt-manifest-v3');
  assert.equal(
    admitted.manifest.roleSpecificParticipantBindings.solution.lockSha256,
    TEST_SOLUTION_PARTICIPANT_BINDING_LOCK_SHA256,
  );
  assert.equal(
    admitted.manifest.roleSpecificParticipantBindings.downstream.lockSha256,
    TEST_PARTICIPANT_BINDING_LOCK_SHA256,
  );
  assert.deepEqual(
    JSON.parse(await readFile(join(admitted.outputRoot, 'solution-participant-binding-lock.json'), 'utf8')),
    TEST_SOLUTION_PARTICIPANT_BINDING_LOCK,
  );
  assert.deepEqual(
    JSON.parse(await readFile(join(admitted.outputRoot, 'downstream-participant-binding-lock.json'), 'utf8')),
    TEST_PARTICIPANT_BINDING_LOCK,
  );
  const admittedManifestPath = join(admitted.outputRoot, 'attempt-manifest.json');

  // A valid admission can advance into the lifecycle without binding or invoking a Participant.
  admitted.manifest.state = 'RUNNING';
  await writeAttemptManifest(admittedManifestPath, admitted.manifest);
  admitted.manifest.currentStage = 'PREPARATION';
  await writeAttemptManifest(admittedManifestPath, admitted.manifest);
  assert.equal(JSON.parse(await readFile(admittedManifestPath, 'utf8')).state, 'RUNNING');

  const failure = new Error('synthetic preflight stop after authorization admission');
  await assert.rejects(
    finalizeReferenceTrialFailure(
      admittedManifestPath,
      admitted.manifest,
      failure,
      createAttemptManifestTransitionToken(admitted.manifest),
    ),
    error => error === failure,
  );
  const failedManifest = JSON.parse(await readFile(admittedManifestPath, 'utf8')) as Record<string, any>;
  assert.equal(failedManifest.state, 'FAILED');
  assert.equal(failedManifest.authorizationRef, 'human-authorization-000001');

  const currentHistory = await captureReferenceTrialLegacyHistory(trialRoot);
  const reusedPath = join(fixtureRoot, 'reused-authorization.json');
  const reusedDigest = await writeAuthorization(reusedPath, authorizationBody({
    acknowledgedLegacyHistory: currentHistory,
    attemptRef: 'attempt-000007',
    authorizationRef: 'human-authorization-000001',
  }));
  await assert.rejects(admitForTest({
    liveRepositoryRoot: fixtureRoot,
    attemptRef: 'attempt-000007',
    executionAuthorizationPath: reusedPath,
    expectedExecutionAuthorizationSha256: reusedDigest,
  }), /already consumed|already used/i);

  const nextPath = join(fixtureRoot, 'new-authorization.json');
  const nextDigest = await writeAuthorization(nextPath, authorizationBody({
    acknowledgedLegacyHistory: currentHistory,
    attemptRef: 'attempt-000007',
    authorizationRef: 'human-authorization-000002',
  }));
  const nextAdmission = await admitForTest({
    liveRepositoryRoot: fixtureRoot,
    attemptRef: 'attempt-000007',
    executionAuthorizationPath: nextPath,
    expectedExecutionAuthorizationSha256: nextDigest,
  });
  assert.equal(nextAdmission.manifest.authorizationRef, 'human-authorization-000002');
  const activeHistory = await captureReferenceTrialLegacyHistory(trialRoot);
  const activePath = join(fixtureRoot, 'active-attempt-authorization.json');
  const activeDigest = await writeAuthorization(activePath, authorizationBody({
    acknowledgedLegacyHistory: activeHistory,
    attemptRef: 'attempt-000008',
    authorizationRef: 'human-authorization-000003',
  }));
  await assert.rejects(admitForTest({
    liveRepositoryRoot: fixtureRoot,
    attemptRef: 'attempt-000008',
    executionAuthorizationPath: activePath,
    expectedExecutionAuthorizationSha256: activeDigest,
  }), /active attempt/i);

  const invalidFixture = join(root, 'invalid-authorization-fixture');
  await mkdir(invalidFixture, { recursive: true });
  const invalidTrialRoot = await createLegacyAttemptHistory(invalidFixture);
  const invalidHistory = await captureReferenceTrialLegacyHistory(invalidTrialRoot);
  const writeInvalid = async (name: string, body: Record<string, unknown>, digest?: string): Promise<{ path: string; expectedDigest: string }> => {
    const path = join(invalidFixture, `${name}.json`);
    const expectedDigest = await writeAuthorization(path, body, digest);
    return { path, expectedDigest };
  };
  const assertDenied = async (name: string, body: Record<string, unknown>, digest?: string, expectedDigestOverride?: string): Promise<void> => {
    const written = await writeInvalid(name, body, digest);
    await assert.rejects(admitForTest({
      liveRepositoryRoot: invalidFixture,
      attemptRef: 'attempt-000006',
      executionAuthorizationPath: written.path,
      expectedExecutionAuthorizationSha256: expectedDigestOverride ?? written.expectedDigest,
    }));
    await assert.rejects(readFile(join(invalidTrialRoot, 'attempts/attempt-000006/attempt-manifest.json')), { code: 'ENOENT' });
  };
  await assertDenied('wrong-run', authorizationBody({
    acknowledgedLegacyHistory: invalidHistory,
    attemptRef: 'attempt-000006',
    runRef: 'another-run',
  }));
  await assertDenied('wrong-attempt', authorizationBody({
    acknowledgedLegacyHistory: invalidHistory,
    attemptRef: 'attempt-000007',
  }));
  await assertDenied('bad-digest', authorizationBody({
    acknowledgedLegacyHistory: invalidHistory,
    attemptRef: 'attempt-000006',
  }), '0'.repeat(64));
  await assertDenied('wrong-human-expected-digest', authorizationBody({
    acknowledgedLegacyHistory: invalidHistory,
    attemptRef: 'attempt-000006',
  }), undefined, '0'.repeat(64));
  await assertDenied('wrong-binding-lock-digest', {
    ...authorizationBody({ acknowledgedLegacyHistory: invalidHistory, attemptRef: 'attempt-000006' }),
    solutionParticipantBindingLockSha256: '0'.repeat(64),
  });
  await assertDenied('wrong-downstream-binding-lock-digest', {
    ...authorizationBody({ acknowledgedLegacyHistory: invalidHistory, attemptRef: 'attempt-000006' }),
    downstreamParticipantBindingLockSha256: '0'.repeat(64),
  });
  await assertDenied('binding-core-identity-mismatch', authorizationBody({
    acknowledgedLegacyHistory: invalidHistory,
    attemptRef: 'attempt-000006',
    downstreamParticipantBindingLock: {
      ...TEST_PARTICIPANT_BINDING_LOCK,
      modelConfigured: 'gpt-6-sol',
    },
  }));
  const v2TerminalOnlyBody = {
    schemaVersion: 'preschool-reference-trial-execution-authorization-v2',
    authorizationRef: 'terminal-only-v2-authorization',
    runRef: 'preschool-pver-20260922231805-71297571',
    attemptRef: 'attempt-000006',
    authorizedAt: '2026-09-29T00:00:00.000Z',
    acknowledgedLegacyHistory: invalidHistory,
    participantBindingLock: TEST_PARTICIPANT_BINDING_LOCK,
    participantBindingLockSha256: TEST_PARTICIPANT_BINDING_LOCK_SHA256,
  };
  await assertDenied('terminal-only-v2-authorization', v2TerminalOnlyBody);
  await assertDenied('legacy-v1-authorization', {
    schemaVersion: 'preschool-reference-trial-execution-authorization-v1',
    authorizationRef: 'historical-v1-authorization',
    runRef: 'preschool-pver-20260922231805-71297571',
    attemptRef: 'attempt-000006',
    authorizedAt: '2026-09-29T00:00:00.000Z',
    acknowledgedLegacyHistory: invalidHistory,
  });
  await writeFile(join(invalidFixture, 'malformed.json'), '{not json');
  await assert.rejects(admitForTest({
    liveRepositoryRoot: invalidFixture,
    attemptRef: 'attempt-000006',
    executionAuthorizationPath: join(invalidFixture, 'malformed.json'),
    expectedExecutionAuthorizationSha256: '0'.repeat(64),
  }));

  const mismatchedHistory = await writeInvalid('history-mismatch', authorizationBody({
    acknowledgedLegacyHistory: { ...invalidHistory, attempts: [] },
    attemptRef: 'attempt-000006',
  }));
  await assert.rejects(admitForTest({
    liveRepositoryRoot: invalidFixture,
    attemptRef: 'attempt-000006',
    executionAuthorizationPath: mismatchedHistory.path,
    expectedExecutionAuthorizationSha256: mismatchedHistory.expectedDigest,
  }), /legacy history|history acknowledgement/i);
  await put(invalidFixture, `${REFERENCE_TRIAL_ROOT_PATH}/attempts/attempt-000008/unexpected.txt`, 'new unexpected history');
  const newHistory = await writeInvalid('new-history-mutation', authorizationBody({
    acknowledgedLegacyHistory: invalidHistory,
    attemptRef: 'attempt-000006',
  }));
  await assert.rejects(admitForTest({
    liveRepositoryRoot: invalidFixture,
    attemptRef: 'attempt-000006',
    executionAuthorizationPath: newHistory.path,
    expectedExecutionAuthorizationSha256: newHistory.expectedDigest,
  }), /legacy history|history acknowledgement/i);

  const driftFixture = join(root, 'binding-drift-admission-fixture');
  await mkdir(driftFixture, { recursive: true });
  const driftTrialRoot = await createLegacyAttemptHistory(driftFixture);
  const driftHistory = await captureReferenceTrialLegacyHistory(driftTrialRoot);
  const driftCases: Array<{
    name: string;
    solutionLock: ArtifactBackedReferenceParticipantBindingLockV2;
    downstreamLock: ReferenceParticipantBindingLockV1;
    message: string;
    resolverRole: 'solution' | 'downstream';
  }> = [
    {
      name: 'config',
      solutionLock: { ...TEST_SOLUTION_PARTICIPANT_BINDING_LOCK, ambientCodexConfigSha256: 'b'.repeat(64) },
      downstreamLock: { ...TEST_PARTICIPANT_BINDING_LOCK, ambientCodexConfigSha256: 'b'.repeat(64) },
      message: 'ambient Codex config drift',
      resolverRole: 'solution',
    },
    {
      name: 'executable-path',
      solutionLock: { ...TEST_SOLUTION_PARTICIPANT_BINDING_LOCK, executableRealPath: '/synthetic/codex/other-codex' },
      downstreamLock: { ...TEST_PARTICIPANT_BINDING_LOCK, executableRealPath: '/synthetic/codex/other-codex' },
      message: 'executable real path drift',
      resolverRole: 'solution',
    },
    {
      name: 'executable-version',
      solutionLock: { ...TEST_SOLUTION_PARTICIPANT_BINDING_LOCK, executableVersion: 'codex synthetic-1.0.1' },
      downstreamLock: { ...TEST_PARTICIPANT_BINDING_LOCK, executableVersion: 'codex synthetic-1.0.1' },
      message: 'executable version drift',
      resolverRole: 'solution',
    },
    {
      name: 'solution-schema',
      solutionLock: {
        ...TEST_SOLUTION_PARTICIPANT_BINDING_LOCK,
        structuredResultDelivery: { ...TEST_SOLUTION_PARTICIPANT_BINDING_LOCK.structuredResultDelivery, receiptSchemaSha256: 'c'.repeat(64) },
      },
      downstreamLock: TEST_PARTICIPANT_BINDING_LOCK,
      message: 'artifact receipt schema drift',
      resolverRole: 'solution',
    },
    {
      name: 'downstream-schema',
      solutionLock: TEST_SOLUTION_PARTICIPANT_BINDING_LOCK,
      downstreamLock: {
        ...TEST_PARTICIPANT_BINDING_LOCK,
        nativeEnvelopeAssistance: { ...TEST_PARTICIPANT_BINDING_LOCK.nativeEnvelopeAssistance, schemaSha256: 'c'.repeat(64) },
      },
      message: 'native envelope schema drift',
      resolverRole: 'downstream',
    },
  ];
  for (const [index, drift] of driftCases.entries()) {
    const attemptRef = `attempt-${String(20 + index).padStart(6, '0')}`;
    const authorizationPath = join(driftFixture, `${drift.name}-authorization.json`);
    const digest = await writeAuthorization(authorizationPath, authorizationBody({
      acknowledgedLegacyHistory: driftHistory,
      attemptRef,
      solutionParticipantBindingLock: drift.solutionLock,
      downstreamParticipantBindingLock: drift.downstreamLock,
    }));
    await assert.rejects(admitReferenceTrialAttempt({
      liveRepositoryRoot: driftFixture,
      attemptRef,
      executionAuthorizationPath: authorizationPath,
      expectedExecutionAuthorizationSha256: digest,
    }, async () => {
      if (drift.resolverRole === 'downstream') throw new Error(drift.message);
      return {} as never;
    }, async () => {
      if (drift.resolverRole === 'solution') throw new Error(drift.message);
      return {} as never;
    }), new RegExp(drift.message));
    await assert.rejects(
      readFile(join(driftTrialRoot, 'attempts', attemptRef, 'attempt-manifest.json')),
      { code: 'ENOENT' },
    );
  }
}

async function testConcurrentProductionAttemptAdmission(root: string): Promise<void> {
  const fixtureRoot = join(root, 'concurrent-production-admission-fixture');
  await mkdir(fixtureRoot, { recursive: true });
  const trialRoot = await createLegacyAttemptHistory(fixtureRoot);
  const initialHistory = await captureReferenceTrialLegacyHistory(trialRoot);
  const attempts = ['attempt-000006', 'attempt-000007'] as const;
  const authorizations = await Promise.all(attempts.map(async (attemptRef, index) => {
    const executionAuthorizationPath = join(fixtureRoot, `${attemptRef}-authorization.json`);
    const expectedExecutionAuthorizationSha256 = await writeAuthorization(
      executionAuthorizationPath,
      authorizationBody({
        acknowledgedLegacyHistory: initialHistory,
        attemptRef,
        authorizationRef: `concurrent-human-authorization-${index + 1}`,
      }),
    );
    return { attemptRef, executionAuthorizationPath, expectedExecutionAuthorizationSha256 };
  }));
  let participantBindingCalls = 0;
  let artifactBackedBindingCalls = 0;
  const results = await Promise.all(authorizations.map(authorization => runPreschoolReferenceTrial({
    liveRepositoryRoot: fixtureRoot,
    attemptRef: authorization.attemptRef,
    executionAuthorizationPath: authorization.executionAuthorizationPath,
    expectedExecutionAuthorizationSha256: authorization.expectedExecutionAuthorizationSha256,
    evidencePath: join(fixtureRoot, 'missing-accepted-evidence.json'),
  }, {
    resolveReferenceParticipantBindingFromLock: async input => {
      participantBindingCalls += 1;
      return testBindingLockResolver(input);
    },
    resolveArtifactBackedReferenceParticipantBindingFromLock: async input => {
      artifactBackedBindingCalls += 1;
      return testArtifactBackedBindingLockResolver(input);
    },
  })));

  assert.equal(
    results.filter(result => result.status === 'REFERENCE_EVIDENCE_UNAVAILABLE').length,
    1,
    'concurrent admission must produce exactly one evidence-unavailable result',
  );
  assert.equal(
    results.filter(result => result.status === 'REFERENCE_EXECUTION_AUTHORIZATION_UNAVAILABLE').length,
    1,
    'concurrent admission must produce exactly one execution-authorization-unavailable result',
  );
  assert.equal(participantBindingCalls, 1, 'concurrent admission must invoke downstream binding exactly once');
  assert.equal(artifactBackedBindingCalls, 1, 'concurrent admission must invoke artifact-backed binding exactly once');
  const afterHistory = await captureReferenceTrialLegacyHistory(trialRoot);
  assert.deepEqual(afterHistory.attempts.slice(0, initialHistory.attempts.length), initialHistory.attempts);
  assert.deepEqual(afterHistory.runLevelMaterial, initialHistory.runLevelMaterial);
  const createdAttempts = afterHistory.attempts.filter(item => !initialHistory.attempts.some(before => before.attemptRef === item.attemptRef));
  assert.equal(createdAttempts.length, 1, 'concurrent admission must create exactly one attempt');
  assert.equal(createdAttempts[0]!.manifestPresent, true);
  assert.equal(createdAttempts[0]!.manifestState, 'STOPPED');
  const activeAttempts = afterHistory.attempts.filter(item => item.manifestState === 'CREATED' || item.manifestState === 'RUNNING');
  assert.ok(activeAttempts.length <= 1);
  assert.notEqual(
    createdAttempts[0]!.attemptRef,
    attempts.find(attemptRef => attemptRef !== createdAttempts[0]!.attemptRef),
  );
}

async function testCurrentV4AuthorityOverlay(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'preschool-current-v4-overlay-'));
  const liveRoot = join(root, 'live');
  const baselineRoot = join(root, 'baseline');
  try {
    await mkdir(liveRoot, { recursive: true });
    await mkdir(baselineRoot, { recursive: true });
    for (const path of [...AUTHORITY_PATHS, ACCEPTED_DESIGN_PATH]) {
      await put(liveRoot, path, await readFile(join(process.cwd(), path), 'utf8'));
    }

    await overlayReferenceTrialAuthority(liveRoot, baselineRoot);
    for (const path of AUTHORITY_PATHS) {
      assert.equal(
        await readFile(join(baselineRoot, path), 'utf8'),
        await readFile(join(liveRoot, path), 'utf8'),
        `the reference overlay should accept and preserve current v4 authority file ${path}`,
      );
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

export async function runPreschoolAutonomousAuthoringReferenceTrialTests(): Promise<void> {
  const strictIntegrationRequired = process.env.PRESCHOOL_REFERENCE_TRIAL_INTEGRATION_REQUIRED === '1';
  const acceptedEvidenceTestPath = strictIntegrationRequired
    ? process.env.PRESCHOOL_REFERENCE_CAPACITY_EVIDENCE_PATH : undefined;
  const acceptedObservableTestPath = strictIntegrationRequired
    ? process.env.PRESCHOOL_REFERENCE_OBSERVABLE_PAYLOAD_PATH : undefined;
  const acceptedBriefTestPath = strictIntegrationRequired
    ? process.env.PRESCHOOL_REFERENCE_RESPONSIBILITY_BRIEF_PATH : undefined;
  if (strictIntegrationRequired && (!acceptedEvidenceTestPath || !acceptedObservableTestPath || !acceptedBriefTestPath)) {
    throw new Error('strict historical external-input integration requires all three accepted input paths');
  }
  testReferenceResponsibilityBriefContract();
  testReferenceResponsibilityPreservation();
  testQualifiedLayerAResult();
  await testCurrentV4AuthorityOverlay();
  assert.equal(
    PRESCHOOL_REFERENCE_TRIAL_ACCEPTED_EVIDENCE_SHA256,
    'b7adb3af9c32c7476186dadd592b82410b08ac9f0784df11495b5c4ebd3d74d3',
  );
  assert.equal(
    PRESCHOOL_REFERENCE_TRIAL_ACCEPTED_SEALED_OBSERVABLE_PAYLOAD_SHA256,
    'd91231e2967e75bf508d276c3163fc6ca5fcd2cbeba21db71132b3374b676ab4',
  );

  const root = await mkdtemp(join(tmpdir(), 'preschool-reference-trial-test-'));
  try {
    await testRetransmissionPromptPersistedBeforeSend(root);
    await testAuthorizationCandidateBuilder(root);
    await testExecutionAuthorizationAdmission(root);
    await testConcurrentProductionAttemptAdmission(root);
    await testAttemptManifestLifecycle(root);
    await testRetransmissionPromptFinalizationGate(root);
    const syntheticBrief = validatePreschoolReferenceResponsibilityBrief({
      schemaVersion: 'preschool-reference-responsibility-brief-v1',
      runRef: 'preschool-pver-20260922231805-71297571',
      responsibilities: [{
        responsibilityRef: 'reference-responsibility-000001',
        primaryLifeFunction: 'Shared play',
        playerVisibleNeed: 'A child needs a shared play experience.',
      }],
    });
    const syntheticBriefBytes = Buffer.from(canonicalJson(syntheticBrief));
    const syntheticBriefPath = join(root, 'synthetic-brief.json');
    await writeFile(syntheticBriefPath, syntheticBriefBytes);
    assert.deepEqual(await readAcceptedPreschoolReferenceResponsibilityBrief(null), {
      ok: false,
      reason: 'Reference Responsibility Brief path was not supplied.',
    });
    assert.deepEqual(await readAcceptedPreschoolReferenceResponsibilityBrief(join(root, 'absent-brief.json')), {
      ok: false,
      reason: 'Reference Responsibility Brief file could not be read.',
    });
    assert.deepEqual(await readAcceptedPreschoolReferenceResponsibilityBrief(syntheticBriefPath), {
      ok: false,
      reason: 'Reference Responsibility Brief digest did not match the accepted digest.',
    });
    const malformedBriefPath = join(root, 'malformed-brief.json');
    await writeFile(malformedBriefPath, '{invalid json');
    assert.deepEqual(await readAcceptedPreschoolReferenceResponsibilityBrief(malformedBriefPath), {
      ok: false,
      reason: 'Reference Responsibility Brief is malformed JSON.',
    });
    const invalidBriefPath = join(root, 'invalid-brief.json');
    await writeFile(invalidBriefPath, '{}');
    assert.deepEqual(await readAcceptedPreschoolReferenceResponsibilityBrief(invalidBriefPath), {
      ok: false,
      reason: 'Reference Responsibility Brief schema or runRef is invalid.',
    });
    if (acceptedBriefTestPath) {
      const accepted = await readAcceptedPreschoolReferenceResponsibilityBrief(acceptedBriefTestPath);
      if (!accepted.ok) throw new Error(accepted.reason);
      assert.deepEqual(accepted.value.bytes, await readFile(acceptedBriefTestPath));
      assert.equal(accepted.value.sha256, '864f99ffa26d41631e329c229a7289bef2e9998fe04eb4c25ef51dcf5b99980a');
      assert.equal(accepted.value.brief.responsibilities.length, 5);
    }
    const syntheticAcceptedBrief = {
      brief: syntheticBrief,
      bytes: syntheticBriefBytes,
      sha256: sha256Hex(syntheticBriefBytes),
    };
    const currentRoot = join(root, 'current');
    const historicalRoot = join(root, 'historical');
    const packetPath = 'source/reference-trial/autonomous-authoring-contract-packet.json';
    const syntheticPayloadBytes = Buffer.from(`${JSON.stringify({
      transcriptVersion: 'player-observable-v1',
      surfaceId: 'headless-api-player-v1',
      transcriptId: 'synthetic-preschool-visible',
      entries: [{
        entryId: 'entry-000001',
        kind: 'story_event',
        age: 5,
        title: '一起搭小桥',
        body: '你和同伴一起搭起小桥。',
        experienceContext: {
          schemaVersion: 'experience-semantic-context-v1',
          experienceCategory: 'passive',
          expectedExperienceSignals: ['shared_play'],
        },
      }],
    }, null, 2)}\n`);
    const syntheticPayloadSha = createHash('sha256').update(syntheticPayloadBytes).digest('hex');
    const syntheticPayloadPath = join(root, 'synthetic-observable-payload.json');
    await writeFile(syntheticPayloadPath, syntheticPayloadBytes);
    assert.equal(await readExactReferenceObservablePayload(syntheticPayloadPath, syntheticPayloadSha) instanceof Buffer, true);
    assert.equal(await readExactReferenceObservablePayload(join(root, 'missing-observable.json'), syntheticPayloadSha), null);
    assert.equal(await readExactReferenceObservablePayload(syntheticPayloadPath, PRESCHOOL_REFERENCE_TRIAL_ACCEPTED_SEALED_OBSERVABLE_PAYLOAD_SHA256), null);
    const malformedPayloadPath = join(root, 'malformed-observable.json');
    await writeFile(malformedPayloadPath, '{invalid json');
    assert.equal(await readExactReferenceObservablePayload(malformedPayloadPath, createHash('sha256').update('{invalid json').digest('hex')), null);
    const invalidPayloadPath = join(root, 'invalid-observable.json');
    await writeFile(invalidPayloadPath, '{}');
    assert.equal(await readExactReferenceObservablePayload(invalidPayloadPath, createHash('sha256').update('{}').digest('hex')), null);

    const fullBrief = validatePreschoolReferenceResponsibilityBrief({
      schemaVersion: 'preschool-reference-responsibility-brief-v1',
      runRef: 'preschool-pver-20260922231805-71297571',
      responsibilities: ['Shared play', 'Shared repair', 'Shared care', 'Participation', 'Belonging'].map((primaryLifeFunction, index) => ({
        responsibilityRef: `reference-responsibility-${String(index + 1).padStart(6, '0')}`,
        primaryLifeFunction,
        playerVisibleNeed: `A preschool child needs ${primaryLifeFunction.toLowerCase()} in ordinary shared life.`,
      })),
    });
    const fullBriefBytes = Buffer.from(canonicalJson(fullBrief));
    const fullBriefPath = join(root, 'synthetic-full-brief.json');
    await writeFile(fullBriefPath, fullBriefBytes);
    const capacityEvidenceBytes = Buffer.from(canonicalJson(syntheticCapacityEvidence()));
    const capacityEvidencePath = join(root, 'synthetic-capacity-evidence.json');
    await writeFile(capacityEvidencePath, capacityEvidenceBytes);
    await testArtifactBackedSolutionProbeHistoryContainment(root, {
      evidencePath: capacityEvidencePath,
      observablePayloadPath: syntheticPayloadPath,
      responsibilityBriefPath: fullBriefPath,
      evidenceSha256: sha256Hex(capacityEvidenceBytes),
      observableSha256: sha256Hex(syntheticPayloadBytes),
      responsibilityBriefSha256: sha256Hex(fullBriefBytes),
    });
    const syntheticRunner = await loadSyntheticPublicRunner(root, {
      evidence: sha256Hex(capacityEvidenceBytes),
      observable: sha256Hex(syntheticPayloadBytes),
      brief: sha256Hex(fullBriefBytes),
    });
    const syntheticAcceptedBriefFixture = {
      brief: fullBrief,
      bytes: fullBriefBytes,
      sha256: sha256Hex(fullBriefBytes),
    };
    await testSyntheticLayerAEndToEnd(root, {
      evidence: capacityEvidencePath,
      observable: syntheticPayloadPath,
      brief: fullBriefPath,
    }, 'revision-participant-failure', syntheticRunner, syntheticAcceptedBriefFixture);
    await testSyntheticLayerAEndToEnd(root, {
      evidence: capacityEvidencePath,
      observable: syntheticPayloadPath,
      brief: fullBriefPath,
    }, 'rereview-participant-failure', syntheticRunner, syntheticAcceptedBriefFixture);
    await testSyntheticLayerAEndToEnd(root, {
      evidence: capacityEvidencePath,
      observable: syntheticPayloadPath,
      brief: fullBriefPath,
    }, 'revision-insufficient-evidence-terminal', syntheticRunner, syntheticAcceptedBriefFixture);
    await testSyntheticLayerAEndToEnd(root, {
      evidence: capacityEvidencePath,
      observable: syntheticPayloadPath,
      brief: fullBriefPath,
    }, 'revision-escalate-terminal', syntheticRunner, syntheticAcceptedBriefFixture);
    await testSyntheticLayerAEndToEnd(root, {
      evidence: capacityEvidencePath,
      observable: syntheticPayloadPath,
      brief: fullBriefPath,
    }, 'reviewer-second-request-more-work-terminal', syntheticRunner, syntheticAcceptedBriefFixture);
    await testSyntheticLayerAEndToEnd(root, {
      evidence: capacityEvidencePath,
      observable: syntheticPayloadPath,
      brief: fullBriefPath,
    }, 'reviewer-request-more-work-continuation', syntheticRunner, syntheticAcceptedBriefFixture);
    for (const scenario of [
      'continuation-create-only-collision',
      'continuation-authorization-drift',
      'continuation-history-drift',
      'reviewer-reject',
      'reviewer-defer',
    ] as const) {
      await testSyntheticLayerAEndToEnd(root, {
        evidence: capacityEvidencePath,
        observable: syntheticPayloadPath,
        brief: fullBriefPath,
      }, scenario, syntheticRunner, syntheticAcceptedBriefFixture);
    }
    const revisionPromptContaminatedRunner = await loadSyntheticPublicRunner(root, {
      evidence: sha256Hex(capacityEvidenceBytes),
      observable: sha256Hex(syntheticPayloadBytes),
      brief: sha256Hex(fullBriefBytes),
    }, { suffix: 'revision-prompt-contamination', solutionRevisionStaticPromptMarker: ANSWER_IDS[0] });
    await testSyntheticLayerAEndToEnd(root, {
      evidence: capacityEvidencePath,
      observable: syntheticPayloadPath,
      brief: fullBriefPath,
    }, 'revision-prompt-contamination', revisionPromptContaminatedRunner, syntheticAcceptedBriefFixture);
    await testSyntheticLayerAEndToEnd(root, {
      evidence: capacityEvidencePath,
      observable: syntheticPayloadPath,
      brief: fullBriefPath,
    }, 'unauthorized-shadow-path', syntheticRunner, syntheticAcceptedBriefFixture);
    await testSyntheticLayerAEndToEnd(root, {
      evidence: capacityEvidencePath,
      observable: syntheticPayloadPath,
      brief: fullBriefPath,
    }, 'residual-v5-deficit', syntheticRunner, syntheticAcceptedBriefFixture);
    await testSyntheticLayerAEndToEnd(root, {
      evidence: capacityEvidencePath,
      observable: syntheticPayloadPath,
      brief: fullBriefPath,
    }, 'shadow-participant-failure', syntheticRunner, syntheticAcceptedBriefFixture);
    await testSyntheticLayerAEndToEnd(root, {
      evidence: capacityEvidencePath,
      observable: syntheticPayloadPath,
      brief: fullBriefPath,
    }, 'participant-failure', syntheticRunner, syntheticAcceptedBriefFixture);
    await testSyntheticLayerAEndToEnd(root, {
      evidence: capacityEvidencePath,
      observable: syntheticPayloadPath,
      brief: fullBriefPath,
    }, 'omitted-responsibility', syntheticRunner, syntheticAcceptedBriefFixture);
    await testSyntheticLayerAEndToEnd(root, {
      evidence: capacityEvidencePath,
      observable: syntheticPayloadPath,
      brief: fullBriefPath,
    }, 'reviewer-contract-escalation', syntheticRunner, syntheticAcceptedBriefFixture);
    await testSyntheticLayerAEndToEnd(root, {
      evidence: capacityEvidencePath,
      observable: syntheticPayloadPath,
      brief: fullBriefPath,
    }, 'binding-drift-at-invocation', syntheticRunner, syntheticAcceptedBriefFixture);
    await testSyntheticLayerAEndToEnd(root, {
      evidence: capacityEvidencePath,
      observable: syntheticPayloadPath,
      brief: fullBriefPath,
    }, 'history-drift-at-binding', syntheticRunner, syntheticAcceptedBriefFixture);
    for (const scenario of [
      'reviewer-process-failure',
      'authorization-drift-after-solution',
      'binding-lock-drift-after-reviewer',
      'history-drift-after-shadow',
      'preparation-stale-authority',
    ] as const) {
      await testSyntheticLayerAEndToEnd(root, {
        evidence: capacityEvidencePath,
        observable: syntheticPayloadPath,
        brief: fullBriefPath,
      }, scenario, syntheticRunner, syntheticAcceptedBriefFixture);
    }
    await testSyntheticLayerAEndToEnd(root, {
      evidence: capacityEvidencePath,
      observable: join(root, 'missing-admitted-observable.json'),
      brief: fullBriefPath,
    }, 'preflight-observable-unavailable', syntheticRunner, syntheticAcceptedBriefFixture);
    await testSyntheticLayerAEndToEnd(root, {
      evidence: capacityEvidencePath,
      observable: syntheticPayloadPath,
      brief: join(root, 'missing-admitted-brief.json'),
    }, 'preflight-brief-missing', syntheticRunner, syntheticAcceptedBriefFixture);
    await testSyntheticLayerAEndToEnd(root, {
      evidence: capacityEvidencePath,
      observable: syntheticPayloadPath,
      brief: syntheticBriefPath,
    }, 'preflight-brief-digest-mismatch', syntheticRunner, syntheticAcceptedBriefFixture);
    const invalidBriefSchemaBytes = Buffer.from('{}');
    const invalidBriefSchemaPath = join(root, 'invalid-admitted-brief-schema.json');
    await writeFile(invalidBriefSchemaPath, invalidBriefSchemaBytes);
    const invalidBriefSchemaRunner = await loadSyntheticPublicRunner(root, {
      evidence: sha256Hex(capacityEvidenceBytes),
      observable: sha256Hex(syntheticPayloadBytes),
      brief: sha256Hex(invalidBriefSchemaBytes),
    }, { suffix: 'invalid-brief-schema' });
    await testSyntheticLayerAEndToEnd(root, {
      evidence: capacityEvidencePath,
      observable: syntheticPayloadPath,
      brief: invalidBriefSchemaPath,
    }, 'preflight-brief-invalid-schema', invalidBriefSchemaRunner, syntheticAcceptedBriefFixture);
    await testSyntheticLayerAEndToEnd(root, {
      evidence: capacityEvidencePath,
      observable: syntheticPayloadPath,
      brief: fullBriefPath,
    }, 'solution-id-prefix-collision', syntheticRunner, {
      brief: fullBrief,
      bytes: fullBriefBytes,
      sha256: sha256Hex(fullBriefBytes),
    });
    await testSyntheticLayerAEndToEnd(root, {
      evidence: capacityEvidencePath,
      observable: syntheticPayloadPath,
      brief: fullBriefPath,
    }, 'solution-exact-answer-id', syntheticRunner, {
      brief: fullBrief,
      bytes: fullBriefBytes,
      sha256: sha256Hex(fullBriefBytes),
    });
    const reviewerStaticMarkerRunner = await loadSyntheticPublicRunner(root, {
      evidence: sha256Hex(capacityEvidenceBytes),
      observable: sha256Hex(syntheticPayloadBytes),
      brief: sha256Hex(fullBriefBytes),
    }, {
      suffix: 'reviewer-static-marker',
      reviewerStaticPromptMarker: ANSWER_IDS[0],
    });
    await testSyntheticLayerAEndToEnd(root, {
      evidence: capacityEvidencePath,
      observable: syntheticPayloadPath,
      brief: fullBriefPath,
    }, 'reviewer-static-answer-marker', reviewerStaticMarkerRunner, {
      brief: fullBrief,
      bytes: fullBriefBytes,
      sha256: sha256Hex(fullBriefBytes),
    });
    for (const scenario of [
      'reviewer-schema-correction',
      'shadow-schema-correction',
      'reviewer-role-crossover',
      'shadow-role-crossover',
    ] as const) {
      await testSyntheticLayerAEndToEnd(root, {
        evidence: capacityEvidencePath,
        observable: syntheticPayloadPath,
        brief: fullBriefPath,
      }, scenario, syntheticRunner, syntheticAcceptedBriefFixture);
    }
    const continuationMarkerRunner = await loadSyntheticPublicRunner(root, {
      evidence: sha256Hex(capacityEvidenceBytes),
      observable: sha256Hex(syntheticPayloadBytes),
      brief: sha256Hex(fullBriefBytes),
    }, {
      suffix: 'reviewer-continuation-marker',
      continuationPromptMarker: ANSWER_IDS[0],
    });
    await testSyntheticLayerAEndToEnd(root, {
      evidence: capacityEvidencePath,
      observable: syntheticPayloadPath,
      brief: fullBriefPath,
    }, 'reviewer-continuation-answer-marker', continuationMarkerRunner, syntheticAcceptedBriefFixture);
    for (const role of ['reviewer', 'shadow'] as const) {
      for (const fault of ['missing', 'duplicated', 'misplaced'] as const) {
        const scenario = `${role}-initial-fragment-${fault}` as SyntheticLayerAScenario;
        const suffix = `${role}-initial-fragment-${fault}`;
        const faultRunner = await loadSyntheticPublicRunner(root, {
          evidence: sha256Hex(capacityEvidenceBytes),
          observable: sha256Hex(syntheticPayloadBytes),
          brief: sha256Hex(fullBriefBytes),
        }, role === 'reviewer'
          ? { suffix, reviewerTrustedFragmentFault: fault }
          : { suffix, shadowTrustedFragmentFault: fault });
        await testSyntheticLayerAEndToEnd(root, {
          evidence: capacityEvidencePath,
          observable: syntheticPayloadPath,
          brief: fullBriefPath,
        }, scenario, faultRunner, syntheticAcceptedBriefFixture);
      }
    }
    for (const scenario of ['artifact-backed-role-schema-failure', 'artifact-backed-receipt-failure'] as const) {
      await testSyntheticLayerAEndToEnd(root, {
        evidence: capacityEvidencePath,
        observable: syntheticPayloadPath,
        brief: fullBriefPath,
      }, scenario, syntheticRunner, {
        ...syntheticAcceptedBriefFixture,
      });
    }
    await testSyntheticLayerAEndToEnd(root, {
      evidence: capacityEvidencePath,
      observable: syntheticPayloadPath,
      brief: fullBriefPath,
    }, 'success', syntheticRunner, syntheticAcceptedBriefFixture);

    const currentAuthorityText = HISTORICAL_PRESCHOOL_AUTHORITY_FIXTURE;
    for (const [index, path] of AUTHORITY_PATHS.entries()) {
      await put(currentRoot, path, `${currentAuthorityText[index]}\nPD-121 current authority\n`);
      await put(historicalRoot, path, `${path}\nhistorical authority\n`);
    }
    await put(currentRoot, ACCEPTED_DESIGN_PATH, await readFile(join(process.cwd(), ACCEPTED_DESIGN_PATH), 'utf8'));
    await put(currentRoot, RESIDUAL_DESIGN_PATH, `later approved design\n${ANSWER_IDS.join('\n')}\n`);
    await put(currentRoot, 'src/data/lines/preschool-passive-spine.json', JSON.stringify({ entries: ANSWER_IDS.map(id => ({ id })) }));
    await put(currentRoot, 'tests/preschoolPassiveSpineTests.ts', `current tests ${ANSWER_IDS.join(' ')}`);
    await put(currentRoot, 'tests/annualPassiveMemoryTests.ts', `current annual tests ${ANSWER_IDS.join(' ')}`);
    await put(currentRoot, 'artifacts/evolution/later-pver/observations.json', `later PVER ${ANSWER_IDS.join(' ')}`);

    await put(historicalRoot, 'src/data/lines/preschool-passive-spine.json', JSON.stringify({ entries: [{ id: 'historical_safe_entry' }] }));
    await put(historicalRoot, 'src/data/infantPassiveNarrativeCatalog.ts', 'identical historical catalog bytes');
    await put(historicalRoot, 'tests/preschoolPassiveSpineTests.ts', 'historical preschool tests');
    await put(historicalRoot, 'tests/annualPassiveMemoryTests.ts', 'historical annual tests');
    await put(historicalRoot, RESIDUAL_DESIGN_PATH, `forbidden residual design ${ANSWER_IDS.join(' ')}`);
    await put(historicalRoot, ACCEPTED_DESIGN_PATH, `accepted design reference section ${ANSWER_IDS.join(' ')}`);
    await put(historicalRoot, 'artifacts/evolution/later-pver/observations.json', `later PVER ${ANSWER_IDS.join(' ')}`);

    await overlayReferenceTrialAuthority(currentRoot, historicalRoot);

    const legacyOutputFixtureRoot = join(root, 'legacy-output-fixture');
    assert.equal(
      await createPreschoolReferenceTrialOutputRoot(legacyOutputFixtureRoot),
      join(legacyOutputFixtureRoot, REFERENCE_TRIAL_ROOT_PATH),
    );

    const identityRoot = join(root, 'attempt-identity-fixture');
    const legacyAttemptRoot = join(identityRoot, REFERENCE_TRIAL_ROOT_PATH);
    const legacyHypothesis = Buffer.from('legacy attempt one hypothesis bytes\n');
    const legacyLog = Buffer.from('legacy attempt one log bytes\n');
    await put(
      identityRoot,
      join(REFERENCE_TRIAL_ROOT_PATH, 'source/reference-trial/improvement-hypothesis.json'),
      legacyHypothesis.toString('utf8'),
    );
    await put(
      identityRoot,
      join(REFERENCE_TRIAL_ROOT_PATH, 'trial-cli-output.log'),
      legacyLog.toString('utf8'),
    );

    const attemptTwoRoot = await createPreschoolReferenceTrialOutputRoot(identityRoot, 'attempt-000002');
    assert.equal(attemptTwoRoot, join(legacyAttemptRoot, 'attempts', 'attempt-000002'));
    await put(attemptTwoRoot, 'source/reference-trial/improvement-hypothesis.json', 'attempt two hypothesis bytes\n');
    await put(attemptTwoRoot, 'trial-cli-output.log', 'attempt two log bytes\n');
    assert.deepEqual((await listFiles(attemptTwoRoot)).sort(), [
      'source/reference-trial/improvement-hypothesis.json',
      'trial-cli-output.log',
    ]);
    await assert.rejects(
      createPreschoolReferenceTrialOutputRoot(identityRoot, 'attempt-000002'),
      /EEXIST/,
    );
    const attemptThreeRoot = await createPreschoolReferenceTrialOutputRoot(identityRoot, 'attempt-000003');
    assert.equal(attemptThreeRoot, join(legacyAttemptRoot, 'attempts', 'attempt-000003'));
    assert.deepEqual((await readdir(join(legacyAttemptRoot, 'attempts'))).sort(), ['attempt-000002', 'attempt-000003']);
    assert.deepEqual(await readFile(join(legacyAttemptRoot, 'source/reference-trial/improvement-hypothesis.json')), legacyHypothesis);
    assert.deepEqual(await readFile(join(legacyAttemptRoot, 'trial-cli-output.log')), legacyLog);

    const unsafeAttemptRefs = ['../attempt-000002', '/absolute/path', 'attempt-2', 'attempt-000002/foo', ''];
    for (const unsafeAttemptRef of unsafeAttemptRefs) {
      await assert.rejects(
        createPreschoolReferenceTrialOutputRoot(identityRoot, unsafeAttemptRef),
        /Invalid reference trial attemptRef/,
      );
    }
    assert.equal(
      referenceTrialInvocationRef('attempt-000002', 'solution'),
      'preschool-pver-20260922231805-71297571/attempt-000002/solution-000001',
    );
    assert.equal(
      referenceTrialInvocationRef('attempt-000002', 'reviewer'),
      'preschool-pver-20260922231805-71297571/attempt-000002/reviewer-000001',
    );
    assert.equal(
      referenceTrialInvocationRef('attempt-000002', 'shadow-authoring'),
      'preschool-pver-20260922231805-71297571/attempt-000002/shadow-authoring',
    );
    assert.equal(
      referenceTrialInvocationRef(null, 'solution'),
      'preschool-pver-20260922231805-71297571-solution-000001',
    );

    const cliRoot = join(root, 'attempt-ref-cli');
    await mkdir(cliRoot, { recursive: true });
    const originalWorkingDirectory = process.cwd();
    process.chdir(cliRoot);
    try {
      const originalStdoutWrite = process.stdout.write;
      let invalidAttemptOutput = '';
      process.stdout.write = ((chunk: unknown) => {
        invalidAttemptOutput += String(chunk);
        return true;
      }) as typeof process.stdout.write;
      let invalidAttemptCode: number;
      try {
        invalidAttemptCode = await runPreschoolReferenceTrialCli([
          '--evidence', join(root, 'missing-cli-evidence.json'),
          '--attempt-ref', '../attempt-000002',
        ]);
      } finally {
        process.stdout.write = originalStdoutWrite;
      }
      assert.equal(invalidAttemptCode, 1);
      assert.equal(JSON.parse(invalidAttemptOutput).status, 'REFERENCE_EXECUTION_AUTHORIZATION_UNAVAILABLE');
      const cliStopCode = await runPreschoolReferenceTrialCli([
        '--evidence', join(root, 'missing-cli-evidence.json'),
        '--observable-payload', syntheticPayloadPath,
        '--responsibility-brief', syntheticBriefPath,
        '--attempt-ref', 'attempt-000002',
      ]);
      assert.equal(cliStopCode, 1);
      await assert.rejects(readdir(join(cliRoot, REFERENCE_TRIAL_ATTEMPTS_PATH)), { code: 'ENOENT' });
    } finally {
      process.chdir(originalWorkingDirectory);
    }

    const hostInputRoot = join(root, 'synthetic-host-inputs');
    const trialInputs = await writePreschoolReferenceTrialInputs({
      outputRoot: hostInputRoot,
      authorityRepositoryRoot: currentRoot,
      candidateBaselineRoot: historicalRoot,
      runRef: 'preschool-pver-20260922231805-71297571',
      observablePayloadBytes: syntheticPayloadBytes,
      responsibilityBrief: syntheticAcceptedBrief,
    });
    assert.equal(trialInputs.problemPackage.source.observablePayloadRef, 'source/reference-trial/observable-payload.json');
    assert.deepEqual(
      await readFile(join(hostInputRoot, 'source/reference-trial/reference-responsibility-brief.json')),
      syntheticBriefBytes,
    );
    assert.equal(
      trialInputs.artifactRelativePaths.includes('source/reference-trial/reference-responsibility-brief.json'),
      true,
    );
    const responsibilityAttestationPath = 'source/reference-trial/reference-responsibility-attestation.json';
    assert.deepEqual(
      JSON.parse(await readFile(join(hostInputRoot, responsibilityAttestationPath), 'utf8')),
      {
        schemaVersion: 'preschool-reference-responsibility-attestation-v1',
        runRef: 'preschool-pver-20260922231805-71297571',
        validationLayer: 'HISTORICAL_CONTROLLED_DOWNSTREAM_MECHANISM',
        responsibilityProvenance: 'HUMAN_APPROVED_REFERENCE_RESPONSIBILITIES',
        referenceResponsibilityBriefRef: 'source/reference-trial/reference-responsibility-brief.json',
        referenceResponsibilityBriefSha256: syntheticAcceptedBrief.sha256,
      },
    );
    assert.equal(trialInputs.artifactRelativePaths.includes(responsibilityAttestationPath), true);
    assert.equal(trialInputs.problemPackage.source.diagnosticEvidenceRefs.includes(responsibilityAttestationPath), false);
    if (acceptedBriefTestPath) {
      const accepted = await readAcceptedPreschoolReferenceResponsibilityBrief(acceptedBriefTestPath);
      if (!accepted.ok) throw new Error(accepted.reason);
      const acceptedInputRoot = join(root, 'accepted-brief-inputs');
      await writePreschoolReferenceTrialInputs({
        outputRoot: acceptedInputRoot,
        authorityRepositoryRoot: currentRoot,
        candidateBaselineRoot: historicalRoot,
        runRef: 'preschool-pver-20260922231805-71297571',
        observablePayloadBytes: syntheticPayloadBytes,
        responsibilityBrief: accepted.value,
      });
      const materializedBriefBytes = await readFile(
        join(acceptedInputRoot, 'source/reference-trial/reference-responsibility-brief.json'),
      );
      assert.deepEqual(materializedBriefBytes, await readFile(acceptedBriefTestPath));
      assert.equal(sha256Hex(materializedBriefBytes), accepted.value.sha256);
    }
    const materializedPayload = await readFile(join(hostInputRoot, 'source/reference-trial/observable-payload.json'));
    assert.deepEqual(materializedPayload, syntheticPayloadBytes);
    assert.equal(createHash('sha256').update(materializedPayload).digest('hex'), syntheticPayloadSha);
    assert.deepEqual(trialInputs.problemPackage.source.diagnosticEvidenceRefs, [
      'source/reference-trial/capacity-summary.json',
      'source/reference-trial/reference-source-attestation.json',
    ]);
    const attestation = JSON.parse(await readFile(join(hostInputRoot, 'source/reference-trial/reference-source-attestation.json'), 'utf8'));
    assert.deepEqual(attestation, {
      schemaVersion: 'preschool-reference-source-attestation-v1',
      runRef: 'preschool-pver-20260922231805-71297571',
      historicalBaselineGitSha: 'e80eecc868a6ca99f4a53ff5d2493a13b4c0a8bf',
      observablePayloadSha256: syntheticPayloadSha,
      verification: 'HOST_VERIFIED_FIXED_REFERENCE_CASE',
    });
    const attestationText = JSON.stringify(attestation);
    for (const forbidden of ['passiveEntryIds', 'eventHistoryAdded', 'source-fingerprint', 'internal/player-surface-source', 'seed', 'persona', ...ANSWER_IDS]) {
      assert.equal(attestationText.includes(forbidden), false, forbidden);
    }
    assert.deepEqual(trialInputs.problemPackage.problem.unknowns, [REFERENCE_HYPOTHESIS_UNKNOWN]);
    const storedHypotheses = parseStoredImprovementHypothesisSet(
      await readFile(join(hostInputRoot, 'source/reference-trial/improvement-hypothesis.json'), 'utf8'),
    );
    assert.equal(storedHypotheses.hypotheses.length, 1, 'reference trial must store exactly one hypothesis');
    assert.equal(storedHypotheses.hypotheses[0]?.unknowns.length, 1, 'stored reference hypothesis must contain exactly one unknown');
    assert.deepEqual(storedHypotheses.hypotheses[0]?.unknowns, trialInputs.problemPackage.problem.unknowns);
    for (const relativePath of trialInputs.artifactRelativePaths) {
      const participantInput = await readFile(join(hostInputRoot, relativePath), 'utf8');
      for (const answerId of ANSWER_IDS) assert.equal(participantInput.includes(answerId), false, relativePath);
    }
    for (const answerId of ANSWER_IDS) assert.equal(JSON.stringify(trialInputs.problemPackage).includes(answerId), false);

    const solutionWorkspace = await prepareReferenceTrialParticipantWorkspace({
      baselineRoot: historicalRoot,
      destinationRoot: join(root, 'solution-workspace'),
      jobKind: 'solution',
      artifactSourceRoot: hostInputRoot,
      artifactRelativePaths: trialInputs.artifactRelativePaths,
    });
    const reviewerWorkspace = await prepareReferenceTrialParticipantWorkspace({
      baselineRoot: historicalRoot,
      destinationRoot: join(root, 'reviewer-workspace'),
      jobKind: 'reviewer',
      artifactSourceRoot: hostInputRoot,
      artifactRelativePaths: trialInputs.artifactRelativePaths,
    });
    const shadowWorkspace = await prepareReferenceTrialParticipantWorkspace({
      baselineRoot: historicalRoot,
      destinationRoot: join(root, 'shadow-workspace'),
      jobKind: 'shadow-authoring',
      artifactSourceRoot: hostInputRoot,
      artifactRelativePaths: trialInputs.artifactRelativePaths,
    });

    for (const workspace of [solutionWorkspace.workspaceRoot, reviewerWorkspace.workspaceRoot, shadowWorkspace.workspaceRoot]) {
      const visibleFiles = await listFiles(workspace);
      assert.equal(visibleFiles.includes(RESIDUAL_DESIGN_PATH), false);
      assert.equal(visibleFiles.includes(ACCEPTED_DESIGN_PATH), false);
      assert.equal(visibleFiles.includes('artifacts/evolution/later-pver/observations.json'), false);
      assert.equal(visibleFiles.includes('tests/preschoolPassiveSpineTests.ts'), true);
      assert.equal(visibleFiles.includes('tests/annualPassiveMemoryTests.ts'), true);
      assert.equal(await readFile(join(workspace, 'tests/preschoolPassiveSpineTests.ts'), 'utf8'), 'historical preschool tests');
      assert.equal(await readFile(join(workspace, 'tests/annualPassiveMemoryTests.ts'), 'utf8'), 'historical annual tests');
      assert.equal(visibleFiles.includes(packetPath), true);
      assert.deepEqual(await readFile(join(workspace, 'source/reference-trial/observable-payload.json')), syntheticPayloadBytes);
      const visiblePayload = JSON.parse(await readFile(join(workspace, 'source/reference-trial/observable-payload.json'), 'utf8'));
      assert.equal(visiblePayload.entries[0].age, 5);
      assert.equal(visiblePayload.entries[0].body, '你和同伴一起搭起小桥。');
      assert.equal(visiblePayload.entries[0].experienceContext.experienceCategory, 'passive');
      assert.equal(visibleFiles.includes('source/reference-trial/reference-source-attestation.json'), true);
      assert.equal(visibleFiles.includes(responsibilityAttestationPath), true);
      for (const forbiddenPath of [
        'internal/player-surface-source.json',
        'provenance/source-fingerprint.json',
        'inputs/run-input.json',
        'inputs/persona.json',
      ]) assert.equal(visibleFiles.includes(forbiddenPath), false, forbiddenPath);
      for (const authorityPath of AUTHORITY_PATHS) {
        assert.equal(await readFile(join(workspace, authorityPath), 'utf8'), await readFile(join(currentRoot, authorityPath), 'utf8'));
      }
      const safeCatalog = await readFile(join(workspace, 'src/data/lines/preschool-passive-spine.json'), 'utf8');
      for (const id of ANSWER_IDS) assert.equal(safeCatalog.includes(id), false);
      const visiblePacket = JSON.parse(await readFile(join(workspace, packetPath), 'utf8')) as { contractId: string };
      assert.equal(visiblePacket.contractId, 'preschool-shared-neutral-passive-capacity-v1');
    }

    let participantBindingResolved = false;
    const stop = await runPreschoolReferenceTrial({
      liveRepositoryRoot: currentRoot,
      evidencePath: join(root, 'missing-accepted-evidence.json'),
    }, {
      resolveReferenceParticipantBindingFromLock: async () => {
        participantBindingResolved = true;
        throw new Error('must not resolve a Participant binding without fixed evidence');
      },
    });
    assert.deepEqual(stop, {
      schemaVersion: 'preschool-reference-trial-stop-v1',
      status: 'REFERENCE_EVIDENCE_UNAVAILABLE',
      runRef: 'preschool-pver-20260922231805-71297571',
      reason: 'Exact accepted chronology was not supplied; replay or evidence reconstruction is forbidden for this trial.',
    });
    assert.equal(participantBindingResolved, false);

    for (const unsafeAttemptRef of unsafeAttemptRefs) {
      const invalidAttemptStop = await runPreschoolReferenceTrial({
        liveRepositoryRoot: currentRoot,
        evidencePath: join(root, 'missing-accepted-evidence.json'),
        attemptRef: unsafeAttemptRef,
      });
      assert.equal(invalidAttemptStop.status, 'REFERENCE_EXECUTION_AUTHORIZATION_UNAVAILABLE');
    }

    const fabricatedEvidencePath = join(root, 'fabricated-but-well-formed-evidence.json');
    await writeFile(fabricatedEvidencePath, JSON.stringify({
      schemaVersion: 'preschool-capacity-evidence-v1',
      runRef: 'preschool-pver-20260922231805-71297571',
      evidenceMode: 'STRUCTURAL_EXHAUSTION',
      canonicalOriginTag: 'scholar',
      preConsumedEntryIds: [],
      beats: Array.from({ length: 30 }, (_, index) => ({
        sequence: index + 1,
        age: 4 + (index % 4),
        selectedEntryId: `fabricated-entry-${index + 1}`,
        kind: index < 4 ? 'GAP' : 'AUTHORED',
        legalUnconsumedCountBeforeSelection: index < 4 ? 0 : 1,
      })),
      demandBeats: 30,
      authoredBeats: 26,
      gapBeats: 4,
      foreignOriginLeakCount: 0,
      duplicateAuthoredCount: 0,
    }), 'utf8');
    let fabricatedEvidenceResolvedBinding = false;
    const fabricatedEvidenceStop = await runPreschoolReferenceTrial({
      liveRepositoryRoot: currentRoot,
      evidencePath: fabricatedEvidencePath,
      attemptRef: 'attempt-000002',
    }, {
      resolveReferenceParticipantBindingFromLock: async () => {
        fabricatedEvidenceResolvedBinding = true;
        throw new Error('must not resolve a Participant binding for unanchored evidence');
      },
    }).catch(() => null);
    assert.deepEqual(fabricatedEvidenceStop, stop);
    assert.equal(fabricatedEvidenceResolvedBinding, false);
    await assert.rejects(readdir(join(currentRoot, REFERENCE_TRIAL_ATTEMPTS_PATH)), { code: 'ENOENT' });

    if (acceptedEvidenceTestPath) {
      assert.equal(
        createHash('sha256').update(await readFile(acceptedEvidenceTestPath)).digest('hex'),
        PRESCHOOL_REFERENCE_TRIAL_ACCEPTED_EVIDENCE_SHA256,
      );
      await put(currentRoot, 'source/reference-trial/observable-summary.json', '{"diagnosticOnly":true}\n');
      for (const observablePayloadPath of [join(root, 'missing-observable.json'), syntheticPayloadPath]) {
        let resolvedBinding = false;
        const payloadStop = await runPreschoolReferenceTrial({
          liveRepositoryRoot: currentRoot,
          evidencePath: acceptedEvidenceTestPath,
          observablePayloadPath,
          attemptRef: 'attempt-000004',
        }, {
          resolveReferenceParticipantBindingFromLock: async () => {
            resolvedBinding = true;
            throw new Error('must not bind a Participant without the exact sealed observable payload');
          },
        });
        assert.deepEqual(payloadStop, {
          schemaVersion: 'preschool-reference-trial-stop-v1',
          status: 'REFERENCE_OBSERVABLE_PAYLOAD_UNAVAILABLE',
          runRef: 'preschool-pver-20260922231805-71297571',
          reason: 'Exact sealed player-visible reference payload was not supplied or did not match the accepted digest.',
        });
        assert.equal(resolvedBinding, false);
        await assert.rejects(readdir(join(currentRoot, REFERENCE_TRIAL_ATTEMPTS_PATH)), { code: 'ENOENT' });
      }
    }

    if (strictIntegrationRequired) {
      assert.equal(sha256Hex(await readFile(acceptedObservableTestPath!)), PRESCHOOL_REFERENCE_TRIAL_ACCEPTED_SEALED_OBSERVABLE_PAYLOAD_SHA256);
      const paths = {
        evidence: acceptedEvidenceTestPath,
        observable: acceptedObservableTestPath,
        brief: acceptedBriefTestPath,
      } as { evidence: string; observable: string; brief: string };
      await testSyntheticLayerAEndToEnd(root, paths, 'unauthorized-shadow-path');
      await testSyntheticLayerAEndToEnd(root, paths, 'residual-v5-deficit');
      await testSyntheticLayerAEndToEnd(root, paths, 'participant-failure');
      await testSyntheticLayerAEndToEnd(root, paths, 'shadow-participant-failure');
      await testSyntheticLayerAEndToEnd(root, paths, 'binding-drift-at-invocation');
      await testSyntheticLayerAEndToEnd(root, paths, 'history-drift-at-binding');
      await testSyntheticLayerAEndToEnd(root, paths, 'success');
    }
    if (acceptedEvidenceTestPath && acceptedObservableTestPath) {
      for (const [responsibilityBriefPath, reason] of [
        [null, 'Reference Responsibility Brief path was not supplied.'],
        [syntheticBriefPath, 'Reference Responsibility Brief digest did not match the accepted digest.'],
        [malformedBriefPath, 'Reference Responsibility Brief is malformed JSON.'],
        [invalidBriefPath, 'Reference Responsibility Brief schema or runRef is invalid.'],
      ] as const) {
        let resolvedBinding = false;
        const briefStop = await runPreschoolReferenceTrial({
          liveRepositoryRoot: currentRoot,
          evidencePath: acceptedEvidenceTestPath,
          observablePayloadPath: acceptedObservableTestPath,
          responsibilityBriefPath,
        }, {
          resolveReferenceParticipantBindingFromLock: async () => {
            resolvedBinding = true;
            throw new Error('must not bind a Participant without the exact accepted brief');
          },
        });
        assert.deepEqual(briefStop, {
          schemaVersion: 'preschool-reference-trial-stop-v1',
          status: 'REFERENCE_RESPONSIBILITY_BRIEF_UNAVAILABLE',
          runRef: 'preschool-pver-20260922231805-71297571',
          reason,
        });
        assert.equal(resolvedBinding, false);
        await assert.rejects(readdir(join(currentRoot, REFERENCE_TRIAL_ROOT_PATH)), { code: 'ENOENT' });
      }
    }

    const safeParticipant: WorkspaceAgentParticipantOptions = {
      executable: 'fake-participant',
      buildArgs: () => ['safe'],
    };
    let buildArgsCalled = false;
    const guardedParticipant = withParticipantContaminationGuard({
      ...safeParticipant,
      buildArgs: (input: WorkspaceAgentJobInput) => {
        buildArgsCalled = true;
        return safeParticipant.buildArgs(input);
      },
    });
    const promptInput: WorkspaceAgentJobInput = {
      invocationRef: 'reference-trial-test',
      role: 'solution',
      workspaceRoot: solutionWorkspace.workspaceRoot,
      prompt: 'safe answer-free prompt',
    };
    assert.deepEqual(guardedParticipant.buildArgs(promptInput), ['safe']);
    assert.equal(buildArgsCalled, true);
    buildArgsCalled = false;
    assert.throws(() => guardedParticipant.buildArgs({ ...promptInput, prompt: `contaminated ${ANSWER_IDS[0]}` }), /contamination/i);
    assert.equal(buildArgsCalled, false);
    const shadowPromptInput: WorkspaceAgentJobInput = {
      ...promptInput,
      role: 'configuration-execution',
    };
    assert.throws(() => guardedParticipant.buildArgs({
      ...shadowPromptInput,
      prompt: `non-accepted shadow material ${ANSWER_IDS[0]}`,
    }), /contamination/i);
    assert.equal(buildArgsCalled, false);

    const leakedName = `${ANSWER_IDS[2]}.txt`;
    await put(solutionWorkspace.workspaceRoot, leakedName, 'marker in participant-visible path');
    buildArgsCalled = false;
    assert.throws(() => guardedParticipant.buildArgs(promptInput), /contamination/i);
    assert.equal(buildArgsCalled, false);
    await rm(join(solutionWorkspace.workspaceRoot, leakedName));

    await put(solutionWorkspace.workspaceRoot, 'participant-visible-leak.txt', ANSWER_IDS[1]);
    buildArgsCalled = false;
    assert.throws(() => guardedParticipant.buildArgs(promptInput), /contamination/i);
    assert.equal(buildArgsCalled, false);
    await rm(join(solutionWorkspace.workspaceRoot, 'participant-visible-leak.txt'));

    await put(solutionWorkspace.workspaceRoot, RESIDUAL_DESIGN_PATH, 'forbidden residual design path');
    buildArgsCalled = false;
    assert.throws(() => guardedParticipant.buildArgs(promptInput), /contamination/i);
    assert.equal(buildArgsCalled, false);
    await rm(join(solutionWorkspace.workspaceRoot, RESIDUAL_DESIGN_PATH));

    const externalWorkspaceTarget = join(root, 'external-participant-workspace-target');
    await mkdir(externalWorkspaceTarget, { recursive: true });
    await writeFile(join(externalWorkspaceTarget, 'safe-content.txt'), 'safe external target');
    const externalWorkspaceSymlink = join(solutionWorkspace.workspaceRoot, 'external-participant-target');
    await symlink(externalWorkspaceTarget, externalWorkspaceSymlink, 'dir');
    buildArgsCalled = false;
    assert.throws(() => guardedParticipant.buildArgs(promptInput), /external symlink/i);
    assert.equal(buildArgsCalled, false, 'an external workspace symlink must be rejected before Participant buildArgs');
    await rm(externalWorkspaceSymlink);

    const shadowSourceMarkerPath = `${ANSWER_IDS[0]}.txt`;
    await put(historicalRoot, shadowSourceMarkerPath, 'forbidden shadow source marker');
    await assert.rejects(prepareReferenceTrialParticipantWorkspace({
      baselineRoot: historicalRoot,
      destinationRoot: join(root, 'shadow-workspace-with-source-marker'),
      jobKind: 'shadow-authoring',
      artifactSourceRoot: hostInputRoot,
      artifactRelativePaths: trialInputs.artifactRelativePaths,
    }), /Participant-visible contamination detected in (?:path|file)/i);
    await rm(join(historicalRoot, shadowSourceMarkerPath));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
  process.stdout.write(strictIntegrationRequired
    ? 'historical external-input integration: EXECUTED / PASS\n'
    : 'historical external-input integration: NOT RUN\n');
}

if (process.argv[1]?.endsWith('preschoolAutonomousAuthoringReferenceTrial.test.ts')) {
  runPreschoolAutonomousAuthoringReferenceTrialTests().then(() => {
    process.stdout.write('preschoolAutonomousAuthoringReferenceTrial.test.ts: ok\n');
  }).catch(error => {
    const diagnostic = error instanceof Error
      ? (error.stack ?? error.message)
      : String(error);
    process.stderr.write(`${diagnostic}\n`);
    process.exitCode = 1;
  });
}
