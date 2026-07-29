import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { EventExecutor } from '../src/core/EventExecutor';
import { EffectType } from '../src/types/eventTypes';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { RouteStateManager } from '../src/core/RouteStateManager';
import { ConditionEvaluator } from '../src/core/ConditionEvaluator';
import type { GameState } from '../src/types/eventTypes';

function initialState(): GameState {
  return new GameEngineIntegration().getGameState();
}

async function applyFlag(state: GameState, target: string, value: unknown = true): Promise<GameState> {
  return new EventExecutor().executeEffects([
    { type: EffectType.FLAG_SET, target, value } as any,
  ], state);
}

async function testRouteFlagsOnlyWriteFlags(): Promise<void> {
  let state = initialState();
  const initialRouteStates = JSON.stringify(state.routeStates ?? {});
  const initialRouteHistoryLength = state.routeHistory?.length ?? 0;
  const initialEventHistory = (state.eventHistory ?? []).length;

  for (const flagName of [
    'route_official',
    'route_beggars',
    'route_demonic',
    'route_orthodox',
    'route_wanderer',
    'route_merchant',
    'route_wealth_committed',
    'route_medical_committed',
    'route_renown_committed',
    'route_example_locked',
    'route_example_completed',
    'route_example_failed',
  ]) {
    state = await applyFlag(state, flagName);
  }

  assert.equal(state.flags.route_official, true);
  assert.equal(state.flags.route_example_completed, true);
  assert.equal(JSON.stringify(state.routeStates ?? {}), initialRouteStates);
  assert.equal(state.routeHistory?.length ?? 0, initialRouteHistoryLength);
  assert.equal((state.eventHistory ?? []).length, initialEventHistory);
}

async function testFactionMembershipRemainsWithoutRouteProjection(): Promise<void> {
  for (const faction of ['orthodox', 'unconventional', 'neutral', 'none']) {
    const before = initialState();
    const after = await applyFlag(before, 'sect_faction', faction);
    assert.equal(after.flags.sect_faction, faction === 'none' ? 'neutral' : faction);
    assert.equal(RouteStateManager.readRouteState(after, 'sect').lifecycle, 'inactive');
    assert.equal(RouteStateManager.readRouteState(after, 'demonic').lifecycle, 'inactive');
    assert.equal(RouteStateManager.readRouteState(after, 'wanderer').lifecycle, 'inactive');
  }

  const orthodox = await applyFlag(initialState(), 'sect_faction', 'orthodox');
  assert.equal(orthodox.flags.orthodox_member, true);
  assert.equal(orthodox.flags.unconventional_member, undefined);
  const unconventional = await applyFlag(initialState(), 'sect_faction', 'unconventional');
  assert.equal(unconventional.flags.unconventional_member, true);
  assert.equal(unconventional.flags.orthodox_member, undefined);
}

async function testFlagUnsetDoesNotDeactivateExistingRouteState(): Promise<void> {
  let state = initialState();
  state.flags.route_official = true;
  state.player.flags.route_official = true;
  state = RouteStateManager.writeRouteState(state, {
    routeId: 'official',
    lifecycle: 'active',
    category: 'main',
    eventId: 'explicit_route_setup',
  });
  const historyLength = state.routeHistory?.length ?? 0;
  const nextState = await new EventExecutor().executeEffects([
    { type: EffectType.FLAG_UNSET, target: 'route_official' } as any,
  ], state);
  assert.equal(nextState.flags.route_official, undefined);
  assert.equal(RouteStateManager.readRouteState(nextState, 'official').lifecycle, 'active');
  assert.equal(nextState.routeHistory?.length ?? 0, historyLength);
}

async function testExplicitRoadLifecycleStillWorks(): Promise<void> {
  let state = initialState();
  state = await new EventExecutor().executeEffects([
    {
      type: EffectType.ROAD_LIFECYCLE,
      roadId: 'statecraft',
      roadAction: 'commit',
      event: 'explicit_statecraft_commit',
    } as any,
  ], state);
  assert.equal(state.roadCommitments?.statecraft?.lifecycle, 'active');
  assert.equal(RouteStateManager.readRouteState(state, 'statecraft').lifecycle, 'active');

  state = await new EventExecutor().executeEffects([
    {
      type: EffectType.ROAD_LIFECYCLE,
      roadId: 'statecraft',
      roadAction: 'proof',
      event: 'explicit_statecraft_proof',
    } as any,
  ], state);
  assert.equal(state.roadCommitments?.statecraft?.proofCount, 1);
  assert.equal(state.roadCommitments?.statecraft?.lifecycle, 'locked_in');
}

function testExplicitConditionsRemain(): void {
  const evaluator = new ConditionEvaluator();
  const condition = { type: 'expression', expression: 'flags.has("route_orthodox")' } as any;
  assert.equal(evaluator.evaluate(condition, { ...initialState(), flags: { route_orthodox: true } }), true);
  assert.equal(evaluator.evaluate(condition, { ...initialState(), flags: {} }), false);
}

function testRepositoryGuard(): void {
  const runtime = [
    'src/core/EventExecutor.ts',
    'src/core/RouteStateManager.ts',
    'src/headless/parity/routeTrackFixtures.ts',
    'scripts/verifyRouteTrackSamples.ts',
  ].map(file => fs.readFileSync(path.resolve(process.cwd(), file), 'utf8')).join('\n');
  for (const forbidden of [
    'syncFromFlagSet',
    'syncFromFlagUnset',
    'resolveRouteFromFlag',
    'ROUTE_FLAG_TO_ROUTE_ID',
    'ROUTE_PLAYER_FLAG_TO_STATE_ID',
    'FACTION_TO_ROUTE_ID',
  ]) {
    assert.equal(runtime.includes(forbidden), false, `legacy flag projection remains: ${forbidden}`);
  }
  for (const retained of ['ROAD_LIFECYCLE', 'commitRoad', 'recordRoadProof', 'routeStates', 'routeHistory', 'roadCommitments']) {
    assert.equal(runtime.includes(retained), true, `required later-slice capability removed: ${retained}`);
  }
}

await testRouteFlagsOnlyWriteFlags();
await testFactionMembershipRemainsWithoutRouteProjection();
await testFlagUnsetDoesNotDeactivateExistingRouteState();
await testExplicitRoadLifecycleStillWorks();
testExplicitConditionsRemain();
testRepositoryGuard();
console.log('canonicalRouteFlagProjectionRemoval.test.ts passed');
