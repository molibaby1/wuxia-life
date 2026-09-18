import { mkdir, open, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import {
  validateProblemPackage,
  type ProblemPackage,
} from '../../../src/evolution/problemPackageContract';
import {
  validateSolutionWork,
  type SolutionWorkV1,
} from '../../../src/evolution/solutionWorkContract';
import {
  validateSolutionReview,
  type SolutionReviewV1,
} from '../../../src/evolution/solutionReviewContract';
import { renderStructuredFinalOutputContractV1 } from '../../../src/evolution/participantStructuredOutputContract';
import { canonicalJson, sha256Hex } from '../phase0/provenance';
import {
  type WorkspaceAgentJobFailure,
  type WorkspaceAgentParticipantOptions,
} from './agentParticipant';
import { isEnvelopeRetransmissionEnabledForRole } from './envelopeRetransmission';
import { runStructuredParticipantExecution } from './runStructuredParticipantExecution';
import {
  assertArtifactReferenceFile,
  assertRepoReferenceFileAgainstAuthoritative,
} from './repoReference';
import {
  ParticipantOutputValidationError,
  type ParticipantFailureFacts,
} from './participantFailureClassification';
import {
  loadParticipantSkills,
  type ParticipantSkillAssignment,
  type DeliveredParticipantSkill,
} from './solutionParticipantSkills';

export interface RunSolutionAgentInput {
  problemPackage: ProblemPackage;
  problemPackagePath: string;
  workspaceRoot: string;
  repositoryRoot: string;
  artifactRoot: string;
  workspaceBaselineFingerprintSha256: string;
  invocationRef: string;
  jobNumber: number;
  destinationRoot: string;
  skillAssignments: readonly ParticipantSkillAssignment[];
  participant: WorkspaceAgentParticipantOptions;
}

export interface RunSolutionRevisionInput extends RunSolutionAgentInput {
  originalSolutionWork: SolutionWorkV1;
  originalReview: SolutionReviewV1;
}

export type SolutionAgentRunResult =
  | {
    ok: true;
    result: SolutionWorkV1;
    invocationPath: string;
    rawOutputPath: string;
    resultPath: string;
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

async function validateReferences(result: SolutionWorkV1, input: RunSolutionAgentInput): Promise<void> {
  const repoRefs = [
    ...result.repoRefs,
    ...result.options.flatMap(option => option.repoRefs),
  ];
  const artifactRefs = [
    ...result.artifactRefs,
    ...result.options.flatMap(option => option.artifactRefs),
  ];
  for (const reference of repoRefs) {
    await assertRepoReferenceFileAgainstAuthoritative({
      workspaceRoot: input.workspaceRoot,
      authoritativeRoot: input.repositoryRoot,
      reference,
      label: 'repoRef',
    });
  }
  for (const reference of artifactRefs) {
    await assertArtifactReferenceFile({
      artifactRoot: input.artifactRoot,
      workspaceRoot: input.workspaceRoot,
      authoritativeRoot: input.repositoryRoot,
      reference,
      label: 'artifactRef',
    });
  }
}

function renderSolutionWorkSchemaGuidance(): string {
  return [
    'Solution-specific schema guidance for the existing SolutionWorkV1 receiver contract:',
    'SolutionWorkV1 top-level required fields:',
    '- schemaVersion = "solution-work-v1"',
    '- status',
    '- problemId',
    '- options',
    '- summary',
    '- repoRefs',
    '- artifactRefs',
    'recommendedOptionId is optional and is valid only when status is OPTIONS.',
    'status must be exactly one of: OPTIONS, NO_PROPOSAL, INSUFFICIENT_EVIDENCE, ESCALATE.',
    'For status OPTIONS, options must contain 1 to 3 options; for any non-OPTIONS status, options must be exactly []. The options array may contain at most three options.',
    'optionId must be exactly option-000001, option-000002, or option-000003 for the first, second, or third option respectively, in participant order.',
    'changeScope must be exactly one of: configuration, program, mixed, uncertain.',
    'recommendedOptionId is allowed only for OPTIONS and must reference an actual option in that options array.',
    'The root object and every option object must contain no extra fields beyond the fields listed in this guidance.',
    'For OPTIONS, every SolutionOptionV1 requires these fields:',
    '- optionId',
    '- proposedChange',
    '- rationale',
    '- repoRefs',
    '- artifactRefs',
    '- changeScope',
    '- expectedPlayerObservableDifference',
    '- risks',
    '- unknowns',
    'Deterministic field shapes: problemId and summary must be non-empty strings.',
    'At the root, repoRefs and artifactRefs must be arrays; when non-empty, every element must be a non-empty string.',
    'For each option, proposedChange, rationale, and expectedPlayerObservableDifference must be non-empty strings.',
    'For each option, repoRefs, artifactRefs, risks, and unknowns must be arrays; when non-empty, every element must be a non-empty string.',
    'The reference arrays exist at two distinct levels and both levels are required: SolutionWorkV1.repoRefs and SolutionWorkV1.artifactRefs are required top-level fields on the root object, while SolutionWorkV1.options[n].repoRefs and SolutionWorkV1.options[n].artifactRefs are required fields inside every option. Option refs do not replace the required root refs, and root refs do not replace each option\'s refs.',
  ].join('\n');
}

export function buildSolutionAgentPrompt(
  problemPackage: ProblemPackage,
  assignedSkills: DeliveredParticipantSkill[],
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
    'You own investigation and solution reasoning.',
    'You may run commands and make temporary changes inside this disposable workspace.',
    'Do not modify or assume access to the authoritative repository.',
    'Return zero to three options or an explicit no-proposal/insufficient-evidence/escalate result.',
    'Program/code recommendations are allowed, but execution permission is separate.',
    'Before recommending an option, read the relevant supplied authorityRefs and the current authorities they explicitly delegate to. Check both permitted behavior and explicit exclusions against the proposed change.',
    'Existing implementation support, a configuration-only change, or passing tests does not establish product authorization. Do not recommend a workaround that recreates behavior an authority explicitly excludes.',
    'The Problem Package permission flags constrain this investigation job: you must not execute product changes. They do not by themselves require rejecting or escalating an otherwise authority-compliant configuration proposal. Acceptance is an assessment, not execution permission; the Host separately enforces execution eligibility and allowedWritePaths in the isolated evolution workspace. Explicit product exclusions and program/runtime/Contract/Schema escalation boundaries still apply.',
    'Use the existing rationale/summary and repoRefs fields to identify the applicable authority clauses and any unresolved conflict. If the desired change requires revising product authority, state that boundary instead of describing the change as already compliant.',
    'Make each option reviewable in the existing fields: proposedChange identifies the concrete target and before/after change; rationale and risks identify the semantics to preserve and a bounded verification method. Do not leave new product choices to the implementer or invent exact values merely to appear executable. Keep unresolved choices in unknowns and distinguish them from an executable recommendation.',
    'For a blocking unknown, use summary or option unknowns to state what the supplied evidence already answers, the smallest discriminating check, its starting repo/artifact reference, and which result would allow progress. First use relevant evidence available within this job; do not assume access to other runs or request hidden evidence. Distinguish a local investigation step from new sampling or a product-authority decision.',
    'Do not require cross-run prevalence to resolve a problem explicitly bounded to the observed case; require broader evidence only for a broader claim or when it could change the proposed action. If one candidate conflicts with authority, consider whether an evidence-supported alternative within current boundaries remains before concluding that the problem requires an authority change. Do not force an alternative or weaken existing escalation rules.',
    'Diagnostic evidence referenced by the Problem Package is trusted internal source-run provenance. It is not player-observable evidence. Producer attribution identifies which captured runtime producer generated an observed entry; it does not by itself prove the broader causal mechanism or that a proposed change is correct.',
    'The observable payload referenced by ProblemPackage.source.observablePayloadRef may include validated Experience Semantic Context on each entry. Read it as player-observable meaning: milestone meaning, life-stage meaning, experience category, and expected experience signals.',
    'The Experience Semantic Context is descriptive only. It contains no hidden runtime state, and you must not treat it as a solution recommendation, quality score, authority, or permission.',
    renderStructuredFinalOutputContractV1({
      roleSchemaName: 'SolutionWorkV1',
    }),
    renderSolutionWorkSchemaGuidance(),
    '',
    'Convergence discipline (Solution work only):',
    '- Investigate only far enough to form a small set of plausible, repository-grounded explanations; do not treat the task as an exhaustive repository audit.',
    '- Once plausible candidates have formed, stop broad exploration and run a pre-synthesis convergence checkpoint before synthesis.',
    '- At that checkpoint, identify pending checks that could materially change the problem interpretation, causal explanation, proposal, implementation scope, authority handoff, or terminal status.',
    '- For each material pending check, first identify the decision-relevant subquestion and the minimum sufficient evidence needed to answer it.',
    '- Classify each subquestion by its minimum sufficient evidence, not by the strongest conceivable verification method; stronger dynamic verification may add confidence without being required for the static answer.',
    '- If read-only repository evidence such as source, configuration, or existing tests can answer a material subquestion, keep that subquestion local/static and complete it before synthesis.',
    '- Split compound checks into independently actionable parts: local/static investigation, unavailable dynamic input, and product/authority decision.',
    '- Complete every local/static investigation part that is locally available, material, and bounded before synthesis.',
    '- Separate only the unresolved remainder that truly requires missing runtime, seed, history, or selected-ID input as unavailable dynamic input; unavailable stronger verification must not reclassify an answerable static subquestion.',
    '- An unavailable dynamic input must not block other locally actionable local/static checks; record it as an unknown when it cannot be obtained in this job.',
    '- After completing those checks, update candidate, proposal, and unknowns.',
    '- Synthesis is permitted only when no remaining local, material, bounded pending check remains.',
    '- Prefer targeted symbol/path searches and focused reads. Avoid repeated broad searches, repeated full-file reads, and large recursive output unless they answer a new specific question.',
    '- If verification undermines all candidates, you may perform one bounded re-grounding pass and form a new candidate set; do not repeatedly return to broad exploration.',
    '- If the evidence supports a reviewable option after the checkpoint, return OPTIONS. If a material unknown remains that available evidence cannot resolve, return INSUFFICIENT_EVIDENCE; if the remaining boundary requires product authority, return ESCALATE.',
    '- This checkpoint does not require an exhaustive audit or repository-wide exploration; it only closes remaining local, material, bounded checks before synthesis.',
    '- Use INSUFFICIENT_EVIDENCE only after grounded investigation and candidate verification leave a material unknown that the available evidence cannot resolve. Use NO_PROPOSAL only when the evidence supports that no change should be proposed. Neither is a time-budget escape hatch.',
    '- Produce a repository-grounded result that Reviewer can independently assess; do not perform an exhaustive second-pass review yourself.',
    '',
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
    'Problem Package (the package references evidence; interpret it yourself):',
    canonicalJson(problemPackage),
  ].join('\n');
}

export function buildSolutionRevisionPrompt(
  problemPackage: ProblemPackage,
  originalSolutionWork: SolutionWorkV1,
  originalReview: SolutionReviewV1,
  assignedSkills: DeliveredParticipantSkill[],
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
    'You are a fresh Solution Participant performing one bounded revision in a separate disposable workspace.',
    'Reviewer concerns are feedback to investigate, not ground truth. Re-check them against the Problem Package and repository evidence.',
    'Perform bounded work only: investigate the concrete decision-relevant follow-up in the current execution context and do not broaden the problem.',
    'If unavailable evidence prevents resolving a material question, return INSUFFICIENT_EVIDENCE. If Human authority is required for the remaining decision, return ESCALATE.',
    'Do not manufacture another player run to satisfy this revision. Do not execute authoritative product changes.',
    'Return a fresh SolutionWorkV1 result using the existing output contract. Preserve authority, permission, and scope boundaries; do not treat the Reviewer request as permission.',
    renderStructuredFinalOutputContractV1({ roleSchemaName: 'SolutionWorkV1' }),
    renderSolutionWorkSchemaGuidance(),
    '',
    'Assigned Skills (working methods only; they do not grant authority):',
    ...skillSections,
    'Reference format requirements:',
    '- repoRefs must reference repository-relative regular files.',
    '- artifactRefs must be relative regular-file paths only.',
    '- Do not use line locators, # fragments, entry selectors, JSON selectors, or globs in artifactRefs.',
    '',
    'Problem Package:',
    canonicalJson(problemPackage),
    '',
    'Original Solution Work:',
    canonicalJson(originalSolutionWork),
    '',
    'Original Reviewer Review:',
    canonicalJson(originalReview),
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

async function runSolutionAgentWithPrompt(
  input: RunSolutionAgentInput,
  problemPackage: ProblemPackage,
  problemPackageSha256: string,
  assignedSkills: DeliveredParticipantSkill[],
  prompt: string,
): Promise<SolutionAgentRunResult> {
  const invocationPath = join(input.destinationRoot, 'invocation.json');
  const rawOutputPath = join(input.destinationRoot, 'raw-output.txt');
  const resultPath = join(input.destinationRoot, 'result.json');
  const failurePath = join(input.destinationRoot, 'failure.json');
  const commonInvocation = {
    schemaVersion: 'solution-agent-invocation-v2',
    invocationRef: input.invocationRef,
    jobNumber: input.jobNumber,
    role: 'solution',
    workspaceBaselineFingerprintSha256: input.workspaceBaselineFingerprintSha256,
    problemPackageSha256,
    participant: 'workspace-capable-agent',
    skillAssignments: input.skillAssignments,
  } as const;

  const deliveredSkills = assignedSkills.map(({ content: _content, ...provenance }) => provenance);
  const execution = await runStructuredParticipantExecution<SolutionWorkV1>({
    invocationRef: input.invocationRef,
    role: 'solution',
    workspaceRoot: input.workspaceRoot,
    destinationRoot: input.destinationRoot,
    initialPrompt: prompt,
    expectedRoleSchemaName: 'SolutionWorkV1',
    participant: input.participant,
    retransmissionEnabled: isEnvelopeRetransmissionEnabledForRole('solution'),
    validateSchema: validateSolutionWork,
    validateAcceptedResult: async result => {
      if (result.problemId !== problemPackage.problemId) {
        throw new ParticipantOutputValidationError({
          origin: 'OUTPUT_IDENTITY',
          reason: 'PROBLEM_ID_MISMATCH',
          participantErrorKind: 'invalid_output',
          message: 'SolutionWork problemId does not match ProblemPackage',
        });
      }
      await validateReferences(result, input);
    },
  });
  await writeCreateOnly(join(input.destinationRoot, 'execution-trace.json'), execution.executionTrace);

  if (!execution.ok) {
    await writeCreateOnly(rawOutputPath, execution.rawOutput ?? '');
    await writeCreateOnly(invocationPath, {
      ...commonInvocation,
      deliveredSkills,
      status: 'failed',
      errorKind: execution.errorKind,
    });
    await writeCreateOnly(failurePath, {
      schemaVersion: 'solution-agent-failure-v1',
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

  await writeCreateOnly(rawOutputPath, execution.rawOutput);
  try {
    await writeCreateOnly(join(input.destinationRoot, 'stderr.txt'), execution.stderr);
  } catch {
    // stderr is forensic sidecar evidence; preserve the accepted Solution outcome if it cannot be written.
  }
  await writeCreateOnly(invocationPath, { ...commonInvocation, deliveredSkills, status: 'completed' });
  await writeCreateOnly(resultPath, execution.value);
  return { ok: true, result: execution.value, invocationPath, rawOutputPath, resultPath };
}

async function skillDeliveryFailure(
  input: RunSolutionAgentInput,
  problemPackageSha256: string,
  error: unknown,
): Promise<SolutionAgentRunResult> {
  const invocationPath = join(input.destinationRoot, 'invocation.json');
  const rawOutputPath = join(input.destinationRoot, 'raw-output.txt');
  const failurePath = join(input.destinationRoot, 'failure.json');
  const message = `assigned Skill delivery failed: ${String(error)}`;
  await writeCreateOnly(rawOutputPath, '');
  await writeCreateOnly(invocationPath, {
    schemaVersion: 'solution-agent-invocation-v2',
    invocationRef: input.invocationRef,
    jobNumber: input.jobNumber,
    role: 'solution',
    workspaceBaselineFingerprintSha256: input.workspaceBaselineFingerprintSha256,
    problemPackageSha256,
    participant: 'workspace-capable-agent',
    skillAssignments: input.skillAssignments,
    deliveredSkills: [],
    status: 'failed',
    errorKind: 'process',
  });
  await writeCreateOnly(failurePath, {
    schemaVersion: 'solution-agent-failure-v1',
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
  input: RunSolutionAgentInput,
  problemPackageSha256: string,
  message: string,
): Promise<SolutionAgentRunResult> {
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
    schemaVersion: 'solution-agent-invocation-v2',
    invocationRef: input.invocationRef,
    jobNumber: input.jobNumber,
    role: 'solution',
    workspaceBaselineFingerprintSha256: input.workspaceBaselineFingerprintSha256,
    problemPackageSha256,
    participant: 'workspace-capable-agent',
    skillAssignments: input.skillAssignments,
    deliveredSkills: [],
    status: 'failed',
    errorKind: 'invalid_output',
  });
  await writeCreateOnly(failurePath, {
    schemaVersion: 'solution-agent-failure-v1',
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

export async function runSolutionAgent(input: RunSolutionAgentInput): Promise<SolutionAgentRunResult> {
  const problemPackage = validateProblemPackage(input.problemPackage);
  const problemPackageSha256 = sha256Hex(await readFile(input.problemPackagePath));
  let assignedSkills: DeliveredParticipantSkill[];
  try {
    assignedSkills = await loadParticipantSkills(input.workspaceRoot, input.skillAssignments);
  } catch (error) {
    return skillDeliveryFailure(input, problemPackageSha256, error);
  }
  return runSolutionAgentWithPrompt(
    input,
    problemPackage,
    problemPackageSha256,
    assignedSkills,
    buildSolutionAgentPrompt(problemPackage, assignedSkills),
  );
}

export async function runSolutionRevisionAgent(
  input: RunSolutionRevisionInput,
): Promise<SolutionAgentRunResult> {
  const problemPackage = validateProblemPackage(input.problemPackage);
  const originalSolutionWork = validateSolutionWork(input.originalSolutionWork);
  const originalReview = validateSolutionReview(input.originalReview);
  if (originalSolutionWork.problemId !== problemPackage.problemId || originalReview.problemId !== problemPackage.problemId) {
    let problemPackageSha256 = 'unavailable';
    try {
      problemPackageSha256 = sha256Hex(await readFile(input.problemPackagePath));
    } catch {
      // Identity mismatch already established from in-memory ProblemPackage; keep hash best-effort.
    }
    return inputIdentityFailure(
      input,
      problemPackageSha256,
      'revision source problemId does not match ProblemPackage',
    );
  }
  const problemPackageSha256 = sha256Hex(await readFile(input.problemPackagePath));
  let assignedSkills: DeliveredParticipantSkill[];
  try {
    assignedSkills = await loadParticipantSkills(input.workspaceRoot, input.skillAssignments);
  } catch (error) {
    return skillDeliveryFailure(input, problemPackageSha256, error);
  }
  return runSolutionAgentWithPrompt(
    input,
    problemPackage,
    problemPackageSha256,
    assignedSkills,
    buildSolutionRevisionPrompt(problemPackage, originalSolutionWork, originalReview, assignedSkills),
  );
}
