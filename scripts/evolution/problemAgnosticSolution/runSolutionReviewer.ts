import { lstat, mkdir, open, readFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import {
  validateProblemPackage,
  type ProblemPackage,
} from '../../../src/evolution/problemPackageContract';
import {
  parseSolutionReview,
  type SolutionReviewV1,
} from '../../../src/evolution/solutionReviewContract';
import type { SolutionWorkV1 } from '../../../src/evolution/solutionWorkContract';
import { renderStructuredFinalOutputContractV1 } from '../../../src/evolution/participantStructuredOutputContract';
import { canonicalJson, sha256Hex } from '../phase0/provenance';
import {
  runWorkspaceAgentJob,
  type WorkspaceAgentJobFailure,
  type WorkspaceAgentParticipantOptions,
} from './agentParticipant';
import { assertRepoReferenceFile } from './repoReference';
import {
  loadParticipantSkills,
  type ParticipantSkillAssignment,
  type DeliveredParticipantSkill,
} from './solutionParticipantSkills';

export interface RunSolutionReviewerInput {
  problemPackage: ProblemPackage;
  problemPackagePath: string;
  solutionWork: SolutionWorkV1;
  workspaceRoot: string;
  artifactRoot: string;
  workspaceBaselineFingerprintSha256: string;
  invocationRef: string;
  jobNumber: number;
  destinationRoot: string;
  skillAssignments: readonly ParticipantSkillAssignment[];
  participant: WorkspaceAgentParticipantOptions;
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
    invocationPath: string;
    rawOutputPath: string;
    failurePath: string;
  };

function assertPathInside(root: string, reference: string, label: string): string {
  if (!reference || isAbsolute(reference)) throw new Error(`${label} must be a relative path: ${reference}`);
  const resolvedRoot = resolve(root);
  const target = resolve(resolvedRoot, reference);
  const escaped = relative(resolvedRoot, target);
  if (!escaped || escaped === '..' || escaped.startsWith(`..${sep}`) || isAbsolute(escaped)) {
    throw new Error(`${label} escapes its allowed root: ${reference}`);
  }
  return target;
}

async function assertFile(root: string, reference: string, label: string): Promise<void> {
  const stat = await lstat(assertPathInside(root, reference, label));
  if (!stat.isFile()) throw new Error(`${label} must resolve to a regular file: ${reference}`);
}

async function validateReferences(review: SolutionReviewV1, input: RunSolutionReviewerInput): Promise<void> {
  for (const reference of review.repoRefs) {
    await assertRepoReferenceFile(input.workspaceRoot, reference, 'review repoRef');
  }
  for (const reference of review.artifactRefs) {
    try {
      await assertFile(input.artifactRoot, reference, 'review artifactRef');
    } catch {
      await assertFile(input.workspaceRoot, reference, 'review artifactRef');
    }
  }
}

export function buildSolutionReviewerPrompt(
  problemPackage: ProblemPackage,
  solutionWork: SolutionWorkV1,
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
    'Independently inspect the repository and referenced artifacts before reviewing this result.',
    'You are a fresh Reviewer Participant in a separate disposable workspace.',
    'You may reject all options. Do not assume the Solution Participant is correct.',
    'Assess problem-solution fit, evidence, risks, and permission/scope boundaries.',
    'Diagnostic evidence referenced by the Problem Package is trusted internal source-run provenance. It is not player-observable evidence. Producer attribution identifies which captured runtime producer generated an observed entry; it does not by itself prove the broader causal mechanism or that a proposed change is correct.',
    renderStructuredFinalOutputContractV1({
      roleSchemaName: 'SolutionReviewV1',
    }),
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
    'Problem Package:',
    canonicalJson(problemPackage),
    '',
    'Structured Solution Result:',
    canonicalJson(solutionWork),
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

export async function runSolutionReviewer(input: RunSolutionReviewerInput): Promise<SolutionReviewerRunResult> {
  const problemPackage = validateProblemPackage(input.problemPackage);
  const problemPackageSha256 = sha256Hex(await readFile(input.problemPackagePath));
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

  let assignedSkills: DeliveredParticipantSkill[];
  try {
    assignedSkills = await loadParticipantSkills(input.workspaceRoot, input.skillAssignments);
  } catch (error) {
    const message = `assigned Skill delivery failed: ${String(error)}`;
    await writeCreateOnly(rawOutputPath, '');
    await writeCreateOnly(invocationPath, {
      ...commonInvocation,
      deliveredSkills: [],
      status: 'failed',
      errorKind: 'process',
    });
    await writeCreateOnly(failurePath, {
      schemaVersion: 'solution-reviewer-failure-v1',
      errorKind: 'process',
      message,
    });
    return { ok: false, errorKind: 'process', message, invocationPath, rawOutputPath, failurePath };
  }

  const deliveredSkills = assignedSkills.map(({ content: _content, ...provenance }) => provenance);
  const prompt = buildSolutionReviewerPrompt(problemPackage, input.solutionWork, assignedSkills);
  const job = await runWorkspaceAgentJob(
    {
      invocationRef: input.invocationRef,
      role: 'reviewer',
      workspaceRoot: input.workspaceRoot,
      prompt,
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
    return { ok: false, errorKind: job.errorKind, message: job.message, invocationPath, rawOutputPath, failurePath };
  }

  let review: SolutionReviewV1;
  try {
    review = parseSolutionReview(job.rawOutput.trim());
    if (review.problemId !== problemPackage.problemId) throw new Error('SolutionReview problemId does not match ProblemPackage');
    if (review.decision === 'ACCEPT_OPTION' && !input.solutionWork.options.some(option => option.optionId === review.acceptedOptionId)) {
      throw new Error(`acceptedOptionId does not exist in SolutionWork: ${review.acceptedOptionId}`);
    }
    await validateReferences(review, input);
  } catch (error) {
    await writeCreateOnly(rawOutputPath, job.rawOutput);
    await writeCreateOnly(invocationPath, {
      ...commonInvocation,
      deliveredSkills,
      status: 'failed',
      errorKind: 'invalid_output',
    });
    await writeCreateOnly(failurePath, { schemaVersion: 'solution-reviewer-failure-v1', errorKind: 'invalid_output', message: String(error) });
    return { ok: false, errorKind: 'invalid_output', message: String(error), invocationPath, rawOutputPath, failurePath };
  }

  await writeCreateOnly(rawOutputPath, job.rawOutput);
  await writeCreateOnly(invocationPath, { ...commonInvocation, deliveredSkills, status: 'completed' });
  await writeCreateOnly(reviewPath, review);
  return { ok: true, review, invocationPath, rawOutputPath, reviewPath };
}
