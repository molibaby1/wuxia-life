import { readFile } from 'node:fs/promises';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import { canonicalJson, sha256Hex } from '../phase0/provenance';
import { parseCandidatePoolV1, type CandidatePoolV1 } from '../candidatePoolContract';
import { buildMultiCandidateSessionSummaryV1, type MultiCandidateSessionManifestV1 } from '../multiCandidateSessionManifestContract';
import { readDurableMultiCandidateSessionManifest, resolveCandidateSessionLocation } from '../candidateSessionStore';
import { validateSolutionDecision } from '../../../src/evolution/solutionDecisionContract';
import {
  parseCandidateLaneFailureV2,
  type CandidateLaneFailureContainment,
  type CandidateLaneFailureStage,
} from '../candidateLaneFailureContract';
import type { ParticipantFailureOrigin, ParticipantFailureReason } from '../problemAgnosticSolution/participantFailureClassification';
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

export interface MultiCandidateParticipantFailureDetailV1 {
  candidateRef: string;
  hypothesisId: string;
  stage: CandidateLaneFailureStage | 'typed details unavailable';
  failureOrigin?: ParticipantFailureOrigin | null;
  failureReason?: ParticipantFailureReason | null;
  containment?: CandidateLaneFailureContainment | null;
  message?: string;
  typedDetails?: 'AVAILABLE' | 'UNAVAILABLE';
  errorKind?: string;
  cause?: string;
  evidenceRef: string;
}

function safeSessionRelativePath(sessionRoot: string, value: string): string {
  if (isAbsolute(value) || value.includes('\\')) throw new Error(`durable candidate reference must be relative: ${value}`);
  const candidate = resolve(sessionRoot, value);
  const child = relative(resolve(sessionRoot), candidate);
  if (!child || child === '..' || child.startsWith(`..${sep}`) || isAbsolute(child)) throw new Error(`durable candidate reference escapes session: ${value}`);
  return candidate;
}

export async function readMultiCandidateParticipantFailureDetails(input: {
  repositoryRoot: string;
  logicalSessionId: string;
}): Promise<MultiCandidateParticipantFailureDetailV1[]> {
  const manifest = await readDurableMultiCandidateSessionManifest(input.repositoryRoot, input.logicalSessionId);
  const location = resolveCandidateSessionLocation(input.repositoryRoot, input.logicalSessionId);
  const details: MultiCandidateParticipantFailureDetailV1[] = [];
  for (const epoch of manifest.sourceEpochs) {
    if (epoch.poolRef === null) continue;
    const pool = await readPool(location.sessionRoot, epoch.poolRef);
    for (const candidate of pool.candidates) {
      if (candidate.processingState !== 'INTERRUPTED') continue;
      if (candidate.interruptionRef === 'host-failure.json'
        || candidate.interruptionRef?.startsWith('reconciliation/')
        || candidate.interruptionRef?.startsWith('candidate-failure/')) continue;
      const unavailable: MultiCandidateParticipantFailureDetailV1 = {
        candidateRef: candidate.candidateRef,
        hypothesisId: candidate.hypothesisId,
        stage: 'typed details unavailable',
        failureOrigin: null,
        failureReason: null,
        containment: null,
        message: 'typed details unavailable',
        typedDetails: 'UNAVAILABLE',
        evidenceRef: 'typed details unavailable',
      };
      if (candidate.interruptionRef === null) {
        details.push(unavailable);
        continue;
      }
      let outcomePath: string;
      try {
        outcomePath = safeSessionRelativePath(location.sessionRoot, candidate.interruptionRef);
      } catch {
        details.push(unavailable);
        continue;
      }
      const evidenceRef = relative(resolve(input.repositoryRoot), outcomePath).split(sep).join('/');
      const unavailableWithRef = { ...unavailable, evidenceRef };
      try {
        const failure = parseCandidateLaneFailureV2(await readFile(outcomePath, 'utf8'));
        if (failure.candidateRef !== candidate.candidateRef
          || failure.hypothesisId !== candidate.hypothesisId
          || failure.sourceIndex !== candidate.sourceIndex) {
          details.push(unavailableWithRef);
          continue;
        }
        details.push({
          candidateRef: candidate.candidateRef,
          hypothesisId: candidate.hypothesisId,
          stage: failure.stage,
          failureOrigin: failure.failureOrigin,
          failureReason: failure.failureReason,
          containment: failure.containment,
          message: failure.message,
          typedDetails: 'AVAILABLE',
          evidenceRef,
        });
      } catch {
        details.push(unavailableWithRef);
      }
    }
  }
  return details.sort((left, right) => left.candidateRef.localeCompare(right.candidateRef));
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
