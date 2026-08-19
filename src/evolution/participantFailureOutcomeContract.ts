import { isAbsolute } from 'node:path';

export type ParticipantFailureStage =
  | 'EXTERNAL_FEEDBACK'
  | 'IMPROVEMENT_HYPOTHESIS'
  | 'SOLUTION'
  | 'REVIEWER';

export interface ParticipantFailureOutcomeV1 {
  schemaVersion: 'participant-failure-outcome-v1';
  outcome: 'PARTICIPANT_FAILURE';
  failedStage: ParticipantFailureStage;
  participantJobNumber: 1 | 2 | 3 | 4;
  route: 'DEFER';
  participantErrorKind: string;
  failureArtifactRefs: string[];
  budget: {
    actualParticipantJobs: number;
    maxParticipantJobs: 4;
    retryCount: 0;
  };
}

const ROOT_KEYS = [
  'schemaVersion',
  'outcome',
  'failedStage',
  'participantJobNumber',
  'route',
  'participantErrorKind',
  'failureArtifactRefs',
  'budget',
] as const;
const BUDGET_KEYS = ['actualParticipantJobs', 'maxParticipantJobs', 'retryCount'] as const;
const STAGE_JOB_NUMBERS: Record<ParticipantFailureStage, 1 | 2 | 3 | 4> = {
  EXTERNAL_FEEDBACK: 1,
  IMPROVEMENT_HYPOTHESIS: 2,
  SOLUTION: 3,
  REVIEWER: 4,
};
const STAGES = Object.keys(STAGE_JOB_NUMBERS) as ParticipantFailureStage[];
type RecordValue = Record<string, unknown>;

function assertObject(value: unknown, label: string): asserts value is RecordValue {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
}

function assertExactKeys(value: RecordValue, allowed: readonly string[], label: string): void {
  const allowedSet = new Set(allowed);
  for (const key of Object.keys(value)) {
    if (!allowedSet.has(key)) throw new Error(`${label} contains unknown field: ${key}`);
  }
  for (const key of allowed) {
    if (!(key in value)) throw new Error(`${label} is missing field: ${key}`);
  }
}

function nonEmptyString(value: unknown, path: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${path} must be a non-empty string`);
  }
  return value;
}

function safeRelativeArtifactRef(value: unknown, path: string): string {
  const reference = nonEmptyString(value, path);
  if (isAbsolute(reference) || reference.includes('\0')) {
    throw new Error(`${path} must be a safe relative path`);
  }
  if (/^[A-Za-z]:[\\/]/.test(reference) || reference.startsWith('\\\\')) {
    throw new Error(`${path} must be a safe relative path`);
  }
  const segments = reference.split(/[\\/]/);
  if (segments.some(segment => segment === '' || segment === '.' || segment === '..')) {
    throw new Error(`${path} must be a safe relative path`);
  }
  return reference;
}

export function validateParticipantFailureOutcome(value: unknown): ParticipantFailureOutcomeV1 {
  assertObject(value, 'participant failure outcome');
  assertExactKeys(value, ROOT_KEYS, 'participant failure outcome');
  if (value.schemaVersion !== 'participant-failure-outcome-v1') {
    throw new Error('participant failure outcome schemaVersion must be participant-failure-outcome-v1');
  }
  if (value.outcome !== 'PARTICIPANT_FAILURE') {
    throw new Error('participant failure outcome.outcome must be PARTICIPANT_FAILURE');
  }
  if (typeof value.failedStage !== 'string' || !STAGES.includes(value.failedStage as ParticipantFailureStage)) {
    throw new Error(`participant failure outcome.failedStage has invalid value: ${String(value.failedStage)}`);
  }
  const failedStage = value.failedStage as ParticipantFailureStage;
  const expectedJobNumber = STAGE_JOB_NUMBERS[failedStage];
  if (value.participantJobNumber !== expectedJobNumber) {
    throw new Error(`participant failure outcome.participantJobNumber must be ${expectedJobNumber} for ${failedStage}`);
  }
  if (value.route !== 'DEFER') throw new Error('participant failure outcome.route must be DEFER');
  const participantErrorKind = nonEmptyString(value.participantErrorKind, 'participant failure outcome.participantErrorKind');

  if (!Array.isArray(value.failureArtifactRefs) || value.failureArtifactRefs.length === 0) {
    throw new Error('participant failure outcome.failureArtifactRefs must be a non-empty array');
  }
  const failureArtifactRefs = value.failureArtifactRefs.map((reference, index) =>
    safeRelativeArtifactRef(reference, `participant failure outcome.failureArtifactRefs[${index}]`));

  assertObject(value.budget, 'participant failure outcome.budget');
  assertExactKeys(value.budget, BUDGET_KEYS, 'participant failure outcome.budget');
  if (value.budget.actualParticipantJobs !== expectedJobNumber) {
    throw new Error(`participant failure outcome.budget.actualParticipantJobs must be ${expectedJobNumber}`);
  }
  if (value.budget.maxParticipantJobs !== 4) {
    throw new Error('participant failure outcome.budget.maxParticipantJobs must be 4');
  }
  if (value.budget.retryCount !== 0) {
    throw new Error('participant failure outcome.budget.retryCount must be 0');
  }

  return {
    schemaVersion: 'participant-failure-outcome-v1',
    outcome: 'PARTICIPANT_FAILURE',
    failedStage,
    participantJobNumber: expectedJobNumber,
    route: 'DEFER',
    participantErrorKind,
    failureArtifactRefs,
    budget: {
      actualParticipantJobs: expectedJobNumber,
      maxParticipantJobs: 4,
      retryCount: 0,
    },
  };
}

export function parseParticipantFailureOutcome(raw: string): ParticipantFailureOutcomeV1 {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('participant failure outcome must be valid JSON');
  }
  return validateParticipantFailureOutcome(parsed);
}
