import { readdir } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { readDurableMultiCandidateSessionManifest, resolveCandidateSessionLocation } from '../candidateSessionStore';
import { DURABLE_EVIDENCE_ROOT } from './durableEvidenceIndex';
import {
  publishDurableEvidenceCapsule,
  type DurableEvidenceCapsuleManifest,
  type DurableEvidenceObjectInput,
} from './durableEvidenceCapsule';

export interface RetainMultiCandidateSessionEvidenceInput {
  repositoryRoot: string;
  logicalSessionId: string;
  createdAt: string;
}

export interface RetainMultiCandidateSessionEvidenceResult {
  status: 'PUBLISHED' | 'NOT_APPLICABLE';
  capsuleRoot: string | null;
  manifest: DurableEvidenceCapsuleManifest | null;
  reused: boolean;
}

async function collectFiles(root: string, current = ''): Promise<string[]> {
  const directory = resolve(root, current || '.');
  const entries = await readdir(directory, { withFileTypes: true });
  const result: string[] = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const path = current ? `${current}/${entry.name}` : entry.name;
    const absolutePath = resolve(root, path);
    if (entry.isDirectory()) result.push(...await collectFiles(root, path));
    else if (entry.isFile()) result.push(path);
    else throw new Error(`candidate Session evidence refuses unsupported filesystem entry: ${absolutePath}`);
  }
  return result;
}

function evidenceKind(relativePath: string): string {
  if (relativePath === 'session-manifest.json') return 'candidate_session_manifest';
  if (relativePath.endsWith('/source-anchor.json')) return 'source_epoch_anchor';
  if (relativePath.includes('/source-analysis/')) return 'source_candidate_analysis';
  if (relativePath.includes('/candidates/')) {
    if (relativePath.includes('/continuation')) return 'candidate_review_continuation';
    if (relativePath.includes('/decision')) return 'candidate_decision';
    if (relativePath.includes('/candidate-activation')) return 'candidate_activation';
    return 'candidate_lane_evidence';
  }
  if (relativePath.startsWith('source-transitions/')) return 'source_transition_evidence';
  return 'candidate_session_evidence';
}

export async function retainMultiCandidateSessionEvidence(
  input: RetainMultiCandidateSessionEvidenceInput,
): Promise<RetainMultiCandidateSessionEvidenceResult> {
  const manifest = await readDurableMultiCandidateSessionManifest(input.repositoryRoot, input.logicalSessionId);
  if (!['COMPLETED', 'FAILED', 'INTERRUPTED'].includes(manifest.sessionState)) {
    return { status: 'NOT_APPLICABLE', capsuleRoot: null, manifest: null, reused: false };
  }

  const location = resolveCandidateSessionLocation(input.repositoryRoot, input.logicalSessionId);
  const sessionFiles = await collectFiles(location.sessionRoot);
  const repositoryRoot = resolve(input.repositoryRoot);
  const evidence: DurableEvidenceObjectInput[] = sessionFiles.map(relativePath => ({
    logicalName: `candidate-session:${relativePath}`,
    relativePath: `session/${relativePath}`,
    sourcePath: join(location.sessionRoot, relativePath),
    visibility: 'HUMAN_FORENSIC_ONLY',
    evidenceKind: evidenceKind(relativePath),
    sourceRef: `sessions/${input.logicalSessionId}/${relativePath}`,
  }));
  const currentSource = manifest.sourceEpochs.find(epoch => epoch.sourceEpochRef === manifest.currentSourceEpochRef);
  if (currentSource === undefined) throw new Error(`current Source Epoch is missing from Session: ${manifest.currentSourceEpochRef}`);
  const participantFailure = manifest.sessionState === 'FAILED' || (manifest.pauseOrStopReason ?? '').includes('PARTICIPANT_FAILURE');
  const reviewContinuation = sessionFiles.some(path => path.includes('continuation'));
  const sourceTransitionEvidenceRefs = sessionFiles
    .filter(path => path.startsWith('source-transitions/'))
    .map(path => `session/${path}`);
  const sourceTransitionOccurred = manifest.sourceTransitionCount === 1;
  if (sourceTransitionOccurred && sourceTransitionEvidenceRefs.length === 0) {
    throw new Error('source transition count is 1 but durable source-transition evidence is missing');
  }
  const result = await publishDurableEvidenceCapsule({
    capsuleRoot: join(repositoryRoot, DURABLE_EVIDENCE_ROOT, input.logicalSessionId),
    sessionId: input.logicalSessionId,
    sourceRunRef: currentSource.sourceRunRef,
    createdAt: input.createdAt,
    repositoryIdentity: {
      branch: manifest.repositoryBaseline.branch,
      headSha: manifest.repositoryBaseline.headSha,
      workingTreeFingerprint: manifest.repositoryBaseline.workingTreeFingerprint,
    },
    workflowIdentity: {
      workflow: 'ordinary-auto-evolution-candidate-session',
      schemaVersion: 'multi-candidate-session-manifest-v1',
      logicalSessionId: manifest.logicalSessionId,
      sessionState: manifest.sessionState,
      currentSourceEpochRef: manifest.currentSourceEpochRef,
    },
    evidence,
    importantEvents: {
      participantFailure,
      reviewContinuation,
      configurationExecution: sourceTransitionOccurred,
      crossRoundTransition: sourceTransitionOccurred,
    },
    extensions: {
      configurationExecution: sourceTransitionOccurred
        ? { status: 'present', refs: sourceTransitionEvidenceRefs }
        : { status: 'not_applicable', refs: [] },
      crossRoundTransition: sourceTransitionOccurred
        ? { status: 'present', refs: sourceTransitionEvidenceRefs }
        : { status: 'not_applicable', refs: [] },
    },
  });
  return {
    status: 'PUBLISHED',
    capsuleRoot: result.capsuleRoot,
    manifest: result.manifest,
    reused: result.reused,
  };
}
