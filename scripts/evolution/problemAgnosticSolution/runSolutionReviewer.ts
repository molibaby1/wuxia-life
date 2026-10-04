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
import { validateSolutionWork, type SolutionWorkV1 } from '../../../src/evolution/solutionWorkContract';
import { renderStructuredFinalOutputContractV1 } from '../../../src/evolution/participantStructuredOutputContract';
import { canonicalJson, sha256Hex } from '../phase0/provenance';
import {
  ParticipantOutputValidationError,
  type ParticipantFailureFacts,
} from './participantFailureClassification';
import {
  type WorkspaceAgentJobFailure,
  type WorkspaceAgentParticipantOptions,
} from './agentParticipant';
import { runStructuredParticipantExecution } from './runStructuredParticipantExecution';
import {
  assertArtifactReferenceFile,
  assertRepoReferenceFileAgainstAuthoritative,
} from './repoReference';
import {
  loadParticipantSkills,
  type ParticipantSkillAssignment,
  type DeliveredParticipantSkill,
} from './solutionParticipantSkills';
import type { PreschoolAutonomousAuthoringContractPacketV1 } from '../autonomousAuthoring/buildPreschoolContractPacket';
import type { PreschoolReferenceResponsibilityContextV1 } from '../autonomousAuthoring/preschoolReferenceResponsibilityBrief';

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
  referenceResponsibilityContext?: PreschoolReferenceResponsibilityContextV1;
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
  referenceContext?: PreschoolReferenceResponsibilityContextV1,
): string[] {
  if (!packet) return [];
  return [
    'The Contract Packet is a Host-validated, provenance-bound safe projection of the accepted Contract authority.',
    'authoritySourceRef and authoritySourceSha256 are provenance metadata. The Host has already verified the source authority bytes against the immutable Contract identity before constructing this packet.',
    'For contamination-controlled historical trials, the full source authority may intentionally be absent from the Participant workspace. Do not require access to that intentionally withheld answer-bearing source document as a prerequisite for using the supplied Contract Packet.',
    'Participant-safe Autonomous Authoring Contract Packet:',
    canonicalJson(packet),
    ...(referenceContext ? [
      'The supplied responsibility set is Human-approved input for Layer A.',
      `Read the Reference Responsibility Brief at ${referenceContext.briefRef} and attestation at ${referenceContext.attestationRef}: ${canonicalJson(referenceContext.brief)}`,
      'Do not evaluate whether Solution independently discovered the responsibilities. Do not request proof that the brief responsibilities were derived from the historical observable payload; that is outside Layer A.',
      "Verify one-to-one preservation by comparing the selected option's autonomousAuthoring.responsibilities with that option's contractPayload.cards: no addition, omission, merge, or split; each Card must preserve its corresponding responsibility.",
      'Do not copy the responsibility list into autonomousAuthoringAssessment. Record the independent responsibility-preservation conclusion in autonomousAuthoringAssessment.assessment and/or concerns; the Host independently performs the mechanical one-to-one responsibility gate.',
      'authoritySourceRef in the Contract Packet is provenance metadata. If the full source authority is intentionally withheld from this Participant workspace, do not emit authoritySourceRef as a repoRef. Use the Contract Packet artifact and materialized delegated authority documents for review and provenance instead.',
      'This Reviewer invocation occurs after the attempt-specific Layer A execution authorization has already been Host-admitted for this governed historical trial. Do not request that trial-launch authorization again.',
      'This Host protocol fact does not prescribe the Reviewer decision, applicability, or conformance. executionAuthorityAssessment concerns whether the already Human-approved reusable Contract delegates isolated shadow execution for this proposal. When PD-121 Contract coverage applies, use WITHIN_CURRENT_AUTHORITY for shadow execution. This does not authorize authoritative repository promotion, which remains Human-controlled.',
      'The Human brief does not force ACCEPT_OPTION or APPLICABLE.',
    ] : []),
    ...(solutionWork.options.some(option => option.autonomousAuthoring !== undefined) ? [
      'For an option carrying autonomousAuthoring, independently inspect the current catalog and allowed evidence.',
      'PD-121 transient-role clarification: TRANSIENT_ROLE permits transient familiar roles such as playmate or familiar adult when the vignette does not require a stable identity. A one-shot passive vignette may include familiarity, conflict, repair, farewell, absence, or changed everyday contact; these alone do not create formal Person/Relationship semantics. Use CONTRACT_CHANGE_REQUIRED if the experience requires stable identity, later/cross-event recognition of the same person, durable person facts, relationship state/progression, a future hook or consumer depending on continuity, or new Person/Relationship Runtime, Schema, registry, score, stage, or abstraction. Do not escalate solely for prior familiarity or a one-shot social transition.',
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
      'autonomousAuthoringAssessment must contain exactly these fields: schemaVersion="autonomous-authoring-review-assessment-v1", contractId, contractVersion, applicabilityAssessment, conformance, executionEnvelope, assessment, blockers. No responsibilities field or other extra fields.',
    ] : []),
    ...(referenceContext && solutionWork.options.some(option => option.autonomousAuthoring !== undefined) ? [
      'For APPLICABLE proposals, the selected option proposal and its Cards must preserve each brief responsibility exactly once; primaryLifeFunction and playerVisibleNeed must exactly match the brief, and proposal responsibility evidenceRefs are empty.',
      'Verify developmental age reasoning is independently authored, concrete scene is independently authored, closest-entry distinction is independently authored, shared-neutral portability is independently established, transient-role and no-new-state boundaries hold, and implementation remains inside Contract v1.',
    ] : []),
  ];
}

export function buildSolutionReviewerPrompt(
  problemPackage: ProblemPackage,
  solutionWork: SolutionWorkV1,
  assignedSkills: DeliveredParticipantSkill[],
  autonomousAuthoringContractPacket?: PreschoolAutonomousAuthoringContractPacketV1,
  referenceResponsibilityContext?: PreschoolReferenceResponsibilityContextV1,
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
    ...renderAutonomousAuthoringReviewGuidance(solutionWork, autonomousAuthoringContractPacket, referenceResponsibilityContext),
    ...(autonomousAuthoringContractPacket ? [''] : []),
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
  referenceResponsibilityContext?: PreschoolReferenceResponsibilityContextV1,
): string {
  return [
    buildSolutionReviewerPrompt(problemPackage, revisedSolutionWork, assignedSkills, autonomousAuthoringContractPacket, referenceResponsibilityContext),
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
  const execution = await runStructuredParticipantExecution<SolutionReviewV1>({
    invocationRef: input.invocationRef,
    role: 'reviewer',
    workspaceRoot: input.workspaceRoot,
    destinationRoot: input.destinationRoot,
    initialPrompt: prompt,
    expectedRoleSchemaName: 'SolutionReviewV1',
    participant: input.participant,
    structuredResultDelivery: { kind: 'TERMINAL_JSON' },
    retransmissionEnabled: true,
    validateSchema: validateSolutionReview,
    validateAcceptedResult: async review => {
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
    },
  });

  await writeCreateOnly(rawOutputPath, execution.rawOutput ?? '');
  await writeCreateOnly(join(input.destinationRoot, 'execution-trace.json'), execution.executionTrace);
  if (!execution.ok) {
    await writeCreateOnly(invocationPath, {
      ...commonInvocation,
      deliveredSkills,
      status: 'failed',
      errorKind: execution.errorKind,
    });
    await writeCreateOnly(failurePath, {
      schemaVersion: 'solution-reviewer-failure-v1',
      errorKind: execution.errorKind,
      message: execution.message,
    });
    return {
      ok: false,
      errorKind: execution.errorKind,
      message: execution.message,
      failure: execution.failure,
      invocationPath,
      rawOutputPath,
      failurePath,
    };
  }

  try {
    await writeCreateOnly(join(input.destinationRoot, 'stderr.txt'), execution.stderr);
  } catch {
    // Available stderr is forensic sidecar evidence; preserve the semantic review result.
  }
  await writeCreateOnly(invocationPath, { ...commonInvocation, deliveredSkills, status: 'completed' });
  await writeCreateOnly(reviewPath, execution.value);
  return { ok: true, review: execution.value, invocationPath, rawOutputPath, reviewPath };
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
      input.referenceResponsibilityContext,
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
      input.referenceResponsibilityContext,
    ),
  );
}
