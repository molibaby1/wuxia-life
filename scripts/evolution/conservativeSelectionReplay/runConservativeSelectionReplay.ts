import { lstat, mkdir, open, readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import {
  parseConservativeSelectionResponse,
  projectConservativeSelectionResult,
  validateConservativeSelectionProjection,
  type ConservativeSelectionInput,
  type ConservativeSelectionMapping,
  type ConservativeSelectionTrustedResult,
} from './conservativeSelectionContracts';
import {
  invokeDeepSeekConservativeSelection,
  type ConservativeSelectionInvoke,
  type DeepSeekConservativeSelectionFailure,
  type DeepSeekConservativeSelectionSuccess,
} from './deepseekConservativeSelection';
import type {
  ConservativeSelectionExperimentManifest,
  ConservativeSelectionJobManifest,
} from './prepareConservativeSelectionReplay';
import type { SelectionPriorityReplayPresentation } from '../selectionPriorityReplay/selectionPriorityReplay';
import { canonicalJson, sha256Hex } from '../phase0/provenance';

const TECHNICAL_FAILURES = new Set(['timeout', 'network', 'http', 'provider_response']);

export interface ConservativeSelectionJobExecution {
  jobId: string;
  invocationOrdinal: number;
  caseId: string;
  presentationId: 'original' | 'reversed';
  sampleOrdinal: number;
  terminalStatus: 'success' | 'participant_contract_failure' | 'technical_failure';
  attemptCount: number;
  retried: boolean;
  retryReasons: string[];
  resultRef?: string;
  failureRef?: string;
}

export interface ConservativeSelectionExecutionSummary {
  schemaVersion: 'ae-conservative-selection-execution-v1';
  experimentRef: 'experiment.json';
  experimentSha256: string;
  startedAt: string;
  completedAt: string;
  jobCount: number;
  successCount: number;
  participantContractFailureCount: number;
  technicalFailureCount: number;
  retriedJobCount: number;
  totalHttpAttempts: number;
  jobs: ConservativeSelectionJobExecution[];
  ordinarySessionsExecuted: false;
  participantInvocationsExecuted: true;
  productionSelectionModified: false;
}

export interface RunConservativeSelectionReplayOptions {
  repoRoot?: string;
  experimentRoot: string;
  apiKey?: string;
  invoke?: ConservativeSelectionInvoke;
}

async function writeCreateOnly(path: string, bytes: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const handle = await open(path, 'wx');
  try {
    await handle.writeFile(bytes);
  } finally {
    await handle.close();
  }
}

async function assertAbsent(path: string): Promise<void> {
  try {
    await lstat(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return;
    throw error;
  }
  throw new Error(`experimental artifact already exists: ${path}`);
}

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, 'utf8')) as T;
}

async function verifyFrozenJob(
  repoRoot: string,
  experimentRoot: string,
  experiment: ConservativeSelectionExperimentManifest,
  experimentBytes: string,
  job: ConservativeSelectionJobManifest,
): Promise<{
  input: ConservativeSelectionInput;
  mapping: ConservativeSelectionMapping;
}> {
  if (job.model !== experiment.model || job.model !== 'deepseek-v4-flash') throw new Error(`${job.jobId} model is not frozen`);
  if (job.systemPromptSha256 !== experiment.systemPromptSha256) throw new Error(`${job.jobId} system prompt hash does not match experiment`);
  if (sha256Hex(experimentBytes) !== sha256Hex(await readFile(join(experimentRoot, 'experiment.json')))) throw new Error('experiment bytes changed during execution');
  const declaredJob = await readJson<ConservativeSelectionJobManifest>(join(experimentRoot, `jobs/${job.jobId}/job.json`));
  if (canonicalJson(declaredJob) !== canonicalJson(job)) throw new Error(`${job.jobId} manifest changed`);
  const inputBytes = await readFile(join(experimentRoot, job.blindInputRef), 'utf8');
  const mappingBytes = await readFile(join(experimentRoot, job.mappingRef), 'utf8');
  const systemPromptBytes = await readFile(join(experimentRoot, job.systemPromptRef), 'utf8');
  const input = JSON.parse(inputBytes) as ConservativeSelectionInput;
  const mapping = JSON.parse(mappingBytes) as ConservativeSelectionMapping;
  const presentation = await readJson<SelectionPriorityReplayPresentation>(resolve(repoRoot, job.presentationRef));
  if (sha256Hex(canonicalJson(input)) !== job.blindInputSha256) throw new Error(`${job.jobId} input hash mismatch`);
  if (sha256Hex(mappingBytes) !== job.mappingSha256) throw new Error(`${job.jobId} mapping hash mismatch`);
  if (sha256Hex(systemPromptBytes) !== job.systemPromptSha256) throw new Error(`${job.jobId} system prompt bytes changed`);
  if (mapping.blindInputSha256 !== job.blindInputSha256) throw new Error(`${job.jobId} mapping does not bind input`);
  validateConservativeSelectionProjection(presentation, input, mapping);
  for (const suffix of ['result.json', 'failure.json', 'execution.json']) await assertAbsent(join(experimentRoot, `jobs/${job.jobId}/${suffix}`));
  return { input, mapping };
}

function transportFailureKind(result: DeepSeekConservativeSelectionFailure): string {
  return result.errorKind;
}

async function persistAttempt(
  experimentRoot: string,
  job: ConservativeSelectionJobManifest,
  attemptOrdinal: number,
  startedAt: string,
  completedAt: string,
  result: DeepSeekConservativeSelectionSuccess | DeepSeekConservativeSelectionFailure,
): Promise<void> {
  const attemptRoot = join(experimentRoot, `jobs/${job.jobId}/attempts/attempt-${String(attemptOrdinal).padStart(2, '0')}`);
  const attempt = {
    attemptOrdinal,
    startedAt,
    completedAt,
    model: job.model,
    jobId: job.jobId,
    systemPromptSha256: job.systemPromptSha256,
    blindInputSha256: job.blindInputSha256,
    mappingSha256: job.mappingSha256,
    transportStatus: result.ok ? 'success' : result.errorKind,
    ...(result.ok || result.httpStatus !== undefined ? { httpStatus: result.ok ? result.httpStatus : result.httpStatus } : {}),
  };
  await writeCreateOnly(join(attemptRoot, 'attempt.json'), `${canonicalJson(attempt)}\n`);
  if (result.rawProviderResponse !== undefined) await writeCreateOnly(join(attemptRoot, 'raw-provider-response.json'), result.rawProviderResponse);
  if (result.ok) await writeCreateOnly(join(attemptRoot, 'raw-participant-response.json'), result.rawParticipantResponse);
}

async function runJob(
  options: RunConservativeSelectionReplayOptions,
  repoRoot: string,
  experimentRoot: string,
  experiment: ConservativeSelectionExperimentManifest,
  experimentBytes: string,
  job: ConservativeSelectionJobManifest,
): Promise<ConservativeSelectionJobExecution> {
  const { input, mapping } = await verifyFrozenJob(repoRoot, experimentRoot, experiment, experimentBytes, job);
  const invoke = options.invoke ?? invokeDeepSeekConservativeSelection;
  const retryReasons: string[] = [];
  let lastFailure: DeepSeekConservativeSelectionFailure | undefined;
  for (let attemptOrdinal = 1; attemptOrdinal <= 2; attemptOrdinal += 1) {
    const startedAt = new Date().toISOString();
    const result = await invoke({ apiKey: options.apiKey ?? '', invocationRef: job.jobId, input });
    const completedAt = new Date().toISOString();
    await persistAttempt(experimentRoot, job, attemptOrdinal, startedAt, completedAt, result);
    if (!result.ok) {
      lastFailure = result;
      if (attemptOrdinal === 1 && TECHNICAL_FAILURES.has(transportFailureKind(result))) {
        retryReasons.push(result.errorKind);
        continue;
      }
      break;
    }
    let trusted: ConservativeSelectionTrustedResult;
    try {
      const response = parseConservativeSelectionResponse(result.rawParticipantResponse, input);
      trusted = projectConservativeSelectionResult(response, mapping, completedAt);
    } catch (error) {
      const failure = {
        schemaVersion: 'ae-conservative-selection-job-failure-v1',
        failureKind: 'participant_contract_failure',
        message: error instanceof Error ? error.message : String(error),
        attemptCount: attemptOrdinal,
      };
      await writeCreateOnly(join(experimentRoot, `jobs/${job.jobId}/failure.json`), `${canonicalJson(failure)}\n`);
      const execution: ConservativeSelectionJobExecution = {
        jobId: job.jobId,
        invocationOrdinal: job.invocationOrdinal,
        caseId: job.caseId,
        presentationId: job.presentationId,
        sampleOrdinal: job.sampleOrdinal,
        terminalStatus: 'participant_contract_failure',
        attemptCount: attemptOrdinal,
        retried: false,
        retryReasons: [],
        failureRef: `jobs/${job.jobId}/failure.json`,
      };
      await writeCreateOnly(join(experimentRoot, `jobs/${job.jobId}/execution.json`), `${canonicalJson(execution)}\n`);
      return execution;
    }
    await writeCreateOnly(join(experimentRoot, `jobs/${job.jobId}/result.json`), `${canonicalJson(trusted)}\n`);
    {
      const execution: ConservativeSelectionJobExecution = {
        jobId: job.jobId,
        invocationOrdinal: job.invocationOrdinal,
        caseId: job.caseId,
        presentationId: job.presentationId,
        sampleOrdinal: job.sampleOrdinal,
        terminalStatus: 'success',
        attemptCount: attemptOrdinal,
        retried: attemptOrdinal > 1,
        retryReasons,
        resultRef: `jobs/${job.jobId}/result.json`,
      };
      await writeCreateOnly(join(experimentRoot, `jobs/${job.jobId}/execution.json`), `${canonicalJson(execution)}\n`);
      return execution;
    }
  }
  const failure = {
    schemaVersion: 'ae-conservative-selection-job-failure-v1',
    failureKind: 'technical_failure',
    errorKind: lastFailure?.errorKind ?? 'network',
    message: lastFailure?.message ?? 'technical invocation failure',
    attemptCount: retryReasons.length + 1,
    retryReasons,
  };
  await writeCreateOnly(join(experimentRoot, `jobs/${job.jobId}/failure.json`), `${canonicalJson(failure)}\n`);
  const execution: ConservativeSelectionJobExecution = {
    jobId: job.jobId,
    invocationOrdinal: job.invocationOrdinal,
    caseId: job.caseId,
    presentationId: job.presentationId,
    sampleOrdinal: job.sampleOrdinal,
    terminalStatus: 'technical_failure',
    attemptCount: retryReasons.length + 1,
    retried: retryReasons.length > 0,
    retryReasons,
    failureRef: `jobs/${job.jobId}/failure.json`,
  };
  await writeCreateOnly(join(experimentRoot, `jobs/${job.jobId}/execution.json`), `${canonicalJson(execution)}\n`);
  return execution;
}

export async function runConservativeSelectionReplay(
  options: RunConservativeSelectionReplayOptions,
): Promise<ConservativeSelectionExecutionSummary> {
  const repoRoot = resolve(options.repoRoot ?? process.cwd());
  const experimentRoot = resolve(options.experimentRoot);
  const experimentPath = join(experimentRoot, 'experiment.json');
  const experimentBytes = await readFile(experimentPath, 'utf8');
  const experiment = JSON.parse(experimentBytes) as ConservativeSelectionExperimentManifest;
  if (experiment.jobCount !== experiment.jobs.length || experiment.invocationOrder.length !== experiment.jobs.length) throw new Error('experiment job manifest is inconsistent');
  await assertAbsent(join(experimentRoot, 'execution.json'));
  const startedAt = new Date().toISOString();
  const jobs: ConservativeSelectionJobExecution[] = [];
  for (const jobId of experiment.invocationOrder) {
    const job = experiment.jobs.find(item => item.jobId === jobId);
    if (!job) throw new Error(`experiment invocation order references unknown job: ${jobId}`);
    jobs.push(await runJob(options, repoRoot, experimentRoot, experiment, experimentBytes, job));
  }
  const summary: ConservativeSelectionExecutionSummary = {
    schemaVersion: 'ae-conservative-selection-execution-v1',
    experimentRef: 'experiment.json',
    experimentSha256: sha256Hex(experimentBytes),
    startedAt,
    completedAt: new Date().toISOString(),
    jobCount: jobs.length,
    successCount: jobs.filter(job => job.terminalStatus === 'success').length,
    participantContractFailureCount: jobs.filter(job => job.terminalStatus === 'participant_contract_failure').length,
    technicalFailureCount: jobs.filter(job => job.terminalStatus === 'technical_failure').length,
    retriedJobCount: jobs.filter(job => job.retried).length,
    totalHttpAttempts: jobs.reduce((sum, job) => sum + job.attemptCount, 0),
    jobs,
    ordinarySessionsExecuted: false,
    participantInvocationsExecuted: true,
    productionSelectionModified: false,
  };
  await writeCreateOnly(join(experimentRoot, 'execution.json'), `${canonicalJson(summary)}\n`);
  return summary;
}

function loadDotEnv(repoRoot: string): void {
  try {
    const bytes = readFileSync(resolve(repoRoot, '.env'), 'utf8');
    for (const line of bytes.split(/\r?\n/u)) {
      const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/u.exec(line);
      if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2].replace(/^['"]|['"]$/gu, '');
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
}

function argumentValue(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
}

if (process.argv[1]?.endsWith('runConservativeSelectionReplay.ts')) {
  const repoRoot = argumentValue(process.argv.slice(2), '--repo-root') ?? process.cwd();
  const experimentRoot = argumentValue(process.argv.slice(2), '--experiment-root')
    ?? join(repoRoot, 'artifacts/ae-conservative-selection-override-replay-v1-20260914');
  loadDotEnv(repoRoot);
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.error('DEEPSEEK_API_KEY is required');
    process.exitCode = 1;
  } else {
    runConservativeSelectionReplay({ repoRoot, experimentRoot, apiKey })
      .then(summary => console.log(`executed ${summary.jobCount} jobs: ${summary.successCount} success, ${summary.participantContractFailureCount} participant-contract-failure, ${summary.technicalFailureCount} technical-failure`))
      .catch(error => {
        console.error(error);
        process.exitCode = 1;
      });
  }
}
