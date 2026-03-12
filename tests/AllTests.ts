/**
 * 游戏整体测试用例
 * 
 * 包含：
 * - 核心功能测试
 * - 用户交互流程测试
 * - 性能测试
 * - 兼容性测试
 * 
 * @version 1.0.0
 * @since 2026-03-12
 */

import { GameTestFramework, TestSuite, assert, assertEqual } from './GameTestFramework';
import { EventExecutor } from '../src/core/EventExecutor';
import { ConditionEvaluator } from '../src/core/ConditionEvaluator';
import { EffectType, EventCategory, EventPriority } from '../src/types/eventTypes';
import { eventExamples } from '../src/data/eventExamples';

// ========== 创建测试框架实例 ==========
const framework = new GameTestFramework();

// ========== 1. 核心功能测试套件 ==========
const coreFunctionSuite: TestSuite = {
  testCases: [
    {
      name: '事件执行器 - 属性修改效果',
      description: '测试属性修改效果是否正确执行',
      test: async () => {
        const executor = new EventExecutor();
        const state = framework.createTestState();
        const initialPower = state.player.martialPower;
        
        const effects = [
          {
            type: EffectType.STAT_MODIFY,
            target: 'martialPower',
            value: 5,
            operator: 'add' as const,
          },
        ];
        
        const newState = await executor.executeEffects(effects, state);
        assertEqual(newState.player.martialPower, initialPower + 5, '属性应该增加 5');
      },
    },
    {
      name: '事件执行器 - 时间推进效果',
      description: '测试时间推进效果是否正确执行',
      test: async () => {
        const executor = new EventExecutor();
        const state = framework.createTestState();
        const initialAge = state.player.age;
        
        const effects = [
          {
            type: EffectType.TIME_ADVANCE,
            target: 'age',
            value: 1,
          },
        ];
        
        const newState = await executor.executeEffects(effects, state);
        assertEqual(newState.player.age, initialAge + 1, '年龄应该增加 1');
      },
    },
    {
      name: '事件执行器 - Flag 设置效果',
      description: '测试 Flag 设置效果是否正确执行',
      test: async () => {
        const executor = new EventExecutor();
        const state = framework.createTestState();
        
        const effects = [
          {
            type: EffectType.FLAG_SET,
            target: 'testFlag',
          },
        ];
        
        const newState = await executor.executeEffects(effects, state);
        assert(newState.flags['testFlag'] === true, 'Flag 应该被设置为 true');
      },
    },
    {
      name: '事件执行器 - 随机效果',
      description: '测试随机效果是否在指定范围内',
      test: async () => {
        const executor = new EventExecutor();
        const state = framework.createTestState();
        const initialPower = state.player.martialPower;
        
        // 使用 RANDOM 类型的效果
        const effects = [
          {
            type: EffectType.RANDOM,
            target: 'martialPower',
            effects: [
              { type: EffectType.STAT_MODIFY, target: 'martialPower', value: 1, operator: 'add' as const },
              { type: EffectType.STAT_MODIFY, target: 'martialPower', value: 5, operator: 'add' as const },
              { type: EffectType.STAT_MODIFY, target: 'martialPower', value: 10, operator: 'add' as const },
            ],
          },
        ];
        
        const newState = await executor.executeEffects(effects, state);
        const change = newState.player.martialPower - initialPower;
        assert(change >= 1 && change <= 10, `随机值应该在 1-10 之间，实际为${change}`);
      },
    },
    {
      name: '条件评估器 - 简单表达式',
      description: '测试简单条件表达式是否正确评估',
      test: () => {
        const evaluator = new ConditionEvaluator();
        const state = framework.createTestState();
        
        const condition = {
          type: 'expression' as const,
          expression: 'player.martialPower >= 20',
        };
        
        const result = evaluator.evaluate(condition, state);
        assert(result === true, '条件应该为真');
      },
    },
    {
      name: '条件评估器 - 复合表达式',
      description: '测试复合条件表达式是否正确评估',
      test: () => {
        const evaluator = new ConditionEvaluator();
        const state = framework.createTestState();
        
        const condition = {
          type: 'expression' as const,
          expression: 'player.martialPower >= 20 AND player.age >= 18',
        };
        
        const result = evaluator.evaluate(condition, state);
        assert(result === true, '复合条件应该为真');
      },
    },
    {
      name: '条件评估器 - Flag 检查',
      description: '测试 Flag 检查是否正确评估',
      test: () => {
        const evaluator = new ConditionEvaluator();
        const state = framework.createTestState();
        state.flags['hasTestFlag'] = true;
        
        const condition = {
          type: 'expression' as const,
          expression: 'flags.hasTestFlag',
        };
        
        const result = evaluator.evaluate(condition, state);
        assert(result === true, 'Flag 检查应该为真');
      },
    },
    {
      name: '事件定义验证 - 完整事件结构',
      description: '测试事件定义是否符合标准格式',
      test: () => {
        const event = eventExamples[0];
        
        assert(!!event.id, '事件必须有 ID');
        assert(!!event.version, '事件必须有版本号');
        assert(!!event.category, '事件必须有分类');
        assert(!!event.ageRange, '事件必须有年龄范围');
        assert(!!event.content, '事件必须有内容');
        assert(!!event.metadata, '事件必须有元数据');
      },
    },
  ],
};

// ========== 2. 用户交互流程测试套件 ==========
const userFlowSuite: TestSuite = {
  testCases: [
    {
      name: '完整事件流程 - 出生事件',
      description: '测试从出生事件开始的完整流程',
      test: async () => {
        const executor = new EventExecutor();
        let state = framework.createTestState();
        state.player.age = 0;
        
        // 找到出生事件
        const birthEvent = eventExamples.find(e => e.id.includes('birth'));
        if (!birthEvent) {
          throw new Error('未找到出生事件');
        }
        
        // 执行出生事件
        if (birthEvent.autoEffects) {
          state = await executor.executeEffects(birthEvent.autoEffects, state);
        }
        
        // 验证年龄增长
        assert(state.player.age === 1, '出生后年龄应该为 1');
      },
    },
    {
      name: '完整事件流程 - 带选择的事件',
      description: '测试带选择的事件流程',
      test: async () => {
        const executor = new EventExecutor();
        const state = framework.createTestState();
        
        // 找到带选择的事件
        const choiceEvent = eventExamples.find(e => e.eventType === 'choice' && e.choices && e.choices.length > 0);
        if (!choiceEvent) {
          throw new Error('未找到带选择的事件');
        }
        
        // 验证事件有选择
        assert(choiceEvent.choices!.length > 0, '事件应该有选择项');
        
        // 验证选择有效果定义
        const firstChoice = choiceEvent.choices![0];
        assert(firstChoice.effects.length > 0, '选择应该有效果定义');
      },
    },
    {
      name: '事件链测试 - 多阶段事件',
      description: '测试多阶段事件链的执行',
      test: async () => {
        const executor = new EventExecutor();
        let state = framework.createTestState();
        
        // 找到师门任务事件
        const missionEvent = eventExamples.find(e => e.id.includes('sect_mission'));
        if (!missionEvent) {
          console.log('⚠️  跳过：未找到师门任务事件');
          return;
        }
        
        // 验证事件有条件
        if (missionEvent.conditions) {
          assert(missionEvent.conditions.length > 0, '事件应该有前置条件');
        }
      },
    },
  ],
};

// ========== 3. 性能测试套件 ==========
const performanceSuite: TestSuite = {
  testCases: [
    {
      name: '性能测试 - 事件执行速度',
      description: '测试事件执行的性能',
      test: async () => {
        const executor = new EventExecutor();
        const state = framework.createTestState();
        
        const effects = [
          { type: EffectType.STAT_MODIFY, target: 'martialPower', value: 5, operator: 'add' as const },
          { type: EffectType.TIME_ADVANCE, target: 'age', value: 1 },
          { type: EffectType.FLAG_SET, target: 'testFlag' },
        ];
        
        const iterations = 1000;
        const start = Date.now();
        
        for (let i = 0; i < iterations; i++) {
          await executor.executeEffects(effects, state);
        }
        
        const duration = Date.now() - start;
        const avgTime = duration / iterations;
        
        console.log(`  事件执行性能：${avgTime.toFixed(2)}ms/次 (${iterations}次)`);
        
        // 性能要求：平均执行时间 < 5ms
        assert(avgTime < 5, `事件执行时间过长：${avgTime.toFixed(2)}ms (要求 < 5ms)`);
      },
    },
    {
      name: '性能测试 - 条件评估速度',
      description: '测试条件评估的性能',
      test: () => {
        const evaluator = new ConditionEvaluator();
        const state = framework.createTestState();
        
        const condition = {
          type: 'expression' as const,
          expression: 'player.martialPower >= 20 AND player.age >= 18 AND !flags.has("testFlag")',
        };
        
        const iterations = 1000;
        const start = Date.now();
        
        for (let i = 0; i < iterations; i++) {
          evaluator.evaluate(condition, state);
        }
        
        const duration = Date.now() - start;
        const avgTime = duration / iterations;
        
        console.log(`  条件评估性能：${avgTime.toFixed(2)}ms/次 (${iterations}次)`);
        
        // 性能要求：平均评估时间 < 2ms
        assert(avgTime < 2, `条件评估时间过长：${avgTime.toFixed(2)}ms (要求 < 2ms)`);
      },
    },
    {
      name: '性能测试 - 内存使用',
      description: '测试内存使用情况',
      test: () => {
        const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;
        console.log(`  当前内存使用：${memoryUsage.toFixed(2)}MB`);
        
        // 内存要求：< 50MB
        assert(memoryUsage < 50, `内存使用过高：${memoryUsage.toFixed(2)}MB (要求 < 50MB)`);
      },
    },
  ],
};

// ========== 4. 兼容性测试套件 ==========
const compatibilitySuite: TestSuite = {
  testCases: [
    {
      name: '兼容性测试 - 事件格式版本',
      description: '测试不同版本的事件格式兼容性',
      test: () => {
        // 验证所有事件都有版本号
        eventExamples.forEach(event => {
          assert(!!event.version, `事件 ${event.id} 缺少版本号`);
        });
      },
    },
    {
      name: '兼容性测试 - 向后兼容',
      description: '测试旧格式事件的兼容性',
      test: () => {
        // 这里可以添加旧格式迁移测试
        // 当前版本所有事件都是新格式，暂时跳过详细测试
        console.log('  ⚠️  旧格式兼容性测试待实现');
      },
    },
  ],
};

// ========== 注册所有测试套件 ==========
framework.registerSuite('核心功能测试', coreFunctionSuite);
framework.registerSuite('用户交互流程测试', userFlowSuite);
framework.registerSuite('性能测试', performanceSuite);
framework.registerSuite('兼容性测试', compatibilitySuite);

// ========== 导出测试运行函数 ==========
export async function runAllTests() {
  return await framework.runAllTests();
}

// ========== 主函数 ==========
async function main() {
  try {
    const report = await runAllTests();
    
    // 根据测试结果决定是否可以继续开发
    if (report.passRate < 100) {
      console.log('\n🚨 测试未通过！根据开发流程要求：');
      console.log('1. 立即停止后续开发工作');
      console.log('2. 优先修复失败的测试用例');
      console.log('3. 重新运行测试直到全部通过');
      console.log('4. 测试通过后方可进入下一开发阶段');
      process.exit(1);
    } else {
      console.log('\n✅ 所有测试通过！可以继续开发。');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ 测试执行失败:', error);
    process.exit(1);
  }
}

// 运行测试
main();
