import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  formatOrdinaryEvolutionOperatorSummary,
  formatOperatorFailureGuidance,
  OperatorPreflightError,
  resolveAuthoritativeRootChanged,
  runOrdinaryEvolution,
  selectP8PersonaForSeed,
  type OperatorAeWorkflowResult,
} from '../../scripts/evolution/operator/runOrdinaryEvolution';
import { getP8GatePersonas } from '../../src/p8/personas';
import {
  OPERATOR_BINDING_CODEX_CURRENT,
  createCodexCurrentParticipant,
  parseOperatorParticipantBindingId,
  ParticipantBindingUnavailableError,
  type ResolvedOperatorParticipantBinding,
} from '../../scripts/evolution/operator/resolveParticipantBinding';
import { runStructuredParticipantExecution } from '../../scripts/evolution/problemAgnosticSolution/runStructuredParticipantExecution';
import type { WorkspaceAgentJobInput } from '../../scripts/evolution/problemAgnosticSolution/agentParticipant';
import { allocateOrdinarySessionId, formatOrdinarySessionId } from '../../scripts/evolution/operator/allocateSessionId';
import {
  buildMultiRoundSessionSummary,
  parseMultiRoundRunManifest,
  type MultiRoundSessionSummaryV1,
  type MultiRoundSessionSummaryV2,
} from '../../scripts/evolution/multiRoundRunManifestContract';

function fakeBinding(
  bindingId: typeof OPERATOR_BINDING_CODEX_CURRENT = OPERATOR_BINDING_CODEX_CURRENT,
): ResolvedOperatorParticipantBinding {
  return {
    bindingId,
    provider: 'codex-local-subagent',
    executable: '/tmp/fake-codex',
    executableVersion: 'fake-codex 0.0.0',
    participant: {
      executable: '/tmp/fake-codex',
      buildArgs: () => [],
    },
    participantMode: 'local-subagent',
  };
}

function sessionSummary(overrides: Partial<MultiRoundSessionSummaryV1> = {}): MultiRoundSessionSummaryV1 {
  const base = buildMultiRoundSessionSummary(parseMultiRoundRunManifest({
    schemaVersion: 'multi-round-run-manifest-v1',
    multiRoundRunRef: 'ordinary-run-20260903-000042',
    initialSourceRunRef: 'ordinary-run-20260903-000042',
    limits: {
      maxAgentRounds: 2,
      maxCrossRoundTransitions: 1,
      maxRoundParticipantJobs: 4,
      maxExecutionParticipantJobs: 1,
      maxTotalParticipantJobs: 9,
      retryCount: 0,
    },
    rounds: [{
      round: 1,
      workflowRef: 'round-1',
      sourceRunRef: 'ordinary-run-20260903-000042',
      terminalRoute: 'DEFER_MORE_WORK_REQUESTED',
      executionRef: null,
      resultingRunRef: null,
      nextAction: 'STOP',
    }],
    execution: {
      executionRef: 'configuration-execution-000001',
      allowedWritePaths: [],
      actualChangedFiles: [],
      status: 'not_started',
      verificationResults: [],
      resultingRunRef: null,
    },
    budget: {
      round1ParticipantJobs: 4,
      executionParticipantJobs: 0,
      round2ParticipantJobs: 0,
      totalParticipantJobs: 4,
      retryCount: 0,
    },
    outcome: 'NO_CROSS_ROUND_TRANSITION_OBSERVED',
    stopReason: 'ROUND_1_TERMINAL_NOT_READY',
  }));
  return {
    ...base,
    ...overrides,
    execution: {
      ...base.execution,
      ...(overrides.execution ?? {}),
    },
  };
}

function continuationSessionSummary(): MultiRoundSessionSummaryV2 {
  return {
    schemaVersion: 'multi-round-session-summary-v2',
    multiRoundRunRef: 'ordinary-run-20260912-000001',
    outcome: 'NO_CROSS_ROUND_TRANSITION_OBSERVED',
    stopReason: 'ROUND_1_TERMINAL_NOT_READY',
    roundCount: 1,
    crossRoundTransitions: 0,
    rounds: [{
      round: 1,
      baseTerminalRoute: 'DEFER_MORE_WORK_REQUESTED',
      baseReasonCode: 'REVIEW_REQUEST_MORE_WORK',
      continuationRef: 'review-continuation-000001',
      effectiveTerminalRoute: 'ESCALATE_HUMAN',
      effectiveReasonCode: 'EXPLICIT_ESCALATION',
    }],
    reviewContinuationCount: 1,
    reviewContinuationParticipantJobs: 2,
    lastRoundTerminalRoute: 'ESCALATE_HUMAN',
    execution: {
      executionRef: 'configuration-execution-000001',
      status: 'not_started',
      actualChangedFiles: [],
      resultingRunRef: null,
    },
  };
}

function aeResult(overrides: Partial<OperatorAeWorkflowResult> = {}): OperatorAeWorkflowResult {
  const { sessionExecution: provided, ...rest } = overrides;
  const summary = provided ?? sessionSummary();
  return {
    multiRound: {
      status: 'stopped',
      outcome: summary.outcome,
      stopReason: summary.stopReason,
      manifestPath: '/tmp/manifest.json',
      rounds: [{
        round: 1,
        workflowRef: 'round-1',
        sourceRunRef: summary.multiRoundRunRef,
        terminalRoute: summary.lastRoundTerminalRoute,
        executionRef: null,
        resultingRunRef: null,
        nextAction: 'STOP',
      }],
      execution: null,
      actualParticipantJobs: 4,
      crossRoundTransitions: summary.crossRoundTransitions,
    },
    sessionExecution: summary,
    authoritativeRootChanged: false,
    experimentRoot: '/tmp/experiment',
    ...rest,
  };
}

async function createRepo(): Promise<string> {
  return mkdtemp(join(tmpdir(), 'ae-operator-'));
}

export async function runOrdinaryEvolutionOperatorTests(): Promise<void> {
  const binding = createCodexCurrentParticipant('codex', 'fixture');
  const job: WorkspaceAgentJobInput = { invocationRef: 'fixture', role: 'solution', workspaceRoot: process.cwd(), prompt: 'fixture' };
  const threadId = '01a08753-9e8e-7973-90ef-52893da1c561';
  const threadRef = { provider: 'codex-exec', opaqueId: threadId };
  assert.ok(binding.buildArgs(job).includes('--json'));
  assert.ok(!binding.buildArgs(job).includes('--ephemeral'));
  assert.ok(binding.sameThreadContinuation);
  const resumeArgs = binding.sameThreadContinuation.buildArgs(job, threadRef);
  assert.ok(resumeArgs.includes('resume'));
  assert.ok(resumeArgs.includes(threadId));
  assert.ok(!resumeArgs.includes('--last'));
  for (const role of ['reviewer', 'feedback', 'hypothesis', 'configuration-execution'] as const) {
    const other = { ...job, role };
    assert.ok(binding.buildArgs(other).includes('--ephemeral'));
    assert.ok(!binding.buildArgs(other).includes('--json'));
    assert.throws(() => binding.sameThreadContinuation!.buildArgs(other, threadRef));
    assert.deepEqual(binding.interpretCompletedOutput!({ job: other, stdout: 'original', stderr: '' }), { ok: true, rawOutput: 'original' });
    assert.equal(binding.interpretCompletedOutput!({ job: other, stdout: 'original', stderr: '', expectedThreadRef: threadRef }).ok, false);
  }
  const wire = (payload: string, id = threadId) => [
    { type: 'thread.started', thread_id: id },
    { type: 'turn.started' },
    { type: 'item.completed', item: { type: 'agent_message', text: payload } },
    { type: 'turn.completed', usage: {} },
  ].map(e => JSON.stringify(e)).join('\n');
  const interpret = (stdout: string, resumed = false) => binding.interpretCompletedOutput!({ job, stdout, stderr: '', ...(resumed ? { expectedThreadRef: threadRef } : {}) });
  const valid = interpret(wire(' {"ok":true} '));
  assert.ok(valid.ok);
  if (valid.ok) assert.equal(valid.rawOutput, ' {"ok":true} ', 'Host must preserve Role payload verbatim');
  for (const invalid of [
    'null', '[]', '17', 'not-json',
    wire('{}').split('\n').slice(0, -1).join('\n'),
    wire('{}').split('\n').slice(1).join('\n'),
    wire('{}').split('\n').filter(line => !line.includes('agent_message')).join('\n'),
    wire('{}').split('\n').filter(line => !line.includes('turn.started')).join('\n'),
    wire('{}', 'not-a-uuid'),
    wire('{}') + '\n' + JSON.stringify({ type: 'thread.started', thread_id: '01a08753-9e8e-7973-90ef-52893da1c562' }),
    wire('{}') + '\n' + JSON.stringify({ type: 'turn.failed' }),
    wire('{}') + '\n' + JSON.stringify({ type: 'error' }),
    wire('{}') + '\n' + JSON.stringify({ type: 'turn.completed' }),
    wire('{}') + '\n' + JSON.stringify({ type: 'item.started', item: { type: 'command_execution' } }),
  ]) assert.equal(interpret(invalid).ok, false, invalid);
  const mismatch = interpret(wire('{}', '01a08753-9e8e-7973-90ef-52893da1c562'), true);
  assert.ok(!mismatch.ok);
  if (!mismatch.ok) assert.equal(mismatch.errorKind, 'continuation');

  for (const scenario of [
    { name: 'valid', first: '{"ok":true}', second: '', calls: 1, ok: true },
    { name: 'envelope-recovered', first: '{"ok":true', second: '{"ok":true}', calls: 2, ok: true },
    { name: 'schema-rejected', first: '{"wrong":true}', second: '', calls: 1, ok: false },
    { name: 'second-envelope-failed', first: '{', second: '{', calls: 2, ok: false },
    { name: 'resume-mismatch', first: '{', second: '{"ok":true}', calls: 2, ok: false },
    { name: 'broken-transport', first: '{}', second: '', calls: 1, ok: false },
  ]) {
    const destinationRoot = await mkdtemp(join(tmpdir(), `codex-binding-${scenario.name}-`));
    let calls = 0;
    const nodeArgs = (payload: string, id = threadId) => ['-e', `process.stdout.write(${JSON.stringify(wire(payload, id))})`];
    const execution = await runStructuredParticipantExecution({
      invocationRef: scenario.name, role: 'solution', workspaceRoot: process.cwd(), destinationRoot,
      initialPrompt: 'fixture', expectedRoleSchemaName: 'fixture', retransmissionEnabled: true,
      participant: {
        ...binding, executable: process.execPath,
        buildArgs: () => {
          calls++;
          return scenario.name === 'broken-transport'
            ? ['-e', 'process.stdout.write("null")']
            : nodeArgs(scenario.first);
        },
        sameThreadContinuation: { provider: 'codex-exec', buildArgs: (input, ref) => {
          binding.sameThreadContinuation!.buildArgs(input, ref);
          assert.deepEqual(ref, threadRef);
          calls++;
          return nodeArgs(scenario.second, scenario.name === 'resume-mismatch' ? '01a08753-9e8e-7973-90ef-52893da1c562' : threadId);
        } },
      },
      validateSchema: value => { assert.equal(value.ok, true); return value; },
      validateAcceptedResult: async () => {},
    });
    assert.equal(execution.ok, scenario.ok, scenario.name);
    assert.equal(calls, scenario.calls, scenario.name);
    assert.equal(await readFile(join(destinationRoot, 'terminal-attempt-0.txt'), 'utf8'), scenario.name === 'broken-transport' ? 'null' : scenario.first);
    if (calls === 2) {
      const requested = execution.executionTrace.events.find(e => e.type === 'participant_envelope_retransmission_requested');
      assert.equal(requested?.timeoutMs, 60000);
    }
  }
  const unknownGuidance = formatOperatorFailureGuidance(new Error('unexpected phase0 failure'));
  assert.match(unknownGuidance, /staging.*seal/);
  assert.match(unknownGuidance, /恢复条件/);
  assert.match(unknownGuidance, /不自动重跑/);
  assert.match(formatOperatorFailureGuidance(new OperatorPreflightError('dirty')), /git status.*stash/);
  assert.match(formatOperatorFailureGuidance(new ParticipantBindingUnavailableError('missing')), /不要自动切换 provider/);

  const rosterIds = new Set(getP8GatePersonas().map(persona => persona.id));
  const replayed = selectP8PersonaForSeed(123456789);
  assert.equal(selectP8PersonaForSeed(123456789).id, replayed.id);
  assert.deepEqual(
    new Set(Array.from({ length: rosterIds.size }, (_, seed) => selectP8PersonaForSeed(seed).id)),
    rosterIds,
  );

  {
    const result = {
      ...({
        sessionId: 'ordinary-run-20260912-000001',
        branch: 'dev',
        headSha: 'e'.repeat(40),
        workingTreeClean: true,
        participantBinding: OPERATOR_BINDING_CODEX_CURRENT,
        authoritativeRootChanged: false,
        runReportId: null,
        runReportPath: null,
        humanFollowupActiveCount: null,
        operationalIndexPath: null,
        observabilityStatus: 'PASS' as const,
        observabilityError: null,
        sessionRoot: '.tmp/evolution/ordinary-run-20260912-000001',
        experimentRoot: '.tmp/evolution/ordinary-run-20260912-000001/problem-agnostic-agent-solution-loop-instance-000001',
      }),
      sessionExecution: continuationSessionSummary(),
    } as Parameters<typeof formatOrdinaryEvolutionOperatorSummary>[0];
    const summary = formatOrdinaryEvolutionOperatorSummary(result);
    assert.match(summary, /base route: DEFER_MORE_WORK_REQUESTED/);
    assert.match(summary, /review continuation: review-continuation-000001/);
    assert.match(summary, /effective route: ESCALATE_HUMAN/);
  }

  // Observe the actual Phase0 handoff, stopping before any Participant job.
  const repositoryRoot = await createRepo();
  const stop = new Error('phase0 handoff inspected');
  await assert.rejects(() => runOrdinaryEvolution({
    repositoryRoot,
    dependencies: {
      preflightGit: async () => ({ branch: 'dev', headSha: 'c'.repeat(40), statusShort: '', clean: true }),
      resolveBinding: async () => fakeBinding(),
      allocateSessionId: async () => formatOrdinarySessionId('20260908', 1),
      runPhase0Source: async input => {
        assert.equal(input.persona.id, selectP8PersonaForSeed(input.seed).id);
        assert.ok(Number.isSafeInteger(input.seed));
        throw stop;
      },
      runAeWorkflow: async () => { throw new Error('must not start Participant work'); },
    },
  }), error => error === stop);
  assert.equal(parseOperatorParticipantBindingId(undefined), OPERATOR_BINDING_CODEX_CURRENT);
  assert.equal(parseOperatorParticipantBindingId('CODEX_CURRENT'), OPERATOR_BINDING_CODEX_CURRENT);
  assert.throws(
    () => parseOperatorParticipantBindingId('PREVIOUS_RUN'),
    /PARTICIPANT_BINDING_UNAVAILABLE/,
  );

  {
    const repositoryRoot = await createRepo();
    let workflowCalls = 0;
    const result = await runOrdinaryEvolution({
      repositoryRoot,
      dependencies: {
        preflightGit: async () => ({
          branch: 'dev',
          headSha: 'a'.repeat(40),
          statusShort: ' M src/example.ts',
          clean: false,
        }),
        resolveBinding: async () => fakeBinding(),
        allocateSessionId: async () => 'ordinary-run-20260903-000007',
        runPhase0Source: async () => ({
          sourceRoot: join(repositoryRoot, 'sealed-source'),
          sourceRunRef: 'ordinary-run-20260903-000007',
        }),
        runAeWorkflow: async () => {
          workflowCalls += 1;
          return aeResult({
            experimentRoot: join(repositoryRoot, 'experiment'),
          });
        },
        archiveReport: async () => ({
          reportId: 'ae-report-dirty-worktree',
          reportDirectory: join(repositoryRoot, 'artifacts/evolution/run-reports/ae-report-dirty-worktree'),
        }),
        refreshHumanFollowupInbox: async () => ({
          inboxPath: join(repositoryRoot, 'artifacts/evolution/human-follow-up/index.md'),
          activeCount: 0,
        }),
        refreshOperationalIndex: async () => ({
          topLevelIndexPath: join(repositoryRoot, 'artifacts/evolution/index.md'),
        }),
      },
    });
    assert.equal(workflowCalls, 1);
    assert.equal(result.schemaVersion, 'ordinary-evolution-operator-result-v3');
    assert.equal(result.workingTreeClean, false);
    const persisted = JSON.parse(
      await readFile(join(repositoryRoot, result.sessionRoot, 'operator-result.json'), 'utf8'),
    ) as Record<string, unknown>;
    assert.equal(persisted.schemaVersion, 'ordinary-evolution-operator-result-v3');
    assert.equal(persisted.workingTreeClean, false);
    const summary = formatOrdinaryEvolutionOperatorSummary(result);
    assert.match(summary, /Git 基线：\ndev@a{40}/);
    assert.match(summary, /工作树：\ndirty（DEV_CONVENIENCE_ONLY：本次 AE 使用当前 workspace，含未提交修改；正式观察仍应用 clean tree）/);
    assert.doesNotMatch(summary, /源版本：/);
  }

  {
    const repositoryRoot = await createRepo();
    let workflowCalls = 0;
    await assert.rejects(
      () => runOrdinaryEvolution({
        repositoryRoot,
        dependencies: {
          preflightGit: async () => ({
            branch: 'feature/x',
            headSha: 'a'.repeat(40),
            statusShort: '',
            clean: true,
          }),
          runAeWorkflow: async () => {
            workflowCalls += 1;
            return aeResult();
          },
        },
      }),
      /OPERATOR_PREFLIGHT_FAILED: branch must be dev/,
    );
    assert.equal(workflowCalls, 0);
  }

  {
    const repositoryRoot = await createRepo();
    let workflowCalls = 0;
    await assert.rejects(
      () => runOrdinaryEvolution({
        repositoryRoot,
        bindingId: 'CURSOR_AUTO',
        dependencies: {
          preflightGit: async () => ({
            branch: 'dev',
            headSha: 'b'.repeat(40),
            statusShort: '',
            clean: true,
          }),
          runAeWorkflow: async () => {
            workflowCalls += 1;
            return aeResult();
          },
        },
      }),
      ParticipantBindingUnavailableError,
    );
    assert.equal(workflowCalls, 0);
  }

  for (const caseInput of [
    {
      stopReason: 'ROUND_1_TERMINAL_NOT_READY',
      outcome: 'NO_CROSS_ROUND_TRANSITION_OBSERVED' as const,
      lastRoundTerminalRoute: 'DEFER_MORE_WORK_REQUESTED',
      executionStatus: 'not_started' as const,
    },
    {
      stopReason: 'ROUND_1_TERMINAL_NOT_READY',
      outcome: 'NO_CROSS_ROUND_TRANSITION_OBSERVED' as const,
      lastRoundTerminalRoute: 'ESCALATE_HUMAN',
      executionStatus: 'not_started' as const,
    },
    {
      stopReason: 'EXECUTION_SCOPE_VIOLATION',
      outcome: 'STOPPED' as const,
      lastRoundTerminalRoute: 'READY_FOR_CONFIG_EXECUTION',
      executionStatus: 'scope_violation' as const,
    },
  ]) {
    const repositoryRoot = await createRepo();
    let workflowCalls = 0;
    let archiveCalls = 0;
    let inboxCalls = 0;
    let indexCalls = 0;
    const sequence: string[] = [];
    const summary = sessionSummary({
      stopReason: caseInput.stopReason,
      outcome: caseInput.outcome,
      lastRoundTerminalRoute: caseInput.lastRoundTerminalRoute,
      execution: {
        executionRef: 'configuration-execution-000001',
        status: caseInput.executionStatus,
        actualChangedFiles: caseInput.executionStatus === 'not_started' ? [] : ['src/data/lines/x.json'],
        resultingRunRef: null,
      },
    });

    const result = await runOrdinaryEvolution({
      repositoryRoot,
      dependencies: {
        preflightGit: async () => ({
          branch: 'dev',
          headSha: 'c'.repeat(40),
          statusShort: '',
          clean: true,
        }),
        resolveBinding: async bindingId => {
          assert.equal(bindingId, OPERATOR_BINDING_CODEX_CURRENT);
          return fakeBinding();
        },
        allocateSessionId: async () => 'ordinary-run-20260903-000042',
        runPhase0Source: async () => ({
          sourceRoot: join(repositoryRoot, 'sealed-source'),
          sourceRunRef: 'ordinary-run-20260903-000042',
        }),
        runAeWorkflow: async () => {
          workflowCalls += 1;
          sequence.push('workflow');
          return aeResult({
            sessionExecution: summary,
            experimentRoot: join(repositoryRoot, '.tmp/evolution/ordinary-run-20260903-000042/problem-agnostic-agent-solution-loop-instance-000001'),
          });
        },
        archiveReport: async ({ root }) => {
          archiveCalls += 1;
          sequence.push('archive');
          assert.equal(root, '.tmp/evolution/ordinary-run-20260903-000042');
          return {
            reportId: 'ae-report-deadbeefdeadbeef',
            reportDirectory: join(repositoryRoot, 'artifacts/evolution/run-reports/ae-report-deadbeefdeadbeef'),
          };
        },
        refreshHumanFollowupInbox: async () => {
          inboxCalls += 1;
          sequence.push('inbox');
          return {
            inboxPath: join(repositoryRoot, 'artifacts/evolution/human-follow-up/index.md'),
            activeCount: caseInput.lastRoundTerminalRoute === 'ESCALATE_HUMAN' ? 1 : 0,
          };
        },
        refreshOperationalIndex: async () => {
          indexCalls += 1;
          sequence.push('index');
          return {
            topLevelIndexPath: join(repositoryRoot, 'artifacts/evolution/index.md'),
          };
        },
      },
    });

    assert.equal(workflowCalls, 1);
    assert.equal(archiveCalls, 1);
    assert.equal(inboxCalls, 1);
    assert.equal(indexCalls, 1);
    assert.deepEqual(sequence, ['workflow', 'archive', 'inbox', 'index']);
    assert.equal(result.schemaVersion, 'ordinary-evolution-operator-result-v3');
    assert.equal(result.workingTreeClean, true);
    assert.deepEqual(result.sessionExecution, summary);
    assert.equal(result.participantBinding, OPERATOR_BINDING_CODEX_CURRENT);
    assert.equal(result.sessionId, 'ordinary-run-20260903-000042');
    assert.equal(result.headSha, 'c'.repeat(40));
    assert.equal(result.observabilityStatus, 'PASS');
    assert.equal(result.authoritativeRootChanged, false);
    assert.equal(result.runReportId, 'ae-report-deadbeefdeadbeef');
    assert.equal(result.operationalIndexPath, 'artifacts/evolution/index.md');

    const text = formatOrdinaryEvolutionOperatorSummary(result);
    assert.match(text, /AE 运行/);
    assert.match(text, /会话：\nordinary-run-20260903-000042/);
    assert.match(text, new RegExp(`Host 停止原因：\\n${caseInput.stopReason}`));
    assert.match(text, new RegExp(`多轮执行结果：\\n${caseInput.outcome}`));
    assert.match(text, new RegExp(`最后一轮路由：\\n${caseInput.lastRoundTerminalRoute}`));
    assert.match(text, new RegExp(`执行状态：\\n${caseInput.executionStatus}`));
    assert.match(text, /权威仓库根完整性：\n未变更/);
    assert.match(text, /Git 基线：\ndev@c{40}/);
    assert.match(text, /工作树：\nclean/);
    assert.doesNotMatch(text, /源版本：/);
    assert.match(text, /Participant：\nCODEX_CURRENT/);
    assert.match(
      text,
      new RegExp(`Human Follow-up：\\n${caseInput.lastRoundTerminalRoute === 'ESCALATE_HUMAN' ? 1 : 0} 项 active`),
    );
    assert.match(text, /可观测性：\nPASS/);
    assert.doesNotMatch(text, /\noutcome:\n/);
  }

  {
    const repositoryRoot = await createRepo();
    let workflowCalls = 0;
    const summary = sessionSummary();
    const result = await runOrdinaryEvolution({
      repositoryRoot,
      dependencies: {
        preflightGit: async () => ({
          branch: 'dev',
          headSha: 'd'.repeat(40),
          statusShort: '',
          clean: true,
        }),
        resolveBinding: async () => fakeBinding(),
        allocateSessionId: async () => 'ordinary-run-20260903-000099',
        runPhase0Source: async () => ({
          sourceRoot: join(repositoryRoot, 'sealed'),
          sourceRunRef: 'ordinary-run-20260903-000099',
        }),
        runAeWorkflow: async () => {
          workflowCalls += 1;
          return aeResult({
            sessionExecution: summary,
            experimentRoot: join(repositoryRoot, 'experiment'),
          });
        },
        archiveReport: async () => {
          throw new Error('archive exploded');
        },
        refreshHumanFollowupInbox: async () => {
          throw new Error('inbox must not run after archive failure');
        },
        refreshOperationalIndex: async () => {
          throw new Error('index must not run after archive failure');
        },
      },
    });
    assert.equal(workflowCalls, 1);
    assert.deepEqual(result.sessionExecution, summary);
    assert.equal(result.observabilityStatus, 'OBSERVABILITY_REFRESH_FAILED');
    assert.match(result.observabilityError ?? '', /archive exploded/);
    assert.match(
      formatOrdinaryEvolutionOperatorSummary(result),
      /Host 停止原因：\nROUND_1_TERMINAL_NOT_READY/,
    );
    assert.match(
      formatOrdinaryEvolutionOperatorSummary(result),
      /可观测性错误：\narchive exploded/,
    );
  }

  {
    const repositoryRoot = await createRepo();
    await mkdir(join(repositoryRoot, '.tmp/evolution/ordinary-run-20260903-000001'), { recursive: true });
    const allocated = await allocateOrdinarySessionId({
      repositoryRoot,
      now: new Date('2026-09-03T12:00:00'),
    });
    assert.equal(allocated, 'ordinary-run-20260903-000002');
    assert.equal(formatOrdinarySessionId('20260903', 2), 'ordinary-run-20260903-000002');
  }

  assert.equal(resolveAuthoritativeRootChanged({ fingerprintBefore: 'a', fingerprintAfter: 'a' }), false);
  assert.equal(resolveAuthoritativeRootChanged({ fingerprintBefore: 'a', fingerprintAfter: 'b' }), true);

  {
    const operatorSource = await readFile(
      new URL('../../scripts/evolution/operator/runOrdinaryEvolution.ts', import.meta.url),
      'utf8',
    );
    assert.match(operatorSource, /buildMultiRoundSessionSummary/);
    assert.match(operatorSource, /readMultiRoundRunManifest/);
    assert.match(operatorSource, /archiveOperationalRunReport/);
    assert.doesNotMatch(operatorSource, /resolveOperatorTerminalOutcome/);
    assert.doesNotMatch(operatorSource, /terminalOutcome/);
    assert.doesNotMatch(operatorSource, /buildBoundedCausalAttribution|diagnosticEvidenceRefs|EarlyDeathAnalyzer/);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runOrdinaryEvolutionOperatorTests()
    .then(() => console.log('ordinaryEvolutionOperator.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
