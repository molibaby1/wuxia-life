import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { resolveChoiceEffects } from '../src/core/ChoiceOutcomeResolver';
import { EventLoader, eventLoader } from '../src/core/EventLoader';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { deriveLifeMemorySummary } from '../src/core/deriveLifeMemorySummary';
import type { EventChoice, EventDefinition } from '../src/types/eventTypes';

const MARRIAGE_EVENT_ID = 'mingyue_marriage_decision';
const MARRIAGE_CHOICE_ID = 'mingyue_choose_marriage';
const DECLINE_CHOICE_ID = 'mingyue_decline_marriage';
const CHILD_BIRTH_EVENT_ID = 'family_child_born';

function createEngine(): GameEngineIntegration {
  const engine = new GameEngineIntegration();
  const state = engine.getGameState();
  state.player.age = 30;
  state.player.flags = {};
  state.flags = {};
  state.player.events = [];
  state.eventHistory = [];
  state.triggeredEvents = [];
  state.relations = {};
  state.player.relationships = [];
  state.player.spouse = null;
  state.player.children = 0;
  engine.setSuppressLethalSetbacks(true);
  return engine;
}

function getMarriageEvent(): EventDefinition {
  const event = eventLoader.getEventById(MARRIAGE_EVENT_ID);
  assert(event, `missing marriage event: ${MARRIAGE_EVENT_ID}`);
  return event;
}

function getMarriageChoice(choiceId: string): EventChoice {
  const choice = getMarriageEvent().choices?.find(candidate => candidate.id === choiceId);
  assert(choice, `missing marriage choice: ${choiceId}`);
  return choice;
}

function availableIds(engine: GameEngineIntegration): Set<string> {
  return new Set(engine.getAvailableEvents(engine.getGameState().player.age).map(event => event.id));
}

function seedRomanceWithoutEcho(engine: GameEngineIntegration): void {
  const state = engine.getGameState();
  state.flags = { mingyue_romance_confirmed: true };
  state.player.flags = { mingyue_romance_confirmed: true };
}

function seedRomanceWithEcho(engine: GameEngineIntegration): void {
  seedRomanceWithoutEcho(engine);
  engine.getGameState().triggeredEvents = ['mingyue_echo_romantic'];
}

async function choose(engine: GameEngineIntegration, choiceId: string): Promise<void> {
  const event = getMarriageEvent();
  const choice = getMarriageChoice(choiceId);
  const resolved = resolveChoiceEffects(engine.getGameState(), event, choice);
  assert(resolved, `choice did not resolve: ${choiceId}`);
  await engine.executeChoiceEffects(resolved.effects, event.id, choice.id);
}

function readDeferredChildBirth(): EventDefinition {
  const sourcePath = path.resolve('src/data/lines/family-parenthood-deferred.json');
  const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8')) as EventDefinition[];
  const event = source.find(candidate => candidate.id === CHILD_BIRTH_EVENT_ID);
  assert(event, `${CHILD_BIRTH_EVENT_ID} must remain in deferred source`);
  return event;
}

function testMarriageEventUsesOnlyTheRequiredFacts(): void {
  const event = getMarriageEvent();
  assert.deepEqual(event.ageRange, { min: 30, max: 60 });
  assert.deepEqual(event.triggers, [{ type: 'age_reach', value: 30 }]);
  assert.equal(
    event.conditions?.[0] && 'expression' in event.conditions[0] ? event.conditions[0].expression : undefined,
    'flags.has("mingyue_romance_confirmed") && events.has("mingyue_echo_romantic") && !events.has("mingyue_marriage_decision") && !flags.has("married") && !player.spouse',
  );
  assert.deepEqual(event.choices?.map(choice => choice.id), [MARRIAGE_CHOICE_ID, DECLINE_CHOICE_ID]);
  assert.deepEqual(getMarriageChoice(DECLINE_CHOICE_ID).effects, [
    { type: 'event_record', target: MARRIAGE_EVENT_ID },
  ]);

  const effects = event.choices?.flatMap(choice => choice.effects ?? []) ?? [];
  assert.equal(effects.some(effect => effect.type === 'stat_modify'), false);
  assert.equal(effects.some(effect => effect.type === 'relation_change'), false);
  assert.equal(JSON.stringify(event).includes('marriage_quality'), false);
  assert.equal(JSON.stringify(event).includes('criticalChoices.marriage_choice'), false);
}

function testRomanceMustExistBeforeMarriage(): void {
  const noRomance = createEngine();
  assert.equal(availableIds(noRomance).has(MARRIAGE_EVENT_ID), false);

  const romanceWithoutEcho = createEngine();
  seedRomanceWithoutEcho(romanceWithoutEcho);
  assert.equal(availableIds(romanceWithoutEcho).has(MARRIAGE_EVENT_ID), false);

  const eligible = createEngine();
  seedRomanceWithEcho(eligible);
  assert.equal(availableIds(eligible).has(MARRIAGE_EVENT_ID), true);
}

function testExistingMarriageStateBlocksTheDecision(): void {
  const married = createEngine();
  seedRomanceWithEcho(married);
  married.getGameState().flags.married = true;
  married.getGameState().player.flags.married = true;
  assert.equal(availableIds(married).has(MARRIAGE_EVENT_ID), false);

  const hasSpouse = createEngine();
  seedRomanceWithEcho(hasSpouse);
  hasSpouse.getGameState().player.spouse = '另一位人物';
  assert.equal(availableIds(hasSpouse).has(MARRIAGE_EVENT_ID), false);
}

async function testMarriageSuccessSetsOnlyMarriageFacts(): Promise<void> {
  const engine = createEngine();
  seedRomanceWithEcho(engine);
  const event = getMarriageEvent();
  const choice = getMarriageChoice(MARRIAGE_CHOICE_ID);
  assert.deepEqual(choice.effects, [
    { type: 'special', target: 'set_spouse', value: '明月' },
    { type: 'flag_set', target: 'married', value: true },
  ]);

  await choose(engine, MARRIAGE_CHOICE_ID);
  const state = engine.getGameState();
  assert.equal(state.player.spouse, '明月');
  assert.equal(state.flags.married, true);
  assert.equal(state.flags.mingyue_romance_confirmed, true);
  assert.equal(state.player.children, 0);
  assert.equal(state.flags.has_child, undefined);
  assert.equal(state.relations?.spouse, undefined);
  assert.deepEqual(state.player.relationships, []);
  assert.equal(state.eventHistory.some(record => record.eventId === event.id), true);
  assert.equal(availableIds(engine).has(CHILD_BIRTH_EVENT_ID), false);
}

async function testDecliningMarriageLeavesRomanceAndNoNewDurableSemantics(): Promise<void> {
  const engine = createEngine();
  seedRomanceWithEcho(engine);
  await choose(engine, DECLINE_CHOICE_ID);
  const state = engine.getGameState();

  assert.equal(state.player.spouse, null);
  assert.equal(state.flags.married, undefined);
  assert.equal(state.flags.mingyue_romance_confirmed, true);
  assert.equal(state.player.children, 0);
  for (const flag of ['single', 'never_marry', 'marriage_rejected', 'love_failed', 'regret']) {
    assert.equal(state.flags[flag], undefined, `${flag} must not become durable semantics`);
  }
}

function testChildBirthIsDeferredAndPreserved(): void {
  assert.equal(EventLoader.getInstance().getEventById(CHILD_BIRTH_EVENT_ID), undefined);
  const deferred = readDeferredChildBirth();
  assert.deepEqual(deferred.choices?.map(choice => choice.id), [
    'family_child_born_choice_1',
    'child_born_simple',
    'child_born_care',
  ]);
}

function testMarriageAndChildrenAreNotLifeMemoryAchievements(): void {
  const engine = createEngine();
  const state = engine.getGameState();
  state.flags = { married: true, has_child: true };
  state.player.flags = { married: true, has_child: true };
  state.player.spouse = '明月';
  state.player.children = 1;

  const summary = deriveLifeMemorySummary(state);
  const spouse = summary.relationships?.find(entry => entry.diagnostic.relationId === 'spouse');
  assert(spouse, 'spouse must remain visible in relationship summary');
  assert.equal(spouse.roleLabel, '配偶');
  assert.equal(spouse.statusLabel, '已婚');
  assert.equal('affinityBand' in spouse, false);
  assert.equal(spouse.diagnostic.affinity, undefined);
  assert.equal(Boolean(summary.achievements?.some(entry => entry.diagnostic.achievementId === 'married')), false);
  assert.equal(Boolean(summary.achievements?.some(entry => entry.diagnostic.achievementId === 'children')), false);
  assert.equal(summary.relationships?.some(entry => entry.diagnostic.relationId === 'children'), true);
}

async function main(): Promise<void> {
  testMarriageEventUsesOnlyTheRequiredFacts();
  testRomanceMustExistBeforeMarriage();
  testExistingMarriageStateBlocksTheDecision();
  await testMarriageSuccessSetsOnlyMarriageFacts();
  await testDecliningMarriageLeavesRomanceAndNoNewDurableSemantics();
  testChildBirthIsDeferredAndPreserved();
  testMarriageAndChildrenAreNotLifeMemoryAchievements();
  console.log('characterRelationshipMarriageV1.test.ts: ok');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
