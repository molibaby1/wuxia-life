/**
 * 前端集成测试
 * 
 * 测试内容：
 * - EventLoader 加载
 * - GameEngineIntegration 功能
 * - useNewGameEngine composable
 */

import { eventLoader } from '../src/core/EventLoader';
import { gameEngine } from '../src/core/GameEngineIntegration';

console.log('=== 前端集成测试 ===\n');

// 测试 1: 事件加载器
console.log('测试 1: 事件加载器');
const allEvents = eventLoader.getAllEvents();
console.log(`✅ 加载了 ${allEvents.length} 个事件`);

const validation = eventLoader.validateEvents();
if (validation.valid) {
  console.log('✅ 事件数据验证通过\n');
} else {
  console.log('❌ 事件数据验证失败:', validation.errors);
  process.exit(1);
}

// 测试 2: 游戏引擎初始化
console.log('测试 2: 游戏引擎初始化');
gameEngine.startNewGame('测试玩家', 'male');
const initialState = gameEngine.getGameState();
console.log(`✅ 玩家：${initialState.player?.name}`);
console.log(`✅ 年龄：${initialState.player?.age}岁`);
console.log(`✅ 性别：${initialState.player?.gender}\n`);

// 测试 3: 事件选择
console.log('测试 3: 事件选择（0 岁）');
const eventsAt0 = gameEngine.getAvailableEvents(0);
console.log(`✅ 0 岁可用事件：${eventsAt0.length}个`);
if (eventsAt0.length > 0) {
  const selectedEvent = gameEngine.selectEvent(0);
  if (selectedEvent) {
    console.log(`✅ 选中事件：${selectedEvent.content.title}`);
    console.log(`   ID: ${selectedEvent.id}`);
    console.log(`   类型：${selectedEvent.eventType}`);
    console.log(`   权重：${selectedEvent.weight}`);
  }
}
console.log();

// 测试 4: 执行自动事件
console.log('测试 4: 执行自动事件');
const birthEvent = eventsAt0.find(e => e.id === 'birth_wuxia_family');
if (birthEvent) {
  gameEngine.executeAutoEvent(birthEvent).then(() => {
    const afterBirthState = gameEngine.getGameState();
    console.log(`✅ 执行后年龄：${afterBirthState.player?.age}岁`);
    console.log(`✅ 事件记录：${afterBirthState.player?.events.length}个`);
    console.log();
    
    // 测试 5: 模拟到 13 岁
    console.log('测试 5: 模拟到 13 岁');
    for (let age = 1; age <= 13; age++) {
      gameEngine.advanceTime(1);
      const events = gameEngine.getAvailableEvents(age);
      if (events.length > 0) {
        const event = gameEngine.selectEvent(age);
        if (event) {
          console.log(`  ${age}岁：${event.content.title}`);
          gameEngine.executeAutoEvent(event);
        }
      }
    }
    const teenState = gameEngine.getGameState();
    console.log(`✅ 13 岁时年龄：${teenState.player?.age}岁`);
    console.log(`✅ 总事件数：${teenState.player?.events.length}个`);
    console.log();
    
    console.log('=== 测试完成 ===');
  }).catch(err => {
    console.error('❌ 执行失败:', err);
  });
} else {
  console.log('❌ 未找到出生事件');
}
