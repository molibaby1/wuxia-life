import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { resolveChoiceEffects } from '../src/core/ChoiceOutcomeResolver';
import { eventLoader } from '../src/core/EventLoader';
import { validateEventQuality } from '../scripts/validateEventQuality';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import {
  P18_COST_HEIR_OFFSPRING,
  P18_OUTCOME_UNDERINVESTMENT,
  P18_ROLE_OFFSPRING,
} from '../src/narrative/profile/wuxiaLegacySurfaces';
import { P19_CATEGORY_QUIET_CONTINUITY, P19_MEMORY_QUIET_LOCAL } from '../src/narrative/profile/wuxiaEndgameSurfaces';
import { resolveActiveLegacyOutcomes } from '../src/p18/legacyOutcomes';
import { resolveActiveCultivationCostPatterns } from '../src/p18/cultivationPressure';
import { inferSuccessorQuality } from '../src/p18/stateAccess';
import { resolveActiveSuccessorRoles } from '../src/p18/successorRoles';
import { resolveActiveHistoricalMemoryPatterns } from '../src/p19/historicalMemory';
import { inferLegacyScore, inferRelationshipScore, patternTriggersActive } from '../src/p19/stateAccess';
import type { EventChoice, EventDefinition, GameState } from '../src/types/eventTypes';

const IDS = {
  decision: 'mingyue_parenthood_decision',
  chosen: 'mingyue_parenthood_chosen',
  arrival: 'mingyue_child_arrival',
  arrivalDirect: 'mingyue_child_arrival_direct_care',
  arrivalExternal: 'mingyue_child_arrival_external_duties',
  early: 'mingyue_early_parenting',
  earlyDirect: 'mingyue_early_care',
  earlyRotate: 'mingyue_early_rotate',
} as const;

const NEGATIVE_PARENTING_FLAGS = [
  'childfree',
  'never_have_child',
  'parenthood_refused',
  'regret',
  'lonely',
  'unfinished',
];

function createEngine(age = 30): GameEngineIntegration {
  const engine = new GameEngineIntegration();
  const state = engine.getGameState();
  state.player.age = age;
  state.player.gender = 'male';
  state.player.spouse = '明月';
  state.player.children = 0;
  state.player.flags = {
    married: true,
    mingyue_romance_confirmed: true,
  };
  state.flags = state.player.flags;
  state.player.events = [];
  state.events = [];
  state.eventHistory = [];
  state.triggeredEvents = [];
  state.relations = {};
  state.player.relationships = [];
  state.currentTime = { year: 1, month: 1, day: 1 };
  engine.setSuppressLethalSetbacks(true);
  return engine;
}

function getEvent(id: string): EventDefinition {
  const event = eventLoader.getEventById(id);
  assert(event, `missing Mingyue Parenthood event: ${id}`);
  return event;
}

function getChoice(eventId: string, choiceId: string): EventChoice {
  const choice = getEvent(eventId).choices?.find(candidate => candidate.id === choiceId);
  assert(choice, `missing choice: ${eventId}/${choiceId}`);
  return choice;
}

function availableIds(engine: GameEngineIntegration, age = engine.getGameState().player.age): Set<string> {
  engine.getGameState().player.age = age;
  return new Set(engine.getAvailableEvents(age).map(event => event.id));
}

function absoluteMonth(time: GameState['currentTime']): number {
  assert(time, 'currentTime is required for Parenthood pacing assertions');
  return time.year * 12 + time.month;
}

async function choose(engine: GameEngineIntegration, eventId: string, choiceId: string) {
  const event = getEvent(eventId);
  const choice = getChoice(eventId, choiceId);
  const resolved = resolveChoiceEffects(engine.getGameState(), event, choice);
  assert(resolved, `choice did not resolve: ${eventId}/${choiceId}`);
  await engine.executeChoiceEffects(resolved.effects, eventId, choiceId);
  return resolved;
}

function ordinaryPlayerFacts(state: GameState): Record<string, unknown> {
  const player = state.player;
  return {
    martialPower: player.martialPower,
    constitution: player.constitution,
    charisma: player.charisma,
    chivalry: player.chivalry,
    reputation: player.reputation,
    connections: player.connections,
    knowledge: player.knowledge,
    businessAcumen: player.businessAcumen,
    influence: player.influence,
    martialHeritage: player.martialHeritage,
    scholarlyHeritage: player.scholarlyHeritage,
    merchantNetwork: player.merchantNetwork,
    wealthCapacity: player.wealthCapacity,
    spouse: player.spouse,
    relations: { ...state.relations },
    facts: { ...state.facts },
    achievements: state.achievements ? [...state.achievements] : state.achievements,
  };
}

function withoutChildCompatibilityFacts(state: GameState): GameState {
  const flags = Object.fromEntries(
    Object.entries(state.flags).filter(([key]) => key !== 'has_child'),
  );
  return {
    ...state,
    flags,
    player: {
      ...state.player,
      children: 0,
      flags: Object.fromEntries(
        Object.entries(state.player.flags).filter(([key]) => key !== 'has_child'),
      ),
    },
  };
}

async function runArrivalPath(arrivalChoiceId: string): Promise<{ engine: GameEngineIntegration }> {
  const engine = createEngine(30);
  assert(availableIds(engine).has(IDS.decision), 'eligible sample must expose the Parenthood decision');
  await choose(engine, IDS.decision, 'mingyue_parenthood_enter');
  assert(availableIds(engine).has(IDS.arrival), 'chosen Parenthood must expose child arrival');
  const beforeArrivalFacts = ordinaryPlayerFacts(engine.getGameState());
  const start = absoluteMonth(engine.getGameState().currentTime);
  await choose(engine, IDS.arrival, arrivalChoiceId);
  const afterArrival = engine.getGameState();
  assert.equal(absoluteMonth(afterArrival.currentTime) - start, 6);
  assert.equal(afterArrival.player.children, 1);
  assert.equal(afterArrival.flags.has_child, true);
  assert.equal(afterArrival.player.spouse, '明月');
  assert.equal(afterArrival.flags.married, true);
  assert.equal(afterArrival.flags.mingyue_romance_confirmed, true);
  assert.equal(afterArrival.eventHistory.some(record => record.eventId === IDS.arrival), true);
  assert.equal(afterArrival.player.events.some(record => record.eventId === arrivalChoiceId), true);
  assert.deepEqual(ordinaryPlayerFacts(afterArrival), beforeArrivalFacts);
  return { engine };
}

function testCatalogAddsExactlyTheThreeConcreteEvents(): void {
  const sourcePath = path.resolve('src/data/lines/character-mingyue-v1.json');
  const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8')) as EventDefinition[];
  assert.equal(source.length, 12, 'Mingyue source must contain its existing 9 events plus exactly 3 Parenthood events');
  assert.deepEqual(source.slice(-3).map(event => event.id), [IDS.decision, IDS.arrival, IDS.early]);
  assert.equal(eventLoader.getAllEvents().length, 391);
  assert.deepEqual(
    [IDS.decision, IDS.arrival, IDS.early].map(id => Boolean(eventLoader.getEventById(id))),
    [true, true, true],
  );
}

function testParenthoodEventsHaveNoLocalQualityBlockers(): void {
  const parenthoodIds = new Set([IDS.decision, IDS.arrival, IDS.early]);
  const blockers = validateEventQuality(eventLoader.getAllEvents()).issues.filter(
    issue => parenthoodIds.has(issue.eventId) && ['invalid_stat', 'broken_storyline'].includes(issue.issueType),
  );
  assert.deepEqual(blockers, [], 'Parenthood events must not add event-quality blockers');
}

function testDecisionEligibilityIsOnlyTheMingyueSampleWindow(): void {
  const eligible = createEngine(30);
  assert(availableIds(eligible, 30).has(IDS.decision));

  const female = createEngine(30);
  female.getGameState().player.gender = 'female';
  assert.equal(availableIds(female, 30).has(IDS.decision), false);

  const unmarried = createEngine(30);
  delete unmarried.getGameState().flags.married;
  delete unmarried.getGameState().player.flags.married;
  assert.equal(availableIds(unmarried, 30).has(IDS.decision), false);

  const otherSpouse = createEngine(30);
  otherSpouse.getGameState().player.spouse = '另一位人物';
  assert.equal(availableIds(otherSpouse, 30).has(IDS.decision), false);

  const tooYoung = createEngine(29);
  assert.equal(availableIds(tooYoung, 29).has(IDS.decision), false);

  const tooOld = createEngine(41);
  assert.equal(availableIds(tooOld, 41).has(IDS.decision), false);

  const alreadyHasChild = createEngine(30);
  alreadyHasChild.getGameState().player.children = 1;
  assert.equal(availableIds(alreadyHasChild, 30).has(IDS.decision), false);

  const hasChildFlag = createEngine(30);
  hasChildFlag.getGameState().flags.has_child = true;
  hasChildFlag.getGameState().player.flags.has_child = true;
  assert.equal(availableIds(hasChildFlag, 30).has(IDS.decision), false);
}

async function testDeferringParenthoodPreservesTheNoChildLifeFacts(): Promise<void> {
  const engine = createEngine(35);
  assert(availableIds(engine, 35).has(IDS.decision));
  await choose(engine, IDS.decision, 'mingyue_parenthood_defer');
  const state = engine.getGameState();

  assert.equal(state.player.children, 0);
  assert.equal(state.flags.has_child, undefined);
  assert.equal(state.player.spouse, '明月');
  assert.equal(state.flags.married, true);
  assert.equal(state.flags.mingyue_romance_confirmed, true);
  assert.equal(state.flags[IDS.chosen], undefined);
  for (const flag of NEGATIVE_PARENTING_FLAGS) {
    assert.equal(state.flags[flag], undefined, `${flag} must not become a no-parenthood semantic`);
  }
  assert.equal(availableIds(engine, 35).has(IDS.arrival), false);
}

async function testChoosingParenthoodRecordsOnlyTheConcreteDecisionAndTenMonths(): Promise<void> {
  const engine = createEngine(35);
  const start = absoluteMonth(engine.getGameState().currentTime);
  await choose(engine, IDS.decision, 'mingyue_parenthood_enter');
  const state = engine.getGameState();

  assert.equal(state.flags[IDS.chosen], undefined);
  assert.equal(state.player.events.some(record => record.eventId === IDS.chosen), true);
  assert.equal(state.player.children, 0);
  assert.equal(state.flags.has_child, undefined);
  assert.equal(absoluteMonth(state.currentTime) - start, 10);
  assert.equal(state.player.age, 35);
}

async function testAgeFortyDecisionStillReachesTheArrivalWindow(): Promise<void> {
  const engine = createEngine(40);
  assert(availableIds(engine, 40).has(IDS.decision));
  await choose(engine, IDS.decision, 'mingyue_parenthood_enter');
  assert.equal(engine.getGameState().player.age, 40);
  assert(availableIds(engine).has(IDS.arrival), 'age-40 decision plus ten months must still reach arrival');
}

function testArrivalChoicesHaveOnlyTheRequiredCompatibilityEffects(): void {
  const arrival = getEvent(IDS.arrival);
  assert.deepEqual(arrival.choices?.map(choice => choice.id), [IDS.arrivalDirect, IDS.arrivalExternal]);
  for (const choice of arrival.choices ?? []) {
    const effects = choice.effects ?? [];
    assert.equal(effects.filter(effect => effect.type === 'stat_modify' && effect.target !== 'children').length, 0);
    assert.equal(effects.some(effect => effect.type === 'relation_change'), false);
    assert.equal(effects.some(effect => effect.type === 'karma_change'), false);
    assert.equal(effects.some(effect => effect.type === 'life_state_change'), false);
    assert.equal(effects.some(effect => effect.type === 'event_record' && effect.target === choice.id), true);
    assert.equal(effects.some(effect => effect.type === 'flag_set' && effect.target === 'has_child'), true);
    assert.equal(effects.some(effect => effect.type === 'time_advance' && effect.value === 6 && effect.timeUnit === 'month'), true);
  }
}

async function testBothArrivalHistoriesProduceTheSameChildCompatibilityFacts(): Promise<void> {
  const direct = await runArrivalPath(IDS.arrivalDirect);
  const external = await runArrivalPath(IDS.arrivalExternal);
  const directState = direct.engine.getGameState();
  const externalState = external.engine.getGameState();

  assert.deepEqual(
    {
      children: directState.player.children,
      has_child: directState.flags.has_child,
      spouse: directState.player.spouse,
      married: directState.flags.married,
      romance: directState.flags.mingyue_romance_confirmed,
    },
    {
      children: externalState.player.children,
      has_child: externalState.flags.has_child,
      spouse: externalState.player.spouse,
      married: externalState.flags.married,
      romance: externalState.flags.mingyue_romance_confirmed,
    },
  );
  assert.equal(directState.player.events.some(record => record.eventId === IDS.arrivalDirect), true);
  assert.equal(externalState.player.events.some(record => record.eventId === IDS.arrivalExternal), true);
}

function testManualHasChildCannotBypassTheConcreteArrival(): void {
  const engine = createEngine(35);
  const state = engine.getGameState();
  state.player.children = 1;
  state.flags.has_child = true;
  state.player.flags.has_child = true;
  assert.equal(availableIds(engine, 35).has(IDS.arrival), false);
  assert.equal(availableIds(engine, 35).has(IDS.early), false);
}

async function testEarlyParentingFormsACompleteTwoByTwoWithoutAParentingRoute(): Promise<void> {
  const arrivalChoices = [IDS.arrivalDirect, IDS.arrivalExternal];
  const earlyChoices = [IDS.earlyDirect, IDS.earlyRotate];
  const observedOutcomeTexts = new Set<string>();

  for (const arrivalChoice of arrivalChoices) {
    for (const earlyChoice of earlyChoices) {
      const engine = createEngine(30);
      await choose(engine, IDS.decision, 'mingyue_parenthood_enter');
      await choose(engine, IDS.arrival, arrivalChoice);
      assert(availableIds(engine).has(IDS.early));

      const event = getEvent(IDS.early);
      assert.deepEqual(event.choices?.map(choice => choice.id), earlyChoices);
      assert.equal(event.choices?.every(choice => choice.condition === undefined), true);

      const beforeEarlyFacts = ordinaryPlayerFacts(engine.getGameState());
      const resolved = await choose(engine, IDS.early, earlyChoice);
      assert(resolved.outcomeText);
      const expectedHistoryText = arrivalChoice === IDS.arrivalDirect
        ? '停下部分外务承担直接照料'
        : '接过较多外务让明月先恢复';
      const otherHistoryText = arrivalChoice === IDS.arrivalDirect
        ? '接过较多外务让明月先恢复'
        : '停下部分外务承担直接照料';
      assert.equal(resolved.outcomeText.includes(expectedHistoryText), true);
      assert.equal(resolved.outcomeText.includes(otherHistoryText), false);
      observedOutcomeTexts.add(resolved.outcomeText);
      const state = engine.getGameState();
      assert.equal(state.player.children, 1);
      assert.equal(state.flags.has_child, true);
      assert.deepEqual(ordinaryPlayerFacts(state), beforeEarlyFacts);
      for (const forbidden of ['parenting_direct', 'parenting_shared', 'parenting_style', 'parenting_quality', 'parent_child_closeness']) {
        assert.equal(JSON.stringify(state).includes(forbidden), false, `${forbidden} must not be written`);
      }
    }
  }

  assert.equal(observedOutcomeTexts.size, 4, 'all four arrival/current-choice paths must expose their conditional text');
}

function testConditionalOutcomeReadsOnlyTheRealArrivalHistory(): void {
  const event = getEvent(IDS.early);
  assert.equal(event.conditions?.[0] && 'expression' in event.conditions[0]
    ? event.conditions[0].expression.includes('events.has("mingyue_child_arrival")')
    : false, true);
  for (const choice of event.choices ?? []) {
    assert.equal(choice.outcomes?.length, 2);
    assert.deepEqual(choice.effects, []);
    assert.equal(choice.outcomes?.every(outcome => outcome.effects.length === 1), true);
    assert.equal(
      choice.outcomes?.every(outcome => outcome.effects[0]?.type === 'event_record' && outcome.effects[0].target === IDS.early),
      true,
    );
    assert.equal(choice.outcomes?.some(outcome => outcome.condition.expression.includes(IDS.arrivalDirect)), true);
    assert.equal(choice.outcomes?.some(outcome => outcome.condition.expression.includes(IDS.arrivalExternal)), true);
  }
}

async function testChildFactsDoNotReactivatePhase4AOrP19Shortcuts(): Promise<void> {
  const { engine } = await runArrivalPath(IDS.arrivalDirect);
  const state = engine.getGameState();

  assert.equal(resolveActiveSuccessorRoles(state).some(role => role.config.id === P18_ROLE_OFFSPRING.id), false);
  assert.equal(resolveActiveCultivationCostPatterns(state).some(cost => cost.pattern.id === P18_COST_HEIR_OFFSPRING.id), false);
  assert.equal(resolveActiveLegacyOutcomes(state).some(outcome => outcome.pattern.id === P18_OUTCOME_UNDERINVESTMENT.id), false);
  assert.equal(inferSuccessorQuality(state), inferSuccessorQuality(withoutChildCompatibilityFacts(state)));

  assert.equal(patternTriggersActive(state, P19_CATEGORY_QUIET_CONTINUITY.triggerFlags), false);
  assert.equal(resolveActiveHistoricalMemoryPatterns(state).some(pattern => pattern.patternId === P19_MEMORY_QUIET_LOCAL.id), false);
  assert.equal(inferRelationshipScore(state), inferRelationshipScore(withoutChildCompatibilityFacts(state)));
  assert.equal(inferLegacyScore(state), inferLegacyScore(withoutChildCompatibilityFacts(state)));
  assert.equal(eventLoader.getEventById('family_child_born'), undefined);
}

function testNoGenericParenthoodOrChildRuntimeWasAuthored(): void {
  const serialized = JSON.stringify([getEvent(IDS.decision), getEvent(IDS.arrival), getEvent(IDS.early)]);
  for (const forbidden of [
    'fertility',
    'pregnancy',
    'wants_child',
    'trying_for_child',
    'child_id',
    'child_name',
    'child_gender',
    'child_personality',
    'child_affinity',
    'child_career',
    'has_heir',
    'has_successor',
    'parenting_stage',
    'parenting_direct',
    'parenting_shared',
    'parenting_style',
    'parenting_quality',
    'parent_child_closeness',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `${forbidden} must not be part of this vertical slice`);
  }
}

async function main(): Promise<void> {
  testCatalogAddsExactlyTheThreeConcreteEvents();
  testParenthoodEventsHaveNoLocalQualityBlockers();
  testDecisionEligibilityIsOnlyTheMingyueSampleWindow();
  await testDeferringParenthoodPreservesTheNoChildLifeFacts();
  await testChoosingParenthoodRecordsOnlyTheConcreteDecisionAndTenMonths();
  await testAgeFortyDecisionStillReachesTheArrivalWindow();
  testArrivalChoicesHaveOnlyTheRequiredCompatibilityEffects();
  await testBothArrivalHistoriesProduceTheSameChildCompatibilityFacts();
  testManualHasChildCannotBypassTheConcreteArrival();
  await testEarlyParentingFormsACompleteTwoByTwoWithoutAParentingRoute();
  testConditionalOutcomeReadsOnlyTheRealArrivalHistory();
  await testChildFactsDoNotReactivatePhase4AOrP19Shortcuts();
  testNoGenericParenthoodOrChildRuntimeWasAuthored();
  console.log('parenthoodMingyueV1.test.ts: ok');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
