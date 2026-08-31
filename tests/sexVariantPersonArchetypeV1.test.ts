import assert from 'node:assert/strict';
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
import { EventCategory, EventPriority } from '../src/types/eventTypes';
import type { EventDefinition, GameState } from '../src/types/eventTypes';
import type { PersonEventBinding } from '../src/types/personArchetype';

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

testClosedCatalogDefinitions();
testMalePlayerMaterializesFemaleVariant();
testFemalePlayerMaterializesMaleVariant();
testExistingBindingIsReusedWithoutReselection();
testRequireAndCreateFailClosedWhenBindingIsUnavailable();
testUnknownPersistedBindingFailsClosed();

console.log('sexVariantPersonArchetypeV1: PASS');
