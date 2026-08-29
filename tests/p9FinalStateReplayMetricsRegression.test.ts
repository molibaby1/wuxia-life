import assert from 'node:assert/strict';
import { collectReplayMetrics } from '../src/p8/collectPersonaMetrics';
import type { GameProcessReport } from '../src/types/simulationRecordTypes';
import type { GameState } from '../src/types/eventTypes';

function state(flags: Record<string, unknown>): GameState {
  return {
    player: {
      name: 'fixture',
      age: 40,
      gender: 'male',
      alive: true,
      martialPower: 10,
      money: 100,
      flags: {},
      lifeStates: { trainingHabit: 0, studyHabit: 0, businessHabit: 0 },
    },
    flags,
    facts: {},
    relations: {},
    eventHistory: [],
  } as GameState;
}

function report(personaId: string, finalGameState: GameState): GameProcessReport {
  const preActionState = state({});
  return {
    id: personaId,
    timestamp: '',
    config: {} as GameProcessReport['config'],
    randomSeed: 1,
    runMode: 'age_range',
    ageRange: { startAge: 0, endAge: 40 },
    totalYears: 40,
    finalAge: 40,
    isAlive: true,
    deathReason: null,
    totalEvents: 1,
    totalChoices: 0,
    totalSaves: 0,
    totalLoads: 0,
    persistenceConsistency: { totalChecks: 0, passedChecks: 0, failedChecks: 0, results: [] },
    records: [{
      age: 40,
      eventId: 'active_action:action_training_basic',
      eventTitle: '练功',
      eventType: 'auto',
      progressionKind: 'active_action',
      activeActionId: 'action_training_basic',
      gameState: preActionState,
      timestamp: '',
    }],
    finalGameState,
    statistics: {
      childhoodEvents: 0,
      youthEvents: 0,
      adultEvents: 1,
      elderlyEvents: 0,
      autoEvents: 1,
      choiceEvents: 0,
      martialPowerGrowth: 0,
      sectJoined: null,
      children: 0,
    },
  };
}

const merchantFinal = state({
  p9_route_identity_merchant_master: 'merchant_caravan_master',
  p9_echo_training_hook: true,
});
const wandererFinal = state({
  p9_route_identity_wanderer: 'wanderer_map_legend',
  p9_echo_training_hook: false,
});

const sameFinalMetrics = collectReplayMetrics([
  {
    personaId: 'p8-wealth-shen',
    report: report('wealth', merchantFinal),
  },
  {
    personaId: 'p8-explorer-lu',
    report: report('explorer', merchantFinal),
  },
]);
const differentFinalMetrics = collectReplayMetrics([
  {
    personaId: 'p8-wealth-shen',
    report: report('wealth', merchantFinal),
  },
  {
    personaId: 'p8-explorer-lu',
    report: report('explorer', wandererFinal),
  },
]);

assert.notEqual(
  sameFinalMetrics.pairwiseSimilarities[0]?.score,
  differentFinalMetrics.pairwiseSimilarities[0]?.score,
  'real final states must drive replay similarity',
);
console.log('p9FinalStateReplayMetricsRegression.test.ts: ok');
