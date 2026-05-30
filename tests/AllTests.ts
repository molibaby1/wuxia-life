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
import { resolveFirstChoiceEffects } from '../src/core/ChoiceOutcomeResolver';
import { detectEventClasses } from '../scripts/eventRepetitionClassDetection';
import { GameEngineIntegration, gameEngine } from '../src/core/GameEngineIntegration';
import { eventLoader } from '../src/core/EventLoader';
import { dailyEventSystem } from '../src/core/DailyEventSystem';
import { evaluateSaveCompatibility, P2_SAVE_SCHEMA_VERSION, saveManager } from '../src/core/SaveManager';
import { getRouteCompatibilityRule, resolveRouteConflict } from '../src/core/RouteCompatibilityRules';
import { RouteStateManager } from '../src/core/RouteStateManager';
import { EffectType, EventCategory, EventPriority } from '../src/types/eventTypes';
import { eventExamples } from '../src/data/eventExamples';
import { evaluateSimulationGate, parseWaiverArg } from '../scripts/gameplaySimulationGate';
import {
  evaluateExperienceHealthGate,
  validateExperienceWaivers,
} from '../scripts/experienceHealthGate';
import { computeExperienceDerivedMetrics } from '../scripts/computeExperienceMetricsFromReports';
import { GameProcessSimulator } from './GameProcessSimulator';

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
    assert(engine.engineState.lastChoiceFeedback !== null, '应生成统一选择反馈结构');
    assert(
      !Object.prototype.hasOwnProperty.call(engine.engineState.lastChoiceFeedback?.player || {}, 'rawEffects'),
      '玩家反馈不应直接暴露诊断原始字段',
    );
  } finally {
    (gameEngine as any).getGameState = originalGetGameState;
    (gameEngine as any).isChoiceAvailable = originalIsChoiceAvailable;
    (gameEngine as any).executeChoiceEffects = originalExecuteChoiceEffects;
    globalThis.requestAnimationFrame = originalRequestAnimationFrame;
    (engine.engineState as any).currentEvent = null;
    engine.engineState.lastOutcomeText = null;
    engine.engineState.lastEffects = [];
    (engine.engineState as any).lastChoiceFeedback = null;
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
    assert(engine.engineState.lastChoiceFeedback !== null, 'autoResolve 应复用统一反馈结构');
    assert(
      typeof engine.engineState.lastChoiceFeedback?.player?.narrativeResult === 'string',
      'autoResolve 反馈应包含玩家可展示叙事结果',
    );
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
    (engine.engineState as any).lastChoiceFeedback = null;
  }
}

async function runChoiceFeedbackManualCoverageCase() {
  const engine = useNewGameEngine();
  const initialState = framework.createTestState();
  initialState.flags = {
    ...initialState.flags,
    sect_faction: 'orthodox',
  };
  initialState.player.flags = {
    ...initialState.player.flags,
    sect_faction: 'orthodox',
  } as any;
  let currentState = initialState;

  const originalRequestAnimationFrame = globalThis.requestAnimationFrame;
  const originalGetGameState = gameEngine.getGameState;
  const originalExecuteChoiceEffects = gameEngine.executeChoiceEffects;

  globalThis.requestAnimationFrame = ((callback: FrameRequestCallback) => {
    callback(0);
    return 0;
  }) as typeof requestAnimationFrame;

  try {
    (gameEngine as any).getGameState = () => currentState;
    (gameEngine as any).executeChoiceEffects = async (
      effects: Array<{ type: EffectType; target?: string; flag?: string; value?: unknown }>,
    ) => {
      const nextFlags = { ...currentState.flags };
      const nextPlayerFlags = { ...(currentState.player.flags as Record<string, unknown>) };
      for (const effect of effects) {
        if (effect.type === EffectType.FLAG_SET) {
          const flagKey = effect.flag || effect.target;
          if (flagKey) {
            nextFlags[flagKey] = effect.value ?? true;
            nextPlayerFlags[flagKey] = effect.value ?? true;
          }
        }
      }
      currentState = {
        ...currentState,
        flags: nextFlags,
        player: {
          ...currentState.player,
          flags: nextPlayerFlags,
        },
      };
      return currentState;
    };

    (engine.engineState as any).currentEvent = {
      id: 'test_manual_feedback_event',
      eventType: 'choice',
      choices: [
        {
          id: 'manual_feedback_choice',
          text: '测试反馈覆盖',
          effects: [],
          outcomes: [
            {
              id: 'manual_feedback_outcome',
              text: '你在江湖上迈出关键一步',
              effects: [
                { type: EffectType.STAT_MODIFY, target: 'martialPower', value: 3, operator: 'add' },
                { type: EffectType.RELATION_CHANGE, target: 'mentor_master', value: 5 },
                { type: EffectType.FLAG_SET, target: 'sect_faction', value: 'demonic' },
                { type: EffectType.FLAG_SET, target: 'long_term_oath' },
              ],
            },
          ],
        },
      ],
    };

    const handled = await engine.handleChoice({ id: 'manual_feedback_choice' } as any);
    assert(handled, '手动选择测试应成功执行');

    const feedback = engine.engineState.lastChoiceFeedback;
    assert(feedback !== null, '手动选择应生成反馈结构');
    assertEqual(feedback?.player.statImpacts[0]?.stat, 'martialPower', '应记录属性变化字段');
    assertEqual(feedback?.player.relationshipImpacts[0]?.relationId, 'mentor_master', '应记录关系变化字段');
    assertEqual(feedback?.player.routeImpact?.from, 'orthodox', '应记录路线变化起点');
    assertEqual(feedback?.player.routeImpact?.to, 'demonic', '应记录路线变化终点');
    assert(
      feedback?.player.longTermFlags.some(item => item.flag === 'long_term_oath'),
      '应记录长期标记变化',
    );
  } finally {
    (gameEngine as any).getGameState = originalGetGameState;
    (gameEngine as any).executeChoiceEffects = originalExecuteChoiceEffects;
    globalThis.requestAnimationFrame = originalRequestAnimationFrame;
    (engine.engineState as any).currentEvent = null;
    engine.engineState.lastOutcomeText = null;
    engine.engineState.lastEffects = [];
    (engine.engineState as any).lastChoiceFeedback = null;
  }
}

async function runChoiceFeedbackAutoResolveFallbackCase() {
  const engine = useNewGameEngine();
  const initialState = framework.createTestState();
  initialState.flags = {
    ...initialState.flags,
    sect_faction: 'orthodox',
  };
  initialState.player.flags = {
    ...initialState.player.flags,
    sect_faction: 'orthodox',
  } as any;
  let currentState = initialState;

  const originalRequestAnimationFrame = globalThis.requestAnimationFrame;
  const originalGetGameState = gameEngine.getGameState;
  const originalIsChoiceAvailable = gameEngine.isChoiceAvailable;
  const originalExecuteChoiceEffects = gameEngine.executeChoiceEffects;
  const originalSelectEvent = gameEngine.selectEvent;
  const originalAdvanceTime = gameEngine.advanceTime;

  globalThis.requestAnimationFrame = ((callback: FrameRequestCallback) => {
    callback(0);
    return 0;
  }) as typeof requestAnimationFrame;

  try {
    (gameEngine as any).getGameState = () => currentState;
    (gameEngine as any).isChoiceAvailable = () => true;
    (gameEngine as any).executeChoiceEffects = async (
      effects: Array<{ type: EffectType; target?: string; flag?: string; value?: unknown }>,
    ) => {
      const nextFlags = { ...currentState.flags };
      const nextPlayerFlags = { ...(currentState.player.flags as Record<string, unknown>) };
      for (const effect of effects) {
        if (effect.type === EffectType.FLAG_SET) {
          const flagKey = effect.flag || effect.target;
          if (flagKey) {
            nextFlags[flagKey] = effect.value ?? true;
            nextPlayerFlags[flagKey] = effect.value ?? true;
          }
        }
      }
      currentState = {
        ...currentState,
        flags: nextFlags,
        player: {
          ...currentState.player,
          flags: nextPlayerFlags,
        },
      };
      return currentState;
    };
    (gameEngine as any).advanceTime = () => currentState;
    (gameEngine as any).selectEvent = () => ({
      id: 'test_auto_feedback_event',
      eventType: 'choice',
      metadata: { autoResolve: true },
      choices: [
        {
          id: 'auto_feedback_choice',
          text: '自动测试反馈覆盖',
          effects: [],
          outcomes: [
            {
              id: 'auto_feedback_outcome',
              text: '   ',
              effects: [
                { type: EffectType.STAT_MODIFY, target: 'charisma', value: 2, operator: 'add' },
                { type: EffectType.RELATION_CHANGE, target: 'ally_friend', value: 4 },
                { type: EffectType.FLAG_SET, target: 'sect_faction', value: 'wanderer' },
                { type: EffectType.FLAG_SET, target: 'auto_long_term_mark' },
              ],
            },
          ],
        },
      ],
    });

    engine.getNextEvent();
    await new Promise(resolve => setTimeout(resolve, 0));

    const feedback = engine.engineState.lastChoiceFeedback;
    assert(feedback !== null, 'autoResolve 应生成反馈结构');
    assertEqual(feedback?.player.statImpacts[0]?.stat, 'charisma', 'autoResolve 应记录属性变化字段');
    assertEqual(feedback?.player.relationshipImpacts[0]?.relationId, 'ally_friend', 'autoResolve 应记录关系变化字段');
    assertEqual(feedback?.player.routeImpact?.from, 'orthodox', 'autoResolve 应记录路线变化起点');
    assertEqual(feedback?.player.routeImpact?.to, 'wanderer', 'autoResolve 应记录路线变化终点');
    assert(
      feedback?.player.longTermFlags.some(item => item.flag === 'auto_long_term_mark'),
      'autoResolve 应记录长期标记变化',
    );
    assert(feedback?.diagnostic.fallbackUsed === true, '应启用缺失叙事兜底标记');
    assertEqual(
      feedback?.player.narrativeResult,
      '你的选择激起了涟漪，后续影响仍在发酵。',
      '应回退到默认兜底叙事文本',
    );
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
    (engine.engineState as any).lastChoiceFeedback = null;
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

async function runMainFlowSaveLoadCase() {
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
      id: 'us_019_bootstrap_event',
      eventType: 'choice',
      choices: [
        {
          id: 'us_019_choice',
          text: '记录状态',
          effects: [{ type: EffectType.FLAG_SET, target: 'us_019_event_done' }],
        },
      ],
    });

    engine.startNewGame('SaveLoadHero', 'female');
    await new Promise(resolve => setTimeout(resolve, 0));

    const runtimeState = engine.getGameState();
    runtimeState.currentTime = { year: 33, month: 4, day: 11 };
    runtimeState.flags = {
      ...runtimeState.flags,
      sect_faction: 'orthodox',
      route_hero: true,
      us_019_marker: true,
    };
    runtimeState.player.flags = {
      ...runtimeState.player.flags,
      sect_faction: 'orthodox',
      route_hero: true,
    };
    runtimeState.player.relationships = [
      { id: 'ally_001', role: 'friend', name: '阿青', affinity: 72 },
    ];
    runtimeState.routeStates = {
      hero: {
        routeId: 'hero',
        lifecycle: 'locked_in',
        category: 'main',
        lockedIn: true,
        lastChangedAtAge: runtimeState.player.age,
      },
    };
    runtimeState.routeHistory = [
      {
        routeId: 'hero',
        from: 'active',
        to: 'locked_in',
        category: 'main',
        lockedIn: true,
        age: runtimeState.player.age,
        eventId: 'us_019_lock',
        timestamp: Date.now(),
      },
    ];
    runtimeState.eventHistory = [
      {
        eventId: 'us_019_history_event',
        age: runtimeState.player.age,
        triggeredAt: runtimeState.currentTime.year,
      },
    ];
    runtimeState.ending = {
      id: 'us_019_future_ending',
      name: '未竟之路',
    } as any;

    const saveId = engine.saveCurrentGame('US-019-main-flow');
    assert(saveId.length > 0, '主流程存档应返回有效 saveId');

    runtimeState.player.name = 'MutatedAfterSave';
    runtimeState.currentTime.year = 99;
    runtimeState.flags.us_019_marker = false;
    runtimeState.player.relationships = [];
    runtimeState.routeStates = {};
    runtimeState.routeHistory = [];
    runtimeState.eventHistory = [];
    runtimeState.ending = null;

    const loaded = engine.loadGameFromSave(saveId);
    assert(loaded, '主流程应可加载刚保存的存档');

    const restored = engine.getGameState();
    assertEqual(restored.player.name, 'SaveLoadHero', '读档后玩家信息应恢复');
    assertEqual(restored.currentTime?.year, 33, '读档后时间应恢复');
    assert((restored.eventHistory || []).length > 0, '读档后事件历史应恢复');
    assertEqual(restored.routeStates?.hero?.lifecycle, 'locked_in', '读档后路线状态应恢复');
    assertEqual(restored.player.relationships?.[0]?.name, '阿青', '读档后关系状态应恢复');
    assertEqual((restored.ending as any)?.id, 'us_019_future_ending', '读档后结局相关状态应恢复');

    const nextEvent = engine.engineState.currentEvent;
    assert(nextEvent !== null, '读档后应可继续主流程并获得下一事件');
    assertEqual(restored.flags.us_019_marker, true, '继续流程前关键 flag 不应被重置');
  } finally {
    (gameEngine as any).selectEvent = originalSelectEvent;
    globalThis.requestAnimationFrame = originalRequestAnimationFrame;
    saveManager.clearAllSaves();
    (engine.engineState as any).currentEvent = null;
    (engine.engineState as any).availableChoices = [];
    engine.engineState.lastOutcomeText = null;
    engine.engineState.lastEffects = [];
    (engine.engineState as any).lastChoiceFeedback = null;
  }
}

async function runRestartContinueEndingSaveBehaviorCase() {
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
      id: 'us_020_resume_event',
      eventType: 'choice',
      choices: [
        {
          id: 'us_020_choice',
          text: '继续推进',
          effects: [{ type: EffectType.FLAG_SET, target: 'us_020_resumed' }],
        },
      ],
    });

    engine.startNewGame('RestartSaveHero', 'male');
    await new Promise(resolve => setTimeout(resolve, 0));
    const state = engine.getGameState();
    state.currentTime = { year: 18, month: 7, day: 3 };
    state.flags.us_020_checkpoint = true;

    const saveId = engine.saveCurrentGame('US-020-checkpoint');
    assert(saveId.length > 0, '应生成有效存档 ID');

    engine.restartGame();
    const stateAfterRestart = engine.getGameState();
    assertEqual(stateAfterRestart.player.age, 0, '重开后应回到初始化年龄');
    const savedAfterRestart = saveManager.loadGame(saveId);
    assert(savedAfterRestart !== null, '重开不应破坏已有存档');
    assertEqual(savedAfterRestart?.gameData.flags.us_020_checkpoint, true, '重开后旧存档内容应保持不变');

    const loadedAfterRestart = engine.loadGameFromSave(saveId);
    assert(loadedAfterRestart, '重开后应可继续读取既有存档');
    const resumedState = engine.getGameState();
    assertEqual(resumedState.flags.us_020_checkpoint, true, '读档后关键 checkpoint 应恢复');
    assert(engine.engineState.currentEvent !== null, '读档继续后应恢复到可继续推进的事件流');

    resumedState.player.alive = false;
    resumedState.ending = {
      id: 'us_020_ending',
      name: '终局测试',
      description: '用于验证结局后读档行为',
    } as any;

    const loadedFromEnding = engine.loadGameFromSave(saveId);
    assert(loadedFromEnding, '结局后应可读取历史存档');
    const restoredFromEnding = engine.getGameState();
    assertEqual(restoredFromEnding.player.alive, true, '结局后读档应恢复为可继续状态');
    assertEqual(restoredFromEnding.flags.us_020_checkpoint, true, '结局后读档应恢复关键状态');
    assert(engine.engineState.currentEvent !== null, '结局后读档应继续主流程事件');
  } finally {
    (gameEngine as any).selectEvent = originalSelectEvent;
    globalThis.requestAnimationFrame = originalRequestAnimationFrame;
    saveManager.clearAllSaves();
    (engine.engineState as any).currentEvent = null;
    (engine.engineState as any).availableChoices = [];
    engine.engineState.lastOutcomeText = null;
    engine.engineState.lastEffects = [];
    (engine.engineState as any).lastChoiceFeedback = null;
  }
}

async function runSaveRegressionCoverageCase() {
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
      id: 'us_021_resume_event',
      eventType: 'choice',
      choices: [
        {
          id: 'us_021_choice',
          text: '继续江湖',
          effects: [{ type: EffectType.FLAG_SET, target: 'us_021_resumed' }],
        },
      ],
    });

    engine.startNewGame('SaveRegressionHero', 'female');
    await new Promise(resolve => setTimeout(resolve, 0));

    const state = engine.getGameState();
    state.currentTime = { year: 27, month: 9, day: 12 };
    state.flags = {
      ...state.flags,
      route_hero: true,
      sect_faction: 'orthodox',
      us_021_checkpoint: true,
    };
    state.player.flags = {
      ...state.player.flags,
      route_hero: true,
      sect_faction: 'orthodox',
    };
    state.player.relationships = [
      { id: 'ally_021', role: 'friend', name: '赵灵', affinity: 81 },
    ];
    state.routeStates = {
      hero: {
        routeId: 'hero',
        lifecycle: 'locked_in',
        category: 'main',
        lockedIn: true,
        lastChangedAtAge: state.player.age,
      },
    };
    state.routeHistory = [
      {
        routeId: 'hero',
        from: 'active',
        to: 'locked_in',
        category: 'main',
        lockedIn: true,
        age: state.player.age,
        eventId: 'us_021_lock_route',
        timestamp: Date.now(),
      },
    ];
    state.eventHistory = [
      {
        eventId: 'us_021_history_event',
        age: state.player.age,
        triggeredAt: state.currentTime.year,
      },
    ];
    state.identity = {
      current: ['hero'],
      unlocked: ['commoner', 'hero'],
      primary: 'hero',
      title: '江湖义士',
      reputations: {},
    } as any;
    state.lifePath = {
      primaryIdentity: 'hero',
      faction: 'orthodox',
    } as any;

    const saveId = engine.saveCurrentGame('US-021-regression');
    assert(saveId.length > 0, 'US-021: 保存阶段应生成有效 saveId');

    state.currentTime.year = 99;
    state.flags.route_hero = false;
    state.flags.us_021_checkpoint = false;
    state.player.flags.route_hero = false;
    state.player.relationships = [];
    state.routeStates = {};
    state.routeHistory = [];
    state.eventHistory = [];
    state.identity = undefined;
    state.lifePath = undefined;

    const loaded = engine.loadGameFromSave(saveId);
    assert(loaded, 'US-021: 读档阶段应成功恢复存档');
    const restoredAfterLoad = engine.getGameState();
    assertEqual(restoredAfterLoad.currentTime?.year, 27, 'US-021: 读档后时间字段应恢复');
    assertEqual(restoredAfterLoad.flags.route_hero, true, 'US-021: 读档后路线字段应恢复');
    assertEqual(restoredAfterLoad.flags.us_021_checkpoint, true, 'US-021: 读档后关键 checkpoint 应恢复');
    assertEqual(restoredAfterLoad.identity?.primary, 'hero', 'US-021: 读档后身份字段应恢复');
    assertEqual(restoredAfterLoad.player.relationships?.[0]?.name, '赵灵', 'US-021: 读档后关系字段应恢复');
    assertEqual(restoredAfterLoad.eventHistory?.[0]?.eventId, 'us_021_history_event', 'US-021: 读档后事件历史应恢复');
    assertEqual(restoredAfterLoad.routeStates?.hero?.lifecycle, 'locked_in', 'US-021: 读档后路线状态应恢复');

    assert(engine.engineState.currentEvent !== null, 'US-021: 继续阶段应恢复到可推进事件流');

    engine.restartGame();
    const restartedState = engine.getGameState();
    assertEqual(restartedState.player.age, 0, 'US-021: 重开后应回到初始化状态');
    const stillSaved = saveManager.loadGame(saveId);
    assert(stillSaved !== null, 'US-021: 重开后历史存档不应丢失');
    assertEqual(stillSaved?.gameData.flags.us_021_checkpoint, true, 'US-021: 重开后历史存档内容应保持完整');

    const loadedAfterRestart = engine.loadGameFromSave(saveId);
    assert(loadedAfterRestart, 'US-021: 重开后应可继续读取历史存档');
    const restoredAfterRestartLoad = engine.getGameState();
    assertEqual(restoredAfterRestartLoad.flags.route_hero, true, 'US-021: 重开后读档仍应恢复路线字段');
    assertEqual(restoredAfterRestartLoad.identity?.primary, 'hero', 'US-021: 重开后读档仍应恢复身份字段');

    restoredAfterRestartLoad.player.alive = false;
    restoredAfterRestartLoad.ending = {
      id: 'us_021_ending',
      name: '终局回归测试',
    } as any;

    const loadedFromEnding = engine.loadGameFromSave(saveId);
    assert(loadedFromEnding, 'US-021: 结局后应可读取既有存档');
    const restoredFromEnding = engine.getGameState();
    assertEqual(restoredFromEnding.player.alive, true, 'US-021: 结局后读档应恢复为可继续状态');
    assertEqual(restoredFromEnding.currentTime?.year, 27, 'US-021: 结局后读档时间字段应恢复');
    assertEqual(restoredFromEnding.flags.route_hero, true, 'US-021: 结局后读档路线字段应恢复');
    assertEqual(restoredFromEnding.identity?.primary, 'hero', 'US-021: 结局后读档身份字段应恢复');
    assertEqual(restoredFromEnding.player.relationships?.[0]?.name, '赵灵', 'US-021: 结局后读档关系字段应恢复');
    assertEqual(restoredFromEnding.eventHistory?.[0]?.eventId, 'us_021_history_event', 'US-021: 结局后读档事件历史应恢复');
    assert(engine.engineState.currentEvent !== null, 'US-021: 结局后读档应可继续推进流程');
  } finally {
    (gameEngine as any).selectEvent = originalSelectEvent;
    globalThis.requestAnimationFrame = originalRequestAnimationFrame;
    saveManager.clearAllSaves();
    (engine.engineState as any).currentEvent = null;
    (engine.engineState as any).availableChoices = [];
    engine.engineState.lastOutcomeText = null;
    engine.engineState.lastEffects = [];
    (engine.engineState as any).lastChoiceFeedback = null;
  }
}

function createSimulationReportStub(overrides: Partial<import('./GameProcessSimulator').GameProcessReport> = {}): import('./GameProcessSimulator').GameProcessReport {
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
      moneyGrowth: 0,
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
      name: '选择反馈回归 - 手动选择覆盖所有关键反馈字段',
      description: '测试手动选择可稳定产出属性/关系/路线/长期标记反馈',
      test: async () => {
        await runChoiceFeedbackManualCoverageCase();
      },
    },
    {
      name: '选择反馈回归 - autoResolve 覆盖关键字段与兜底文本',
      description: '测试 autoResolve 可稳定产出反馈并在叙事缺失时触发兜底文本',
      test: async () => {
        await runChoiceFeedbackAutoResolveFallbackCase();
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
      name: '复读分类 - 真实受伤事件应识别为 injury',
      description: 'detectEventClasses 应识别 setback_injury 与「意外受伤」等身体受伤语义',
      test: () => {
        const physicalInjury = detectEventClasses({
          id: 'setback_injury',
          category: 'setback',
          content: { title: '意外受伤', description: '练功受伤需要休养' },
        } as any);
        assert(physicalInjury.includes('injury'), 'setback_injury / 意外受伤 应归类为 injury');

        const woundTag = detectEventClasses({
          id: 'custom_wound_event',
          metadata: { tags: ['injury', 'negative'] },
          content: { title: '旧伤复发', description: 'trauma from a past wound' },
        } as any);
        assert(woundTag.includes('injury'), 'injury/wound 标签或英文描述应归类为 injury');
      },
    },
    {
      name: '复读分类 - 情感伤人措辞不得误判为 injury',
      description: 'love_misunderstanding「流言最伤人」及伤心/伤感/伤情不得进入 injury 类',
      test: () => {
        const loveMisunderstanding = detectEventClasses({
          id: 'love_misunderstanding',
          category: 'side_quest',
          content: {
            title: '误会',
            description: '流言最伤人。',
            text: '江湖流言纷纷，你百口莫辩。',
          },
        } as any);
        assert(
          !loveMisunderstanding.includes('injury'),
          'love_misunderstanding 不应因「伤人」被判为 injury'
        );

        const emotionalPhrases = detectEventClasses({
          id: 'love_emotional_stub',
          content: {
            title: '心事',
            description: '令人伤心又伤感，伤情难诉，最伤人者莫过于流言。',
          },
        } as any);
        assert(
          !emotionalPhrases.includes('injury'),
          '伤心/伤感/伤情/伤人 等情感措辞 alone 不应判为 injury'
        );
      },
    },
    {
      name: '复读分类 - 本钱不得误判为 economy',
      description: 'setback_illness「身体是武学的本钱」不应进入 economy；财产损失仍应识别',
      test: () => {
        const illnessWithBenQian = detectEventClasses({
          id: 'setback_illness',
          category: 'setback',
          content: {
            title: '大病一场',
            description: '身体是武学的本钱，生病会影响修炼进度',
          },
          metadata: { tags: ['挫折', '生病', '负面'] },
        } as any);
        assert(illnessWithBenQian.includes('illness'), 'setback_illness 应仍为 illness');
        assert(
          !illnessWithBenQian.includes('economy'),
          '「本钱」不应使 setback_illness 被判为 economy'
        );

        const propertyLoss = detectEventClasses({
          id: 'setback_property_loss',
          category: 'setback',
          content: {
            title: '财产损失',
            description: '财富损失是常见的风险',
          },
          metadata: { tags: ['挫折', '财产', '负面'] },
        } as any);
        assert(propertyLoss.includes('economy'), 'setback_property_loss 应识别为 economy');
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
      name: '选择解析 - resolveFirstChoiceEffects 写入 love_started',
      description: 'resolveFirstChoiceEffects + executeChoiceEffects 应执行 outcome 并设置 love_started',
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
                  id: 'default',
                  condition: { type: 'expression', expression: 'true' },
                  effects: [{ type: EffectType.FLAG_SET, target: 'love_started', value: true }],
                },
              ],
            },
          ],
        } as const;

        const resolved = resolveFirstChoiceEffects(engine, state, loveLikeStub as any);
        assert(resolved !== null, 'resolveFirstChoiceEffects 应解析出首个可用 choice/outcome');
        assert(
          resolved!.effects.some(
            effect => effect.type === EffectType.FLAG_SET && effect.target === 'love_started'
          ),
          '解析结果应包含 love_started 的 flag_set 效果'
        );

        await engine.executeChoiceEffects(
          resolved!.effects,
          loveLikeStub.id,
          resolved!.choiceId
        );

        assertEqual(
          engine.getGameState().flags.love_started,
          true,
          'executeChoiceEffects 后应写入 love_started flag'
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
      name: '路线生命周期 - completion flag 写入 routeStates',
      description: '测试 route_*_completed 会同步为 completed 生命周期',
      test: () => {
        const state = framework.createTestState();
        state.player.age = 30;
        state.player.flags.route_beggars = true;

        const afterStart = RouteStateManager.syncFromFlagSet(state, 'route_beggars', true, 'beggars_join');
        assertEqual(
          RouteStateManager.readRouteState(afterStart, 'beggars').lifecycle,
          'active',
          'route_beggars 应激活 beggars 路线状态'
        );

        const afterComplete = RouteStateManager.syncFromFlagSet(
          afterStart,
          'route_beggars_completed',
          true,
          'beggars_ending'
        );
        assertEqual(
          RouteStateManager.readRouteState(afterComplete, 'beggars').lifecycle,
          'completed',
          'route_beggars_completed 应完成 beggars 路线'
        );
      },
    },
    {
      name: '路线专项样本 - 模拟可推进至 completed',
      description: '测试 routeTrack 样本在固定 seed 下可产生 completed 路线状态',
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
        const hasCompleted = Object.values(finalState?.routeStates || {}).some(
          routeState => routeState.lifecycle === 'completed'
        );

        assert(hasCompleted, '路线专项样本应能将至少一条路线推进至 completed');
      },
    },
    {
      name: '路线候选池 - 活跃路线保底注入',
      description: '测试方案乙：活跃路线事件可注入候选池',
      test: () => {
        const engine = new GameEngineIntegration() as any;
        const state = engine.getGameState();
        state.player.age = 25;
        state.player.flags.route_official = true;
        RouteStateManager.syncFromFlagSet(state, 'route_official', true, 'test');

        const pool = engine.getAvailableEvents(25);
        const hasOfficial = pool.some((event: { id: string }) =>
          event.id === 'official_first_post' ||
          event.id === 'official_love_obstacle' ||
          event.id === 'official_resign'
        );
        assert(hasOfficial, '活跃官府路线应在候选池中有代表事件');
      },
    },
    {
      name: '路线兼容规则 - 强互斥与共存规则可判定',
      description: '测试 hero/demonic 为强互斥，merchant/official 为可共存',
      test: () => {
        const strongConflict = getRouteCompatibilityRule('hero', 'demonic');
        assertEqual(strongConflict.level, 'strong_exclusion', 'hero 与 demonic 应为强互斥');
        assertEqual(strongConflict.resolution, 'block_candidate', '强互斥默认应阻断候选路线');

        const coexist = getRouteCompatibilityRule('merchant', 'official');
        assertEqual(coexist.level, 'coexist', 'merchant 与 official 应可共存');
        assertEqual(coexist.resolution, 'allow_coexist', '共存关系应允许并行');
      },
    },
    {
      name: '路线兼容规则 - 软互斥在锁定前后解析不同',
      description: '测试 soft conflict 在 lockedIn=false 时允许并存，lockedIn=true 时要求转向事件',
      test: () => {
        const unlockedResult = resolveRouteConflict({
          currentMainRoute: 'hero',
          candidateRoute: 'merchant',
          lockedIn: false,
        });
        assertEqual(unlockedResult.level, 'soft_exclusion', 'hero 与 merchant 应识别为软互斥');
        assertEqual(unlockedResult.action, 'allow_coexist', '未锁定主线时软互斥可先并存');

        const lockedResult = resolveRouteConflict({
          currentMainRoute: 'hero',
          candidateRoute: 'merchant',
          lockedIn: true,
        });
        assertEqual(lockedResult.level, 'soft_exclusion', '锁定后仍应识别为软互斥');
        assertEqual(lockedResult.action, 'require_turn_event', '锁定后进入软互斥应要求转向事件');
      },
    },
    {
      name: '路线兼容规则 - 强互斥优先级高于软互斥',
      description: '测试当候选同时命中软互斥和强互斥时，最终动作为 block_candidate',
      test: () => {
        const result = resolveRouteConflict({
          currentMainRoute: 'merchant',
          currentSecondaryRoutes: ['hero'],
          candidateRoute: 'demonic',
          lockedIn: true,
        });

        assertEqual(result.level, 'strong_exclusion', '应按最高冲突级别返回 strong_exclusion');
        assertEqual(result.action, 'block_candidate', '强互斥优先级最高，应直接阻断候选');
        assert(result.conflictWith.includes('hero'), '冲突详情应包含强互斥来源路线');
      },
    },
    {
      name: '路线状态管理 - 统一入口支持读写锁定完成失败',
      description: '测试 RouteStateManager 的 read/write/lock/complete/fail 闭环能力',
      test: () => {
        let state = framework.createTestState();
        const initial = RouteStateManager.readRouteState(state, 'hero');
        assertEqual(initial.lifecycle, 'inactive', '未写入路线时应返回 inactive');

        state = RouteStateManager.writeRouteState(state, {
          routeId: 'hero',
          lifecycle: 'active',
          category: 'main',
          eventId: 'route_open_event',
        });
        assertEqual(RouteStateManager.readRouteState(state, 'hero').lifecycle, 'active', '写入后应可读取 active');

        state = RouteStateManager.lockRoute(state, 'hero', 'route_lock_event');
        assertEqual(RouteStateManager.readRouteState(state, 'hero').lockedIn, true, '锁定后 lockedIn 应为 true');

        state = RouteStateManager.completeRoute(state, 'hero', 'route_complete_event');
        assertEqual(RouteStateManager.readRouteState(state, 'hero').lifecycle, 'completed', '完成后应进入 completed');

        state = RouteStateManager.failRoute(state, 'hero', 'route_fail_event');
        assertEqual(RouteStateManager.readRouteState(state, 'hero').lifecycle, 'failed', '失败后应进入 failed');
      },
    },
    {
      name: '路线状态管理 - 旗标同步不破坏身份与阵营字段',
      description: '测试旗标同步通过统一入口更新路线状态，同时保持 identity/lifePath.faction 不被破坏',
      test: async () => {
        const executor = new EventExecutor();
        const state = framework.createTestState();
        state.identity = {
          identities: ['heroic'],
          primary: 'heroic',
        };
        state.lifePath = {
          primaryIdentity: 'heroic',
          faction: 'orthodox',
          lifeStage: 'development',
          achievements: [],
          relationships: { allies: [], enemies: [], mentors: [], disciples: [] },
          commitments: { cannotJoin: [], mustProtect: [], swornEnemies: [] },
          focus: { martial: 0, business: 0, academic: 0, leadership: 0 },
        };

        const nextState = await executor.executeEffects(
          [{ type: EffectType.FLAG_SET, target: 'sect_faction', value: 'unconventional' }],
          state,
        );

        assertEqual(nextState.identity?.primary, 'heroic', 'identity 字段应保持不变');
        assertEqual(nextState.lifePath?.faction, 'orthodox', 'lifePath.faction 不应被路线状态同步改写');
        assertEqual(RouteStateManager.readRouteState(nextState, 'demonic').lifecycle, 'active', '阵营旗标应同步为 demonic active');
      },
    },
    {
      name: '路线状态管理 - 关键变化写入 route 与 event 历史',
      description: '测试 unified entry 在状态变化时写入 routeHistory 与 eventHistory',
      test: () => {
        let state = framework.createTestState();
        state = RouteStateManager.writeRouteState(state, {
          routeId: 'merchant',
          lifecycle: 'active',
          category: 'main',
          eventId: 'merchant_route_open',
        });
        state = RouteStateManager.lockRoute(state, 'merchant', 'merchant_route_lock');
        state = RouteStateManager.completeRoute(state, 'merchant', 'merchant_route_complete');

        assert((state.routeHistory || []).length >= 3, '关键路线状态变化应写入 routeHistory');
        const historyEventIds = (state.eventHistory || []).map(item => item.eventId);
        assert(historyEventIds.some(eventId => eventId.startsWith('route_state:merchant:')), '关键路线状态变化应写入 eventHistory');
      },
    },
    {
      name: '路线冲突门禁 - 锁定路线下强冲突事件不可触发',
      description: '测试 locked_in 路线会阻断 strong_exclusion 候选路线事件',
      test: () => {
        const engine = new GameEngineIntegration() as any;
        const state = engine.getGameState();
        const originalGetAvailableEvents = engine.getAvailableEvents.bind(engine);
        const originalShouldPauseEventsThisYear = engine.shouldPauseEventsThisYear.bind(engine);
        const originalDailySelector = dailyEventSystem.selectEvent;

        state.player.age = 22;
        state.routeStates = {
          hero: {
            routeId: 'hero',
            lifecycle: 'locked_in',
            category: 'main',
            lockedIn: true,
          },
        };

        const strongConflictEvent = {
          id: 'route_conflict_official_demonic',
          version: '1.0.0',
          category: EventCategory.SIDE_QUEST,
          priority: EventPriority.NORMAL,
          weight: 100,
          ageRange: { min: 20, max: 40 },
          triggers: [],
          content: { title: '强冲突路线事件', text: '尝试转入魔道主线' },
          eventType: 'auto',
          autoEffects: [{ type: EffectType.FLAG_SET, target: 'route_demonic' }],
          metadata: { createdAt: 0, updatedAt: 0, enabled: true, tags: [] },
        } as any;

        const fallbackDailyEvent = {
          id: 'daily_after_strong_conflict_block',
          category: 'daily_event',
          priority: EventPriority.LOW,
          content: { title: '日常补位', text: '冲突后未触发正式事件' },
          metadata: { tags: ['daily_pool'] },
        };

        try {
          engine.getAvailableEvents = () => [strongConflictEvent];
          engine.shouldPauseEventsThisYear = () => false;
          (dailyEventSystem as any).selectEvent = () => fallbackDailyEvent;
          const selected = engine.selectEvent(22);
          assertEqual(selected?.id, 'daily_after_strong_conflict_block', '强冲突路线事件应被阻断并回退 daily');
        } finally {
          engine.getAvailableEvents = originalGetAvailableEvents;
          engine.shouldPauseEventsThisYear = originalShouldPauseEventsThisYear;
          (dailyEventSystem as any).selectEvent = originalDailySelector;
        }
      },
    },
    {
      name: '路线冲突门禁 - 软冲突仅允许显式 turn 事件',
      description: '测试 locked_in 软冲突路线转入必须通过显式 turn 事件',
      test: () => {
        const engine = new GameEngineIntegration() as any;
        const state = engine.getGameState();
        const originalGetAvailableEvents = engine.getAvailableEvents.bind(engine);
        const originalShouldPauseEventsThisYear = engine.shouldPauseEventsThisYear.bind(engine);
        const originalDailySelector = dailyEventSystem.selectEvent;

        state.player.age = 28;
        state.routeStates = {
          hero: {
            routeId: 'hero',
            lifecycle: 'locked_in',
            category: 'main',
            lockedIn: true,
          },
        };

        const softConflictNoTurn = {
          id: 'route_soft_conflict_without_turn',
          version: '1.0.0',
          category: EventCategory.SIDE_QUEST,
          priority: EventPriority.NORMAL,
          weight: 100,
          ageRange: { min: 20, max: 40 },
          triggers: [],
          content: { title: '软冲突未转向', text: '尝试进入商道但未触发转向' },
          eventType: 'auto',
          autoEffects: [{ type: EffectType.FLAG_SET, target: 'route_merchant' }],
          metadata: { createdAt: 0, updatedAt: 0, enabled: true, tags: [] },
        } as any;

        const softConflictWithTurn = {
          ...softConflictNoTurn,
          id: 'route_soft_conflict_with_turn',
          metadata: {
            createdAt: 0,
            updatedAt: 0,
            enabled: true,
            tags: ['route_turn'],
            routeTransition: 'turn',
          },
        } as any;

        const fallbackDailyEvent = {
          id: 'daily_after_soft_conflict_block',
          category: 'daily_event',
          priority: EventPriority.LOW,
          content: { title: '日常补位', text: '等待显式转向事件' },
          metadata: { tags: ['daily_pool'] },
        };

        try {
          (dailyEventSystem as any).selectEvent = () => fallbackDailyEvent;
          engine.shouldPauseEventsThisYear = () => false;

          engine.getAvailableEvents = () => [softConflictNoTurn];
          const blockedSelection = engine.selectEvent(28);
          assertEqual(blockedSelection?.id, 'daily_after_soft_conflict_block', '无 turn 标记的软冲突事件应被阻断');

          engine.getAvailableEvents = () => [softConflictWithTurn];
          const turnSelection = engine.selectEvent(28);
          assertEqual(turnSelection?.id, 'route_soft_conflict_with_turn', '显式 turn 事件应允许通过软冲突门禁');
        } finally {
          engine.getAvailableEvents = originalGetAvailableEvents;
          engine.shouldPauseEventsThisYear = originalShouldPauseEventsThisYear;
          (dailyEventSystem as any).selectEvent = originalDailySelector;
        }
      },
    },
    {
      name: '路线进展回归 - 启动推进锁定冲突阻断完成与断裂',
      description: '测试 hero 与 merchant 两条路线覆盖 start/progress/lock-in/conflict/completion/failure 链路',
      test: () => {
        let state = framework.createTestState();
        state.player.age = 26;

        // hero 主线：start -> progress -> lock-in -> completion
        state = RouteStateManager.writeRouteState(state, {
          routeId: 'hero',
          lifecycle: 'temporary',
          category: 'main',
          eventId: 'hero_route_start',
        });
        state = RouteStateManager.writeRouteState(state, {
          routeId: 'hero',
          lifecycle: 'active',
          category: 'main',
          eventId: 'hero_route_progress',
        });
        state = RouteStateManager.lockRoute(state, 'hero', 'hero_route_lock');
        state = RouteStateManager.completeRoute(state, 'hero', 'hero_route_complete');

        assertEqual(RouteStateManager.readRouteState(state, 'hero').lifecycle, 'completed', 'hero 路线应完成');
        assertEqual(RouteStateManager.readRouteState(state, 'hero').lockedIn, true, 'hero 完成后应保持锁定');

        // merchant 次路线：start -> progress -> failure(=breakage)
        state = RouteStateManager.writeRouteState(state, {
          routeId: 'merchant',
          lifecycle: 'temporary',
          category: 'secondary',
          eventId: 'merchant_route_start',
        });
        state = RouteStateManager.writeRouteState(state, {
          routeId: 'merchant',
          lifecycle: 'active',
          category: 'secondary',
          eventId: 'merchant_route_progress',
        });
        state = RouteStateManager.failRoute(state, 'merchant', 'merchant_route_breakage', 'route_breakage');

        assertEqual(RouteStateManager.readRouteState(state, 'merchant').lifecycle, 'failed', 'merchant 路线应进入失败/断裂');
        assertEqual(
          RouteStateManager.readRouteState(state, 'merchant').reason,
          'route_breakage',
          'merchant 失败应记录断裂原因',
        );

        const engine = new GameEngineIntegration() as any;
        const engineState = engine.getGameState();
        engineState.player.age = 26;
        engineState.routeStates = {
          hero: {
            routeId: 'hero',
            lifecycle: 'locked_in',
            category: 'main',
            lockedIn: true,
          },
        };

        const originalGetAvailableEvents = engine.getAvailableEvents.bind(engine);
        const originalShouldPauseEventsThisYear = engine.shouldPauseEventsThisYear.bind(engine);
        const originalDailySelector = dailyEventSystem.selectEvent;
        const strongConflictEvent = {
          id: 'hero_locked_conflict_demonic',
          version: '1.0.0',
          category: EventCategory.SIDE_QUEST,
          priority: EventPriority.NORMAL,
          weight: 100,
          ageRange: { min: 20, max: 40 },
          triggers: [],
          content: { title: '冲突事件', text: '试图转入魔道路线' },
          eventType: 'auto',
          autoEffects: [{ type: EffectType.FLAG_SET, target: 'route_demonic' }],
          metadata: { createdAt: 0, updatedAt: 0, enabled: true, tags: [] },
        } as any;
        const fallbackDailyEvent = {
          id: 'daily_after_route_conflict_block',
          category: 'daily_event',
          priority: EventPriority.LOW,
          content: { title: '日常补位', text: '冲突被阻断后触发日常' },
          metadata: { tags: ['daily_pool'] },
        };

        try {
          engine.getAvailableEvents = () => [strongConflictEvent];
          engine.shouldPauseEventsThisYear = () => false;
          (dailyEventSystem as any).selectEvent = () => fallbackDailyEvent;
          const selected = engine.selectEvent(26);
          assertEqual(selected?.id, 'daily_after_route_conflict_block', '锁定 hero 后强冲突路线应被阻断');
        } finally {
          engine.getAvailableEvents = originalGetAvailableEvents;
          engine.shouldPauseEventsThisYear = originalShouldPauseEventsThisYear;
          (dailyEventSystem as any).selectEvent = originalDailySelector;
        }

        const routeTransitionIds = (state.routeHistory || [])
          .filter(item => item.routeId === 'hero' || item.routeId === 'merchant')
          .map(item => `${item.routeId}:${item.from}->${item.to}`);
        assert(routeTransitionIds.includes('hero:inactive->temporary'), '应记录 hero start 历史');
        assert(routeTransitionIds.includes('hero:temporary->active'), '应记录 hero progress 历史');
        assert(routeTransitionIds.includes('hero:active->completed'), '应记录 hero completion 历史');
        assert(routeTransitionIds.includes('merchant:inactive->temporary'), '应记录 merchant start 历史');
        assert(routeTransitionIds.includes('merchant:temporary->active'), '应记录 merchant progress 历史');
        assert(routeTransitionIds.includes('merchant:active->failed'), '应记录 merchant failure/breakage 历史');
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
            moneyGrowth: 0,
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
      name: '体验健康门禁 - route_load_parity 与复读指标可计算',
      description: '测试包 D 衍生指标与加载一致性门禁',
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
        assertEqual(derived.route_load_parity, 1, 'events.json 应与 EventLoader 一致');
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
      description: '测试 route_breakage_rate / route_load_parity 不可 waiver',
      test: () => {
        let thrown = false;
        try {
          validateExperienceWaivers([
            { metricKey: 'route_breakage_rate', reason: 'short' },
          ]);
        } catch (error) {
          thrown = String(error).includes('at least 10 characters');
        }
        assert(thrown, '过短 waiver 原因应被拒绝');

        let thrownNonWaivable = false;
        try {
          validateExperienceWaivers([
            {
              metricKey: 'route_load_parity',
              reason: 'EG-DEV-attempt-bypass-load-parity-check',
            },
          ]);
        } catch (error) {
          thrownNonWaivable = String(error).includes('cannot be waived');
        }
        assert(thrownNonWaivable, 'route_load_parity 不可 waiver');
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
            moneyGrowth: 0,
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
      name: '状态一致性回归 - 新开局/选择/结局/重开/存档链路',
      description: '测试主状态源与 UI 状态在关键流程保持一致，失败应直接暴露同步问题',
      test: async () => {
        await runStateConsistencyRegressionCase();
      },
    },
    {
      name: '主流程存读档回归 - 保存加载后可连续推进',
      description: '测试主流程可保存当前状态并在加载后恢复关键状态且继续推进',
      test: async () => {
        await runMainFlowSaveLoadCase();
      },
    },
    {
      name: '存档行为回归 - 重开/继续/结局后读档可预测',
      description: '测试重开不污染存档、读档后继续正确、结局后可读档恢复主流程',
      test: async () => {
        await runRestartContinueEndingSaveBehaviorCase();
      },
    },
    {
      name: 'US-021 存档回归 - 保存/读档/继续/重开/结局后读档全覆盖',
      description: '测试关键存档流程与 route/identity/relationship/event history/time 字段恢复完整性',
      test: async () => {
        await runSaveRegressionCoverageCase();
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
    {
      name: '兼容性测试 - P2 存档版本标记写入',
      description: '测试 saveGame 会写入 P2 schema marker，避免后续版本静默混读',
      test: () => {
        saveManager.clearAllSaves();
        const state = framework.createTestState();
        const saveId = saveManager.saveGame(state, 'us-018-version-marker');
        const loaded = saveManager.loadGame(saveId);
        assert(loaded !== null, '当前版本存档应可正常读取');
        assertEqual(
          loaded!.gameData.saveVersion,
          P2_SAVE_SCHEMA_VERSION,
          '存档应写入统一 P2 saveVersion 标记',
        );
      },
    },
    {
      name: '兼容性测试 - P2 可读版本边界',
      description: '测试 legacy/future 不支持版本会被拒绝，历史全量迁移不在 P2 范围',
      test: () => {
        const missingVersion = evaluateSaveCompatibility(undefined);
        assertEqual(missingVersion.supported, false, '缺失版本号的存档应拒绝加载');
        assertEqual(missingVersion.status, 'unsupported_missing_version', '缺失版本应返回明确状态');

        const legacyVersion = evaluateSaveCompatibility('0.9.0');
        assertEqual(legacyVersion.supported, false, '过旧 legacy 版本应拒绝加载');
        assertEqual(legacyVersion.status, 'unsupported_legacy_version', 'legacy 版本应返回明确状态');

        const futureVersion = evaluateSaveCompatibility('3.0.0');
        assertEqual(futureVersion.supported, false, '未来版本应拒绝加载');
        assertEqual(futureVersion.status, 'unsupported_future_version', 'future 版本应返回明确状态');

        const readableLegacy = evaluateSaveCompatibility('1.0.0');
        assertEqual(readableLegacy.supported, true, '定义范围内的可读 legacy 版本应允许加载');
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
