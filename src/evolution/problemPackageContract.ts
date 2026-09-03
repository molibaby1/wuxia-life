export interface ProblemPackageProblem {
  hypothesisId: string;
  statement: string;
  observedBasis: string;
  feedbackRefs: string[];
  evidenceRefs: string[];
  unknowns: string[];
  productSignificance: string;
}

export interface ProblemPackagePermissions {
  authoritativeProductWrite: false;
  sandboxWrite: true;
  productExecution: false;
  codeExecution: false;
}

export interface ProblemPackageV1 {
  schemaVersion: 'problem-package-v1';
  problemId: string;
  source: {
    runRef: string;
    observablePayloadRef: string;
    externalFeedbackRef: string;
    improvementHypothesisRef: string;
  };
  problem: ProblemPackageProblem;
  authorityRefs: string[];
  productSourceFingerprintSha256: string;
  permissions: ProblemPackagePermissions;
}

export interface ProblemPackageV2 {
  schemaVersion: 'problem-package-v2';
  problemId: string;
  source: {
    runRef: string;
    observablePayloadRef: string;
    externalFeedbackRef: string;
    improvementHypothesisRef: string;
    diagnosticEvidenceRefs: string[];
  };
  problem: ProblemPackageProblem;
  authorityRefs: string[];
  productSourceFingerprintSha256: string;
  permissions: ProblemPackagePermissions;
}

export type ProblemPackage = ProblemPackageV1 | ProblemPackageV2;

const ROOT_KEYS = [
  'schemaVersion',
  'problemId',
  'source',
  'problem',
  'authorityRefs',
  'productSourceFingerprintSha256',
  'permissions',
] as const;
const SOURCE_KEYS_V1 = [
  'runRef',
  'observablePayloadRef',
  'externalFeedbackRef',
  'improvementHypothesisRef',
] as const;
const SOURCE_KEYS_V2 = [
  'runRef',
  'observablePayloadRef',
  'externalFeedbackRef',
  'improvementHypothesisRef',
  'diagnosticEvidenceRefs',
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

function uniqueNonEmptyStringArray(value: unknown, path: string): string[] {
  const items = stringArray(value, path);
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item)) throw new Error(`${path} contains duplicate ref: ${item}`);
    seen.add(item);
  }
  return items;
}

function fixedBoolean<T extends boolean>(value: unknown, expected: T, path: string): T {
  if (value !== expected) throw new Error(`${path} must be ${String(expected)}`);
  return expected;
}

function parseProblem(value: unknown): ProblemPackageProblem {
  assertObject(value, 'problem package.problem');
  assertExactKeys(value, PROBLEM_KEYS, 'problem package.problem');
  return {
    hypothesisId: nonEmptyString(value.hypothesisId, 'problem package.problem.hypothesisId'),
    statement: nonEmptyString(value.statement, 'problem package.problem.statement'),
    observedBasis: nonEmptyString(value.observedBasis, 'problem package.problem.observedBasis'),
    feedbackRefs: stringArray(value.feedbackRefs, 'problem package.problem.feedbackRefs'),
    evidenceRefs: stringArray(value.evidenceRefs, 'problem package.problem.evidenceRefs'),
    unknowns: stringArray(value.unknowns, 'problem package.problem.unknowns'),
    productSignificance: nonEmptyString(
      value.productSignificance,
      'problem package.problem.productSignificance',
    ),
  };
}

function parsePermissions(value: unknown): ProblemPackagePermissions {
  assertObject(value, 'problem package.permissions');
  assertExactKeys(value, PERMISSION_KEYS, 'problem package.permissions');
  return {
    authoritativeProductWrite: fixedBoolean(
      value.authoritativeProductWrite,
      false,
      'problem package.permissions.authoritativeProductWrite',
    ),
    sandboxWrite: fixedBoolean(value.sandboxWrite, true, 'problem package.permissions.sandboxWrite'),
    productExecution: fixedBoolean(
      value.productExecution,
      false,
      'problem package.permissions.productExecution',
    ),
    codeExecution: fixedBoolean(
      value.codeExecution,
      false,
      'problem package.permissions.codeExecution',
    ),
  };
}

export function validateProblemPackage(value: unknown): ProblemPackage {
  assertObject(value, 'problem package');
  assertExactKeys(value, ROOT_KEYS, 'problem package');

  const fingerprint = nonEmptyString(
    value.productSourceFingerprintSha256,
    'problem package.productSourceFingerprintSha256',
  );
  if (!/^[a-f0-9]{64}$/.test(fingerprint)) {
    throw new Error('problem package.productSourceFingerprintSha256 must be a SHA-256 hex string');
  }

  const problem = parseProblem(value.problem);
  const permissions = parsePermissions(value.permissions);
  const problemId = nonEmptyString(value.problemId, 'problem package.problemId');
  const authorityRefs = stringArray(value.authorityRefs, 'problem package.authorityRefs');

  assertObject(value.source, 'problem package.source');
  if (value.schemaVersion === 'problem-package-v1') {
    assertExactKeys(value.source, SOURCE_KEYS_V1, 'problem package.source');
    return {
      schemaVersion: 'problem-package-v1',
      problemId,
      source: {
        runRef: nonEmptyString(value.source.runRef, 'problem package.source.runRef'),
        observablePayloadRef: nonEmptyString(
          value.source.observablePayloadRef,
          'problem package.source.observablePayloadRef',
        ),
        externalFeedbackRef: nonEmptyString(
          value.source.externalFeedbackRef,
          'problem package.source.externalFeedbackRef',
        ),
        improvementHypothesisRef: nonEmptyString(
          value.source.improvementHypothesisRef,
          'problem package.source.improvementHypothesisRef',
        ),
      },
      problem,
      authorityRefs,
      productSourceFingerprintSha256: fingerprint,
      permissions,
    };
  }

  if (value.schemaVersion === 'problem-package-v2') {
    assertExactKeys(value.source, SOURCE_KEYS_V2, 'problem package.source');
    return {
      schemaVersion: 'problem-package-v2',
      problemId,
      source: {
        runRef: nonEmptyString(value.source.runRef, 'problem package.source.runRef'),
        observablePayloadRef: nonEmptyString(
          value.source.observablePayloadRef,
          'problem package.source.observablePayloadRef',
        ),
        externalFeedbackRef: nonEmptyString(
          value.source.externalFeedbackRef,
          'problem package.source.externalFeedbackRef',
        ),
        improvementHypothesisRef: nonEmptyString(
          value.source.improvementHypothesisRef,
          'problem package.source.improvementHypothesisRef',
        ),
        diagnosticEvidenceRefs: uniqueNonEmptyStringArray(
          value.source.diagnosticEvidenceRefs,
          'problem package.source.diagnosticEvidenceRefs',
        ),
      },
      problem,
      authorityRefs,
      productSourceFingerprintSha256: fingerprint,
      permissions,
    };
  }

  throw new Error('problem package schemaVersion must be problem-package-v1 or problem-package-v2');
}

export function parseProblemPackage(raw: string): ProblemPackage {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('problem package must be valid JSON');
  }
  return validateProblemPackage(parsed);
}
