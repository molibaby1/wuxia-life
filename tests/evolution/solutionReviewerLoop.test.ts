import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  buildSolutionReReviewerPrompt,
  buildSolutionReviewerPrompt,
  runSolutionReReviewer as runSolutionReReviewerImpl,
  runSolutionReviewer as runSolutionReviewerImpl,
  type RunSolutionReReviewerInput,
  type RunSolutionReviewerInput,
} from '../../scripts/evolution/problemAgnosticSolution/runSolutionReviewer';
import { buildPreschoolAutonomousAuthoringContractPacket } from '../../scripts/evolution/autonomousAuthoring/buildPreschoolContractPacket';
import { REVIEWER_PARTICIPANT_SKILL_ASSIGNMENTS } from '../../scripts/evolution/problemAgnosticSolution/solutionParticipantSkills';
import { canonicalJson } from '../../scripts/evolution/phase0/provenance';
import type { ProblemPackageV1 } from '../../src/evolution/problemPackageContract';
import type {
  AutonomousAuthoringProposalV1,
  AutonomousAuthoringReviewAssessmentV1,
} from '../../src/evolution/autonomousAuthoringContract';
import type { SolutionReviewV1 } from '../../src/evolution/solutionReviewContract';
import type { SolutionWorkV1 } from '../../src/evolution/solutionWorkContract';

const problemPackage: ProblemPackageV1 = {
  schemaVersion: 'problem-package-v1',
  problemId: 'problem-000001',
  source: {
    runRef: 'cohort-run-000001',
    observablePayloadRef: 'source/observable-payload.json',
    externalFeedbackRef: 'source/feedback.json',
    improvementHypothesisRef: 'source/hypothesis.json',
  },
  problem: {
    hypothesisId: 'hypothesis-000001',
    statement: 'A generic fresh problem.',
    observedBasis: 'A generic observed basis.',
    feedbackRefs: ['observations[0]'],
    evidenceRefs: ['entry-000001'],
    unknowns: ['A generic unknown.'],
    productSignificance: 'A generic significance.',
  },
  authorityRefs: ['docs/product/auto-evolution-model.md'],
  productSourceFingerprintSha256: 'a'.repeat(64),
  permissions: {
    authoritativeProductWrite: false,
    sandboxWrite: true,
    productExecution: false,
    codeExecution: false,
  },
};

const solutionWork: SolutionWorkV1 = {
  schemaVersion: 'solution-work-v1',
  status: 'OPTIONS',
  problemId: problemPackage.problemId,
  options: [{
    optionId: 'option-000001',
    proposedChange: 'A bounded change.',
    rationale: 'It fits the evidence.',
    repoRefs: ['src/example.ts'],
    artifactRefs: ['source/observable-payload.json'],
    changeScope: 'configuration',
    expectedPlayerObservableDifference: 'A visible difference.',
    risks: [],
    unknowns: [],
  }],
  recommendedOptionId: 'option-000001',
  summary: 'One option.',
  repoRefs: ['src/example.ts'],
  artifactRefs: ['source/observable-payload.json'],
};

const review: SolutionReviewV1 = {
  schemaVersion: 'solution-review-v1',
  problemId: problemPackage.problemId,
  decision: 'ACCEPT_OPTION',
  acceptedOptionId: 'option-000001',
  scopeAssessment: 'config_only',
  assessment: 'Independently reviewed.',
  repoRefs: ['src/example.ts'],
  artifactRefs: ['source/observable-payload.json'],
  concerns: [],
};

const autonomousAuthoringProposal: AutonomousAuthoringProposalV1 = {
  schemaVersion: 'autonomous-authoring-proposal-v1',
  contractId: 'preschool-shared-neutral-passive-capacity-v1',
  contractVersion: 1,
  gapClassification: 'CONTENT_GAP',
  gapSubtype: 'CONTENT_CAPACITY_GAP',
  applicabilityClaim: 'APPLICABLE',
  authorityRefs: ['docs/product/content-authoring-workflow-contract-design.md'],
  sourceEvidenceRefs: ['source/observable-payload.json'],
  responsibilities: [{
    responsibilityId: 'responsibility-000001',
    primaryLifeFunction: 'Shared play.',
    playerVisibleNeed: 'A child can join a shared activity.',
    evidenceRefs: ['source/observable-payload.json'],
  }],
  contractPayload: {
    schemaVersion: 'preschool-shared-neutral-passive-authoring-payload-v1',
    cards: [{
      responsibilityId: 'responsibility-000001',
      primaryLifeFunction: 'Shared play.',
      playerVisibleNeed: 'A child can join a shared activity.',
      developmentalAgeJustification: {
        ageMin: 4,
        whyNotEarlier: 'This requires a simple shared activity.',
        whyFromThisAge: 'The child can take part in the activity.',
        whyThroughAgeSeven: 'The activity remains understandable through seven.',
      },
      concreteSceneConcept: 'Children arrange a shared play space.',
      existingContentDistinction: {
        closestEntryIds: ['existing_entry_000001'],
        sharedSemanticArea: 'Shared activity.',
        specificDistinction: 'The scene is about arranging the play space.',
      },
      actorClass: 'TRANSIENT_ROLE_ONLY',
      pastEvidenceConsumed: 'NONE',
      meaningfulPlayerDecision: 'NONE',
      durableResult: 'EVENT_HISTORY_ID_ONLY',
      futureHook: 'NONE',
      originPortability: 'The scene does not depend on origin.',
      scopeCheck: 'CONTRACT_PRESERVING',
      proposedEntry: {
        id: 'preschool_neutral_shared_play_space',
        title: 'Shared play space',
        text: 'Children arrange a space for a shared game.',
        originTags: ['neutral'],
        ageMin: 4,
        ageMax: 7,
      },
    }],
  },
};

const autonomousAuthoringAssessment: AutonomousAuthoringReviewAssessmentV1 = {
  schemaVersion: 'autonomous-authoring-review-assessment-v1',
  contractId: 'preschool-shared-neutral-passive-capacity-v1',
  contractVersion: 1,
  applicabilityAssessment: 'APPLICABLE',
  conformance: 'CONFORMING',
  executionEnvelope: 'WITHIN_ENVELOPE',
  assessment: 'The instance fits the reusable Contract.',
  blockers: [],
};

const autonomousSolutionWork: SolutionWorkV1 = {
  ...solutionWork,
  options: [{
    ...solutionWork.options[0]!,
    changeScope: 'program',
    autonomousAuthoring: autonomousAuthoringProposal,
  }],
};

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

type TestSolutionReviewerInput = Omit<RunSolutionReviewerInput, 'repositoryRoot'> & { repositoryRoot?: string };
type TestSolutionReReviewerInput = Omit<RunSolutionReReviewerInput, 'repositoryRoot'> & { repositoryRoot?: string };

function runSolutionReviewer(input: TestSolutionReviewerInput) {
  return runSolutionReviewerImpl({
    ...input,
    repositoryRoot: input.repositoryRoot ?? input.workspaceRoot,
  });
}

function runSolutionReReviewer(input: TestSolutionReReviewerInput) {
  return runSolutionReReviewerImpl({
    ...input,
    repositoryRoot: input.repositoryRoot ?? input.workspaceRoot,
  });
}

export async function runSolutionReviewerLoopTests(): Promise<void> {
  const autonomousAuthoringContractPacket = await buildPreschoolAutonomousAuthoringContractPacket({
    repositoryRoot: process.cwd(),
  });
  const packetJson = canonicalJson(autonomousAuthoringContractPacket);
  const reviewOutput = (assessment: unknown | undefined) => ({
    ...review,
    scopeAssessment: 'code_required',
    executionAuthorityAssessment: 'WITHIN_CURRENT_AUTHORITY',
    ...(assessment !== undefined ? { autonomousAuthoringAssessment: assessment } : {}),
  });
  const solutionWorkspacePath = '/private/solution-workspace-must-not-leak';
  const canonicalSkillPath = 'skills/repository-grounded-investigation/SKILL.md';
  const canonicalSkillContent = await readFile(join(process.cwd(), canonicalSkillPath), 'utf8');
  const canonicalSkillSha256 = createHash('sha256').update(canonicalSkillContent).digest('hex');
  const assignedSkill = {
    identity: 'repository-grounded-investigation',
    version: '1',
    canonicalPath: canonicalSkillPath,
    content: canonicalSkillContent,
    contentSha256: canonicalSkillSha256,
  };
  const prompt = buildSolutionReviewerPrompt(problemPackage, autonomousSolutionWork, [assignedSkill], autonomousAuthoringContractPacket);
  assert.match(prompt, /independently inspect|independent source inspection/i);
  assert.match(prompt, /reject all options/i);
  assert.match(prompt, /REQUEST_MORE_WORK: concrete, decision-relevant, bounded work achievable in the current execution context\./i);
  assert.match(prompt, /DEFER: material evidence cannot be obtained in the current execution context and requires genuinely new evidence\./i);
  assert.match(prompt, /ESCALATE: Human product\/governance\/authority judgment is required\./i);
  assert.match(prompt, /REJECT: the proposal is unacceptable and bounded revision of that proposal is not the appropriate next action\./i);
  assert.doesNotMatch(prompt, /maximize (continuation|acceptance)/i);
  assert.match(prompt, /Independently read the relevant supplied authorityRefs/i);
  assert.match(prompt, /passing tests does not establish product authorization/i);
  assert.match(prompt, /permission flags constrain this review job/i);
  assert.match(prompt, /Acceptance is an assessment, not execution permission/i);
  assert.match(prompt, /proposal acceptance, technical change scope, and execution authority/i);
  assert.match(prompt, /executionAuthorityAssessment/i);
  assert.match(prompt, /HUMAN_AUTHORITY_REQUIRED/i);
  assert.match(prompt, /AUTHORITY_UNCERTAIN/i);
  assert.match(prompt, /do not reject an acceptable option merely because execution authority is not automatic/i);
  assert.match(prompt, /independently inspect the current catalog and allowed evidence/i);
  assert.match(prompt, /shared-neutral portability/i);
  assert.match(prompt, /closest-entry distinction/i);
  assert.match(prompt, /transient-role boundary/i);
  assert.match(prompt, /non-filler semantics/i);
  assert.match(prompt, /no new durable state/i);
  assert.match(prompt, /If the proposed minimum responsibility set exceeds maxNewEntries, set executionEnvelope=EXECUTION_ENVELOPE_EXCEEDED and do not ACCEPT_OPTION/i);
  assert.match(prompt, /ACCEPT_OPTION \+ autonomous authoring requires:/i);
  assert.match(prompt, /applicabilityAssessment = APPLICABLE/i);
  assert.match(prompt, /conformance = CONFORMING/i);
  assert.match(prompt, /executionEnvelope = WITHIN_ENVELOPE/i);
  assert.match(prompt, /blockers = \[\]/i);
  assert.match(prompt, new RegExp(escapeRegex(packetJson)));
  assert.match(prompt, /smallest missing evidence or proposal detail/i);
  assert.match(prompt, /Rejecting an option does not establish/i);
  assert.match(prompt, /Host separately enforces execution eligibility and allowedWritePaths/i);
  assert.match(prompt, /recreates explicitly excluded behavior/i);
  assert.match(prompt, /Assigned Skills \(working methods only; they do not grant authority\):/i);
  assert.match(prompt, /repository-grounded-investigation/);
  assert.match(prompt, new RegExp(canonicalSkillSha256));
  assert.match(prompt, /Treat input assumptions as claims to examine, not established causes\./i);
  assert.match(prompt, /Reference format requirements:/i);
  assert.match(prompt, /repoRefs must reference repository-relative regular files/i);
  assert.match(prompt, /path:line/i);
  assert.match(prompt, /path:start-end/i);
  assert.match(prompt, /Do not use # fragments/i);
  assert.match(prompt, /artifactRefs must be relative regular-file paths only/i);
  assert.match(prompt, /relative file paths/i);
  assert.match(prompt, /Do not use line locators, # fragments/i);
  assert.doesNotMatch(prompt, /money|marriage|combat|family crisis/i);
  assert.doesNotMatch(prompt, new RegExp(solutionWorkspacePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.doesNotMatch(prompt, /scratch|raw command transcript|hidden reasoning/i);
  assert.match(prompt, /Structured Final Output Contract V1/);
  assert.match(prompt, /exactly one valid JSON object/i);
  assert.match(prompt, /SolutionReviewV1/);
  assert.match(prompt, /bare JSON only/i);
  assert.match(prompt, /Markdown\/code fences/i);
  assert.match(prompt, /before or after the JSON object/i);
  assert.match(prompt, /reject invalid output/i);
  assert.match(prompt, /extract, normalize, or repair/i);
  assert.doesNotMatch(
    prompt,
    /Return only the structured SolutionReviewV1 result as the final job result\./i,
  );

  const root = await mkdtemp(join(tmpdir(), 'solution-reviewer-loop-'));
  const workspaceRoot = join(root, 'reviewer-workspace');
  const artifactRoot = join(root, 'artifacts');
  await mkdir(join(workspaceRoot, 'skills/repository-grounded-investigation'), { recursive: true });
  await mkdir(join(workspaceRoot, 'src'), { recursive: true });
  await mkdir(join(artifactRoot, 'source'), { recursive: true });
  await writeFile(join(workspaceRoot, canonicalSkillPath), canonicalSkillContent);
  await writeFile(join(workspaceRoot, 'src/example.ts'), 'export const example = true;');
  await writeFile(join(artifactRoot, 'source/observable-payload.json'), '{}');
  const packagePath = join(root, 'problem-package.json');
  await writeFile(packagePath, JSON.stringify(problemPackage));

  let mismatchedInputRuntimeCalls = 0;
  const mismatchedInputSolution = await runSolutionReviewer({
    problemPackage,
    problemPackagePath: packagePath,
    solutionWork: { ...solutionWork, problemId: 'problem-999999' },
    workspaceRoot,
    artifactRoot,
    workspaceBaselineFingerprintSha256: 'b'.repeat(64),
    invocationRef: 'reviewer-input-problem-id-mismatch',
    jobNumber: 4,
    destinationRoot: join(root, 'reviewer-input-problem-id-mismatch'),
    skillAssignments: REVIEWER_PARTICIPANT_SKILL_ASSIGNMENTS,
    participant: {
      executable: process.execPath,
      buildArgs: () => {
        mismatchedInputRuntimeCalls += 1;
        return ['-e', `process.stdout.write(${JSON.stringify(JSON.stringify(review))})`];
      },
    },
  });
  assert.equal(mismatchedInputSolution.ok, false);
  if (!mismatchedInputSolution.ok) {
    assert.deepEqual(mismatchedInputSolution.failure, {
      origin: 'OUTPUT_IDENTITY',
      reason: 'PROBLEM_ID_MISMATCH',
      participantErrorKind: 'invalid_output',
      message: 'SolutionWork problemId does not match ProblemPackage',
    });
  }
  assert.equal(mismatchedInputRuntimeCalls, 0);

  let deliveredPrompt = '';
  const result = await runSolutionReviewer({
    problemPackage,
    problemPackagePath: packagePath,
    solutionWork: autonomousSolutionWork,
    workspaceRoot,
    artifactRoot,
    workspaceBaselineFingerprintSha256: 'b'.repeat(64),
    invocationRef: 'reviewer-000001',
    jobNumber: 4,
    destinationRoot: join(root, 'reviewer-agent'),
    skillAssignments: REVIEWER_PARTICIPANT_SKILL_ASSIGNMENTS,
    autonomousAuthoringContractPacket,
    participant: {
      executable: process.execPath,
      buildArgs: input => {
        deliveredPrompt = input.prompt;
        return ['-e', `process.stdout.write(${JSON.stringify(JSON.stringify(reviewOutput(autonomousAuthoringAssessment)))})`];
      },
    },
  });
  assert.equal(result.ok, true);
  const successTrace = JSON.parse(await readFile(join(root, 'reviewer-agent/execution-trace.json'), 'utf8'));
  assert.equal(successTrace.terminal.outcome, 'completed');
  assert.ok(successTrace.events.some((event: { type: string }) => event.type === 'process_start'));
  assert.equal(await readFile(join(root, 'reviewer-agent/participant-prompt.txt'), 'utf8'), deliveredPrompt);
  assert.equal(JSON.parse(await readFile(join(root, 'reviewer-agent/participant-binding.json'), 'utf8')).provider, 'codex-local-subagent');
  assert.equal(result.review?.decision, 'ACCEPT_OPTION');
  assert.equal(JSON.parse(await readFile(join(root, 'reviewer-agent/review.json'), 'utf8')).acceptedOptionId, 'option-000001');
  assert.match(deliveredPrompt, /Assigned Skills \(working methods only; they do not grant authority\):/i);
  assert.match(deliveredPrompt, new RegExp(canonicalSkillSha256));
  assert.match(deliveredPrompt, /Structured Final Output Contract V1/);
  assert.match(deliveredPrompt, /SolutionReviewV1/);
  assert.match(deliveredPrompt, /bare JSON only/i);
  assert.match(deliveredPrompt, new RegExp(escapeRegex(packetJson)));
  assert.match(deliveredPrompt, /reject invalid output/i);
  assert.doesNotMatch(
    deliveredPrompt,
    /Return only the structured SolutionReviewV1 result as the final job result\./i,
  );
  const invocation = JSON.parse(await readFile(join(root, 'reviewer-agent/invocation.json'), 'utf8'));
  assert.equal(invocation.schemaVersion, 'solution-reviewer-invocation-v2');
  assert.deepEqual(invocation.skillAssignments, [
    {
      identity: 'repository-grounded-investigation',
      version: '1',
      canonicalPath: canonicalSkillPath,
      expectedContentSha256: canonicalSkillSha256,
    },
  ]);
  assert.deepEqual(invocation.deliveredSkills, [
    {
      identity: 'repository-grounded-investigation',
      version: '1',
      canonicalPath: canonicalSkillPath,
      expectedContentSha256: canonicalSkillSha256,
      contentSha256: canonicalSkillSha256,
    },
  ]);

  const originalReviewForRereview: SolutionReviewV1 = {
    schemaVersion: 'solution-review-v1',
    problemId: problemPackage.problemId,
    decision: 'REQUEST_MORE_WORK',
    assessment: 'The original proposal needs bounded follow-up.',
    repoRefs: ['src/example.ts'],
    artifactRefs: ['source/observable-payload.json'],
    concerns: ['Investigate one concrete repository fact.'],
  };
  const revisedSolutionWork: SolutionWorkV1 = {
    ...autonomousSolutionWork,
    summary: 'A revised bounded option.',
  };
  const reReviewerPrompt = buildSolutionReReviewerPrompt(
    problemPackage,
    autonomousSolutionWork,
    originalReviewForRereview,
    revisedSolutionWork,
    [{
      identity: 'repository-grounded-investigation',
      version: '1',
      canonicalPath: canonicalSkillPath,
      content: canonicalSkillContent,
      contentSha256: canonicalSkillSha256,
    }],
    autonomousAuthoringContractPacket,
  );
  assert.match(reReviewerPrompt, new RegExp(escapeRegex(canonicalJson(autonomousSolutionWork))));
  assert.match(reReviewerPrompt, new RegExp(escapeRegex(canonicalJson(originalReviewForRereview))));
  assert.match(reReviewerPrompt, new RegExp(escapeRegex(canonicalJson(revisedSolutionWork))));
  assert.match(reReviewerPrompt, /independent/i);
  assert.match(reReviewerPrompt, new RegExp(escapeRegex(packetJson)));

  let rereviewerInvocationRef = '';
  const rereviewResult = await runSolutionReReviewer({
    problemPackage,
    problemPackagePath: packagePath,
    solutionWork: revisedSolutionWork,
    workspaceRoot,
    artifactRoot,
    workspaceBaselineFingerprintSha256: 'b'.repeat(64),
    invocationRef: 'solution-rereviewer-000001',
    jobNumber: 2,
    destinationRoot: join(root, 'solution-rereviewer'),
    skillAssignments: REVIEWER_PARTICIPANT_SKILL_ASSIGNMENTS,
    autonomousAuthoringContractPacket,
    participant: {
      executable: process.execPath,
      buildArgs: input => {
        rereviewerInvocationRef = input.invocationRef;
        return ['-e', `process.stdout.write(${JSON.stringify(JSON.stringify(reviewOutput(autonomousAuthoringAssessment)))})`];
      },
    },
    originalSolutionWork: autonomousSolutionWork,
    originalReview: originalReviewForRereview,
  });
  assert.equal(rereviewResult.ok, true);
  assert.equal(rereviewerInvocationRef, 'solution-rereviewer-000001');
  const rereviewerInvocation = JSON.parse(await readFile(join(root, 'solution-rereviewer/invocation.json'), 'utf8'));
  assert.equal(rereviewerInvocation.invocationRef, 'solution-rereviewer-000001');

  const invalidAcceptedAuthoringReviews = [
    reviewOutput(undefined),
    reviewOutput({ ...autonomousAuthoringAssessment, contractId: 'another-contract-v1' }),
    reviewOutput({ ...autonomousAuthoringAssessment, contractVersion: 2 }),
    reviewOutput({ ...autonomousAuthoringAssessment, applicabilityAssessment: 'NOT_APPLICABLE' }),
    reviewOutput({ ...autonomousAuthoringAssessment, conformance: 'NON_CONFORMING' }),
    reviewOutput({ ...autonomousAuthoringAssessment, executionEnvelope: 'EXECUTION_ENVELOPE_EXCEEDED' }),
    reviewOutput({ ...autonomousAuthoringAssessment, blockers: ['one blocker'] }),
  ];
  for (const [index, invalidReview] of invalidAcceptedAuthoringReviews.entries()) {
    const invalidAuthoringResult = await runSolutionReviewer({
      problemPackage,
      problemPackagePath: packagePath,
      solutionWork: autonomousSolutionWork,
      workspaceRoot,
      artifactRoot,
      workspaceBaselineFingerprintSha256: 'b'.repeat(64),
      invocationRef: `reviewer-invalid-authoring-assessment-${index}`,
      jobNumber: 4,
      destinationRoot: join(root, `reviewer-invalid-authoring-assessment-${index}`),
      skillAssignments: REVIEWER_PARTICIPANT_SKILL_ASSIGNMENTS,
      autonomousAuthoringContractPacket,
      participant: {
        executable: process.execPath,
        buildArgs: () => ['-e', `process.stdout.write(${JSON.stringify(JSON.stringify(invalidReview))})`],
      },
    });
    assert.equal(invalidAuthoringResult.ok, false);
    if (!invalidAuthoringResult.ok) {
      assert.equal(invalidAuthoringResult.failure.origin, 'OUTPUT_SCHEMA');
      assert.equal(invalidAuthoringResult.failure.reason, 'ROLE_SCHEMA_INVALID');
    }
  }

  const acceptedAuthoringReview = await runSolutionReviewer({
    problemPackage,
    problemPackagePath: packagePath,
    solutionWork: autonomousSolutionWork,
    workspaceRoot,
    artifactRoot,
    workspaceBaselineFingerprintSha256: 'b'.repeat(64),
    invocationRef: 'reviewer-valid-authoring-assessment',
    jobNumber: 4,
    destinationRoot: join(root, 'reviewer-valid-authoring-assessment'),
    skillAssignments: REVIEWER_PARTICIPANT_SKILL_ASSIGNMENTS,
    autonomousAuthoringContractPacket,
    participant: {
      executable: process.execPath,
      buildArgs: () => ['-e', `process.stdout.write(${JSON.stringify(JSON.stringify(reviewOutput(autonomousAuthoringAssessment)))})`],
    },
  });
  assert.equal(acceptedAuthoringReview.ok, true);

  let rereviewerIdentityRuntimeCalls = 0;
  const rereviewerIdentityFailure = await runSolutionReReviewer({
    problemPackage,
    problemPackagePath: packagePath,
    solutionWork: revisedSolutionWork,
    workspaceRoot,
    artifactRoot,
    workspaceBaselineFingerprintSha256: 'b'.repeat(64),
    invocationRef: 'solution-rereviewer-identity-mismatch',
    jobNumber: 2,
    destinationRoot: join(root, 'solution-rereviewer-identity-mismatch'),
    skillAssignments: REVIEWER_PARTICIPANT_SKILL_ASSIGNMENTS,
    participant: {
      executable: process.execPath,
      buildArgs: () => {
        rereviewerIdentityRuntimeCalls += 1;
        return ['-e', `process.stdout.write(${JSON.stringify(JSON.stringify(review))})`];
      },
    },
    originalSolutionWork: solutionWork,
    originalReview: { ...originalReviewForRereview, problemId: 'problem-999999' },
  });
  assert.equal(rereviewerIdentityFailure.ok, false);
  if (!rereviewerIdentityFailure.ok) {
    assert.deepEqual(rereviewerIdentityFailure.failure, {
      origin: 'OUTPUT_IDENTITY',
      reason: 'PROBLEM_ID_MISMATCH',
      participantErrorKind: 'invalid_output',
      message: 're-review source problemId does not match ProblemPackage',
    });
  }
  assert.equal(rereviewerIdentityRuntimeCalls, 0);

  const unknownValidationFailure = await runSolutionReviewer({
    repositoryRoot: {} as unknown as string,
    problemPackage,
    problemPackagePath: packagePath,
    solutionWork,
    workspaceRoot,
    artifactRoot,
    workspaceBaselineFingerprintSha256: 'b'.repeat(64),
    invocationRef: 'reviewer-unknown-validation-failure',
    jobNumber: 4,
    destinationRoot: join(root, 'reviewer-unknown-validation-failure'),
    skillAssignments: REVIEWER_PARTICIPANT_SKILL_ASSIGNMENTS,
    participant: {
      executable: process.execPath,
      buildArgs: () => ['-e', `process.stdout.write(${JSON.stringify(JSON.stringify(review))})`],
    },
  });
  assert.equal(unknownValidationFailure.ok, false);
  if (!unknownValidationFailure.ok) {
    assert.equal(unknownValidationFailure.failure.origin, 'HOST_INFRASTRUCTURE');
    assert.equal(unknownValidationFailure.failure.reason, 'WORKSPACE_MATERIALIZATION_MISMATCH');
    assert.equal(unknownValidationFailure.failure.participantErrorKind, 'invalid_output');
  }

  const timeoutRoot = join(root, 'timeout-reviewer-agent');
  let timeoutCalls = 0;
  const timeoutResult = await runSolutionReviewer({
    problemPackage,
    problemPackagePath: packagePath,
    solutionWork,
    workspaceRoot,
    artifactRoot,
    workspaceBaselineFingerprintSha256: 'b'.repeat(64),
    invocationRef: 'reviewer-timeout',
    jobNumber: 4,
    destinationRoot: timeoutRoot,
    skillAssignments: REVIEWER_PARTICIPANT_SKILL_ASSIGNMENTS,
    participant: {
      executable: process.execPath,
      timeoutMs: 1000,
      buildArgs: () => {
        timeoutCalls += 1;
        return ['-e', 'process.stderr.write("reviewer started"); setInterval(() => {}, 1000)'];
      },
    },
  });
  assert.equal(timeoutResult.ok, false);
  assert.equal(timeoutResult.ok ? undefined : timeoutResult.errorKind, 'timeout');
  if (!timeoutResult.ok) {
    assert.deepEqual(timeoutResult.failure, {
      origin: 'PARTICIPANT_RUNTIME',
      reason: 'TIMEOUT',
      participantErrorKind: 'timeout',
      message: 'workspace Agent job timed out after 1000ms',
    });
  }
  assert.equal(timeoutCalls, 1, 'Reviewer timeout must not cause a retry');
  const timeoutTrace = JSON.parse(await readFile(join(timeoutRoot, 'execution-trace.json'), 'utf8'));
  assert.equal(timeoutTrace.schemaVersion, 'participant-execution-trace-v1');
  assert.equal(timeoutTrace.terminal.outcome, 'timeout');
  assert.equal(timeoutTrace.invocation.timeoutMs, 1000);
  assert.ok(timeoutTrace.events.some((event: { type: string }) => event.type === 'process_start'));
  assert.ok(timeoutTrace.events.some((event: { type: string }) => event.type === 'output_activity'));
  assert.ok(timeoutTrace.events.some((event: { type: string }) => event.type === 'timeout'));
  assert.equal(
    timeoutTrace.events.some((event: { type: string }) => event.type === 'participant_envelope_retransmission_requested'),
    false,
  );
  assert.ok(timeoutTrace.terminal.lastObservableActivityElapsedMs <= timeoutTrace.terminal.elapsedMs);
  assert.equal(JSON.parse(await readFile(join(timeoutRoot, 'failure.json'), 'utf8')).errorKind, 'timeout');
  assert.ok(!JSON.stringify(timeoutTrace).includes('reviewer started'), 'Activity trace must not duplicate output payload');

  const malformedEnvelopeResult = await runSolutionReviewer({
    problemPackage,
    problemPackagePath: packagePath,
    solutionWork,
    workspaceRoot,
    artifactRoot,
    workspaceBaselineFingerprintSha256: 'b'.repeat(64),
    invocationRef: 'reviewer-malformed-envelope',
    jobNumber: 4,
    destinationRoot: join(root, 'malformed-envelope-reviewer-agent'),
    skillAssignments: REVIEWER_PARTICIPANT_SKILL_ASSIGNMENTS,
    participant: {
      executable: process.execPath,
      buildArgs: () => ['-e', 'process.stdout.write("not-json")'],
    },
  });
  assert.equal(malformedEnvelopeResult.ok, false);
  if (!malformedEnvelopeResult.ok) {
    assert.equal(malformedEnvelopeResult.failure.origin, 'OUTPUT_ENVELOPE');
    assert.equal(malformedEnvelopeResult.failure.reason, 'INVALID_JSON_ENVELOPE');
  }

  const malformedSchemaResult = await runSolutionReviewer({
    problemPackage,
    problemPackagePath: packagePath,
    solutionWork,
    workspaceRoot,
    artifactRoot,
    workspaceBaselineFingerprintSha256: 'b'.repeat(64),
    invocationRef: 'reviewer-malformed-schema',
    jobNumber: 4,
    destinationRoot: join(root, 'malformed-schema-reviewer-agent'),
    skillAssignments: REVIEWER_PARTICIPANT_SKILL_ASSIGNMENTS,
    participant: {
      executable: process.execPath,
      buildArgs: () => ['-e', 'process.stdout.write(JSON.stringify({ schemaVersion: "solution-review-v1" }));'],
    },
  });
  assert.equal(malformedSchemaResult.ok, false);
  if (!malformedSchemaResult.ok) {
    assert.equal(malformedSchemaResult.failure.origin, 'OUTPUT_SCHEMA');
    assert.equal(malformedSchemaResult.failure.reason, 'ROLE_SCHEMA_INVALID');
  }

  const wrongProblemIdResult = await runSolutionReviewer({
    problemPackage,
    problemPackagePath: packagePath,
    solutionWork,
    workspaceRoot,
    artifactRoot,
    workspaceBaselineFingerprintSha256: 'b'.repeat(64),
    invocationRef: 'reviewer-wrong-problem-id',
    jobNumber: 4,
    destinationRoot: join(root, 'wrong-problem-id-reviewer-agent'),
    skillAssignments: REVIEWER_PARTICIPANT_SKILL_ASSIGNMENTS,
    participant: {
      executable: process.execPath,
      buildArgs: () => ['-e', `process.stdout.write(${JSON.stringify(JSON.stringify({ ...review, problemId: 'problem-999999' }))})`],
    },
  });
  assert.equal(wrongProblemIdResult.ok, false);
  if (!wrongProblemIdResult.ok) {
    assert.equal(wrongProblemIdResult.failure.origin, 'OUTPUT_IDENTITY');
    assert.equal(wrongProblemIdResult.failure.reason, 'PROBLEM_ID_MISMATCH');
  }

  const optionIdMismatchResult = await runSolutionReviewer({
    problemPackage,
    problemPackagePath: packagePath,
    solutionWork,
    workspaceRoot,
    artifactRoot,
    workspaceBaselineFingerprintSha256: 'b'.repeat(64),
    invocationRef: 'reviewer-option-id-mismatch',
    jobNumber: 4,
    destinationRoot: join(root, 'option-id-mismatch-reviewer-agent'),
    skillAssignments: REVIEWER_PARTICIPANT_SKILL_ASSIGNMENTS,
    participant: {
      executable: process.execPath,
      buildArgs: () => ['-e', `process.stdout.write(${JSON.stringify(JSON.stringify({ ...review, acceptedOptionId: 'option-999999' }))})`],
    },
  });
  assert.equal(optionIdMismatchResult.ok, false);
  if (!optionIdMismatchResult.ok) {
    assert.equal(optionIdMismatchResult.failure.origin, 'OUTPUT_INTERNAL_CONSISTENCY');
    assert.equal(optionIdMismatchResult.failure.reason, 'OPTION_ID_MISMATCH');
  }

  const missingRepoRefResult = await runSolutionReviewer({
    problemPackage,
    problemPackagePath: packagePath,
    solutionWork,
    workspaceRoot,
    artifactRoot,
    workspaceBaselineFingerprintSha256: 'b'.repeat(64),
    invocationRef: 'reviewer-missing-repo-ref',
    jobNumber: 4,
    destinationRoot: join(root, 'missing-repo-ref-reviewer-agent'),
    skillAssignments: REVIEWER_PARTICIPANT_SKILL_ASSIGNMENTS,
    participant: {
      executable: process.execPath,
      buildArgs: () => ['-e', `process.stdout.write(${JSON.stringify(JSON.stringify({ ...review, repoRefs: ['src/missing-review-repo-ref.ts'] }))})`],
    },
  });
  assert.equal(missingRepoRefResult.ok, false);
  if (!missingRepoRefResult.ok) {
    assert.equal(missingRepoRefResult.failure.origin, 'OUTPUT_REFERENCE');
    assert.equal(missingRepoRefResult.failure.reason, 'MISSING_TARGET');
  }

  const locatorReview = { ...review, repoRefs: ['src/example.ts:1-2'] };
  const locatorResult = await runSolutionReviewer({
    problemPackage,
    problemPackagePath: packagePath,
    solutionWork,
    workspaceRoot,
    artifactRoot,
    workspaceBaselineFingerprintSha256: 'b'.repeat(64),
    invocationRef: 'reviewer-000001-locator',
    jobNumber: 4,
    destinationRoot: join(root, 'locator-reviewer-agent'),
    skillAssignments: REVIEWER_PARTICIPANT_SKILL_ASSIGNMENTS,
    participant: {
      executable: process.execPath,
      buildArgs: () => ['-e', `process.stdout.write(${JSON.stringify(JSON.stringify(locatorReview))})`],
    },
  });
  assert.equal(locatorResult.ok, true);
  if (locatorResult.ok) assert.deepEqual(locatorResult.review.repoRefs, ['src/example.ts:1-2']);
  assert.deepEqual(
    JSON.parse(await readFile(join(root, 'locator-reviewer-agent/review.json'), 'utf8')).repoRefs,
    ['src/example.ts:1-2'],
  );

  const artifactLocatorResult = await runSolutionReviewer({
    problemPackage,
    problemPackagePath: packagePath,
    solutionWork,
    workspaceRoot,
    artifactRoot,
    workspaceBaselineFingerprintSha256: 'b'.repeat(64),
    invocationRef: 'reviewer-000001-artifact-locator',
    jobNumber: 4,
    destinationRoot: join(root, 'artifact-locator-reviewer-agent'),
    skillAssignments: REVIEWER_PARTICIPANT_SKILL_ASSIGNMENTS,
    participant: {
      executable: process.execPath,
      buildArgs: () => ['-e', `process.stdout.write(${JSON.stringify(JSON.stringify({ ...review, artifactRefs: ['source/observable-payload.json:10'] }))})`],
    },
  });
  assert.equal(artifactLocatorResult.ok, false);
  assert.equal(artifactLocatorResult.ok ? undefined : artifactLocatorResult.errorKind, 'invalid_output');

  const artifactFragmentResult = await runSolutionReviewer({
    problemPackage,
    problemPackagePath: packagePath,
    solutionWork,
    workspaceRoot,
    artifactRoot,
    workspaceBaselineFingerprintSha256: 'b'.repeat(64),
    invocationRef: 'reviewer-000001-artifact-fragment',
    jobNumber: 4,
    destinationRoot: join(root, 'artifact-fragment-reviewer-agent'),
    skillAssignments: REVIEWER_PARTICIPANT_SKILL_ASSIGNMENTS,
    participant: {
      executable: process.execPath,
      buildArgs: () => ['-e', `process.stdout.write(${JSON.stringify(JSON.stringify({ ...review, artifactRefs: ['source/observable-payload.json#entry-1'] }))})`],
    },
  });
  assert.equal(artifactFragmentResult.ok, false);
  assert.equal(artifactFragmentResult.ok ? undefined : artifactFragmentResult.errorKind, 'invalid_output');

  const workspaceWithoutSkill = join(root, 'workspace-without-skill');
  await mkdir(workspaceWithoutSkill, { recursive: true });
  let runtimeCalls = 0;
  const deliveryFailure = await runSolutionReviewer({
    problemPackage,
    problemPackagePath: packagePath,
    solutionWork,
    workspaceRoot: workspaceWithoutSkill,
    artifactRoot,
    workspaceBaselineFingerprintSha256: 'c'.repeat(64),
    invocationRef: 'reviewer-000002',
    jobNumber: 4,
    destinationRoot: join(root, 'skill-delivery-failure'),
    skillAssignments: REVIEWER_PARTICIPANT_SKILL_ASSIGNMENTS,
    participant: {
      executable: process.execPath,
      buildArgs: () => {
        runtimeCalls += 1;
        return ['-e', 'process.exit(1)'];
      },
    },
  });
  assert.equal(deliveryFailure.ok, false);
  assert.equal(deliveryFailure.ok ? undefined : deliveryFailure.errorKind, 'process');
  if (!deliveryFailure.ok) {
    assert.deepEqual(deliveryFailure.failure, {
      origin: 'HOST_INFRASTRUCTURE',
      reason: 'SKILL_DELIVERY_FAILURE',
      participantErrorKind: 'process',
      message: deliveryFailure.message,
    });
  }
  assert.equal(runtimeCalls, 0);
  const deliveryFailureInvocation = JSON.parse(
    await readFile(join(root, 'skill-delivery-failure/invocation.json'), 'utf8'),
  );
  assert.equal(deliveryFailureInvocation.status, 'failed');
  assert.deepEqual(deliveryFailureInvocation.deliveredSkills, []);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runSolutionReviewerLoopTests()
    .then(() => console.log('solutionReviewerLoop.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
