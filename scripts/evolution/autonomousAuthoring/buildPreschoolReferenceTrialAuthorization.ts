import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { realpathSync } from 'node:fs';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import {
  canonicalAttemptManifestJson,
  captureReferenceTrialLegacyHistory,
  PRESCHOOL_REFERENCE_TRIAL_RUN_REF,
  validateReferenceTrialAttemptRef,
} from './runPreschoolReferenceTrial';
import {
  artifactBackedReferenceParticipantBindingLockSha256,
  resolveArtifactBackedReferenceParticipantBindingFromLock,
  type ArtifactBackedReferenceParticipantBindingLockV2,
  referenceParticipantBindingLockSha256,
  resolveReferenceParticipantBindingFromLock,
  type ReferenceParticipantBindingLockV1,
} from '../operator/referenceParticipantBinding';
import { sha256Hex } from '../phase0/provenance';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function realpathWithMissingSuffix(path: string): string {
  let cursor = resolve(path);
  const missingSuffix: string[] = [];
  while (true) {
    try {
      return resolve(realpathSync(cursor), ...missingSuffix);
    } catch (error) {
      if (!error || typeof error !== 'object' || !('code' in error) || error.code !== 'ENOENT') throw error;
      const parent = dirname(cursor);
      if (parent === cursor) throw error;
      missingSuffix.unshift(basename(cursor));
      cursor = parent;
    }
  }
}

function assertAuthorizationDestinationOutsideReferenceHistory(root: string, destination: string): void {
  const historyRoot = join(root, 'artifacts/evolution/autonomous-authoring/reference-trials');
  const relativePath = relative(realpathWithMissingSuffix(historyRoot), realpathWithMissingSuffix(destination));
  if (relativePath === '' || (relativePath !== '..' && !relativePath.startsWith(`..${sep}`) && !isAbsolute(relativePath))) {
    throw new Error('Authorization candidate destination must be outside governed reference-trial history.');
  }
}

export async function buildPreschoolReferenceTrialAuthorizationCandidate(input: {
  liveRepositoryRoot: string;
  attemptRef: string;
  authorizationRef: string;
  authorizedAt: string;
  solutionParticipantBindingLockPath: string;
  expectedSolutionParticipantBindingLockSha256: string;
  downstreamParticipantBindingLockPath: string;
  expectedDownstreamParticipantBindingLockSha256: string;
  destinationPath: string;
}, dependencies: {
  resolveSolutionBindingFromLock?: typeof resolveArtifactBackedReferenceParticipantBindingFromLock;
  resolveDownstreamBindingFromLock?: typeof resolveReferenceParticipantBindingFromLock;
} = {}): Promise<{
  canonicalSha256: string;
  rawSha256: string;
  solutionParticipantBindingLockSha256: string;
  downstreamParticipantBindingLockSha256: string;
}> {
  const liveRepositoryRoot = resolve(input.liveRepositoryRoot);
  const attemptRef = validateReferenceTrialAttemptRef(input.attemptRef);
  if (!input.authorizationRef.trim() || input.authorizationRef.length > 256 || /[\u0000-\u001f\u007f]/.test(input.authorizationRef)) {
    throw new Error('Authorization reference is invalid.');
  }
  if (!Number.isFinite(Date.parse(input.authorizedAt))
    || new Date(input.authorizedAt).toISOString() !== input.authorizedAt) {
    throw new Error('Authorization timestamp must be an exact ISO-8601 instant.');
  }
  if (!/^[a-f0-9]{64}$/.test(input.expectedSolutionParticipantBindingLockSha256)
    || !/^[a-f0-9]{64}$/.test(input.expectedDownstreamParticipantBindingLockSha256)) {
    throw new Error('Expected role-specific Participant binding lock SHA-256 is invalid.');
  }
  if (!input.solutionParticipantBindingLockPath || !input.downstreamParticipantBindingLockPath || !input.destinationPath) {
    throw new Error('Both role-specific binding lock and destination paths are required.');
  }
  const solutionBindingLockPath = isAbsolute(input.solutionParticipantBindingLockPath)
    ? input.solutionParticipantBindingLockPath
    : resolve(liveRepositoryRoot, input.solutionParticipantBindingLockPath);
  const downstreamBindingLockPath = isAbsolute(input.downstreamParticipantBindingLockPath)
    ? input.downstreamParticipantBindingLockPath
    : resolve(liveRepositoryRoot, input.downstreamParticipantBindingLockPath);
  const destinationPath = isAbsolute(input.destinationPath)
    ? input.destinationPath
    : resolve(liveRepositoryRoot, input.destinationPath);
  assertAuthorizationDestinationOutsideReferenceHistory(liveRepositoryRoot, destinationPath);
  let parsedSolutionLock: unknown;
  try {
    parsedSolutionLock = JSON.parse(await readFile(solutionBindingLockPath, 'utf8')) as unknown;
  } catch (error) {
    throw new Error(`Artifact-backed Solution binding lock could not be read or parsed: ${String(error)}`);
  }
  if (!isRecord(parsedSolutionLock)) throw new Error('Artifact-backed Solution binding lock must be a JSON object.');
  let parsedDownstreamLock: unknown;
  try {
    parsedDownstreamLock = JSON.parse(await readFile(downstreamBindingLockPath, 'utf8')) as unknown;
  } catch (error) {
    throw new Error(`Downstream Participant binding lock could not be read or parsed: ${String(error)}`);
  }
  if (!isRecord(parsedDownstreamLock)) throw new Error('Downstream Participant binding lock must be a JSON object.');
  const solutionParticipantBindingLock = parsedSolutionLock as unknown as ArtifactBackedReferenceParticipantBindingLockV2;
  const downstreamParticipantBindingLock = parsedDownstreamLock as unknown as ReferenceParticipantBindingLockV1;
  const solutionParticipantBindingLockSha256 = artifactBackedReferenceParticipantBindingLockSha256(solutionParticipantBindingLock);
  const downstreamParticipantBindingLockSha256 = referenceParticipantBindingLockSha256(downstreamParticipantBindingLock);
  if (solutionParticipantBindingLockSha256 !== input.expectedSolutionParticipantBindingLockSha256
    || downstreamParticipantBindingLockSha256 !== input.expectedDownstreamParticipantBindingLockSha256) {
    throw new Error('Role-specific Participant binding lock SHA-256 does not match the expected value.');
  }
  for (const field of [
    'bindingId', 'provider', 'executableRealPath', 'executableVersion', 'modelConfigured',
    'reasoningEffort', 'ambientCodexConfigPath', 'ambientCodexConfigSha256',
  ] as const) {
    if (solutionParticipantBindingLock[field] !== downstreamParticipantBindingLock[field]) {
      throw new Error(`Solution and downstream Participant binding core identity differs at ${field}.`);
    }
  }

  const acknowledgedLegacyHistory = await captureReferenceTrialLegacyHistory(
    `${liveRepositoryRoot}/artifacts/evolution/autonomous-authoring/reference-trials/${PRESCHOOL_REFERENCE_TRIAL_RUN_REF}`,
  );
  if (acknowledgedLegacyHistory.attempts.some(attempt => attempt.attemptRef === attemptRef)) {
    throw new Error(`Target attempt ${attemptRef} already exists.`);
  }
  if (acknowledgedLegacyHistory.attempts.some(attempt => attempt.manifestState === 'CREATED' || attempt.manifestState === 'RUNNING')) {
    throw new Error('A reference trial attempt is active; authorization candidate cannot be built.');
  }
  await (dependencies.resolveSolutionBindingFromLock ?? resolveArtifactBackedReferenceParticipantBindingFromLock)({
    repositoryRoot: liveRepositoryRoot,
    lock: solutionParticipantBindingLock,
  });
  await (dependencies.resolveDownstreamBindingFromLock ?? resolveReferenceParticipantBindingFromLock)({
    repositoryRoot: liveRepositoryRoot,
    lock: downstreamParticipantBindingLock,
  });

  const body = {
    schemaVersion: 'preschool-reference-trial-execution-authorization-v3',
    authorizationRef: input.authorizationRef,
    runRef: PRESCHOOL_REFERENCE_TRIAL_RUN_REF,
    attemptRef,
    authorizedAt: input.authorizedAt,
    acknowledgedLegacyHistory,
    solutionParticipantBindingLock,
    solutionParticipantBindingLockSha256,
    downstreamParticipantBindingLock,
    downstreamParticipantBindingLockSha256,
  } as const;
  const canonicalSha256 = sha256Hex(canonicalAttemptManifestJson(body));
  const artifact = { ...body, canonicalSha256 };
  const bytes = Buffer.from(`${canonicalAttemptManifestJson(artifact)}\n`, 'utf8');
  await mkdir(dirname(destinationPath), { recursive: true });
  await writeFile(destinationPath, bytes, { flag: 'wx' });
  return {
    canonicalSha256,
    rawSha256: sha256Hex(bytes),
    solutionParticipantBindingLockSha256,
    downstreamParticipantBindingLockSha256,
  };
}
