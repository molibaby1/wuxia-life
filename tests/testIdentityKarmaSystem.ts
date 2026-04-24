/**
 * 身份系统与因果系统测试脚本
 */

import { IdentitySystem } from '../src/core/IdentitySystem';
import { KarmaSystem } from '../src/core/KarmaSystem';
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

console.log('=== 身份系统与因果系统测试 ===\n');

// 测试 1: 初始状态
console.log('测试 1: 初始状态');
let state = createTestState();
console.log('身份:', state.identity || '无');
console.log('因果:', KarmaSystem.getNetKarma(state));
console.log('因果等级:', KarmaSystem.getKarmaLevel(state));
console.log('');

// 测试 2: 行善积德
console.log('测试 2: 行善积德（+100 善行）');
state = KarmaSystem.addKarma(state, 100, '拯救村庄', 200101);
console.log('善行:', state.karma?.good_karma);
console.log('恶行:', state.karma?.evil_karma);
console.log('因果净值:', KarmaSystem.getNetKarma(state));
console.log('因果等级:', KarmaSystem.getKarmaLevel(state));
console.log('');

// 测试 3: 作恶多端
console.log('测试 3: 作恶多端（-150 恶行）');
state = KarmaSystem.addKarma(state, -150, '杀害无辜', 200201);
console.log('善行:', state.karma?.good_karma);
console.log('恶行:', state.karma?.evil_karma);
console.log('因果净值:', KarmaSystem.getNetKarma(state));
console.log('因果等级:', KarmaSystem.getKarmaLevel(state));
console.log('');

// 测试 4: 大侠身份判定
console.log('测试 4: 大侠身份判定');
state = createTestState();  // 重新创建状态
state.player.chivalry = 85;
state.player.reputation = 60;
state.karma!.good_karma = 150;
const heroIdentity = IdentitySystem.determineIdentity(state);
console.log('判定身份:', heroIdentity);
console.log('预期：hero（大侠）');
console.log('');

// 测试 5: 商人身份判定
console.log('测试 5: 商人身份判定');
state = createTestState();  // 重新创建状态
state.player.money = 6000;
state.player.flags = { business_empire: true };
const merchantIdentity = IdentitySystem.determineIdentity(state);
console.log('判定身份:', merchantIdentity);
console.log('预期：merchant（商人）');
console.log('');

// 测试 6: 魔教身份判定
console.log('测试 6: 魔教身份判定');
state = createTestState();  // 重新创建状态
state.player.chivalry = -85;
state.karma!.evil_karma = 120;
const demonIdentity = IdentitySystem.determineIdentity(state);
console.log('判定身份:', demonIdentity);
console.log('预期：demon（魔教）');
console.log('');

// 测试 7: 身份效果
console.log('测试 7: 身份效果');
if (heroIdentity) {
  const effects = IdentitySystem.getIdentityEffects(heroIdentity);
  console.log('大侠专属事件:', effects.events);
  console.log('大侠专属结局:', effects.endings);
  console.log('大侠属性加成:', effects.bonuses);
}
console.log('');

// 测试 8: 因果报应
console.log('测试 8: 因果报应');
state = createTestState();
state.karma!.good_karma = 250;
const reward = KarmaSystem.getKarmaReward(state);
console.log('善行 250 的报应:', reward);
console.log('预期：divine_blessing（天神庇佑）');

state.karma!.good_karma = 0;
state.karma!.evil_karma = 250;
const punishment = KarmaSystem.getKarmaReward(state);
console.log('恶行 250 的报应:', punishment);
console.log('预期：divine_punishment（天谴）');
console.log('');

console.log('=== 测试完成 ===');
