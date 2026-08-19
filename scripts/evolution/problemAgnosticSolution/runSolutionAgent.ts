import { lstat, mkdir, open, readFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve, sep, join } from 'node:path';
import {
  validateProblemPackage,
  type ProblemPackageV1,
} from '../../../src/evolution/problemPackageContract';
import {
  parseSolutionWork,
  type SolutionWorkV1,
} from '../../../src/evolution/solutionWorkContract';
import { canonicalJson, sha256Hex } from '../phase0/provenance';
import {
  runWorkspaceAgentJob,
  type WorkspaceAgentJobFailure,
  type WorkspaceAgentParticipantOptions,
} from './agentParticipant';
import { assertRepoReferenceFile } from './repoReference';

export interface RunSolutionAgentInput {
  problemPackage: ProblemPackageV1;
  problemPackagePath: string;
  workspaceRoot: string;
  artifactRoot: string;
  workspaceBaselineFingerprintSha256: string;
  invocationRef: string;
  jobNumber: number;
  destinationRoot: string;
  participant: WorkspaceAgentParticipantOptions;
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
  const target = assertPathInside(root, reference, label);
  const stat = await lstat(target);
  if (!stat.isFile()) throw new Error(`${label} must resolve to a regular file: ${reference}`);
}

async function validateReferences(result: SolutionWorkV1, input: RunSolutionAgentInput): Promise<void> {
  const repoRefs = [
    ...result.repoRefs,
    ...result.options.flatMap(option => option.repoRefs),
  ];
  const artifactRefs = [
    ...result.artifactRefs,
    ...result.options.flatMap(option => option.artifactRefs),
  ];
  for (const reference of repoRefs) await assertRepoReferenceFile(input.workspaceRoot, reference, 'repoRef');
  for (const reference of artifactRefs) {
    try {
      await assertFile(input.artifactRoot, reference, 'artifactRef');
    } catch (error) {
      await assertFile(input.workspaceRoot, reference, 'artifactRef');
    }
  }
}

export function buildSolutionAgentPrompt(problemPackage: ProblemPackageV1): string {
  return [
    'You own investigation and solution reasoning.',
    'Read the repository and referenced artifacts yourself.',
    'You may run commands and make temporary changes inside this disposable workspace.',
    'Do not modify or assume access to the authoritative repository.',
    'Return zero to three options or an explicit no-proposal/insufficient-evidence/escalate result.',
    'Program/code recommendations are allowed, but execution permission is separate.',
    'Write/return only the structured SolutionWorkV1 result as the final job result.',
    '',
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

async function writeCreateOnly(path: string, value: string | unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const handle = await open(path, 'wx');
  try {
    await handle.writeFile(typeof value === 'string' ? value : `${canonicalJson(value)}\n`);
  } finally {
    await handle.close();
  }
}

export async function runSolutionAgent(input: RunSolutionAgentInput): Promise<SolutionAgentRunResult> {
  const problemPackage = validateProblemPackage(input.problemPackage);
  const problemPackageSha256 = sha256Hex(await readFile(input.problemPackagePath));
  const prompt = buildSolutionAgentPrompt(problemPackage);
  const job = await runWorkspaceAgentJob(
    { invocationRef: input.invocationRef, role: 'solution', workspaceRoot: input.workspaceRoot, prompt },
    input.participant,
  );
  const invocationPath = join(input.destinationRoot, 'invocation.json');
  const rawOutputPath = join(input.destinationRoot, 'raw-output.txt');
  const resultPath = join(input.destinationRoot, 'result.json');
  const failurePath = join(input.destinationRoot, 'failure.json');
  const commonInvocation = {
    schemaVersion: 'solution-agent-invocation-v1',
    invocationRef: input.invocationRef,
    jobNumber: input.jobNumber,
    role: 'solution',
    workspaceBaselineFingerprintSha256: input.workspaceBaselineFingerprintSha256,
    problemPackageSha256,
    participant: 'workspace-capable-agent',
  } as const;

  if (!job.ok) {
    await writeCreateOnly(rawOutputPath, job.rawOutput ?? '');
    await writeCreateOnly(invocationPath, { ...commonInvocation, status: 'failed', errorKind: job.errorKind });
    await writeCreateOnly(failurePath, { schemaVersion: 'solution-agent-failure-v1', errorKind: job.errorKind, message: job.message });
    return {
      ok: false,
      errorKind: job.errorKind,
      message: job.message,
      invocationPath,
      rawOutputPath,
      failurePath,
    };
  }

  let result: SolutionWorkV1;
  try {
    result = parseSolutionWork(job.rawOutput.trim());
    if (result.problemId !== problemPackage.problemId) {
      throw new Error('SolutionWork problemId does not match ProblemPackage');
    }
    await validateReferences(result, input);
  } catch (error) {
    await writeCreateOnly(rawOutputPath, job.rawOutput);
    await writeCreateOnly(invocationPath, { ...commonInvocation, status: 'failed', errorKind: 'invalid_output' });
    await writeCreateOnly(failurePath, { schemaVersion: 'solution-agent-failure-v1', errorKind: 'invalid_output', message: String(error) });
    return {
      ok: false,
      errorKind: 'invalid_output',
      message: String(error),
      invocationPath,
      rawOutputPath,
      failurePath,
    };
  }

  await writeCreateOnly(rawOutputPath, job.rawOutput);
  await writeCreateOnly(invocationPath, { ...commonInvocation, status: 'completed' });
  await writeCreateOnly(resultPath, result);
  return { ok: true, result, invocationPath, rawOutputPath, resultPath };
}
