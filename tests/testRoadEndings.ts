import { EndingSystem } from '../src/core/EndingSystem';
import { EventExecutor } from '../src/core/EventExecutor';
import { RouteStateManager } from '../src/core/RouteStateManager';
import type { GameState, PlayerState } from '../src/types/eventTypes';

function createState(): GameState {
  const player: PlayerState = {
    name: '结局测试', gender: 'male', age: 70, martialPower: 100,
    externalSkill: 100, internalSkill: 100, qinggong: 100, chivalry: 0,
    charisma: 0, constitution: 50, comprehension: 50, money: 2000,
    reputation: 80, connections: 10, healthStatus: 'healthy', statuses: [], alive: true,
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

const qualificationBlocked = createState();
qualificationBlocked.player.flags.business_empire = true;
qualificationBlocked.player.lifeStates = {
  discipline: 0, indulgence: 0, familyBond: 3,
  socialMomentum: 0, trainingHabit: 0, studyHabit: 0, businessHabit: 0,
};
let blockedRoad = RouteStateManager.commitRoad(qualificationBlocked, 'statecraft', { eventId: 'merchant_commitment' });
blockedRoad = RouteStateManager.recordRoadProof(blockedRoad, 'statecraft', 'merchant_proof');
if (EndingSystem.canUnlockEnding(blockedRoad, 'richest_man')
  || EndingSystem.determineEnding(blockedRoad).id === 'richest_man') {
  throw new Error('canUnlockEnding and determineEnding must share positive ending qualification gates');
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

async function verifyEndingRoadCompletion(): Promise<void> {
  const executor = new EventExecutor();
  let successful = createState();
  successful.player.flags.business_empire = true;
  successful = RouteStateManager.commitRoad(successful, 'statecraft', { eventId: 'merchant_commitment' });
  successful = RouteStateManager.recordRoadProof(successful, 'statecraft', 'merchant_proof');
  successful = await executor.executeEffects([{ type: 'special', target: 'end_game' }], successful);
  if (successful.roadCommitments?.statecraft?.lifecycle !== 'completed') {
    throw new Error('successful road ending must complete the canonical road');
  }
  if (successful.ending?.id !== 'richest_man') {
    throw new Error('successful ending must persist the real ending prototype');
  }

  let neutral = createState();
  neutral.player.martialPower = 0;
  neutral.player.externalSkill = 0;
  neutral.player.internalSkill = 0;
  neutral.player.qinggong = 0;
  neutral.player.money = 0;
  neutral.player.businessAcumen = 0;
  neutral = RouteStateManager.commitRoad(neutral, 'statecraft', { eventId: 'merchant_commitment' });
  neutral = RouteStateManager.recordRoadProof(neutral, 'statecraft', 'merchant_proof');
  neutral = await executor.executeEffects([{ type: 'special', target: 'end_game' }], neutral);
  if (neutral.roadCommitments?.statecraft?.lifecycle !== 'locked_in') {
    throw new Error('neutral ending must not complete the canonical road');
  }

  let negative = createState();
  negative.karma = { good_karma: 0, evil_karma: 100, history: [] };
  negative = RouteStateManager.commitRoad(negative, 'statecraft', { eventId: 'merchant_commitment' });
  negative = RouteStateManager.recordRoadProof(negative, 'statecraft', 'merchant_proof');
  negative = await executor.executeEffects([{ type: 'special', target: 'end_game' }], negative);
  if (negative.roadCommitments?.statecraft?.lifecycle !== 'locked_in') {
    throw new Error('negative ending must not complete the canonical road');
  }
}

verifyEndingRoadCompletion().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
