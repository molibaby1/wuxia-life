export type BoundedCausalAttributionKind = 'event' | 'action' | 'unavailable';

export type BoundedCausalAttribution =
  | {
    kind: 'event';
    producerRef: string;
    selectedChoiceRef?: string;
  }
  | {
    kind: 'action';
    producerRef: string;
  }
  | {
    kind: 'unavailable';
  };

export interface BoundedCausalAttributionItem {
  observableEntryRef: string;
  sourceSequence: number;
  sourceKind: string;
  age?: number;
  attribution: BoundedCausalAttribution;
}

export interface BoundedCausalAttributionV1 {
  schemaVersion: 'bounded-causal-attribution-v1';
  sourceRunRef: string;
  sourceExperimentRootHash: string;
  observablePayloadSha256: string;
  hypothesisId: string;
  items: BoundedCausalAttributionItem[];
}

const ROOT_KEYS = [
  'schemaVersion',
  'sourceRunRef',
  'sourceExperimentRootHash',
  'observablePayloadSha256',
  'hypothesisId',
  'items',
] as const;

const ITEM_KEYS = [
  'observableEntryRef',
  'sourceSequence',
  'sourceKind',
  'age',
  'attribution',
] as const;

const EVENT_KEYS = ['kind', 'producerRef', 'selectedChoiceRef'] as const;
const ACTION_KEYS = ['kind', 'producerRef'] as const;
const UNAVAILABLE_KEYS = ['kind'] as const;

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
    if (key === 'age' || key === 'selectedChoiceRef') continue;
    if (!(key in value)) throw new Error(`${label} is missing field: ${key}`);
  }
}

function nonEmptyString(value: unknown, path: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${path} must be a non-empty string`);
  }
  return value;
}

function assertSha256(value: unknown, path: string): string {
  const hex = nonEmptyString(value, path);
  if (!/^[a-f0-9]{64}$/.test(hex)) {
    throw new Error(`${path} must be a SHA-256 hex string`);
  }
  return hex;
}

function parseAttribution(value: unknown, path: string): BoundedCausalAttribution {
  assertObject(value, path);
  const kind = value.kind;
  if (kind === 'event') {
    assertExactKeys(value, EVENT_KEYS, path);
    const attribution: BoundedCausalAttribution = {
      kind: 'event',
      producerRef: nonEmptyString(value.producerRef, `${path}.producerRef`),
    };
    if ('selectedChoiceRef' in value) {
      attribution.selectedChoiceRef = nonEmptyString(
        value.selectedChoiceRef,
        `${path}.selectedChoiceRef`,
      );
    }
    return attribution;
  }
  if (kind === 'action') {
    assertExactKeys(value, ACTION_KEYS, path);
    return {
      kind: 'action',
      producerRef: nonEmptyString(value.producerRef, `${path}.producerRef`),
    };
  }
  if (kind === 'unavailable') {
    assertExactKeys(value, UNAVAILABLE_KEYS, path);
    return { kind: 'unavailable' };
  }
  throw new Error(`${path}.kind must be event, action, or unavailable`);
}

function parseItem(value: unknown, index: number): BoundedCausalAttributionItem {
  const path = `bounded causal attribution.items[${index}]`;
  assertObject(value, path);
  assertExactKeys(value, ITEM_KEYS, path);
  const item: BoundedCausalAttributionItem = {
    observableEntryRef: nonEmptyString(value.observableEntryRef, `${path}.observableEntryRef`),
    sourceSequence: (() => {
      if (typeof value.sourceSequence !== 'number' || !Number.isInteger(value.sourceSequence)) {
        throw new Error(`${path}.sourceSequence must be an integer`);
      }
      return value.sourceSequence;
    })(),
    sourceKind: nonEmptyString(value.sourceKind, `${path}.sourceKind`),
    attribution: parseAttribution(value.attribution, `${path}.attribution`),
  };
  if ('age' in value) {
    if (typeof value.age !== 'number' || !Number.isInteger(value.age)) {
      throw new Error(`${path}.age must be an integer`);
    }
    item.age = value.age;
  }
  return item;
}

export function validateBoundedCausalAttribution(value: unknown): BoundedCausalAttributionV1 {
  assertObject(value, 'bounded causal attribution');
  assertExactKeys(value, ROOT_KEYS, 'bounded causal attribution');
  if (value.schemaVersion !== 'bounded-causal-attribution-v1') {
    throw new Error('bounded causal attribution schemaVersion must be bounded-causal-attribution-v1');
  }
  if (!Array.isArray(value.items)) {
    throw new Error('bounded causal attribution.items must be an array');
  }
  const items = value.items.map((item, index) => parseItem(item, index));
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.observableEntryRef)) {
      throw new Error(
        `bounded causal attribution.items contains duplicate observableEntryRef: ${item.observableEntryRef}`,
      );
    }
    seen.add(item.observableEntryRef);
  }
  return {
    schemaVersion: 'bounded-causal-attribution-v1',
    sourceRunRef: nonEmptyString(value.sourceRunRef, 'bounded causal attribution.sourceRunRef'),
    sourceExperimentRootHash: assertSha256(
      value.sourceExperimentRootHash,
      'bounded causal attribution.sourceExperimentRootHash',
    ),
    observablePayloadSha256: assertSha256(
      value.observablePayloadSha256,
      'bounded causal attribution.observablePayloadSha256',
    ),
    hypothesisId: nonEmptyString(value.hypothesisId, 'bounded causal attribution.hypothesisId'),
    items,
  };
}

export function parseBoundedCausalAttribution(raw: string): BoundedCausalAttributionV1 {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('bounded causal attribution must be valid JSON');
  }
  return validateBoundedCausalAttribution(parsed);
}
