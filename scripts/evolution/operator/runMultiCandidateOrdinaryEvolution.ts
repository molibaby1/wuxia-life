import { randomInt } from 'node:crypto';
import { mkdir, readFile } from 'node:fs/promises';
import { join, relative, resolve, sep } from 'node:path';
import { getP8GatePersonas } from '../../../src/p8/personas';
import { runPhase0 } from '../phase0/runPhase0';
import { captureWorktreeSourceFingerprint } from '../phase0/provenance';
import {
  readDurableMultiCandidateSessionManifest,
  type CandidateSessionLocation,
} from '../candidateSessionStore';
import { buildMultiCandidateSessionSummaryV1, type MultiCandidateSessionManifestV1, type MultiCandidateSessionSummaryV1 } from '../multiCandidateSessionManifestContract';
import {
  runMultiCandidateSessionSlice,
  type MultiCandidateSessionSliceResult,
  type RunMultiCandidateSessionSliceInput,
} from '../runMultiCandidateSessionSlice';
import type { WorkspaceAgentParticipantOptions } from '../problemAgnosticSolution/agentParticipant';
import {
  assertOperatorPreflight,
  captureOperatorGitPreflight,
  type OperatorGitPreflight,
} from './runOrdinaryEvolution';
import { allocateOrdinarySessionId } from './allocateSessionId';
import {
  retainMultiCandidateSessionEvidence,
  type RetainMultiCandidateSessionEvidenceResult,
} from '../evidence/retainMultiCandidateSessionEvidence';
import { archiveMultiCandidateSessionReport, type ArchiveMultiCandidateSessionReportResult } from '../reporting/archiveMultiCandidateSessionReport';
import { buildHumanFollowupInbox } from '../humanFollowup/buildHumanFollowupInbox';
import { buildOperationalObservabilityIndex } from '../reporting/buildOperationalObservabilityIndex';
import {
  parseOperatorParticipantBindingId,
  resolveOperatorParticipantBinding,
  type OperatorParticipantBindingId,
  type ResolvedOperatorParticipantBinding,
} from './resolveParticipantBinding';

export type MultiCandidateOperatorMode =
  | { mode: 'START_NEW_SESSION' }
  | { mode: 'RESUME_SESSION'; logicalSessionId: string };

export interface RunMultiCandidateOrdinaryEvolutionInput {
  repositoryRoot?: string;
  bindingId?: string;
  operation: MultiCandidateOperatorMode;
  dependencies?: MultiCandidateOrdinaryEvolutionDependencies;
}

export interface MultiCandidateOrdinaryEvolutionDependencies {
  preflightGit?: (repositoryRoot: string) => Promise<OperatorGitPreflight>;
  resolveBinding?: (bindingId: OperatorParticipantBindingId) => Promise<ResolvedOperatorParticipantBinding>;
  allocateSessionId?: (input: { repositoryRoot: string }) => Promise<string>;
  runPhase0Source?: (input: { repositoryRoot: string; sessionId: string; sessionRoot: string }) => Promise<{ sourceRoot: string; sourceRunRef: string }>;
  runSessionSlice?: (input: RunMultiCandidateSessionSliceInput) => Promise<MultiCandidateSessionSliceResult>;
  readManifest?: typeof readDurableMultiCandidateSessionManifest;
  retainTerminalEvidence?: (input: { repositoryRoot: string; logicalSessionId: string; createdAt: string }) => Promise<RetainMultiCandidateSessionEvidenceResult>;
  archiveReport?: (input: { repositoryRoot: string; logicalSessionId: string; hostSliceId: string; terminalForensicEvidenceRef?: string | null }) => Promise<ArchiveMultiCandidateSessionReportResult>;
  refreshHumanFollowupInbox?: (input: { repositoryRoot: string }) => Promise<{ inboxPath: string; activeCount: number }>;
  refreshOperationalIndex?: typeof buildOperationalObservabilityIndex;
}

export interface MultiCandidateOrdinaryEvolutionResult extends MultiCandidateSessionSliceResult {
  participantBinding: OperatorParticipantBindingId;
  repositoryBaseline: OperatorGitPreflight;
  sessionExecution: MultiCandidateSessionSummaryV1;
  reportId: string;
  reportSnapshotRef: string;
  reportSnapshotPath: string;
  recoverableSessionStateRef: string;
  terminalForensicEvidenceRef: string | null;
  terminalForensicEvidenceStatus: 'PUBLISHED' | 'NOT_APPLICABLE';
  humanFollowupInboxPath: string;
  humanFollowupActiveCount: number;
  operationalIndexPath: string;
}

function nextHostSliceId(hostSliceCount: number): string {
  if (!Number.isInteger(hostSliceCount) || hostSliceCount < 0) throw new Error('durable Host slice count is invalid');
  return `host-slice-${String(hostSliceCount + 1).padStart(6, '0')}`;
}

function assertResumeEligible(manifest: MultiCandidateSessionManifestV1): void {
  if (manifest.sessionState === 'PAUSED') {
    if (manifest.pauseOrStopReason === 'SOURCE_CHANGE_LIMIT_REACHED') {
      throw new Error('Logical Session is not resumable without new source-change authority');
    }
    return;
  }
  const latest = manifest.hostSlices.at(-1);
  if (manifest.sessionState === 'PROCESSING' && latest?.state === 'PROCESSING' && latest.endedAt === null) return;
  throw new Error(`Logical Session is not resumable from state ${manifest.sessionState}`);
}

async function countActiveHumanFollowupItems(repositoryRoot: string): Promise<number> {
  try {
    const markdown = await readFile(join(repositoryRoot, 'artifacts/evolution/human-follow-up/index.md'), 'utf8');
    const match = /- active: (\d+)/.exec(markdown);
    return match ? Number(match[1]) : 0;
  } catch {
    return 0;
  }
}

async function defaultRunPhase0Source(input: {
  repositoryRoot: string;
  sessionId: string;
  sessionRoot: string;
}): Promise<{ sourceRoot: string; sourceRunRef: string }> {
  const roster = getP8GatePersonas();
  if (roster.length === 0) throw new Error('ordinary-run P8 persona roster is empty');
  const seed = randomInt(0, 2 ** 32);
  const persona = roster[seed % roster.length]!;
  const phase0 = await runPhase0({
    runRef: input.sessionId,
    outRoot: join(input.sessionRoot, 'game-runs'),
    anchorRoot: join(input.sessionRoot, 'phase0-anchors'),
    persona,
    seed,
    endAge: 80,
    catalogVersion: '1.0.0',
    maxSteps: 2400,
    sourceFingerprint: await captureWorktreeSourceFingerprint(input.repositoryRoot),
  });
  return { sourceRoot: phase0.outDir, sourceRunRef: phase0.runRef };
}

export async function runMultiCandidateOrdinaryEvolution(
  input: RunMultiCandidateOrdinaryEvolutionInput,
): Promise<MultiCandidateOrdinaryEvolutionResult> {
  const repositoryRoot = resolve(input.repositoryRoot ?? process.cwd());
  const dependencies = input.dependencies ?? {};
  const git = await (dependencies.preflightGit ?? captureOperatorGitPreflight)(repositoryRoot);
  assertOperatorPreflight(git);
  if (git.workingTreeFingerprint === undefined) throw new Error('operator preflight did not provide workingTreeFingerprint');

  const bindingId = parseOperatorParticipantBindingId(input.bindingId);
  const binding = await (dependencies.resolveBinding ?? resolveOperatorParticipantBinding)(bindingId);
  const readManifest = dependencies.readManifest ?? readDurableMultiCandidateSessionManifest;

  let logicalSessionId: string;
  let initialSourceRoot: string | undefined;
  let hostSliceId: string;
  if (input.operation.mode === 'START_NEW_SESSION') {
    logicalSessionId = await (dependencies.allocateSessionId ?? allocateOrdinarySessionId)({ repositoryRoot });
    const sessionRoot = join(repositoryRoot, '.tmp/evolution', logicalSessionId);
    await mkdir(sessionRoot, { recursive: true });
    const phase0 = await (dependencies.runPhase0Source ?? defaultRunPhase0Source)({ repositoryRoot, sessionId: logicalSessionId, sessionRoot });
    initialSourceRoot = phase0.sourceRoot;
    hostSliceId = nextHostSliceId(0);
  } else {
    logicalSessionId = input.operation.logicalSessionId;
    const manifest = await readManifest(repositoryRoot, logicalSessionId);
    if (manifest.repositoryBaseline.branch !== git.branch
      || manifest.repositoryBaseline.headSha !== git.headSha
      || manifest.repositoryBaseline.workingTreeFingerprint !== git.workingTreeFingerprint) {
      throw new Error('resume repository baseline mismatch');
    }
    if (manifest.participantBindingId !== binding.bindingId) throw new Error('resume participant binding mismatch');
    assertResumeEligible(manifest);
    hostSliceId = nextHostSliceId(manifest.hostSlices.length);
  }

  const runSessionSlice = dependencies.runSessionSlice ?? runMultiCandidateSessionSlice;
  const result = await runSessionSlice({
    mode: input.operation.mode,
    repositoryRoot,
    logicalSessionId,
    hostSliceId,
    participantBindingId: binding.bindingId,
    participant: binding.participant,
    repositoryBaseline: {
      branch: git.branch,
      headSha: git.headSha,
      workingTreeFingerprint: git.workingTreeFingerprint,
    },
    ...(initialSourceRoot === undefined ? {} : { initialSourceRoot }),
  });
  const createdAt = new Date().toISOString();
  const evidence = await (dependencies.retainTerminalEvidence ?? retainMultiCandidateSessionEvidence)({
    repositoryRoot,
    logicalSessionId,
    createdAt,
  });
  const terminalForensicEvidenceRef = evidence.capsuleRoot === null
    ? null
    : relative(repositoryRoot, evidence.capsuleRoot).split(sep).join('/');
  const report = await (dependencies.archiveReport ?? archiveMultiCandidateSessionReport)({
    repositoryRoot,
    logicalSessionId,
    hostSliceId: result.hostSliceId,
    terminalForensicEvidenceRef,
  });
  const inbox = await (dependencies.refreshHumanFollowupInbox ?? (async ({ repositoryRoot: root }: { repositoryRoot: string }) => ({
    inboxPath: await buildHumanFollowupInbox({ repositoryRoot: root }),
    activeCount: await countActiveHumanFollowupItems(root),
  })))(
    { repositoryRoot },
  );
  const index = await (dependencies.refreshOperationalIndex ?? buildOperationalObservabilityIndex)({ repositoryRoot });
  const sessionManifest = await readManifest(repositoryRoot, logicalSessionId);
  const sessionExecution = buildMultiCandidateSessionSummaryV1(sessionManifest);
  return {
    ...result,
    participantBinding: binding.bindingId,
    repositoryBaseline: git,
    sessionExecution,
    reportId: report.reportId,
    reportSnapshotRef: relative(repositoryRoot, report.reportJsonPath).split(sep).join('/'),
    reportSnapshotPath: report.reportJsonPath,
    recoverableSessionStateRef: relative(repositoryRoot, result.manifestPath).split(sep).join('/'),
    terminalForensicEvidenceRef,
    terminalForensicEvidenceStatus: evidence.status,
    humanFollowupInboxPath: inbox.inboxPath,
    humanFollowupActiveCount: inbox.activeCount,
    operationalIndexPath: index.topLevelIndexPath,
  };
}
