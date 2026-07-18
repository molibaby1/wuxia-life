import {
  ANNUAL_PASSIVE_MEMORY_ENTRY_COUNT,
  commitAnnualPassiveMemory,
  isAnnualPassiveMemoryAge,
  prepareAnnualPassiveMemory,
} from '../src/core/activePlanning/annualPassiveMemory';
import type { GameState, PlayerState } from '../src/types/eventTypes';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function merchantInfantState(age = 0): GameState {
  return {
    player: {
      age,
      comprehension: 10,
      constitution: 10,
      health: 100,
      businessAcumen: 4,
      connections: 2,
      flags: {},
    } as PlayerState,
    flags: { origin_merchant_family: true },
    currentTime: { year: 1, month: 2, day: 3 },
    eventHistory: [],
  } as GameState;
}

export function runAnnualPassiveMemoryTests(): void {
  assert(isAnnualPassiveMemoryAge(0), 'age 0 is annual-memory band');
  assert(isAnnualPassiveMemoryAge(3), 'age 3 is annual-memory band');
  assert(!isAnnualPassiveMemoryAge(4), 'age 4 leaves annual-memory band');

  const state = merchantInfantState(0);
  const plan = prepareAnnualPassiveMemory(state, () => 0);

  assert(plan.entries.length === ANNUAL_PASSIVE_MEMORY_ENTRY_COUNT, 'one annual card prepares two entries');
  assert(plan.headline === '0岁这一年', `unexpected headline: ${plan.headline}`);
  assert(plan.body.includes('【') && plan.body.includes('】'), 'body preserves entry titles');
  assert(plan.body.split('\n\n').length === 2, 'body contains two narrative beats');
  assert((state.eventHistory ?? []).length === 0, 'preparing the visible card does not mutate gameplay state');

  const result = commitAnnualPassiveMemory(state, plan);
  assert((state.eventHistory ?? []).length === 2, 'both source events remain traceable');
  assert(Boolean(state.flags?.merchant_infant_shop_birth), 'first source flag applied');
  assert(Boolean(state.flags?.merchant_infant_swaddle_abacus), 'second source flag applied');
  const timestamp = state.eventHistory?.[0]?.timestamp;
  assert(
    typeof timestamp === 'object' &&
      timestamp.year === 1 &&
      timestamp.month === 2 &&
      timestamp.day === 3,
    'source event carries a copy of current time',
  );
  assert(result.entryIds.join(',') === plan.entries.map(entry => entry.id).join(','), 'commit uses the displayed entries');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runAnnualPassiveMemoryTests();
  console.log('annualPassiveMemoryTests: ok');
}
