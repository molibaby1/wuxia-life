import { deriveLifeMemorySummary } from '../src/core/deriveLifeMemorySummary';
import { buildMainScreenModel } from '../src/components/mainScreenModel';
import { RouteStateManager } from '../src/core/RouteStateManager';
import type { GameState, PlayerState } from '../src/types/eventTypes';

const player: PlayerState = {
  name: '界面测试', gender: 'male', age: 31, martialPower: 8,
  externalSkill: 0, internalSkill: 0, qinggong: 0, chivalry: 20,
  charisma: 0, constitution: 30, comprehension: 30, money: 100,
  reputation: 40, connections: 12, healthStatus: 'healthy', statuses: [], alive: true,
  items: [], flags: {}, events: [], relationships: [],
};
let state: GameState = {
  player, facts: {}, flags: {}, relations: {}, eventHistory: [],
  identity: { identities: ['merchant', 'doctor'], primary: 'merchant' },
  achievements: ['merchant_shop_grocery'],
};
state = RouteStateManager.commitRoad(state, 'statecraft', {
  choiceId: 'merchant_entry_choice', eventId: 'merchant_entry',
});
const summary = deriveLifeMemorySummary(state);
const model = buildMainScreenModel(player, summary);

if (!summary.roadCommitments?.some((item) => item.name === '经世' && item.phase === 'active')) {
  throw new Error('人生记忆必须显示规范道路与阶段');
}
if (model.identitySummary !== 'merchant / doctor') {
  throw new Error('人生摘要必须独立显示身份');
}
if (!model.routeSummary.includes('经世')) {
  throw new Error('主界面路线摘要必须读取规范道路名');
}
if (!model.roadCommitmentSummary.includes('入局')) {
  throw new Error('经世 active 阶段应显示玩家语义“入局”');
}
state = RouteStateManager.recordRoadProof(state, 'statecraft', 'merchant_proof');
const lockedModel = buildMainScreenModel(player, deriveLifeMemorySummary(state));
if (!lockedModel.roadCommitmentSummary.includes('经世 · 深耕 · 证明 1')) {
  throw new Error('经世 locked_in 阶段应显示玩家语义“深耕”');
}
if (!model.topResources.find((item) => item.key === 'reputation')?.description?.includes('不直接推进道路')) {
  throw new Error('主界面必须解释声望不是道路投入');
}

console.log('US-004 canonical life memory UI model tests passed');
