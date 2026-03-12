#!/usr/bin/env tsx
/**
 * 游戏引擎集成测试
 * 
 * 验证声明式效果系统的完整性
 * 测试所有事件类型的统一处理流程
 */

import { gameEngine } from '../src/core/GameEngineIntegration';

async function runIntegrationTests() {
  console.log('=== 游戏引擎集成测试 ===\n');
  
  let passed = 0;
  let failed = 0;
  
  // 测试 1: 新游戏初始化
  console.log('测试 1: 新游戏初始化');
  try {
    gameEngine.startNewGame('测试', 'male');
    const state = gameEngine.getGameState();
    
    if (state.player.age === 0 && state.player.alive) {
      console.log('✅ 通过\n');
      passed++;
    } else {
      console.log('❌ 失败：初始状态不正确\n');
      failed++;
    }
  } catch (error) {
    console.log('❌ 失败:', error, '\n');
    failed++;
  }
  
  // 测试 2: 时间推进
  console.log('测试 2: 时间推进');
  try {
    gameEngine.advanceTime(1);
    const state = gameEngine.getGameState();
    
    if (state.player.age === 1) {
      console.log('✅ 通过\n');
      passed++;
    } else {
      console.log('❌ 失败：年龄未正确推进\n');
      failed++;
    }
  } catch (error) {
    console.log('❌ 失败:', error, '\n');
    failed++;
  }
  
  // 测试 3: 事件触发
  console.log('测试 3: 事件触发');
  try {
    const events = gameEngine.getAvailableEvents(1);
    
    if (events.length > 0) {
      console.log(`✅ 通过 (触发 ${events.length} 个事件)\n`);
      passed++;
    } else {
      console.log('❌ 失败：没有事件触发\n');
      failed++;
    }
  } catch (error) {
    console.log('❌ 失败:', error, '\n');
    failed++;
  }
  
  // 测试 4: 自动事件执行
  console.log('测试 4: 自动事件执行');
  try {
    const events = gameEngine.getAvailableEvents(1);
    const autoEvent = events.find(e => e.eventType === 'auto');
    
    if (autoEvent) {
      await gameEngine.executeAutoEvent(autoEvent);
      const state = gameEngine.getGameState();
      
      if (state.player.age > 1 || state.player.events.length > 0) {
        console.log('✅ 通过\n');
        passed++;
      } else {
        console.log('❌ 失败：事件未正确执行\n');
        failed++;
      }
    } else {
      console.log('⚠️  跳过：无自动事件\n');
    }
  } catch (error) {
    console.log('❌ 失败:', error, '\n');
    failed++;
  }
  
  // 测试 5: 选择事件执行
  console.log('测试 5: 选择事件执行');
  try {
    // 推进到有选择事件的年龄
    for (let i = 0; i < 10; i++) {
      gameEngine.advanceTime(1);
    }
    
    const events = gameEngine.getAvailableEvents(12);
    const choiceEvent = events.find(e => e.eventType === 'choice');
    
    if (choiceEvent && choiceEvent.choices && choiceEvent.choices.length > 0) {
      const choice = choiceEvent.choices[0];
      await gameEngine.executeChoiceEffects(choice.effects, choiceEvent.id);
      const state = gameEngine.getGameState();
      
      console.log('✅ 通过\n');
      passed++;
    } else {
      console.log('⚠️  跳过：无选择事件\n');
    }
  } catch (error) {
    console.log('❌ 失败:', error, '\n');
    failed++;
  }
  
  // 测试 6: 状态持久化
  console.log('测试 6: 状态持久化');
  try {
    const state1 = gameEngine.getGameState();
    const flagsBefore = Array.from(state1.player.flags);
    const eventsBefore = Array.from(state1.player.events.map(e => e.eventId));
    
    gameEngine.advanceTime(1);
    
    const state2 = gameEngine.getGameState();
    const flagsAfter = Array.from(state2.player.flags);
    const eventsAfter = Array.from(state2.player.events.map(e => e.eventId));
    
    // 验证 flags 和 events 没有被清空
    if (flagsAfter.length >= flagsBefore.length && eventsAfter.length >= eventsBefore.length) {
      console.log('✅ 通过\n');
      passed++;
    } else {
      console.log('❌ 失败：状态未正确持久化\n');
      failed++;
    }
  } catch (error) {
    console.log('❌ 失败:', error, '\n');
    failed++;
  }
  
  // 总结
  console.log('=== 测试总结 ===');
  console.log(`通过：${passed}`);
  console.log(`失败：${failed}`);
  console.log(`总计：${passed + failed}`);
  
  if (failed === 0) {
    console.log('\n✅ 所有测试通过！\n');
  } else {
    console.log('\n❌ 部分测试失败\n');
  }
}

runIntegrationTests().catch(console.error);
