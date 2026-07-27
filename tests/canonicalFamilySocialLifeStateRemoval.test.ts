import fs from 'node:fs';
import path from 'node:path';
import { assert, assertDeepEqual, GameTestFramework } from './GameTestFramework';
import { temperaments } from '../src/data/traits/temperaments';
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

export function runCanonicalFamilySocialLifeStateRemovalTests(): void {
  testTraitDoesNotWriteLifeState();
  testSocialEchoRemainsFactOnly();
}

runCanonicalFamilySocialLifeStateRemovalTests();
console.log('canonicalFamilySocialLifeStateRemoval.test.ts passed');
