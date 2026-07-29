import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ConditionEvaluator } from '../src/core/ConditionEvaluator';
import { eventLoader } from '../src/core/EventLoader';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import {
  applyRouteTrackFixtureBootstrap,
  applyRouteTrackPreparation,
  enforceRouteTrackIsolation,
} from '../src/headless/parity/routeTrackFixtures';
import {
  GOLDEN_LINE_SAMPLES,
  runP3EvalSimulation,
} from '../scripts/goldenLineSimulation';
import { evaluateMidlifeGate } from '../scripts/midlifeGate';
import type { GoldenLineSimulationRun } from '../scripts/goldenLineSimulation';

function initialState() {
  return new GameEngineIntegration().getGameState();
}

function assertFlagMirrors(state: ReturnType<typeof initialState>, flagName: string, value: unknown): void {
  assert.equal(state.flags[flagName], value, `top-level flag ${flagName}`);
  assert.equal(state.player.flags[flagName], value, `player flag ${flagName}`);
}

function testFixtureUsesBothFlagPaths(): void {
  const cases = [
    { track: 'sect' as const, age: 13, flag: 'route_orthodox' },
    { track: 'wanderer' as const, age: 13, flag: 'route_wanderer' },
    { track: 'demonic' as const, age: 14, flag: 'route_demonic' },
  ];

  for (const { track, age, flag } of cases) {
    const state = initialState();
    applyRouteTrackFixtureBootstrap(state, track, age);
    assertFlagMirrors(state, flag, true);
  }

  const state = initialState();
  state.flags.route_orthodox = true;
  state.player.flags.route_orthodox = true;
  enforceRouteTrackIsolation(state, 'demonic');
  assertFlagMirrors(state, 'route_orthodox', false);
  assert.equal(state.routeHistory?.length ?? 0, 0);
  assert.equal(
    (state.eventHistory ?? []).some(entry => entry.eventId.startsWith('route_state:')),
    false,
  );
}

function testFirstMidlifeEventsAreConditionEligible(): void {
  const evaluator = new ConditionEvaluator();
  const cases = [
    { track: 'sect' as const, age: 31, ids: ['sect_midlife_stewardship'] },
    {
      track: 'demonic' as const,
      age: 31,
      ids: ['demonic_midlife_expansion', 'demonic_midlife_expansion_survivor'],
    },
    {
      track: 'wanderer' as const,
      age: 31,
      ids: ['hero_old_case_returns', 'hero_reputation_backlash'],
    },
  ];

  for (const { track, age, ids } of cases) {
    const state = initialState();
    for (let fixtureAge = 0; fixtureAge <= age; fixtureAge += 1) {
      applyRouteTrackPreparation(state, track, fixtureAge);
      applyRouteTrackFixtureBootstrap(state, track, fixtureAge);
    }
    const eligible = ids.some(id => {
      const event = eventLoader.getEventById(id);
      return event?.conditions?.every(condition => evaluator.evaluate(condition, state)) ?? false;
    });
    assert.equal(eligible, true, `${track} first midlife event should be condition-eligible`);
  }
}

function testMidlifeGateIgnoresLegacyRouteContradictions(): void {
  const base = initialState();
  const records = [31, 35, 40].map((age, index) => ({
    age,
    eventId: index === 0 ? 'sect_midlife_stewardship' : `sect_midlife_followup_${index}`,
    eventType: 'choice' as const,
    gameState: {
      ...base,
      player: { ...base.player, age, alive: true },
      routeStates: {
        sect: { lifecycle: 'active', lockedIn: true },
        demonic: { lifecycle: 'active', lockedIn: true },
      },
    },
  }));
  const run = {
    sample: GOLDEN_LINE_SAMPLES[0],
    report: {
      finalAge: 50,
      isAlive: true,
      records,
    },
    replay: [],
  } as unknown as GoldenLineSimulationRun;
  const result = evaluateMidlifeGate([run]);
  assert.equal(result.failures.some(finding => finding.metric === 'route_contradiction'), false);
}

function testMidlifeGateRepositoryGuard(): void {
  const source = fs.readFileSync(path.resolve(process.cwd(), 'scripts/midlifeGate.ts'), 'utf8');
  for (const forbidden of [
    'route-conflict-table.json',
    'ACTIVE_LIFECYCLES',
    'getStrongExclusionPairs',
    'isRouteActive',
    'detectRouteContradictions',
    'route_contradiction',
    'routeStates',
    'strong_exclusion',
  ]) {
    assert.equal(source.includes(forbidden), false, `legacy midlife contradiction consumer remains: ${forbidden}`);
  }
}

async function testGoldenTrackContinuity(): Promise<void> {
  for (const sample of GOLDEN_LINE_SAMPLES.filter(sample => sample.routeTrack)) {
    const run = await runP3EvalSimulation(sample);
    const midlife = run.report.records.filter(record => record.age >= 31 && record.age <= 50);
    const routeEvents = midlife.filter(record => {
      if (sample.routeTrack === 'sect') return record.eventId.startsWith('sect_midlife');
      if (sample.routeTrack === 'demonic') return record.eventId.startsWith('demonic_midlife');
      return [
        'hero_old_case_returns',
        'hero_reputation_backlash',
        'hero_ally_pays_price',
        'hero_gray_judgment',
        'hero_freedom_settlement',
      ].includes(record.eventId);
    });
    assert.ok(routeEvents.length >= 3, `${sample.id} route events=${routeEvents.length}`);
    assert.ok(
      routeEvents.filter(record => record.eventType === 'choice').length >= 2,
      `${sample.id} manual choices=${routeEvents.filter(record => record.eventType === 'choice').length}`,
    );
  }
}

testFixtureUsesBothFlagPaths();
testFirstMidlifeEventsAreConditionEligible();
testMidlifeGateIgnoresLegacyRouteContradictions();
testMidlifeGateRepositoryGuard();
await testGoldenTrackContinuity();
console.log('canonicalRouteTrackMidlifeContinuity.test.ts passed');
