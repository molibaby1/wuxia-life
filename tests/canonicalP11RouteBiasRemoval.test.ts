import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ConditionEvaluator } from '../src/core/ConditionEvaluator';
import { eventLoader } from '../src/core/EventLoader';
import {
  buildNarrativeSchedulingContextFromState,
} from '../src/p11/schedulingContext';
import {
  buildRouteBaseline,
} from '../src/p11/reportBuilder';
import { observeRoutePoint } from '../src/p11/signalDetection';
import {
  describeSchedulingBias,
  getNarrativeSchedulingMultiplier,
  getStageSchedulingMultiplier,
  STAGE_BIAS_MULTIPLIER,
} from '../src/p11/schedulingPolicy';
import type { GameState } from '../src/types/eventTypes';

function stateWith(flags: Record<string, unknown>, routeStates: GameState['routeStates'] = {}): GameState {
  return {
    player: { age: 25, flags },
    flags,
    routeStates,
    eventHistory: [],
  } as GameState;
}

function testRouteFlagsDoNotBecomeSchedulingContext(): void {
  const flags = {
    p8_route_martial: true,
    p8_route_demonic: true,
    p9_early_business_focus: true,
    p9_early_travel_focus: true,
    p9_early_social_focus: true,
    p9_echo_training_hook: true,
    p9_echo_study_hook: true,
    p16_deferred_business_upbringing: true,
    p9_route_identity_merchant_master: true,
  };
  const context = buildNarrativeSchedulingContextFromState(stateWith(flags));
  for (const removedField of ['activeRouteIds', 'relevantReinforcementPoints', 'relevantDivergencePoints']) {
    assert.equal(removedField in context, false, `${removedField} must not be part of P11 runtime context`);
  }
}

function testRouteStatesDoNotChangeContext(): void {
  const flags = { p9_early_travel_focus: true, p9_echo_training_hook: true };
  const empty = buildNarrativeSchedulingContextFromState(stateWith(flags));
  const populated = buildNarrativeSchedulingContextFromState(stateWith(flags, {
    route_martial: { routeId: 'route_martial', lifecycle: 'active', startedAt: 20 },
    route_demonic: { routeId: 'route_demonic', lifecycle: 'locked_in', startedAt: 21 },
  }));
  assert.deepEqual(populated, empty, 'routeStates must not alter P11 scheduling context');
}

function testRoutePointsDoNotCreateIndependentMultiplier(): void {
  const event = {
    id: 'canonical_route_point_only',
    metadata: {
      pathAffinity: { route_wealth: 100 },
      narrativeScheduling: {
        routePoints: [{ routeId: 'route_wealth', kind: 'reinforcement', ageBand: '20-30' }],
      },
    },
  } as any;
  const context = {
    age: 25,
    stageId: 'stage_20_30',
    expectedStageSignals: ['relationship_shift'],
    satisfiedStageSignals: [],
    missingStageSignals: ['relationship_shift'],
  } as any;
  assert.equal(getNarrativeSchedulingMultiplier(event, context), 1, 'routePoints must not create an independent multiplier');
  assert.equal(getStageSchedulingMultiplier(event, context), 1, 'route-only event must not satisfy a stage gap');
  assert.deepEqual(describeSchedulingBias(event, context), [], 'route-only event must not emit route bias reasons');
}

function testStageSignalSchedulingRemains(): void {
  const event = eventLoader.getEventById('p11_relationship_shift_midlife');
  assert(event !== undefined, 'stage signal event remains in catalog');
  const context = {
    age: 25,
    stageId: 'stage_20_30',
    expectedStageSignals: ['relationship_shift'],
    satisfiedStageSignals: [],
    missingStageSignals: ['relationship_shift'],
  } as any;
  assert.equal(getNarrativeSchedulingMultiplier(event!, context), STAGE_BIAS_MULTIPLIER);
  assert.deepEqual(describeSchedulingBias(event!, context), ['stage-missing:relationship_shift']);
}

function testExplicitEventConditionsRemain(): void {
  const event = eventLoader.getEventById('p11_wealth_reinforcement_first_deal');
  const wanderer = eventLoader.getEventById('p11_wanderer_reinforcement_connections');
  const social = eventLoader.getEventById('p11_social_reinforcement_gathering');
  assert(event && wanderer && social, 'P11 explicit-condition events remain in catalog');
  const evaluator = new ConditionEvaluator();
  const accepted = stateWith({ p16_deferred_business_upbringing: true });
  const rejected = stateWith({});
  assert.equal(evaluator.evaluate(event!.conditions![0], accepted), true);
  assert.equal(evaluator.evaluate(event!.conditions![0], rejected), false);
  assert(wanderer!.conditions?.length || social!.conditions?.length, 'P11 content keeps explicit conditions');
}

function testRouteCoverageAuditRemains(): void {
  const report = buildRouteBaseline([]);
  assert(report.some(entry => entry.routeId === 'route_wealth'), 'route baseline audit remains available');
  const routePoint = report[0]?.points[0]?.point;
  if (routePoint) {
    const observed = observeRoutePoint(routePoint, [], {});
    assert.equal(typeof observed.observed, 'boolean');
  }
}

function testRepositoryGuard(): void {
  const runtimeFiles = [
    'src/p11/types.ts',
    'src/p11/schedulingContext.ts',
    'src/p11/schedulingPolicy.ts',
    'src/p12/readerRegistry.ts',
  ];
  const source = runtimeFiles
    .map(file => fs.readFileSync(path.resolve(process.cwd(), file), 'utf8'))
    .join('\n');
  for (const forbidden of [
    'activeRouteIds',
    'relevantReinforcementPoints',
    'relevantDivergencePoints',
    'resolveActiveRouteIds',
    'resolveRoutePreferenceFromState',
    'ROUTE_ENTRY_FLAG_ALIASES',
    'ROUTE_REINFORCEMENT_MULTIPLIER',
    'ROUTE_DIVERGENCE_MULTIPLIER',
    'getRouteReinforcementMultiplier',
    'getRouteDivergenceMultiplier',
    'route-reinforcement:',
    'route-divergence:',
  ]) {
    assert.equal(source.includes(forbidden), false, `legacy P11 route bias token remains: ${forbidden}`);
  }
  for (const retained of ['RouteDefinition', 'RouteSignalPoint', 'routePoints', 'buildRouteBaseline', 'PERSONA_ROUTE_MAP']) {
    assert.equal(source.includes(retained) || fs.readFileSync(path.resolve(process.cwd(), 'src/p11/reportBuilder.ts'), 'utf8').includes(retained), true, `audit token removed unexpectedly: ${retained}`);
  }
}

testRouteFlagsDoNotBecomeSchedulingContext();
testRouteStatesDoNotChangeContext();
testRoutePointsDoNotCreateIndependentMultiplier();
testStageSignalSchedulingRemains();
testExplicitEventConditionsRemain();
testRouteCoverageAuditRemains();
testRepositoryGuard();
console.log('canonicalP11RouteBiasRemoval.test.ts passed');
