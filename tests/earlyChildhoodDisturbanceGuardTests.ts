import { resolveDisturbanceAfterAction } from '../src/core/activePlanning/DisturbanceResolver';
import { resolveActiveAction } from '../src/core/activePlanning/ActionResultResolver';
import type { GameState, PlayerState } from '../src/types/eventTypes';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

export function runEarlyChildhoodDisturbanceGuardTests(): void {
  const state = {
    player: { age: 5, martialPower: 0, chivalry: 0, internalSkill: 0 } as PlayerState,
    flags: {},
  } as GameState;
  const action = resolveActiveAction({
    state,
    actionId: 'action_childhood_training',
    random: () => 0.5,
  });
  assert(action !== null, 'childhood action resolves');
  const resolution = resolveDisturbanceAfterAction({
    state,
    actionResult: action!,
    random: () => 0,
    triggerChance: 1,
  });
  assert(resolution.disturbance === null, 'age 5 never returns adult disturbance card');

  const teenState = { ...state, player: { ...state.player, age: 10 } as PlayerState };
  const teenResolution = resolveDisturbanceAfterAction({
    state: teenState,
    actionResult: action!,
    random: () => 0,
    triggerChance: 1,
  });
  assert(teenResolution.disturbance !== null, 'age 10 may still receive disturbances');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runEarlyChildhoodDisturbanceGuardTests();
  console.log('earlyChildhoodDisturbanceGuardTests: ok');
}
