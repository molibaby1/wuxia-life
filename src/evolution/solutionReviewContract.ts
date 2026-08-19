export type SolutionReviewDecision =
  | 'ACCEPT_OPTION'
  | 'ACCEPT_NO_ACTION'
  | 'REJECT'
  | 'REQUEST_MORE_WORK'
  | 'DEFER'
  | 'ESCALATE';

export type ReviewScopeAssessment =
  | 'config_only'
  | 'code_required'
  | 'mixed'
  | 'uncertain';

export interface SolutionReviewV1 {
  schemaVersion: 'solution-review-v1';
  problemId: string;
  decision: SolutionReviewDecision;
  acceptedOptionId?: string;
  scopeAssessment?: ReviewScopeAssessment;
  assessment: string;
  repoRefs: string[];
  artifactRefs: string[];
  concerns: string[];
}

const ROOT_REQUIRED_KEYS = ['schemaVersion', 'problemId', 'decision', 'assessment', 'repoRefs', 'artifactRefs', 'concerns'] as const;
const ROOT_OPTIONAL_KEYS = ['acceptedOptionId', 'scopeAssessment'] as const;
const DECISIONS: readonly SolutionReviewDecision[] = [
  'ACCEPT_OPTION',
  'ACCEPT_NO_ACTION',
  'REJECT',
  'REQUEST_MORE_WORK',
  'DEFER',
  'ESCALATE',
];
const SCOPES: readonly ReviewScopeAssessment[] = ['config_only', 'code_required', 'mixed', 'uncertain'];
type RecordValue = Record<string, unknown>;

function assertObject(value: unknown, label: string): asserts value is RecordValue {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error(`${label} must be an object`);
}

function assertExactKeys(value: RecordValue, required: readonly string[], optional: readonly string[], label: string): void {
  const allowed = new Set([...required, ...optional]);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) throw new Error(`${label} contains unknown field: ${key}`);
  }
  for (const key of required) {
    if (!(key in value)) throw new Error(`${label} is missing field: ${key}`);
  }
}

function nonEmptyString(value: unknown, path: string): string {
  if (typeof value !== 'string' || value.length === 0) throw new Error(`${path} must be a non-empty string`);
  return value;
}

function stringArray(value: unknown, path: string): string[] {
  if (!Array.isArray(value)) throw new Error(`${path} must be an array`);
  value.forEach((item, index) => nonEmptyString(item, `${path}[${index}]`));
  return [...value] as string[];
}

function enumValue<T extends string>(value: unknown, values: readonly T[], path: string): T {
  if (typeof value !== 'string' || !values.includes(value as T)) throw new Error(`${path} has invalid value: ${String(value)}`);
  return value as T;
}

export function validateSolutionReview(value: unknown): SolutionReviewV1 {
  assertObject(value, 'solution review');
  assertExactKeys(value, ROOT_REQUIRED_KEYS, ROOT_OPTIONAL_KEYS, 'solution review');
  if (value.schemaVersion !== 'solution-review-v1') throw new Error('solution review schemaVersion must be solution-review-v1');
  const decision = enumValue(value.decision, DECISIONS, 'solution review.decision');
  const acceptedOptionId = value.acceptedOptionId === undefined
    ? undefined
    : nonEmptyString(value.acceptedOptionId, 'solution review.acceptedOptionId');
  const scopeAssessment = value.scopeAssessment === undefined
    ? undefined
    : enumValue(value.scopeAssessment, SCOPES, 'solution review.scopeAssessment');

  if (decision === 'ACCEPT_OPTION') {
    if (acceptedOptionId === undefined) throw new Error('ACCEPT_OPTION requires acceptedOptionId');
    if (scopeAssessment === undefined) throw new Error('ACCEPT_OPTION requires scopeAssessment');
    if (!/^option-\d{6}$/.test(acceptedOptionId)) throw new Error('acceptedOptionId must use stable option id format');
  } else if (acceptedOptionId !== undefined || scopeAssessment !== undefined) {
    throw new Error(`${decision} must not contain accepted option scope fields`);
  }

  return {
    schemaVersion: 'solution-review-v1',
    problemId: nonEmptyString(value.problemId, 'solution review.problemId'),
    decision,
    ...(acceptedOptionId !== undefined ? { acceptedOptionId } : {}),
    ...(scopeAssessment !== undefined ? { scopeAssessment } : {}),
    assessment: nonEmptyString(value.assessment, 'solution review.assessment'),
    repoRefs: stringArray(value.repoRefs, 'solution review.repoRefs'),
    artifactRefs: stringArray(value.artifactRefs, 'solution review.artifactRefs'),
    concerns: stringArray(value.concerns, 'solution review.concerns'),
  };
}

export function parseSolutionReview(raw: string): SolutionReviewV1 {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('solution review must be valid JSON');
  }
  return validateSolutionReview(parsed);
}
