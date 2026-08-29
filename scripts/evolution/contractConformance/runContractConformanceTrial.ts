import { existsSync, writeFileSync } from 'node:fs';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';
import {
  runWorkspaceAgentJob,
  type WorkspaceAgentParticipantOptions,
} from '../problemAgnosticSolution/agentParticipant';
import { createCursorAgentParticipant } from '../problemAgnosticSolution/cursorAgentParticipant';
import { createCodexExecParticipant } from './codexExecParticipant';
import {
  buildConformancePrompt,
  classifyRuntimeFailure,
  classifyTerminalPayload,
  ensureEvidenceRoot,
  trialDirectory,
  writeJsonCreateOnly,
  writeTextCreateOnly,
  type ConformanceBindingLabel,
  type ConformanceTrialEvidenceV1,
  type TrialClassification,
} from './contractConformanceExperiment';

export interface RunConformanceTrialInput {
  evidenceRoot: string;
  trialId: string;
  bindingLabel: ConformanceBindingLabel;
  timeoutMs?: number;
}

function bindingMeta(bindingLabel: ConformanceBindingLabel): {
  requestedBinding: string;
  resolvedModelObservation: string;
} {
  if (bindingLabel === 'Codex current binding') {
    return {
      requestedBinding: 'Codex CLI current config binding (no -m override)',
      resolvedModelObservation:
        'Host config may declare a default model; trial does not independently prove resolved model identity from the transport stream',
    };
  }
  return {
    requestedBinding: 'Cursor Auto (CLI default; no --model override)',
    resolvedModelObservation: 'CURSOR_MODEL_BINDING_NOT_OBSERVABLE',
  };
}

function createParticipant(
  bindingLabel: ConformanceBindingLabel,
  timeoutMs: number,
  transportPath: string,
): WorkspaceAgentParticipantOptions {
  const base = bindingLabel === 'Codex current binding'
    ? createCodexExecParticipant({ timeoutMs })
    : createCursorAgentParticipant({ timeoutMs });

  const originalInterpret = base.interpretCompletedOutput;
  if (originalInterpret === undefined) {
    return base;
  }

  return {
    ...base,
    interpretCompletedOutput: input => {
      // Persist provider-native stdout before deterministic terminal-field extraction.
      writeFileSync(transportPath, input.stdout.endsWith('\n') ? input.stdout : `${input.stdout}\n`);
      return originalInterpret(input);
    },
  };
}

export async function runContractConformanceTrial(
  input: RunConformanceTrialInput,
): Promise<ConformanceTrialEvidenceV1> {
  const timeoutMs = input.timeoutMs ?? 180_000;
  await ensureEvidenceRoot(input.evidenceRoot);
  const trialDir = trialDirectory(input.evidenceRoot, input.trialId);
  const workspaceRoot = await mkdtemp(join(tmpdir(), `conformance-${input.trialId}-`));
  await writeFile(join(workspaceRoot, 'README.conformance.txt'), 'contract-only disposable workspace\n');

  const prompt = buildConformancePrompt();
  const promptPath = join(trialDir, 'prompt.txt');
  const terminalPath = join(trialDir, 'terminal-payload.txt');
  const transportPath = join(trialDir, 'transport.stdout.txt');
  const tracePath = join(trialDir, 'execution-trace.json');
  const evidencePath = join(trialDir, 'trial.json');

  await writeTextCreateOnly(promptPath, `${prompt}\n`);

  const participant = createParticipant(input.bindingLabel, timeoutMs, transportPath);
  const startedAt = new Date().toISOString();
  const started = performance.now();
  const job = await runWorkspaceAgentJob(
    {
      invocationRef: input.trialId,
      role: 'solution',
      workspaceRoot,
      prompt,
      traceArtifactPath: tracePath,
    },
    participant,
  );
  const elapsedMs = Math.max(0, Math.round(performance.now() - started));
  const meta = bindingMeta(input.bindingLabel);

  let classification: TrialClassification;
  let failureDetail: string | undefined;
  let terminalPayload = '';

  if (!job.ok) {
    classification = classifyRuntimeFailure(job.errorKind);
    failureDetail = `${job.errorKind}: ${job.message}`;
    terminalPayload = job.rawOutput ?? '';
    if (
      !existsSync(transportPath)
      && job.rawOutput !== undefined
      && job.rawOutput.length > 0
    ) {
      await writeTextCreateOnly(
        transportPath,
        job.rawOutput.endsWith('\n') ? job.rawOutput : `${job.rawOutput}\n`,
      );
    }
  } else {
    terminalPayload = job.rawOutput;
    const classified = classifyTerminalPayload(job.rawOutput);
    classification = classified.classification;
    failureDetail = classified.failureDetail;
  }

  await writeTextCreateOnly(
    terminalPath,
    terminalPayload.endsWith('\n') || terminalPayload.length === 0
      ? terminalPayload
      : `${terminalPayload}\n`,
  );

  const evidence: ConformanceTrialEvidenceV1 = {
    schemaVersion: 'contract-conformance-trial-v1',
    trialId: input.trialId,
    bindingLabel: input.bindingLabel,
    requestedBinding: meta.requestedBinding,
    resolvedModelObservation: meta.resolvedModelObservation,
    startedAt,
    elapsedMs,
    classification,
    terminalPayloadRef: `trials/${input.trialId}/terminal-payload.txt`,
    transportStdoutRef: `trials/${input.trialId}/transport.stdout.txt`,
    executionTraceRef: `trials/${input.trialId}/execution-trace.json`,
    ...(failureDetail === undefined ? {} : { failureDetail }),
    notes: [
      'Contract-only trial; no repository reasoning workload.',
      'No Host semantic repair; strict envelope then exact schema.',
      'Evidence is experiment-only and not workflow authority.',
    ],
  };

  await writeJsonCreateOnly(evidencePath, evidence);
  return evidence;
}
