import type { AutonomousAuthoringResponsibilityV1 } from './autonomousAuthoringContract';

export const PRESCHOOL_SHARED_NEUTRAL_CONTRACT_ID =
  'preschool-shared-neutral-passive-capacity-v1' as const;
export const PRESCHOOL_SHARED_NEUTRAL_CONTRACT_VERSION = 1 as const;
export const PRESCHOOL_SHARED_NEUTRAL_MAX_NEW_ENTRIES = 8 as const;

export const PRESCHOOL_SHARED_NEUTRAL_PRODUCTION_PATH =
  'src/data/lines/preschool-passive-spine.json' as const;

export const PRESCHOOL_SHARED_NEUTRAL_TEST_PATHS = [
  'tests/preschoolPassiveSpineTests.ts',
  'tests/annualPassiveMemoryTests.ts',
] as const;

export const PRESCHOOL_SHARED_NEUTRAL_ALLOWED_WRITE_PATHS = [
  PRESCHOOL_SHARED_NEUTRAL_PRODUCTION_PATH,
  ...PRESCHOOL_SHARED_NEUTRAL_TEST_PATHS,
] as const;

export interface PreschoolSharedNeutralAuthoringCardV1 {
  responsibilityId: string;
  primaryLifeFunction: string;
  playerVisibleNeed: string;
  developmentalAgeJustification: {
    ageMin: 4 | 5 | 6 | 7;
    whyNotEarlier: string;
    whyFromThisAge: string;
    whyThroughAgeSeven: string;
  };
  concreteSceneConcept: string;
  existingContentDistinction: {
    closestEntryIds: string[];
    sharedSemanticArea: string;
    specificDistinction: string;
  };
  actorClass: 'TRANSIENT_ROLE_ONLY';
  pastEvidenceConsumed: 'NONE';
  meaningfulPlayerDecision: 'NONE';
  durableResult: 'EVENT_HISTORY_ID_ONLY';
  futureHook: 'NONE';
  originPortability: string;
  scopeCheck: 'CONTRACT_PRESERVING';
  proposedEntry: {
    id: string;
    title: string;
    text: string;
    originTags: ['neutral'];
    ageMin: 4 | 5 | 6 | 7;
    ageMax: 7;
  };
}

export interface PreschoolSharedNeutralAuthoringPayloadV1 {
  schemaVersion: 'preschool-shared-neutral-passive-authoring-payload-v1';
  cards: PreschoolSharedNeutralAuthoringCardV1[];
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

function age(value: unknown, path: string): 4 | 5 | 6 | 7 {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 4 || value > 7) {
    throw new Error(`${path} must be an integer from 4 through 7`);
  }
  return value as 4 | 5 | 6 | 7;
}

function validateCard(value: unknown, index: number): PreschoolSharedNeutralAuthoringCardV1 {
  const path = `autonomous authoring payload.cards[${index}]`;
  assertObject(value, path);
  assertExactKeys(value, [
    'responsibilityId',
    'primaryLifeFunction',
    'playerVisibleNeed',
    'developmentalAgeJustification',
    'concreteSceneConcept',
    'existingContentDistinction',
    'actorClass',
    'pastEvidenceConsumed',
    'meaningfulPlayerDecision',
    'durableResult',
    'futureHook',
    'originPortability',
    'scopeCheck',
    'proposedEntry',
  ], path);

  assertObject(value.developmentalAgeJustification, `${path}.developmentalAgeJustification`);
  assertExactKeys(value.developmentalAgeJustification, [
    'ageMin',
    'whyNotEarlier',
    'whyFromThisAge',
    'whyThroughAgeSeven',
  ], `${path}.developmentalAgeJustification`);
  const developmentalAgeJustification = {
    ageMin: age(value.developmentalAgeJustification.ageMin, `${path}.developmentalAgeJustification.ageMin`),
    whyNotEarlier: nonEmptyString(
      value.developmentalAgeJustification.whyNotEarlier,
      `${path}.developmentalAgeJustification.whyNotEarlier`,
    ),
    whyFromThisAge: nonEmptyString(
      value.developmentalAgeJustification.whyFromThisAge,
      `${path}.developmentalAgeJustification.whyFromThisAge`,
    ),
    whyThroughAgeSeven: nonEmptyString(
      value.developmentalAgeJustification.whyThroughAgeSeven,
      `${path}.developmentalAgeJustification.whyThroughAgeSeven`,
    ),
  };

  assertObject(value.existingContentDistinction, `${path}.existingContentDistinction`);
  assertExactKeys(value.existingContentDistinction, [
    'closestEntryIds',
    'sharedSemanticArea',
    'specificDistinction',
  ], `${path}.existingContentDistinction`);
  const closestEntryIds = stringArray(
    value.existingContentDistinction.closestEntryIds,
    `${path}.existingContentDistinction.closestEntryIds`,
  );
  if (closestEntryIds.length === 0) {
    throw new Error(`${path}.existingContentDistinction.closestEntryIds must be non-empty`);
  }
  if (new Set(closestEntryIds).size !== closestEntryIds.length) {
    throw new Error(`${path}.existingContentDistinction.closestEntryIds must be unique`);
  }
  const existingContentDistinction = {
    closestEntryIds,
    sharedSemanticArea: nonEmptyString(
      value.existingContentDistinction.sharedSemanticArea,
      `${path}.existingContentDistinction.sharedSemanticArea`,
    ),
    specificDistinction: nonEmptyString(
      value.existingContentDistinction.specificDistinction,
      `${path}.existingContentDistinction.specificDistinction`,
    ),
  };

  assertObject(value.proposedEntry, `${path}.proposedEntry`);
  assertExactKeys(value.proposedEntry, [
    'id',
    'title',
    'text',
    'originTags',
    'ageMin',
    'ageMax',
  ], `${path}.proposedEntry`);
  const id = nonEmptyString(value.proposedEntry.id, `${path}.proposedEntry.id`);
  if (!/^preschool_neutral_[a-z0-9_]+$/.test(id)) {
    throw new Error(`${path}.proposedEntry.id must use the preschool_neutral_ namespace`);
  }
  if (/(?:filler|extra|capacity)/i.test(id) || /^preschool_neutral_\d+$/.test(id)) {
    throw new Error(`${path}.proposedEntry.id must have a semantic suffix`);
  }
  if (
    !Array.isArray(value.proposedEntry.originTags)
    || value.proposedEntry.originTags.length !== 1
    || value.proposedEntry.originTags[0] !== 'neutral'
  ) {
    throw new Error(`${path}.proposedEntry.originTags must be exactly ["neutral"]`);
  }
  const ageMin = age(value.proposedEntry.ageMin, `${path}.proposedEntry.ageMin`);
  if (value.proposedEntry.ageMax !== 7) {
    throw new Error(`${path}.proposedEntry.ageMax must be 7`);
  }
  if (ageMin !== developmentalAgeJustification.ageMin) {
    throw new Error(`${path}.proposedEntry.ageMin must match developmentalAgeJustification.ageMin`);
  }

  if (value.actorClass !== 'TRANSIENT_ROLE_ONLY') throw new Error(`${path}.actorClass must be TRANSIENT_ROLE_ONLY`);
  if (value.pastEvidenceConsumed !== 'NONE') throw new Error(`${path}.pastEvidenceConsumed must be NONE`);
  if (value.meaningfulPlayerDecision !== 'NONE') {
    throw new Error(`${path}.meaningfulPlayerDecision must be NONE`);
  }
  if (value.durableResult !== 'EVENT_HISTORY_ID_ONLY') {
    throw new Error(`${path}.durableResult must be EVENT_HISTORY_ID_ONLY`);
  }
  if (value.futureHook !== 'NONE') throw new Error(`${path}.futureHook must be NONE`);
  if (value.scopeCheck !== 'CONTRACT_PRESERVING') {
    throw new Error(`${path}.scopeCheck must be CONTRACT_PRESERVING`);
  }

  return {
    responsibilityId: nonEmptyString(value.responsibilityId, `${path}.responsibilityId`),
    primaryLifeFunction: nonEmptyString(value.primaryLifeFunction, `${path}.primaryLifeFunction`),
    playerVisibleNeed: nonEmptyString(value.playerVisibleNeed, `${path}.playerVisibleNeed`),
    developmentalAgeJustification,
    concreteSceneConcept: nonEmptyString(value.concreteSceneConcept, `${path}.concreteSceneConcept`),
    existingContentDistinction,
    actorClass: 'TRANSIENT_ROLE_ONLY',
    pastEvidenceConsumed: 'NONE',
    meaningfulPlayerDecision: 'NONE',
    durableResult: 'EVENT_HISTORY_ID_ONLY',
    futureHook: 'NONE',
    originPortability: nonEmptyString(value.originPortability, `${path}.originPortability`),
    scopeCheck: 'CONTRACT_PRESERVING',
    proposedEntry: {
      id,
      title: nonEmptyString(value.proposedEntry.title, `${path}.proposedEntry.title`),
      text: nonEmptyString(value.proposedEntry.text, `${path}.proposedEntry.text`),
      originTags: ['neutral'],
      ageMin,
      ageMax: 7,
    },
  };
}

export function validatePreschoolSharedNeutralPayload(
  value: unknown,
  responsibilities: AutonomousAuthoringResponsibilityV1[],
): PreschoolSharedNeutralAuthoringPayloadV1 {
  assertObject(value, 'autonomous authoring payload');
  assertExactKeys(value, ['schemaVersion', 'cards'], 'autonomous authoring payload');
  if (value.schemaVersion !== 'preschool-shared-neutral-passive-authoring-payload-v1') {
    throw new Error('autonomous authoring payload schemaVersion is invalid');
  }
  if (!Array.isArray(value.cards)) throw new Error('autonomous authoring payload.cards must be an array');
  if (!Array.isArray(responsibilities)) {
    throw new Error('autonomous authoring responsibilities must be an array');
  }
  if (value.cards.length !== responsibilities.length) {
    throw new Error('autonomous authoring payload must have one Card per responsibility');
  }
  if (value.cards.length > PRESCHOOL_SHARED_NEUTRAL_MAX_NEW_ENTRIES) {
    throw new Error(`autonomous authoring payload.cards must contain at most ${PRESCHOOL_SHARED_NEUTRAL_MAX_NEW_ENTRIES} entries`);
  }

  const cards = value.cards.map(validateCard);
  const proposedIds = cards.map(card => card.proposedEntry.id);
  if (new Set(proposedIds).size !== proposedIds.length) {
    throw new Error('autonomous authoring proposed entry ids must be unique');
  }
  cards.forEach((card, index) => {
    const responsibility = responsibilities[index]!;
    if (card.responsibilityId !== responsibility.responsibilityId) {
      throw new Error(`autonomous authoring payload.cards[${index}].responsibilityId must match responsibility order`);
    }
    if (card.primaryLifeFunction !== responsibility.primaryLifeFunction) {
      throw new Error(`autonomous authoring payload.cards[${index}].primaryLifeFunction must match its responsibility`);
    }
    if (card.playerVisibleNeed !== responsibility.playerVisibleNeed) {
      throw new Error(`autonomous authoring payload.cards[${index}].playerVisibleNeed must match its responsibility`);
    }
  });

  return {
    schemaVersion: 'preschool-shared-neutral-passive-authoring-payload-v1',
    cards,
  };
}
