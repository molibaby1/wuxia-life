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
import { resolveFirstChoiceEffects } from '../src/core/ChoiceOutcomeResolver';
import { GameEngineIntegration, gameEngine } from '../src/core/GameEngineIntegration';
import { eventLoader } from '../src/core/EventLoader';
import { dailyEventSystem } from '../src/core/DailyEventSystem';
import { saveManager } from '../src/core/SaveManager';
import { defaultSnapshotConverter } from '../src/headless/snapshot/SnapshotConverter';
import { EffectType, EventCategory, EventPriority } from '../src/types/eventTypes';
import { eventExamples } from '../src/data/eventExamples';
import { evaluateSimulationGate, parseWaiverArg } from '../scripts/gameplaySimulationGate';
import {
  evaluateExperienceHealthGate,
  validateExperienceWaivers,
} from '../scripts/experienceHealthGate';
import { computeExperienceDerivedMetrics } from '../scripts/computeExperienceMetricsFromReports';
import { GameProcessSimulator } from './GameProcessSimulator';
import { runAllP7Tests } from './p7ActivePlanningTests';
import { runAllP71Tests } from './p71ActiveActionExperienceTests';
import { HeadlessEngineSessionImpl } from '../src/headless/session/HeadlessEngineSessionImpl';
import type { GameState } from '../src/types/eventTypes';
import {
  buildDeathRiskTelemetry,
  inferSimulationCohort,
  resolveDeathLifePhase,
  summarizeTopDeathCauses,
} from '../scripts/deathRiskTelemetry';
import {
  GOLDEN_LINE_SAMPLES,
  P3_EVAL_END_AGE,
  P3_EVAL_SAMPLES,
  runP3EvalSimulation,
  type GoldenLineReplayRecord,
  type GoldenLineSimulationRun,
} from '../scripts/goldenLineSimulation';
import { buildP3EvalSegmentReport } from '../scripts/goldenLineSegmentMetrics';
import { evaluatePayoffGate } from '../scripts/goldenLinePayoffGate';
import { evaluateGoldenLineGates } from '../scripts/goldenLineGate';
import {
  evaluateMidlifeGate,
  isMidlifeRouteEvent,
  MIN_MIDLIFE_MANUAL_CHOICES,
  MIN_MIDLIFE_ROUTE_EVENTS,
} from '../scripts/midlifeGate';

// ========== 创建测试框架实例 ==========
const framework = new GameTestFramework();

function createSimulationReportStub(overrides: Partial<import('../src/types/simulationRecordTypes').GameProcessReport> = {}): import('../src/types/simulationRecordTypes').GameProcessReport {
  const state = framework.createTestState();
  return {
    id: 'stub-report',
    timestamp: new Date().toISOString(),
    config: {
      playerName: 'stub',
      gender: 'male',
      simulateYears: 80,
      runUntilDeath: true,
      maxEvents: 300,
      enableAutoSave: true,
      enableManualSave: true,
      autoSaveMode: 'age',
      saveAgeInterval: 5,
      saveEventInterval: 10,
      enableSaveRestore: true,
      maxRestoreCount: 1,
      verbose: false,
      choiceTendency: 'balanced',
    },
    randomSeed: 1,
    runMode: 'complete_life',
    ageRange: null,
    totalYears: 10,
    finalAge: 10,
    isAlive: true,
    deathReason: null,
    totalEvents: 10,
    totalChoices: 4,
    totalSaves: 1,
    totalLoads: 1,
    persistenceConsistency: {
      totalChecks: 1,
      passedChecks: 1,
      failedChecks: 0,
      results: [
        {
          saveId: 'stub-save',
          age: 10,
          passed: true,
          mismatchedFields: [],
        },
      ],
    },
    records: [
      {
        age: 10,
        eventId: 'stub_event',
        eventTitle: 'stub',
        eventType: 'auto',
        gameState: state,
        timestamp: new Date().toISOString(),
      },
    ],
    statistics: {
      childhoodEvents: 10,
      youthEvents: 0,
      adultEvents: 0,
      elderlyEvents: 0,
      autoEvents: 6,
      choiceEvents: 4,
      martialPowerGrowth: 0,
      sectJoined: null,
      spouse: undefined,
      children: 0,
      flags: {},
    },
    ...overrides,
  };
}

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
      name: '格式迁移样本 - career_good_evil_war 触发语义保持一致',
      description: '测试迁移到 conditions 后，仍仅在 is_sect_leader=true 且年龄命中时可触发',
      test: () => {
        const engine = new GameEngineIntegration() as any;
        const state = engine.getGameState();
        state.player.age = 50;
        state.flags = {};
        state.player.flags = {};

        const noLeaderEvents = engine.getAvailableEvents(50).map((event: { id: string }) => event.id);
        assert(
          !noLeaderEvents.includes('career_good_evil_war'),
          '未成为盟主时不应触发 career_good_evil_war',
        );

        state.flags.is_sect_leader = true;
        state.player.flags.is_sect_leader = true;
        const leaderEvents = engine.getAvailableEvents(50).map((event: { id: string }) => event.id);
        assert(
          leaderEvents.includes('career_good_evil_war'),
          '成为盟主后应可触发 career_good_evil_war',
        );
      },
    },
    {
      name: '条件评估器 - 不满足条件不应命中',
      description: '测试表达式条件不满足时返回 false，避免错误选择结果分支',
      test: () => {
        const evaluator = new ConditionEvaluator();
        const state = framework.createTestState();

        const condition = {
          type: 'expression' as const,
          expression: 'player.martialPower >= 999',
        };

        const result = evaluator.evaluate(condition, state);
        assert(result === false, '不满足条件应被判定为 false, ');
      },
    },
    {
      name: '条件评估器 - P1 语法组合查询',
      description: '测试 flags.has/events.has、括号与逻辑组合在受控解析器中可用',
      test: () => {
        const evaluator = new ConditionEvaluator();
        const state = framework.createTestState();
        state.flags.is_sect_leader = true;
        state.triggeredEvents = ['starter_event'];

        const condition = {
          type: 'expression' as const,
          expression:
            "(flags.has('is_sect_leader') AND events.has('starter_event')) AND (player.age >= 0)",
        };

        const result = evaluator.evaluate(condition, state);
        assert(result === true, 'P1 语法组合查询应返回 true');
      },
    },
    {
      name: '条件评估器 - 负数字面量与魔道侠义条件',
      description: 'martialPower >= 30 && chivalry <= -10 应正确解析，不产生 Invalid token "-" 告警',
      test: () => {
        const evaluator = new ConditionEvaluator();
        const expression = 'martialPower >= 30 && chivalry <= -10';
        const condition = { type: 'expression' as const, expression };

        const originalWarn = console.warn;
        const warnLogs: string[] = [];
        console.warn = (...args: unknown[]) => {
          warnLogs.push(args.map(arg => String(arg)).join(' '));
        };

        try {
          const passState = framework.createTestState();
          passState.player.martialPower = 35;
          passState.player.chivalry = -11;
          assert(
            evaluator.evaluate(condition, passState) === true,
            'chivalry=-11 且功力达标时应为 true',
          );

          const failState = framework.createTestState();
          failState.player.martialPower = 35;
          failState.player.chivalry = 0;
          assert(
            evaluator.evaluate(condition, failState) === false,
            'chivalry=0 时不应满足魔道侠义门槛',
          );

          assert(
            !warnLogs.some(log => log.includes('Invalid token "-"')),
            '负数字面量不应触发 Invalid token "-" 告警',
          );
        } finally {
          console.warn = originalWarn;
        }
      },
    },
    {
      name: '条件评估器 - 非法表达式错误信息',
      description: '测试非法表达式会失败关闭并输出包含表达式和原因的告警',
      test: () => {
        const evaluator = new ConditionEvaluator();
        const state = framework.createTestState();
        const expression = 'player.martialPower >= 20 ? true : false, ';

        const originalWarn = console.warn;
        const warnLogs: string[] = [];
        console.warn = (...args: unknown[]) => {
          warnLogs.push(args.map(arg => String(arg)).join(' '));
        };

        try {
          const result = evaluator.evaluate(
            {
              type: 'expression',
              expression,
            },
            state,
          );
          assert(result === false, '非法表达式应 fail-close 返回 false, ');
          assert(
            warnLogs.some(log => log.includes(expression)),
            '错误日志应包含原始表达式',
          );
          assert(
            warnLogs.some(log => log.includes('Invalid token') || log.includes('Unexpected token')),
            '错误日志应包含可诊断原因',
          );
        } finally {
          console.warn = originalWarn;
        }
      },
    },
    {
      name: '条件评估器 - 非法字段与语法回归',
      description: '测试非法字段访问、非法语法和非字符串查询参数均 fail-close',
      test: () => {
        const evaluator = new ConditionEvaluator();
        const state = framework.createTestState();

        const invalidCases = [
          {
            expression: 'player.constructor == true',
            reason: '非法 player 字段访问应返回 false, ',
          },
          {
            expression: 'player.__proto__ == true',
            reason: '原型链字段访问应返回 false, ',
          },
          {
            expression: 'luck >= 10',
            reason: '未白名单顶层字段应返回 false, ',
          },
          {
            expression: 'flags.has(testFlag)',
            reason: 'flags.has 非字符串参数应返回 false, ',
          },
          {
            expression: '(player.age >= 18',
            reason: '括号不配对应返回 false, ',
          },
        ];

        for (const testCase of invalidCases) {
          const result = evaluator.evaluate(
            {
              type: 'expression',
              expression: testCase.expression,
            },
            state,
          );
          assert(result === false, testCase.reason);
        }
      },
    },
    {
      name: '条件评估器 - 恶意与非白名单语法不执行',
      description: '测试调用、赋值、构造器链与全局访问均不会被执行',
      test: () => {
        const evaluator = new ConditionEvaluator();
        const state = framework.createTestState();
        (globalThis as any).__conditionEvaluatorUs020Probe = 0;

        const maliciousCases = [
          'globalThis.process.exit(1)',
          'player.age >= 0 || (globalThis.__conditionEvaluatorUs020Probe = 1)',
          'flags.has.constructor("return true")()',
          'Math.random() > 0',
          'this.constructor.constructor("return true")()',
        ];

        for (const expression of maliciousCases) {
          const result = evaluator.evaluate(
            {
              type: 'expression',
              expression,
            },
            state,
          );
          assert(result === false, `恶意表达式应 fail-close: ${expression}`);
        }

        assertEqual(
          (globalThis as any).__conditionEvaluatorUs020Probe,
          0,
          '恶意表达式不得产生任何副作用',
        );
      },
    },
    {
      name: '运行时门禁 - generic identity gate 不再生效',
      description: '测试 getAvailableEvents 不再读取已删除的 generic identity gate',
      test: () => {
        const engine = new GameEngineIntegration() as any;
        const state = engine.getGameState();
        state.player.age = 22;
        state.player.affiliation = 'wudang';

        const originalGetEventsByAge = eventLoader.getEventsByAge.bind(eventLoader);
        try {
          (eventLoader as any).getEventsByAge = () => [
            {
              id: 'legacy_trigger_identity_gate',
              version: '1.0.0',
              category: EventCategory.SIDE_QUEST,
              priority: EventPriority.NORMAL,
              weight: 100,
              ageRange: { min: 20, max: 30 },
              triggers: [],
              conditions: [{ type: 'expression', expression: 'player.age >= 20' }],
              triggerConditions: {
                identity: {
                  required: ['official'],
                },
              },
              content: { text: '身份门槛事件', title: '身份门槛事件' },
              eventType: 'auto',
              autoEffects: [{ type: EffectType.FLAG_SET, target: 'should_not_trigger' }],
              metadata: { createdAt: 0, updatedAt: 0, enabled: true, tags: [] },
            },
          ];

          const available = engine.getAvailableEvents(22);
          assertEqual(available.length, 1, 'generic identity gate 不应再过滤正式事件候选');
        } finally {
          (eventLoader as any).getEventsByAge = originalGetEventsByAge;
        }
      },
    },
    {
      name: '事件重复抑制 - maxTriggers 与 cooldown 一致生效',
      description: '测试同一事件在达到最大触发次数或冷却未结束时都被拒绝',
      test: () => {
        const engine = new GameEngineIntegration() as any;
        const state = engine.getGameState();
        state.player.age = 12;
        state.eventHistory = [
          { eventId: 'repeatable_event', age: 10, triggeredAt: 10 },
        ];

        const repeatableEvent = {
          id: 'repeatable_event',
          maxTriggers: 3,
          cooldown: 3,
        };
        assertEqual(engine.checkEventCooldown(repeatableEvent), false, '冷却未结束时应拒绝重复触发');

        state.player.age = 13;
        assertEqual(engine.checkEventCooldown(repeatableEvent), true, '冷却结束且未达 maxTriggers 时应允许触发');

        state.eventHistory.push({ eventId: 'repeatable_event', age: 11, triggeredAt: 11 });
        state.eventHistory.push({ eventId: 'repeatable_event', age: 13, triggeredAt: 13 });
        state.player.age = 16;
        assertEqual(engine.checkEventCooldown(repeatableEvent), false, '达到 maxTriggers 后应拒绝触发');
      },
    },
    {
      name: '事件重复抑制 - 高负面同类事件短期降权',
      description: '测试 injury/illness/economy 同类负面事件在短窗口内会降权',
      test: () => {
        const engine = new GameEngineIntegration() as any;
        const state = engine.getGameState();
        state.player.age = 20;
        state.eventHistory = [{ eventId: 'injury_old', age: 19, triggeredAt: 19 }];

        const originalGetEventById = eventLoader.getEventById.bind(eventLoader);
        (eventLoader as any).getEventById = (eventId: string) => {
          if (eventId === 'injury_old') {
            return {
              id: 'injury_old',
              category: EventCategory.SIDE_QUEST,
              priority: EventPriority.HIGH,
              content: { title: '旧伤复发', text: '伤势反复' },
              metadata: { tags: ['injury', 'negative'] },
            };
          }
          return undefined;
        };

        try {
          const negativeInjuryEvent = {
            id: 'injury_new',
            category: EventCategory.SIDE_QUEST,
            priority: EventPriority.HIGH,
            content: { title: '再遇伤势', text: '受伤加重' },
            metadata: { tags: ['injury', 'negative'] },
          };
          const multiplier = engine.getFormalRepetitionSuppressionMultiplier(negativeInjuryEvent);
          assert(multiplier < 1, '高负面同类事件应触发短期降权');
        } finally {
          (eventLoader as any).getEventById = originalGetEventById;
        }
      },
    },
    {
      name: '事件重复抑制 - 主线与关键事件不被阻断',
      description: '测试带 critical/mainline 标签或 CRITICAL 优先级的事件豁免抑制；main_story 类别 alone 不豁免',
      test: () => {
        const engine = new GameEngineIntegration() as any;
        const state = engine.getGameState();
        state.player.age = 20;
        state.eventHistory = [{ eventId: 'injury_old', age: 19, triggeredAt: 19 }];

        const mandatoryEvent = {
          id: 'mainline_critical',
          category: EventCategory.MAIN_STORY,
          priority: EventPriority.CRITICAL,
          metadata: { tags: ['mainline', 'critical'] },
        };
        assertEqual(engine.getFormalRepetitionSuppressionMultiplier(mandatoryEvent), 1, '主线关键事件应豁免抑制');

        const plainMainStory = {
          id: 'outlaw_training',
          category: EventCategory.MAIN_STORY,
          priority: EventPriority.HIGH,
          metadata: { tags: ['jianghu'] },
        };
        assertEqual(
          engine.isMandatoryEvent(plainMainStory),
          false,
          'main_story 类别 alone 不应再进入 critical/mandatory 车道'
        );
        assertEqual(
          engine.isMandatoryEvent(mandatoryEvent),
          true,
          '带 critical/mainline 标签或 CRITICAL 优先级仍视为 mandatory'
        );
      },
    },
    {
      name: '事件触发条件 - triggerConditions.flags 生效',
      description: '测试 flags.required/not 由 EventExecutor 统一校验',
      test: () => {
        const state = framework.createTestState();
        const marriageEvent = {
          id: 'flag_guard_event',
          triggerConditions: {
            flags: {
              not: ['married'],
            },
          },
        };

        assertEqual(
          EventExecutor.canTriggerEvent(marriageEvent as any, state),
          true,
          '未结婚时事件应可触发'
        );

        state.player.flags.married = true;
        assertEqual(
          EventExecutor.canTriggerEvent(marriageEvent as any, state),
          false,
          '已结婚时 flags.not 应阻止触发'
        );
      },
    },
    {
      name: '事件历史 - 引擎执行路径写入 eventHistory',
      description: '测试 executeAutoEvent 与 executeChoiceEffects 会记录正式事件历史',
      test: async () => {
        const engine = new GameEngineIntegration();
        const state = engine.getGameState();
        state.player.age = 18;

        await engine.executeAutoEvent({
          id: 'history_auto_event',
          autoEffects: [
            { type: EffectType.FLAG_SET, target: 'history_auto_flag', value: true },
          ],
        } as any);

        const autoHistory = engine.getGameState().eventHistory || [];
        assert(
          autoHistory.some(entry => entry.eventId === 'history_auto_event' && entry.age === 18),
          '自动事件执行后应写入 eventHistory'
        );

        await engine.executeChoiceEffects(
          [{ type: EffectType.FLAG_SET, target: 'history_choice_flag', value: true }],
          'history_choice_event'
        );

        const choiceHistory = engine.getGameState().eventHistory || [];
        assert(
          choiceHistory.some(entry => entry.eventId === 'history_choice_event' && entry.age === 18),
          '选择事件执行后应写入 eventHistory'
        );
      },
    },
    {
      name: '事件重复抑制 - 挫折事件短窗口互斥',
      description: '近 1-3 年已有挫折时，同类或跨类 setback 应降权',
      test: () => {
        const engine = new GameEngineIntegration() as any;
        const state = engine.getGameState();
        state.player.age = 27;
        state.eventHistory = [{ eventId: 'setback_illness', age: 26, triggeredAt: 26 }];

        const originalGetEventById = eventLoader.getEventById.bind(eventLoader);
        (eventLoader as any).getEventById = (eventId: string) => {
          if (eventId === 'setback_illness') {
            return {
              id: 'setback_illness',
              category: 'setback',
              isSetbackEvent: true,
              setbackSeverity: 'moderate',
              content: { title: '大病一场', description: '生病' },
              metadata: { tags: ['挫折', '生病', '负面'] },
            };
          }
          return undefined;
        };

        try {
          const propertyLossEvent = {
            id: 'setback_property_loss',
            category: 'setback',
            isSetbackEvent: true,
            setbackSeverity: 'minor',
            content: { title: '财产损失', description: '财富损失' },
            metadata: { tags: ['挫折', '财产', '负面'] },
          };
          const multiplier = engine.getFormalRepetitionSuppressionMultiplier(propertyLossEvent);
          assert(multiplier < 1, '近岁已有挫折时 setback_property_loss 应被降权');
        } finally {
          (eventLoader as any).getEventById = originalGetEventById;
        }
      },
    },
    {
      name: '选择解析 - resolveFirstChoiceEffects 写入事实',
      description: 'resolveFirstChoiceEffects + executeChoiceEffects 应执行 outcome 并设置事实 flag',
      test: async () => {
        const engine = new GameEngineIntegration();
        const state = engine.getGameState();
        state.player.age = 16;
        state.player.charisma = 10;

        const loveLikeStub = {
          id: 'test_love_choice_stub',
          eventType: 'choice',
          choices: [
            {
              id: 'love_greet_stub',
              text: '上前搭话',
              outcomes: [
                {
                  id: 'unavailable',
                  text: '不可用结果',
                  condition: { type: 'expression', expression: 'player.charisma >= 99' },
                  effects: [{ type: EffectType.FLAG_SET, target: 'unavailable_outcome' }],
                },
                {
                  id: 'function_condition',
                  text: '函数条件结果',
                  condition: (() => true) as any,
                  effects: [{ type: EffectType.FLAG_SET, target: 'function_condition_outcome' }],
                },
                {
                  id: 'first_match',
                  text: '首个可用结果',
                  condition: { type: 'expression', expression: 'player.charisma >= 10' },
                  effects: [{ type: EffectType.FLAG_SET, target: 'test_fact', value: true }],
                },
                {
                  id: 'later_match',
                  text: '后续可用结果',
                  condition: { type: 'expression', expression: 'player.charisma >= 5' },
                  effects: [{ type: EffectType.FLAG_SET, target: 'later_outcome' }],
                },
              ],
            },
          ],
        } as const;

        const resolved = resolveFirstChoiceEffects(engine, state, loveLikeStub as any);
        assert(resolved !== null, 'resolveFirstChoiceEffects 应解析出首个可用 choice/outcome');
        assertEqual(resolved!.outcomeId, 'first_match', '多个结果可用时应采用定义顺序中的首个命中项');
        assert(
          resolved!.effects.some(
            effect => effect.type === EffectType.FLAG_SET && effect.target === 'test_fact'
          ),
          '解析结果应包含事实 flag_set 效果'
        );

        await engine.executeChoiceEffects(
          resolved!.effects,
          loveLikeStub.id,
          resolved!.choiceId
        );

        assertEqual(
          engine.getGameState().flags.test_fact,
          true,
          'executeChoiceEffects 后应写入事实 flag'
        );

        const fallbackEvent = {
          id: 'test_choice_fallback_stub',
          eventType: 'choice',
          choices: [
            {
              id: 'fallback_choice',
              text: '默认选择',
              effects: [{ type: EffectType.FLAG_SET, target: 'fallback_fact', value: true }],
              outcomes: [
                {
                  id: 'unavailable_fallback_outcome',
                  condition: { type: 'expression', expression: 'player.charisma >= 99' },
                  effects: [{ type: EffectType.FLAG_SET, target: 'unavailable_fallback' }],
                },
              ],
            },
          ],
        } as const;
        const fallback = resolveFirstChoiceEffects(engine, state, fallbackEvent as any);
        assert(fallback !== null, '所有 outcome 条件不满足时仍应解析选择本身');
        assertEqual(fallback!.outcomeId, undefined, '没有命中 outcome 时不应伪造 outcome');
        assert(
          fallback!.effects.some(
            effect => effect.type === EffectType.FLAG_SET && effect.target === 'fallback_fact'
          ),
          '没有命中 outcome 时应保留选择本身的 effects',
        );
      },
    },
    {
      name: '路线加载 - events.json 与 EventLoader 一致',
      description: '测试所有声明的线路文件均已进入 lineMap',
      test: () => {
        const missing = eventLoader.getUndeclaredImportPaths();
        assertEqual(missing.length, 0, `未加载的 import: ${missing.join(', ')}`);
      },
    },
    {
      name: '路线专项样本 - 模拟可产生明确完成事实',
      description: '测试 routeTrack 样本在固定 seed 下可产生明确 completion flag',
      test: async () => {
        const { ROUTE_TRACK_SAMPLES } = await import('../scripts/runGameplaySimulation');

        const officialSample = ROUTE_TRACK_SAMPLES.find(sample => sample.routeTrack === 'official');
        assert(officialSample, '应存在 official-track 路线样本');

        const simulator = new GameProcessSimulator({
          playerName: officialSample.personaName,
          gender: officialSample.gender,
          simulateYears: 50,
          runUntilDeath: false,
          seed: officialSample.seed,
          choiceTendency: officialSample.choiceTendency,
          routeTrack: officialSample.routeTrack,
          maxEvents: 120,
          verbose: false,
          enableAutoSave: false,
          enableManualSave: false,
          enableSaveRestore: false,
        });
        const report = await simulator.simulate();
        const finalState = report.records.length > 0
          ? report.records[report.records.length - 1].gameState
          : undefined;
        const finalFlags = {
          ...(finalState?.flags ?? {}),
          ...(finalState?.player?.flags ?? {}),
        };
        const hasCompleted = finalFlags.route_official_completed === true;

        assert(hasCompleted, '路线专项样本应能产生 route_official_completed 明确事实');
      },
    },
    {
      name: '明确 faction flag 不破坏身份与阵营字段',
      description: '测试 faction membership flag 保持明确语义且不投影为路线状态',
      test: async () => {
        const executor = new EventExecutor();
        const state = framework.createTestState();
        state.player.affiliation = 'wudang';
        state.lifePath = {
          faction: 'orthodox',
          lifeStage: 'development',
          achievements: [],
          relationships: { allies: [], enemies: [], mentors: [], disciples: [] },
          commitments: { cannotJoin: [], mustProtect: [], swornEnemies: [] },
        };

        const nextState = await executor.executeEffects(
          [{ type: EffectType.FLAG_SET, target: 'sect_faction', value: 'unconventional' }],
          state,
        );

        assertEqual(nextState.player.affiliation, 'wudang', 'affiliation 字段应保持不变');
        assertEqual(nextState.lifePath?.faction, 'orthodox', 'lifePath.faction 不应被路线状态同步改写');
      },
    },
    {
      name: '分层节奏 - daily 仅在 formal 不足或节奏暂停时介入',
      description: '测试 critical/storyline 优先，regular formal 可被节奏控制降级到 daily',
      test: () => {
        const engine = new GameEngineIntegration() as any;
        const state = engine.getGameState();
        state.player.age = 25;
        state.player.reputation = 0;
        state.eventHistory = [];

        const originalGetAvailableEvents = engine.getAvailableEvents.bind(engine);
        const originalShouldPauseEventsThisYear = engine.shouldPauseEventsThisYear.bind(engine);
        const originalDailySelector = dailyEventSystem.selectEvent;

        const criticalEvent = {
          id: 'critical_lane_event',
          category: EventCategory.MAIN_STORY,
          priority: EventPriority.CRITICAL,
          content: { title: '关键主线', text: '主线推进' },
          metadata: { tags: ['mainline'] },
        };
        const regularEvent = {
          id: 'regular_lane_event',
          category: EventCategory.SIDE_QUEST,
          priority: EventPriority.NORMAL,
          content: { title: '普通正式事件', text: '日常推进' },
          metadata: { tags: [] },
        };
        const dailyEvent = {
          id: 'daily_lane_event',
          category: 'daily_event',
          priority: EventPriority.LOW,
          content: { title: '日常事件', text: '补充节奏' },
          metadata: { tags: ['daily_pool'] },
        };

        try {
          (dailyEventSystem as any).selectEvent = () => dailyEvent;

          engine.getAvailableEvents = () => [criticalEvent, regularEvent];
          engine.shouldPauseEventsThisYear = () => true;
          const selectedCritical = engine.selectEvent(25);
          assertEqual(selectedCritical?.id, 'critical_lane_event', 'critical 层应优先并且不被节奏暂停阻断');

          engine.getAvailableEvents = () => [regularEvent];
          engine.shouldPauseEventsThisYear = () => true;
          const selectedDaily = engine.selectEvent(25);
          assertEqual(selectedDaily?.id, 'daily_lane_event', '仅 regular formal 可用且节奏暂停时应降级到 daily');

          engine.getAvailableEvents = () => [regularEvent];
          engine.shouldPauseEventsThisYear = () => false;
          const selectedRegular = engine.selectEvent(25);
          assertEqual(selectedRegular?.id, 'regular_lane_event', 'regular formal 可用且无需节奏暂停时应保持 formal');
        } finally {
          engine.getAvailableEvents = originalGetAvailableEvents;
          engine.shouldPauseEventsThisYear = originalShouldPauseEventsThisYear;
          (dailyEventSystem as any).selectEvent = originalDailySelector;
        }
      },
    },
    {
      name: '分层调度回归 - mixed lane 保留 formal 与 daily 语义',
      description: '测试 critical 保护、storyline/regular 混合加权与 regular-only 节奏行为',
      test: () => {
        const engine = new GameEngineIntegration() as any;
        const state = engine.getGameState();
        state.player.age = 25;
        state.player.reputation = 0;
        state.eventHistory = [];

        const originalGetAvailableEvents = engine.getAvailableEvents.bind(engine);
        const originalShouldPauseEventsThisYear = engine.shouldPauseEventsThisYear.bind(engine);
        const originalShouldYieldRegularFormalToDailyCadence =
          engine.shouldYieldRegularFormalToDailyCadence.bind(engine);
        const originalPickWeightedFormalEvent = engine.pickWeightedFormalEvent.bind(engine);
        const originalGetWeightForAge = eventLoader.getWeightForAge.bind(eventLoader);
        const originalDailySelector = dailyEventSystem.selectEvent;
        const originalMathRandom = Math.random;
        const evaluator = new ConditionEvaluator();
        let yieldCalls = 0;
        let pauseCalls = 0;
        let medicalWeightedCandidateIds: string[] | null = null;

        const criticalEvent = {
          id: 'critical_starvation_probe',
          category: EventCategory.MAIN_STORY,
          priority: EventPriority.CRITICAL,
          weight: 1,
          ageRange: { min: 24, max: 26 },
          content: { title: '关键保护事件', text: '关键事件仍受保护' },
          metadata: { tags: ['critical'] },
        };
        const storylineEvent = {
          id: 'storyline_starvation_probe',
          category: EventCategory.SIDE_QUEST,
          priority: EventPriority.HIGH,
          weight: 1,
          ageRange: { min: 24, max: 26 },
          content: { title: '剧情推进事件', text: '普通剧情推进' },
          metadata: { tags: [] },
          storyLine: 'starvation_probe',
        };
        const regularEvents = [
          {
            id: 'regular_starvation_probe_a',
            category: EventCategory.SIDE_QUEST,
            priority: EventPriority.NORMAL,
            weight: 1,
            ageRange: { min: 24, max: 26 },
            content: { title: '普通正式事件 A', text: '普通正式事件' },
            metadata: { tags: [] },
          },
          {
            id: 'regular_starvation_probe_b',
            category: EventCategory.SIDE_QUEST,
            priority: EventPriority.NORMAL,
            weight: 1,
            ageRange: { min: 24, max: 26 },
            content: { title: '普通正式事件 B', text: '普通正式事件' },
            metadata: { tags: [] },
          },
        ];
        const regularIds = new Set(regularEvents.map(event => event.id));
        const dailyEvent = {
          id: 'daily_mixed_lane_probe',
          category: EventCategory.DAILY_EVENT,
          priority: EventPriority.LOW,
          weight: 1,
          ageRange: { min: 8, max: 26 },
          content: { title: '日常补位', text: '不应替换受保护的 mixed formal' },
          metadata: { tags: ['daily_pool'] },
        };
        const medicalEvent = eventLoader.getEventById('medical_talent_discovery');
        const medicalStorylineEvent = {
          ...storylineEvent,
          id: 'medical_storyline_probe',
          ageRange: { min: 8, max: 10 },
        };

        try {
          (dailyEventSystem as any).selectEvent = () => dailyEvent;
          (eventLoader as any).getWeightForAge = () => 1;

          // Critical remains outside the mixed lane and bypasses cadence/pause handling.
          engine.getAvailableEvents = () => [criticalEvent, storylineEvent, ...regularEvents];
          engine.shouldYieldRegularFormalToDailyCadence = () => {
            yieldCalls += 1;
            return true;
          };
          engine.shouldPauseEventsThisYear = () => {
            pauseCalls += 1;
            return true;
          };
          Math.random = () => 0.99;
          const selectedCritical = engine.selectEvent(25);
          assertEqual(
            selectedCritical?.id,
            'critical_starvation_probe',
            'critical 事件必须继续绕过普通 weighted lane'
          );

          // Mixed lane can select storyline and regular with deterministic draws.
          engine.getAvailableEvents = () => [storylineEvent, ...regularEvents];
          Math.random = () => 0.4;
          const selectedStoryline = engine.selectEvent(25);
          assertEqual(
            selectedStoryline?.id,
            'storyline_starvation_probe',
            '非关键 storyline 必须保留有效的 weighted selection opportunity'
          );

          Math.random = () => 0.99;
          const selectedRegular = engine.selectEvent(25);
          assert(
            regularIds.has(selectedRegular?.id ?? ''),
            'storyline 存在时，regular formal 不能从 mixed weighted selection 中被结构性排除'
          );
          assertEqual(
            selectedRegular?.id,
            'regular_starvation_probe_b',
            'mixed weighted lane 应允许 deterministic RNG 命中 regular formal'
          );

          // A regular result from the mixed lane remains protected from daily replacement.
          assertEqual(yieldCalls, 0, 'mixed lane 命中 regular 后不应执行 daily cadence yield');
          assertEqual(pauseCalls, 0, 'mixed lane 命中 regular 后不应执行 rhythm pause');

          // With no storyline, the pre-existing regular-only cadence and pause behavior remains.
          engine.getAvailableEvents = () => [regularEvents[0]];
          engine.shouldYieldRegularFormalToDailyCadence = () => true;
          engine.shouldPauseEventsThisYear = () => false;
          const selectedByCadence = engine.selectEvent(25);
          assertEqual(
            selectedByCadence?.id,
            'daily_mixed_lane_probe',
            '没有 storyline 时，regular formal 仍可被 daily cadence 替换'
          );

          engine.shouldYieldRegularFormalToDailyCadence = () => false;
          engine.shouldPauseEventsThisYear = () => true;
          const selectedByPause = engine.selectEvent(25);
          assertEqual(
            selectedByPause?.id,
            'daily_mixed_lane_probe',
            '没有 storyline 时，regular formal 仍可被 rhythm pause 替换'
          );

          engine.shouldYieldRegularFormalToDailyCadence = () => false;
          engine.shouldPauseEventsThisYear = () => false;
          const selectedRegularOnly = engine.selectEvent(25);
          assertEqual(
            selectedRegularOnly?.id,
            'regular_starvation_probe_a',
            '没有 storyline 且无 cadence/pause 时应返回 regular formal'
          );

          // Use the runtime-loaded Medical event to guard against reintroducing structural exclusion.
          assert(medicalEvent !== undefined, 'runtime catalog must load medical_talent_discovery');
          state.player.age = 8;
          state.player.knowledge = 15;
          state.player.chivalry = 15;
          const medicalEligible = medicalEvent!.conditions?.every(condition =>
            evaluator.evaluate(condition, state),
          );
          assert(medicalEligible === true, 'medical_talent_discovery must be formally eligible in the probe state');
          (eventLoader as any).getWeightForAge = originalGetWeightForAge;
          engine.pickWeightedFormalEvent = (events: any[], age: number) => {
            if (events.some(event => event.id === 'medical_talent_discovery')) {
              medicalWeightedCandidateIds = events.map(event => event.id);
            }
            return originalPickWeightedFormalEvent(events, age);
          };
          engine.getAvailableEvents = () => [medicalStorylineEvent, medicalEvent!];
          Math.random = () => 0.01;
          engine.selectEvent(8);
          assert(
            medicalWeightedCandidateIds?.includes('medical_talent_discovery') === true,
            'eligible medical_talent_discovery must remain in the mixed weighted opportunity',
          );
          assert(
            medicalWeightedCandidateIds?.includes('medical_storyline_probe') === true,
            'the Medical probe must reach weighted selection together with a non-critical storyline',
          );
        } finally {
          engine.getAvailableEvents = originalGetAvailableEvents;
          engine.shouldPauseEventsThisYear = originalShouldPauseEventsThisYear;
          engine.shouldYieldRegularFormalToDailyCadence = originalShouldYieldRegularFormalToDailyCadence;
          engine.pickWeightedFormalEvent = originalPickWeightedFormalEvent;
          (eventLoader as any).getWeightForAge = originalGetWeightForAge;
          (dailyEventSystem as any).selectEvent = originalDailySelector;
          Math.random = originalMathRandom;
        }
      },
    },
    {
      name: '节奏回归 - 空候选时回退到 daily',
      description: '测试 formal 候选为空时，选择逻辑稳定回退到 daily 事件',
      test: () => {
        const engine = new GameEngineIntegration() as any;
        const state = engine.getGameState();
        state.player.age = 18;

        const originalGetAvailableEvents = engine.getAvailableEvents.bind(engine);
        const originalDailySelector = dailyEventSystem.selectEvent;

        const fallbackDailyEvent = {
          id: 'daily_fallback_when_empty',
          category: 'daily_event',
          priority: EventPriority.LOW,
          content: { title: '空档填充', text: '今天风平浪静' },
          metadata: { tags: ['daily_pool'] },
        };

        try {
          engine.getAvailableEvents = () => [];
          (dailyEventSystem as any).selectEvent = () => fallbackDailyEvent;

          const selected = engine.selectEvent(18);
          assertEqual(selected?.id, 'daily_fallback_when_empty', '空候选时应回退 daily');
        } finally {
          engine.getAvailableEvents = originalGetAvailableEvents;
          (dailyEventSystem as any).selectEvent = originalDailySelector;
        }
      },
    },
    {
      name: '节奏回归 - 加权候选选择可复现',
      description: '测试固定权重与随机数下的正式事件选择稳定命中预期候选',
      test: () => {
        const engine = new GameEngineIntegration() as any;
        const state = engine.getGameState();
        state.player.age = 30;
        state.player.reputation = 0;
        state.eventHistory = [];

        const originalGetAvailableEvents = engine.getAvailableEvents.bind(engine);
        const originalShouldPauseEventsThisYear = engine.shouldPauseEventsThisYear.bind(engine);
        const originalGetWeightForAge = eventLoader.getWeightForAge.bind(eventLoader);
        const originalMathRandom = Math.random;

        const lowWeightEvent = {
          id: 'weighted_low',
          category: EventCategory.SIDE_QUEST,
          priority: EventPriority.NORMAL,
          content: { title: '低权重事件', text: '被选中概率更低' },
          metadata: { tags: [] },
        };
        const highWeightEvent = {
          id: 'weighted_high',
          category: EventCategory.SIDE_QUEST,
          priority: EventPriority.NORMAL,
          content: { title: '高权重事件', text: '被选中概率更高' },
          metadata: { tags: [] },
        };

        try {
          engine.getAvailableEvents = () => [lowWeightEvent, highWeightEvent];
          engine.shouldPauseEventsThisYear = () => false;
          (eventLoader as any).getWeightForAge = (event: { id: string }) => (event.id === 'weighted_low' ? 1 : 5);
          Math.random = () => 0.95;

          const selected = engine.selectEvent(30);
          assertEqual(selected?.id, 'weighted_high', '固定随机输入下应命中高权重候选');
        } finally {
          engine.getAvailableEvents = originalGetAvailableEvents;
          engine.shouldPauseEventsThisYear = originalShouldPauseEventsThisYear;
          (eventLoader as any).getWeightForAge = originalGetWeightForAge;
          Math.random = originalMathRandom;
        }
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
    {
      name: '模拟门禁回归 - blocker 指标失败应阻断',
      description: '测试 simulation gate 对 blocker 越界返回 fail 信号',
      test: () => {
        const failReport = createSimulationReportStub({
          totalEvents: 20,
          totalChoices: 1,
          statistics: {
            childhoodEvents: 20,
            youthEvents: 0,
            adultEvents: 0,
            elderlyEvents: 0,
            autoEvents: 19,
            choiceEvents: 1,
            martialPowerGrowth: 0,
            sectJoined: null,
            spouse: undefined,
            children: 0,
            flags: {},
          },
        });
        const result = evaluateSimulationGate([failReport], []);
        assertEqual(result.decision, 'fail', 'blocker 越界时应返回 fail');
        const choiceRateMetric = result.blockingMetrics.find(metric => metric.key === 'choice_rate');
        assert(choiceRateMetric?.status === 'fail', 'choice_rate 低于 blocker 阈值时应为 fail');
      },
    },
    {
      name: '体验健康门禁 - 复读指标可计算',
      description: '测试包 D 衍生指标与体验健康门禁',
      test: () => {
        const report = createSimulationReportStub({
          records: [
            {
              age: 10,
              eventId: 'setback_injury',
              eventTitle: '意外受伤',
              eventType: 'auto',
              gameState: framework.createTestState(),
              timestamp: new Date().toISOString(),
            },
            {
              age: 11,
              eventId: 'setback_injury',
              eventTitle: '意外受伤',
              eventType: 'auto',
              gameState: framework.createTestState(),
              timestamp: new Date().toISOString(),
            },
          ],
          totalEvents: 2,
        });

        const derived = computeExperienceDerivedMetrics([report]);
        assert(
          (derived.adjacent_same_event_rate ?? 0) > 0,
          '相邻同事件应可检测到复读率',
        );

        const gate = evaluateExperienceHealthGate([report], []);
        const repetitionMetric = gate.blockingMetrics.find(
          metric => metric.key === 'adjacent_same_event_rate'
        );
        assert(repetitionMetric, 'adjacent_same_event_rate 应为 blocker 指标');
        assertEqual(repetitionMetric?.severity, 'blocker', '复读指标应为 blocker');
      },
    },
    {
      name: '体验健康门禁 - 不可 waiver 的指标应拒绝',
      description: '测试 blocker 指标不可 waiver',
      test: () => {
        let thrown = false;
        try {
          validateExperienceWaivers([
            { metricKey: 'death_without_warning_count', reason: 'short' },
          ]);
        } catch (error) {
          thrown = String(error).includes('at least 10 characters');
        }
        assert(thrown, '过短 waiver 原因应被拒绝');

        let thrownNonWaivable = false;
        try {
          validateExperienceWaivers([
            {
              metricKey: 'death_without_warning_count',
              reason: 'EG-DEV-attempt-bypass-warning-check',
            },
          ]);
        } catch (error) {
          thrownNonWaivable = String(error).includes('cannot be waived');
        }
        assert(thrownNonWaivable, 'death_without_warning_count 不可 waiver');
      },
    },
    {
      name: '模拟门禁回归 - waiver 必须提供原因',
      description: '测试 waiver 参数没有原因时必须报错，提供原因后可降级 blocker',
      test: () => {
        let thrown = false;
        try {
          parseWaiverArg('choice_rate:');
        } catch (error) {
          thrown = String(error).includes('reason is empty');
        }
        assert(thrown, 'waiver 未提供原因时应抛出错误');

        const failReport = createSimulationReportStub({
          totalEvents: 20,
          totalChoices: 1,
          statistics: {
            childhoodEvents: 20,
            youthEvents: 0,
            adultEvents: 0,
            elderlyEvents: 0,
            autoEvents: 19,
            choiceEvents: 1,
            martialPowerGrowth: 0,
            sectJoined: null,
            spouse: undefined,
            children: 0,
            flags: {},
          },
        });

        const result = evaluateSimulationGate(
          [failReport],
          [
            { metricKey: 'choice_rate', reason: 'US-016 regression triage' },
            { metricKey: 'ending_distribution', reason: 'single-run concentration is expected' },
          ],
        );
        assertEqual(result.decision, 'pass', 'blocker 被有效 waiver 后应允许通过');
        const choiceRateMetric = result.blockingMetrics.find(metric => metric.key === 'choice_rate');
        assert(choiceRateMetric?.waived === true, 'choice_rate 应被标记为 waived');
      },
    },
    {
      name: '死亡风险遥测 - 强制晚龄结局分源',
      description: 'P3 US-005: forced late-life ending 应记 engine:forced_late_life_ending',
      test: () => {
        const state = framework.createTestState();
        state.player.age = 72;
        state.player.alive = true;
        const report = createSimulationReportStub({
          isAlive: false,
          finalAge: 72,
          deathReason: '有成有憾',
          config: {
            playerName: 'stub',
            gender: 'male',
            simulateYears: 85,
            runUntilDeath: true,
            maxEvents: 300,
            enableAutoSave: false,
            enableManualSave: false,
            autoSaveMode: 'age',
            saveAgeInterval: 5,
            saveEventInterval: 10,
            enableSaveRestore: false,
            maxRestoreCount: 0,
            verbose: false,
            choiceTendency: 'balanced',
          },
          records: [
            {
              age: 72,
              eventId: 'continued_journey',
              eventTitle: '继续旅程',
              eventType: 'auto',
              gameState: state,
              timestamp: new Date().toISOString(),
            },
          ],
        });

        const telemetry = buildDeathRiskTelemetry(report, 'martial-riser');
        assert(telemetry !== null, '死亡报告应生成遥测');
        assertEqual(
          telemetry?.deathCauseId,
          'engine:forced_late_life_ending',
          '晚龄强制结局应使用 engine:forced_late_life_ending',
        );
        assertEqual(telemetry?.deathCauseCategory, 'forced_ending', '类别应为 forced_ending');
        assertEqual(telemetry?.deathLifePhase, 'late_life', '72 岁应为 late_life');
        assertEqual(telemetry?.deathWithoutWarning, false, 'forced_ending 不应计为 without warning');
        assertEqual(inferSimulationCohort(report, 'martial-riser'), 'p2_legacy', '85 岁样本应为 p2_legacy');
      },
    },
    {
      name: '死亡风险遥测 - early_death 与 top causes 汇总',
      description: 'P3 US-005: 英年早逝应分源为 engine:early_death，汇总按 cause 计数',
      test: () => {
        const deadState = framework.createTestState();
        deadState.player.age = 28;
        deadState.player.alive = false;
        deadState.player.deathReason = '英年早逝';
        deadState.eventHistory = [{ eventId: 'early_death', age: 28, timestamp: Date.now() }];

        const deadReport = createSimulationReportStub({
          isAlive: false,
          finalAge: 28,
          deathReason: '英年早逝',
          records: [
            {
              age: 26,
              eventId: 'sect_choice',
              eventTitle: '门派抉择',
              eventType: 'choice',
              selectedChoice: { id: 'join_shaolin', text: '申请拜入少林', effects: [] },
              gameState: framework.createTestState(),
              timestamp: new Date().toISOString(),
            },
            {
              age: 28,
              eventId: 'jianghu_experience',
              eventTitle: '江湖历练',
              eventType: 'auto',
              outcomeText: '命数已尽，英雄早逝',
              gameState: deadState,
              timestamp: new Date().toISOString(),
            },
          ],
        });

        const telemetry = buildDeathRiskTelemetry(deadReport);
        assertEqual(telemetry?.deathCauseId, 'engine:early_death', '英年早逝应映射 engine:early_death');
        assertEqual(telemetry?.deathEventId, 'jianghu_experience', '应记录触发窗口事件 id');
        assert(telemetry?.recentKeyChoices.some(choice => choice.eventId === 'sect_choice'), '应包含近期 key choice');
        assertEqual(telemetry?.warningSatisfied, false, 'ENG-01 默认 warning 未满足');
        assertEqual(telemetry?.mitigationAvailable, true, '体质豁免视为 mitigationAvailable');

        const aliveReport = createSimulationReportStub({ isAlive: true, finalAge: 30 });
        const summary = summarizeTopDeathCauses([
          { report: deadReport },
          { report: aliveReport },
          { report: deadReport, sampleId: 'golden-sect' },
        ]);
        assertEqual(summary.totalDeaths, 2, '应统计两次死亡');
        assertEqual(summary.byCause[0]?.deathCauseId, 'engine:early_death', 'top cause 应为 early_death');
        assertEqual(summary.byCohort.p3_eval[0]?.count, 1, 'golden 样本应归入 p3_eval');
        assertEqual(summary.byCohort.p2_legacy[0]?.count, 1, '无 sampleId 的 complete life 死亡应归入 p2_legacy');
        assertEqual(resolveDeathLifePhase(28), 'young_adult', '28 岁应为 young_adult');
      },
    },
    {
      name: 'P3 US-006 - ENG-01 在 deterministic 0–50 可被抑制',
      description: 'golden-sect deterministic 0–50 应存活且抑制随机英年早逝',
      test: async () => {
        const sim = new GameProcessSimulator({
          playerName: '顾清和',
          gender: 'male',
          seed: 301,
          simulateYears: 50,
          runUntilDeath: false,
          ageRange: { startAge: 0, endAge: 50 },
          routeTrack: 'sect',
          sampleId: 'golden-sect',
          verbose: false,
          enableAutoSave: false,
          enableManualSave: false,
          enableSaveRestore: false,
        });
        const report = await sim.simulate();
        assertEqual(report.finalAge, 50, '应跑至 50 岁');
        assertEqual(report.isAlive, true, 'P3 deterministic 应抑制 ENG-01 并存活');
      },
    },
    {
      name: 'P3 US-006 - P3-EVAL death_rate 与 without_warning gate',
      description: '存活至 50 的 golden 样本应通过 P3 death 指标',
      test: () => {
        const p3EvalEntries = ['golden-sect', 'golden-wanderer'].map(sampleId => ({
          sampleId,
          report: createSimulationReportStub({
            isAlive: true,
            finalAge: 50,
            config: {
              seed: 301,
              runUntilDeath: false,
              ageRange: { startAge: 0, endAge: 50 },
            },
          }),
        }));

        const p2Reports = [
          createSimulationReportStub({
            isAlive: false,
            finalAge: 85,
            config: { runUntilDeath: true, simulateYears: 85 },
          }),
        ];

        const gate = evaluateExperienceHealthGate(p2Reports, [], p3EvalEntries);
        assertEqual(gate.p3TrustEnforced, true, '应启用 P3 trust enforce');
        const deathRate = gate.blockingMetrics.find(metric => metric.key === 'death_rate');
        const dww = gate.blockingMetrics.find(metric => metric.key === 'death_without_warning_count');
        assertEqual(deathRate?.status, 'pass', 'P3-EVAL death_rate 应为 pass');
        assertEqual(deathRate?.actualValue, 0, 'P3-EVAL death_rate 应为 0');
        assertEqual(dww?.status, 'pass', 'death_without_warning_count 应为 pass');
        assertEqual(dww?.actualValue, 0, 'death_without_warning_count 应为 0');
      },
    },
    {
      name: 'P3 US-006 - demonic_ending_purge 可读可避',
      description: 'purge 事件应为 choice 且含亡命脱身缓解选项',
      test: () => {
        const event = eventLoader.getEventById('demonic_ending_purge');
        assert(event, 'demonic_ending_purge 应已加载');
        assertEqual(event?.eventType, 'choice', 'purge 应为 choice 事件');
        const flee = event?.choices?.find(choice => choice.id === 'demonic_purge_flee');
        const fight = event?.choices?.find(choice => choice.id === 'demonic_purge_fight');
        assert(flee, '应有亡命脱身缓解选项');
        assert(fight, '应有硬抗选项');
        assert(/危|伤|性命|清算/.test(fight?.description ?? ''), '硬抗选项应有 L2+ 风险文案');
      },
    },
    {
      name: 'P3 US-006 - wandering hero 险路事件含缓解',
      description: 'hero_road_peril 应提供硬闯与退避两条路径',
      test: () => {
        const event = eventLoader.getEventById('hero_road_peril');
        assert(event, 'hero_road_peril 应已加载');
        assertEqual(event?.choices?.length, 2, '应有双选项缓解结构');
        const retreat = event?.choices?.find(choice => choice.id === 'hero_peril_retreat');
        assert(retreat, '应有退避寻援缓解选项');
      },
    },
    {
      name: 'P3 US-021 - wandering hero midlife arc 事件加载',
      description: '游侠 31-50 中年弧五事件应加载且含 route_wanderer gate',
      test: () => {
        const arcIds = [
          'hero_old_case_returns',
          'hero_reputation_backlash',
          'hero_ally_pays_price',
          'hero_gray_judgment',
          'hero_freedom_settlement',
        ];
        for (const eventId of arcIds) {
          const event = eventLoader.getEventById(eventId);
          assert(event, `${eventId} 应已加载`);
          assertEqual(event?.eventType, 'choice', `${eventId} 应为 choice 事件`);
          const gate = event?.conditions?.find(
            condition => condition.type === 'expression' && condition.expression?.includes('route_wanderer'),
          );
          assert(gate, `${eventId} 应含 route_wanderer gate`);
        }
        const ally = eventLoader.getEventById('hero_ally_pays_price');
        const shield = ally?.choices?.find(choice => choice.id === 'ally_shield_reputation');
        const supported = ally?.choices?.find(choice => choice.id === 'ally_pay_ransom_supported');
        assert(shield, '盟友代价应有公开担责选项');
        assert(supported, '盟友代价应有江湖凑份子缓解选项');
        assert(/危|险|代价|伤/.test(ally?.content?.description ?? ''), '盟友代价应有 L2 风险文案');
      },
    },
    {
      name: 'P3 US-023 - demonic midlife 事件可读风险',
      description: 'midlife fork/betrayal 高风险选项须有 L2 文案与缓解选项',
      test: () => {
        const fork = eventLoader.getEventById('demonic_midlife_fork');
        assert(fork, 'demonic_midlife_fork 应已加载');
        const escalate = fork?.choices?.find(choice => choice.id === 'demonic_fork_escalate');
        const redemption = fork?.choices?.find(choice => choice.id === 'demonic_fork_redemption');
        const balance = fork?.choices?.find(choice => choice.id === 'demonic_fork_balance');
        assert(escalate && redemption && balance, 'fork 应含 escalate/redemption/balance 三缓解');
        assert(/禁术|重创|气血|退路/.test(escalate?.description ?? ''), 'escalate 应有 L2 风险文案');

        const betrayal = eventLoader.getEventById('demonic_midlife_betrayal');
        assert(betrayal, 'demonic_midlife_betrayal 应已加载');
        const purge = betrayal?.choices?.find(choice => choice.id === 'demonic_betrayal_purge');
        const coopt = betrayal?.choices?.find(choice => choice.id === 'demonic_betrayal_coopt');
        assert(purge && coopt, 'betrayal 应有清洗与反利用缓解');
        assert(/重伤|人脉/.test(purge?.description ?? ''), 'purge 应有 L2 风险文案');

        const expansion = eventLoader.getEventById('demonic_midlife_expansion');
        const survivor = eventLoader.getEventById('demonic_midlife_expansion_survivor');
        assert(expansion && survivor, 'expansion 应有门主/余孽两版 CB-2');
        assertEqual(expansion?.content?.title, '门主扩张', 'demonic_leader 应用门主扩张标题');
        assertEqual(survivor?.content?.title, '余孽借势', '非门主应用余孽借势标题');
      },
    },
    {
      name: 'P3 US-023 - golden-demonic 31-50 midlife arc',
      description: '确定性样本应命中 ≥3 route 事件、≥2 手动选择且存活至 50',
      test: async () => {
        const sample = GOLDEN_LINE_SAMPLES.find(s => s.id === 'golden-demonic');
        assert(sample, '应有 golden-demonic 样本');
        const run = await runP3EvalSimulation(sample);
        assertEqual(run.report.finalAge, 50, 'golden-demonic 应跑至 50 岁');
        assertEqual(run.report.isAlive, true, 'golden-demonic 应存活');

        const midlifeRecords = run.report.records.filter(
          record => record.age >= 31 && record.age <= 50,
        );
        const midlifeRouteEvents = midlifeRecords.filter(record =>
          record.eventId.startsWith('demonic_midlife'),
        );
        assert(
          midlifeRouteEvents.length >= 3,
          `31-50 应至少 3 个 demonic_midlife 事件，实际 ${midlifeRouteEvents.length}`,
        );

        const manualChoices = midlifeRecords.filter(
          record => record.eventType === 'choice' && record.eventId.startsWith('demonic_midlife'),
        );
        assert(
          manualChoices.length >= 2,
          `31-50 应至少 2 次 midlife 手动选择，实际 ${manualChoices.length}`,
        );

        const hitIds = new Set(midlifeRouteEvents.map(record => record.eventId));
        assert(hitIds.has('demonic_midlife_expansion'), '应命中 expansion');
        assert(
          hitIds.has('demonic_midlife_betrayal') || hitIds.has('demonic_midlife_temptation'),
          '应命中 betrayal 或 temptation',
        );
        assert(hitIds.has('demonic_midlife_fork'), '应命中 fork');
      },
    },
    {
      name: 'P3 US-024 - midlife gate priority routes',
      description: '三条 priority route 0–50 样本应通过 midlife gate',
      test: async () => {
        const runs: GoldenLineSimulationRun[] = [];
        for (const sample of GOLDEN_LINE_SAMPLES.filter(s => s.routeTrack)) {
          runs.push(await runP3EvalSimulation(sample));
        }

        const gate = evaluateMidlifeGate(runs);
        assert(gate.pass, `midlife gate 应 PASS；failures=${gate.failures.map(f => f.metric).join(', ')}`);

        for (const run of runs) {
          const track = run.sample.routeTrack!;
          const midlife = run.report.records.filter(
            record => record.age >= 31 && record.age <= 50,
          );
          const routeEvents = midlife.filter(record =>
            isMidlifeRouteEvent(track, record.eventId),
          );
          const manualChoices = routeEvents.filter(record => record.eventType === 'choice');
          assert(
            routeEvents.length >= MIN_MIDLIFE_ROUTE_EVENTS,
            `${run.sample.id} midlife route events 不足`,
          );
          assert(
            manualChoices.length >= MIN_MIDLIFE_MANUAL_CHOICES,
            `${run.sample.id} midlife manual choices 不足`,
          );
        }
      },
    },
    {
      name: 'P3 US-014 - payoff gate 区分 static 与 simulated',
      description: '静态 gate 通过时 priority-route 仿真缺口应保留为 warning signal',
      test: () => {
        const replay: GoldenLineReplayRecord[] = [
          {
            age: 4,
            eventId: 'childhood_preference',
            choiceId: 'balance_both',
            routeFlags: [],
          },
          {
            age: 6,
            eventId: 'martial_arts_enlightenment',
            choiceId: 'agile_path',
            routeFlags: [],
          },
        ];
        const run: GoldenLineSimulationRun = {
          sample: {
            id: 'golden-sect',
            personaName: '顾清和',
            gender: 'male',
            seed: 301,
            choiceTendency: 'martial',
            routeTrack: 'sect',
            description: 'mock',
          },
          report: {
            finalAge: 30,
            isAlive: true,
            totalChoices: 8,
            totalEvents: 20,
            records: [],
          } as import('../src/types/simulationRecordTypes').GameProcessReport,
          replay,
        };
        const evaluation = evaluatePayoffGate([run]);
        assert(
          evaluation.summary.staticPayoffRate >=
            evaluation.summary.simulatedPayoffThreshold,
          '静态 payoff coverage 应达到 gate threshold',
        );
        assert(
          evaluation.summary.missedOpportunityCount >= 1,
          '应有 simulated_gap',
        );
        const gap = evaluation.missedOpportunities.find(
          opportunity =>
            opportunity.findingType === 'simulated_gap' &&
            opportunity.keyChoiceEventId === 'martial_arts_enlightenment',
        );
        assert(gap, '应报告 martial_arts_enlightenment 缺口');
        assertEqual(gap?.choiceId, 'agile_path', '应含 choice id');
        assert(
          gap?.expectedPayoffEventIds.includes('martial_improvement'),
          '应含 expected payoff id',
        );
        assertEqual(gap?.blockReason, 'static_data_mismatch', '应推断 block reason');
        const signal = evaluation.findings.find(
          finding =>
            finding.sampleId === 'golden-sect' &&
            finding.findingType === 'simulated_gap' &&
            finding.severity === 'warning' &&
            finding.status === 'warning',
        );
        assert(signal, 'priority-route 仿真不足应保留为 warning signal');
      },
    },
    {
      name: 'P3 US-029 - neutral 仿真 payoff 为 warning signal',
      description: 'golden-neutral-baseline 仿真不足在 US-029 应报告但不阻断',
      test: () => {
        const replay: GoldenLineReplayRecord[] = [
          {
            age: 4,
            eventId: 'childhood_preference',
            choiceId: 'balance_both',
            routeFlags: [],
          },
          {
            age: 6,
            eventId: 'martial_arts_enlightenment',
            choiceId: 'agile_path',
            routeFlags: [],
          },
        ];
        const run: GoldenLineSimulationRun = {
          sample: {
            id: 'golden-neutral-baseline',
            personaName: '林素心',
            gender: 'female',
            seed: 304,
            choiceTendency: 'balanced',
            description: 'mock',
          },
          report: {
            finalAge: 30,
            isAlive: true,
            totalChoices: 8,
            totalEvents: 20,
            records: [],
          } as import('../src/types/simulationRecordTypes').GameProcessReport,
          replay,
        };
        const evaluation = evaluatePayoffGate([run]);
        const signal = evaluation.findings.find(
          finding =>
            finding.sampleId === 'golden-neutral-baseline' &&
            finding.findingType === 'simulated_gap' &&
            finding.severity === 'warning' &&
            finding.status === 'warning',
        );
        assert(signal, 'neutral 样本仿真不足应保留为 warning signal');
      },
    },
    {
      name: 'P3 US-014 - golden line gate 集成 payoff 阻断',
      description: '仿真 payoff gap signal 不应单独使 evaluateGoldenLineGates 失败',
      test: () => {
        const replay: GoldenLineReplayRecord[] = [
          {
            age: 4,
            eventId: 'childhood_preference',
            choiceId: 'balance_both',
            routeFlags: [],
          },
          {
            age: 6,
            eventId: 'martial_arts_enlightenment',
            choiceId: 'agile_path',
            routeFlags: [],
          },
        ];
        const run: GoldenLineSimulationRun = {
          sample: {
            id: 'golden-demonic',
            personaName: '沈夜',
            gender: 'male',
            seed: 303,
            choiceTendency: 'risk_averse',
            routeTrack: 'demonic',
            description: 'mock',
          },
          report: {
            finalAge: 30,
            isAlive: true,
            totalChoices: 8,
            totalEvents: 20,
            records: [],
          } as import('../src/types/simulationRecordTypes').GameProcessReport,
          replay,
        };
        const gate = evaluateGoldenLineGates([run]);
        assertEqual(gate.pass, false, 'fixture 仍有其他 gate blocker，不能归因于 payoff signal');
        assert(
          gate.payoffEvaluation.summary.staticPayoffRate >= 0.7,
          '静态 map 仍应通过阈值',
        );
        assert(
          gate.findings.some(
            finding =>
              finding.gate === 'payoff' &&
              finding.findingType === 'simulated_gap' &&
              finding.severity === 'warning' &&
              finding.status === 'warning',
          ),
          '应含 payoff warning signal',
        );
        assert(
          !gate.findings.some(
            finding => finding.gate === 'payoff' && finding.severity === 'blocker' && finding.status === 'fail',
          ),
          'payoff signal 不应产生 blocker',
        );
      },
    },
    {
      name: 'P3 US-017 - deterministic 样本存活至 50',
      description: 'P3-GL 四样本应通过 runP3EvalSimulation 跑到终点年龄',
      test: async () => {
        for (const sample of GOLDEN_LINE_SAMPLES) {
          const run = await runP3EvalSimulation(sample);
          assertEqual(run.report.finalAge, P3_EVAL_END_AGE, `${sample.id} 应跑至 50 岁`);
          assertEqual(run.report.isAlive, true, `${sample.id} 应存活`);
        }
      },
    },
    {
      name: 'P3 US-017 - 分段指标含 31-50 必填字段',
      description: '仿真报告应分离 0-30 与 31-50，且中年段含 route/relationship/death/payoff',
      test: async () => {
        const run = await runP3EvalSimulation(GOLDEN_LINE_SAMPLES[0]);
        const segmentReport = buildP3EvalSegmentReport(run);
        assert(segmentReport.youth.segment === '0-30', 'youth 分段标签');
        assert(segmentReport.midlife.segment === '31-50', 'midlife 分段标签');
        assert(
          segmentReport.youth.eventCount + segmentReport.midlife.eventCount > 0,
          '应有事件计数',
        );
        assert(
          segmentReport.youth.ageRange.max === 30 && segmentReport.midlife.ageRange.min === 31,
          '年龄边界',
        );
        const m = segmentReport.midlife;
        assert(typeof m.eventCount === 'number', 'midlife eventCount');
        assert(typeof m.choiceCount === 'number', 'midlife choiceCount');
        assert(Array.isArray(m.routeFlags), 'midlife routeFlags');
        assert(m.deathStatus !== undefined, 'midlife deathStatus');
        assert(m.payoffStatus !== undefined, 'midlife payoffStatus');
        assert(typeof m.payoffStatus.simulatedPayoffRate === 'number', 'payoff rate');
      },
    },
    {
      name: 'P3 US-017 - P3-EVAL 队列分段报告',
      description: 'P3-EVAL 全样本应产出 youth/midlife 双分段指标',
      test: async () => {
        assertEqual(P3_EVAL_SAMPLES.length, 4, 'P3-EVAL 应为 4 个样本');
        for (const sample of P3_EVAL_SAMPLES) {
          const run = await runP3EvalSimulation(sample);
          const report = buildP3EvalSegmentReport(run);
          assert(report.youth.eventCount >= 1, `${sample.id} youth 应有事件`);
          assert(report.midlife.eventCount >= 1, `${sample.id} midlife 应有事件`);
          assertEqual(report.finalAge, P3_EVAL_END_AGE, `${sample.id} finalAge`);
        }
      },
    },
    {
      name: 'P7 主动人生规划 - action resolver / cache / annual jump / reports',
      description: 'P7 active planning closure tests',
      test: async () => {
        await runAllP7Tests();
      },
    },
    {
      name: 'P7.1 active action experience closure',
      description: 'P7.1 summary cards, disturbance narrative, visibility report',
      test: async () => {
        await runAllP71Tests();
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
      description: '测试受控 workload 的内存增长（非进程绝对堆，避免测试套件加载数据后误报）',
      test: async () => {
        const executor = new EventExecutor();
        const baselineHeap = process.memoryUsage().heapUsed;
        const effects = [
          { type: EffectType.STAT_MODIFY, target: 'martialPower', value: 5, operator: 'add' as const },
          { type: EffectType.TIME_ADVANCE, target: 'age', value: 1 },
          { type: EffectType.FLAG_SET, target: 'perfMemoryProbe' },
        ];

        for (let i = 0; i < 500; i++) {
          const state = framework.createTestState();
          await executor.executeEffects(effects, state);
        }

        const growthMB = (process.memoryUsage().heapUsed - baselineHeap) / 1024 / 1024;
        console.log(`  受控 workload 内存增长：${growthMB.toFixed(2)}MB`);

        assert(growthMB < 30, `内存增长过高：${growthMB.toFixed(2)}MB (要求 < 30MB)`);
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
      test: async () => {
        const executor = new EventExecutor();
        const state = framework.createTestState();
        const initialPower = state.player.martialPower;

        // 旧格式：STAT_MODIFY 使用 stat 字段
        const legacyStatState = await executor.executeEffects(
          [
            {
              type: EffectType.STAT_MODIFY,
              stat: 'martialPower',
              value: 3,
              operator: 'add' as const,
            },
          ],
          state,
        );
        assertEqual(
          legacyStatState.player.martialPower,
          initialPower + 3,
          '旧格式 stat 字段应正确修改属性',
        );

        // 新格式：FLAG_SET 使用 flag 字段
        const newFlagState = await executor.executeEffects(
          [
            {
              type: EffectType.FLAG_SET,
              flag: 'compat_new_flag',
            },
          ],
          legacyStatState,
        );
        assert(newFlagState.flags.compat_new_flag === true, '新格式 flag 字段应写入顶层 flags');
        assert(
          newFlagState.player.flags.compat_new_flag === true,
          '新格式 flag 字段应同步写入 player.flags',
        );

        // 旧格式：FLAG_SET 使用 target 字段（历史写法）
        const legacyFlagState = await executor.executeEffects(
          [
            {
              type: EffectType.FLAG_SET,
              target: 'compat_legacy_flag',
            },
          ],
          newFlagState,
        );
        assert(legacyFlagState.flags.compat_legacy_flag === true, '旧格式 target 字段应写入顶层 flags');
        assert(
          legacyFlagState.player.flags.compat_legacy_flag === true,
          '旧格式 target 字段应同步写入 player.flags',
        );
      },
    },
    {
      name: '兼容性测试 - Canonical Snapshot 存档',
      description: '测试 saveGame 只写入 Canonical Snapshot 3.16.0',
      test: () => {
        saveManager.clearAllSaves();
        const state = new GameEngineIntegration().getGameState();
        const saveId = saveManager.saveGame(state, 'us-018-version-marker');
        const loaded = saveManager.loadGame(saveId);
        assert(loaded !== null, '当前版本存档应可正常读取');
        assertEqual(loaded!.snapshot.metadata.schemaVersion, '3.16.0', '存档应写入 Canonical Snapshot 3.16.0');
      },
    },
    {
      name: '兼容性测试 - 旧 raw GameState 拒绝',
      description: '测试旧 raw GameState 不会被当作当前存档读取',
      test: () => {
        const legacyRawSave = JSON.stringify({
          version: '1.0',
          save: { id: 'legacy', name: 'legacy', timestamp: Date.now(), gameData: framework.createTestState(), metadata: {} },
        });
        assertEqual(saveManager.importSave(legacyRawSave), false, '旧 raw GameState 存档应拒绝导入');
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
