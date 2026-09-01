import assert from 'node:assert/strict';
import { resolveChoiceEffects } from '../src/core/ChoiceOutcomeResolver';
import { eventLoader } from '../src/core/EventLoader';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import type { EventDefinition, EventChoice } from '../src/types/eventTypes';

const IDS = {
  market: 'mingyue_market_meet',
  second: 'mingyue_second_encounter',
  shared: 'mingyue_shared_experience',
  conflict: 'mingyue_value_conflict',
  relationship: 'mingyue_relationship_choice',
  romanticEcho: 'mingyue_echo_romantic',
  nonRomanticEcho: 'mingyue_echo_non_romantic',
  conflictSupportEcho: 'mingyue_echo_conflict_support',
} as const;

function createEngine(age = 15): GameEngineIntegration {
  const engine = new GameEngineIntegration();
  const state = engine.getGameState();
  state.player.age = age;
  state.player.connections = 5;
  state.player.affiliation = null;
  state.player.flags = {};
  state.flags = state.player.flags;
  state.player.events = [];
  state.eventHistory = [];
  state.relations = {};
  state.player.relationships = [];
  state.player.spouse = null;
  state.player.children = 0;
  engine.setSuppressLethalSetbacks(true);
  return engine;
}

function getEvent(id: string): EventDefinition {
  const event = eventLoader.getEventById(id);
  assert(event, `missing Mingyue v1 event: ${id}`);
  return event;
}

function getChoice(eventId: string, choiceId: string): EventChoice {
  const choice = getEvent(eventId).choices?.find(candidate => candidate.id === choiceId);
  assert(choice, `missing choice: ${eventId}/${choiceId}`);
  return choice;
}

function availableIds(engine: GameEngineIntegration, age: number): Set<string> {
  engine.getGameState().player.age = age;
  return new Set(engine.getAvailableEvents(age).map(event => event.id));
}

function availableIdsAtCurrentTime(engine: GameEngineIntegration): Set<string> {
  const age = engine.getGameState().player.age;
  return new Set(engine.getAvailableEvents(age).map(event => event.id));
}

function absoluteMonth(time: NonNullable<GameEngineIntegration['getGameState'] extends () => infer T ? T : never>['currentTime']): number {
  assert(time, 'currentTime is required for Mingyue pacing assertions');
  return time.year * 12 + time.month;
}

async function choose(engine: GameEngineIntegration, eventId: string, choiceId: string): Promise<void> {
  const event = getEvent(eventId);
  const choice = getChoice(eventId, choiceId);
  const resolved = resolveChoiceEffects(engine.getGameState(), event, choice);
  assert(resolved, `choice did not resolve: ${eventId}/${choiceId}`);
  await engine.executeChoiceEffects(resolved.effects, eventId, choiceId);
}

async function runToRelationshipChoice(
  sharedChoice: string,
  conflictChoice: string,
): Promise<GameEngineIntegration> {
  const engine = createEngine(15);
  await choose(engine, IDS.market, 'mingyue_participate');
  engine.getGameState().player.age = 16;
  await engine.executeAutoEvent(getEvent(IDS.second));
  engine.getGameState().player.age = 17;
  await choose(engine, IDS.shared, sharedChoice);
  engine.getGameState().player.age = 18;
  await choose(engine, IDS.conflict, conflictChoice);
  return engine;
}

function assertNoLegacyRelationshipEffects(event: EventDefinition): void {
  const serialized = JSON.stringify(event);
  assert.equal(serialized.includes('love_started'), false, `${event.id} must not write love_started`);
  assert.equal(serialized.includes('lover_mingyue'), false, `${event.id} must not write lover_mingyue`);
  assert.equal(serialized.includes('affinity'), false, `${event.id} must not use affinity`);
  assert.equal(
    (event.autoEffects ?? []).some(effect => effect.type === 'relation_change'),
    false,
    `${event.id} must not use relation_change`,
  );
  for (const choice of event.choices ?? []) {
    assert.equal(
      (choice.effects ?? []).some(effect => effect.type === 'relation_change'),
      false,
      `${event.id}/${choice.id} must not use relation_change`,
    );
  }
}

function testActiveLegacySemanticsRetired(): void {
  const activeIds = new Set(eventLoader.getAllEvents().map(event => event.id));
  for (const legacyId of ['love_first_meet', 'family_marriage', 'marry_mingyue', 'arc_rf_mingyue']) {
    assert.equal(activeIds.has(legacyId), false, `${legacyId} must not be active`);
  }
  assert.equal(
    eventLoader.getAllEvents().some(event => /^marriage_quality_/.test(event.id)),
    false,
    'marriage quality events must not be active',
  );
}

function testMarketEntryIsAConcreteIncident(): void {
  const market = getEvent(IDS.market);
  assert.match(market.content.text, /市集/);
  assert.doesNotMatch(market.content.text, /搭讪|展示魅力|攻略|爱情|真爱/);
  assertNoLegacyRelationshipEffects(market);
}

async function testPassingByDoesNotIntroduceMingyue(): Promise<void> {
  const engine = createEngine(15);
  assert(availableIds(engine, 15).has(IDS.market));
  await choose(engine, IDS.market, 'mingyue_pass_by');

  assert.equal(engine.getGameState().flags.mingyue_met, undefined);
  assert.equal(availableIds(engine, 16).has(IDS.second), false);
  assert.equal(engine.getGameState().player.spouse, null);
  assert.equal(engine.getGameState().player.children, 0);
}

async function testMarketAccessDoesNotRequireSocialExposure(): Promise<void> {
  const engine = createEngine(20);
  engine.getGameState().player.connections = 0;
  engine.getGameState().player.affiliation = null;
  engine.getGameState().events = [];
  engine.getGameState().player.events = [];

  assert(
    availableIdsAtCurrentTime(engine).has(IDS.market),
    'the public market access must not require social exposure, jianghu experience, or affiliation',
  );
}

async function runNaturalToRelationshipChoice(conflictChoice: string): Promise<GameEngineIntegration> {
  const engine = createEngine(20);
  engine.getGameState().player.connections = 0;
  engine.getGameState().player.affiliation = null;

  assert(availableIdsAtCurrentTime(engine).has(IDS.market));
  await choose(engine, IDS.market, 'mingyue_participate');
  assert(availableIdsAtCurrentTime(engine).has(IDS.second));
  await engine.executeAutoEvent(getEvent(IDS.second));
  assert(availableIdsAtCurrentTime(engine).has(IDS.shared));
  await choose(engine, IDS.shared, 'mingyue_shared_help');
  assert(availableIdsAtCurrentTime(engine).has(IDS.conflict));
  await choose(engine, IDS.conflict, conflictChoice);
  assert(availableIdsAtCurrentTime(engine).has(IDS.relationship));
  return engine;
}

async function testLateNaturalChainUsesWorldTime(): Promise<void> {
  const engine = createEngine(20);
  engine.getGameState().player.connections = 0;
  engine.getGameState().player.affiliation = null;
  const start = { ...engine.getGameState().currentTime };

  await choose(engine, IDS.market, 'mingyue_participate');
  const afterMarket = { ...engine.getGameState().currentTime };
  assert(absoluteMonth(afterMarket) - absoluteMonth(start) >= 3, 'first encounter must leave a multi-month gap');

  await engine.executeAutoEvent(getEvent(IDS.second));
  await choose(engine, IDS.shared, 'mingyue_shared_help');
  await choose(engine, IDS.conflict, 'mingyue_conflict_support');
  assert(availableIdsAtCurrentTime(engine).has(IDS.relationship));
  await choose(engine, IDS.relationship, 'mingyue_choose_non_romantic');

  const finish = engine.getGameState().currentTime;
  assert(finish, 'relationship choice must retain currentTime');
  assert(
    absoluteMonth(finish) - absoluteMonth(start) >= 12,
    'an age-20 natural chain must not complete the relationship in roughly one month',
  );
}

async function testMingyue前史UnlocksTheNextNodes(): Promise<void> {
  const engine = createEngine(15);
  await choose(engine, IDS.market, 'mingyue_participate');

  assert.equal(engine.getGameState().flags.mingyue_met, true);
  assert(availableIds(engine, 16).has(IDS.second));
  assert.equal(availableIds(createEngine(16), 16).has(IDS.second), false);

  await engine.executeAutoEvent(getEvent(IDS.second));
  assert(availableIds(engine, 17).has(IDS.shared));
  await choose(engine, IDS.shared, 'mingyue_shared_boundary');
  assert.equal(engine.getGameState().eventHistory.some(entry => entry.eventId === IDS.shared), true);
  assert(availableIds(engine, 18).has(IDS.conflict));
}

async function testDifferentReasonableHistoriesReachRelationshipChoice(): Promise<void> {
  const first = await runToRelationshipChoice('mingyue_shared_help', 'mingyue_conflict_support');
  const second = await runToRelationshipChoice('mingyue_shared_boundary', 'mingyue_conflict_question');

  assert(availableIds(first, 19).has(IDS.relationship));
  assert(availableIds(second, 19).has(IDS.relationship));
  assert.match(getEvent(IDS.relationship).conditions?.[0]?.type ?? '', /expression/);
  assert.match(
    JSON.stringify(getEvent(IDS.relationship).conditions),
    /mingyue_shared_experience.*mingyue_value_conflict/,
  );
}

async function testRelationshipResultsAreEqualAndReachDifferentEchoes(): Promise<void> {
  const romantic = await runToRelationshipChoice('mingyue_shared_help', 'mingyue_conflict_support');
  await choose(romantic, IDS.relationship, 'mingyue_choose_romantic');
  assert.equal(romantic.getGameState().flags.mingyue_romance_confirmed, true);
  assert.equal(romantic.getGameState().flags.mingyue_non_romantic_relationship, undefined);
  assert.equal(romantic.getGameState().player.spouse, null);
  assert.equal(romantic.getGameState().player.children, 0);
  assert(availableIds(romantic, 30).has(IDS.romanticEcho));
  assert.equal(availableIds(romantic, 30).has(IDS.nonRomanticEcho), false);

  const nonRomantic = await runToRelationshipChoice('mingyue_shared_boundary', 'mingyue_conflict_question');
  await choose(nonRomantic, IDS.relationship, 'mingyue_choose_non_romantic');
  assert.equal(nonRomantic.getGameState().flags.mingyue_non_romantic_relationship, true);
  assert.equal(nonRomantic.getGameState().flags.mingyue_romance_confirmed, undefined);
  assert.equal(nonRomantic.getGameState().player.spouse, null);
  assert.equal(nonRomantic.getGameState().player.children, 0);
  assert(availableIds(nonRomantic, 30).has(IDS.nonRomanticEcho));
  assert.equal(availableIds(nonRomantic, 30).has(IDS.romanticEcho), false);

  assert.match(getEvent(IDS.romanticEcho).content.text, /明月/);
  assert.match(getEvent(IDS.nonRomanticEcho).content.text, /明月/);
}

async function testValueConflictHistoryChangesLaterObservableContent(): Promise<void> {
  const supported = await runNaturalToRelationshipChoice('mingyue_conflict_support');
  const questioned = await runNaturalToRelationshipChoice('mingyue_conflict_question');

  await choose(supported, IDS.relationship, 'mingyue_choose_romantic');
  await choose(questioned, IDS.relationship, 'mingyue_choose_romantic');

  supported.advanceTime(9, 'year');
  questioned.advanceTime(9, 'year');
  assert(availableIdsAtCurrentTime(supported).has(IDS.romanticEcho));
  assert(availableIdsAtCurrentTime(questioned).has(IDS.romanticEcho));
  assert(
    availableIdsAtCurrentTime(supported).has(IDS.conflictSupportEcho),
    'the later echo must consume the concrete support history',
  );
  assert(
    !availableIdsAtCurrentTime(questioned).has(IDS.conflictSupportEcho),
    'a different value-conflict history must produce different later content',
  );
  assert.match(getEvent(IDS.conflictSupportEcho).content.text, /支持|承担/);
}

function testVerticalSliceDoesNotUseAffinityOr攻略Thresholds(): void {
  for (const id of Object.values(IDS)) {
    assertNoLegacyRelationshipEffects(getEvent(id));
  }

  const relationshipCondition = JSON.stringify(getEvent(IDS.relationship).conditions);
  assert.equal(/threshold|score|affinity|正确|攻略/i.test(relationshipCondition), false);
}

async function main(): Promise<void> {
  testActiveLegacySemanticsRetired();
  testMarketEntryIsAConcreteIncident();
  await testPassingByDoesNotIntroduceMingyue();
  await testMarketAccessDoesNotRequireSocialExposure();
  await testLateNaturalChainUsesWorldTime();
  await testMingyue前史UnlocksTheNextNodes();
  await testDifferentReasonableHistoriesReachRelationshipChoice();
  await testRelationshipResultsAreEqualAndReachDifferentEchoes();
  await testValueConflictHistoryChangesLaterObservableContent();
  testVerticalSliceDoesNotUseAffinityOr攻略Thresholds();
  console.log('characterRelationshipMingyueV1.test.ts: ok');
}

void main();
