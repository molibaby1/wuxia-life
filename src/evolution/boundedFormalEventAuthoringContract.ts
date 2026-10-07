import { ConditionEvaluator } from '../core/ConditionEvaluator';
import type { GameState, StatusId } from '../types/eventTypes';
import { LIFE_STATE_KEYS, STATUS_ID_VALUES } from '../types/eventTypes';
import {
  validateAuthoringRequirementV1,
  type AuthoringRequirementV1,
} from './authoringRequirementContract';
import { HUMAN_DIRECT_FORMAL_EVENT_REFERENCE_REQUIREMENT } from './boundedFormalEventReferenceRequirement';

export const BOUNDED_FORMAL_EVENT_CONTRACT_ID = 'bounded-formal-event-authoring-v1' as const;
export const BOUNDED_FORMAL_EVENT_CONTRACT_VERSION = 1 as const;
export const BOUNDED_FORMAL_EVENT_MAX_NEW_EVENTS = 1 as const;
export const BOUNDED_FORMAL_EVENT_PRODUCTION_PATH = 'src/data/lines/p22-content-expansions.json' as const;
export const BOUNDED_FORMAL_EVENT_TEST_PATH = 'tests/evolution/boundedFormalEventAuthoring.test.ts' as const;
export const BOUNDED_FORMAL_EVENT_ALLOWED_WRITE_PATHS = [
  BOUNDED_FORMAL_EVENT_PRODUCTION_PATH,
  BOUNDED_FORMAL_EVENT_TEST_PATH,
] as const;

export const BOUNDED_FORMAL_EVENT_HABIT_PRECEDENTS = {
  trainingHabit: {
    eventId: 'p42_training_habit_youth_sparring',
    sourcePath: 'src/data/lines/p22-content-expansions.json',
    expression: 'lifeStates.trainingHabit >= 2',
  },
  businessHabit: {
    eventId: 'p42_business_habit_youth_stall',
    sourcePath: 'src/data/lines/merchant.json',
    expression: 'lifeStates.businessHabit >= 2',
  },
} as const;

const STAT_TARGETS = [
  'martialPower',
  'constitution',
  'chivalry',
  'reputation',
  'connections',
  'knowledge',
] as const;

export const BOUNDED_FORMAL_EVENT_AUTHORING_SAFE_PROJECTION_V1 = {
  contractId: BOUNDED_FORMAL_EVENT_CONTRACT_ID,
  contractVersion: BOUNDED_FORMAL_EVENT_CONTRACT_VERSION,
  maxNewEvents: BOUNDED_FORMAL_EVENT_MAX_NEW_EVENTS,
  allowedWritePaths: BOUNDED_FORMAL_EVENT_ALLOWED_WRITE_PATHS,
  event: {
    categories: ['main_story', 'side_quest'],
    priorities: [0, 1, 2, 3],
    requiredTrigger: { type: 'age_reach', count: 1 },
    requiredCondition: {
      type: 'expression',
      allowedExpressions: [
        'lifeStates.trainingHabit >= 2 && lifeStates.businessHabit >= 2',
        'lifeStates.businessHabit >= 2 && lifeStates.trainingHabit >= 2',
      ],
    },
    eventTypes: ['choice', 'auto'],
  },
  allowedEffects: {
    statModifyTargets: STAT_TARGETS,
    lifeStateChangeTargets: LIFE_STATE_KEYS,
    statusIds: STATUS_ID_VALUES,
  },
  narrativeContinuity: {
    required: ['pastEvidenceRefs', 'presentRequiredContextIndexes', 'futureOutcomeRefs'],
    futureHook: 'NONE',
  },
  forbidden: [
    'multiple Events',
    'new Person or Relationship progression',
    'new state, stat, fact, flag, scheduler, Runtime, or Schema semantics',
    'random, special, ending, or faction effects',
  ],
} as const;

export type BoundedFormalEventEffectV1 =
  | {
      type: 'stat_modify';
      target: (typeof STAT_TARGETS)[number];
      value: number;
      operator: 'add' | 'subtract' | 'multiply' | 'divide';
    }
  | {
      type: 'life_state_change';
      target: (typeof LIFE_STATE_KEYS)[number];
      value: number;
    }
  | { type: 'status_add' | 'status_remove'; status: StatusId };

export interface BoundedFormalEventV1 {
  id: string;
  version: string;
  category: 'main_story' | 'side_quest';
  priority: 0 | 1 | 2 | 3;
  weight: number;
  ageRange: { min: number; max: number };
  triggers: [{ type: 'age_reach'; value: number }];
  conditions: [{ type: 'expression'; expression: string }];
  content: { title: string; text: string; description?: string };
  eventType: 'choice' | 'auto';
  choices?: Array<{
    id: string;
    text: string;
    effects: BoundedFormalEventEffectV1[];
  }>;
  autoEffects?: BoundedFormalEventEffectV1[];
}

export type BoundedFormalEventOutcomeRefV1 =
  | { kind: 'choice_effect'; choiceId: string; effectIndex: number }
  | { kind: 'auto_effect'; effectIndex: number };

export interface BoundedFormalEventPayloadV1 {
  events: [BoundedFormalEventV1];
  narrativeContinuity: {
    pastEvidenceRefs: string[];
    presentRequiredContextIndexes: number[];
    presentNarrativePath: 'content.text';
    futureOutcomeRefs: BoundedFormalEventOutcomeRefV1[];
    futureHook: 'NONE';
  };
}

export type FormalEventApplicabilityStatusV1 =
  | 'APPLICABLE'
  | 'NOT_APPLICABLE'
  | 'INSUFFICIENT_EVIDENCE'
  | 'CONTRACT_CHANGE_REQUIRED';

export type BoundedFormalEventOutOfContractRequirementV1 =
  | 'PERSISTENT_PERSON'
  | 'NEW_RUNTIME_OR_SCHEMA'
  | 'SECOND_EVENT';

export interface BoundedFormalEventRequirementBoundaryEvidenceV1 {
  requirementId: string;
  sourceRef: string;
  requiredCapability: BoundedFormalEventOutOfContractRequirementV1;
}

export interface BoundedFormalEventPredicateSourceV1 {
  path: string;
  events: readonly unknown[];
}

export interface BoundedFormalEventPredicateEvidenceV1 {
  status: 'SUPPORTED' | 'INSUFFICIENT_EVIDENCE';
  thresholds: { trainingHabit: 2; businessHabit: 2 } | null;
  evidenceRefs: string[];
  expressions: string[];
  reasons: string[];
}

export interface BoundedFormalEventApplicabilityV1 {
  status: FormalEventApplicabilityStatusV1;
  evidence: BoundedFormalEventPredicateEvidenceV1;
  requirementBoundaryEvidence: BoundedFormalEventRequirementBoundaryEvidenceV1 | null;
  observedLifeStates: { trainingHabit: number; businessHabit: number } | null;
  reasons: string[];
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
    if (!allowed.has(key)) throw new Error(`${path} contains unauthorized field: ${key}`);
  }
  for (const key of required) {
    if (!(key in value)) throw new Error(`${path} is missing field: ${key}`);
  }
}

function nonEmptyString(value: unknown, path: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) throw new Error(`${path} must be a non-empty string`);
  return value;
}

function nonEmptyStringArray(value: unknown, path: string): string[] {
  if (!Array.isArray(value) || value.length === 0) throw new Error(`${path} must be a non-empty array`);
  return value.map((item, index) => nonEmptyString(item, `${path}[${index}]`));
}

function finiteNumber(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`${path} must be a finite number`);
  return value;
}

function nonNegativeInteger(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new Error(`${path} must be a non-negative integer`);
  }
  return value;
}

function validateEffect(value: unknown, path: string): BoundedFormalEventEffectV1 {
  assertObject(value, path);
  if (value.type === 'stat_modify') {
    assertExactKeys(value, ['type', 'target', 'value', 'operator'], path);
    if (typeof value.target !== 'string' || !(STAT_TARGETS as readonly string[]).includes(value.target)) {
      throw new Error(`${path}.target is not an existing authorized stat`);
    }
    if (!['add', 'subtract', 'multiply', 'divide'].includes(String(value.operator))) {
      throw new Error(`${path}.operator is invalid`);
    }
    const number = finiteNumber(value.value, `${path}.value`);
    if (value.operator === 'divide' && number === 0) throw new Error(`${path}.value cannot divide by zero`);
    return {
      type: 'stat_modify',
      target: value.target as (typeof STAT_TARGETS)[number],
      value: number,
      operator: value.operator as 'add' | 'subtract' | 'multiply' | 'divide',
    };
  }
  if (value.type === 'life_state_change') {
    assertExactKeys(value, ['type', 'target', 'value'], path);
    if (typeof value.target !== 'string' || !(LIFE_STATE_KEYS as readonly string[]).includes(value.target)) {
      throw new Error(`${path}.target is not an existing life state`);
    }
    return {
      type: 'life_state_change',
      target: value.target as (typeof LIFE_STATE_KEYS)[number],
      value: finiteNumber(value.value, `${path}.value`),
    };
  }
  if (value.type === 'status_add' || value.type === 'status_remove') {
    assertExactKeys(value, ['type', 'status'], path);
    if (typeof value.status !== 'string' || !(STATUS_ID_VALUES as readonly string[]).includes(value.status)) {
      throw new Error(`${path}.status is not an existing StatusId`);
    }
    return { type: value.type, status: value.status as StatusId };
  }
  throw new Error(`${path}.type is not an authorized Formal Event effect`);
}

function validateEvent(value: unknown, index: number): BoundedFormalEventV1 {
  const path = `bounded Formal Event payload.events[${index}]`;
  assertObject(value, path);
  const allowed = [
    'id', 'version', 'category', 'priority', 'weight', 'ageRange', 'triggers',
    'conditions', 'content', 'eventType', 'choices', 'autoEffects',
  ];
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) throw new Error(`${path} contains unauthorized field: ${key}`);
  }
  for (const key of ['id', 'version', 'category', 'priority', 'weight', 'ageRange', 'triggers', 'conditions', 'content', 'eventType']) {
    if (!(key in value)) throw new Error(`${path} is missing field: ${key}`);
  }
  const id = nonEmptyString(value.id, `${path}.id`);
  if (!/^[a-z][a-z0-9_]*$/.test(id)) throw new Error(`${path}.id must be a lower snake-case Event ID`);
  const version = nonEmptyString(value.version, `${path}.version`);
  if (value.category !== 'main_story' && value.category !== 'side_quest') {
    throw new Error(`${path}.category is outside the ordinary Formal Event categories`);
  }
  if (![0, 1, 2, 3].includes(value.priority as number)) throw new Error(`${path}.priority is invalid`);
  const weight = finiteNumber(value.weight, `${path}.weight`);
  if (weight <= 0) throw new Error(`${path}.weight must be positive`);

  assertObject(value.ageRange, `${path}.ageRange`);
  assertExactKeys(value.ageRange, ['min', 'max'], `${path}.ageRange`);
  const minAge = nonNegativeInteger(value.ageRange.min, `${path}.ageRange.min`);
  const maxAge = nonNegativeInteger(value.ageRange.max, `${path}.ageRange.max`);
  if (minAge === 0 || maxAge < minAge) throw new Error(`${path}.ageRange is invalid`);

  if (!Array.isArray(value.triggers) || value.triggers.length !== 1) {
    throw new Error(`${path}.triggers must contain exactly one age_reach trigger`);
  }
  const trigger = value.triggers[0];
  assertObject(trigger, `${path}.triggers[0]`);
  assertExactKeys(trigger, ['type', 'value'], `${path}.triggers[0]`);
  const triggerAge = nonNegativeInteger(trigger.value, `${path}.triggers[0].value`);
  if (trigger.type !== 'age_reach' || triggerAge < minAge || triggerAge > maxAge) {
    throw new Error(`${path}.triggers[0] must be an age_reach trigger within ageRange`);
  }

  if (!Array.isArray(value.conditions) || value.conditions.length !== 1) {
    throw new Error(`${path}.conditions must contain exactly the bounded habit predicate`);
  }
  const condition = value.conditions[0];
  assertObject(condition, `${path}.conditions[0]`);
  assertExactKeys(condition, ['type', 'expression'], `${path}.conditions[0]`);
  const expression = nonEmptyString(condition.expression, `${path}.conditions[0].expression`).replace(/\s+/g, ' ').trim();
  const allowedPredicates = [
    'lifeStates.trainingHabit >= 2 && lifeStates.businessHabit >= 2',
    'lifeStates.businessHabit >= 2 && lifeStates.trainingHabit >= 2',
  ];
  if (condition.type !== 'expression' || !allowedPredicates.includes(expression)) {
    throw new Error(`${path}.conditions[0] must require both P22 habit predicates`);
  }

  assertObject(value.content, `${path}.content`);
  const contentKeys = ['title', 'text', 'description'];
  for (const key of Object.keys(value.content)) {
    if (!contentKeys.includes(key)) throw new Error(`${path}.content contains unauthorized field: ${key}`);
  }
  if (!('title' in value.content) || !('text' in value.content)) {
    throw new Error(`${path}.content requires title and text`);
  }
  const content = {
    title: nonEmptyString(value.content.title, `${path}.content.title`),
    text: nonEmptyString(value.content.text, `${path}.content.text`),
    ...(value.content.description === undefined
      ? {}
      : { description: nonEmptyString(value.content.description, `${path}.content.description`) }),
  };

  if (value.eventType === 'auto') {
    if ('choices' in value) throw new Error(`${path}.choices is forbidden for auto events`);
    if (!Array.isArray(value.autoEffects) || value.autoEffects.length === 0) {
      throw new Error(`${path}.autoEffects must be non-empty for auto events`);
    }
    return {
      id,
      version,
      category: value.category,
      priority: value.priority as 0 | 1 | 2 | 3,
      weight,
      ageRange: { min: minAge, max: maxAge },
      triggers: [{ type: 'age_reach', value: triggerAge }],
      conditions: [{ type: 'expression', expression }],
      content,
      eventType: 'auto',
      autoEffects: value.autoEffects.map((effect, effectIndex) => validateEffect(effect, `${path}.autoEffects[${effectIndex}]`)),
    };
  }
  if (value.eventType === 'choice') {
    if ('autoEffects' in value) throw new Error(`${path}.autoEffects is forbidden for choice events`);
    if (!Array.isArray(value.choices) || value.choices.length === 0) {
      throw new Error(`${path}.choices must be non-empty for choice events`);
    }
    const choices = value.choices.map((choice, choiceIndex) => {
      const choicePath = `${path}.choices[${choiceIndex}]`;
      assertObject(choice, choicePath);
      assertExactKeys(choice, ['id', 'text', 'effects'], choicePath);
      const choiceId = nonEmptyString(choice.id, `${choicePath}.id`);
      if (!Array.isArray(choice.effects) || choice.effects.length === 0) {
        throw new Error(`${choicePath}.effects must be non-empty`);
      }
      return {
        id: choiceId,
        text: nonEmptyString(choice.text, `${choicePath}.text`),
        effects: choice.effects.map((effect, effectIndex) => validateEffect(effect, `${choicePath}.effects[${effectIndex}]`)),
      };
    });
    if (new Set(choices.map(choice => choice.id)).size !== choices.length) {
      throw new Error(`${path}.choices contains duplicate choice IDs`);
    }
    return {
      id,
      version,
      category: value.category,
      priority: value.priority as 0 | 1 | 2 | 3,
      weight,
      ageRange: { min: minAge, max: maxAge },
      triggers: [{ type: 'age_reach', value: triggerAge }],
      conditions: [{ type: 'expression', expression }],
      content,
      eventType: 'choice',
      choices,
    };
  }
  throw new Error(`${path}.eventType must be choice or auto; ending is forbidden`);
}

function validateOutcomeRef(value: unknown, event: BoundedFormalEventV1, path: string): BoundedFormalEventOutcomeRefV1 {
  assertObject(value, path);
  if (value.kind === 'auto_effect') {
    assertExactKeys(value, ['kind', 'effectIndex'], path);
    const effectIndex = nonNegativeInteger(value.effectIndex, `${path}.effectIndex`);
    if (event.eventType !== 'auto' || effectIndex >= (event.autoEffects?.length ?? 0)) {
      throw new Error(`${path} does not reference an existing auto effect`);
    }
    return { kind: 'auto_effect', effectIndex };
  }
  if (value.kind === 'choice_effect') {
    assertExactKeys(value, ['kind', 'choiceId', 'effectIndex'], path);
    const choiceId = nonEmptyString(value.choiceId, `${path}.choiceId`);
    const effectIndex = nonNegativeInteger(value.effectIndex, `${path}.effectIndex`);
    const choice = event.choices?.find(item => item.id === choiceId);
    if (event.eventType !== 'choice' || !choice || effectIndex >= choice.effects.length) {
      throw new Error(`${path} does not reference an existing choice effect`);
    }
    return { kind: 'choice_effect', choiceId, effectIndex };
  }
  throw new Error(`${path}.kind is invalid`);
}

export function validateBoundedFormalEventPayload(
  value: unknown,
  requirementValue: AuthoringRequirementV1 | unknown,
  existingEventIds: readonly string[] = [],
): BoundedFormalEventPayloadV1 {
  const requirement = validateAuthoringRequirementV1(requirementValue);
  assertObject(value, 'bounded Formal Event payload');
  assertExactKeys(value, ['events', 'narrativeContinuity'], 'bounded Formal Event payload');
  if (!Array.isArray(value.events) || value.events.length !== BOUNDED_FORMAL_EVENT_MAX_NEW_EVENTS) {
    throw new Error('bounded Formal Event payload must contain exactly one Event');
  }
  const event = validateEvent(value.events[0], 0);
  if (existingEventIds.includes(event.id)) throw new Error(`Formal Event ID already exists: ${event.id}`);

  assertObject(value.narrativeContinuity, 'bounded Formal Event payload.narrativeContinuity');
  assertExactKeys(value.narrativeContinuity, [
    'pastEvidenceRefs',
    'presentRequiredContextIndexes',
    'presentNarrativePath',
    'futureOutcomeRefs',
    'futureHook',
  ], 'bounded Formal Event payload.narrativeContinuity');
  const pastEvidenceRefs = nonEmptyStringArray(
    value.narrativeContinuity.pastEvidenceRefs,
    'bounded Formal Event payload.narrativeContinuity.pastEvidenceRefs',
  );
  if (pastEvidenceRefs.some(ref => !requirement.source.refs.includes(ref))) {
    throw new Error('bounded Formal Event continuity pastEvidenceRefs must come from the Requirement source');
  }
  if (!Array.isArray(value.narrativeContinuity.presentRequiredContextIndexes)) {
    throw new Error('bounded Formal Event continuity presentRequiredContextIndexes must be an array');
  }
  const contextIndexes = value.narrativeContinuity.presentRequiredContextIndexes.map((item, index) =>
    nonNegativeInteger(item, `bounded Formal Event continuity.presentRequiredContextIndexes[${index}]`));
  const expectedContextIndexes = requirement.requiredContext.map((_item, index) => index);
  if (JSON.stringify(contextIndexes) !== JSON.stringify(expectedContextIndexes)) {
    throw new Error('bounded Formal Event continuity must cover every requiredContext index exactly once in order');
  }
  if (value.narrativeContinuity.presentNarrativePath !== 'content.text') {
    throw new Error('bounded Formal Event continuity presentNarrativePath must reference content.text');
  }
  if (!Array.isArray(value.narrativeContinuity.futureOutcomeRefs) || value.narrativeContinuity.futureOutcomeRefs.length === 0) {
    throw new Error('bounded Formal Event continuity requires at least one future outcome reference');
  }
  const futureOutcomeRefs = value.narrativeContinuity.futureOutcomeRefs.map((ref, index) =>
    validateOutcomeRef(ref, event, `bounded Formal Event continuity.futureOutcomeRefs[${index}]`));
  if (value.narrativeContinuity.futureHook !== 'NONE') {
    throw new Error('bounded Formal Event continuity futureHook must be NONE');
  }
  return {
    events: [event],
    narrativeContinuity: {
      pastEvidenceRefs,
      presentRequiredContextIndexes: contextIndexes,
      presentNarrativePath: 'content.text',
      futureOutcomeRefs,
      futureHook: 'NONE',
    },
  };
}

function exactPrecedentExpression(
  sources: readonly BoundedFormalEventPredicateSourceV1[],
  expectedPath: string,
  eventId: string,
): string | null {
  const matches = sources.flatMap(source => source.events).filter(event => {
    if (typeof event !== 'object' || event === null || Array.isArray(event)) return false;
    return (event as RecordValue).id === eventId;
  });
  if (matches.length !== 1) return null;
  const source = sources.find(candidate => candidate.path === expectedPath);
  if (!source || source.events.filter(event =>
    typeof event === 'object' && event !== null && !Array.isArray(event)
      && (event as RecordValue).id === eventId,
  ).length !== 1) return null;
  const event = matches[0] as RecordValue;
  if (!Array.isArray(event.conditions) || event.conditions.length !== 1) return null;
  const condition = event.conditions[0];
  if (typeof condition !== 'object' || condition === null || Array.isArray(condition)) return null;
  const record = condition as RecordValue;
  return record.type === 'expression' && typeof record.expression === 'string' ? record.expression.replace(/\s+/g, ' ').trim() : null;
}

export function deriveBoundedFormalEventPredicateEvidence(
  sources: readonly BoundedFormalEventPredicateSourceV1[],
): BoundedFormalEventPredicateEvidenceV1 {
  const trainingExpression = exactPrecedentExpression(
    sources,
    BOUNDED_FORMAL_EVENT_HABIT_PRECEDENTS.trainingHabit.sourcePath,
    BOUNDED_FORMAL_EVENT_HABIT_PRECEDENTS.trainingHabit.eventId,
  );
  const businessExpression = exactPrecedentExpression(
    sources,
    BOUNDED_FORMAL_EVENT_HABIT_PRECEDENTS.businessHabit.sourcePath,
    BOUNDED_FORMAL_EVENT_HABIT_PRECEDENTS.businessHabit.eventId,
  );
  const expectedTraining = BOUNDED_FORMAL_EVENT_HABIT_PRECEDENTS.trainingHabit.expression;
  const expectedBusiness = BOUNDED_FORMAL_EVENT_HABIT_PRECEDENTS.businessHabit.expression;
  if (trainingExpression !== expectedTraining || businessExpression !== expectedBusiness) {
    return {
      status: 'INSUFFICIENT_EVIDENCE',
      thresholds: null,
      evidenceRefs: [],
      expressions: [trainingExpression, businessExpression].filter((item): item is string => item !== null),
      reasons: ['The current P22 direct Habit predicates no longer match the recorded reference precedent.'],
    };
  }
  return {
    status: 'SUPPORTED',
    thresholds: { trainingHabit: 2, businessHabit: 2 },
    evidenceRefs: [
      `${BOUNDED_FORMAL_EVENT_HABIT_PRECEDENTS.trainingHabit.sourcePath}#${BOUNDED_FORMAL_EVENT_HABIT_PRECEDENTS.trainingHabit.eventId}`,
      `${BOUNDED_FORMAL_EVENT_HABIT_PRECEDENTS.businessHabit.sourcePath}#${BOUNDED_FORMAL_EVENT_HABIT_PRECEDENTS.businessHabit.eventId}`,
    ],
    expressions: [trainingExpression, businessExpression],
    reasons: ['The exact P42 training and merchant Event predicates use >= 2 for their corresponding life state.'],
  };
}

export function assessBoundedFormalEventApplicability(
  requirementValue: AuthoringRequirementV1 | unknown,
  observedLifeStates: { trainingHabit?: unknown; businessHabit?: unknown } | null | undefined,
  evidence: BoundedFormalEventPredicateEvidenceV1,
  requirementBoundaryEvidenceValue?: unknown,
): BoundedFormalEventApplicabilityV1 {
  const requirement = validateAuthoringRequirementV1(requirementValue);
  let requirementBoundaryEvidence: BoundedFormalEventRequirementBoundaryEvidenceV1 | null = null;
  if (requirementBoundaryEvidenceValue !== undefined && requirementBoundaryEvidenceValue !== null) {
    assertObject(requirementBoundaryEvidenceValue, 'Formal Event Requirement boundary evidence');
    assertExactKeys(
      requirementBoundaryEvidenceValue,
      ['requirementId', 'sourceRef', 'requiredCapability'],
      'Formal Event Requirement boundary evidence',
    );
    const requirementId = nonEmptyString(
      requirementBoundaryEvidenceValue.requirementId,
      'Formal Event Requirement boundary evidence.requirementId',
    );
    const sourceRef = nonEmptyString(
      requirementBoundaryEvidenceValue.sourceRef,
      'Formal Event Requirement boundary evidence.sourceRef',
    );
    const capabilities: readonly BoundedFormalEventOutOfContractRequirementV1[] = [
      'PERSISTENT_PERSON',
      'NEW_RUNTIME_OR_SCHEMA',
      'SECOND_EVENT',
    ];
    if (
      typeof requirementBoundaryEvidenceValue.requiredCapability !== 'string'
      || !capabilities.includes(requirementBoundaryEvidenceValue.requiredCapability as BoundedFormalEventOutOfContractRequirementV1)
    ) {
      throw new Error('Formal Event Requirement boundary evidence.requiredCapability is invalid');
    }
    if (
      requirementId !== requirement.requirementId
      || ![...requirement.source.refs, ...requirement.authorityRefs].includes(sourceRef)
    ) {
      return {
        status: 'INSUFFICIENT_EVIDENCE',
        evidence,
        requirementBoundaryEvidence: null,
        observedLifeStates: null,
        reasons: ['Structured Contract-boundary evidence does not reference this Requirement.'],
      };
    }
    requirementBoundaryEvidence = {
      requirementId,
      sourceRef,
      requiredCapability: requirementBoundaryEvidenceValue.requiredCapability as BoundedFormalEventOutOfContractRequirementV1,
    };
    return {
      status: 'CONTRACT_CHANGE_REQUIRED',
      evidence,
      requirementBoundaryEvidence,
      observedLifeStates: null,
      reasons: [`The Requirement explicitly requires out-of-contract capability ${requirementBoundaryEvidence.requiredCapability}.`],
    };
  }
  if (
    requirement.requirementId !== HUMAN_DIRECT_FORMAL_EVENT_REFERENCE_REQUIREMENT.requirementId
    || JSON.stringify(requirement) !== JSON.stringify(HUMAN_DIRECT_FORMAL_EVENT_REFERENCE_REQUIREMENT)
  ) {
    return { status: 'INSUFFICIENT_EVIDENCE', evidence, requirementBoundaryEvidence: null, observedLifeStates: null, reasons: ['No applicability proof is defined for this Requirement identity.'] };
  }
  if (evidence.status !== 'SUPPORTED' || !evidence.thresholds) {
    return { status: 'INSUFFICIENT_EVIDENCE', evidence, requirementBoundaryEvidence: null, observedLifeStates: null, reasons: [...evidence.reasons] };
  }
  const trainingHabit = observedLifeStates?.trainingHabit;
  const businessHabit = observedLifeStates?.businessHabit;
  if (
    typeof trainingHabit !== 'number' || !Number.isInteger(trainingHabit) || trainingHabit < 0 || trainingHabit > 5
    || typeof businessHabit !== 'number' || !Number.isInteger(businessHabit) || businessHabit < 0 || businessHabit > 5
  ) {
    return { status: 'INSUFFICIENT_EVIDENCE', evidence, requirementBoundaryEvidence: null, observedLifeStates: null, reasons: ['Both existing Habit values must be observed as integers in the canonical 0..5 range.'] };
  }
  const actual = { trainingHabit, businessHabit };
  const status = trainingHabit >= evidence.thresholds.trainingHabit && businessHabit >= evidence.thresholds.businessHabit
    ? 'APPLICABLE'
    : 'NOT_APPLICABLE';
  return {
    status,
    evidence,
    requirementBoundaryEvidence: null,
    observedLifeStates: actual,
    reasons: status === 'APPLICABLE'
      ? ['Both P22 Habit predicates are satisfied.']
      : ['At least one P22 Habit predicate is absent or below its direct-content precedent.'],
  };
}

export function eventConditionsPassForHabitState(
  event: BoundedFormalEventV1,
  lifeStates: { trainingHabit: number; businessHabit: number },
): boolean {
  const state = {
    player: { age: event.ageRange.min, lifeStates: { ...lifeStates, studyHabit: 0 } },
    flags: {},
    facts: {},
  } as unknown as GameState;
  const evaluator = new ConditionEvaluator();
  return event.conditions.every(condition => evaluator.evaluate(condition, state));
}
