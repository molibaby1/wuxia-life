import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  formatOrdinaryEvolutionOperatorSummary,
  resolveAuthoritativeRootChanged,
  runOrdinaryEvolution,
  type OperatorAeWorkflowResult,
} from '../../scripts/evolution/operator/runOrdinaryEvolution';
import {
  OPERATOR_BINDING_CODEX_CURRENT,
  parseOperatorParticipantBindingId,
  ParticipantBindingUnavailableError,
  type ResolvedOperatorParticipantBinding,
} from '../../scripts/evolution/operator/resolveParticipantBinding';
import { allocateOrdinarySessionId, formatOrdinarySessionId } from '../../scripts/evolution/operator/allocateSessionId';
import {
  buildMultiRoundSessionSummary,
  parseMultiRoundRunManifest,
  type MultiRoundSessionSummaryV1,
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
  assert.equal(parseOperatorParticipantBindingId(undefined), OPERATOR_BINDING_CODEX_CURRENT);
  assert.equal(parseOperatorParticipantBindingId('CODEX_CURRENT'), OPERATOR_BINDING_CODEX_CURRENT);
  assert.throws(
    () => parseOperatorParticipantBindingId('PREVIOUS_RUN'),
    /PARTICIPANT_BINDING_UNAVAILABLE/,
  );

  {
    const repositoryRoot = await createRepo();
    let workflowCalls = 0;
    await assert.rejects(
      () => runOrdinaryEvolution({
        repositoryRoot,
        dependencies: {
          preflightGit: async () => ({
            branch: 'dev',
            headSha: 'a'.repeat(40),
            statusShort: ' M src/example.ts',
            clean: false,
          }),
          resolveBinding: async () => {
            throw new Error('binding must not resolve on dirty tree');
          },
          runAeWorkflow: async () => {
            workflowCalls += 1;
            return aeResult();
          },
        },
      }),
      /OPERATOR_PREFLIGHT_FAILED: working tree must be clean/,
    );
    assert.equal(workflowCalls, 0);
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
    assert.equal(result.schemaVersion, 'ordinary-evolution-operator-result-v2');
    assert.deepEqual(result.sessionExecution, summary);
    assert.equal(result.participantBinding, OPERATOR_BINDING_CODEX_CURRENT);
    assert.equal(result.sessionId, 'ordinary-run-20260903-000042');
    assert.equal(result.headSha, 'c'.repeat(40));
    assert.equal(result.observabilityStatus, 'PASS');
    assert.equal(result.authoritativeRootChanged, false);
    assert.equal(result.runReportId, 'ae-report-deadbeefdeadbeef');
    assert.equal(result.operationalIndexPath, 'artifacts/evolution/index.md');

    const text = formatOrdinaryEvolutionOperatorSummary(result);
    assert.match(text, /session:\nordinary-run-20260903-000042/);
    assert.match(text, new RegExp(`host stop reason:\\n${caseInput.stopReason}`));
    assert.match(text, new RegExp(`multi-round outcome:\\n${caseInput.outcome}`));
    assert.match(text, new RegExp(`last round route:\\n${caseInput.lastRoundTerminalRoute}`));
    assert.match(text, new RegExp(`execution status:\\n${caseInput.executionStatus}`));
    assert.match(text, /authoritative root integrity:\nUNCHANGED/);
    assert.match(text, /observability:\nPASS/);
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
      /host stop reason:\nROUND_1_TERMINAL_NOT_READY/,
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
