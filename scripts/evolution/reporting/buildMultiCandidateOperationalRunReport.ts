import { readFile } from 'node:fs/promises';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';
import { canonicalJson, sha256Hex } from '../phase0/provenance';
import { parseCandidatePoolV1, type CandidatePoolV1 } from '../candidatePoolContract';
import { buildMultiCandidateSessionSummaryV1, type MultiCandidateSessionManifestV1 } from '../multiCandidateSessionManifestContract';
import { readDurableMultiCandidateSessionManifest, resolveCandidateSessionLocation } from '../candidateSessionStore';
import { validateSolutionDecision } from '../../../src/evolution/solutionDecisionContract';
import {
  OPERATIONAL_RUN_REPORT_SCHEMA_VERSION_V7,
  type CandidateDispositionSummaryV1,
  type OperationalRunReportV7,
} from './buildOperationalObservabilityIndex';

export interface BuildMultiCandidateOperationalRunReportInput {
  repositoryRoot: string;
  logicalSessionId: string;
  hostSliceId: string;
  createdAt?: string;
  terminalForensicEvidenceRef?: string | null;
}
function safeSessionRelativePath(sessionRoot: string, value: string): string {
  if (isAbsolute(value) || value.includes('\\')) throw new Error(`durable candidate reference must be relative: ${value}`);
  const candidate = resolve(sessionRoot, value);
  const child = relative(resolve(sessionRoot), candidate);
  if (!child || child === '..' || child.startsWith(`..${sep}`) || isAbsolute(child)) throw new Error(`durable candidate reference escapes session: ${value}`);
  return candidate;
}

async function readPool(sessionRoot: string, poolRef: string): Promise<CandidatePoolV1> {
  return parseCandidatePoolV1(JSON.parse(await readFile(safeSessionRelativePath(sessionRoot, poolRef), 'utf8')) as unknown);
}

async function decisionForCandidate(sessionRoot: string, candidate: CandidatePoolV1['candidates'][number]): Promise<{ route: string | null; reasonCode: string | null }> {
  if (candidate.effectiveDecisionRef === null) return { route: null, reasonCode: null };
  const decision = validateSolutionDecision(JSON.parse(await readFile(safeSessionRelativePath(sessionRoot, candidate.effectiveDecisionRef), 'utf8')) as unknown);
  return { route: decision.route, reasonCode: decision.reasonCode };
}

async function candidateDisposition(sessionRoot: string, candidate: CandidatePoolV1['candidates'][number]): Promise<CandidateDispositionSummaryV1> {
  const decision = await decisionForCandidate(sessionRoot, candidate);
  return {
    candidateRef: candidate.candidateRef,
    hypothesisId: candidate.hypothesisId,
    sourceIndex: candidate.sourceIndex,
    processingState: candidate.processingState,
    effectiveRoute: decision.route,
    effectiveReasonCode: decision.reasonCode,
    effectiveDecisionRef: candidate.effectiveDecisionRef,
    humanFollowupRef: candidate.humanFollowupRef,
    supersededBySourceEpochRef: candidate.supersededBySourceEpochRef,
    interruptionRef: candidate.interruptionRef,
  };
}

function reportIdentity(input: {
  logicalSessionId: string;
  hostSliceId: string;
  session: MultiCandidateSessionManifestV1;
  candidates: CandidateDispositionSummaryV1[];
}): string {
  return `candidate-session-report-${sha256Hex(canonicalJson({
    logicalSessionId: input.logicalSessionId,
    hostSliceId: input.hostSliceId,
    session: input.session,
    candidates: input.candidates,
  }))}`;
}

export async function buildMultiCandidateOperationalRunReport(
  input: BuildMultiCandidateOperationalRunReportInput,
): Promise<OperationalRunReportV7> {
  const manifest = await readDurableMultiCandidateSessionManifest(input.repositoryRoot, input.logicalSessionId);
  const slice = manifest.hostSlices.find(candidate => candidate.hostSliceId === input.hostSliceId);
  if (!slice) throw new Error(`Host slice is not present in durable session: ${input.hostSliceId}`);
  const location = resolveCandidateSessionLocation(input.repositoryRoot, input.logicalSessionId);
  const pools = await Promise.all(manifest.sourceEpochs
    .filter(epoch => epoch.poolRef !== null)
    .map(epoch => readPool(location.sessionRoot, epoch.poolRef!)));
  const candidates: CandidateDispositionSummaryV1[] = [];
  for (const pool of pools) {
    for (const candidate of pool.candidates) candidates.push(await candidateDisposition(location.sessionRoot, candidate));
  }
  candidates.sort((left, right) => left.sourceIndex - right.sourceIndex || left.candidateRef.localeCompare(right.candidateRef));
  const sessionExecution = buildMultiCandidateSessionSummaryV1(manifest);
  const reportId = reportIdentity({ logicalSessionId: input.logicalSessionId, hostSliceId: input.hostSliceId, session: manifest, candidates });
  return {
    schemaVersion: OPERATIONAL_RUN_REPORT_SCHEMA_VERSION_V7,
    reportId,
    createdAt: input.createdAt ?? new Date().toISOString(),
    logicalSessionId: input.logicalSessionId,
    hostSliceId: input.hostSliceId,
    sessionStateAtSnapshot: manifest.sessionState,
    sessionExecution,
    candidates,
    recoverableSessionStateRef: relative(resolve(input.repositoryRoot), location.manifestPath).split(sep).join('/'),
    terminalForensicEvidenceRef: input.terminalForensicEvidenceRef ?? null,
  };
}
