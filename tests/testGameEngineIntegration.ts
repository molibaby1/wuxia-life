/**
 * 游戏引擎集成测试
 * 
 * 测试内容：
 * - 事件加载
 * - 事件选择
 * - 事件执行
 * - 完整游戏流程模拟
 */

import { gameEngine } from '../src/core/GameEngineIntegration';
import { eventLoader } from '../src/core/EventLoader';

async function testGameEngine() {
  console.log('=== 游戏引擎集成测试 ===\n');
  
  // 测试 1: 事件加载验证
  console.log('测试 1: 事件加载验证');
  const allEvents = eventLoader.getAllEvents();
  console.log(`✅ 加载了 ${allEvents.length} 个事件`);
  
  const validation = eventLoader.validateEvents();
  if (validation.valid) {
    console.log('✅ 所有事件数据验证通过\n');
  } else {
    console.log('❌ 事件数据验证失败:', validation.errors);
    return;
  }
  
  // 测试 2: 开始新游戏
  console.log('测试 2: 开始新游戏');
  gameEngine.startNewGame('张三', 'male');
  const initialState = gameEngine.getGameState();
  console.log(`玩家：${initialState.player?.name}`);
  console.log(`年龄：${initialState.player?.age}岁`);
  console.log(`性别：${initialState.player?.gender}\n`);
  
  // 测试 3: 模拟童年阶段（0-12 岁）
  console.log('测试 3: 模拟童年阶段');
  for (let age = 0; age <= 12; age++) {
    const events = gameEngine.getAvailableEvents(age);
    if (events.length > 0) {
      const selectedEvent = gameEngine.selectEvent(age);
      if (selectedEvent) {
        console.log(`  ${age}岁：触发事件 "${selectedEvent.content.title}" (${selectedEvent.id})`);
        await gameEngine.executeAutoEvent(selectedEvent);
      }
    }
  }
  
  const childState = gameEngine.getGameState();
  console.log(`童年结束后年龄：${childState.player?.age}岁`);
  console.log(`武力：${childState.player?.martialPower}`);
  console.log(`事件记录：${childState.player?.events.length}个\n`);
  
  // 测试 4: 模拟青年阶段（13-18 岁）
  console.log('测试 4: 模拟青年阶段');
  for (let age = 13; age <= 18; age++) {
    const events = gameEngine.getAvailableEvents(age);
    if (events.length > 0) {
      const selectedEvent = gameEngine.selectEvent(age);
      if (selectedEvent) {
        console.log(`  ${age}岁：触发事件 "${selectedEvent.content.title}" (${selectedEvent.id})`);
        await gameEngine.executeAutoEvent(selectedEvent);
      }
    }
  }
  
  const youthState = gameEngine.getGameState();
  console.log(`青年结束后年龄：${youthState.player?.age}岁`);
  console.log(`武力：${youthState.player?.martialPower}`);
  console.log(`事件记录：${youthState.player?.events.length}个\n`);
  
  // 测试 5: 模拟成年阶段（19-35 岁）
  console.log('测试 5: 模拟成年阶段');
  for (let age = 19; age <= 35; age++) {
    const events = gameEngine.getAvailableEvents(age);
    if (events.length > 0) {
      const selectedEvent = gameEngine.selectEvent(age);
      if (selectedEvent) {
        console.log(`  ${age}岁：触发事件 "${selectedEvent.content.title}" (${selectedEvent.id})`);
        await gameEngine.executeAutoEvent(selectedEvent);
      }
    }
  }
  
  const adultState = gameEngine.getGameState();
  console.log(`成年结束后年龄：${adultState.player?.age}岁`);
  console.log(`武力：${adultState.player?.martialPower}`);
  console.log(`事件记录：${adultState.player?.events.length}个\n`);
  
  // 测试 6: 模拟中老年阶段（36-80 岁）
  console.log('测试 6: 模拟中老年阶段');
  for (let age = 36; age <= 80; age++) {
    const events = gameEngine.getAvailableEvents(age);
    if (events.length > 0) {
      const selectedEvent = gameEngine.selectEvent(age);
      if (selectedEvent) {
        console.log(`  ${age}岁：触发事件 "${selectedEvent.content.title}" (${selectedEvent.id})`);
        await gameEngine.executeAutoEvent(selectedEvent);
        
        // 检查是否触发结局事件
        if (selectedEvent.eventType === 'ending') {
          console.log(`\n🎉 触发结局：${selectedEvent.content.title}`);
          break;
        }
      }
    }
  }
  
  const finalState = gameEngine.getGameState();
  console.log(`\n最终年龄：${finalState.player?.age}岁`);
  console.log(`最终武力：${finalState.player?.martialPower}`);
  console.log(`总事件记录：${finalState.player?.events.length}个`);
  
  // 测试 7: 重置游戏
  console.log('\n测试 7: 重置游戏');
  gameEngine.resetGame();
  const resetState = gameEngine.getGameState();
  console.log(`重置后年龄：${resetState.player?.age}岁`);
  console.log(`重置后武力：${resetState.player?.martialPower}\n`);
  
  console.log('=== 测试完成 ===');
}

// 运行测试
testGameEngine().catch(console.error);
