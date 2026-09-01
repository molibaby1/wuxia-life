import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GAME_STATE_SNAPSHOT_SCHEMA_VERSION } from '../src/contracts/gameStateSnapshot';
import { resolveChoiceEffects } from '../src/core/ChoiceOutcomeResolver';
import { eventLoader } from '../src/core/EventLoader';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { formalFactsForDifficultySetback } from '../src/core/SetbackEventSystem';
import { HeadlessEngineSessionImpl } from '../src/headless/session/HeadlessEngineSessionImpl';
import { defaultSnapshotConverter } from '../src/headless/snapshot/SnapshotConverter';
import goldenLinePayoffMap from '../src/data/golden-line-payoff-map.json';
import { evaluatePayoffGate } from '../scripts/goldenLinePayoffGate';
import type { EventChoice, GameState, PlayerState } from '../src/types/eventTypes';

const INITIAL_GAME_STATE_KEYS = [
  'achievements',
  'actionFocusStreak',
  'actionHistory',
  'criticalChoices',
  'currentTime',
  'eventHistory',
  'events',
  'facts',
  'flags',
  'karma',
  'player',
  'relations',
  'statistics',
];

const POST_CHOICE_GAME_STATE_KEYS = [
  'achievements',
  'actionFocusStreak',
  'actionHistory',
  'criticalChoices',
  'currentTime',
  'eventHistory',
  'events',
  'facts',
  'flags',
  'gameTimestamp',
  'karma',
  'p16TendencyShaping',
  'player',
  'relations',
  'statistics',
];

const INITIAL_PLAYER_STATE_KEYS = [
  'affiliation',
  'age',
  'alive',
  'businessAcumen',
  'charisma',
  'children',
  'chivalry',
  'connections',
  'constitution',
  'events',
  'flags',
  'gender',
  'healthStatus',
  'influence',
  'investments',
  'items',
  'knowledge',
  'lifeStates',
  'martialHeritage',
  'martialPower',
  'merchantNetwork',
  'name',
  'relationships',
  'reputation',
  'scholarlyHeritage',
  'spouse',
  'statuses',
  'title',
  'traits',
  'wealthCapacity',
];

function createYouthEngine(age: number, player: Partial<PlayerState> = {}): GameEngineIntegration {
  const engine = new GameEngineIntegration();
  const state = engine.getGameState();
  state.player.age = age;
  state.player.affiliation = null;
  state.player.martialPower = 0;
  state.player.reputation = 0;
  state.player.connections = 0;
  state.player.chivalry = 0;
  state.player.lifeStates = { trainingHabit: 0, studyHabit: 0, businessHabit: 0 };
  Object.assign(state.player, player);
  state.flags = {};
  state.player.flags = state.flags;
  state.eventHistory = [];
  state.player.events = [];
  state.relations = {};
  state.player.relationships = [];
  return engine;
}

function recordFact(state: GameState, eventId: string): void {
  state.eventHistory ??= [];
  state.eventHistory.push({ eventId, age: state.player.age });
}

function availableIds(engine: GameEngineIntegration, age: number): Set<string> {
  engine.getGameState().player.age = age;
  return new Set(engine.getAvailableEvents(age).map(event => event.id));
}

async function executeChoice(
  engine: GameEngineIntegration,
  eventId: string,
  choiceId: string,
): Promise<void> {
  const event = eventLoader.getEventById(eventId);
  assert(event, `missing event: ${eventId}`);
  const choice = event.choices?.find(candidate => candidate.id === choiceId);
  assert(choice, `missing choice: ${eventId}/${choiceId}`);
  const resolved = resolveChoiceEffects(engine.getGameState(), event, choice as EventChoice);
  assert(resolved, `unresolved choice: ${eventId}/${choiceId}`);
  await engine.executeChoiceEffects(resolved.effects, eventId, choiceId);
}

function probeEvent(id: string, priority: number, storyLine?: string): unknown {
  return {
    id,
    version: '1.0.0',
    category: 'side_quest',
    priority,
    weight: 1,
    ageRange: { min: 15, max: 15 },
    eventType: 'auto',
    content: { title: id, text: id, description: id },
    metadata: { tags: [], enabled: true },
    ...(storyLine ? { storyLine } : {}),
  };
}

async function main(): Promise<void> {
  const allIds = new Set(eventLoader.getAllEvents().map(event => event.id));
  for (const removed of [
    'meet_love_interest',
    'sect_path_choice',
    'outlaw_path_beginning',
    'outlaw_training',
    'outlaw_mentor',
    'outlaw_mercy_choice',
    'outlaw_legitimacy_debate',
  ]) {
    assert(!allIds.has(removed), `${removed} must leave the formal loader`);
  }
  assert.equal(allIds.size, 391);

  assert.equal(goldenLinePayoffMap.entries.length, 10);
  assert.equal(goldenLinePayoffMap.entries.filter(entry => entry.payoffs.length > 0).length, 9);
  assert.equal(evaluatePayoffGate([]).summary.staticPayoffRate, 0.9);

  // A global cap must not hide eligible critical or storyline opportunities.
  const loader = eventLoader as unknown as {
    getEventsByAge(age: number): ReturnType<typeof eventLoader.getEventsByAge>;
  };
  const getEventsByAge = loader.getEventsByAge;
  loader.getEventsByAge = () => [
    ...Array.from({ length: 13 }, (_, index) => probeEvent(`regular_probe_${index}`, 3)),
    probeEvent('storyline_probe', 1, 'probe'),
    probeEvent('critical_probe', 0),
  ] as ReturnType<typeof eventLoader.getEventsByAge>;
  try {
    const ids = availableIds(createYouthEngine(15), 15);
    assert(ids.has('critical_probe'));
    assert(ids.has('storyline_probe'));
    assert.equal([...ids].filter(id => id.startsWith('regular_probe_')).length, 12);
  } finally {
    loader.getEventsByAge = getEventsByAge;
  }

  const sectChoice = eventLoader.getEventById('sect_choice');
  assert.deepEqual(sectChoice?.choices?.map(choice => choice.id), [
    'join_shaolin',
    'join_wudang',
    'stay_home',
  ]);
  assert.equal(eventLoader.getEventById('sect_path_choice'), undefined);
  assert.equal(sectChoice?.priority, 1);
  assert.equal(sectChoice?.storyLine, 'sect_opportunity');

  const sectTrialEntry = eventLoader.getEventById('sect_trial_entry');
  assert.equal(sectTrialEntry?.storyLine, 'sect_opportunity');

  for (const choiceId of ['join_shaolin', 'join_wudang']) {
    const choice = sectChoice?.choices?.find(candidate => candidate.id === choiceId);
    assert(choice?.outcomes?.length, `${choiceId} must define admission outcomes`);
    for (const outcome of choice.outcomes) {
      assert(
        outcome.effects?.some(
          effect => effect.type === 'flag_set' && effect.target === 'sect_trial_active',
        ),
        `${choiceId}/${outcome.id} must open sect_trial_entry`,
      );
    }
  }

  const joinedShaolin = createYouthEngine(14);
  joinedShaolin.getGameState().player.lifeStates.trainingHabit = 1;
  await executeChoice(joinedShaolin, 'sect_choice', 'join_shaolin');
  assert(availableIds(joinedShaolin, 14).has('sect_trial_entry'));

  const declinedSect = createYouthEngine(14);
  declinedSect.getGameState().player.lifeStates.trainingHabit = 1;
  await executeChoice(declinedSect, 'sect_choice', 'stay_home');
  assert(!availableIds(declinedSect, 14).has('sect_trial_entry'));

  // A sect opportunity needs real martial practice, not only the age window.
  const noPractice = createYouthEngine(15);
  const trained = createYouthEngine(15);
  assert(!availableIds(noPractice, 15).has('sect_choice'));
  trained.getGameState().player.lifeStates.trainingHabit = 1;
  assert(availableIds(trained, 15).has('sect_choice'));
  assert.deepEqual(
    sectChoice?.choices
      ?.filter(choice => choice.condition === undefined)
      .map(choice => choice.id),
    ['join_shaolin', 'join_wudang', 'stay_home'],
  );

  const martialImprovement = eventLoader.getEventById('martial_improvement');
  assert.equal(martialImprovement?.category, 'side_quest');
  assert.equal(martialImprovement?.priority, 2);
  assert.deepEqual(martialImprovement?.ageRange, { min: 16, max: 20 });
  assert.equal(martialImprovement?.storyLine, undefined);
  const untrainedMartial = createYouthEngine(16);
  const trainedMartial = createYouthEngine(16);
  trainedMartial.getGameState().player.lifeStates.trainingHabit = 1;
  assert(!availableIds(untrainedMartial, 16).has('martial_improvement'));
  assert(availableIds(trainedMartial, 16).has('martial_improvement'));

  // The public market entry is available without social exposure; participation
  // only records that the player met Mingyue and must not start a romance state.
  assert.equal(eventLoader.getEventById('meet_love_interest'), undefined);
  const noExposure = createYouthEngine(18);
  const withExposure = createYouthEngine(18, { connections: 5 });
  assert(availableIds(noExposure, 18).has('mingyue_market_meet'));
  assert(availableIds(withExposure, 18).has('mingyue_market_meet'));
  const met = createYouthEngine(15, { connections: 5 });
  await executeChoice(met, 'mingyue_market_meet', 'mingyue_participate');
  assert.equal(met.getGameState().flags.mingyue_met, true);
  assert.equal(met.getGameState().flags.love_started, undefined);
  assert(!availableIds(met, 15).has('mingyue_second_encounter'));
  assert(availableIds(met, 16).has('mingyue_second_encounter'));

  // Shadow-sect contact needs youth road peril; acceptance only opens its invitation.
  const shadowWithoutContact = createYouthEngine(16, { chivalry: 20 });
  shadowWithoutContact.getGameState().player.lifeStates.trainingHabit = 1;
  const shadowContact = eventLoader.getEventById('demonic_encounter');
  const roadPeril = eventLoader.getEventById('youth_road_peril');
  assert.equal(shadowContact?.priority, 1);
  assert.equal(shadowContact?.storyLine, 'shadow_sect');
  assert.equal(roadPeril?.priority, 1);
  assert.equal(roadPeril?.storyLine, 'shadow_sect');
  assert(!availableIds(shadowWithoutContact, 16).has('demonic_encounter'));
  assert(!availableIds(shadowWithoutContact, 16).has('outlaw_identity_beginning'));
  assert(availableIds(shadowWithoutContact, 14).has('youth_road_peril'));

  const noTrainingPeril = createYouthEngine(14, { chivalry: 20 });
  assert(!availableIds(noTrainingPeril, 14).has('youth_road_peril'));

  const shadowAfterPeril = createYouthEngine(16, { chivalry: 20 });
  shadowAfterPeril.getGameState().player.lifeStates.trainingHabit = 1;
  recordFact(shadowAfterPeril.getGameState(), 'youth_road_peril');
  assert(availableIds(shadowAfterPeril, 16).has('demonic_encounter'));
  assert(!availableIds(shadowAfterPeril, 16).has('youth_road_peril'));

  // Legacy injury / jianghu facts no longer open the shadow contact by themselves.
  assert.deepEqual(formalFactsForDifficultySetback('injury_accident'), [
    'injury_accident',
    'setback_injury',
  ]);
  const afterDifficultyInjury = createYouthEngine(16, { chivalry: 20 });
  afterDifficultyInjury.getGameState().player.lifeStates.trainingHabit = 1;
  for (const factId of formalFactsForDifficultySetback('injury_accident')) {
    recordFact(afterDifficultyInjury.getGameState(), factId);
  }
  assert(!availableIds(afterDifficultyInjury, 16).has('demonic_encounter'));

  const shadowAfterJianghuExperience = createYouthEngine(16, { chivalry: 20 });
  shadowAfterJianghuExperience.getGameState().player.lifeStates.trainingHabit = 1;
  recordFact(shadowAfterJianghuExperience.getGameState(), 'jianghu_experience');
  assert(!availableIds(shadowAfterJianghuExperience, 16).has('demonic_encounter'));

  const acceptedContact = createYouthEngine(16, { chivalry: 20 });
  recordFact(acceptedContact.getGameState(), 'youth_road_peril');
  await executeChoice(acceptedContact, 'demonic_encounter', 'accept_demonic');
  assert.equal(acceptedContact.getGameState().player.affiliation, null);
  assert.equal(acceptedContact.getGameState().flags.route_demonic, undefined);
  assert(availableIds(acceptedContact, 16).has('outlaw_identity_beginning'));

  const declinedContact = createYouthEngine(16, { chivalry: 20 });
  recordFact(declinedContact.getGameState(), 'youth_road_peril');
  await executeChoice(declinedContact, 'demonic_encounter', 'decline_demonic');
  assert.equal(declinedContact.getGameState().player.affiliation, null);
  assert(!availableIds(declinedContact, 16).has('outlaw_identity_beginning'));

  const survivedRoadPeril = createYouthEngine(14, { chivalry: 20 });
  survivedRoadPeril.getGameState().player.lifeStates.trainingHabit = 1;
  await executeChoice(survivedRoadPeril, 'youth_road_peril', 'youth_road_peril_flee');
  assert(
    survivedRoadPeril.getGameState().eventHistory.some(record => record.eventId === 'youth_road_peril'),
  );
  assert(availableIds(survivedRoadPeril, 16).has('demonic_encounter'));
  const refusedOutlaw = createYouthEngine(16);
  recordFact(refusedOutlaw.getGameState(), 'demonic_encounter_accept');
  await executeChoice(refusedOutlaw, 'outlaw_identity_beginning', 'decline_outlaw');
  assert.equal(refusedOutlaw.getGameState().player.affiliation, null);
  assert(!availableIds(refusedOutlaw, 16).has('outlaw_identity_beginning'));
  assert(!availableIds(refusedOutlaw, 16).has('outlaw_cultivation'));

  for (const [choiceId, player] of [
    ['join_outlaw_full', { martialPower: 30, chivalry: -10 }],
    ['join_outlaw_conditional', { chivalry: 0 }],
  ] as const) {
    const joinedShadowSect = createYouthEngine(16, player);
    recordFact(joinedShadowSect.getGameState(), 'demonic_encounter_accept');
    await executeChoice(joinedShadowSect, 'outlaw_identity_beginning', choiceId);
    assert.equal(joinedShadowSect.getGameState().player.affiliation, 'shadow_sect', choiceId);
    assert.equal(joinedShadowSect.getGameState().flags.route_demonic, undefined, choiceId);
    assert.equal(joinedShadowSect.getGameState().flags.route_orthodox, undefined, choiceId);
    assert.equal(joinedShadowSect.getGameState().flags.sect_faction, undefined, choiceId);
    assert.equal(joinedShadowSect.getGameState().flags.outlaw_identity_done, undefined, choiceId);
  }

  // Joining must unlock the formal downstream shadow-sect line through canonical affiliation.
  const joinedShadowSectFollowUp = createYouthEngine(16, { martialPower: 30, chivalry: -10 });
  recordFact(joinedShadowSectFollowUp.getGameState(), 'demonic_encounter_accept');
  await executeChoice(joinedShadowSectFollowUp, 'outlaw_identity_beginning', 'join_outlaw_full');
  assert(availableIds(joinedShadowSectFollowUp, 16).has('outlaw_cultivation'));
  for (const eventId of ['outlaw_cultivation', 'outlaw_mission', 'outlaw_rise', 'outlaw_final_choice']) {
    const downstream = eventLoader.getEventById(eventId);
    assert(downstream, `missing downstream event: ${eventId}`);
    const expressions = downstream.conditions
      ?.filter(condition => condition.type === 'expression')
      .map(condition => condition.expression)
      .join(' ') ?? '';
    assert(expressions.includes("player.affiliation == 'shadow_sect'"), `${eventId} must use canonical affiliation`);
    assert(!expressions.includes('outlaw_identity_done'), `${eventId} must not read retired flag`);
    assert(!JSON.stringify(downstream.triggerConditions ?? {}).includes('outlaw_identity_done'), `${eventId} triggerConditions must not read retired flag`);
  }
  const chivalryRecruitSource = readFileSync('src/data/lines/chivalry-events.json', 'utf8');
  assert(!chivalryRecruitSource.includes('outlaw_identity_done'));

  for (const removedOutlawId of [
    'outlaw_path_beginning',
    'outlaw_training',
    'outlaw_mentor',
    'outlaw_mercy_choice',
    'outlaw_legitimacy_debate',
  ]) {
    assert.equal(eventLoader.getEventById(removedOutlawId), undefined);
  }

  // A tournament invitation needs martial ability plus one public proof.
  for (const [proof, player, expected] of [
    ['none', { martialPower: 15 }, false],
    ['affiliation', { martialPower: 15, affiliation: 'shaolin' }, true],
    ['reputation', { martialPower: 15, reputation: 10 }, true],
    ['connections', { martialPower: 15, connections: 10 }, true],
  ] as const) {
    const tournamentCandidate = createYouthEngine(20, player);
    assert.equal(
      availableIds(tournamentCandidate, 20).has('martial_arts_invitation'),
      expected,
      proof,
    );
  }

  const tournamentPaths = [
    ['accept_invitation', true, false],
    ['observe_only', false, true],
    ['decline_invitation', false, false],
  ] as const;
  for (const [choiceId, expectsBeginner, expectsObserver] of tournamentPaths) {
    const tournamentPath = createYouthEngine(20, { martialPower: 15, reputation: 10 });
    await executeChoice(tournamentPath, 'martial_arts_invitation', choiceId);
    for (let age = 19; age <= 23; age += 1) {
      const tournamentIds = availableIds(tournamentPath, age);
      assert.equal(tournamentIds.has('martial_arts_beginner'), expectsBeginner, `${choiceId}/${age}`);
      assert.equal(tournamentIds.has('martial_arts_observer'), expectsObserver, `${choiceId}/${age}`);
    }
  }

  // Staying home must remain a closed non-route result.
  const stayedHome = createYouthEngine(15, { martialPower: 15 });
  await executeChoice(stayedHome, 'sect_choice', 'stay_home');
  assert.equal(stayedHome.getGameState().player.affiliation, null);
  assert.equal(stayedHome.getGameState().flags.route_orthodox, undefined);
  assert.equal(stayedHome.getGameState().flags.route_wanderer, undefined);
  assert.equal(stayedHome.getGameState().flags.route_demonic, undefined);

  // Expired opportunity windows must not backfill when their former facts exist.
  const expiredOpportunities = createYouthEngine(21, { charisma: 10, martialPower: 15 });
  expiredOpportunities.getGameState().player.lifeStates.trainingHabit = 1;
  recordFact(expiredOpportunities.getGameState(), 'jianghu_experience');
  recordFact(expiredOpportunities.getGameState(), 'demonic_encounter_accept');
  const expiredIds = availableIds(expiredOpportunities, 21);
  assert(!expiredIds.has('sect_choice'));
  assert(!expiredIds.has('mingyue_market_meet'));
  assert(!expiredIds.has('outlaw_identity_beginning'));

  // A life with no target line still selects regular formal or daily gameplay at 21.
  const noMajorLine = createYouthEngine(21);
  const noMajorIds = availableIds(noMajorLine, 21);
  const unavailableAtTwentyOne = new Set([
    'sect_choice',
    'mingyue_market_meet',
    'youth_road_peril',
    'demonic_encounter',
    'outlaw_identity_beginning',
    'martial_arts_invitation',
    'mingyue_second_encounter',
    'mingyue_shared_experience',
    'mingyue_value_conflict',
    'mingyue_relationship_choice',
    'martial_arts_beginner',
    'martial_arts_observer',
    'love_demonic_conflict',
  ]);
  for (const eventId of unavailableAtTwentyOne) {
    assert(!noMajorIds.has(eventId), `${eventId} must not backfill at age 21`);
  }
  const progressionState = createYouthEngine(21).getGameState();
  const progressionSnapshot = defaultSnapshotConverter.toSnapshot(progressionState, {
    eventCatalogVersion: '1.0.0',
    sourcePlatform: 'node-headless',
    time: { now: () => 0 },
  });
  const progressionSession = HeadlessEngineSessionImpl.create({ snapshot: progressionSnapshot });
  let reachedRegularOrDaily = false;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const nextAtTwentyOne = await progressionSession.getNextEvent();
    assert(nextAtTwentyOne, 'age 21 with no major line must still select an event');
    assert(!unavailableAtTwentyOne.has(nextAtTwentyOne.eventId));
    const isRegularFormal =
      (nextAtTwentyOne.raw.priority ?? 2) >= 2 && !nextAtTwentyOne.raw.storyLine;
    if (isRegularFormal || nextAtTwentyOne.raw.category === 'daily') {
      reachedRegularOrDaily = true;
      break;
    }

    assert(nextAtTwentyOne.raw.storyLine, 'only a selected unrelated storyline can be marked seen');
    recordFact(progressionSession.getRuntimeState(), nextAtTwentyOne.eventId);
  }
  assert(reachedRegularOrDaily, 'age 21 with no major line must reach regular formal or daily gameplay');

  // The slice must not add runtime state or change the persisted schema.
  const cleanState = createYouthEngine(21).getGameState();
  assert.deepEqual(Object.keys(cleanState).sort(), INITIAL_GAME_STATE_KEYS);
  assert.deepEqual(Object.keys(cleanState.player).sort(), INITIAL_PLAYER_STATE_KEYS);
  assert.deepEqual(Object.keys(stayedHome.getGameState()).sort(), POST_CHOICE_GAME_STATE_KEYS);
  assert.deepEqual(Object.keys(stayedHome.getGameState().player).sort(), INITIAL_PLAYER_STATE_KEYS);
  const snapshot = defaultSnapshotConverter.toSnapshot(stayedHome.getGameState(), {
    eventCatalogVersion: '1.0.0',
    sourcePlatform: 'node-headless',
    time: { now: () => 0 },
  });
  assert.equal(snapshot.metadata.schemaVersion, GAME_STATE_SNAPSHOT_SCHEMA_VERSION);
  assert.equal(GAME_STATE_SNAPSHOT_SCHEMA_VERSION, '3.16.0');

  console.log('youthCausalOpportunity.test.ts: ok');
}

await main();
