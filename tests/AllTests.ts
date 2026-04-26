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
import { useNewGameEngine } from '../src/composables/useNewGameEngine';
import { GameEngineIntegration, gameEngine } from '../src/core/GameEngineIntegration';
import { eventLoader } from '../src/core/EventLoader';
import { dailyEventSystem } from '../src/core/DailyEventSystem';
import { saveManager } from '../src/core/SaveManager';
import { EffectType, EventCategory, EventPriority } from '../src/types/eventTypes';
import { eventExamples } from '../src/data/eventExamples';

// ========== 创建测试框架实例 ==========
const framework = new GameTestFramework();

async function runChoiceOutcomeBranchCase(options: {
  name: string;
  statePower: number;
  outcomes: Array<{
    text: string;
    condition?: { type: 'expression'; expression: string };
    effects: Array<{ type: EffectType; target: string }>;
  }>;
  expectedOutcomeText: string;
  expectedEffectTarget: string;
}) {
  const engine = useNewGameEngine();
  const evaluator = new ConditionEvaluator();
  const state = framework.createTestState();
  state.player.martialPower = options.statePower;

  const originalRequestAnimationFrame = globalThis.requestAnimationFrame;
  const originalGetGameState = gameEngine.getGameState;
  const originalIsChoiceAvailable = gameEngine.isChoiceAvailable;
  const originalExecuteChoiceEffects = gameEngine.executeChoiceEffects;

  let executedEffectTarget = '';

  globalThis.requestAnimationFrame = ((callback: FrameRequestCallback) => {
    callback(0);
    return 0;
  }) as typeof requestAnimationFrame;

  try {
    (gameEngine as any).getGameState = () => state;
    (gameEngine as any).isChoiceAvailable = (condition: any) =>
      !condition || evaluator.evaluate(condition, state);
    (gameEngine as any).executeChoiceEffects = async (effects: Array<{ target: string }>) => {
      executedEffectTarget = effects[0]?.target || '';
      return state;
    };

    (engine.engineState as any).currentEvent = {
      id: `test_choice_event_${options.name}`,
      eventType: 'choice',
      choices: [
        {
          id: `test_choice_${options.name}`,
          text: `测试选项-${options.name}`,
          effects: [{ type: EffectType.FLAG_SET, target: 'default_effect_should_not_hit' }],
          outcomes: options.outcomes,
        },
      ],
    };

    await engine.handleChoice({ id: `test_choice_${options.name}` } as any);

    assertEqual(engine.engineState.lastOutcomeText, options.expectedOutcomeText, '应命中预期 outcome 文本');
    assertEqual(executedEffectTarget, options.expectedEffectTarget, '应执行预期 outcome 效果');
  } finally {
    (gameEngine as any).getGameState = originalGetGameState;
    (gameEngine as any).isChoiceAvailable = originalIsChoiceAvailable;
    (gameEngine as any).executeChoiceEffects = originalExecuteChoiceEffects;
    globalThis.requestAnimationFrame = originalRequestAnimationFrame;
    (engine.engineState as any).currentEvent = null;
    engine.engineState.lastOutcomeText = null;
    engine.engineState.lastEffects = [];
  }
}

async function runAutoResolveCase() {
  const engine = useNewGameEngine();
  const evaluator = new ConditionEvaluator();
  const state = framework.createTestState();
  state.player.martialPower = 10;

  const originalRequestAnimationFrame = globalThis.requestAnimationFrame;
  const originalGetGameState = gameEngine.getGameState;
  const originalIsChoiceAvailable = gameEngine.isChoiceAvailable;
  const originalExecuteChoiceEffects = gameEngine.executeChoiceEffects;
  const originalSelectEvent = gameEngine.selectEvent;
  const originalAdvanceTime = gameEngine.advanceTime;

  let executedChoiceId = '';
  let executedOutcomeTarget = '';

  globalThis.requestAnimationFrame = ((callback: FrameRequestCallback) => {
    callback(0);
    return 0;
  }) as typeof requestAnimationFrame;

  try {
    (gameEngine as any).getGameState = () => state;
    (gameEngine as any).isChoiceAvailable = (condition: any) =>
      !condition || evaluator.evaluate(condition, state);
    (gameEngine as any).executeChoiceEffects = async (
      effects: Array<{ target?: string }>,
      _eventId: string,
      choiceId: string,
    ) => {
      executedChoiceId = choiceId;
      executedOutcomeTarget = effects[0]?.target || '';
      return state;
    };
    (gameEngine as any).advanceTime = () => state;
    (gameEngine as any).selectEvent = () => ({
      id: 'test_auto_resolve_event',
      eventType: 'choice',
      metadata: { autoResolve: true },
      choices: [
        {
          id: 'blocked_choice',
          text: '不可用选项',
          condition: { type: 'expression', expression: 'player.martialPower >= 99' },
          effects: [{ type: EffectType.FLAG_SET, target: 'blocked_choice_should_not_run' }],
          outcomes: [
            {
              text: '不可达高收益分支',
              condition: { type: 'expression', expression: 'player.martialPower >= 99' },
              effects: [{ type: EffectType.FLAG_SET, target: 'blocked_outcome_should_not_run' }],
            },
          ],
        },
        {
          id: 'valid_choice',
          text: '可用选项',
          effects: [{ type: EffectType.FLAG_SET, target: 'valid_fallback_effect' }],
          outcomes: [
            {
              text: '不可达高收益分支',
              condition: { type: 'expression', expression: 'player.martialPower >= 99' },
              effects: [{ type: EffectType.FLAG_SET, target: 'invalid_high_reward_outcome' }],
            },
            {
              text: '可达兜底分支',
              effects: [{ type: EffectType.FLAG_SET, target: 'valid_fallback_outcome' }],
            },
          ],
        },
      ],
    });

    engine.getNextEvent();
    await new Promise(resolve => setTimeout(resolve, 0));

    assertEqual(executedChoiceId, 'valid_choice', 'autoResolve 只能选择可用选项');
    assertEqual(executedOutcomeTarget, 'valid_fallback_outcome', 'autoResolve 应按真实条件命中可达 outcome');
  } finally {
    (gameEngine as any).getGameState = originalGetGameState;
    (gameEngine as any).isChoiceAvailable = originalIsChoiceAvailable;
    (gameEngine as any).executeChoiceEffects = originalExecuteChoiceEffects;
    (gameEngine as any).selectEvent = originalSelectEvent;
    (gameEngine as any).advanceTime = originalAdvanceTime;
    globalThis.requestAnimationFrame = originalRequestAnimationFrame;
    (engine.engineState as any).currentEvent = null;
    engine.engineState.lastOutcomeText = null;
    engine.engineState.lastEffects = [];
  }
}

async function runStateConsistencyRegressionCase() {
  const engine = useNewGameEngine();
  const originalRequestAnimationFrame = globalThis.requestAnimationFrame;
  const originalSelectEvent = gameEngine.selectEvent;

  globalThis.requestAnimationFrame = ((callback: FrameRequestCallback) => {
    callback(0);
    return 0;
  }) as typeof requestAnimationFrame;

  try {
    saveManager.clearAllSaves();
    (gameEngine as any).selectEvent = () => ({
      id: 'state_consistency_bootstrap_event',
      eventType: 'choice',
      choices: [
        {
          id: 'state_consistency_bootstrap_choice',
          text: '初始化事件',
          effects: [{ type: EffectType.FLAG_SET, target: 'state_consistency_bootstrap' }],
        },
      ],
    });

    engine.startNewGame('StateConsistencyHero', 'male');
    await new Promise(resolve => setTimeout(resolve, 0));

    const stateAfterNewGame = engine.getGameState();
    assert(stateAfterNewGame.player.name === 'StateConsistencyHero', '新开局后名字未同步到引擎状态，可能出现状态分裂');
    assert(stateAfterNewGame.player.alive === true, '新开局后玩家存活状态异常，可能是初始化同步失败');

    (engine.engineState as any).currentEvent = {
      id: 'state_consistency_choice_event',
      eventType: 'choice',
      choices: [
        {
          id: 'state_consistency_choice',
          text: '执行状态同步回归选择',
          description: '用于验证选择后引擎状态与 UI 状态一致',
          effects: [{ type: EffectType.FLAG_SET, target: 'state_consistency_choice_done' }],
        },
      ],
    };
    (engine.engineState as any).availableChoices = [
      { id: 'state_consistency_choice', text: '执行状态同步回归选择' },
    ];

    const choiceHandled = await engine.handleChoice({ id: 'state_consistency_choice' } as any);
    assert(choiceHandled, '选择执行失败，无法验证状态同步链路');
    assert(engine.engineState.lastEffects.length > 0, '选择后 UI 效果列表为空，可能是执行结果未回写到 engineState');
    assert(
      engine.getGameState().flags.state_consistency_choice_done === true,
      '选择后引擎 flags 未更新，存在状态不同步风险',
    );

    const saveId = saveManager.saveGame(engine.getGameState(), 'US-015-state-consistency');
    const loadedSave = saveManager.loadGame(saveId);
    assert(loadedSave !== null, '保存后无法读取存档，状态持久化链路异常');
    assert(
      loadedSave!.gameData.flags.state_consistency_choice_done === true,
      '存档读回未保留选择后的 flag，状态同步可能在保存流程中断裂',
    );

    const endingState = engine.getGameState();
    endingState.player.alive = false;
    endingState.ending = {
        id: 'state_consistency_ending',
        name: '状态一致性结局',
        description: '用于验证 ending 与主状态一致',
      } as any;
    endingState.flags.ending_triggered = true;
    assert(engine.getGameState().player.alive === false, '结局态存活状态未同步，ending 读取可能来自旧状态源');
    assert(engine.getGameState().flags.ending_triggered === true, '结局标记未同步到主状态，可能影响结束流程判断');

    engine.restartGame();
    const stateAfterRestart = engine.getGameState();
    assert(stateAfterRestart.player.age === 0, '重开后年龄未重置，主状态与重开流程不同步');
    assert(stateAfterRestart.player.alive === true, '重开后存活状态未恢复，主状态重置不完整');
    assert((engine.engineState.currentEvent ?? null) === null, '重开后 currentEvent 未清空，UI 状态与主状态不同步');
    assert(engine.engineState.lastOutcomeText === null, '重开后 lastOutcomeText 未清空，存在跨局残留状态');
    assert(engine.engineState.lastEffects.length === 0, '重开后 lastEffects 未清空，存在 UI 状态残留');
  } finally {
    (gameEngine as any).selectEvent = originalSelectEvent;
    globalThis.requestAnimationFrame = originalRequestAnimationFrame;
    saveManager.clearAllSaves();
    (engine.engineState as any).currentEvent = null;
    (engine.engineState as any).availableChoices = [];
    engine.engineState.lastOutcomeText = null;
    engine.engineState.lastEffects = [];
  }
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
        assert(result === false, '不满足条件应被判定为 false');
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
      name: '条件评估器 - 非法表达式错误信息',
      description: '测试非法表达式会失败关闭并输出包含表达式和原因的告警',
      test: () => {
        const evaluator = new ConditionEvaluator();
        const state = framework.createTestState();
        const expression = 'player.martialPower >= 20 ? true : false';

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
          assert(result === false, '非法表达式应 fail-close 返回 false');
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
            reason: '非法 player 字段访问应返回 false',
          },
          {
            expression: 'player.__proto__ == true',
            reason: '原型链字段访问应返回 false',
          },
          {
            expression: 'luck >= 10',
            reason: '未白名单顶层字段应返回 false',
          },
          {
            expression: 'flags.has(testFlag)',
            reason: 'flags.has 非字符串参数应返回 false',
          },
          {
            expression: '(player.age >= 18',
            reason: '括号不配对应返回 false',
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
      name: '运行时门禁 - triggerConditions 不满足时事件不得触发',
      description: '测试 getAvailableEvents 会统一校验 legacy triggerConditions，失败时过滤事件',
      test: () => {
        const engine = new GameEngineIntegration() as any;
        const state = engine.getGameState();
        state.player.age = 22;
        state.identity = {
          identities: ['hero'],
          primary: 'hero',
        };

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
          assertEqual(available.length, 0, 'triggerConditions 不满足时不应进入可选事件列表');
        } finally {
          (eventLoader as any).getEventsByAge = originalGetEventsByAge;
        }
      },
    },
    {
      name: '多结果分支 - 条件命中时应选择对应结果',
      description: '测试 expression 条件满足时命中对应 outcome',
      test: async () => {
        await runChoiceOutcomeBranchCase({
          name: 'condition_success',
          statePower: 30,
          outcomes: [
            {
              text: '命中成功分支',
              condition: { type: 'expression', expression: 'player.martialPower >= 20' },
              effects: [{ type: EffectType.FLAG_SET, target: 'success_branch' }],
            },
            {
              text: '兜底分支',
              effects: [{ type: EffectType.FLAG_SET, target: 'fallback_branch' }],
            },
          ],
          expectedOutcomeText: '命中成功分支',
          expectedEffectTarget: 'success_branch',
        });
      },
    },
    {
      name: '多结果分支 - 函数条件应失败关闭并命中兜底',
      description: '测试 runtime 不执行函数式 outcome.condition，避免绕开受控 evaluator',
      test: async () => {
        await runChoiceOutcomeBranchCase({
          name: 'function_condition_fail_close',
          statePower: 80,
          outcomes: [
            {
              text: '函数条件分支',
              condition: (() => true) as any,
              effects: [{ type: EffectType.FLAG_SET, target: 'function_condition_branch' }],
            },
            {
              text: '兜底分支',
              effects: [{ type: EffectType.FLAG_SET, target: 'fallback_branch' }],
            },
          ],
          expectedOutcomeText: '兜底分支',
          expectedEffectTarget: 'fallback_branch',
        });
      },
    },
    {
      name: '多结果分支 - 条件失败时应跳过并命中兜底',
      description: '测试 expression 条件失败时不会错误命中，且可落入 fallback',
      test: async () => {
        await runChoiceOutcomeBranchCase({
          name: 'condition_failure',
          statePower: 10,
          outcomes: [
            {
              text: '高门槛分支',
              condition: { type: 'expression', expression: 'player.martialPower >= 99' },
              effects: [{ type: EffectType.FLAG_SET, target: 'high_threshold_branch' }],
            },
            {
              text: '兜底分支',
              effects: [{ type: EffectType.FLAG_SET, target: 'fallback_branch' }],
            },
          ],
          expectedOutcomeText: '兜底分支',
          expectedEffectTarget: 'fallback_branch',
        });
      },
    },
    {
      name: '多结果分支 - 仅兜底分支时应正常执行',
      description: '测试没有条件分支时可直接命中 fallback outcome',
      test: async () => {
        await runChoiceOutcomeBranchCase({
          name: 'fallback_only',
          statePower: 5,
          outcomes: [
            {
              text: '唯一兜底分支',
              effects: [{ type: EffectType.FLAG_SET, target: 'fallback_only_branch' }],
            },
          ],
          expectedOutcomeText: '唯一兜底分支',
          expectedEffectTarget: 'fallback_only_branch',
        });
      },
    },
    {
      name: '多结果分支 - 顺序优先级应取第一个命中的分支',
      description: '测试当多个分支条件都满足时，按定义顺序选择第一个',
      test: async () => {
        await runChoiceOutcomeBranchCase({
          name: 'order_priority',
          statePower: 50,
          outcomes: [
            {
              text: '第一个命中分支',
              condition: { type: 'expression', expression: 'player.martialPower >= 20' },
              effects: [{ type: EffectType.FLAG_SET, target: 'first_match_branch' }],
            },
            {
              text: '第二个命中分支',
              condition: { type: 'expression', expression: 'player.martialPower >= 30' },
              effects: [{ type: EffectType.FLAG_SET, target: 'second_match_branch' }],
            },
          ],
          expectedOutcomeText: '第一个命中分支',
          expectedEffectTarget: 'first_match_branch',
        });
      },
    },
    {
      name: '自动判定选择 - 只选可用项且 outcome 按真实条件命中',
      description: '测试 autoResolve 不绕过 choice.condition 和 outcome.condition',
      test: async () => {
        await runAutoResolveCase();
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
      description: '测试 main_story/critical 事件在重复抑制下保留权重豁免',
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
      name: '状态一致性回归 - 新开局/选择/结局/重开/存档链路',
      description: '测试主状态源与 UI 状态在关键流程保持一致，失败应直接暴露同步问题',
      test: async () => {
        await runStateConsistencyRegressionCase();
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
