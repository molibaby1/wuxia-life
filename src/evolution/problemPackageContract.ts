export interface ProblemPackageV1 {
  schemaVersion: 'problem-package-v1';
  problemId: string;
  source: {
    runRef: string;
    observablePayloadRef: string;
    externalFeedbackRef: string;
    improvementHypothesisRef: string;
  };
  problem: {
    hypothesisId: string;
    statement: string;
    observedBasis: string;
    feedbackRefs: string[];
    evidenceRefs: string[];
    unknowns: string[];
    productSignificance: string;
  };
  authorityRefs: string[];
  productSourceFingerprintSha256: string;
  permissions: {
    authoritativeProductWrite: false;
    sandboxWrite: true;
    productExecution: false;
    codeExecution: false;
  };
}

const ROOT_KEYS = [
  'schemaVersion',
  'problemId',
  'source',
  'problem',
  'authorityRefs',
  'productSourceFingerprintSha256',
  'permissions',
] as const;
const SOURCE_KEYS = [
  'runRef',
  'observablePayloadRef',
  'externalFeedbackRef',
  'improvementHypothesisRef',
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
const PERMISSION_KEYS = [
  'authoritativeProductWrite',
  'sandboxWrite',
  'productExecution',
  'codeExecution',
] as const;

type RecordValue = Record<string, unknown>;

function assertObject(value: unknown, label: string): asserts value is RecordValue {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
}

function assertExactKeys(value: RecordValue, allowed: readonly string[], label: string): void {
  const allowedKeys = new Set(allowed);
  for (const key of Object.keys(value)) {
    if (!allowedKeys.has(key)) throw new Error(`${label} contains unknown field: ${key}`);
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
  value.forEach((item, index) => nonEmptyString(item, `${path}[${index}]`));
  return [...value] as string[];
}

function fixedBoolean<T extends boolean>(value: unknown, expected: T, path: string): T {
  if (value !== expected) throw new Error(`${path} must be ${String(expected)}`);
  return expected;
}

export function validateProblemPackage(value: unknown): ProblemPackageV1 {
  assertObject(value, 'problem package');
  assertExactKeys(value, ROOT_KEYS, 'problem package');
  if (value.schemaVersion !== 'problem-package-v1') {
    throw new Error('problem package schemaVersion must be problem-package-v1');
  }

  assertObject(value.source, 'problem package.source');
  assertExactKeys(value.source, SOURCE_KEYS, 'problem package.source');
  const source = {
    runRef: nonEmptyString(value.source.runRef, 'problem package.source.runRef'),
    observablePayloadRef: nonEmptyString(value.source.observablePayloadRef, 'problem package.source.observablePayloadRef'),
    externalFeedbackRef: nonEmptyString(value.source.externalFeedbackRef, 'problem package.source.externalFeedbackRef'),
    improvementHypothesisRef: nonEmptyString(value.source.improvementHypothesisRef, 'problem package.source.improvementHypothesisRef'),
  };

  assertObject(value.problem, 'problem package.problem');
  assertExactKeys(value.problem, PROBLEM_KEYS, 'problem package.problem');
  const problem = {
    hypothesisId: nonEmptyString(value.problem.hypothesisId, 'problem package.problem.hypothesisId'),
    statement: nonEmptyString(value.problem.statement, 'problem package.problem.statement'),
    observedBasis: nonEmptyString(value.problem.observedBasis, 'problem package.problem.observedBasis'),
    feedbackRefs: stringArray(value.problem.feedbackRefs, 'problem package.problem.feedbackRefs'),
    evidenceRefs: stringArray(value.problem.evidenceRefs, 'problem package.problem.evidenceRefs'),
    unknowns: stringArray(value.problem.unknowns, 'problem package.problem.unknowns'),
    productSignificance: nonEmptyString(value.problem.productSignificance, 'problem package.problem.productSignificance'),
  };

  assertObject(value.permissions, 'problem package.permissions');
  assertExactKeys(value.permissions, PERMISSION_KEYS, 'problem package.permissions');
  const permissions = {
    authoritativeProductWrite: fixedBoolean(value.permissions.authoritativeProductWrite, false, 'problem package.permissions.authoritativeProductWrite'),
    sandboxWrite: fixedBoolean(value.permissions.sandboxWrite, true, 'problem package.permissions.sandboxWrite'),
    productExecution: fixedBoolean(value.permissions.productExecution, false, 'problem package.permissions.productExecution'),
    codeExecution: fixedBoolean(value.permissions.codeExecution, false, 'problem package.permissions.codeExecution'),
  } as const;

  const fingerprint = nonEmptyString(
    value.productSourceFingerprintSha256,
    'problem package.productSourceFingerprintSha256',
  );
  if (!/^[a-f0-9]{64}$/.test(fingerprint)) {
    throw new Error('problem package.productSourceFingerprintSha256 must be a SHA-256 hex string');
  }

  return {
    schemaVersion: 'problem-package-v1',
    problemId: nonEmptyString(value.problemId, 'problem package.problemId'),
    source,
    problem,
    authorityRefs: stringArray(value.authorityRefs, 'problem package.authorityRefs'),
    productSourceFingerprintSha256: fingerprint,
    permissions,
  };
}

export function parseProblemPackage(raw: string): ProblemPackageV1 {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('problem package must be valid JSON');
  }
  return validateProblemPackage(parsed);
}
