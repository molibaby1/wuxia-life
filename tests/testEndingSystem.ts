/**
 * 结局系统测试脚本
 */

import { EndingSystem } from '../src/core/EndingSystem';
import type { GameState, PlayerState } from '../src/types/eventTypes';

function createTestState(): GameState {
  const player: PlayerState = {
    name: '测试玩家',
    gender: 'male',
    age: 70,
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
      year: 70,
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

console.log('=== 结局系统测试 ===\n');

// 测试 1: 平凡一生（默认结局）
console.log('测试 1: 平凡一生（默认结局）');
let state = createTestState();
const ending1 = EndingSystem.determineEnding(state);
console.log('结局:', ending1.name);
console.log('描述:', ending1.description.substring(0, 50) + '...');
console.log('分类:', EndingSystem.getEndingCategory(ending1));
console.log('预期：平凡一生（中性）');
console.log('');

// 测试 2: 传奇英雄
console.log('测试 2: 传奇英雄');
state = createTestState();
state.player.chivalry = 85;
state.player.reputation = 85;
state.karma!.good_karma = 120;
const ending2 = EndingSystem.determineEnding(state);
console.log('结局:', ending2.name);
console.log('分类:', EndingSystem.getEndingCategory(ending2));
console.log('预期：传奇英雄（正面）');
console.log('');

// 测试 3: 武学之神
console.log('测试 3: 武学之神');
state = createTestState();
state.player.martialPower = 95;
state.player.externalSkill = 95;
state.player.internalSkill = 95;
state.player.qinggong = 95;
const ending3 = EndingSystem.determineEnding(state);
console.log('结局:', ending3.name);
console.log('分类:', EndingSystem.getEndingCategory(ending3));
console.log('预期：武学之神（正面）');
console.log('');

// 测试 4: 开宗立派
console.log('测试 4: 开宗立派');
state = createTestState();
state.player.reputation = 65;
state.player.martialPower = 75;
state.player.flags = { establish_sect: true, succession_completed: true };
const ending4 = EndingSystem.determineEnding(state);
console.log('结局:', ending4.name);
console.log('分类:', EndingSystem.getEndingCategory(ending4));
console.log('预期：开宗立派（正面）');
console.log('');

// 测试 5: 首富
console.log('测试 5: 首富');
state = createTestState();
state.player.money = 12000;
state.player.flags = { business_empire: true };
const ending5 = EndingSystem.determineEnding(state);
console.log('结局:', ending5.name);
console.log('分类:', EndingSystem.getEndingCategory(ending5));
console.log('预期：首富（正面）');
console.log('');

// 测试 6: 在世活佛
console.log('测试 6: 在世活佛');
state = createTestState();
state.player.chivalry = 75;
state.karma!.good_karma = 160;
state.player.flags = { heal_many_people: true, save_village: true };
const ending6 = EndingSystem.determineEnding(state);
console.log('结局:', ending6.name);
console.log('分类:', EndingSystem.getEndingCategory(ending6));
console.log('预期：在世活佛（正面）');
console.log('');

// 测试 7: 得道成仙
console.log('测试 7: 得道成仙');
state = createTestState();
state.player.martialPower = 92;
state.player.internalSkill = 92;
state.player.comprehension = 92;
state.karma!.good_karma = 110;
state.player.flags = { retired: true };
const ending7 = EndingSystem.determineEnding(state);
console.log('结局:', ending7.name);
console.log('分类:', EndingSystem.getEndingCategory(ending7));
console.log('预期：得道成仙（正面）');
console.log('');

// 测试 8: 隐士生活
console.log('测试 8: 隐士生活');
state = createTestState();
state.player.flags = { retired: true };
const ending8 = EndingSystem.determineEnding(state);
console.log('结局:', ending8.name);
console.log('分类:', EndingSystem.getEndingCategory(ending8));
console.log('预期：隐士生活（中性）');
console.log('');

// 测试 9: 悲剧收场
console.log('测试 9: 悲剧收场');
state = createTestState();
state.karma!.evil_karma = 120;
const ending9 = EndingSystem.determineEnding(state);
console.log('结局:', ending9.name);
console.log('分类:', EndingSystem.getEndingCategory(ending9));
console.log('预期：悲剧收场（负面）');
console.log('');

// 测试 10: 遗臭万年
console.log('测试 10: 遗臭万年');
state = createTestState();
state.player.chivalry = -85;
state.karma!.evil_karma = 220;
const ending10 = EndingSystem.determineEnding(state);
console.log('结局:', ending10.name);
console.log('分类:', EndingSystem.getEndingCategory(ending10));
console.log('预期：遗臭万年（负面）');
console.log('');

// 测试 11: 结局评价生成
console.log('测试 11: 结局评价生成');
state = createTestState();
state.player.chivalry = 85;
state.player.reputation = 85;
state.player.martialPower = 70;
state.player.money = 5000;
state.karma!.good_karma = 120;
state.karma!.evil_karma = 10;
state.achievements = ['save_village', 'defeat_bandits'];
state.criticalChoices = {
  sect_choice: 'orthodox',
  life_goal: 'hero',
  marriage_choice: 'love',
};
const ending11 = EndingSystem.determineEnding(state);
const review = EndingSystem.generateEndingReview(state, ending11);
console.log('结局评价:');
console.log(review);
console.log('');

// 测试 12: 检查可解锁结局
console.log('测试 12: 检查可解锁结局');
state = createTestState();
state.player.chivalry = 85;
state.player.reputation = 85;
state.karma!.good_karma = 120;
state.player.martialPower = 95;
const unlockable = EndingSystem.getUnlockableEndings(state);
console.log('可解锁结局数量:', unlockable.length);
console.log('可解锁结局:');
unlockable.forEach(ending => {
  console.log(`  - ${ending.name} (${EndingSystem.getEndingCategory(ending)})`);
});
console.log('');

console.log('=== 测试完成 ===');
