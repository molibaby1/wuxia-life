import { execFile } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { getP8PersonaById } from '../../../src/p8/personas';
import { runPhase0 } from '../phase0/runPhase0';
import { captureWorktreeSourceFingerprint } from '../phase0/provenance';
import { captureAuthoritativeFingerprint } from '../problemAgnosticSolution/agentWorkspace';
import {
  runMultiRoundExecutionValidation,
  type MultiRoundExecutionValidationResult,
} from '../multiRoundExecutionValidation';
import {
  buildMultiRoundSessionSummary,
  readMultiRoundRunManifest,
  type MultiRoundSessionSummaryV1,
} from '../multiRoundRunManifestContract';
import { archiveOperationalRunReport } from '../reporting/archiveOperationalRunReport';
import { buildHumanFollowupInbox } from '../humanFollowup/buildHumanFollowupInbox';
import { buildOperationalObservabilityIndex } from '../reporting/buildOperationalObservabilityIndex';
import { allocateOrdinarySessionId } from './allocateSessionId';
import {
  OPERATOR_BINDING_CODEX_CURRENT,
  parseOperatorParticipantBindingId,
  resolveOperatorParticipantBinding,
  type OperatorParticipantBindingId,
  type ResolvedOperatorParticipantBinding,
  ParticipantBindingUnavailableError,
} from './resolveParticipantBinding';

const execFileAsync = promisify(execFile);

export class OperatorPreflightError extends Error {
  readonly code = 'OPERATOR_PREFLIGHT_FAILED' as const;

  constructor(message: string) {
    super(message);
    this.name = 'OperatorPreflightError';
  }
}

export interface OperatorGitPreflight {
  branch: string;
  headSha: string;
  statusShort: string;
  clean: boolean;
}

export interface OperatorAeWorkflowResult {
  multiRound: MultiRoundExecutionValidationResult;
  sessionExecution: MultiRoundSessionSummaryV1;
  authoritativeRootChanged: boolean;
  experimentRoot: string;
}

export interface RunOrdinaryEvolutionDependencies {
  preflightGit?: (repositoryRoot: string) => Promise<OperatorGitPreflight>;
  resolveBinding?: (bindingId: OperatorParticipantBindingId) => Promise<ResolvedOperatorParticipantBinding>;
  allocateSessionId?: (input: { repositoryRoot: string }) => Promise<string>;
  runPhase0Source?: (input: {
    repositoryRoot: string;
    sessionId: string;
    sessionRoot: string;
  }) => Promise<{ sourceRoot: string; sourceRunRef: string }>;
  runAeWorkflow?: (input: {
    repositoryRoot: string;
    sessionId: string;
    sessionRoot: string;
    sourceRoot: string;
    binding: ResolvedOperatorParticipantBinding;
  }) => Promise<OperatorAeWorkflowResult>;
  archiveReport?: (input: { repositoryRoot: string; root: string }) => Promise<{
    reportId: string;
    reportDirectory: string;
  }>;
  refreshHumanFollowupInbox?: (input: { repositoryRoot: string }) => Promise<{
    inboxPath: string;
    activeCount: number;
  }>;
  refreshOperationalIndex?: (input: { repositoryRoot: string }) => Promise<{
    topLevelIndexPath: string;
  }>;
}

export interface RunOrdinaryEvolutionInput {
  repositoryRoot?: string;
  bindingId?: string;
  dependencies?: RunOrdinaryEvolutionDependencies;
}

export type ObservabilityStatus = 'PASS' | 'OBSERVABILITY_REFRESH_FAILED';

export interface OrdinaryEvolutionOperatorResult {
  schemaVersion: 'ordinary-evolution-operator-result-v2';
  sessionId: string;
  branch: string;
  headSha: string;
  participantBinding: OperatorParticipantBindingId;
  sessionExecution: MultiRoundSessionSummaryV1;
  authoritativeRootChanged: boolean;
  runReportId: string | null;
  runReportPath: string | null;
  humanFollowupActiveCount: number | null;
  operationalIndexPath: string | null;
  observabilityStatus: ObservabilityStatus;
  observabilityError: string | null;
  sessionRoot: string;
  experimentRoot: string | null;
}

function toRepoRelative(repositoryRoot: string, absolutePath: string): string {
  return relative(repositoryRoot, absolutePath).split(sep).join('/');
}

export async function captureOperatorGitPreflight(repositoryRoot: string): Promise<OperatorGitPreflight> {
  const root = resolve(repositoryRoot);
  const [branchResult, headResult, statusResult] = await Promise.all([
    execFileAsync('git', ['branch', '--show-current'], { cwd: root }),
    execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: root }),
    execFileAsync('git', ['status', '--short'], { cwd: root }),
  ]);
  const branch = branchResult.stdout.trim();
  const headSha = headResult.stdout.trim();
  const statusShort = statusResult.stdout.trimEnd();
  return {
    branch,
    headSha,
    statusShort,
    clean: statusShort.length === 0,
  };
}

function assertOperatorPreflight(preflight: OperatorGitPreflight): void {
  if (preflight.branch !== 'dev') {
    throw new OperatorPreflightError(
      `OPERATOR_PREFLIGHT_FAILED: branch must be dev (got ${JSON.stringify(preflight.branch || '(detached)')})`,
    );
  }
  if (!preflight.clean) {
    throw new OperatorPreflightError(
      `OPERATOR_PREFLIGHT_FAILED: working tree must be clean before operator run:\n${preflight.statusShort}`,
    );
  }
}

async function defaultRunPhase0Source(input: {
  repositoryRoot: string;
  sessionId: string;
  sessionRoot: string;
}): Promise<{ sourceRoot: string; sourceRunRef: string }> {
  const persona = getP8PersonaById('p8-martial-lin');
  if (!persona) throw new Error('fixed ordinary-run persona p8-martial-lin is unavailable');
  const phase0 = await runPhase0({
    runRef: input.sessionId,
    outRoot: join(input.sessionRoot, 'game-runs'),
    anchorRoot: join(input.sessionRoot, 'phase0-anchors'),
    persona,
    seed: Date.now(),
    endAge: 80,
    catalogVersion: '1.0.0',
    maxSteps: 2400,
    sourceFingerprint: await captureWorktreeSourceFingerprint(input.repositoryRoot),
  });
  return { sourceRoot: phase0.outDir, sourceRunRef: input.sessionId };
}

export function resolveAuthoritativeRootChanged(input: {
  fingerprintBefore: string;
  fingerprintAfter: string;
}): boolean {
  return input.fingerprintBefore !== input.fingerprintAfter;
}

async function defaultRunAeWorkflow(input: {
  repositoryRoot: string;
  sessionId: string;
  sessionRoot: string;
  sourceRoot: string;
  binding: ResolvedOperatorParticipantBinding;
}): Promise<OperatorAeWorkflowResult> {
  const experimentRoot = join(input.sessionRoot, 'problem-agnostic-agent-solution-loop-instance-000001');
  const fingerprintBefore = await captureAuthoritativeFingerprint(input.repositoryRoot);
  const multiRound = await runMultiRoundExecutionValidation({
    multiRoundRunRef: input.sessionId,
    authoritativeRoot: input.repositoryRoot,
    initialSourceRoot: input.sourceRoot,
    experimentRoot,
    participant: input.binding.participant,
    participantMode: input.binding.participantMode,
  });
  const fingerprintAfter = await captureAuthoritativeFingerprint(input.repositoryRoot);
  const manifest = await readMultiRoundRunManifest(multiRound.manifestPath);
  return {
    multiRound,
    sessionExecution: buildMultiRoundSessionSummary(manifest),
    authoritativeRootChanged: resolveAuthoritativeRootChanged({
      fingerprintBefore,
      fingerprintAfter,
    }),
    experimentRoot,
  };
}

async function countActiveHumanFollowupItems(repositoryRoot: string): Promise<number> {
  const inboxPath = join(repositoryRoot, 'artifacts/evolution/human-follow-up/index.md');
  try {
    const markdown = await readFile(inboxPath, 'utf8');
    const match = /- active: (\d+)/.exec(markdown);
    return match ? Number(match[1]) : 0;
  } catch {
    return 0;
  }
}

async function defaultRefreshHumanFollowupInbox(input: {
  repositoryRoot: string;
}): Promise<{ inboxPath: string; activeCount: number }> {
  const inboxPath = await buildHumanFollowupInbox({ repositoryRoot: input.repositoryRoot });
  return {
    inboxPath,
    activeCount: await countActiveHumanFollowupItems(input.repositoryRoot),
  };
}

export function formatOrdinaryEvolutionOperatorSummary(
  result: OrdinaryEvolutionOperatorResult,
): string {
  const session = result.sessionExecution;
  const lines = [
    'AE 运行',
    '',
    '会话：',
    result.sessionId,
    '',
    '源版本：',
    `${result.branch}@${result.headSha}`,
    '',
    'Participant：',
    result.participantBinding,
    '',
    'Host 停止原因：',
    session.stopReason,
    '',
    '多轮执行结果：',
    session.outcome,
    '',
    '最后一轮路由：',
    session.lastRoundTerminalRoute ?? '（无）',
    '',
    '执行状态：',
    session.execution.status,
    '',
    '跨轮：',
    session.crossRoundTransitions > 0 ? '是' : '否',
    '',
    '权威仓库根完整性：',
    result.authoritativeRootChanged ? '已变更' : '未变更',
    '',
    '报告：',
    result.runReportPath ?? '（不可用）',
    '',
    'Human Follow-up：',
    result.humanFollowupActiveCount === null
      ? '（不可用）'
      : `${result.humanFollowupActiveCount} 项 active`,
    '',
    '索引：',
    result.operationalIndexPath ?? '（不可用）',
    '',
    '可观测性：',
    result.observabilityStatus,
  ];
  if (result.observabilityError) {
    lines.push('', '可观测性错误：', result.observabilityError);
  }
  return `${lines.join('\n')}\n`;
}

export async function runOrdinaryEvolution(
  input: RunOrdinaryEvolutionInput = {},
): Promise<OrdinaryEvolutionOperatorResult> {
  const repositoryRoot = resolve(input.repositoryRoot ?? process.cwd());
  const dependencies = input.dependencies ?? {};

  const git = await (dependencies.preflightGit ?? captureOperatorGitPreflight)(repositoryRoot);
  assertOperatorPreflight(git);

  const bindingId = parseOperatorParticipantBindingId(input.bindingId);
  const binding = await (dependencies.resolveBinding ?? resolveOperatorParticipantBinding)(bindingId);

  const sessionId = await (dependencies.allocateSessionId ?? allocateOrdinarySessionId)({
    repositoryRoot,
  });
  const sessionRoot = join(repositoryRoot, '.tmp/evolution', sessionId);
  await mkdir(sessionRoot, { recursive: true });

  const phase0 = await (dependencies.runPhase0Source ?? defaultRunPhase0Source)({
    repositoryRoot,
    sessionId,
    sessionRoot,
  });

  const ae = await (dependencies.runAeWorkflow ?? defaultRunAeWorkflow)({
    repositoryRoot,
    sessionId,
    sessionRoot,
    sourceRoot: phase0.sourceRoot,
    binding,
  });

  let observabilityStatus: ObservabilityStatus = 'PASS';
  let observabilityError: string | null = null;
  let runReportId: string | null = null;
  let runReportPath: string | null = null;
  let humanFollowupActiveCount: number | null = null;
  let operationalIndexPath: string | null = null;

  try {
    const archived = await (dependencies.archiveReport ?? (async ({ repositoryRoot: root, root: archiveRoot }) => {
      const result = await archiveOperationalRunReport({ repositoryRoot: root, root: archiveRoot });
      return {
        reportId: result.reportId,
        reportDirectory: result.reportDirectory,
      };
    }))({
      repositoryRoot,
      root: toRepoRelative(repositoryRoot, sessionRoot),
    });
    runReportId = archived.reportId;
    runReportPath = toRepoRelative(repositoryRoot, archived.reportDirectory);

    const inbox = await (dependencies.refreshHumanFollowupInbox ?? defaultRefreshHumanFollowupInbox)({
      repositoryRoot,
    });
    humanFollowupActiveCount = inbox.activeCount;

    const indexes = await (dependencies.refreshOperationalIndex ?? (async ({ repositoryRoot: root }) => {
      const result = await buildOperationalObservabilityIndex({ repositoryRoot: root });
      return { topLevelIndexPath: result.topLevelIndexPath };
    }))({ repositoryRoot });
    operationalIndexPath = toRepoRelative(repositoryRoot, indexes.topLevelIndexPath);
  } catch (error) {
    observabilityStatus = 'OBSERVABILITY_REFRESH_FAILED';
    observabilityError = error instanceof Error ? error.message : String(error);
  }

  const result: OrdinaryEvolutionOperatorResult = {
    schemaVersion: 'ordinary-evolution-operator-result-v2',
    sessionId,
    branch: git.branch,
    headSha: git.headSha,
    participantBinding: binding.bindingId,
    sessionExecution: ae.sessionExecution,
    authoritativeRootChanged: ae.authoritativeRootChanged,
    runReportId,
    runReportPath,
    humanFollowupActiveCount,
    operationalIndexPath,
    observabilityStatus,
    observabilityError,
    sessionRoot: toRepoRelative(repositoryRoot, sessionRoot),
    experimentRoot: toRepoRelative(repositoryRoot, ae.experimentRoot),
  };

  await writeFile(
    join(sessionRoot, 'operator-result.json'),
    `${JSON.stringify(result, null, 2)}\n`,
  );
  await writeFile(
    join(sessionRoot, 'operator-summary.txt'),
    formatOrdinaryEvolutionOperatorSummary(result),
  );

  return result;
}

function parseCliArgs(args: string[]): RunOrdinaryEvolutionInput {
  let repositoryRoot: string | undefined;
  let bindingId: string | undefined;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--repository-root') {
      const value = args[++index];
      if (!value) throw new Error('--repository-root requires a value');
      repositoryRoot = value;
    } else if (arg === '--binding') {
      const value = args[++index];
      if (!value) throw new Error('--binding requires a value');
      bindingId = value;
    } else {
      throw new Error(`unknown argument: ${arg}`);
    }
  }
  return {
    ...(repositoryRoot === undefined ? {} : { repositoryRoot }),
    ...(bindingId === undefined ? {} : { bindingId }),
  };
}

async function main(argv: string[]): Promise<void> {
  try {
    const result = await runOrdinaryEvolution(parseCliArgs(argv));
    process.stdout.write(formatOrdinaryEvolutionOperatorSummary(result));
    if (result.observabilityStatus !== 'PASS') process.exitCode = 2;
  } catch (error) {
    if (error instanceof OperatorPreflightError || error instanceof ParticipantBindingUnavailableError) {
      console.error(error.message);
      process.exitCode = 1;
      return;
    }
    console.error(error);
    process.exitCode = 1;
  }
}

const executedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (import.meta.url === executedPath) {
  void main(process.argv.slice(2));
}

export { OPERATOR_BINDING_CODEX_CURRENT };
