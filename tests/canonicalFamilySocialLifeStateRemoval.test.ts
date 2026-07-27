import fs from 'node:fs';
import path from 'node:path';
import { assert, assertDeepEqual, GameTestFramework } from './GameTestFramework';
import { temperaments } from '../src/data/traits/temperaments';
import { dailyEvents } from '../src/data/life/dailyEvents';
import { dailyEventSystem } from '../src/core/DailyEventSystem';
import { executeActiveActionOnState } from '../src/core/activePlanning/ActivePlanningService';
import { createDefaultPlayerLifeStates } from '../src/data/life/lifeStates';
import type { GameState } from '../src/types/eventTypes';

const framework = new GameTestFramework();

function createState(): GameState {
  return (framework as unknown as { createTestState(): GameState }).createTestState();
}

function testTraitDoesNotWriteLifeState(): void {
  const affectionate = temperaments.find(item => item.id === 'affectionate');
  assert(affectionate !== undefined, 'affectionate temperament exists');
  assert(!('startingStates' in affectionate), 'affectionate must not initialize family state');

  const eventTypesSource = fs.readFileSync(path.resolve('src/types/eventTypes.ts'), 'utf8');
  const traitSystemSource = fs.readFileSync(path.resolve('src/core/TraitSystem.ts'), 'utf8');
  assert(!/startingStates\??:|stateBiases\??:/.test(eventTypesSource), 'Trait contract must not expose life-state modifiers');
  assert(!/startingStates|stateBiases/.test(traitSystemSource), 'TraitSystem must not apply life-state modifiers');
}

function testSocialEchoRemainsFactOnly(): void {
  const state = createState();
  state.flags = {};
  state.player.flags = {};
  state.player.lifeStates = createDefaultPlayerLifeStates();

  executeActiveActionOnState(state, 'action_socializing_basic', {
    random: () => 0.5,
    includeDisturbance: false,
  });

  assert(state.flags.p9_echo_social_hook === true, 'social echo history fact remains');
  assertDeepEqual(state.player.lifeStates, createDefaultPlayerLifeStates(), 'social echo must not change lifeStates');

  const source = fs.readFileSync(path.resolve('src/core/activePlanning/ActivePlanningService.ts'), 'utf8');
  assert(!source.includes('mapEchoFlagToLifeState'), 'echo-to-life-state mapper must be removed');
  assert(!source.includes('collectShapingLongTermImpactLines'), 'active action must not emit shaping impacts');
}

function testFormalRuntimeDoesNotUseDeletedAxes(): void {
  const source = fs.readFileSync(path.resolve('src/core/GameEngineIntegration.ts'), 'utf8');
  assert(!source.includes('applyLifeStateRecovery'), 'time advancement must not decay deleted axes');
  assert(!source.includes('getFormalEventStateMultiplier'), 'formal scheduling must not use deleted axes');
  assert(!source.includes('applyFormalEventConsequences'), 'formal results must not synthesize deleted axes');
  assert(!/socialGain|familyGain/.test(source), 'tag/stat gain thresholds must not synthesize life states');
}

function findDailyEvent(id: string) {
  const event = dailyEvents.find(item => item.id === id);
  if (!event) throw new Error(`daily event not found: ${id}`);
  return event;
}

function testDailyEventsDoNotUseDeletedAxes(): void {
  const eventTypesSource = fs.readFileSync(path.resolve('src/types/eventTypes.ts'), 'utf8');
  assert(!eventTypesSource.includes('preferredStates'), 'DailyEventConfig must not expose preferredStates');

  for (const event of dailyEvents) {
    assert(!('preferredStates' in event), `${event.id} must not expose preferredStates`);
    for (const variant of Object.values(event.variants).flat()) {
      assert(
        !(variant.stateEffects ?? []).some(effect =>
          effect.state === ('familyBond' as never) || effect.state === ('socialMomentum' as never)),
        `${variant.id} must not produce deleted life states`,
      );
    }
  }

  const source = fs.readFileSync(path.resolve('src/core/DailyEventSystem.ts'), 'utf8');
  assert(!source.includes('preferredStates'), 'DailyEventSystem must not interpret preferredStates');
  assert(!source.includes('getGroupStateMultiplier'), 'deleted axes must not drive group multipliers');
  assert(!/socialMomentum|familyBond/.test(source), 'DailyEventSystem must not read deleted axes');
}

function testDailyWeightsAreAxisIndependent(): void {
  const state = createState();
  state.player.age = 30;
  state.player.lifeStates = createDefaultPlayerLifeStates();
  const config = findDailyEvent('daily_take_odd_job');
  const getWeight = (dailyEventSystem as unknown as {
    getWeight(config: typeof config, state: GameState): number;
  }).getWeight.bind(dailyEventSystem);

  const base = getWeight(config, state);
  const legacyInjected = structuredClone(state) as GameState;
  (legacyInjected.player.lifeStates as unknown as Record<string, number>).socialMomentum = 5;
  (legacyInjected.player.lifeStates as unknown as Record<string, number>).familyBond = 5;

  assert(getWeight(config, legacyInjected) === base, 'legacy injected axes must not affect daily weight');
}

export function runCanonicalFamilySocialLifeStateRemovalTests(): void {
  testTraitDoesNotWriteLifeState();
  testSocialEchoRemainsFactOnly();
  testFormalRuntimeDoesNotUseDeletedAxes();
  testDailyEventsDoNotUseDeletedAxes();
  testDailyWeightsAreAxisIndependent();
}

runCanonicalFamilySocialLifeStateRemovalTests();
console.log('canonicalFamilySocialLifeStateRemoval.test.ts passed');
