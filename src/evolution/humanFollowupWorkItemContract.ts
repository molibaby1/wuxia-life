import type { ProblemPackageV1 } from './problemPackageContract';

export type HumanFollowupStatus =
  | 'OPEN'
  | 'INVESTIGATING'
  | 'DEFERRED'
  | 'REJECTED'
  | 'READY_FOR_FORMAL_TASK'
  | 'CONVERTED';

export type HumanFollowupTriggerReasonCode =
  | 'ACCEPTED_OUT_OF_SCOPE'
  | 'EXPLICIT_ESCALATION';

export interface HumanFollowupEvidenceEntry {
  relativePath: string;
  sha256: string;
}

export interface HumanFollowupReviewEntry {
  reviewedAt: string;
  fromStatus: HumanFollowupStatus;
  toStatus: HumanFollowupStatus;
  note: string;
}

export interface HumanFollowupWorkItemV1 {
  schemaVersion: 'human-follow-up-work-item-v1';
  itemId: string;
  identitySha256: string;
  createdAt: string;
  updatedAt: string;
  status: HumanFollowupStatus;
  problem: ProblemPackageV1['problem'];
  trigger: {
    route: 'ESCALATE_HUMAN';
    reasonCode: HumanFollowupTriggerReasonCode;
  };
  provenance: {
    sourceRunRef: string;
    workflowInstanceRef: string;
    workflowRef: string;
    decisionSha256: string;
    sourceFingerprintSha256: string;
    productSourceFingerprintSha256: string;
  };
  evidence: HumanFollowupEvidenceEntry[];
  reviewHistory: HumanFollowupReviewEntry[];
  formalTaskRef: string | null;
}

const STATUSES: readonly HumanFollowupStatus[] = [
  'OPEN',
  'INVESTIGATING',
  'DEFERRED',
  'REJECTED',
  'READY_FOR_FORMAL_TASK',
  'CONVERTED',
];

const TRIGGER_REASONS: readonly HumanFollowupTriggerReasonCode[] = [
  'ACCEPTED_OUT_OF_SCOPE',
  'EXPLICIT_ESCALATION',
];

const ROOT_KEYS = [
  'schemaVersion',
  'itemId',
  'identitySha256',
  'createdAt',
  'updatedAt',
  'status',
  'problem',
  'trigger',
  'provenance',
  'evidence',
  'reviewHistory',
  'formalTaskRef',
] as const;
const PROBLEM_KEYS = [
  'hypothesisId',
  'statement',
  'observedBasis',
  'feedbackRefs',
  'evidenceRefs',
  'unknowns',
  'productSignificance',
] as const;
const TRIGGER_KEYS = ['route', 'reasonCode'] as const;
const PROVENANCE_KEYS = [
  'sourceRunRef',
  'workflowInstanceRef',
  'workflowRef',
  'decisionSha256',
  'sourceFingerprintSha256',
  'productSourceFingerprintSha256',
] as const;
const EVIDENCE_KEYS = ['relativePath', 'sha256'] as const;
const REVIEW_KEYS = ['reviewedAt', 'fromStatus', 'toStatus', 'note'] as const;
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

function stringArray(value: unknown, path: string): string[] {
  if (!Array.isArray(value)) throw new Error(`${path} must be an array`);
  return value.map((item, index) => nonEmptyString(item, `${path}[${index}]`));
}

function enumValue<T extends string>(value: unknown, values: readonly T[], path: string): T {
  if (typeof value !== 'string' || !values.includes(value as T)) {
    throw new Error(`${path} has invalid value: ${String(value)}`);
  }
  return value as T;
}

function sha256(value: unknown, path: string): string {
  const result = nonEmptyString(value, path);
  if (!/^[a-f0-9]{64}$/.test(result)) throw new Error(`${path} must be a SHA-256 hex string`);
  return result;
}

function isoTimestamp(value: unknown, path: string): string {
  const result = nonEmptyString(value, path);
  try {
    if (new Date(result).toISOString() !== result) throw new Error('not canonical');
  } catch {
    throw new Error(`${path} must be a canonical ISO timestamp`);
  }
  return result;
}

function safeRelativePath(value: unknown, path: string): string {
  const result = nonEmptyString(value, path);
  if (result.includes('\0') || result.startsWith('/') || /^[A-Za-z]:/.test(result) || result.startsWith('\\\\')) {
    throw new Error(`${path} must be a safe relative path`);
  }
  const segments = result.split(/[\\/]/);
  if (segments.some(segment => segment === '' || segment === '.' || segment === '..')) {
    throw new Error(`${path} must be a safe relative path`);
  }
  return result;
}

function validateProblem(value: unknown): ProblemPackageV1['problem'] {
  assertObject(value, 'human follow-up problem');
  assertExactKeys(value, PROBLEM_KEYS, 'human follow-up problem');
  return {
    hypothesisId: nonEmptyString(value.hypothesisId, 'human follow-up problem.hypothesisId'),
    statement: nonEmptyString(value.statement, 'human follow-up problem.statement'),
    observedBasis: nonEmptyString(value.observedBasis, 'human follow-up problem.observedBasis'),
    feedbackRefs: stringArray(value.feedbackRefs, 'human follow-up problem.feedbackRefs'),
    evidenceRefs: stringArray(value.evidenceRefs, 'human follow-up problem.evidenceRefs'),
    unknowns: stringArray(value.unknowns, 'human follow-up problem.unknowns'),
    productSignificance: nonEmptyString(value.productSignificance, 'human follow-up problem.productSignificance'),
  };
}

function validateEvidence(value: unknown, index: number): HumanFollowupEvidenceEntry {
  const path = `human follow-up evidence[${index}]`;
  assertObject(value, path);
  assertExactKeys(value, EVIDENCE_KEYS, path);
  return {
    relativePath: safeRelativePath(value.relativePath, `${path}.relativePath`),
    sha256: sha256(value.sha256, `${path}.sha256`),
  };
}

function validateReview(value: unknown, index: number): HumanFollowupReviewEntry {
  const path = `human follow-up reviewHistory[${index}]`;
  assertObject(value, path);
  assertExactKeys(value, REVIEW_KEYS, path);
  return {
    reviewedAt: isoTimestamp(value.reviewedAt, `${path}.reviewedAt`),
    fromStatus: enumValue(value.fromStatus, STATUSES, `${path}.fromStatus`),
    toStatus: enumValue(value.toStatus, STATUSES, `${path}.toStatus`),
    note: nonEmptyString(value.note, `${path}.note`),
  };
}

const ALLOWED_TRANSITIONS: Readonly<Record<HumanFollowupStatus, readonly HumanFollowupStatus[]>> = {
  OPEN: ['INVESTIGATING', 'DEFERRED', 'REJECTED', 'READY_FOR_FORMAL_TASK'],
  INVESTIGATING: ['DEFERRED', 'REJECTED', 'READY_FOR_FORMAL_TASK'],
  DEFERRED: ['OPEN', 'INVESTIGATING', 'REJECTED', 'READY_FOR_FORMAL_TASK'],
  REJECTED: [],
  READY_FOR_FORMAL_TASK: ['DEFERRED', 'REJECTED', 'CONVERTED'],
  CONVERTED: [],
};

export function canTransitionHumanFollowupStatus(
  fromStatus: HumanFollowupStatus,
  toStatus: HumanFollowupStatus,
): boolean {
  return ALLOWED_TRANSITIONS[fromStatus]?.includes(toStatus) ?? false;
}

export function validateHumanFollowupWorkItem(value: unknown): HumanFollowupWorkItemV1 {
  assertObject(value, 'human follow-up work item');
  assertExactKeys(value, ROOT_KEYS, 'human follow-up work item');
  if (value.schemaVersion !== 'human-follow-up-work-item-v1') {
    throw new Error('human follow-up work item schemaVersion must be human-follow-up-work-item-v1');
  }
  const itemId = nonEmptyString(value.itemId, 'human follow-up work item.itemId');
  if (!/^item-[a-f0-9]{64}$/.test(itemId)) {
    throw new Error('human follow-up work item.itemId must use the deterministic item-<sha256> format');
  }
  const identitySha256 = sha256(value.identitySha256, 'human follow-up work item.identitySha256');
  if (itemId !== `item-${identitySha256}`) {
    throw new Error('human follow-up work item.itemId must be derived from identitySha256');
  }
  const createdAt = isoTimestamp(value.createdAt, 'human follow-up work item.createdAt');
  const updatedAt = isoTimestamp(value.updatedAt, 'human follow-up work item.updatedAt');
  const status = enumValue(value.status, STATUSES, 'human follow-up work item.status');

  assertObject(value.trigger, 'human follow-up work item.trigger');
  assertExactKeys(value.trigger, TRIGGER_KEYS, 'human follow-up work item.trigger');
  if (value.trigger.route !== 'ESCALATE_HUMAN') {
    throw new Error('human follow-up work item.trigger.route must be ESCALATE_HUMAN');
  }
  const trigger = {
    route: 'ESCALATE_HUMAN' as const,
    reasonCode: enumValue(value.trigger.reasonCode, TRIGGER_REASONS, 'human follow-up work item.trigger.reasonCode'),
  };

  assertObject(value.provenance, 'human follow-up work item.provenance');
  assertExactKeys(value.provenance, PROVENANCE_KEYS, 'human follow-up work item.provenance');
  const provenance = {
    sourceRunRef: nonEmptyString(value.provenance.sourceRunRef, 'human follow-up work item.provenance.sourceRunRef'),
    workflowInstanceRef: safeRelativePath(value.provenance.workflowInstanceRef, 'human follow-up work item.provenance.workflowInstanceRef'),
    workflowRef: safeRelativePath(value.provenance.workflowRef, 'human follow-up work item.provenance.workflowRef'),
    decisionSha256: sha256(value.provenance.decisionSha256, 'human follow-up work item.provenance.decisionSha256'),
    sourceFingerprintSha256: sha256(value.provenance.sourceFingerprintSha256, 'human follow-up work item.provenance.sourceFingerprintSha256'),
    productSourceFingerprintSha256: sha256(value.provenance.productSourceFingerprintSha256, 'human follow-up work item.provenance.productSourceFingerprintSha256'),
  };

  if (!Array.isArray(value.evidence) || value.evidence.length === 0) {
    throw new Error('human follow-up work item.evidence must be a non-empty array');
  }
  const evidence = value.evidence.map(validateEvidence);
  if (new Set(evidence.map(entry => entry.relativePath)).size !== evidence.length) {
    throw new Error('human follow-up work item.evidence must not contain duplicate relativePath values');
  }

  if (!Array.isArray(value.reviewHistory)) {
    throw new Error('human follow-up work item.reviewHistory must be an array');
  }
  const reviewHistory = value.reviewHistory.map(validateReview);
  let historyStatus: HumanFollowupStatus = 'OPEN';
  for (const [index, review] of reviewHistory.entries()) {
    if (review.fromStatus !== historyStatus || !canTransitionHumanFollowupStatus(review.fromStatus, review.toStatus)) {
      throw new Error(`human follow-up reviewHistory[${index}] contains an invalid status transition`);
    }
    historyStatus = review.toStatus;
  }
  if (reviewHistory.length === 0 && status !== 'OPEN') {
    throw new Error('human follow-up work item with no review history must be OPEN');
  }
  if (reviewHistory.length > 0 && historyStatus !== status) {
    throw new Error('human follow-up work item.status does not match the end of reviewHistory');
  }

  const formalTaskRef = value.formalTaskRef === null
    ? null
    : nonEmptyString(value.formalTaskRef, 'human follow-up work item.formalTaskRef');
  if (status === 'CONVERTED' && formalTaskRef === null) {
    throw new Error('human follow-up work item.formalTaskRef is required for CONVERTED');
  }
  if (status !== 'CONVERTED' && formalTaskRef !== null) {
    throw new Error('human follow-up work item.formalTaskRef must be null before CONVERTED');
  }

  return {
    schemaVersion: 'human-follow-up-work-item-v1',
    itemId,
    identitySha256,
    createdAt,
    updatedAt,
    status,
    problem: validateProblem(value.problem),
    trigger,
    provenance,
    evidence,
    reviewHistory,
    formalTaskRef,
  };
}

export function parseHumanFollowupWorkItem(raw: string): HumanFollowupWorkItemV1 {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('human follow-up work item must be valid JSON');
  }
  return validateHumanFollowupWorkItem(parsed);
}
