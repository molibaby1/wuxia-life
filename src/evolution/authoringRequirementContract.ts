export type AuthoringRequirementSourceKindV1 = 'HUMAN_DIRECT' | 'DIAGNOSED_PROBLEM';

export interface AuthoringRequirementV1 {
  schemaVersion: 'authoring-requirement-v1';
  requirementId: string;
  source: {
    kind: AuthoringRequirementSourceKindV1;
    refs: string[];
  };
  authorityRefs: string[];
  target: 'FORMAL_EVENT';
  intent: string;
  requiredContext: string[];
  desiredPlayerExperience: string;
  scopeConstraints: string[];
}

type RecordValue = Record<string, unknown>;

function assertObject(value: unknown, path: string): asserts value is RecordValue {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${path} must be an object`);
  }
}

function assertExactKeys(value: RecordValue, required: readonly string[], path: string): void {
  const allowed = new Set(required);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) throw new Error(`${path} contains unknown field: ${key}`);
  }
  for (const key of required) {
    if (!(key in value)) throw new Error(`${path} is missing field: ${key}`);
  }
}

function nonEmptyString(value: unknown, path: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${path} must be a non-empty string`);
  }
  return value;
}

function nonEmptyStringArray(value: unknown, path: string): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${path} must be a non-empty array`);
  }
  return value.map((item, index) => nonEmptyString(item, `${path}[${index}]`));
}

export function validateAuthoringRequirementV1(value: unknown): AuthoringRequirementV1 {
  assertObject(value, 'authoring requirement');
  assertExactKeys(value, [
    'schemaVersion',
    'requirementId',
    'source',
    'authorityRefs',
    'target',
    'intent',
    'requiredContext',
    'desiredPlayerExperience',
    'scopeConstraints',
  ], 'authoring requirement');
  if (value.schemaVersion !== 'authoring-requirement-v1') {
    throw new Error('authoring requirement schemaVersion must be authoring-requirement-v1');
  }
  assertObject(value.source, 'authoring requirement.source');
  assertExactKeys(value.source, ['kind', 'refs'], 'authoring requirement.source');
  if (value.source.kind !== 'HUMAN_DIRECT' && value.source.kind !== 'DIAGNOSED_PROBLEM') {
    throw new Error('authoring requirement.source.kind has an unknown value');
  }
  if (value.target !== 'FORMAL_EVENT') {
    throw new Error('authoring requirement.target must be FORMAL_EVENT');
  }
  return {
    schemaVersion: 'authoring-requirement-v1',
    requirementId: nonEmptyString(value.requirementId, 'authoring requirement.requirementId'),
    source: {
      kind: value.source.kind,
      refs: nonEmptyStringArray(value.source.refs, 'authoring requirement.source.refs'),
    },
    authorityRefs: nonEmptyStringArray(value.authorityRefs, 'authoring requirement.authorityRefs'),
    target: 'FORMAL_EVENT',
    intent: nonEmptyString(value.intent, 'authoring requirement.intent'),
    requiredContext: nonEmptyStringArray(value.requiredContext, 'authoring requirement.requiredContext'),
    desiredPlayerExperience: nonEmptyString(
      value.desiredPlayerExperience,
      'authoring requirement.desiredPlayerExperience',
    ),
    scopeConstraints: nonEmptyStringArray(value.scopeConstraints, 'authoring requirement.scopeConstraints'),
  };
}
