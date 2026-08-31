import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  getPersonArchetype,
  getPersonVariant,
  personArchetypeCatalog,
} from '../src/data/personArchetypeCatalog';
import {
  canSatisfyPersonBinding,
  materializePersonBoundEvent,
  personVariantFactKey,
  readBoundPersonVariant,
} from '../src/core/SexVariantPersonArchetype';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { EventExecutor } from '../src/core/EventExecutor';
import { SUPPORTED_CONDITION_EXPRESSION_CAPABILITIES } from '../src/types/conditionExpression';
import { EffectType, EventCategory, EventPriority } from '../src/types/eventTypes';
import type { EventDefinition, GameState } from '../src/types/eventTypes';
import type { PersonEventBinding } from '../src/types/personArchetype';
import { GAME_STATE_SNAPSHOT_SCHEMA_VERSION } from '../src/contracts/gameStateSnapshot';
import { defaultSnapshotConverter } from '../src/headless/snapshot/SnapshotConverter';
import { FixedTimeSource } from '../src/headless/adapters/timeSource';
import { HeadlessEngineSessionImpl } from '../src/headless/session/HeadlessEngineSessionImpl';
import { CHOICE_EXECUTION_REQUEST_VERSION } from '../src/contracts/choiceExecution';

const ARCHETYPE_ID = 'merchant_introduced_partner_v1' as const;
const FACT_KEY = 'person_variant:merchant_introduced_partner_v1';

function createState(gender: 'male' | 'female'): GameState {
  const state = new GameEngineIntegration().getGameState();
  state.player.gender = gender;
  state.facts = {};
  return state;
}

function createPersonBoundEvent(mode: 'create' | 'require' = 'create'): EventDefinition {
  return {
    id: 'person_bound_fixture',
    version: '1.0.0',
    category: EventCategory.SIDE_QUEST,
    priority: EventPriority.NORMAL,
    weight: 1,
    ageRange: { min: 0, max: 100 },
    triggers: [],
    eventType: 'choice',
    personBinding: {
      archetypeId: ARCHETYPE_ID,
      mode,
    },
    content: {
      title: '{{person.name}}来访',
      text: '{{person.name}}说{{person.pronoun}}会把账目核清。',
      description: '家里称{{person.address}}做事认真。',
    },
    choices: [{
      id: 'meet',
      text: '见{{person.pronoun}}一面',
      description: '与{{person.name}}谈谈',
      effects: [],
      outcomes: [{
        id: 'ok',
        condition: { type: 'expression', expression: 'player.age >= 0' },
        text: '{{person.name}}点头应下。',
        effects: [],
      }],
    }],
  };
}

function assertRenderedFixture(event: EventDefinition, expected: {
  name: string;
  pronoun: string;
  address: string;
}): void {
  const renderedText = [
    event.content.title,
    event.content.text,
    event.content.description,
    ...(event.choices ?? []).flatMap(choice => [
      choice.text,
      choice.description,
      ...(choice.outcomes ?? []).map(outcome => outcome.text),
    ]),
  ].filter((text): text is string => typeof text === 'string');

  assert.equal(renderedText.every(text => !text.includes('{{person.')), true);
  assert.equal(renderedText.every(text => text.includes(expected.name) || !text.includes('沈')), true);
  assert.equal(renderedText.some(text => text.includes(expected.pronoun)), true);
  assert.equal(renderedText.some(text => text.includes(expected.address)), true);
  assert.equal(renderedText.some(text => text.includes(expected.name)), true);
}

function testClosedCatalogDefinitions(): void {
  assert.equal(
    personVariantFactKey(ARCHETYPE_ID),
    FACT_KEY,
  );
  assert.deepEqual(
    getPersonArchetype(ARCHETYPE_ID)?.variantByPlayerGender,
    {
      male: 'female_qinghe',
      female: 'male_zhiheng',
    },
  );
  assert.deepEqual(
    getPersonVariant(ARCHETYPE_ID, 'female_qinghe'),
    {
      id: 'female_qinghe',
      sex: 'female',
      displayName: '沈清禾',
      pronoun: '她',
      address: '姑娘',
    },
  );
  assert.deepEqual(
    getPersonVariant(ARCHETYPE_ID, 'male_zhiheng'),
    {
      id: 'male_zhiheng',
      sex: 'male',
      displayName: '沈知衡',
      pronoun: '他',
      address: '公子',
    },
  );

  const serializedCatalog = JSON.stringify(personArchetypeCatalog);
  for (const forbidden of [
    'attributes',
    'traits',
    'personality',
    'background',
    'socialClass',
    'familyTrade',
    'variantMetadata',
  ]) {
    assert.equal(serializedCatalog.includes(forbidden), false, `${forbidden} must not exist in the catalog`);
  }
}

function testMalePlayerMaterializesFemaleVariant(): void {
  const state = createState('male');
  const rawEvent = createPersonBoundEvent();
  const result = materializePersonBoundEvent(state, rawEvent, { allowCreate: true });

  assert.equal(result.state.facts[FACT_KEY], 'female_qinghe');
  assertRenderedFixture(result.event!, {
    name: '沈清禾',
    pronoun: '她',
    address: '姑娘',
  });
  assert.equal(rawEvent.content.title, '{{person.name}}来访');
}

function testFemalePlayerMaterializesMaleVariant(): void {
  const state = createState('female');
  const result = materializePersonBoundEvent(state, createPersonBoundEvent(), { allowCreate: true });

  assert.equal(result.state.facts[FACT_KEY], 'male_zhiheng');
  assertRenderedFixture(result.event!, {
    name: '沈知衡',
    pronoun: '他',
    address: '公子',
  });
}

function testExistingBindingIsReusedWithoutReselection(): void {
  const state = createState('male');
  state.facts[FACT_KEY] = 'female_qinghe';
  const result = materializePersonBoundEvent(state, createPersonBoundEvent(), { allowCreate: true });

  assert.equal(result.state, state);
  assert.equal(result.state.facts[FACT_KEY], 'female_qinghe');
  assert.equal(result.event?.content.title, '沈清禾来访');
}

function testRequireAndCreateFailClosedWhenBindingIsUnavailable(): void {
  const state = createState('male');
  const requireBinding: PersonEventBinding = {
    archetypeId: ARCHETYPE_ID,
    mode: 'require',
  };
  assert.equal(canSatisfyPersonBinding(state, requireBinding), false);
  const requireResult = materializePersonBoundEvent(
    state,
    createPersonBoundEvent('require'),
    { allowCreate: false },
  );
  assert.equal(requireResult.event, null);
  assert.equal(Object.hasOwn(state.facts, FACT_KEY), false);

  const createResult = materializePersonBoundEvent(
    state,
    createPersonBoundEvent('create'),
    { allowCreate: false },
  );
  assert.equal(createResult.event, null);
  assert.equal(Object.hasOwn(state.facts, FACT_KEY), false);
}

function testUnknownPersistedBindingFailsClosed(): void {
  const state = createState('male');
  state.facts[FACT_KEY] = 'unknown_variant';
  assert.equal(readBoundPersonVariant(state, ARCHETYPE_ID), undefined);
  assert.equal(canSatisfyPersonBinding(state, {
    archetypeId: ARCHETYPE_ID,
    mode: 'require',
  }), false);
  const result = materializePersonBoundEvent(state, createPersonBoundEvent('require'), { allowCreate: true });
  assert.equal(result.event, null);
  assert.equal(result.state.facts[FACT_KEY], 'unknown_variant');
}

function createIsolatedPersonCatalog() {
  const createEvent = {
    ...createPersonBoundEvent('create'),
    id: 'fixture_person_create',
  } as unknown as EventDefinition;
  const requireEvent = {
    ...createPersonBoundEvent('require'),
    id: 'fixture_person_require',
  } as unknown as EventDefinition;
  const events = [createEvent, requireEvent] as const;
  return {
    getAllEvents: () => events,
    getEventsByAge: (age: number) => events.filter(event => age >= event.ageRange.min && age <= (event.ageRange.max ?? age)),
    getEventById: (id: string) => events.find(event => event.id === id),
    getWeightForAge: () => 1,
  };
}

function testEngineIntegratesBindingAtSelectionTime(): void {
  const engine = new GameEngineIntegration(createIsolatedPersonCatalog());
  engine.getGameState().player.age = 22;

  const availableBeforeSelection = engine.getAvailableEvents(22);
  assert.equal(availableBeforeSelection.some(event => event.id === 'fixture_person_create'), true);
  assert.equal(availableBeforeSelection.some(event => event.id === 'fixture_person_require'), false);
  assert.equal(Object.hasOwn(engine.getGameState().facts, FACT_KEY), false);

  const selected = engine.selectEvent(22);
  assert.equal(selected?.id, 'fixture_person_create');
  assert.equal(selected?.content.title, '沈清禾来访');
  assert.equal(engine.getGameState().facts[FACT_KEY], 'female_qinghe');
  assert.equal(Object.keys(engine.getGameState().facts).filter(key => key === FACT_KEY).length, 1);

  const availableAfterSelection = engine.getAvailableEvents(22);
  assert.equal(availableAfterSelection.some(event => event.id === 'fixture_person_require'), true);
}

async function testDedicatedSpouseConsumer(): Promise<void> {
  const executor = new EventExecutor();
  const maleState = createState('male');
  maleState.facts[FACT_KEY] = 'female_qinghe';
  const maleResult = await executor.executeEffects([{
    type: EffectType.SPECIAL,
    target: 'set_spouse_from_person',
    value: ARCHETYPE_ID,
  }], maleState);
  assert.equal(maleResult.player.spouse, '沈清禾');

  const femaleState = createState('female');
  femaleState.facts[FACT_KEY] = 'male_zhiheng';
  const femaleResult = await executor.executeEffects([{
    type: EffectType.SPECIAL,
    target: 'set_spouse_from_person',
    value: ARCHETYPE_ID,
  }], femaleState);
  assert.equal(femaleResult.player.spouse, '沈知衡');

  const missingBindingResult = await executor.executeEffects([{
    type: EffectType.SPECIAL,
    target: 'set_spouse_from_person',
    value: ARCHETYPE_ID,
  }], createState('male'));
  assert.equal(missingBindingResult.player.spouse, null);

  const unknownArchetypeResult = await executor.executeEffects([{
    type: EffectType.SPECIAL,
    target: 'set_spouse_from_person',
    value: 'unknown_archetype',
  }], maleState);
  assert.equal(unknownArchetypeResult.player.spouse, null);
}

function testBindingRoundTripsWithoutSchemaExpansion(): void {
  for (const [gender, expectedVariant] of [
    ['male', 'female_qinghe'],
    ['female', 'male_zhiheng'],
  ] as const) {
    const state = createState(gender);
    const materialized = materializePersonBoundEvent(
      state,
      createPersonBoundEvent('create'),
      { allowCreate: true },
    );
    assert(materialized.event);

    const snapshot = defaultSnapshotConverter.toSnapshot(materialized.state, {
      eventCatalogVersion: '1.0.0',
      sourcePlatform: 'node-headless',
      time: new FixedTimeSource(1717200000000),
    });
    const roundTripped = defaultSnapshotConverter.fromSnapshot(
      JSON.parse(JSON.stringify(snapshot)),
    );
    assert.equal(snapshot.metadata.schemaVersion, GAME_STATE_SNAPSHOT_SCHEMA_VERSION);
    assert.equal(Object.hasOwn(snapshot.state, 'personInstances'), false);
    assert.equal(roundTripped.facts[FACT_KEY], expectedVariant);

    const executionEvent = materializePersonBoundEvent(
      roundTripped,
      createPersonBoundEvent('require'),
      { allowCreate: false },
    );
    assert.equal(executionEvent.event?.content.title, expectedVariant === 'female_qinghe' ? '沈清禾来访' : '沈知衡来访');
  }
}

function testPrePd103StateDoesNotReconstructMissingBinding(): void {
  const oldState = createState('male');
  oldState.player.age = 32;
  oldState.flags.origin_merchant_family = true;
  oldState.eventHistory = [{
    eventId: 'shen_qinghe_shared_matter',
    age: 32,
    triggeredAt: 32,
  }];
  const snapshot = defaultSnapshotConverter.toSnapshot(oldState, {
    eventCatalogVersion: '1.0.0',
    sourcePlatform: 'node-headless',
    time: new FixedTimeSource(1717200000000),
  });
  const restored = defaultSnapshotConverter.fromSnapshot(JSON.parse(JSON.stringify(snapshot)));
  const result = materializePersonBoundEvent(
    restored,
    createPersonBoundEvent('require'),
    { allowCreate: false },
  );

  assert.equal(result.event, null);
  assert.equal(Object.hasOwn(result.state.facts, FACT_KEY), false);
  assert.equal(result.state.player.spouse, null);
}

async function testHeadlessExecutionDoesNotReconstructMissingBinding(): Promise<void> {
  const oldState = createState('male');
  oldState.player.age = 32;
  oldState.flags.origin_merchant_family = true;
  oldState.eventHistory = [{
    eventId: 'shen_qinghe_shared_matter',
    age: 32,
    triggeredAt: 32,
  }];
  const snapshot = defaultSnapshotConverter.toSnapshot(oldState, {
    eventCatalogVersion: '1.0.0',
    sourcePlatform: 'node-headless',
    time: new FixedTimeSource(1717200000000),
  });
  const session = HeadlessEngineSessionImpl.create({ snapshot });

  await assert.rejects(() => session.executeChoice({
    requestVersion: CHOICE_EXECUTION_REQUEST_VERSION,
    snapshotRef: { snapshot },
    action: {
      eventId: 'shen_qinghe_shared_matter',
      choiceId: 'shen_qinghe_matter_honor_terms',
    },
  }));
  const after = session.serialize();
  assert.equal(Object.hasOwn(after.state.facts, FACT_KEY), false);
  assert.equal(after.state.player.spouse, null);
}

function testComplexityFirewall(): void {
  const sourcePaths = [
    'src/types/personArchetype.ts',
    'src/data/personArchetypeCatalog.ts',
    'src/core/SexVariantPersonArchetype.ts',
    'src/types/eventTypes.ts',
    'src/data/lines/merchant.json',
  ];
  const source = sourcePaths
    .map(sourcePath => fs.readFileSync(path.resolve(sourcePath), 'utf8'))
    .join('\n');
  for (const forbidden of [
    'personInstances',
    'person.attributes',
    'attributes: Record<',
    'variantMetadata',
    'person_sex_is',
    'person_property',
    'PersonRegistry',
    'NpcRegistry',
    'NPCRegistry',
    'randomName',
    'familyTrade',
    'temperament',
  ]) {
    assert.equal(source.includes(forbidden), false, `${forbidden} must remain outside the v1 subsystem`);
  }

  const eventTypesSource = fs.readFileSync(path.resolve('src/types/eventTypes.ts'), 'utf8');
  assert.equal(eventTypesSource.includes('personBinding?: PersonEventBinding'), true);
  assert.equal(eventTypesSource.includes('personBindings'), false);

  const conditionSource = [
    'src/types/conditionExpression.ts',
    'src/core/ConditionEvaluator.ts',
  ]
    .map(sourcePath => fs.readFileSync(path.resolve(sourcePath), 'utf8'))
    .join('\n');
  assert.equal(conditionSource.includes('person.'), false);
  assert.equal(conditionSource.includes('person_sex_is'), false);
  assert.deepEqual(SUPPORTED_CONDITION_EXPRESSION_CAPABILITIES, {
    playerPropertyAccess: 'player.<property>',
    flagQuery: "flags.has('flag_name')",
    eventQuery: "events.has('event_id')",
    comparisonOperators: ['>', '>=', '<', '<=', '==', '!='],
    logicOperators: ['&&', '||', '!', 'AND', 'OR', 'NOT'],
    parentheses: true,
  });
}

testClosedCatalogDefinitions();
testMalePlayerMaterializesFemaleVariant();
testFemalePlayerMaterializesMaleVariant();
testExistingBindingIsReusedWithoutReselection();
testRequireAndCreateFailClosedWhenBindingIsUnavailable();
testUnknownPersistedBindingFailsClosed();
testEngineIntegratesBindingAtSelectionTime();
testBindingRoundTripsWithoutSchemaExpansion();
testPrePd103StateDoesNotReconstructMissingBinding();
testComplexityFirewall();
await testHeadlessExecutionDoesNotReconstructMissingBinding();
await testDedicatedSpouseConsumer();

console.log('sexVariantPersonArchetypeV1: PASS');
