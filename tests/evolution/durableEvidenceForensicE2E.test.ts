import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getP8GatePersonas } from '../../src/p8/personas';
import { runPhase0 } from '../../scripts/evolution/phase0/runPhase0';
import { validatePhase0RunSeal } from '../../scripts/evolution/phase0/provenance';
import { publishDurableEvidenceCapsule, verifyDurableEvidenceCapsule } from '../../scripts/evolution/evidence/durableEvidenceCapsule';
import { collectOrdinaryEvidence } from '../../scripts/evolution/evidence/ordinaryEvidenceCollector';
import {
  runOrdinaryEvolution,
  type OperatorAeWorkflowResult,
} from '../../scripts/evolution/operator/runOrdinaryEvolution';
import {
  buildMultiRoundSessionSummary,
  parseMultiRoundRunManifest,
} from '../../scripts/evolution/multiRoundRunManifestContract';

function sessionExecution(sessionId: string) {
  return buildMultiRoundSessionSummary(parseMultiRoundRunManifest({
    schemaVersion: 'multi-round-run-manifest-v1',
    multiRoundRunRef: sessionId,
    initialSourceRunRef: sessionId,
    limits: { maxAgentRounds: 2, maxCrossRoundTransitions: 1, maxRoundParticipantJobs: 4, maxExecutionParticipantJobs: 1, maxTotalParticipantJobs: 9, retryCount: 0 },
    rounds: [{ round: 1, workflowRef: 'round-1', sourceRunRef: sessionId, terminalRoute: 'SKIP', executionRef: null, resultingRunRef: null, nextAction: 'STOP' }],
    execution: { executionRef: 'configuration-execution-000001', allowedWritePaths: [], actualChangedFiles: [], status: 'not_started', verificationResults: [], resultingRunRef: null },
    budget: { round1ParticipantJobs: 4, executionParticipantJobs: 0, round2ParticipantJobs: 0, totalParticipantJobs: 4, retryCount: 0 },
    outcome: 'NO_CROSS_ROUND_TRANSITION_OBSERVED',
    stopReason: 'ROUND_1_TERMINAL_NOT_READY',
  }));
}

async function writeEvidenceFixture(experimentRoot: string, sessionId: string): Promise<void> {
  const files: Record<string, string> = {
    'run-manifest.json': JSON.stringify({ schemaVersion: 'multi-round-run-manifest-v1', sessionId }),
    [`round-1/feedback-runs/${sessionId}/feedback.json`]: '{"overallImpression":"clear"}\n',
    [`round-1/feedback-runs/${sessionId}/observable-payload.json`]: '{"entries":[]}\n',
    [`round-1/feedback-runs/${sessionId}/participant-prompt.txt`]: 'feedback prompt\n',
    [`round-1/feedback-runs/${sessionId}/participant-binding.json`]: '{"provider":"codex-local-subagent"}\n',
    [`round-1/feedback-runs/${sessionId}/participant-execution-trace.json`]: '{"schemaVersion":"participant-execution-trace-v1"}\n',
    [`round-1/feedback-runs/${sessionId}/invocation.json`]: `{"invocationRef":"feedback-invocation-000001","status":"completed"}\n`,
    [`round-1/feedback-runs/${sessionId}/raw-participant-response.txt`]: 'feedback raw\n',
    [`round-1/hypothesis-runs/${sessionId}/hypotheses.json`]: '{"hypotheses":[{"hypothesisId":"h-1"}]}\n',
    [`round-1/hypothesis-runs/${sessionId}/source-observable-payload.json`]: '{}\n',
    [`round-1/hypothesis-runs/${sessionId}/participant-prompt.txt`]: 'hypothesis prompt\n',
    [`round-1/hypothesis-runs/${sessionId}/participant-binding.json`]: '{"provider":"codex-local-subagent"}\n',
    [`round-1/hypothesis-runs/${sessionId}/participant-execution-trace.json`]: '{"schemaVersion":"participant-execution-trace-v1"}\n',
    [`round-1/hypothesis-runs/${sessionId}/source-feedback.json`]: '{}\n',
    [`round-1/hypothesis-runs/${sessionId}/source-pattern-evidence.json`]: '{}\n',
    [`round-1/hypothesis-runs/${sessionId}/invocation.json`]: `{"invocationRef":"hypothesis-invocation-000001","status":"completed"}\n`,
    [`round-1/hypothesis-runs/${sessionId}/raw-participant-response.txt`]: 'hypothesis raw\n',
    'round-1/selection/selected-hypothesis.json': '{"hypothesisId":"h-1"}\n',
    'round-1/causal-attribution/bounded-causal-attribution.json': '{"schemaVersion":"bounded-causal-attribution-v1"}\n',
    'round-1/problem-package.json': '{"problemId":"problem-1"}\n',
    'round-1/solution-agent/participant-prompt.txt': 'solution prompt\n',
    'round-1/solution-agent/participant-binding.json': '{"provider":"codex-local-subagent"}\n',
    'round-1/solution-agent/invocation.json': '{"role":"solution","invocationRef":"solution-invocation-000001","status":"completed"}\n',
    'round-1/solution-agent/execution-trace.json': '{"schemaVersion":"participant-execution-trace-v1"}\n',
    'round-1/solution-agent/raw-output.txt': 'solution raw\n',
    'round-1/solution-agent/result.json': '{"status":"NO_PROPOSAL"}\n',
    'round-1/reviewer-agent/participant-prompt.txt': 'reviewer prompt\n',
    'round-1/reviewer-agent/participant-binding.json': '{"provider":"codex-local-subagent"}\n',
    'round-1/reviewer-agent/invocation.json': '{"role":"reviewer","invocationRef":"reviewer-invocation-000001","status":"completed"}\n',
    'round-1/reviewer-agent/execution-trace.json': '{"schemaVersion":"participant-execution-trace-v1"}\n',
    'round-1/reviewer-agent/raw-output.txt': 'reviewer raw\n',
    'round-1/reviewer-agent/review.json': '{"decision":"REJECT"}\n',
    'problem-package.json': JSON.stringify({
      source: {
        observablePayloadRef: 'source/observable-payload.json',
        externalFeedbackRef: `round-1/feedback-runs/${sessionId}/feedback.json`,
        improvementHypothesisRef: `round-1/hypothesis-runs/${sessionId}/hypotheses.json`,
        diagnosticEvidenceRefs: ['round-1/causal-attribution/bounded-causal-attribution.json'],
      },
    }) + '\n',
    'round-1/decision.json': '{"route":"SKIP"}\n',
    'round-1/workflow-outcome.json': '{"outcome":"COMPLETED"}\n',
  };
  for (const [relativePath, bytes] of Object.entries(files)) {
    const path = join(experimentRoot, relativePath);
    await mkdir(join(path, '..'), { recursive: true });
    await writeFile(path, bytes);
  }
}

export async function runDurableEvidenceForensicE2ETests(): Promise<void> {
  const repositoryRoot = await mkdtemp(join(tmpdir(), 'wuxia-durable-forensic-e2e-'));
  const sessionId = 'ordinary-run-20260913-000101';
  const persona = getP8GatePersonas()[0]!;
  let observedWorkflow: OperatorAeWorkflowResult | undefined;
  const result = await runOrdinaryEvolution({
    repositoryRoot,
    dependencies: {
      preflightGit: async () => ({ branch: 'dev', headSha: 'a'.repeat(40), statusShort: '', clean: true }),
      resolveBinding: async () => ({ bindingId: 'CODEX_CURRENT', provider: 'codex-local-subagent', executable: process.execPath, executableVersion: process.version, participant: { executable: process.execPath, buildArgs: () => [] }, participantMode: 'local-subagent' }),
      allocateSessionId: async () => sessionId,
      runPhase0Source: async input => {
        const phase0 = await runPhase0({ runRef: input.sessionId, outRoot: join(input.sessionRoot, 'game-runs'), anchorRoot: join(input.sessionRoot, 'phase0-anchors'), persona, seed: 17, endAge: 2, catalogVersion: '1.0.0', maxSteps: 120 });
        return { sourceRoot: phase0.outDir, sourceRunRef: phase0.runRef };
      },
      runAeWorkflow: async input => {
        const execution = sessionExecution(sessionId);
        await writeEvidenceFixture(input.sessionRoot + '/experiment', sessionId);
        const workflow: OperatorAeWorkflowResult = {
          multiRound: { status: 'stopped', outcome: execution.outcome, stopReason: execution.stopReason, manifestPath: input.sessionRoot + '/experiment/run-manifest.json', rounds: [], execution: null, actualParticipantJobs: 4, crossRoundTransitions: 0 },
          sessionExecution: execution,
          authoritativeRootChanged: false,
          experimentRoot: input.sessionRoot + '/experiment',
        };
        observedWorkflow = workflow;
        return workflow;
      },
      archiveReport: async () => ({ reportId: 'ae-report-forensic-e2e', reportDirectory: join(repositoryRoot, 'artifacts/evolution/run-reports/ae-report-forensic-e2e') }),
      refreshHumanFollowupInbox: async () => ({ inboxPath: 'artifacts/evolution/human-follow-up/index.md', activeCount: 0 }),
      refreshOperationalIndex: async () => ({ topLevelIndexPath: 'artifacts/evolution/index.md' }),
    },
  });

  assert.ok(observedWorkflow);
  assert.equal(result.durableEvidenceStatus, 'PASS');
  assert.equal(result.sessionExecution.outcome, 'NO_CROSS_ROUND_TRANSITION_OBSERVED');
  const capsuleRoot = join(repositoryRoot, result.durableEvidenceCapsulePath!);
  const manifest = await verifyDurableEvidenceCapsule(capsuleRoot);
  assert.equal(manifest.sessionId, sessionId);
  assert.equal(manifest.sourceRunRef, sessionId);
  assert.ok(manifest.objects.some(object => object.relativePath.endsWith('/feedback.json')));
  assert.ok(manifest.objects.some(object => object.relativePath.endsWith('/hypotheses.json')));
  assert.ok(manifest.objects.some(object => object.relativePath.endsWith('/selected-hypothesis.json')));
  assert.ok(manifest.objects.some(object => object.relativePath.endsWith('/problem-package.json')));
  assert.ok(manifest.objects.some(object => object.relativePath.endsWith('/decision.json')));
  assert.ok(manifest.objects.some(object => object.evidenceKind === 'execution_trace'));
  assert.equal(manifest.objects.some(object => object.relativePath.includes('participant-workspace')), false);
  assert.equal(
    manifest.objects.find(object => object.relativePath.endsWith(`/feedback-runs/${sessionId}/observable-payload.json`))?.visibility,
    'PARTICIPANT_VISIBLE',
  );
  assert.equal(
    manifest.objects.find(object => object.relativePath.endsWith(`/hypothesis-runs/${sessionId}/source-observable-payload.json`))?.visibility,
    'PARTICIPANT_VISIBLE',
  );
  assert.equal(manifest.objects.find(object => object.relativePath === `source/${sessionId}/reviewer-input/observable-payload.json`)?.visibility, 'PARTICIPANT_VISIBLE');
  assert.equal(manifest.objects.find(object => object.relativePath === `source/${sessionId}/internal/player-surface-source.json`)?.visibility, 'HUMAN_FORENSIC_ONLY');
  const objectsByName = new Map(manifest.objects.map(object => [object.logicalName, object] as const));
  for (const receipt of manifest.participantReceipts) {
    for (const visibleEvidence of receipt.visibleEvidence) {
      assert.equal(objectsByName.get(visibleEvidence.logicalName)?.visibility, 'PARTICIPANT_VISIBLE');
    }
  }
  const hypothesisReceipt = manifest.participantReceipts.find(receipt => receipt.role === 'hypothesis');
  assert.ok(hypothesisReceipt?.visibleEvidence.some(ref => ref.logicalName.endsWith('source-feedback.json')));
  assert.ok(hypothesisReceipt?.visibleEvidence.some(ref => ref.logicalName.endsWith('source-pattern-evidence.json')));
  for (const role of ['solution', 'reviewer'] as const) {
    const receipt = manifest.participantReceipts.find(candidate => candidate.role === role);
    assert.ok(receipt?.visibleEvidence.some(ref => ref.logicalName.endsWith('feedback.json')));
    assert.ok(receipt?.visibleEvidence.some(ref => ref.logicalName.endsWith('hypotheses.json')));
    assert.ok(receipt?.visibleEvidence.some(ref => ref.logicalName.endsWith('bounded-causal-attribution.json')));
  }

  const sessionRoot = join(repositoryRoot, '.tmp/evolution', sessionId);
  const reconstructed = join(repositoryRoot, 'forensic-reconstructed-source');
  await cp(join(capsuleRoot, 'source', sessionId), reconstructed, { recursive: true });
  await rm(sessionRoot, { recursive: true, force: false });
  await assert.rejects(() => readFile(join(sessionRoot, 'experiment', 'run-manifest.json'), 'utf8'), /ENOENT/);
  await validatePhase0RunSeal(reconstructed, await readFile(join(reconstructed, 'experiment-root.sha256'), 'utf8'));
  const postDeletionManifest = await verifyDurableEvidenceCapsule(capsuleRoot);
  assert.equal(postDeletionManifest.sessionId, sessionId);
  const capsuleObject = async (relativePath: string): Promise<string> => readFile(join(capsuleRoot, relativePath), 'utf8');
  assert.deepEqual(JSON.parse(await capsuleObject('workflow/round-1/selection/selected-hypothesis.json')), { hypothesisId: 'h-1' });
  assert.equal(JSON.parse(await capsuleObject('workflow/round-1/causal-attribution/bounded-causal-attribution.json')).schemaVersion, 'bounded-causal-attribution-v1');
  assert.equal(JSON.parse(await capsuleObject('workflow/round-1/problem-package.json')).problemId, 'problem-1');
  assert.equal(JSON.parse(await capsuleObject('workflow/round-1/decision.json')).route, 'SKIP');
  assert.deepEqual(
    postDeletionManifest.participantReceipts.map(receipt => receipt.role).sort(),
    ['feedback', 'hypothesis', 'reviewer', 'solution'],
  );
  assert.equal(postDeletionManifest.objects.some(object => object.relativePath.includes('participant-workspace')), false);

  await runCrossRoundSourceClosureTest();
}

async function runCrossRoundSourceClosureTest(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'wuxia-cross-round-capsule-'));
  const sessionId = 'ordinary-run-20260913-000201';
  const resultingRunRef = `${sessionId}-round-2-run-000001`;
  const sessionRoot = join(root, '.tmp/evolution', sessionId);
  const gameRunsRoot = join(sessionRoot, 'game-runs');
  const anchorRoot = join(sessionRoot, 'run-anchors');
  const persona = getP8GatePersonas()[0]!;
  const initial = await runPhase0({ runRef: sessionId, outRoot: gameRunsRoot, anchorRoot, persona, seed: 21, endAge: 2, catalogVersion: '1.0.0', maxSteps: 120 });
  const resulting = await runPhase0({ runRef: resultingRunRef, outRoot: gameRunsRoot, anchorRoot, persona, seed: 22, endAge: 2, catalogVersion: '1.0.0', maxSteps: 120 });
  const experimentRoot = join(root, 'experiment');
  await mkdir(join(experimentRoot, 'configuration-execution/before/src'), { recursive: true });
  await mkdir(join(experimentRoot, 'configuration-execution/after/src'), { recursive: true });
  await writeFile(join(experimentRoot, 'configuration-execution/before-manifest.json'), '{"allowedWritePaths":["src/data/example.json"]}\n');
  await writeFile(join(experimentRoot, 'configuration-execution/after-manifest.json'), '{"actualChangedFiles":["src/data/example.json"]}\n');
  await writeFile(join(experimentRoot, 'configuration-execution/before/src/data.example.json'), 'A\n');
  await writeFile(join(experimentRoot, 'configuration-execution/after/src/data.example.json'), 'B\n');
  const evidence = await collectOrdinaryEvidence({ repositoryRoot: root, sessionRoot, experimentRoot, sessionId, sourceRunRefs: [initial.runRef, resulting.runRef] });
  const capsule = await publishDurableEvidenceCapsule({
    capsuleRoot: join(root, 'artifacts/evolution/run-evidence', sessionId),
    sessionId,
    sourceRunRef: initial.runRef,
    createdAt: '2026-09-13T00:00:00.000Z',
    repositoryIdentity: { branch: 'dev', headSha: 'a'.repeat(40), workingTreeClean: true },
    workflowIdentity: { workflow: 'ordinary-auto-evolution' },
    evidence,
    importantEvents: { participantFailure: false, reviewContinuation: false, configurationExecution: true, crossRoundTransition: true },
    extensions: { configurationExecution: { status: 'present', refs: ['extensions/configuration-execution'] }, crossRoundTransition: { status: 'present', refs: [`source/${resulting.runRef}`] } },
  });
  const manifest = await verifyDurableEvidenceCapsule(capsule.capsuleRoot);
  assert.equal(manifest.extensions.crossRoundTransition.status, 'present');
  assert.ok(manifest.objects.some(object => object.relativePath === `source/${resultingRunRef}/internal/player-surface-source.json`));
  const reconstructed = join(root, 'reconstructed-resulting-source');
  await cp(join(capsule.capsuleRoot, 'source', resultingRunRef), reconstructed, { recursive: true });
  await rm(sessionRoot, { recursive: true, force: false });
  await validatePhase0RunSeal(reconstructed, await readFile(join(reconstructed, 'experiment-root.sha256'), 'utf8'));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runDurableEvidenceForensicE2ETests()
    .then(() => console.log('durableEvidenceForensicE2E.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
