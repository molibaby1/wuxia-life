import { lstat, mkdir, open } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { canonicalJson } from './phase0/provenance';
import type { WorkspaceAgentParticipantOptions } from './problemAgnosticSolution/agentParticipant';

export interface RunBoundedSourceTransitionInput {
  authoritativeRoot: string;
  transitionRoot: string;
  sourceRoot: string;
  sourceRunRef: string;
  acceptedCandidateArtifacts: {
    problemPackagePath: string;
    solutionPath: string;
    reviewPath: string;
  };
  participant: WorkspaceAgentParticipantOptions;
  dependencies?: BoundedSourceTransitionDependencies;
}

export interface BoundedSourceTransitionDependencies {
  executeConfiguration?: (input: RunBoundedSourceTransitionInput) => Promise<{
    status: 'completed' | 'failed';
    changedFiles?: string[];
    verificationResults?: Array<{ name: string; status: 'passed' | 'failed'; details: string }>;
    deviations?: string[];
    executionRef?: string;
  }>;
  verifyScope?: (input: RunBoundedSourceTransitionInput & { changedFiles: string[] }) => Promise<{ status: 'passed' | 'scope_violation'; unauthorizedFiles?: string[] }>;
  verifyDeterministic?: (input: RunBoundedSourceTransitionInput) => Promise<{ status: 'passed' | 'failed'; details?: string }>;
  rerunSource?: (input: RunBoundedSourceTransitionInput) => Promise<{ runRef: string; sourceRoot: string }>;
  validateSealedSource?: (input: { sourceRoot: string; runRef: string }) => Promise<void>;
}

export type BoundedSourceTransitionResult =
  | { status: 'succeeded'; participantJobs: 1; executionRef: string; resultingRunRef: string; resultingSourceRoot: string; executionEvidenceRef: string }
  | { status: 'failed'; participantJobs: 0 | 1; failureReason: string; executionEvidenceRef: string | null };

async function exists(path: string): Promise<boolean> {
  try { await lstat(path); return true; } catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false; throw error; }
}

async function writeCreateOnly(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const handle = await open(path, 'wx');
  try { await handle.writeFile(`${canonicalJson(value)}\n`); } finally { await handle.close(); }
}

export async function runBoundedSourceTransition(input: RunBoundedSourceTransitionInput): Promise<BoundedSourceTransitionResult> {
  for (const [label, path] of Object.entries(input.acceptedCandidateArtifacts)) {
    if (!(await exists(path))) return { status: 'failed', participantJobs: 0, failureReason: `${label} is missing`, executionEvidenceRef: null };
  }
  const execute = input.dependencies?.executeConfiguration;
  if (!execute) return { status: 'failed', participantJobs: 0, failureReason: 'configuration execution dependency is unavailable', executionEvidenceRef: null };
  let execution: Awaited<ReturnType<NonNullable<BoundedSourceTransitionDependencies['executeConfiguration']>>>;
  try { execution = await execute(input); } catch (error) {
    return { status: 'failed', participantJobs: 1, failureReason: `configuration execution failed: ${String(error)}`, executionEvidenceRef: null };
  }
  const executionEvidenceRef = 'execution.json';
  await writeCreateOnly(join(resolve(input.transitionRoot), executionEvidenceRef), execution);
  const changedFiles = execution.changedFiles ?? [];
  if (execution.status !== 'completed') return { status: 'failed', participantJobs: 1, failureReason: execution.deviations?.join('; ') || 'configuration execution failed', executionEvidenceRef };
  if (input.dependencies?.verifyScope) {
    const scope = await input.dependencies.verifyScope({ ...input, changedFiles });
    if (scope.status !== 'passed') return { status: 'failed', participantJobs: 1, failureReason: `scope verification failed${scope.unauthorizedFiles?.length ? `: ${scope.unauthorizedFiles.join(', ')}` : ''}`, executionEvidenceRef };
  }
  if ((execution.verificationResults ?? []).some(result => result.status !== 'passed')) return { status: 'failed', participantJobs: 1, failureReason: 'deterministic verification failed', executionEvidenceRef };
  if (input.dependencies?.verifyDeterministic) {
    const verification = await input.dependencies.verifyDeterministic(input);
    if (verification.status !== 'passed') return { status: 'failed', participantJobs: 1, failureReason: verification.details ?? 'deterministic verification failed', executionEvidenceRef };
  }
  if (!input.dependencies?.rerunSource) return { status: 'failed', participantJobs: 1, failureReason: 'source rerun dependency is unavailable', executionEvidenceRef };
  let rerun: { runRef: string; sourceRoot: string };
  try { rerun = await input.dependencies.rerunSource(input); } catch (error) {
    return { status: 'failed', participantJobs: 1, failureReason: `source rerun failed: ${String(error)}`, executionEvidenceRef };
  }
  if (input.dependencies.validateSealedSource) {
    try { await input.dependencies.validateSealedSource(rerun); } catch (error) {
      return { status: 'failed', participantJobs: 1, failureReason: `new source seal validation failed: ${String(error)}`, executionEvidenceRef };
    }
  }
  return {
    status: 'succeeded',
    participantJobs: 1,
    executionRef: execution.executionRef ?? 'configuration-execution-000001',
    resultingRunRef: rerun.runRef,
    resultingSourceRoot: rerun.sourceRoot,
    executionEvidenceRef,
  };
}
