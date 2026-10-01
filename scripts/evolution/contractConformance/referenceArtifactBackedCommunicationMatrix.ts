import { execFileSync, spawnSync } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import {
  buildSyntheticLargeEnvelopePayload,
  validateSyntheticLargeEnvelopePayload,
} from './referenceParticipantCommunicationMatrix';
import {
  artifactBackedReferenceParticipantBindingLockSha256,
  captureArtifactBackedReferenceParticipantBindingLock,
  resolveArtifactBackedReferenceParticipantBindingFromLock,
  type ArtifactBackedReferenceParticipantBindingLockV2,
} from '../operator/referenceParticipantBinding';
import { ARTIFACT_BACKED_STRUCTURED_RESULT_RELATIVE_PATH } from '../../../src/evolution/artifactBackedStructuredFinalResultContract';
import {
  runStructuredParticipantExecution,
  type StructuredParticipantExecutionResult,
} from '../problemAgnosticSolution/runStructuredParticipantExecution';
import type { ParticipantExecutionTraceV1, WorkspaceAgentParticipantOptions } from '../problemAgnosticSolution/agentParticipant';

export const REFERENCE_ARTIFACT_BACKED_OBSERVATION_TIMEOUT_MS = 300_000;
const GOVERNED_HISTORY_REF = 'artifacts/evolution/autonomous-authoring/reference-trials';

export interface ArtifactBackedSyntheticTrialEvidenceV1 {
  trialId: string;
  status: 'PASS' | 'FAIL';
  runtimeOutcome: 'COMPLETED' | 'TIMEOUT' | 'INVALID_OUTPUT' | 'PROCESS_FAILURE';
  elapsedMs: number | null;
  receiptValid: boolean;
  artifactIntegrityValid: boolean;
  artifactEnvelopeValid: boolean;
  syntheticStructureValid: boolean;
  hostRepairApplied: false;
  retransmissions: 0 | 1;
  artifactBytes: number | null;
  artifactSha256: string | null;
  terminalReceiptRef: string | null;
  resultArtifactRef: string | null;
  validationRef: string | null;
  traceRef: string | null;
  failureReason?: string;
}

export interface ReferenceArtifactBackedCommunicationMatrixV1 {
  schemaVersion: 'reference-artifact-backed-communication-matrix-v1';
  matrixRef: string;
  implementationSha: string;
  bindingLockRef: 'binding-lock.json';
  bindingLockSha256: string;
  observationCeilingMs: 300_000;
  status: 'PASS' | 'SYNTHETIC_FAILED' | 'BINDING_DRIFT' | 'RUNNER_FAILURE';
  trials: readonly ArtifactBackedSyntheticTrialEvidenceV1[];
  stopReason?: string;
}

export interface RunReferenceArtifactBackedCommunicationMatrixInput {
  repositoryRoot: string;
  evidenceRoot: string;
  matrixRef: string;
  model: string;
  reasoningEffort: string;
  ambientCodexConfigPath: string;
}

export interface ReferenceArtifactBackedCommunicationMatrixDependencies {
  captureBindingLock?: typeof captureArtifactBackedReferenceParticipantBindingLock;
  resolveBindingLock?: typeof resolveArtifactBackedReferenceParticipantBindingFromLock;
  runStructuredParticipantExecution?: typeof runStructuredParticipantExecution;
}

function nonEmpty(value: string, label: string): void {
  if (typeof value !== 'string' || value.trim().length === 0) throw new Error(`${label} must be non-empty.`);
}

function validateMatrixRef(matrixRef: string): void {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/.test(matrixRef) || /^attempt-[0-9]{6}$/.test(matrixRef)) {
    throw new Error('Matrix reference is invalid.');
  }
}

function realpathWithMissingSuffix(path: string): string {
  let cursor = resolve(path);
  const missingSuffix: string[] = [];
  while (true) {
    try {
      return resolve(realpathSync(cursor), ...missingSuffix);
    } catch (error) {
      if (!error || typeof error !== 'object' || !('code' in error) || error.code !== 'ENOENT') throw error;
      const parent = dirname(cursor);
      if (parent === cursor) throw error;
      missingSuffix.unshift(basename(cursor));
      cursor = parent;
    }
  }
}

function isInside(root: string, target: string): boolean {
  const pathFromRoot = relative(root, target);
  return pathFromRoot === '' || (pathFromRoot !== '..' && !pathFromRoot.startsWith(`..${sep}`) && !isAbsolute(pathFromRoot));
}

function assertEvidenceRootOutsideGovernedHistory(repositoryRoot: string, evidenceRoot: string): void {
  const governedRoot = realpathWithMissingSuffix(resolve(repositoryRoot, GOVERNED_HISTORY_REF));
  if (isInside(governedRoot, realpathWithMissingSuffix(evidenceRoot))) {
    throw new Error('Artifact-backed communication evidence root must be outside governed reference-trial history.');
  }
}

function assertTrackedImplementationWorktreeClean(repositoryRoot: string): void {
  const result = spawnSync('git', ['-C', repositoryRoot, 'diff', '--quiet', 'HEAD', '--'], { encoding: 'utf8' });
  if (result.error) throw new Error(`Could not verify tracked implementation worktree: ${result.error.message}`);
  if (result.status === 1) throw new Error('Tracked implementation worktree must be clean before communication validation.');
  if (result.status !== 0) throw new Error(`Could not verify tracked implementation worktree: ${result.stderr}`);
}

function implementationSha(repositoryRoot: string): string {
  assertTrackedImplementationWorktreeClean(repositoryRoot);
  return execFileSync('git', ['-C', repositoryRoot, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
}

async function writeCreateOnly(path: string, value: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, value, { flag: 'wx' });
}

async function writeJsonCreateOnly(path: string, value: unknown): Promise<void> {
  await writeCreateOnly(path, `${JSON.stringify(value, null, 2)}\n`);
}

function promptForSyntheticResult(trialId: string, payload: Record<string, unknown>): string {
  return [
    `Artifact-backed synthetic transport trial ${trialId}.`,
    `Write the complete JSON object below to the fixed Host-owned workspace path ${ARTIFACT_BACKED_STRUCTURED_RESULT_RELATIVE_PATH}.`,
    'The terminal output must contain only the small JSON receipt for that exact artifact. Do not emit the object in terminal output, prose, Markdown, or a continuation.',
    'Preserve the complete object, all correctness-bearing fields, and structural keys. The x-only padding may have any non-empty x-only length that leaves the serialized object between 22 and 26 KiB.',
    JSON.stringify(payload),
  ].join('\n');
}

function runtimeOutcome(result: StructuredParticipantExecutionResult<unknown>): ArtifactBackedSyntheticTrialEvidenceV1['runtimeOutcome'] {
  if (result.ok) return 'COMPLETED';
  if (result.errorKind === 'timeout') return 'TIMEOUT';
  if (result.errorKind === 'invalid_output' || result.errorKind === 'continuation') return 'INVALID_OUTPUT';
  return 'PROCESS_FAILURE';
}

function validationEvidence(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
}

export async function runReferenceArtifactBackedCommunicationMatrix(
  input: RunReferenceArtifactBackedCommunicationMatrixInput,
  dependencies: ReferenceArtifactBackedCommunicationMatrixDependencies = {},
): Promise<ReferenceArtifactBackedCommunicationMatrixV1> {
  nonEmpty(input.repositoryRoot, 'Repository root');
  nonEmpty(input.evidenceRoot, 'Evidence root');
  nonEmpty(input.matrixRef, 'Matrix reference');
  nonEmpty(input.model, 'Model');
  nonEmpty(input.reasoningEffort, 'Reasoning effort');
  nonEmpty(input.ambientCodexConfigPath, 'Ambient Codex config path');
  validateMatrixRef(input.matrixRef);
  const repositoryRoot = resolve(input.repositoryRoot);
  const evidenceRoot = isAbsolute(input.evidenceRoot) ? resolve(input.evidenceRoot) : resolve(repositoryRoot, input.evidenceRoot);
  assertEvidenceRootOutsideGovernedHistory(repositoryRoot, evidenceRoot);
  const startingSha = implementationSha(repositoryRoot);

  await mkdir(dirname(evidenceRoot), { recursive: true });
  await mkdir(evidenceRoot, { recursive: false });

  const captureBindingLock = dependencies.captureBindingLock ?? captureArtifactBackedReferenceParticipantBindingLock;
  const resolveBindingLock = dependencies.resolveBindingLock ?? resolveArtifactBackedReferenceParticipantBindingFromLock;
  const runExecution = dependencies.runStructuredParticipantExecution ?? runStructuredParticipantExecution;
  const matrix: ReferenceArtifactBackedCommunicationMatrixV1 = {
    schemaVersion: 'reference-artifact-backed-communication-matrix-v1',
    matrixRef: input.matrixRef,
    implementationSha: startingSha,
    bindingLockRef: 'binding-lock.json',
    bindingLockSha256: '',
    observationCeilingMs: REFERENCE_ARTIFACT_BACKED_OBSERVATION_TIMEOUT_MS,
    status: 'RUNNER_FAILURE',
    trials: [],
  };
  const finish = async (): Promise<ReferenceArtifactBackedCommunicationMatrixV1> => {
    try {
      assertTrackedImplementationWorktreeClean(repositoryRoot);
      const finalSha = execFileSync('git', ['-C', repositoryRoot, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
      if (finalSha !== startingSha) throw new Error('Implementation SHA changed during artifact-backed communication matrix.');
    } catch (error) {
      matrix.status = 'RUNNER_FAILURE';
      matrix.stopReason = error instanceof Error ? error.message : String(error);
    }
    await writeJsonCreateOnly(join(evidenceRoot, 'matrix.json'), matrix);
    return matrix;
  };

  let bindingLock: ArtifactBackedReferenceParticipantBindingLockV2;
  try {
    bindingLock = await captureBindingLock({
      repositoryRoot,
      bindingId: 'CODEX_CURRENT',
      model: input.model,
      reasoningEffort: input.reasoningEffort,
      ambientCodexConfigPath: input.ambientCodexConfigPath,
    });
    if (bindingLock.modelConfigured !== input.model
      || bindingLock.reasoningEffort !== input.reasoningEffort
      || resolve(bindingLock.ambientCodexConfigPath) !== resolve(input.ambientCodexConfigPath)
      || bindingLock.structuredResultDelivery.kind !== 'WORKSPACE_ARTIFACT_RECEIPT_V1') {
      throw new Error('Captured artifact-backed binding does not match explicit model, effort, config, and delivery mode.');
    }
    matrix.bindingLockSha256 = artifactBackedReferenceParticipantBindingLockSha256(bindingLock);
    await writeJsonCreateOnly(join(evidenceRoot, 'binding-lock.json'), bindingLock);
  } catch (error) {
    matrix.status = 'BINDING_DRIFT';
    matrix.stopReason = error instanceof Error ? error.message : String(error);
    return finish();
  }

  const payload = buildSyntheticLargeEnvelopePayload();
  const trials: ArtifactBackedSyntheticTrialEvidenceV1[] = [];
  await mkdir(join(evidenceRoot, 'trials'), { recursive: false });
  for (let index = 1; index <= 3; index += 1) {
    const trialId = `artifact-${String(index).padStart(2, '0')}`;
    const trialDirectory = join(evidenceRoot, 'trials', trialId);
    await mkdir(trialDirectory, { recursive: false });
    const workspaceRoot = await mkdtemp(join(tmpdir(), `ref-artifact-${input.matrixRef}-${index}-`));
    const refs = {
      terminalReceiptRef: `trials/${trialId}/terminal-attempt-0.txt`,
      resultArtifactRef: `trials/${trialId}/structured-result-artifact.raw.json`,
      validationRef: `trials/${trialId}/artifact-backed-validation.json`,
      traceRef: `trials/${trialId}/execution-trace.json`,
    };
    let record: ArtifactBackedSyntheticTrialEvidenceV1 = {
      trialId,
      status: 'FAIL',
      runtimeOutcome: 'PROCESS_FAILURE',
      elapsedMs: null,
      receiptValid: false,
      artifactIntegrityValid: false,
      artifactEnvelopeValid: false,
      syntheticStructureValid: false,
      hostRepairApplied: false,
      retransmissions: 0,
      artifactBytes: null,
      artifactSha256: null,
      terminalReceiptRef: null,
      resultArtifactRef: null,
      validationRef: null,
      traceRef: null,
    };
    try {
      const resolved = await resolveBindingLock({ repositoryRoot, lock: bindingLock });
      const participant: WorkspaceAgentParticipantOptions = {
        ...resolved.participant,
        timeoutMs: REFERENCE_ARTIFACT_BACKED_OBSERVATION_TIMEOUT_MS,
      };
      await writeCreateOnly(join(trialDirectory, 'prompt.txt'), `${promptForSyntheticResult(trialId, payload)}\n`);
      const result = await runExecution<Record<string, unknown>>({
        invocationRef: `${input.matrixRef}-${trialId}`,
        role: 'solution',
        workspaceRoot,
        destinationRoot: trialDirectory,
        initialPrompt: promptForSyntheticResult(trialId, payload),
        expectedRoleSchemaName: 'SyntheticLargeEnvelopeV1',
        participant,
        retransmissionEnabled: false,
        structuredResultDelivery: {
          kind: 'WORKSPACE_ARTIFACT_RECEIPT_V1',
          resultRelativePath: ARTIFACT_BACKED_STRUCTURED_RESULT_RELATIVE_PATH,
        },
        validateSchema: value => {
          const validation = validateSyntheticLargeEnvelopePayload(value);
          if (!validation.ok) throw new Error(validation.reason ?? 'synthetic payload structure is invalid');
          return value;
        },
        validateAcceptedResult: async () => undefined,
      });
      const elapsedMs = result.executionTrace.terminal.elapsedMs;
      const validationPath = join(trialDirectory, 'artifact-backed-validation.json');
      let validation: Record<string, unknown> | undefined;
      try {
        validation = validationEvidence(JSON.parse(await readFile(validationPath, 'utf8')) as unknown);
      } catch {
        validation = undefined;
      }
      await writeJsonCreateOnly(join(trialDirectory, 'execution-trace.json'), result.executionTrace);
      const completed = result.ok;
      const structure = completed ? validateSyntheticLargeEnvelopePayload(result.value) : { ok: false, reason: 'structured execution did not complete' };
      const receiptValid = validation?.receiptValidationValid === true;
      const artifactIntegrityValid = validation?.artifactIntegrityValid === true;
      const artifactEnvelopeValid = validation?.artifactEnvelopeValid === true;
      const artifactBytes = typeof validation?.actualBytes === 'number' ? validation.actualBytes : null;
      const artifactSha256 = typeof validation?.actualSha256 === 'string' ? validation.actualSha256 : null;
      const retransmissions = result.recovery.attempted ? 1 : 0;
      const pass = completed
        && elapsedMs <= REFERENCE_ARTIFACT_BACKED_OBSERVATION_TIMEOUT_MS
        && receiptValid
        && artifactIntegrityValid
        && artifactEnvelopeValid
        && validation?.roleSchemaValidationAttempted === true
        && validation?.roleSchemaValid === true
        && artifactBytes !== null
        && artifactBytes > 0
        && artifactSha256 !== null
        && /^[0-9a-f]{64}$/.test(artifactSha256)
        && result.rawOutput.length > 0
        && result.acceptedAttempt === 0
        && validation !== undefined
        && refs.traceRef.length > 0
        && structure.ok
        && !result.recovery.attempted;
      record = {
        trialId,
        status: pass ? 'PASS' : 'FAIL',
        runtimeOutcome: runtimeOutcome(result),
        elapsedMs,
        receiptValid,
        artifactIntegrityValid,
        artifactEnvelopeValid,
        syntheticStructureValid: structure.ok,
        hostRepairApplied: false,
        retransmissions,
        artifactBytes,
        artifactSha256,
        terminalReceiptRef: result.rawOutput.length > 0 ? refs.terminalReceiptRef : null,
        resultArtifactRef: artifactBytes !== null ? refs.resultArtifactRef : null,
        validationRef: validation === undefined ? null : refs.validationRef,
        traceRef: refs.traceRef,
        ...(!pass ? { failureReason: !completed
          ? result.ok ? 'participant process did not complete' : result.message
          : !structure.ok ? structure.reason ?? 'synthetic structure failed'
          : result.recovery.attempted ? 'artifact-backed trial attempted a retransmission'
          : elapsedMs > REFERENCE_ARTIFACT_BACKED_OBSERVATION_TIMEOUT_MS ? 'observation ceiling exceeded'
          : 'receipt or artifact validation gate failed' } : {}),
      };
    } catch (error) {
      record = {
        ...record,
        failureReason: error instanceof Error ? error.message : String(error),
      };
      try {
        await writeJsonCreateOnly(join(trialDirectory, 'execution-trace.json'), {
          schemaVersion: 'participant-execution-trace-v1',
          invocation: { startedAt: new Date().toISOString(), timeoutMs: REFERENCE_ARTIFACT_BACKED_OBSERVATION_TIMEOUT_MS },
          events: [],
          terminal: { outcome: 'process_error', elapsedMs: 0 },
        } satisfies ParticipantExecutionTraceV1);
        record.traceRef = refs.traceRef;
      } catch {
        // Keep the earliest failure as the matrix evidence.
      }
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
    await writeJsonCreateOnly(join(trialDirectory, 'trial.json'), record);
    trials.push(record);
  }

  matrix.trials = trials;
  matrix.status = trials.length === 3 && trials.every(trial => trial.status === 'PASS'
    && trial.runtimeOutcome === 'COMPLETED'
    && trial.elapsedMs !== null
    && trial.elapsedMs <= REFERENCE_ARTIFACT_BACKED_OBSERVATION_TIMEOUT_MS
    && trial.receiptValid
    && trial.artifactIntegrityValid
    && trial.artifactEnvelopeValid
    && trial.syntheticStructureValid
    && trial.artifactBytes !== null
    && trial.artifactBytes > 0
    && trial.artifactSha256 !== null
    && /^[0-9a-f]{64}$/.test(trial.artifactSha256)
    && trial.terminalReceiptRef !== null
    && trial.resultArtifactRef !== null
    && trial.validationRef !== null
    && trial.traceRef !== null
    && trial.hostRepairApplied === false
    && trial.retransmissions === 0) ? 'PASS' : 'SYNTHETIC_FAILED';
  if (matrix.status !== 'PASS') matrix.stopReason = 'Artifact-backed synthetic matrix did not pass all three independent trials.';
  return finish();
}
