import { IdentitySystem } from '../src/core/IdentitySystem';
import { RouteStateManager } from '../src/core/RouteStateManager';
import type { GameState, PlayerState } from '../src/types/eventTypes';

function createState(): GameState {
  const player: PlayerState = {
    name: '身份测试', gender: 'female', age: 35, martialPower: 10,
    externalSkill: 0, internalSkill: 0, qinggong: 0, chivalry: 60,
    charisma: 0, constitution: 10, comprehension: 70, money: 6000,
    reputation: 60, connections: 10, healthStatus: 'healthy', statuses: [], alive: true,
    items: [], flags: { business_empire: true, heal_many_people: true },
    events: [], relationships: [],
  };
  return { player, flags: player.flags, relations: {}, eventHistory: [] };
}

let state = createState();
state = RouteStateManager.commitRoad(state, 'statecraft', { eventId: 'statecraft_entry' });
state = IdentitySystem.recordIdentity(state, 'merchant');
state = IdentitySystem.recordIdentity(state, 'doctor');

if (!state.identity?.identities.includes('merchant') || !state.identity.identities.includes('doctor')) {
  throw new Error('商人和医者身份应可同时记录');
}
if (state.identity.primary !== 'merchant') {
  throw new Error('追加身份不应覆盖既有 primary');
}
if (RouteStateManager.readRoadStage(state, 'statecraft') !== 'active') {
  throw new Error('身份变化不应重置或覆盖经世道路');
}

state.player.flags.establish_sect = true;
state = IdentitySystem.recordIdentity(state, 'sect_leader');
if (RouteStateManager.readRoadStage(state, 'statecraft') !== 'active') {
  throw new Error('组织成果不应单独等同道路完成');
}

console.log('US-003 identity separation tests passed');
