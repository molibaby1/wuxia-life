/**
 * P11 stage/route-driven narrative scheduling tests.
 */

import { getAllStageConfigs } from '../src/narrative/config/stageConfig';
import { eventLoader } from '../src/core/EventLoader';
import { ConditionEvaluator } from '../src/core/ConditionEvaluator';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { dailyEventSystem } from '../src/core/DailyEventSystem';
import {
  detectStageSignalsForStage,
  eventCoversMissingStageSignal,
  listEventsCoveringStageSignal,
} from '../src/p11/signalDetection';
import {
  buildNarrativeSchedulingContext,
  buildNarrativeSchedulingContextFromState,
  PERSONA_ROUTE_MAP,
} from '../src/p11/schedulingContext';
import {
  describeSchedulingBias,
  getNarrativeSchedulingMultiplier,
  getStageSchedulingMultiplier,
  STAGE_BIAS_MULTIPLIER,
} from '../src/p11/schedulingPolicy';
import {
  assembleP11SchedulingGateReport,
  buildStageBaseline,
  buildStageGapReport,
  buildRouteBaseline,
} from '../src/p11/reportBuilder';
import { isStageSignalKey, STAGE_SIGNAL_KEYS } from '../src/p11/signalVocabulary';
import { classifyStageGap } from '../src/p11/gapClassification';
import type { GameProcessRecord } from '../src/types/simulationRecordTypes';
import { EventCategory, EventPriority } from '../src/types/eventTypes';
import type { EventDefinition, GameState } from '../src/types/eventTypes';
import { runAllPersonaSimulations } from '../src/p9/simulationRunner';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function makeRecord(age: number, eventId: string, flags: Record<string, unknown> = {}): GameProcessRecord {
  const gameState = {
    player: { age, flags: {} },
    flags,
  } as GameState;
  return {
    age,
    eventId,
    eventTitle: eventId,
    eventType: 'auto',
    gameState,
    timestamp: new Date().toISOString(),
  };
}

function makeAchievementState(overrides: {
  money?: number;
  martialPower?: number;
  knowledge?: number;
} = {}): GameState {
  return {
    player: {
      age: 35,
      martialPower: overrides.martialPower ?? 0,
      knowledge: overrides.knowledge ?? 0,
      flags: {},
    },
    flags: {},
    eventHistory: [],
  } as GameState;
}

function achievementDetected(finalState: GameState, records: GameProcessRecord[] = []): boolean {
  return detectStageSignalsForStage('stage_30_40', { records, finalState }).some(
    signal => signal.key === 'achievement',
  );
}

function withAchievementEventFixture<T>(callback: () => T): T {
  const fixtureEvent = {
    id: 'p11_test_declared_achievement',
    metadata: {
      narrativeScheduling: { stageSignals: ['achievement'] },
    },
  } as NonNullable<ReturnType<typeof eventLoader.getEventById>>;
  const originalGetEventById = eventLoader.getEventById.bind(eventLoader);
  eventLoader.getEventById = eventId =>
    eventId === fixtureEvent.id ? fixtureEvent : originalGetEventById(eventId);
  try {
    return callback();
  } finally {
    eventLoader.getEventById = originalGetEventById;
  }
}

function testSignalVocabulary(): void {
  assert(STAGE_SIGNAL_KEYS.length >= 10, 'stage signal vocabulary populated');
  assert(isStageSignalKey('relationship_shift'), 'relationship_shift is valid');
  assert(!isStageSignalKey('unknown_signal'), 'unknown signal rejected');
}

function testSignalDetectionHelpers(): void {
  const records = [
    makeRecord(5, 'origin_childhood', {}),
    makeRecord(8, 'childhood_choice_event', {}),
    makeRecord(8, 'action_training_basic', { p9_echo_training_hook: true }),
  ];
  records[2].progressionKind = 'active_action';
  records[2].activeActionId = 'action_training_basic';
  records[1].eventType = 'choice';

  const detected = detectStageSignalsForStage('stage_0_10', { records, ageMin: 0, ageMax: 10 });
  const keys = detected.map(item => item.key);
  assert(keys.includes('origin') || keys.includes('childhood_choice'), 'stage 0-10 detection works');
}

function testGapClassification(): void {
  const gap = classifyStageGap('stage_20_30', 'relationship_shift', false);
  assert(['no-content', 'weak-scheduling', 'weak-detection'].includes(gap.cause), 'gap cause valid');
  assert(gap.example.length > 0, 'gap example recorded');
}

function testSchedulingContext(): void {
  const records: GameProcessRecord[] = [
    makeRecord(22, 'some_event', { p9_early_social_focus: true }),
  ];
  const state = records[0].gameState as GameState;
  state.player!.age = 24;
  const context = buildNarrativeSchedulingContext(records, state);
  assert(context.stageId === 'stage_20_30', 'stage 20-30 resolved');
  assert(context.expectedStageSignals.includes('relationship_shift'), 'relationship_shift expected');
  assert(Array.isArray(context.missingStageSignals), 'missing signals computed');
}

function testAchievementMoneyInvariance(): void {
  const moneyValues = [0, 399, 400, 9999];
  const detected = moneyValues.map(money => achievementDetected(makeAchievementState({ money })));
  assert(
    detected.every(value => !value),
    `money alone must not detect achievement (results: ${detected.join(', ')})`,
  );

  const contexts = moneyValues.map(money =>
    buildNarrativeSchedulingContext([], makeAchievementState({ money })),
  );
  const baselineMissing = JSON.stringify(contexts[0]?.missingStageSignals);
  assert(
    contexts.every(context => JSON.stringify(context.missingStageSignals) === baselineMissing),
    'money alone must not change P11 scheduling context',
  );
}

function testAchievementMartialFallbackRemains(): void {
  for (const money of [0, 400, 9999]) {
    assert(
      achievementDetected(makeAchievementState({ money, martialPower: 40 })),
      `martialPower=40 must detect achievement with money=${money}`,
    );
  }
}

function testAchievementKnowledgeFallbackRemains(): void {
  for (const money of [0, 400, 9999]) {
    assert(
      achievementDetected(makeAchievementState({ money, knowledge: 30 })),
      `knowledge=30 must detect achievement with money=${money}`,
    );
  }
}

function testAchievementEventEvidenceRemains(): void {
  withAchievementEventFixture(() => {
    const record = makeRecord(35, 'p11_test_declared_achievement');
    assert(
      achievementDetected(makeAchievementState(), [record]),
      'declared achievement stage signal must detect achievement with low stats',
    );
  });
}

function testStageSchedulingMultiplier(): void {
  const event = eventLoader.getEventById('p11_relationship_shift_midlife');
  assert(event !== undefined, 'p11 relationship event loaded');
  const records: GameProcessRecord[] = [];
  const state = {
    player: { age: 25, flags: { p9_early_social_focus: true } },
    flags: { p9_early_social_focus: true },
    eventHistory: [],
  } as GameState;
  const context = buildNarrativeSchedulingContext(records, state);
  const multiplier = getStageSchedulingMultiplier(event!, context);
  assert(multiplier === STAGE_BIAS_MULTIPLIER, 'stage bias applies when signal is missing');
  assert(
    eventCoversMissingStageSignal(event!, ['relationship_shift']),
    'event declares relationship_shift coverage',
  );
}

function testWealthReinforcementAcceptsDeferredUpbringing(): void {
  const event = eventLoader.getEventById('p11_wealth_reinforcement_first_deal');
  assert(event !== undefined, 'wealth reinforcement event loaded');
  const evaluator = new ConditionEvaluator();
  const deferredOnly = {
    player: { age: 22, flags: {} },
    flags: { p16_deferred_business_upbringing: true },
  } as GameState;
  assert(
    evaluator.evaluate(event!.conditions![0], deferredOnly),
    'p11_wealth_reinforcement_first_deal should accept p16_deferred_business_upbringing',
  );
  const earlyFocus = {
    player: { age: 22, flags: { p9_early_business_focus: true } },
    flags: { p9_early_business_focus: true },
  } as GameState;
  assert(
    evaluator.evaluate(event!.conditions![0], earlyFocus),
    'p11_wealth_reinforcement_first_deal should accept p9_early_business_focus',
  );
}

function makeAgeLaneProbe(
  id: string,
  age: number,
  priority: EventPriority,
  storyLine?: string,
): EventDefinition {
  return {
    id,
    version: 'test',
    category: EventCategory.SIDE_QUEST,
    priority,
    weight: 1,
    ageRange: { min: age, max: age },
    triggers: [],
    content: { title: id, text: id },
    eventType: 'auto',
    storyLine,
    metadata: { createdAt: 0, updatedAt: 0, enabled: true, tags: [] },
  };
}

function testWealthReinforcementReachabilityProof(): void {
  const event = eventLoader.getEventById('p11_wealth_reinforcement_first_deal');
  assert(event !== undefined, 'runtime catalog must load p11_wealth_reinforcement_first_deal');
  assert(event!.ageRange.min === 22 && event!.ageRange.max === 22, 'wealth reinforcement is exact age 22');
  const tags = event!.metadata?.tags ?? [];
  assert(tags.includes('mandatory') && tags.includes('mainline'), 'wealth reinforcement remains mandatory mainline');

  const engine = new GameEngineIntegration();
  const state = engine.getGameState();
  const flags = { p9_early_business_focus: true };
  state.player.age = 22;
  state.player.alive = true;
  state.flags = flags;
  state.player.flags = flags;
  const evaluator = new ConditionEvaluator();
  assert(state.player.age === 22, 'wealth reinforcement proof state is age 22');
  assert(
    (event!.conditions ?? []).every(condition => evaluator.evaluate(condition, state)),
    'wealth reinforcement conditions pass with canonical early-business evidence',
  );
  const runtimeAvailableEvents = engine.getAvailableEvents(22);
  assert(
    runtimeAvailableEvents.some(candidate => candidate.id === event!.id),
    'wealth reinforcement is available to the runtime scheduler',
  );

  const storylineProbe = makeAgeLaneProbe('wealth_storyline_probe', 22, EventPriority.HIGH, 'wealth-proof');
  const regularProbe = makeAgeLaneProbe('wealth_regular_probe', 22, EventPriority.NORMAL);
  const dailyProbe = makeAgeLaneProbe('daily_wealth_probe', 22, EventPriority.LOW);
  const originalGetAvailableEvents = engine.getAvailableEvents.bind(engine);
  const originalDailySelector = dailyEventSystem.selectEvent;
  let dailySelections = 0;

  try {
    engine.getAvailableEvents = () => [event!, storylineProbe, regularProbe];
    (dailyEventSystem as any).selectEvent = () => {
      dailySelections += 1;
      return dailyProbe;
    };
    const selected = engine.selectEvent(22);
    assert(selected?.id === event!.id, 'exact-age wealth reinforcement cannot lose to storyline or regular formal events');
    assert(dailySelections === 0, 'exact-age mandatory wealth reinforcement bypasses daily fallback');
  } finally {
    engine.getAvailableEvents = originalGetAvailableEvents;
    (dailyEventSystem as any).selectEvent = originalDailySelector;
  }
}

function testWandererReinforcementReachabilityProof(): void {
  const event = eventLoader.getEventById('p11_wanderer_reinforcement_connections');
  assert(event !== undefined, 'runtime catalog must load p11_wanderer_reinforcement_connections');
  assert(event!.ageRange.min === 22 && event!.ageRange.max === 26, 'wanderer reinforcement age range is 22-26');
  const tags = event!.metadata?.tags ?? [];
  assert(tags.includes('mandatory') && tags.includes('mainline'), 'wanderer reinforcement remains mandatory mainline');

  const engine = new GameEngineIntegration();
  const state = engine.getGameState();
  const flags = { p9_early_travel_focus: true };
  state.player.age = 24;
  state.player.alive = true;
  state.flags = flags;
  state.player.flags = flags;
  const evaluator = new ConditionEvaluator();
  assert(state.player.age >= 22 && state.player.age <= 26, 'wanderer reinforcement proof state is within age 22-26');
  assert(
    (event!.conditions ?? []).every(condition => evaluator.evaluate(condition, state)),
    'wanderer reinforcement conditions pass with canonical early-travel evidence',
  );
  const runtimeAvailableEvents = engine.getAvailableEvents(24);
  assert(
    runtimeAvailableEvents.some(candidate => candidate.id === event!.id),
    'wanderer reinforcement is available to the runtime scheduler',
  );

  const storylineProbe = makeAgeLaneProbe('wanderer_storyline_probe', 24, EventPriority.HIGH, 'wanderer-proof');
  const regularProbe = makeAgeLaneProbe('wanderer_regular_probe', 24, EventPriority.NORMAL);
  const dailyProbe = makeAgeLaneProbe('daily_wanderer_probe', 24, EventPriority.LOW);
  const originalGetAvailableEvents = engine.getAvailableEvents.bind(engine);
  const originalShouldYield = (engine as any).shouldYieldRegularFormalToDailyCadence;
  const originalShouldPause = (engine as any).shouldPauseEventsThisYear;
  const originalDailySelector = dailyEventSystem.selectEvent;
  let dailySelections = 0;

  try {
    engine.getAvailableEvents = () => [event!, storylineProbe, regularProbe];
    (engine as any).shouldYieldRegularFormalToDailyCadence = () => true;
    (engine as any).shouldPauseEventsThisYear = () => true;
    (dailyEventSystem as any).selectEvent = () => {
      dailySelections += 1;
      return dailyProbe;
    };
    const selected = engine.selectEvent(24);
    assert(selected?.id === event!.id, 'mandatory wanderer reinforcement enters the critical scheduling layer');
    assert(dailySelections === 0, 'mandatory wanderer reinforcement cannot be displaced by regular or daily events');
  } finally {
    engine.getAvailableEvents = originalGetAvailableEvents;
    (engine as any).shouldYieldRegularFormalToDailyCadence = originalShouldYield;
    (engine as any).shouldPauseEventsThisYear = originalShouldPause;
    (dailyEventSystem as any).selectEvent = originalDailySelector;
  }
}

async function testPersonaSimulationAndGate(): Promise<void> {
  const bundles = await runAllPersonaSimulations();
  const personaBundles = bundles.map(bundle => ({
    personaId: bundle.personaId,
    records: bundle.records,
  }));

  const wealth = bundles.find(bundle => bundle.personaId === 'p8-wealth-shen');
  const wanderer = bundles.find(bundle => bundle.personaId === 'p8-explorer-lu');
  assert(wealth !== undefined, 'wealth persona simulation produced');
  assert(wanderer !== undefined, 'wanderer persona simulation produced');

  const stageBaseline = buildStageBaseline(personaBundles);
  assert(stageBaseline.length === 4, 'four stage bands in baseline');
  const gaps = buildStageGapReport(stageBaseline, personaBundles);
  assert(Array.isArray(gaps), 'gap report array');

  const routeBaseline = buildRouteBaseline(personaBundles);
  assert(routeBaseline.some(route => route.routeId === 'route_wealth'), 'wealth route audited');

  const wealthRoute = routeBaseline.find(route => route.routeId === 'route_wealth');
  assert(wealthRoute !== undefined, 'wealth route baseline entry');

  const gate = assembleP11SchedulingGateReport(personaBundles);
  assert(gate.schemaVersion === 'p11-scheduling-v1', 'gate schema');
  assert(gate.decision !== 'fail', `P11 scheduling gate must not fail (got ${gate.decision})`);
}

function makeMerchantProofState(engine: GameEngineIntegration): GameState {
  const state = engine.getGameState();
  const flags = {
    route_merchant: true,
    p9_early_business_focus: true,
  };
  state.player.age = 28;
  state.player.alive = true;
  state.flags = flags;
  state.player.flags = flags;
  return state;
}

async function testMerchantRouteReachabilityProof(): Promise<void> {
  const merchantEvent = eventLoader.getEventById('p9_merchant_midlife_caravan');
  assert(merchantEvent !== undefined, 'runtime catalog must load p9_merchant_midlife_caravan');
  assert(merchantEvent!.ageRange.min === 28 && merchantEvent!.ageRange.max === 28, 'merchant route point is exact age 28');
  assert(merchantEvent!.priority === EventPriority.CRITICAL, 'merchant route point remains critical');
  const tags = merchantEvent!.metadata?.tags ?? [];
  assert(tags.includes('mandatory') && tags.includes('mainline'), 'merchant route point remains mandatory mainline');

  const engine = new GameEngineIntegration();
  const state = makeMerchantProofState(engine);
  const evaluator = new ConditionEvaluator();
  assert(state.player.age === 28 && state.player.alive === true, 'merchant proof state is alive at age 28');
  assert(
    (merchantEvent!.conditions ?? []).every(condition => evaluator.evaluate(condition, state)),
    'merchant route point conditions pass with canonical merchant evidence',
  );

  const runtimeAvailableEvents = engine.getAvailableEvents(28);
  assert(
    runtimeAvailableEvents.some(event => event.id === merchantEvent!.id),
    'merchant route point appears in runtime available events',
  );

  const storylineProbe = makeAgeLaneProbe('merchant_storyline_probe', 28, EventPriority.HIGH, 'merchant-proof');
  const regularProbe = makeAgeLaneProbe('merchant_regular_probe', 28, EventPriority.NORMAL);
  const dailyProbe = makeAgeLaneProbe('daily_merchant_proof', 28, EventPriority.LOW);
  const originalGetAvailableEvents = engine.getAvailableEvents.bind(engine);
  const originalShouldYield = (engine as any).shouldYieldRegularFormalToDailyCadence;
  const originalShouldPause = (engine as any).shouldPauseEventsThisYear;
  const originalDailySelector = dailyEventSystem.selectEvent;
  let dailySelections = 0;

  try {
    engine.getAvailableEvents = () => [...runtimeAvailableEvents, storylineProbe, regularProbe];
    (engine as any).shouldYieldRegularFormalToDailyCadence = () => true;
    (engine as any).shouldPauseEventsThisYear = () => true;
    (dailyEventSystem as any).selectEvent = () => {
      dailySelections += 1;
      return dailyProbe;
    };

    const selected = engine.selectEvent(28);
    assert(selected?.id === merchantEvent!.id, 'exact-age merchant event cannot lose to storyline, regular, or daily');
    assert(dailySelections === 0, 'exact-age mandatory merchant event bypasses daily fallback');
  } finally {
    engine.getAvailableEvents = originalGetAvailableEvents;
    (engine as any).shouldYieldRegularFormalToDailyCadence = originalShouldYield;
    (engine as any).shouldPauseEventsThisYear = originalShouldPause;
    (dailyEventSystem as any).selectEvent = originalDailySelector;
  }

  const choiceOutcomes = new Map<string, string>();
  for (const choiceId of ['lead_caravan', 'hire_agent'] as const) {
    const choiceEngine = new GameEngineIntegration();
    const choiceState = makeMerchantProofState(choiceEngine);
    const choice = merchantEvent!.choices?.find(candidate => candidate.id === choiceId);
    assert(choice !== undefined, `merchant event exposes ${choiceId}`);
    await choiceEngine.executeChoiceEffects(choice!.effects ?? [], merchantEvent!.id, choiceId);
    assert(choiceState.flags.p9_merchant_midlife_path === true, `${choiceId} establishes merchant midlife path`);
    const identity = choiceState.flags.p9_route_identity_merchant_master;
    assert(typeof identity === 'string', `${choiceId} establishes merchant identity evidence`);
    choiceOutcomes.set(choiceId, identity);
  }

  assert(
    choiceOutcomes.get('lead_caravan') === 'merchant_caravan_master',
    'lead_caravan preserves caravan-master identity outcome',
  );
  assert(
    choiceOutcomes.get('hire_agent') === 'merchant_investor',
    'hire_agent preserves merchant-investor identity outcome',
  );
  assert(
    choiceOutcomes.get('lead_caravan') !== choiceOutcomes.get('hire_agent'),
    'merchant choices preserve identity divergence',
  );
}

function testSchedulerWiringDiagnostics(): void {
  const event = eventLoader.getEventById('p11_relationship_shift_midlife')!;
  const state = {
    player: { age: 25, flags: { p9_early_social_focus: true } },
    flags: { p9_early_social_focus: true },
    eventHistory: [],
  } as GameState;
  const context = buildNarrativeSchedulingContextFromState(state);
  const reasons = describeSchedulingBias(event, context);
  assert(reasons.some(reason => reason.startsWith('stage-missing:')), 'stage missing bias reason emitted');
  assert(getNarrativeSchedulingMultiplier(event, context) > 1, 'combined multiplier reflects stage bias');
}

function testContentMetadataCoverage(): void {
  const relationshipEvents = listEventsCoveringStageSignal('relationship_shift');
  assert(
    relationshipEvents.some(event => event.id === 'p11_relationship_shift_midlife'),
    'relationship_shift content declares coverage',
  );
  const divergence = eventLoader.getEventById('p11_wealth_wanderer_divergence_fork')!;
  assert(
    (divergence.metadata?.narrativeScheduling?.routePoints?.length ?? 0) >= 2,
    'divergence event declares route points',
  );
}

function testPersonaRouteMapCoversPrimaryRoutes(): void {
  const routes = new Set(Object.values(PERSONA_ROUTE_MAP));
  for (const routeId of ['route_martial', 'route_wealth', 'route_wanderer', 'route_deviant']) {
    assert(routes.has(routeId), `persona map includes ${routeId}`);
  }
}

function testStageConfigAlignment(): void {
  const stages = getAllStageConfigs();
  for (const stage of stages) {
    for (const signal of stage.feedbackExpectation.expectedSignals) {
      assert(isStageSignalKey(signal), `stage ${stage.id} signal ${signal} normalized`);
    }
  }
}

export async function runP11SchedulingTests(): Promise<void> {
  testSignalVocabulary();
  testSignalDetectionHelpers();
  testGapClassification();
  testSchedulingContext();
  testAchievementMoneyInvariance();
  testAchievementMartialFallbackRemains();
  testAchievementKnowledgeFallbackRemains();
  testAchievementEventEvidenceRemains();
  testStageSchedulingMultiplier();
  testWealthReinforcementAcceptsDeferredUpbringing();
  testWealthReinforcementReachabilityProof();
  testWandererReinforcementReachabilityProof();
  testSchedulerWiringDiagnostics();
  testContentMetadataCoverage();
  testPersonaRouteMapCoversPrimaryRoutes();
  testStageConfigAlignment();
  await testMerchantRouteReachabilityProof();
  await testPersonaSimulationAndGate();
  console.log('P11 scheduling tests passed');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runP11SchedulingTests().catch(error => {
    console.error(error);
    process.exit(1);
  });
}
