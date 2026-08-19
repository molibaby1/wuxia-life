export type SolutionWorkStatus =
  | 'OPTIONS'
  | 'NO_PROPOSAL'
  | 'INSUFFICIENT_EVIDENCE'
  | 'ESCALATE';

export type SolutionChangeScope =
  | 'configuration'
  | 'program'
  | 'mixed'
  | 'uncertain';

export interface SolutionOptionV1 {
  optionId: string;
  proposedChange: string;
  rationale: string;
  repoRefs: string[];
  artifactRefs: string[];
  changeScope: SolutionChangeScope;
  expectedPlayerObservableDifference: string;
  risks: string[];
  unknowns: string[];
}

export interface SolutionWorkV1 {
  schemaVersion: 'solution-work-v1';
  status: SolutionWorkStatus;
  problemId: string;
  options: SolutionOptionV1[];
  recommendedOptionId?: string;
  summary: string;
  repoRefs: string[];
  artifactRefs: string[];
}

const ROOT_REQUIRED_KEYS = ['schemaVersion', 'status', 'problemId', 'options', 'summary', 'repoRefs', 'artifactRefs'] as const;
const ROOT_OPTIONAL_KEYS = ['recommendedOptionId'] as const;
const OPTION_KEYS = [
  'optionId',
  'proposedChange',
  'rationale',
  'repoRefs',
  'artifactRefs',
  'changeScope',
  'expectedPlayerObservableDifference',
  'risks',
  'unknowns',
] as const;
const STATUSES: readonly SolutionWorkStatus[] = [
  'OPTIONS',
  'NO_PROPOSAL',
  'INSUFFICIENT_EVIDENCE',
  'ESCALATE',
];
const SCOPES: readonly SolutionChangeScope[] = ['configuration', 'program', 'mixed', 'uncertain'];
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

function stableOptionId(index: number): string {
  return `option-${String(index + 1).padStart(6, '0')}`;
}

function parseOption(value: unknown, index: number): SolutionOptionV1 {
  const path = `solution work.options[${index}]`;
  assertObject(value, path);
  assertExactKeys(value, OPTION_KEYS, [], path);
  const expectedId = stableOptionId(index);
  if (value.optionId !== expectedId) throw new Error(`${path}.optionId must be ${expectedId} in participant order`);
  return {
    optionId: expectedId,
    proposedChange: nonEmptyString(value.proposedChange, `${path}.proposedChange`),
    rationale: nonEmptyString(value.rationale, `${path}.rationale`),
    repoRefs: stringArray(value.repoRefs, `${path}.repoRefs`),
    artifactRefs: stringArray(value.artifactRefs, `${path}.artifactRefs`),
    changeScope: enumValue(value.changeScope, SCOPES, `${path}.changeScope`),
    expectedPlayerObservableDifference: nonEmptyString(value.expectedPlayerObservableDifference, `${path}.expectedPlayerObservableDifference`),
    risks: stringArray(value.risks, `${path}.risks`),
    unknowns: stringArray(value.unknowns, `${path}.unknowns`),
  };
}

export function validateSolutionWork(value: unknown): SolutionWorkV1 {
  assertObject(value, 'solution work');
  assertExactKeys(value, ROOT_REQUIRED_KEYS, ROOT_OPTIONAL_KEYS, 'solution work');
  if (value.schemaVersion !== 'solution-work-v1') throw new Error('solution work schemaVersion must be solution-work-v1');
  const status = enumValue(value.status, STATUSES, 'solution work.status');
  if (!Array.isArray(value.options)) throw new Error('solution work.options must be an array');
  if (value.options.length > 3) throw new Error('solution work.options must contain at most three options');
  if (status === 'OPTIONS' && value.options.length === 0) throw new Error('OPTIONS requires at least one option');
  if (status !== 'OPTIONS' && value.options.length !== 0) throw new Error(`${status} must not contain options`);
  const options = value.options.map(parseOption);

  const recommendedOptionId = value.recommendedOptionId === undefined
    ? undefined
    : nonEmptyString(value.recommendedOptionId, 'solution work.recommendedOptionId');
  if (recommendedOptionId !== undefined && !options.some(option => option.optionId === recommendedOptionId)) {
    throw new Error('solution work.recommendedOptionId must reference an option');
  }
  if (status !== 'OPTIONS' && recommendedOptionId !== undefined) {
    throw new Error(`${status} must not contain recommendedOptionId`);
  }

  return {
    schemaVersion: 'solution-work-v1',
    status,
    problemId: nonEmptyString(value.problemId, 'solution work.problemId'),
    options,
    ...(recommendedOptionId !== undefined ? { recommendedOptionId } : {}),
    summary: nonEmptyString(value.summary, 'solution work.summary'),
    repoRefs: stringArray(value.repoRefs, 'solution work.repoRefs'),
    artifactRefs: stringArray(value.artifactRefs, 'solution work.artifactRefs'),
  };
}

export function parseSolutionWork(raw: string): SolutionWorkV1 {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('solution work must be valid JSON');
  }
  return validateSolutionWork(parsed);
}
