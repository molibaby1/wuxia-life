import { execFile } from 'node:child_process';
import { randomInt } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import type { P8Persona } from '../../../src/p8/types';
import { getP8GatePersonas } from '../../../src/p8/personas';
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
  type MultiRoundSessionSummary,
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
  sessionExecution: MultiRoundSessionSummary;
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
    seed: number;
    persona: P8Persona;
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
  schemaVersion: 'ordinary-evolution-operator-result-v3';
  sessionId: string;
  branch: string;
  headSha: string;
  workingTreeClean: boolean;
  participantBinding: OperatorParticipantBindingId;
  sessionExecution: MultiRoundSessionSummary;
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
  // Dirty tree is not gated here: DEV_CONVENIENCE_ONLY (fingerprint + workingTreeClean disclosure).
  // Not a Product Decision. Formal observe / citable AE batches should still use a clean tree.
}

async function defaultRunPhase0Source(input: {
  repositoryRoot: string;
  sessionId: string;
  sessionRoot: string;
  seed: number;
  persona: P8Persona;
}): Promise<{ sourceRoot: string; sourceRunRef: string }> {
  const phase0 = await runPhase0({
    runRef: input.sessionId,
    outRoot: join(input.sessionRoot, 'game-runs'),
    anchorRoot: join(input.sessionRoot, 'phase0-anchors'),
    persona: input.persona,
    seed: input.seed,
    endAge: 80,
    catalogVersion: '1.0.0',
    maxSteps: 2400,
    sourceFingerprint: await captureWorktreeSourceFingerprint(input.repositoryRoot),
  });
  return { sourceRoot: phase0.outDir, sourceRunRef: input.sessionId };
}

export function selectP8PersonaForSeed(seed: number): P8Persona {
  if (!Number.isSafeInteger(seed) || seed < 0) {
    throw new Error(`ordinary-run seed must be a non-negative safe integer: ${seed}`);
  }
  const roster = getP8GatePersonas();
  if (roster.length === 0) throw new Error('ordinary-run P8 persona roster is empty');
  return roster[seed % roster.length]!;
}

function createOrdinaryRunSeed(): number {
  return randomInt(0, 2 ** 32);
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
    'Git 基线：',
    `${result.branch}@${result.headSha}`,
    '',
    '工作树：',
    result.workingTreeClean
      ? 'clean'
      : 'dirty（DEV_CONVENIENCE_ONLY：本次 AE 使用当前 workspace，含未提交修改；正式观察仍应用 clean tree）',
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
    '下一步：',
    result.runReportPath === null
      ? 'Human review view 不可用；请先查看下方的可观测性错误。'
      : '查看本次报告顶部的「一眼结论」和「下一步」动作块。',
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
  if (session.schemaVersion === 'multi-round-session-summary-v2') {
    const lastRound = session.rounds.at(-1);
    if (lastRound !== undefined) {
      lines.push(
        '',
        `base route: ${lastRound.baseTerminalRoute ?? '（无）'}`,
        `review continuation: ${lastRound.continuationRef ?? '（无）'}`,
        `effective route: ${lastRound.effectiveTerminalRoute ?? '（无）'}`,
      );
    }
  }
  if (result.observabilityError) {
    lines.push('', '可观测性错误：', result.observabilityError);
    lines.push('下一步：工程调查者修复失败的旁路步骤；在原 session 上使用 evolution:observability:archive -- --root <原 session root>、evolution:human-followup:inbox 或 evolution:observability:index 重建对应产物。', '恢复条件：旁路生成成功；保留原 session outcome，不重跑游戏或 AE。');
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

  const seed = createOrdinaryRunSeed();
  const persona = selectP8PersonaForSeed(seed);

  const phase0 = await (dependencies.runPhase0Source ?? defaultRunPhase0Source)({
    repositoryRoot,
    sessionId,
    sessionRoot,
    seed,
    persona,
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
    schemaVersion: 'ordinary-evolution-operator-result-v3',
    sessionId,
    branch: git.branch,
    headSha: git.headSha,
    workingTreeClean: git.clean,
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

export function formatOperatorFailureGuidance(error: unknown): string {
  const diagnosis = error instanceof OperatorPreflightError
    ? '检查当前分支和 git status，保护未提交改动；不要自动 stash/reset。'
    : error instanceof ParticipantBindingUnavailableError
    ? '检查指定 Participant binding 的可用性；不要自动切换 provider。'
    : '保留原始异常，检查最后生成的 session/staging、invocation 或 seal 文件；缺失终态不得补造。';
  return [
    '下一步：交给工程调查者做只读诊断。',
    diagnosis,
    '入口：本次 CLI 错误和已生成的运行目录；未生成报告时不依赖报告才能调查。',
    '恢复条件：具体原因已解决、必要验证已通过，并明确后续运行授权与预算；不自动重跑。',
  ].join('\n');
}

async function main(argv: string[]): Promise<void> {
  try {
    const result = await runOrdinaryEvolution(parseCliArgs(argv));
    process.stdout.write(formatOrdinaryEvolutionOperatorSummary(result));
    if (result.observabilityStatus !== 'PASS') process.exitCode = 2;
  } catch (error) {
    if (error instanceof OperatorPreflightError || error instanceof ParticipantBindingUnavailableError) {
      console.error(error.message);
      console.error(formatOperatorFailureGuidance(error));
      process.exitCode = 1;
      return;
    }
    console.error(error);
    console.error(formatOperatorFailureGuidance(error));
    process.exitCode = 1;
  }
}

const executedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (import.meta.url === executedPath) {
  void main(process.argv.slice(2));
}

export { OPERATOR_BINDING_CODEX_CURRENT };
