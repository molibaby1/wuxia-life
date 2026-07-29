/**
 * P11 stage/route-driven narrative scheduling tests.
 */

import { getAllStageConfigs } from '../src/narrative/config/stageConfig';
import { eventLoader } from '../src/core/EventLoader';
import { ConditionEvaluator } from '../src/core/ConditionEvaluator';
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
import type { GameState } from '../src/types/eventTypes';
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

  const wealthHit = wealth!.records.find(record => record.eventId === 'p11_wealth_reinforcement_first_deal');
  assert(wealthHit !== undefined, 'wealth persona should trigger p11_wealth_reinforcement_first_deal');
  assert(wealthHit!.age === 22, 'wealth reinforcement should fire at age 22');

  const wealthCaravan = wealth!.records.find(record => record.eventId === 'p9_merchant_midlife_caravan');
  assert(wealthCaravan !== undefined, 'wealth persona should trigger p9_merchant_midlife_caravan');
  assert(
    wealthCaravan!.age >= 28 && wealthCaravan!.age <= 32,
    `merchant caravan should fire in 28-32 band (got age ${wealthCaravan!.age})`,
  );

  const wealthFinalFlags = {
    ...(wealth!.records.at(-1)?.gameState?.flags ?? {}),
    ...(wealth!.records.at(-1)?.gameState?.player?.flags ?? {}),
  };
  assert(
    wealthFinalFlags.p9_route_identity_merchant_master !== undefined &&
      wealthFinalFlags.p9_route_identity_merchant_master !== false,
    'wealth persona should resolve merchant_master identity by age 40',
  );

  const wandererHit = wanderer!.records.find(
    record => record.eventId === 'p11_wanderer_reinforcement_connections',
  );
  assert(wandererHit !== undefined, 'wanderer persona should trigger p11_wanderer_reinforcement_connections');

  const stageBaseline = buildStageBaseline(personaBundles);
  assert(stageBaseline.length === 4, 'four stage bands in baseline');
  const gaps = buildStageGapReport(stageBaseline, personaBundles);
  assert(Array.isArray(gaps), 'gap report array');

  const routeBaseline = buildRouteBaseline(personaBundles);
  assert(routeBaseline.some(route => route.routeId === 'route_wealth'), 'wealth route audited');

  const wealthRoute = routeBaseline.find(route => route.routeId === 'route_wealth');
  assert(wealthRoute !== undefined, 'wealth route baseline entry');
  assert(
    wealthRoute!.neverScheduledPoints.length === 0,
    `route_wealth should schedule all divergence/identity points (missing: ${wealthRoute!.neverScheduledPoints.map(p => p.point.description).join(', ')})`,
  );

  const gate = assembleP11SchedulingGateReport(personaBundles);
  assert(gate.schemaVersion === 'p11-scheduling-v1', 'gate schema');
  assert(gate.decision === 'pass', `P11 scheduling gate should pass (got ${gate.decision})`);
  assert(
    gate.summary.routePointsNeverScheduled === 0,
    `all configured route points should schedule in persona runs (got ${gate.summary.routePointsNeverScheduled})`,
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
  testStageSchedulingMultiplier();
  testWealthReinforcementAcceptsDeferredUpbringing();
  testSchedulerWiringDiagnostics();
  testContentMetadataCoverage();
  testPersonaRouteMapCoversPrimaryRoutes();
  testStageConfigAlignment();
  await testPersonaSimulationAndGate();
  console.log('P11 scheduling tests passed');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runP11SchedulingTests().catch(error => {
    console.error(error);
    process.exit(1);
  });
}
