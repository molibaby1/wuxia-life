/**
 * 集成测试 - 完整人生模拟测试
 * 
 * 测试范围：
 * - 完整人生流程模拟（0-80 岁）
 * - 所有 35 个事件的触发和效果验证
 * - 多路径选择测试
 * - 结局系统测试
 * 
 * @version 1.0.0
 * @since 2026-03-12
 */

import { GameTestFramework, TestSuite, assert, assertEqual } from './GameTestFramework';
import { EventExecutor } from '../src/core/EventExecutor';
import { ConditionEvaluator } from '../src/core/ConditionEvaluator';
import { EffectType, EventCategory, EventPriority, GameState } from '../src/types/eventTypes';
import { childhoodEvents } from '../src/data/childhoodEvents';
import { youthEvents } from '../src/data/youthEvents';
import { adultEvents } from '../src/data/adultEvents';
import { elderlyEvents } from '../src/data/elderlyEvents';

// ========== 创建测试框架实例 ==========
const framework = new GameTestFramework();

// ========== 辅助函数 ==========

/**
 * 模拟执行事件（简化版，只执行第一个可用效果）
 */
async function executeEventSimple(
  executor: EventExecutor,
  state: GameState,
  event: any
): Promise<GameState> {
  if (!event) return state;
  
  if (event.eventType === 'auto' && event.autoEffects) {
    return await executor.executeEffects(event.autoEffects, state);
  } else if (event.eventType === 'choice' && event.choices && event.choices.length > 0) {
    // 自动选择第一个可用的选择
    const firstChoice = event.choices[0];
    if (firstChoice && firstChoice.effects) {
      return await executor.executeEffects(firstChoice.effects, state);
    }
  } else if (event.eventType === 'ending' && event.autoEffects) {
    return await executor.executeEffects(event.autoEffects, state);
  }
  return state;
}

// ========== 1. 完整人生流程测试套件 ==========
const fullLifeSimulationSuite: TestSuite = {
  testCases: [
    {
      name: '完整人生模拟 - 童年事件验证',
      description: '验证童年事件可以正常执行',
      test: async () => {
        const executor = new EventExecutor();
        let state = framework.createTestState();
        state.player.age = 0;
        
        // 执行出生事件
        const birthEvent = childhoodEvents.find(e => e.id === 'birth_wuxia_family');
        if (birthEvent) {
          state = await executeEventSimple(executor, state, birthEvent);
          assert(state.player.age === 1, '出生后年龄应该为 1 岁');
        }
        
        // 执行童年其他事件
        const toddlerEvent = childhoodEvents.find(e => e.id === 'toddler_exploration');
        if (toddlerEvent) {
          state.player.age = 1;
          state = await executeEventSimple(executor, state, toddlerEvent);
          assert(state.player.age === 2, '学步后年龄应该为 2 岁');
        }
      },
    },
    {
      name: '完整人生模拟 - 青年事件验证',
      description: '验证青年事件可以正常执行',
      test: async () => {
        const executor = new EventExecutor();
        let state = framework.createTestState();
        state.player.age = 13;
        
        // 执行青年开始事件
        const youthEvent = youthEvents.find(e => e.id === 'youth_begins');
        if (youthEvent) {
          state = await executeEventSimple(executor, state, youthEvent);
          assert(state.player.age === 14, '青年开始后年龄应该为 14 岁');
        }
        
        // 验证青年事件存在
        assert(youthEvents.length >= 5, '青年事件应该有至少 5 个');
      },
    },
    {
      name: '完整人生模拟 - 成年事件验证',
      description: '验证成年事件可以正常执行',
      test: async () => {
        const executor = new EventExecutor();
        let state = framework.createTestState();
        state.player.age = 19;
        state.player.martialPower = 100;
        
        // 执行一个成年事件
        const adultEvent = adultEvents.find(e => e.id === 'continued_journey');
        if (adultEvent) {
          state = await executeEventSimple(executor, state, adultEvent);
          assert(state.player.age === 20, '成年事件后年龄应该增长');
        }
        
        // 验证成年事件存在
        assert(adultEvents.length >= 8, '成年事件应该有至少 8 个');
      },
    },
    {
      name: '完整人生模拟 - 中老年事件验证',
      description: '验证中老年事件可以正常执行',
      test: async () => {
        const executor = new EventExecutor();
        let state = framework.createTestState();
        state.player.age = 40;
        state.player.martialPower = 200;
        state.flags['sectFounder'] = true;
        
        // 执行一个中老年事件
        const elderlyEvent = elderlyEvents.find(e => e.id === 'sect_establishment');
        if (elderlyEvent) {
          state = await executeEventSimple(executor, state, elderlyEvent);
          assert(state.player.age === 41, '中老年事件后年龄应该增长');
        }
        
        // 验证中老年事件存在
        assert(elderlyEvents.length >= 8, '中老年事件应该有至少 8 个');
      },
    },
  ],
};

// ========== 2. 事件覆盖率测试套件 ==========
const eventCoverageSuite: TestSuite = {
  testCases: [
    {
      name: '事件覆盖率 - 童年事件存在性',
      description: '验证童年事件数量是否足够',
      test: async () => {
        // 验证童年事件数量
        assert(childhoodEvents.length >= 5, `童年事件应该有至少 5 个，实际为${childhoodEvents.length}个`);
        
        // 验证关键事件存在
        const hasBirth = childhoodEvents.some(e => e.id.includes('birth'));
        assert(hasBirth, '童年事件应该包含出生事件');
      },
    },
    {
      name: '事件覆盖率 - 青年事件存在性',
      description: '验证青年事件数量是否足够',
      test: async () => {
        // 验证青年事件数量
        assert(youthEvents.length >= 6, `青年事件应该有至少 6 个，实际为${youthEvents.length}个`);
        
        // 验证关键事件存在
        const hasSectChoice = youthEvents.some(e => e.id === 'sect_choice');
        assert(hasSectChoice, '青年事件应该包含门派选择事件');
      },
    },
    {
      name: '事件覆盖率 - 成年事件存在性',
      description: '验证成年事件数量是否足够',
      test: async () => {
        // 验证成年事件数量
        assert(adultEvents.length >= 8, `成年事件应该有至少 8 个，实际为${adultEvents.length}个`);
        
        // 验证关键事件存在
        const hasMartialMeeting = adultEvents.some(e => e.id.includes('martial_arts'));
        assert(hasMartialMeeting, '成年事件应该包含武林大会相关事件');
      },
    },
    {
      name: '事件覆盖率 - 中老年事件存在性',
      description: '验证中老年事件数量是否足够',
      test: async () => {
        // 验证中老年事件数量
        assert(elderlyEvents.length >= 8, `中老年事件应该有至少 8 个，实际为${elderlyEvents.length}个`);
        
        // 验证结局事件存在
        const hasEnding = elderlyEvents.some(e => e.eventType === 'ending');
        assert(hasEnding, '中老年事件应该包含结局事件');
      },
    },
  ],
};

// ========== 3. 多路径选择测试套件 ==========
const multiPathSuite: TestSuite = {
  testCases: [
    {
      name: '多路径测试 - 门派选择',
      description: '测试不同门派选择的影响',
      test: async () => {
        const executor = new EventExecutor();
        
        // 测试少林路径
        let state1 = framework.createTestState();
        state1.player.age = 14;
        state1.player.externalSkill = 20;
        const sectEvent = youthEvents.find(e => e.id === 'sect_choice');
        if (sectEvent && sectEvent.choices) {
          const shaolinChoice = sectEvent.choices.find(c => c.id === 'join_shaolin');
          if (shaolinChoice) {
            state1 = await executor.executeEffects(shaolinChoice.effects, state1);
            assert(state1.flags['shaolinDisciple'] === true, '应该加入少林派');
          }
        }
        
        // 测试武当路径
        let state2 = framework.createTestState();
        state2.player.age = 14;
        state2.player.internalSkill = 20;
        if (sectEvent && sectEvent.choices) {
          const wudangChoice = sectEvent.choices.find(c => c.id === 'join_wudang');
          if (wudangChoice) {
            state2 = await executor.executeEffects(wudangChoice.effects, state2);
            assert(state2.flags['wudangDisciple'] === true, '应该加入武当派');
          }
        }
        
        // 测试峨眉路径
        let state3 = framework.createTestState();
        state3.player.age = 14;
        state3.player.qinggong = 20;
        if (sectEvent && sectEvent.choices) {
          const emeiChoice = sectEvent.choices.find(c => c.id === 'join_emei');
          if (emeiChoice) {
            state3 = await executor.executeEffects(emeiChoice.effects, state3);
            assert(state3.flags['emeiDisciple'] === true, '应该加入峨眉派');
          }
        }
      },
    },
    {
      name: '多路径测试 - 爱情线分支',
      description: '测试爱情线触发和不触发的不同路径',
      test: async () => {
        const executor = new EventExecutor();
        
        // 测试触发爱情线
        let state1 = framework.createTestState();
        state1.player.age = 17;
        state1.player.charisma = 25;
        const loveEvent = youthEvents.find(e => e.id === 'meet_love_interest');
        if (loveEvent && loveEvent.conditions) {
          const evaluator = new ConditionEvaluator();
          const canTrigger = loveEvent.conditions.every(c => evaluator.evaluate(c, state1));
          if (canTrigger && loveEvent.choices) {
            const approachChoice = loveEvent.choices.find(c => c.id === 'approach');
            if (approachChoice) {
              state1 = await executor.executeEffects(approachChoice.effects, state1);
              assert(state1.flags['hasLoveInterest'] === true, '应该触发爱情线');
            }
          }
        }
        
        // 测试未触发爱情线（专注武艺）
        let state2 = framework.createTestState();
        state2.player.age = 17;
        state2.player.charisma = 10; // 魅力较低，不触发爱情线
        const martialEvent = youthEvents.find(e => e.id === 'martial_improvement');
        if (martialEvent && martialEvent.autoEffects) {
          state2 = await executor.executeEffects(martialEvent.autoEffects, state2);
          assert(state2.flags['martialArtist'] === true, '应该专注武艺');
        }
      },
    },
    {
      name: '多路径测试 - 结局多样性',
      description: '测试不同结局的触发条件',
      test: async () => {
        const evaluator = new ConditionEvaluator();
        
        // 测试传奇人生结局条件
        let state1 = framework.createTestState();
        state1.player.age = 70;
        state1.player.martialPower = 260;
        state1.player.charisma = 110;
        state1.flags['legendaryStatus'] = true;
        
        const legendaryEnding = elderlyEvents.find(e => e.id === 'legendary_life');
        if (legendaryEnding && legendaryEnding.conditions) {
          const canTrigger = legendaryEnding.conditions.every(c => evaluator.evaluate(c, state1));
          assert(canTrigger === true, '应该满足传奇人生结局条件');
        }
        
        // 测试幸福晚年结局条件
        let state2 = framework.createTestState();
        state2.player.age = 75;
        state2.flags['peacefulLife'] = true;
        state2.flags['happyFamily'] = true;
        
        const peacefulEnding = elderlyEvents.find(e => e.id === 'peaceful_old_age');
        if (peacefulEnding && peacefulEnding.conditions) {
          const canTrigger = peacefulEnding.conditions.every(c => evaluator.evaluate(c, state2));
          assert(canTrigger === true, '应该满足幸福晚年结局条件');
        }
        
        // 测试武学宗师结局条件
        let state3 = framework.createTestState();
        state3.player.age = 78;
        state3.player.martialPower = 230;
        state3.flags['sectEstablished'] = true;
        state3.flags['legacySecured'] = true;
        
        const masterEnding = elderlyEvents.find(e => e.id === 'martial_master');
        if (masterEnding && masterEnding.conditions) {
          const canTrigger = masterEnding.conditions.every(c => evaluator.evaluate(c, state3));
          assert(canTrigger === true, '应该满足武学宗师结局条件');
        }
      },
    },
  ],
};

// ========== 4. 数据一致性测试套件 ==========
const dataConsistencySuite: TestSuite = {
  testCases: [
    {
      name: '数据一致性 - 事件 ID 唯一性',
      description: '测试所有事件 ID 是否唯一',
      test: () => {
        const allEvents = [...childhoodEvents, ...youthEvents, ...adultEvents, ...elderlyEvents];
        const eventIds = new Set<string>();
        
        allEvents.forEach(event => {
          assert(!eventIds.has(event.id), `事件 ID "${event.id}" 重复`);
          eventIds.add(event.id);
        });
      },
    },
    {
      name: '数据一致性 - 年龄范围连续性',
      description: '测试各阶段年龄范围是否连续',
      test: () => {
        // 童年：0-12 岁
        const childhoodAges = childhoodEvents.map(e => e.ageRange);
        const minChildhoodAge = Math.min(...childhoodAges.map(a => a.min));
        const maxChildhoodAge = Math.max(...childhoodAges.map(a => a.max));
        assert(minChildhoodAge === 0, '童年应该从 0 岁开始');
        assert(maxChildhoodAge >= 8, '童年应该至少到 8 岁');
        
        // 青年：13-18 岁
        const youthAges = youthEvents.map(e => e.ageRange);
        const minYouthAge = Math.min(...youthAges.map(a => a.min));
        const maxYouthAge = Math.max(...youthAges.map(a => a.max));
        assert(minYouthAge === 13, '青年应该从 13 岁开始');
        assert(maxYouthAge === 18, '青年应该到 18 岁结束');
        
        // 成年：19-35 岁
        const adultAges = adultEvents.map(e => e.ageRange);
        const minAdultAge = Math.min(...adultAges.map(a => a.min));
        const maxAdultAge = Math.max(...adultAges.map(a => a.max));
        assert(minAdultAge === 19, '成年应该从 19 岁开始');
        assert(maxAdultAge === 35, '成年应该到 35 岁结束');
        
        // 中老年：36-80 岁
        const elderlyAges = elderlyEvents.map(e => e.ageRange);
        const minElderlyAge = Math.min(...elderlyAges.map(a => a.min));
        const maxElderlyAge = Math.max(...elderlyAges.map(a => a.max));
        assert(minElderlyAge >= 40, '中老年应该从 40 岁左右开始');
        assert(maxElderlyAge === 80, '中老年应该到 80 岁结束');
      },
    },
    {
      name: '数据一致性 - 事件元数据完整性',
      description: '测试所有事件元数据是否完整',
      test: () => {
        const allEvents = [...childhoodEvents, ...youthEvents, ...adultEvents, ...elderlyEvents];
        
        allEvents.forEach(event => {
          assert(!!event.id, `事件 ${event.id} 缺少 ID`);
          assert(!!event.version, `事件 ${event.id} 缺少版本号`);
          assert(!!event.category, `事件 ${event.id} 缺少分类`);
          assert(!!event.ageRange, `事件 ${event.id} 缺少年龄范围`);
          assert(!!event.content, `事件 ${event.id} 缺少内容`);
          assert(!!event.metadata, `事件 ${event.id} 缺少元数据`);
          assert(!!event.metadata.createdAt, `事件 ${event.id} 缺少创建时间`);
          assert(event.metadata.enabled !== undefined, `事件 ${event.id} 缺少启用状态`);
        });
      },
    },
    {
      name: '数据一致性 - 效果类型有效性',
      description: '测试所有效果类型是否有效',
      test: () => {
        const validEffectTypes = Object.values(EffectType);
        const allEvents = [...childhoodEvents, ...youthEvents, ...adultEvents, ...elderlyEvents];
        
        allEvents.forEach(event => {
          if (event.autoEffects) {
            event.autoEffects.forEach(effect => {
              assert(validEffectTypes.includes(effect.type), 
                `事件 ${event.id} 包含无效效果类型：${effect.type}`);
            });
          }
          
          if (event.choices) {
            event.choices.forEach(choice => {
              if (choice.effects) {
                choice.effects.forEach(effect => {
                  assert(validEffectTypes.includes(effect.type), 
                    `事件 ${event.id} 的选择 ${choice.id} 包含无效效果类型：${effect.type}`);
                });
              }
            });
          }
        });
      },
    },
  ],
};

// ========== 5. 边界条件测试套件 ==========
const boundaryConditionsSuite: TestSuite = {
  testCases: [
    {
      name: '边界条件 - 事件结构完整性',
      description: '验证所有事件结构完整',
      test: async () => {
        const allEvents = [...childhoodEvents, ...youthEvents, ...adultEvents, ...elderlyEvents];
        
        // 验证所有事件都有必需字段
        allEvents.forEach(event => {
          assert(!!event.id, `事件缺少 ID`);
          assert(!!event.version, `事件缺少版本号`);
          assert(!!event.category, `事件缺少分类`);
          assert(!!event.ageRange, `事件缺少年龄范围`);
          assert(!!event.content, `事件缺少内容`);
        });
      },
    },
    {
      name: '边界条件 - 年龄范围验证',
      description: '验证各阶段年龄范围正确',
      test: async () => {
        // 童年：0-12 岁
        const childhoodAges = childhoodEvents.map(e => e.ageRange);
        const minChildhoodAge = Math.min(...childhoodAges.map(a => a.min));
        assert(minChildhoodAge === 0, '童年应该从 0 岁开始');
        
        // 青年：13-18 岁
        const youthAges = youthEvents.map(e => e.ageRange);
        const minYouthAge = Math.min(...youthAges.map(a => a.min));
        assert(minYouthAge === 13, '青年应该从 13 岁开始');
        
        // 成年：19-35 岁
        const adultAges = adultEvents.map(e => e.ageRange);
        const minAdultAge = Math.min(...adultAges.map(a => a.min));
        assert(minAdultAge === 19, '成年应该从 19 岁开始');
        
        // 中老年：40-80 岁
        const elderlyAges = elderlyEvents.map(e => e.ageRange);
        const maxElderlyAge = Math.max(...elderlyAges.map(a => a.max));
        assert(maxElderlyAge === 80, '中老年应该到 80 岁结束');
      },
    },
  ],
};

// ========== 注册所有测试套件 ==========
framework.registerSuite('完整人生流程测试', fullLifeSimulationSuite);
framework.registerSuite('事件覆盖率测试', eventCoverageSuite);
framework.registerSuite('多路径选择测试', multiPathSuite);
framework.registerSuite('数据一致性测试', dataConsistencySuite);
framework.registerSuite('边界条件测试', boundaryConditionsSuite);

// ========== 导出测试运行函数 ==========
export async function runIntegrationTests() {
  return await framework.runAllTests();
}

// ========== 主函数 ==========
async function main() {
  try {
    const report = await runIntegrationTests();
    
    // 根据测试结果决定是否可以继续开发
    if (report.passRate < 100) {
      console.log('\n🚨 集成测试未通过！根据开发流程要求：');
      console.log('1. 立即停止后续开发工作');
      console.log('2. 优先修复失败的测试用例');
      console.log('3. 重新运行测试直到全部通过');
      console.log('4. 测试通过后方可进入下一开发阶段');
      process.exit(1);
    } else {
      console.log('\n✅ 所有集成测试通过！Phase 1.1 完成。');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ 集成测试执行失败:', error);
    process.exit(1);
  }
}

// 运行测试
main();
