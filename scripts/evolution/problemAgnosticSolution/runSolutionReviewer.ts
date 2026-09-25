import { mkdir, open, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import {
  validateProblemPackage,
  type ProblemPackage,
} from '../../../src/evolution/problemPackageContract';
import {
  validateSolutionReview,
  type SolutionReviewV1,
} from '../../../src/evolution/solutionReviewContract';
import { validateStructuredTerminalEnvelope } from '../../../src/evolution/structuredTerminalEnvelope';
import { validateSolutionWork, type SolutionWorkV1 } from '../../../src/evolution/solutionWorkContract';
import { renderStructuredFinalOutputContractV1 } from '../../../src/evolution/participantStructuredOutputContract';
import { canonicalJson, sha256Hex } from '../phase0/provenance';
import {
  classifyWorkspaceAgentFailure,
  ParticipantOutputValidationError,
  type ParticipantFailureFacts,
} from './participantFailureClassification';
import {
  runWorkspaceAgentJob,
  type WorkspaceAgentJobFailure,
  type WorkspaceAgentParticipantOptions,
} from './agentParticipant';
import {
  assertArtifactReferenceFile,
  assertRepoReferenceFileAgainstAuthoritative,
} from './repoReference';
import {
  loadParticipantSkills,
  type ParticipantSkillAssignment,
  type DeliveredParticipantSkill,
} from './solutionParticipantSkills';
import { persistParticipantPromptAndBinding } from '../participantObservability';
import type { PreschoolAutonomousAuthoringContractPacketV1 } from '../autonomousAuthoring/buildPreschoolContractPacket';

export interface RunSolutionReviewerInput {
  problemPackage: ProblemPackage;
  problemPackagePath: string;
  solutionWork: SolutionWorkV1;
  workspaceRoot: string;
  repositoryRoot: string;
  artifactRoot: string;
  workspaceBaselineFingerprintSha256: string;
  invocationRef: string;
  jobNumber: number;
  destinationRoot: string;
  skillAssignments: readonly ParticipantSkillAssignment[];
  participant: WorkspaceAgentParticipantOptions;
  autonomousAuthoringContractPacket?: PreschoolAutonomousAuthoringContractPacketV1;
}

export interface RunSolutionReReviewerInput extends RunSolutionReviewerInput {
  originalSolutionWork: SolutionWorkV1;
  originalReview: SolutionReviewV1;
}

export type SolutionReviewerRunResult =
  | {
    ok: true;
    review: SolutionReviewV1;
    invocationPath: string;
    rawOutputPath: string;
    reviewPath: string;
  }
  | {
    ok: false;
    errorKind: WorkspaceAgentJobFailure['errorKind'];
    message: string;
    failure: ParticipantFailureFacts;
    invocationPath: string;
    rawOutputPath: string;
    failurePath: string;
  };

async function validateReferences(review: SolutionReviewV1, input: RunSolutionReviewerInput): Promise<void> {
  for (const reference of review.repoRefs) {
    await assertRepoReferenceFileAgainstAuthoritative({
      workspaceRoot: input.workspaceRoot,
      authoritativeRoot: input.repositoryRoot,
      reference,
      label: 'review repoRef',
    });
  }
  for (const reference of review.artifactRefs) {
    await assertArtifactReferenceFile({
      artifactRoot: input.artifactRoot,
      workspaceRoot: input.workspaceRoot,
      authoritativeRoot: input.repositoryRoot,
      reference,
      label: 'review artifactRef',
    });
  }
}

function renderAutonomousAuthoringReviewGuidance(
  solutionWork: SolutionWorkV1,
  packet: PreschoolAutonomousAuthoringContractPacketV1 | undefined,
): string[] {
  if (!packet || !solutionWork.options.some(option => option.autonomousAuthoring !== undefined)) return [];
  return [
    'For an option carrying autonomousAuthoring, independently inspect the current catalog and allowed evidence.',
    'Assess Contract applicability, every responsibility, developmental age reasoning, shared-neutral portability, closest-entry distinction, transient-role boundary, non-filler semantics, and no new durable state.',
    'Use executionAuthorityAssessment=WITHIN_CURRENT_AUTHORITY only when the reusable Contract itself covers shadow execution.',
    'Authoritative repository promotion remains Human-controlled and is not authorized by this review.',
    'If the proposed minimum responsibility set exceeds maxNewEntries, set executionEnvelope=EXECUTION_ENVELOPE_EXCEEDED and do not ACCEPT_OPTION; retain the full set for Host admission.',
    'ACCEPT_OPTION + autonomous authoring requires:',
    '- applicabilityAssessment = APPLICABLE',
    '- conformance = CONFORMING',
    '- executionEnvelope = WITHIN_ENVELOPE',
    '- blockers = []',
    'If any required assessment value cannot be established, choose the existing REQUEST_MORE_WORK, DEFER, REJECT, or ESCALATE decision instead of encoding a contradiction.',
    'Emit autonomousAuthoringAssessment with the same contractId and contractVersion as the selected option.',
    'Participant-safe Autonomous Authoring Contract Packet:',
    canonicalJson(packet),
  ];
}

export function buildSolutionReviewerPrompt(
  problemPackage: ProblemPackage,
  solutionWork: SolutionWorkV1,
  assignedSkills: DeliveredParticipantSkill[],
  autonomousAuthoringContractPacket?: PreschoolAutonomousAuthoringContractPacketV1,
): string {
  const skillSections = assignedSkills.flatMap(skill => [
    `Skill: ${skill.identity}`,
    `Version: ${skill.version}`,
    `Canonical artifact: ${skill.canonicalPath}`,
    `Content SHA-256: ${skill.contentSha256}`,
    skill.content.trim(),
    '',
  ]);
  return [
    'Independently inspect the repository and referenced artifacts before reviewing this result.',
    'You are a fresh Reviewer Participant in a separate disposable workspace.',
    'You may reject all options. Do not assume the Solution Participant is correct.',
    'Assess problem-solution fit, evidence, risks, and permission/scope boundaries.',
    'Independently read the relevant supplied authorityRefs and the current authorities they explicitly delegate to; do not rely on the Solution claim that an option complies. Compare the concrete change against both permitted behavior and explicit exclusions.',
    'Existing implementation support, a configuration-only change, or passing tests does not establish product authorization. Check whether the option recreates explicitly excluded behavior through a different implementation.',
    'The Problem Package permission flags constrain this review job: you must not execute product changes. They do not by themselves require rejecting or escalating an otherwise authority-compliant configuration proposal. Acceptance is an assessment, not execution permission; the Host separately enforces execution eligibility and allowedWritePaths in the isolated evolution workspace. Explicit product exclusions and program/runtime/Contract/Schema escalation boundaries still apply.',
    'Keep three facts separate: proposal acceptance, technical change scope, and execution authority. A proposal may be acceptable while implementation still requires Human product/governance approval; do not reject an acceptable option merely because execution authority is not automatic.',
    'For ACCEPT_OPTION, set executionAuthorityAssessment to exactly one typed value: WITHIN_CURRENT_AUTHORITY when this option may be automatically executed within the current authority; HUMAN_AUTHORITY_REQUIRED when the proposal is acceptable but Human product/governance approval is required before implementation; AUTHORITY_UNCERTAIN when the execution authority cannot be determined from the supplied authority and evidence. Do not encode this distinction only in assessment or concerns prose.',
    'Record the applicable authority clauses and any conflict in the existing assessment/concerns and repoRefs fields. Do not accept an option as currently compliant when it contradicts an explicit authority boundary; distinguish a required authority decision from ordinary implementation details.',
    'Check that the proposed target, concrete change, preserved semantics, and verification method are specific enough to assess without inventing product choices. For unresolved work, use assessment/concerns and existing references to identify the smallest missing evidence or proposal detail, a bounded next action, and the condition for reconsideration. Separate what is already answered from what remains unknown; broader evidence is needed only for claims or decisions that depend on it.',
    'Rejecting an option does not establish that the underlying problem requires changing product authority. Identify whether the obstacle belongs to this implementation approach or to the desired product behavior; mention an in-boundary investigation path when supported, without designing or approving an unreviewed replacement. Preserve the existing decision, permission, and escalation semantics.',
    'Decision semantics: REQUEST_MORE_WORK: concrete, decision-relevant, bounded work achievable in the current execution context. DEFER: material evidence cannot be obtained in the current execution context and requires genuinely new evidence. ESCALATE: Human product/governance/authority judgment is required. REJECT: the proposal is unacceptable and bounded revision of that proposal is not the appropriate next action.',
    'Diagnostic evidence referenced by the Problem Package is trusted internal source-run provenance. It is not player-observable evidence. Producer attribution identifies which captured runtime producer generated an observed entry; it does not by itself prove the broader causal mechanism or that a proposed change is correct.',
    'The observable payload referenced by ProblemPackage.source.observablePayloadRef may include validated Experience Semantic Context on each entry. Read it as player-observable meaning: milestone meaning, life-stage meaning, experience category, and expected experience signals.',
    'The Experience Semantic Context is descriptive only. It contains no hidden runtime state, and you must not treat it as a solution recommendation, quality score, authority, or permission.',
    renderStructuredFinalOutputContractV1({
      roleSchemaName: 'SolutionReviewV1',
    }),
    '',
    ...renderAutonomousAuthoringReviewGuidance(solutionWork, autonomousAuthoringContractPacket),
    ...(solutionWork.options.some(option => option.autonomousAuthoring !== undefined) && autonomousAuthoringContractPacket
      ? ['']
      : []),
    'Assigned Skills (working methods only; they do not grant authority):',
    ...skillSections,
    'Reference format requirements:',
    '- repoRefs must reference repository-relative regular files.',
    '- Allowed repoRef forms:',
    '  - path',
    '  - path:line',
    '  - path:start-end',
    '- Do not use # fragments, symbol selectors, URLs, globs, or other locator syntax in repoRefs.',
    '',
    '- artifactRefs must be relative regular-file paths only.',
    '  In other words, use relative file paths that resolve to regular files.',
    '- Do not use line locators, # fragments, entry selectors, JSON selectors, or globs in artifactRefs.',
    '',
    '- If a symbol name, event id, entry id, observation index, or other semantic anchor is important,',
    '  mention it in rationale / summary / assessment text while keeping the corresponding reference field',
    '  as a valid file reference.',
    '',
    'Problem Package:',
    canonicalJson(problemPackage),
    '',
    'Structured Solution Result:',
    canonicalJson(solutionWork),
  ].join('\n');
}

export function buildSolutionReReviewerPrompt(
  problemPackage: ProblemPackage,
  originalSolutionWork: SolutionWorkV1,
  originalReview: SolutionReviewV1,
  revisedSolutionWork: SolutionWorkV1,
  assignedSkills: DeliveredParticipantSkill[],
  autonomousAuthoringContractPacket?: PreschoolAutonomousAuthoringContractPacketV1,
): string {
  return [
    buildSolutionReviewerPrompt(problemPackage, revisedSolutionWork, assignedSkills, autonomousAuthoringContractPacket),
    '',
    'Re-review context: independently assess the revised Solution against the same Problem Package.',
    'The original Solution and Review are provenance and context, not authority or an instruction to accept the revision.',
    'Original Solution Work:',
    canonicalJson(originalSolutionWork),
    '',
    'Original Reviewer Review:',
    canonicalJson(originalReview),
    '',
    'Revised Solution Work:',
    canonicalJson(revisedSolutionWork),
  ].join('\n');
}

async function writeCreateOnly(path: string, value: string | unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const handle = await open(path, 'wx');
  try {
    await handle.writeFile(typeof value === 'string' ? value : `${canonicalJson(value)}\n`);
  } finally {
    await handle.close();
  }
}

async function runSolutionReviewerWithPrompt(
  input: RunSolutionReviewerInput,
  problemPackage: ProblemPackage,
  problemPackageSha256: string,
  assignedSkills: DeliveredParticipantSkill[],
  prompt: string,
): Promise<SolutionReviewerRunResult> {
  const invocationPath = join(input.destinationRoot, 'invocation.json');
  const rawOutputPath = join(input.destinationRoot, 'raw-output.txt');
  const reviewPath = join(input.destinationRoot, 'review.json');
  const failurePath = join(input.destinationRoot, 'failure.json');
  const commonInvocation = {
    schemaVersion: 'solution-reviewer-invocation-v2',
    invocationRef: input.invocationRef,
    jobNumber: input.jobNumber,
    role: 'reviewer',
    workspaceBaselineFingerprintSha256: input.workspaceBaselineFingerprintSha256,
    problemPackageSha256,
    participant: 'workspace-capable-agent',
    skillAssignments: input.skillAssignments,
  } as const;

  const deliveredSkills = assignedSkills.map(({ content: _content, ...provenance }) => provenance);
  await persistParticipantPromptAndBinding({
    destinationRoot: input.destinationRoot,
    prompt,
    participant: input.participant,
  });
  const job = await runWorkspaceAgentJob(
    {
      invocationRef: input.invocationRef,
      role: 'reviewer',
      workspaceRoot: input.workspaceRoot,
      prompt,
      traceArtifactPath: join(input.destinationRoot, 'execution-trace.json'),
    },
    input.participant,
  );

  if (!job.ok) {
    await writeCreateOnly(rawOutputPath, job.rawOutput ?? '');
    await writeCreateOnly(invocationPath, {
      ...commonInvocation,
      deliveredSkills,
      status: 'failed',
      errorKind: job.errorKind,
    });
    await writeCreateOnly(failurePath, { schemaVersion: 'solution-reviewer-failure-v1', errorKind: job.errorKind, message: job.message });
    return {
      ok: false,
      errorKind: job.errorKind,
      message: job.message,
      failure: classifyWorkspaceAgentFailure(job),
      invocationPath,
      rawOutputPath,
      failurePath,
    };
  }

  try {
    await writeCreateOnly(join(input.destinationRoot, 'stderr.txt'), job.stderr);
  } catch {
    // Available stderr is forensic sidecar evidence; preserve the semantic review result.
  }
  let review: SolutionReviewV1;
  const invalidOutputFailure = async (failure: ParticipantFailureFacts): Promise<SolutionReviewerRunResult> => {
    await writeCreateOnly(rawOutputPath, job.rawOutput);
    await writeCreateOnly(invocationPath, {
      ...commonInvocation,
      deliveredSkills,
      status: 'failed',
      errorKind: 'invalid_output',
    });
    await writeCreateOnly(failurePath, {
      schemaVersion: 'solution-reviewer-failure-v1',
      errorKind: 'invalid_output',
      message: failure.message,
    });
    return {
      ok: false,
      errorKind: 'invalid_output',
      message: failure.message,
      failure,
      invocationPath,
      rawOutputPath,
      failurePath,
    };
  };

  try {
    const envelope = validateStructuredTerminalEnvelope(job.rawOutput);
    if (!envelope.ok) {
      throw new ParticipantOutputValidationError({
        origin: 'OUTPUT_ENVELOPE',
        reason: envelope.reason === 'EMPTY'
          ? 'EMPTY_ENVELOPE'
          : envelope.reason === 'INVALID_JSON'
            ? 'INVALID_JSON_ENVELOPE'
            : 'NON_OBJECT_ENVELOPE',
        participantErrorKind: 'invalid_output',
        message: 'structured terminal envelope validation failed',
      });
    }
    review = validateSolutionReview(envelope.parsedObject);
  } catch (error) {
    const failure: ParticipantFailureFacts = error instanceof ParticipantOutputValidationError
      ? error.facts
      : {
          origin: 'OUTPUT_SCHEMA',
          reason: 'ROLE_SCHEMA_INVALID',
          participantErrorKind: 'invalid_output',
          message: String(error),
        };
    return invalidOutputFailure(failure);
  }

  try {
    if (review.problemId !== problemPackage.problemId) {
      throw new ParticipantOutputValidationError({
        origin: 'OUTPUT_IDENTITY',
        reason: 'PROBLEM_ID_MISMATCH',
        participantErrorKind: 'invalid_output',
        message: 'SolutionReview problemId does not match ProblemPackage',
      });
    }
    if (review.decision === 'ACCEPT_OPTION') {
      const selectedOption = input.solutionWork.options.find(option => option.optionId === review.acceptedOptionId);
      if (!selectedOption) {
        throw new ParticipantOutputValidationError({
          origin: 'OUTPUT_INTERNAL_CONSISTENCY',
          reason: 'OPTION_ID_MISMATCH',
          participantErrorKind: 'invalid_output',
          message: `acceptedOptionId does not exist in SolutionWork: ${review.acceptedOptionId}`,
        });
      }
      if (selectedOption.autonomousAuthoring) {
        const assessment = review.autonomousAuthoringAssessment;
        if (
          !assessment
          || assessment.contractId !== selectedOption.autonomousAuthoring.contractId
          || assessment.contractVersion !== selectedOption.autonomousAuthoring.contractVersion
          || assessment.applicabilityAssessment !== 'APPLICABLE'
          || assessment.conformance !== 'CONFORMING'
          || assessment.executionEnvelope !== 'WITHIN_ENVELOPE'
          || assessment.blockers.length !== 0
        ) {
          throw new ParticipantOutputValidationError({
            origin: 'OUTPUT_SCHEMA',
            reason: 'ROLE_SCHEMA_INVALID',
            participantErrorKind: 'invalid_output',
            message: 'accepted autonomousAuthoring option requires a matching conforming in-envelope assessment with no blockers',
          });
        }
      }
    }
    await validateReferences(review, input);
  } catch (error) {
    const failure: ParticipantFailureFacts = error instanceof ParticipantOutputValidationError
      ? error.facts
      : {
          origin: 'UNKNOWN',
          reason: 'UNCLASSIFIED',
          participantErrorKind: null,
          message: String(error),
        };
    return invalidOutputFailure(failure);
  }

  await writeCreateOnly(rawOutputPath, job.rawOutput);
  await writeCreateOnly(invocationPath, { ...commonInvocation, deliveredSkills, status: 'completed' });
  await writeCreateOnly(reviewPath, review);
  return { ok: true, review, invocationPath, rawOutputPath, reviewPath };
}

async function skillDeliveryFailure(
  input: RunSolutionReviewerInput,
  problemPackageSha256: string,
  error: unknown,
): Promise<SolutionReviewerRunResult> {
  const invocationPath = join(input.destinationRoot, 'invocation.json');
  const rawOutputPath = join(input.destinationRoot, 'raw-output.txt');
  const failurePath = join(input.destinationRoot, 'failure.json');
  const message = `assigned Skill delivery failed: ${String(error)}`;
  await writeCreateOnly(rawOutputPath, '');
  await writeCreateOnly(invocationPath, {
    schemaVersion: 'solution-reviewer-invocation-v2',
    invocationRef: input.invocationRef,
    jobNumber: input.jobNumber,
    role: 'reviewer',
    workspaceBaselineFingerprintSha256: input.workspaceBaselineFingerprintSha256,
    problemPackageSha256,
    participant: 'workspace-capable-agent',
    skillAssignments: input.skillAssignments,
    deliveredSkills: [],
    status: 'failed',
    errorKind: 'process',
  });
  await writeCreateOnly(failurePath, {
    schemaVersion: 'solution-reviewer-failure-v1',
    errorKind: 'process',
    message,
  });
  return {
    ok: false,
    errorKind: 'process',
    message,
    failure: {
      origin: 'HOST_INFRASTRUCTURE',
      reason: 'SKILL_DELIVERY_FAILURE',
      participantErrorKind: 'process',
      message,
    },
    invocationPath,
    rawOutputPath,
    failurePath,
  };
}

async function inputIdentityFailure(
  input: RunSolutionReviewerInput,
  problemPackageSha256: string,
  message: string,
): Promise<SolutionReviewerRunResult> {
  const invocationPath = join(input.destinationRoot, 'invocation.json');
  const rawOutputPath = join(input.destinationRoot, 'raw-output.txt');
  const failurePath = join(input.destinationRoot, 'failure.json');
  const failure: ParticipantFailureFacts = {
    origin: 'OUTPUT_IDENTITY',
    reason: 'PROBLEM_ID_MISMATCH',
    participantErrorKind: 'invalid_output',
    message,
  };
  await writeCreateOnly(rawOutputPath, '');
  await writeCreateOnly(invocationPath, {
    schemaVersion: 'solution-reviewer-invocation-v2',
    invocationRef: input.invocationRef,
    jobNumber: input.jobNumber,
    role: 'reviewer',
    workspaceBaselineFingerprintSha256: input.workspaceBaselineFingerprintSha256,
    problemPackageSha256,
    participant: 'workspace-capable-agent',
    skillAssignments: input.skillAssignments,
    deliveredSkills: [],
    status: 'failed',
    errorKind: 'invalid_output',
  });
  await writeCreateOnly(failurePath, {
    schemaVersion: 'solution-reviewer-failure-v1',
    errorKind: 'invalid_output',
    message,
  });
  return {
    ok: false,
    errorKind: 'invalid_output',
    message,
    failure,
    invocationPath,
    rawOutputPath,
    failurePath,
  };
}

export async function runSolutionReviewer(input: RunSolutionReviewerInput): Promise<SolutionReviewerRunResult> {
  const problemPackage = validateProblemPackage(input.problemPackage);
  if (input.solutionWork.problemId !== problemPackage.problemId) {
    let problemPackageSha256 = 'unavailable';
    try {
      problemPackageSha256 = sha256Hex(await readFile(input.problemPackagePath));
    } catch {
      // Identity mismatch already established from in-memory ProblemPackage; keep hash best-effort.
    }
    return inputIdentityFailure(
      input,
      problemPackageSha256,
      'SolutionWork problemId does not match ProblemPackage',
    );
  }
  const problemPackageSha256 = sha256Hex(await readFile(input.problemPackagePath));
  let assignedSkills: DeliveredParticipantSkill[];
  try {
    assignedSkills = await loadParticipantSkills(input.workspaceRoot, input.skillAssignments);
  } catch (error) {
    return skillDeliveryFailure(input, problemPackageSha256, error);
  }
  return runSolutionReviewerWithPrompt(
    input,
    problemPackage,
    problemPackageSha256,
    assignedSkills,
    buildSolutionReviewerPrompt(
      problemPackage,
      input.solutionWork,
      assignedSkills,
      input.autonomousAuthoringContractPacket,
    ),
  );
}

export async function runSolutionReReviewer(
  input: RunSolutionReReviewerInput,
): Promise<SolutionReviewerRunResult> {
  const problemPackage = validateProblemPackage(input.problemPackage);
  const originalSolutionWork = validateSolutionWork(input.originalSolutionWork);
  const originalReview = validateSolutionReview(input.originalReview);
  const revisedSolutionWork = validateSolutionWork(input.solutionWork);
  if (
    originalSolutionWork.problemId !== problemPackage.problemId
    || originalReview.problemId !== problemPackage.problemId
    || revisedSolutionWork.problemId !== problemPackage.problemId
  ) {
    let problemPackageSha256 = 'unavailable';
    try {
      problemPackageSha256 = sha256Hex(await readFile(input.problemPackagePath));
    } catch {
      // Identity mismatch already established from in-memory ProblemPackage; keep hash best-effort.
    }
    return inputIdentityFailure(
      input,
      problemPackageSha256,
      're-review source problemId does not match ProblemPackage',
    );
  }
  const problemPackageSha256 = sha256Hex(await readFile(input.problemPackagePath));
  let assignedSkills: DeliveredParticipantSkill[];
  try {
    assignedSkills = await loadParticipantSkills(input.workspaceRoot, input.skillAssignments);
  } catch (error) {
    return skillDeliveryFailure(input, problemPackageSha256, error);
  }
  return runSolutionReviewerWithPrompt(
    input,
    problemPackage,
    problemPackageSha256,
    assignedSkills,
    buildSolutionReReviewerPrompt(
      problemPackage,
      originalSolutionWork,
      originalReview,
      revisedSolutionWork,
      assignedSkills,
      input.autonomousAuthoringContractPacket,
    ),
  );
}
