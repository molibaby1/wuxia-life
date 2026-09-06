export const EXPERIENCE_PATTERN_EVIDENCE_SCHEMA_VERSION =
  'experience-pattern-evidence-v1' as const;

export type ExperiencePatternType =
  | 'absence'
  | 'frequency'
  | 'concentration'
  | 'imbalance'
  | 'variation';

export interface ExperiencePattern {
  patternId: string;
  patternType?: ExperiencePatternType;
  description: string;
  supportingRuns: string[];
  evidenceRefs: string[];
  experienceContextRefs: string[];
}

export interface ExperiencePatternEvidence {
  schemaVersion: typeof EXPERIENCE_PATTERN_EVIDENCE_SCHEMA_VERSION;
  patterns: ExperiencePattern[];
  /** SHA-256 of the canonical artifact payload without this metadata field. */
  patternEvidenceHash?: string;
}

const ROOT_KEYS = ['schemaVersion', 'patterns'] as const;
const ROOT_OPTIONAL_KEYS = ['patternEvidenceHash'] as const;
const PATTERN_KEYS = [
  'patternId',
  'description',
  'supportingRuns',
  'evidenceRefs',
  'experienceContextRefs',
] as const;
const PATTERN_OPTIONAL_KEYS = ['patternType'] as const;
const EXPERIENCE_PATTERN_TYPES: readonly ExperiencePatternType[] = [
  'absence',
  'frequency',
  'concentration',
  'imbalance',
  'variation',
];

function assertObject(value: unknown, label: string): asserts value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${label} must be an object and must not be null`);
  }
}

function assertExactKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
  label: string,
  optional: readonly string[] = [],
): void {
  const allowedSet = new Set([...allowed, ...optional]);
  for (const key of Object.keys(value)) {
    if (!allowedSet.has(key)) throw new Error(`${label} contains unknown field: ${key}`);
  }
  for (const key of allowed) {
    if (!(key in value)) throw new Error(`${label} missing required field: ${key}`);
  }
}

function parsePatternType(value: unknown): ExperiencePatternType {
  if (typeof value !== 'string' || !EXPERIENCE_PATTERN_TYPES.includes(value as ExperiencePatternType)) {
    throw new Error(`patterns.patternType has invalid value: ${String(value)}`);
  }
  return value as ExperiencePatternType;
}

function assertNonEmptyString(value: unknown, path: string): asserts value is string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${path} must be a non-empty string`);
  }
}

function assertUniqueStringArray(
  value: unknown,
  path: string,
  minimumLength: number,
): asserts value is string[] {
  if (!Array.isArray(value)) throw new Error(`${path} must be an array`);
  if (value.length < minimumLength) {
    throw new Error(`${path} must contain at least ${minimumLength} item(s)`);
  }
  const seen = new Set<string>();
  value.forEach((item, index) => {
    assertNonEmptyString(item, `${path}[${index}]`);
    if (seen.has(item)) throw new Error(`${path} contains duplicate value: ${item}`);
    seen.add(item);
  });
}

function assertNoNull(value: unknown, path: string): void {
  if (value === null) throw new Error(`${path} must not contain null`);
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoNull(item, `${path}[${index}]`));
    return;
  }
  if (typeof value === 'object' && value !== null) {
    for (const [key, child] of Object.entries(value)) assertNoNull(child, `${path}.${key}`);
  }
}

function parsePattern(value: unknown, index: number): ExperiencePattern {
  const path = `patterns[${index}]`;
  assertObject(value, path);
  assertExactKeys(value, PATTERN_KEYS, path, PATTERN_OPTIONAL_KEYS);
  assertNonEmptyString(value.patternId, `${path}.patternId`);
  assertNonEmptyString(value.description, `${path}.description`);
  assertUniqueStringArray(value.supportingRuns, `${path}.supportingRuns`, 2);
  assertUniqueStringArray(value.evidenceRefs, `${path}.evidenceRefs`, 1);
  assertUniqueStringArray(value.experienceContextRefs, `${path}.experienceContextRefs`, 1);
  const pattern: ExperiencePattern = {
    patternId: value.patternId,
    description: value.description,
    supportingRuns: [...value.supportingRuns],
    evidenceRefs: [...value.evidenceRefs],
    experienceContextRefs: [...value.experienceContextRefs],
  };
  if ('patternType' in value) pattern.patternType = parsePatternType(value.patternType);
  return pattern;
}

export function validateExperiencePatternEvidence(value: unknown): ExperiencePatternEvidence {
  assertObject(value, 'experience pattern evidence');
  assertNoNull(value, 'experience pattern evidence');
  assertExactKeys(value, ROOT_KEYS, 'experience pattern evidence', ROOT_OPTIONAL_KEYS);
  if (value.schemaVersion !== EXPERIENCE_PATTERN_EVIDENCE_SCHEMA_VERSION) {
    throw new Error(
      `unsupported experience pattern evidence schemaVersion: ${String(value.schemaVersion)}`,
    );
  }
  if (!Array.isArray(value.patterns)) {
    throw new Error('experience pattern evidence.patterns must be an array');
  }
  const patternEvidenceHash = value.patternEvidenceHash;
  let normalizedPatternEvidenceHash: string | undefined;
  if (patternEvidenceHash !== undefined) {
    assertNonEmptyString(patternEvidenceHash, 'experience pattern evidence.patternEvidenceHash');
    if (!/^[a-f0-9]{64}$/.test(patternEvidenceHash)) {
      throw new Error('experience pattern evidence.patternEvidenceHash must be a SHA-256 hex string');
    }
    normalizedPatternEvidenceHash = patternEvidenceHash;
  }
  const patterns = value.patterns.map(parsePattern);
  const patternIds = new Set<string>();
  for (const pattern of patterns) {
    if (patternIds.has(pattern.patternId)) {
      throw new Error(`experience pattern evidence contains duplicate patternId: ${pattern.patternId}`);
    }
    patternIds.add(pattern.patternId);
  }
  return {
    schemaVersion: EXPERIENCE_PATTERN_EVIDENCE_SCHEMA_VERSION,
    patterns,
    ...(normalizedPatternEvidenceHash !== undefined
      ? { patternEvidenceHash: normalizedPatternEvidenceHash }
      : {}),
  };
}

export function serializeExperiencePatternEvidence(value: ExperiencePatternEvidence): string {
  return JSON.stringify(validateExperiencePatternEvidence(value));
}
