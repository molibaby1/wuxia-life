import { deriveLifeMemorySummary } from '../src/core/deriveLifeMemorySummary';
import { buildMainScreenModel } from '../src/components/mainScreenModel';
import type { GameState, PlayerState } from '../src/types/eventTypes';

const player: PlayerState = {
  name: '界面测试', gender: 'male', age: 31, martialPower: 8,
  chivalry: 20,
  charisma: 0, constitution: 30, comprehension: 30, money: 100,
  reputation: 40, connections: 12, healthStatus: 'healthy', statuses: [], alive: true,
  items: [], flags: { merchant_childhood_seed_done: true }, events: [], relationships: [],
};
let state: GameState = {
  player, facts: {}, flags: { merchant_childhood_seed_done: true }, relations: {}, eventHistory: [],
  identity: { identities: ['merchant', 'doctor'], primary: 'merchant' },
  achievements: ['merchant_shop_grocery'],
};
const summary = deriveLifeMemorySummary(state);
const model = buildMainScreenModel(player, summary);

if (!summary.currentGoalLabel) {
  throw new Error('人生记忆必须显示明确当前目标');
}
if (model.identitySummary !== 'merchant / doctor') {
  throw new Error('人生摘要必须独立显示身份');
}
if (model.currentGoalSummary !== summary.currentGoalLabel) {
  throw new Error('主界面目标摘要必须读取明确当前目标');
}
if (!model.topResources.find((item) => item.key === 'reputation')?.description?.includes('不直接代表人生投入')) {
  throw new Error('主界面必须解释声望不直接代表人生投入');
}

console.log('US-004 canonical life memory UI model tests passed');
