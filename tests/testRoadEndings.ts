import { EndingSystem } from '../src/core/EndingSystem';
import { EventExecutor } from '../src/core/EventExecutor';
import type { GameState, PlayerState } from '../src/types/eventTypes';

function createState(): GameState {
  const player: PlayerState = {
    name: '结局测试', gender: 'male', age: 70, martialPower: 0,
    chivalry: 0,
    charisma: 0, constitution: 50, money: 100,
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

  const richest = createState();
  Object.assign(richest.player, { age: 60, money: 1500, businessAcumen: 70 });
  richest.player.flags = { business_empire: true };
  assert(EndingSystem.canUnlockEnding(richest, 'richest_man'), 'richest_man should use explicit business facts');

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

async function testEndGameUsesExplicitEndingEffects(): Promise<void> {
  const state = createState();
  state.player.age = 60;
  state.player.money = 1500;
  state.player.businessAcumen = 70;
  state.player.flags = { business_empire: true };
  const result = await new EventExecutor().executeEffects([{ type: 'special', target: 'end_game' }], state);

  assert(result.ending?.id === 'richest_man', 'positive ending must still persist');
  assert(result.player.alive === false, 'end_game must mark player dead');
  assert(result.flags.gameEnded === true && result.flags.ending_triggered === true, 'end_game flags must persist');
  assert(result.flags.ending_richest_man === true, 'ending-specific flag must persist');
}

testExplicitEndingPrerequisites();
await testEndGameUsesExplicitEndingEffects();
console.log('US-005 ending prerequisite tests passed');
