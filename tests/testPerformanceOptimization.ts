/**
 * Phase 2.3 性能优化测试
 * 
 * 测试内容：
 * - 性能监控
 * - 事件预加载
 * - 内存管理
 */

import { performanceMonitor } from '../src/core/PerformanceMonitor';
import { eventPreloader } from '../src/core/EventPreloader';
import { gameEngine } from '../src/core/GameEngineIntegration';

async function testPerformanceOptimization() {
  console.log('=== Phase 2.3 性能优化测试 ===\n');
  
  // 测试 1: 性能监控初始化
  console.log('测试 1: 性能监控初始化');
  performanceMonitor.updateMemoryUsage();
  console.log('✅ 性能监控已初始化\n');
  
  // 测试 2: 事件预加载 - 单个年龄
  console.log('测试 2: 事件预加载 - 单个年龄');
  eventPreloader.preloadAge(0);
  eventPreloader.preloadAge(1);
  eventPreloader.preloadAge(13);
  console.log('✅ 单年龄预加载完成\n');
  
  // 测试 3: 事件预加载 - 批量预加载
  console.log('测试 3: 事件预加载 - 批量预加载');
  eventPreloader.preloadFutureAges(14);
  console.log('✅ 批量预加载完成\n');
  
  // 测试 4: 获取预加载统计
  console.log('测试 4: 获取预加载统计');
  const stats = eventPreloader.getStatistics();
  console.log(`✅ 已加载年龄段：${stats.loadedAgesCount}个`);
  console.log(`✅ 总事件数：${stats.totalEventsCount}个`);
  console.log(`✅ 年龄范围：${stats.minAge}-${stats.maxAge}岁`);
  console.log();
  
  // 测试 5: 从预加载池获取事件
  console.log('测试 5: 从预加载池获取事件');
  const events0 = eventPreloader.getEvents(0);
  console.log(`✅ 0 岁事件：${events0.length}个（从池中获取）`);
  
  const events13 = eventPreloader.getEvents(13);
  console.log(`✅ 13 岁事件：${events13.length}个（从池中获取）`);
  console.log();
  
  // 测试 6: 性能监控记录
  console.log('测试 6: 性能监控记录');
  const start = performance.now();
  for (let i = 0; i < 10; i++) {
    performanceMonitor.recordEventExecution(Math.random() * 0.1);
    performanceMonitor.recordConditionEvaluation(Math.random() * 0.05);
  }
  const end = performance.now();
  performanceMonitor.recordComponentRender(end - start);
  console.log('✅ 性能数据记录完成\n');
  
  // 测试 7: 获取性能报告
  console.log('测试 7: 获取性能报告');
  const report = performanceMonitor.getPerformanceReport();
  console.log(`事件执行 (${report.eventExecution.count} 次):`);
  console.log(`  平均：${report.eventExecution.average.toFixed(3)}ms`);
  console.log(`  最小：${report.eventExecution.min.toFixed(3)}ms`);
  console.log(`  最大：${report.eventExecution.max.toFixed(3)}ms`);
  console.log();
  
  // 测试 8: 打印完整性能报告
  console.log('测试 8: 打印完整性能报告');
  performanceMonitor.printPerformanceReport();
  
  // 测试 9: 清除旧年龄预加载
  console.log('测试 9: 清除旧年龄预加载');
  eventPreloader.clearOldAges(15, 2);
  const statsAfterClear = eventPreloader.getStatistics();
  console.log(`✅ 清除后已加载年龄段：${statsAfterClear.loadedAgesCount}个`);
  console.log();
  
  // 测试 10: 游戏引擎集成测试
  console.log('测试 10: 游戏引擎集成测试（带预加载）');
  gameEngine.startNewGame('性能测试', 'male');
  
  // 预加载初始年龄段
  eventPreloader.preloadFutureAges(0);
  
  // 模拟游戏流程
  for (let age = 0; age <= 10; age++) {
    const events = eventPreloader.getEvents(age);
    if (events.length > 0) {
      const selectedEvent = gameEngine.selectEvent(age);
      if (selectedEvent) {
        await gameEngine.executeAutoEvent(selectedEvent);
        console.log(`  ${age}岁：${selectedEvent.content.title}`);
      }
    }
    
    // 定期清理旧年龄
    if (age % 5 === 0) {
      eventPreloader.clearOldAges(age, 3);
    }
  }
  
  const finalState = gameEngine.getGameState();
  console.log(`✅ 游戏进行到 ${finalState.player?.age}岁`);
  console.log(`✅ 事件记录：${finalState.player?.events.length}个`);
  console.log();
  
  // 测试 11: 最终统计
  console.log('测试 11: 最终统计');
  eventPreloader.printStatistics();
  performanceMonitor.printPerformanceReport();
  
  // 测试 12: 重置
  console.log('测试 12: 重置所有数据');
  eventPreloader.reset();
  performanceMonitor.reset();
  console.log('✅ 已重置\n');
  
  console.log('=== 测试完成 ===');
}

// 运行测试
testPerformanceOptimization().catch(console.error);
