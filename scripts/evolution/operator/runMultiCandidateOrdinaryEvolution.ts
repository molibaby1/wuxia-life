import { randomInt } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { getP8GatePersonas } from '../../../src/p8/personas';
import { runPhase0 } from '../phase0/runPhase0';
import { captureWorktreeSourceFingerprint } from '../phase0/provenance';
import {
  readDurableMultiCandidateSessionManifest,
  type CandidateSessionLocation,
} from '../candidateSessionStore';
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
}

export interface MultiCandidateOrdinaryEvolutionResult extends MultiCandidateSessionSliceResult {
  participantBinding: OperatorParticipantBindingId;
  repositoryBaseline: OperatorGitPreflight;
}

function nextHostSliceId(hostSliceCount: number): string {
  if (!Number.isInteger(hostSliceCount) || hostSliceCount < 0) throw new Error('durable Host slice count is invalid');
  return `host-slice-${String(hostSliceCount + 1).padStart(6, '0')}`;
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
  return { ...result, participantBinding: binding.bindingId, repositoryBaseline: git };
}
