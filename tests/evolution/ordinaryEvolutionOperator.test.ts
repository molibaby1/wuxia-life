import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  formatOrdinaryEvolutionOperatorSummary,
  runOrdinaryEvolution,
  type OperatorAeWorkflowResult,
  type OrdinaryEvolutionOperatorResult,
} from '../../scripts/evolution/operator/runOrdinaryEvolution';
import {
  OPERATOR_BINDING_CODEX_CURRENT,
  parseOperatorParticipantBindingId,
  ParticipantBindingUnavailableError,
  type ResolvedOperatorParticipantBinding,
} from '../../scripts/evolution/operator/resolveParticipantBinding';
import { allocateOrdinarySessionId, formatOrdinarySessionId } from '../../scripts/evolution/operator/allocateSessionId';

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

function aeResult(overrides: Partial<OperatorAeWorkflowResult> = {}): OperatorAeWorkflowResult {
  return {
    multiRound: {
      status: 'stopped',
      outcome: 'NO_CROSS_ROUND_TRANSITION_OBSERVED',
      stopReason: 'ROUND_1_TERMINAL_NOT_READY',
      manifestPath: '/tmp/manifest.json',
      rounds: [],
      execution: null,
      actualParticipantJobs: 4,
      crossRoundTransitions: 0,
    },
    terminalOutcome: 'DEFER_MORE_WORK_REQUESTED',
    decisionRoute: 'DEFER_MORE_WORK_REQUESTED',
    decisionReasonCode: 'REVIEW_REQUEST_MORE_WORK',
    crossRoundObserved: false,
    authoritativeRepoModificationObserved: false,
    experimentRoot: '/tmp/experiment',
    ...overrides,
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

  for (const terminalOutcome of [
    'DEFER_MORE_WORK_REQUESTED',
    'ESCALATE_HUMAN',
    'READY_FOR_CONFIG_EXECUTION',
    'NO_PROBLEM_FORMED',
  ] as const) {
    const repositoryRoot = await createRepo();
    let workflowCalls = 0;
    let archiveCalls = 0;
    let inboxCalls = 0;
    let indexCalls = 0;
    const sequence: string[] = [];

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
            terminalOutcome,
            decisionRoute: terminalOutcome,
            decisionReasonCode: terminalOutcome === 'ESCALATE_HUMAN' ? 'EXPLICIT_ESCALATION' : 'REVIEW_REQUEST_MORE_WORK',
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
            activeCount: terminalOutcome === 'ESCALATE_HUMAN' ? 1 : 0,
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
    assert.equal(result.terminalOutcome, terminalOutcome);
    assert.equal(result.participantBinding, OPERATOR_BINDING_CODEX_CURRENT);
    assert.equal(result.sessionId, 'ordinary-run-20260903-000042');
    assert.equal(result.headSha, 'c'.repeat(40));
    assert.equal(result.observabilityStatus, 'PASS');
    assert.equal(result.crossRoundObserved, false);
    assert.equal(result.authoritativeRepoModificationObserved, false);
    assert.equal(result.runReportId, 'ae-report-deadbeefdeadbeef');
    assert.equal(result.operationalIndexPath, 'artifacts/evolution/index.md');

    const summary = formatOrdinaryEvolutionOperatorSummary(result);
    assert.match(summary, /session:\nordinary-run-20260903-000042/);
    assert.match(summary, new RegExp(`participant:\\n${OPERATOR_BINDING_CODEX_CURRENT}`));
    assert.match(summary, new RegExp(`outcome:\\n${terminalOutcome}`));
    assert.match(summary, /observability:\nPASS/);
  }

  {
    const repositoryRoot = await createRepo();
    let workflowCalls = 0;
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
            terminalOutcome: 'DEFER_MORE_WORK_REQUESTED',
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
    assert.equal(result.terminalOutcome, 'DEFER_MORE_WORK_REQUESTED');
    assert.equal(result.observabilityStatus, 'OBSERVABILITY_REFRESH_FAILED');
    assert.match(result.observabilityError ?? '', /archive exploded/);
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

  {
    // Architecture: operator module imports official producers by path, not reimplemented.
    const operatorSource = await readFile(
      new URL('../../scripts/evolution/operator/runOrdinaryEvolution.ts', import.meta.url),
      'utf8',
    );
    assert.match(operatorSource, /runMultiRoundExecutionValidation/);
    assert.match(operatorSource, /archiveOperationalRunReport/);
    assert.match(operatorSource, /buildHumanFollowupInbox/);
    assert.match(operatorSource, /buildOperationalObservabilityIndex/);
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
