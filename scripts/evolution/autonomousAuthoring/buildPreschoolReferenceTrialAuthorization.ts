import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, resolve } from 'node:path';
import {
  canonicalAttemptManifestJson,
  captureReferenceTrialLegacyHistory,
  PRESCHOOL_REFERENCE_TRIAL_RUN_REF,
  validateReferenceTrialAttemptRef,
} from './runPreschoolReferenceTrial';
import {
  referenceParticipantBindingLockSha256,
  resolveReferenceParticipantBindingFromLock,
  type ReferenceParticipantBindingLockV1,
} from '../operator/referenceParticipantBinding';
import { sha256Hex } from '../phase0/provenance';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function buildPreschoolReferenceTrialAuthorizationCandidate(input: {
  liveRepositoryRoot: string;
  attemptRef: string;
  authorizationRef: string;
  authorizedAt: string;
  participantBindingLockPath: string;
  expectedParticipantBindingLockSha256: string;
  destinationPath: string;
}, resolveBindingFromLock: typeof resolveReferenceParticipantBindingFromLock = resolveReferenceParticipantBindingFromLock): Promise<{
  canonicalSha256: string;
  rawSha256: string;
  participantBindingLockSha256: string;
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
  if (!/^[a-f0-9]{64}$/.test(input.expectedParticipantBindingLockSha256)) {
    throw new Error('Expected Participant binding lock SHA-256 is invalid.');
  }
  if (!input.participantBindingLockPath || !input.destinationPath) {
    throw new Error('Binding lock and destination paths are required.');
  }
  const bindingLockPath = isAbsolute(input.participantBindingLockPath)
    ? input.participantBindingLockPath
    : resolve(liveRepositoryRoot, input.participantBindingLockPath);
  const destinationPath = isAbsolute(input.destinationPath)
    ? input.destinationPath
    : resolve(liveRepositoryRoot, input.destinationPath);
  let parsedLock: unknown;
  try {
    parsedLock = JSON.parse(await readFile(bindingLockPath, 'utf8')) as unknown;
  } catch (error) {
    throw new Error(`Participant binding lock could not be read or parsed: ${String(error)}`);
  }
  if (!isRecord(parsedLock)) throw new Error('Participant binding lock must be a JSON object.');
  const participantBindingLock = parsedLock as unknown as ReferenceParticipantBindingLockV1;
  const participantBindingLockSha256 = referenceParticipantBindingLockSha256(participantBindingLock);
  if (participantBindingLockSha256 !== input.expectedParticipantBindingLockSha256) {
    throw new Error('Participant binding lock SHA-256 does not match the expected value.');
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
  await resolveBindingFromLock({ repositoryRoot: liveRepositoryRoot, lock: participantBindingLock });

  const body = {
    schemaVersion: 'preschool-reference-trial-execution-authorization-v2',
    authorizationRef: input.authorizationRef,
    runRef: PRESCHOOL_REFERENCE_TRIAL_RUN_REF,
    attemptRef,
    authorizedAt: input.authorizedAt,
    acknowledgedLegacyHistory,
    participantBindingLock,
    participantBindingLockSha256,
  } as const;
  const canonicalSha256 = sha256Hex(canonicalAttemptManifestJson(body));
  const artifact = { ...body, canonicalSha256 };
  const bytes = Buffer.from(`${canonicalAttemptManifestJson(artifact)}\n`, 'utf8');
  await mkdir(dirname(destinationPath), { recursive: true });
  await writeFile(destinationPath, bytes, { flag: 'wx' });
  return {
    canonicalSha256,
    rawSha256: sha256Hex(bytes),
    participantBindingLockSha256,
  };
}
