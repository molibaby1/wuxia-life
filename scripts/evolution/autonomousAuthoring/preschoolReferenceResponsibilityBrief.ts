import { readFile } from 'node:fs/promises';
import { sha256Hex } from '../phase0/provenance';

export const PRESCHOOL_REFERENCE_VALIDATION_LAYER =
  'HISTORICAL_CONTROLLED_DOWNSTREAM_MECHANISM' as const;

export const PRESCHOOL_REFERENCE_RESPONSIBILITY_PROVENANCE =
  'HUMAN_APPROVED_REFERENCE_RESPONSIBILITIES' as const;

export const PRESCHOOL_REFERENCE_TRIAL_ACCEPTED_RESPONSIBILITY_BRIEF_SHA256 =
  '864f99ffa26d41631e329c229a7289bef2e9998fe04eb4c25ef51dcf5b99980a' as const;

export interface PreschoolReferenceResponsibilityV1 {
  responsibilityRef: string;
  primaryLifeFunction: string;
  playerVisibleNeed: string;
}

export interface PreschoolReferenceResponsibilityBriefV1 {
  schemaVersion: 'preschool-reference-responsibility-brief-v1';
  runRef: typeof import('./runPreschoolReferenceTrial').PRESCHOOL_REFERENCE_TRIAL_RUN_REF;
  responsibilities: PreschoolReferenceResponsibilityV1[];
}

export interface PreschoolReferenceResponsibilityAttestationV1 {
  schemaVersion: 'preschool-reference-responsibility-attestation-v1';
  runRef: PreschoolReferenceResponsibilityBriefV1['runRef'];
  validationLayer: typeof PRESCHOOL_REFERENCE_VALIDATION_LAYER;
  responsibilityProvenance: typeof PRESCHOOL_REFERENCE_RESPONSIBILITY_PROVENANCE;
  referenceResponsibilityBriefRef: 'source/reference-trial/reference-responsibility-brief.json';
  referenceResponsibilityBriefSha256: string;
}

type RecordValue = Record<string, unknown>;

function assertRecord(value: unknown, path: string): asserts value is RecordValue {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(path + ' must be an object');
  }
}

function assertExactKeys(value: RecordValue, required: readonly string[], path: string): void {
  const allowed = new Set(required);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) throw new Error(path + ' contains unknown field: ' + key);
  }
  for (const key of required) {
    if (!(key in value)) throw new Error(path + ' is missing field: ' + key);
  }
}

function nonEmptyString(value: unknown, path: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(path + ' must be a non-empty string');
  }
  return value;
}

export function validatePreschoolReferenceResponsibilityBrief(
  value: unknown,
): PreschoolReferenceResponsibilityBriefV1 {
  const path = 'preschool reference responsibility brief';
  assertRecord(value, path);
  assertExactKeys(value, ['schemaVersion', 'runRef', 'responsibilities'], path);
  if (value.schemaVersion !== 'preschool-reference-responsibility-brief-v1') {
    throw new Error(path + '.schemaVersion is invalid');
  }
  if (value.runRef !== 'preschool-pver-20260922231805-71297571') {
    throw new Error(path + '.runRef is invalid');
  }
  if (!Array.isArray(value.responsibilities)
    || value.responsibilities.length < 1
    || value.responsibilities.length > 8) {
    throw new Error(path + '.responsibilities must contain 1 through 8 items');
  }
  const responsibilities = value.responsibilities.map((item: unknown, index: number) => {
    const itemPath = path + '.responsibilities[' + index + ']';
    assertRecord(item, itemPath);
    assertExactKeys(item, ['responsibilityRef', 'primaryLifeFunction', 'playerVisibleNeed'], itemPath);
    const responsibilityRef = 'reference-responsibility-' + String(index + 1).padStart(6, '0');
    if (item.responsibilityRef !== responsibilityRef) {
      throw new Error(itemPath + '.responsibilityRef must be ' + responsibilityRef + ' in participant order');
    }
    return {
      responsibilityRef,
      primaryLifeFunction: nonEmptyString(item.primaryLifeFunction, itemPath + '.primaryLifeFunction'),
      playerVisibleNeed: nonEmptyString(item.playerVisibleNeed, itemPath + '.playerVisibleNeed'),
    };
  });
  return {
    schemaVersion: 'preschool-reference-responsibility-brief-v1',
    runRef: 'preschool-pver-20260922231805-71297571',
    responsibilities,
  };
}

export interface AcceptedPreschoolReferenceResponsibilityBrief {
  brief: PreschoolReferenceResponsibilityBriefV1;
  bytes: Buffer;
  sha256: string;
}

export type PreschoolReferenceResponsibilityBriefUnavailableReason =
  | 'Reference Responsibility Brief path was not supplied.'
  | 'Reference Responsibility Brief file could not be read.'
  | 'Reference Responsibility Brief digest did not match the accepted digest.'
  | 'Reference Responsibility Brief is malformed JSON.'
  | 'Reference Responsibility Brief schema or runRef is invalid.';

export async function readAcceptedPreschoolReferenceResponsibilityBrief(
  path: string | null | undefined,
): Promise<
  | { ok: true; value: AcceptedPreschoolReferenceResponsibilityBrief }
  | { ok: false; reason: PreschoolReferenceResponsibilityBriefUnavailableReason }
> {
  if (typeof path !== 'string' || path.length === 0) {
    return { ok: false, reason: 'Reference Responsibility Brief path was not supplied.' };
  }
  let bytes: Buffer;
  try {
    bytes = await readFile(path);
  } catch {
    return { ok: false, reason: 'Reference Responsibility Brief file could not be read.' };
  }
  const sha256 = sha256Hex(bytes);
  const digestMatches = sha256 === PRESCHOOL_REFERENCE_TRIAL_ACCEPTED_RESPONSIBILITY_BRIEF_SHA256;
  let parsed: unknown;
  try {
    parsed = JSON.parse(bytes.toString('utf8')) as unknown;
  } catch {
    return { ok: false, reason: 'Reference Responsibility Brief is malformed JSON.' };
  }
  let brief: PreschoolReferenceResponsibilityBriefV1;
  try {
    brief = validatePreschoolReferenceResponsibilityBrief(parsed);
  } catch {
    return { ok: false, reason: 'Reference Responsibility Brief schema or runRef is invalid.' };
  }
  if (!digestMatches) {
    return { ok: false, reason: 'Reference Responsibility Brief digest did not match the accepted digest.' };
  }
  return { ok: true, value: { brief, bytes, sha256 } };
}
