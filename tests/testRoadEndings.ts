import { EndingSystem } from '../src/core/EndingSystem';
import type { GameState, PlayerState } from '../src/types/eventTypes';

function createState(): GameState {
  const player: PlayerState = {
    name: '结局测试', gender: 'male', age: 70, martialPower: 0,
    chivalry: 0,
    charisma: 0, constitution: 50, money: 100, wealthCapacity: 'no_surplus',
    reputation: 0, connections: 10, healthStatus: 'healthy', statuses: [], alive: true,
    items: [], flags: {}, events: [], relationships: [], businessAcumen: 0, influence: 0,
  };
  return {
    player, flags: {}, relations: {}, eventHistory: [], achievements: [],
    karma: { good_karma: 0, evil_karma: 0, history: [] },
  } as GameState;
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function testExplicitEndingPrerequisites(): void {
  const martial = createState();
  Object.assign(martial.player, { martialPower: 95});
  assert(EndingSystem.canUnlockEnding(martial, 'martial_god'), 'martial_god should use explicit martial thresholds');

  const sect = createState();
  Object.assign(sect.player, { age: 65, reputation: 80, martialPower: 70, influence: 35 });
  sect.player.flags = { establish_sect: true, succession_completed: true };
  assert(EndingSystem.canUnlockEnding(sect, 'sect_founder'), 'sect_founder should use explicit founding facts');

  const official = createState();
  Object.assign(official.player, { age: 60, reputation: 70 });
  official.player.flags = { official_first_post: true, route_official_completed: true };
  assert(EndingSystem.canUnlockEnding(official, 'official_minister'), 'official_minister should require both explicit flags');

  const hermit = createState();
  hermit.player.flags = { peacefulHermit: true, retiredInCountryside: true };
  assert(EndingSystem.canUnlockEnding(hermit, 'hermit_master'), 'hermit_master should require both explicit retreat facts');

  const incompleteOfficial = createState();
  Object.assign(incompleteOfficial.player, { age: 60, reputation: 70 });
  incompleteOfficial.player.flags = { official_first_post: true };
  assert(!EndingSystem.canUnlockEnding(incompleteOfficial, 'official_minister'), 'official_minister must reject incomplete facts');
  const ordinaryRetirement = createState();
  ordinaryRetirement.player.flags = { retired: true };
  assert(!EndingSystem.canUnlockEnding(ordinaryRetirement, 'hermit_master'), 'retired alone must not unlock hermit_master');
}

testExplicitEndingPrerequisites();
// EventExecutor end_game behavior is covered by the active ending integration gates.
console.log('US-005 ending prerequisite tests passed');
