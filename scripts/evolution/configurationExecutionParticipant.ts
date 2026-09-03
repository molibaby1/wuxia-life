import { mkdir, open, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { renderStructuredFinalOutputContractV1 } from '../../src/evolution/participantStructuredOutputContract';
import type { ProblemPackage } from '../../src/evolution/problemPackageContract';
import type { SolutionReviewV1 } from '../../src/evolution/solutionReviewContract';
import type { SolutionWorkV1 } from '../../src/evolution/solutionWorkContract';
import { canonicalJson, sha256Hex } from './phase0/provenance';
import {
  runWorkspaceAgentJob,
  type WorkspaceAgentParticipantOptions,
} from './problemAgnosticSolution/agentParticipant';

export interface ConfigurationExecutionInput {
  invocationRef: string;
  destinationRoot: string;
  workspaceRoot: string;
  problemPackagePath: string;
  problemPackage: ProblemPackage;
  solutionWork: SolutionWorkV1;
  solutionReview: SolutionReviewV1;
  acceptedOptionId: string;
  allowedWritePaths: string[];
  authorityRefs: string[];
  participant: WorkspaceAgentParticipantOptions;
}

export interface ConfigurationExecutionVerificationResult {
  name: string;
  status: 'passed' | 'failed';
  details: string;
}

export interface ConfigurationExecutionParticipantResult {
  schemaVersion: 'configuration-execution-result-v1';
  status: 'completed' | 'failed';
  changedFiles: string[];
  verificationResults: ConfigurationExecutionVerificationResult[];
  deviations: string[];
  invocationPath?: string;
  rawOutputPath?: string;
  resultPath?: string | null;
  failurePath?: string | null;
}

function assertObject(value: unknown, label: string): asserts value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error(`${label} must be an object`);
}

function nonEmptyString(value: unknown, path: string): string {
  if (typeof value !== 'string' || value.length === 0) throw new Error(`${path} must be a non-empty string`);
  return value;
}

function stringArray(value: unknown, path: string): string[] {
  if (!Array.isArray(value)) throw new Error(`${path} must be an array`);
  return value.map((item, index) => nonEmptyString(item, `${path}[${index}]`));
}

function parseParticipantResult(raw: string): Omit<ConfigurationExecutionParticipantResult, 'invocationPath' | 'rawOutputPath' | 'resultPath' | 'failurePath'> {
  const value = JSON.parse(raw) as unknown;
  assertObject(value, 'configuration execution result');
  const allowed = new Set(['schemaVersion', 'status', 'changedFiles', 'verificationResults', 'deviations']);
  for (const key of Object.keys(value)) if (!allowed.has(key)) throw new Error(`configuration execution result contains unknown field: ${key}`);
  for (const key of allowed) if (!(key in value)) throw new Error(`configuration execution result is missing field: ${key}`);
  if (value.schemaVersion !== 'configuration-execution-result-v1') throw new Error('configuration execution result schemaVersion is invalid');
  if (value.status !== 'completed' && value.status !== 'failed') throw new Error('configuration execution result status is invalid');
  const verificationResults = value.verificationResults;
  if (!Array.isArray(verificationResults)) throw new Error('configuration execution result verificationResults must be an array');
  const parsedVerificationResults = verificationResults.map((entry, index) => {
    assertObject(entry, `configuration execution result verificationResults[${index}]`);
    const keys = ['name', 'status', 'details'];
    for (const key of Object.keys(entry)) if (!keys.includes(key)) throw new Error(`verification result contains unknown field: ${key}`);
    for (const key of keys) if (!(key in entry)) throw new Error(`verification result is missing field: ${key}`);
    const status = entry.status;
    if (status !== 'passed' && status !== 'failed') throw new Error(`verification result status is invalid: ${String(status)}`);
    return {
      name: nonEmptyString(entry.name, `verificationResults[${index}].name`),
      status: status as 'passed' | 'failed',
      details: nonEmptyString(entry.details, `verificationResults[${index}].details`),
    };
  });
  return {
    schemaVersion: 'configuration-execution-result-v1',
    status: value.status as 'completed' | 'failed',
    changedFiles: stringArray(value.changedFiles, 'configuration execution result.changedFiles'),
    verificationResults: parsedVerificationResults,
    deviations: stringArray(value.deviations, 'configuration execution result.deviations'),
  };
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

export function buildConfigurationExecutionPrompt(input: ConfigurationExecutionInput): string {
  const selectedOption = input.solutionWork.options.find(option => option.optionId === input.acceptedOptionId);
  if (!selectedOption) throw new Error(`accepted option does not exist: ${input.acceptedOptionId}`);
  return [
    'You are the Configuration Execution Participant.',
    'Implement the already accepted configuration option inside this isolated mutable evolution workspace.',
    'The Host, not you, owns permission enforcement. You must not modify any file outside allowedWritePaths.',
    'Do not modify program code, Runtime, Framework, Contract, Schema, governance, docs, or the authoritative repository.',
    'Read the workspace and the accepted evidence yourself. Make the concrete configuration edit; do not merely describe a patch.',
    'Run only the verification needed for this accepted configuration work.',
    renderStructuredFinalOutputContractV1({
      roleSchemaName: 'configuration-execution-result-v1',
    }),
    '',
    `Allowed write paths: ${canonicalJson(input.allowedWritePaths)}`,
    `Authority references: ${canonicalJson(input.authorityRefs)}`,
    `Problem Package: ${canonicalJson(input.problemPackage)}`,
    `Accepted Solution Option: ${canonicalJson(selectedOption)}`,
    `Solution Review: ${canonicalJson(input.solutionReview)}`,
  ].join('\n');
}

export async function runConfigurationExecutionParticipant(
  input: ConfigurationExecutionInput,
): Promise<ConfigurationExecutionParticipantResult> {
  const invocationPath = join(input.destinationRoot, 'invocation.json');
  const rawOutputPath = join(input.destinationRoot, 'raw-output.txt');
  const resultPath = join(input.destinationRoot, 'result.json');
  const failurePath = join(input.destinationRoot, 'failure.json');
  const problemPackageSha256 = sha256Hex(await readFile(input.problemPackagePath));
  const commonInvocation = {
    schemaVersion: 'configuration-execution-invocation-v1',
    invocationRef: input.invocationRef,
    role: 'configuration-execution',
    participant: 'workspace-capable-agent',
    problemPackageSha256,
    acceptedOptionId: input.acceptedOptionId,
    allowedWritePaths: input.allowedWritePaths,
  } as const;

  const job = await runWorkspaceAgentJob(
    {
      invocationRef: input.invocationRef,
      role: 'configuration-execution',
      workspaceRoot: input.workspaceRoot,
      prompt: buildConfigurationExecutionPrompt(input),
    },
    input.participant,
  );
  if (job.ok === false) {
    const failure = job;
    await writeCreateOnly(rawOutputPath, failure.rawOutput ?? '');
    await writeCreateOnly(invocationPath, { ...commonInvocation, status: 'failed', errorKind: failure.errorKind });
    await writeCreateOnly(failurePath, {
      schemaVersion: 'configuration-execution-failure-v1',
      errorKind: failure.errorKind,
      message: failure.message,
    });
    return {
      schemaVersion: 'configuration-execution-result-v1',
      status: 'failed',
      changedFiles: [],
      verificationResults: [],
      deviations: [failure.message],
      invocationPath,
      rawOutputPath,
      resultPath: null,
      failurePath,
    };
  }

  try {
    const parsed = parseParticipantResult(job.rawOutput.trim());
    await writeCreateOnly(rawOutputPath, job.rawOutput);
    await writeCreateOnly(invocationPath, { ...commonInvocation, status: parsed.status });
    await writeCreateOnly(resultPath, parsed);
    return { ...parsed, invocationPath, rawOutputPath, resultPath, failurePath: null };
  } catch (error) {
    const message = String(error);
    await writeCreateOnly(rawOutputPath, job.rawOutput);
    await writeCreateOnly(invocationPath, { ...commonInvocation, status: 'failed', errorKind: 'invalid_output' });
    await writeCreateOnly(failurePath, {
      schemaVersion: 'configuration-execution-failure-v1',
      errorKind: 'invalid_output',
      message,
    });
    return {
      schemaVersion: 'configuration-execution-result-v1',
      status: 'failed',
      changedFiles: [],
      verificationResults: [],
      deviations: [message],
      invocationPath,
      rawOutputPath,
      resultPath: null,
      failurePath,
    };
  }
}
