import { EndingSystem } from '../src/core/EndingSystem';
import { RouteStateManager } from '../src/core/RouteStateManager';
import type { GameState, PlayerState } from '../src/types/eventTypes';

function createState(): GameState {
  const player: PlayerState = {
    name: '结局测试', gender: 'male', age: 70, martialPower: 100,
    externalSkill: 100, internalSkill: 100, qinggong: 100, chivalry: 0,
    charisma: 0, constitution: 50, comprehension: 50, money: 2000,
    reputation: 80, connections: 10, health: 100, energy: 100, alive: true,
    items: [], flags: {}, events: [], relationships: [], businessAcumen: 80,
  };
  return { player, flags: {}, relations: {}, eventHistory: [], achievements: [], karma: { good_karma: 0, evil_karma: 0, history: [] } };
}

let state = createState();
state.player.flags.business_empire = true;
state.player.businessAcumen = 0;
if (EndingSystem.canUnlockEnding(state, 'richest_man')) {
  throw new Error('businessAcumen=0 不应解锁 richest_man');
}
state.player.businessAcumen = 80;
if (EndingSystem.determineEnding(state).id === 'richest_man') {
  throw new Error('财富和商业 flag 不应单独替代经世道路证明');
}
if (EndingSystem.canUnlockEnding(state, 'richest_man')) {
  throw new Error('richest_man 不应在缺少道路证明时被解锁');
}
state = RouteStateManager.commitRoad(state, 'statecraft', { eventId: 'merchant_commitment' });
state = RouteStateManager.recordRoadProof(state, 'statecraft', 'merchant_proof');
if (EndingSystem.determineEnding(state).id !== 'richest_man') {
  throw new Error('经世 locked_in + proof 应允许经世终局原型');
}
if (!EndingSystem.canUnlockEnding(state, 'richest_man')) {
  throw new Error('richest_man 在经世 locked_in + proof 后应被解锁');
}

let martial = createState();
martial = RouteStateManager.commitRoad(martial, 'martial', { eventId: 'martial_commitment' });
martial = RouteStateManager.recordRoadProof(martial, 'martial', 'martial_proof');
if (EndingSystem.determineEnding(martial).id !== 'martial_god') {
  throw new Error('武道 locked_in + proof 应允许武道终局原型');
}
if (!EndingSystem.canUnlockEnding(martial, 'martial_god')) {
  throw new Error('martial_god 在武道 locked_in + proof 后应被解锁');
}

let official = createState();
official.player.martialPower = 0;
official.player.externalSkill = 0;
official.player.internalSkill = 0;
official.player.qinggong = 0;
official = RouteStateManager.commitRoad(official, 'official', { eventId: 'official_commitment' });
official = RouteStateManager.recordRoadProof(official, 'official', 'official_proof');
if (EndingSystem.determineEnding(official).id !== 'official_minister') {
  throw new Error('仕途 locked_in + proof 应允许仕途终局原型');
}
if (!EndingSystem.canUnlockEnding(official, 'official_minister')) {
  throw new Error('official_minister 在仕途 locked_in + proof 后应被解锁');
}

console.log('US-005 road ending tests passed');
