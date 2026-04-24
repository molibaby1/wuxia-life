/**
 * 关键选择系统测试脚本
 */

import { CriticalChoiceSystem } from '../src/core/CriticalChoiceSystem';
import type { GameState, PlayerState } from '../src/types/eventTypes';

function createTestState(): GameState {
  const player: PlayerState = {
    name: '测试玩家',
    gender: 'male',
    age: 20,
    martialPower: 50,
    externalSkill: 40,
    internalSkill: 40,
    qinggong: 30,
    chivalry: 0,
    charisma: 50,
    constitution: 50,
    comprehension: 50,
    money: 1000,
    reputation: 30,
    connections: 20,
    health: 100,
    energy: 100,
    alive: true,
    items: [],
    flags: {},
    events: [],
    relationships: [],
  };

  return {
    saveVersion: '1.0.0',
    lastSavedAt: Date.now(),
    gameTimestamp: 0,
    player,
    currentTime: {
      year: 20,
      month: 1,
      day: 1,
    },
    flags: {},
    events: [],
    relations: {},
    statistics: {
      totalEvents: 0,
      totalChoices: 0,
      totalYears: 0,
    },
    identity: undefined,
    karma: {
      good_karma: 0,
      evil_karma: 0,
      history: [],
    },
    criticalChoices: {},
    achievements: [],
  };
}

console.log('=== 关键选择系统测试 ===\n');

// 测试 1: 初始状态
console.log('测试 1: 初始状态');
let state = createTestState();
console.log('已做选择:', Object.keys(state.criticalChoices!).length);
console.log('可用选择点:', CriticalChoiceSystem.getAvailableChoicePoints(state));
console.log('');

// 测试 2: 记录门派选择
console.log('测试 2: 记录门派选择（名门正派）');
state = CriticalChoiceSystem.recordChoice(state, 'sect_choice', 'orthodox', state);
console.log('是否已选择门派:', CriticalChoiceSystem.hasMadeChoice(state, 'sect_choice'));
console.log('门派选择结果:', CriticalChoiceSystem.getChoice(state, 'sect_choice'));
console.log('侠义变化:', state.player.chivalry);
console.log('声望变化:', state.player.reputation);
console.log('');

// 测试 3: 记录人生目标
console.log('测试 3: 记录人生目标（行侠仗义）');
state = CriticalChoiceSystem.recordChoice(state, 'life_goal', 'hero', state);
console.log('人生目标:', CriticalChoiceSystem.getChoice(state, 'life_goal'));
console.log('侠义变化:', state.player.chivalry);
console.log('');

// 测试 4: 检查选择条件（必需）
console.log('测试 4: 检查选择条件（必需）');
const req1 = CriticalChoiceSystem.checkChoiceRequirement(state, {
  required: ['sect_choice:orthodox'],
});
console.log('要求：sect_choice=orthodox, 结果:', req1);
console.log('预期：true');

const req2 = CriticalChoiceSystem.checkChoiceRequirement(state, {
  required: ['sect_choice:demon'],
});
console.log('要求：sect_choice=demon, 结果:', req2);
console.log('预期：false');
console.log('');

// 测试 5: 检查选择条件（禁止）
console.log('测试 5: 检查选择条件（禁止）');
const req3 = CriticalChoiceSystem.checkChoiceRequirement(state, {
  forbidden: ['life_goal:villain'],
});
console.log('禁止：life_goal=villain, 结果:', req3);
console.log('预期：true');

const req4 = CriticalChoiceSystem.checkChoiceRequirement(state, {
  forbidden: ['life_goal:hero'],
});
console.log('禁止：life_goal=hero, 结果:', req4);
console.log('预期：false');
console.log('');

// 测试 6: 记录婚姻选择
console.log('测试 6: 记录婚姻选择（自由恋爱）');
state = CriticalChoiceSystem.recordChoice(state, 'marriage_choice', 'love', state);
console.log('婚姻选择:', CriticalChoiceSystem.getChoice(state, 'marriage_choice'));
console.log('魅力变化:', state.player.charisma);
console.log('侠义变化:', state.player.chivalry);
console.log('');

// 测试 7: 获取所有选择
console.log('测试 7: 获取所有选择');
const allChoices = CriticalChoiceSystem.getAllChoices(state);
console.log('所有选择:', allChoices);
console.log('');

// 测试 8: 年龄范围检查
console.log('测试 8: 年龄范围检查');
state.player.age = 14;
console.log('14 岁是否在 sect_choice 范围内:', CriticalChoiceSystem.isAtChoicePoint(state, 'sect_choice'));
console.log('14 岁是否在 life_goal 范围内:', CriticalChoiceSystem.isAtChoicePoint(state, 'life_goal'));

state.player.age = 45;
console.log('45 岁是否在 war_choice 范围内:', CriticalChoiceSystem.isAtChoicePoint(state, 'war_choice'));
console.log('');

// 测试 9: 选择后果测试
console.log('测试 9: 不同选择的后果对比');
state = createTestState();
state = CriticalChoiceSystem.recordChoice(state, 'sect_choice', 'demon', state);
console.log('选择魔教后：');
console.log('  侠义:', state.player.chivalry);
console.log('  武力:', state.player.martialPower);

state = createTestState();
state = CriticalChoiceSystem.recordChoice(state, 'sect_choice', 'orthodox', state);
console.log('选择正派后：');
console.log('  侠义:', state.player.chivalry);
console.log('  声望:', state.player.reputation);
console.log('');

console.log('=== 测试完成 ===');
