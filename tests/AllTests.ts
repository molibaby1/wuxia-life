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
import {
  buildDeathRiskTelemetry,
  inferSimulationCohort,
  resolveDeathLifePhase,
  summarizeTopDeathCauses,
} from '../scripts/deathRiskTelemetry';
import {
  GOLDEN_LINE_SAMPLES,
  GOLDEN_ROMANCE_FAMILY_SAMPLE,
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
import {
  ARC_RF_MINGYUE_ID,
  buildRomanceFamilyArcReport,
  GOLDEN_ROMANCE_FAMILY_SAMPLE_ID,
  resolveRomanceArcOutcome,
} from '../scripts/romanceFamilyArcTelemetry';

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
    assert(
      engine.engineState.lastChoiceFeedback?.player.narrativeResult === '用于验证选择后引擎状态与 UI 状态一致',
      '选择结算反馈未保留到 UI 状态',
    );
    assert(
      engine.engineState.progressionOverlay?.cards[0]?.title === '上一阶段' &&
        engine.engineState.progressionOverlay.cards[0]?.metaLines?.includes(
          '选择：执行状态同步回归选择',
        ) === true,
      '结果区应保留已完成阶段与选择上下文',
    );
    assert(
      engine.engineState.progressionOverlay?.cards[0]?.body === undefined,
      '结果区不应重复刚刚读过的选项描述',
    );
    assert(
      engine.getGameState().flags.state_consistency_choice_done === true,
      '选择后引擎 flags 未更新，存在状态不同步风险',
    );

    const saveId = saveManager.saveGame(engine.getGameState(), 'US-015-state-consistency');
    const loadedSave = saveManager.loadGame(saveId);
    assert(loadedSave !== null, '保存后无法读取存档，状态持久化链路异常');
    assert(
      defaultSnapshotConverter.fromSnapshot(loadedSave!.snapshot).flags.state_consistency_choice_done === true,
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
    runtimeState.eventHistory = [];
    runtimeState.ending = null;

    const loaded = engine.loadGameFromSave(saveId);
    assert(loaded, '主流程应可加载刚保存的存档');

    const restored = engine.getGameState();
    assertEqual(restored.player.name, 'SaveLoadHero', '读档后玩家信息应恢复');
    assertEqual(restored.currentTime?.year, 33, '读档后时间应恢复');
    assert((restored.eventHistory || []).length > 0, '读档后事件历史应恢复');
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
    assertEqual(defaultSnapshotConverter.fromSnapshot(savedAfterRestart!.snapshot).flags.us_020_checkpoint, true, '重开后旧存档内容应保持不变');

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
    state.eventHistory = [
      {
        eventId: 'us_021_history_event',
        age: state.player.age,
        triggeredAt: state.currentTime.year,
      },
    ];
    state.player.affiliation = 'wudang';
    state.player.title = '江湖义士';
    state.lifePath = {
      faction: 'orthodox',
      lifeStage: 'development',
      achievements: [],
      relationships: { allies: [], enemies: [], mentors: [], disciples: [] },
      commitments: { cannotJoin: [], mustProtect: [], swornEnemies: [] },
    } as any;

    const saveId = engine.saveCurrentGame('US-021-regression');
    assert(saveId.length > 0, 'US-021: 保存阶段应生成有效 saveId');

    state.currentTime.year = 99;
    state.flags.route_hero = false;
    state.flags.us_021_checkpoint = false;
    state.player.flags.route_hero = false;
    state.player.relationships = [];
    state.eventHistory = [];
    state.lifePath = undefined;

    const loaded = engine.loadGameFromSave(saveId);
    assert(loaded, 'US-021: 读档阶段应成功恢复存档');
    const restoredAfterLoad = engine.getGameState();
    assertEqual(restoredAfterLoad.currentTime?.year, 27, 'US-021: 读档后时间字段应恢复');
    assertEqual(restoredAfterLoad.flags.route_hero, true, 'US-021: 读档后路线字段应恢复');
    assertEqual(restoredAfterLoad.flags.us_021_checkpoint, true, 'US-021: 读档后关键 checkpoint 应恢复');
    assertEqual(restoredAfterLoad.player.affiliation, 'wudang', 'US-021: 读档后所属字段应恢复');
    assertEqual(restoredAfterLoad.player.title, '江湖义士', 'US-021: 读档后称号字段应恢复');
    assertEqual(restoredAfterLoad.player.relationships?.[0]?.name, '赵灵', 'US-021: 读档后关系字段应恢复');
    assertEqual(restoredAfterLoad.eventHistory?.[0]?.eventId, 'us_021_history_event', 'US-021: 读档后事件历史应恢复');

    assert(engine.engineState.currentEvent !== null, 'US-021: 继续阶段应恢复到可推进事件流');

    engine.restartGame();
    const restartedState = engine.getGameState();
    assertEqual(restartedState.player.age, 0, 'US-021: 重开后应回到初始化状态');
    const stillSaved = saveManager.loadGame(saveId);
    assert(stillSaved !== null, 'US-021: 重开后历史存档不应丢失');
    assertEqual(defaultSnapshotConverter.fromSnapshot(stillSaved!.snapshot).flags.us_021_checkpoint, true, 'US-021: 重开后历史存档内容应保持完整');

    const loadedAfterRestart = engine.loadGameFromSave(saveId);
    assert(loadedAfterRestart, 'US-021: 重开后应可继续读取历史存档');
    const restoredAfterRestartLoad = engine.getGameState();
    assertEqual(restoredAfterRestartLoad.flags.route_hero, true, 'US-021: 重开后读档仍应恢复路线字段');
    assertEqual(restoredAfterRestartLoad.player.affiliation, 'wudang', 'US-021: 重开后读档仍应恢复所属字段');

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
    assertEqual(restoredFromEnding.player.affiliation, 'wudang', 'US-021: 结局后读档所属字段应恢复');
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
      name: 'P3 US-010 - romance arc 终态分类',
      description: 'arc_outcome 应区分 completed / separated / skipped / failed',
      test: () => {
        const completed = createSimulationReportStub({
          finalAge: 50,
          isAlive: true,
          statistics: { spouse: '明月', children: 1 } as import('../src/types/simulationRecordTypes').GameProcessReport['statistics'],
          records: [
            {
              age: 18,
              eventId: 'love_first_meet',
              eventTitle: '初见',
              eventType: 'choice',
              selectedChoice: { id: 'love_greet', text: '搭话', effects: [] },
              gameState: {
                ...framework.createTestState(),
                player: {
                  ...framework.createTestState().player,
                  flags: {
                    love_started: true,
                    married: true,
                    spouse_mingyue: true,
                  },
                },
              },
              timestamp: new Date().toISOString(),
            },
          ],
        });
        assertEqual(
          resolveRomanceArcOutcome(completed, 50),
          'completed',
          '有 spouse/children 且存活至 50 应为 completed',
        );

        const separated = createSimulationReportStub({
          finalAge: 50,
          isAlive: true,
          records: [
            {
              age: 20,
              eventId: 'love_separation',
              eventTitle: '分离',
              eventType: 'auto',
              gameState: {
                ...framework.createTestState(),
                player: {
                  ...framework.createTestState().player,
                  flags: { love_started: true, love_separation: true },
                },
              },
              timestamp: new Date().toISOString(),
            },
          ],
        });
        assertEqual(resolveRomanceArcOutcome(separated, 50), 'separated', '分离 flag 应为 separated');

        const skipped = createSimulationReportStub({
          finalAge: 50,
          isAlive: true,
          records: [
            {
              age: 10,
              eventId: 'daily',
              eventTitle: '日常',
              eventType: 'auto',
              gameState: framework.createTestState(),
              timestamp: new Date().toISOString(),
            },
          ],
        });
        assertEqual(resolveRomanceArcOutcome(skipped, 50), 'skipped', '未开启 love_started 应为 skipped');
      },
    },
    {
      name: 'P3 US-010 - experience gate 暴露 P3-RF 指标',
      description: 'romance_family_primary_sample_pass 应出现在 gate 输出',
      test: () => {
        const passReport = createSimulationReportStub({
          finalAge: 50,
          isAlive: true,
          statistics: {
            spouse: '明月',
            children: 1,
          } as import('../src/types/simulationRecordTypes').GameProcessReport['statistics'],
          records: [
            {
              age: 22,
              eventId: 'family_marriage',
              eventTitle: '成家',
              eventType: 'choice',
              selectedChoice: { id: 'marry_mingyue', text: '迎娶明月', effects: [] },
              gameState: {
                ...framework.createTestState(),
                player: {
                  ...framework.createTestState().player,
                  flags: { love_started: true, married: true, spouse_mingyue: true },
                },
              },
              timestamp: new Date().toISOString(),
            },
          ],
        });
        const gate = evaluateExperienceHealthGate([], [], [
          { sampleId: GOLDEN_ROMANCE_FAMILY_SAMPLE_ID, report: passReport },
        ]);
        const metric = gate.blockingMetrics.find(m => m.key === 'romance_family_primary_sample_pass');
        assert(metric, '应包含 romance_family_primary_sample_pass');
        assertEqual(metric?.severity, 'blocker', 'US-029 应为 blocker');
        assertEqual(metric?.status, 'pass', 'completed arc 应 pass');
        assertEqual(gate.p3RomanceFamily?.primaryArcReport?.arcId, ARC_RF_MINGYUE_ID, 'arc_id 应对齐');
        assertEqual(gate.p3RomanceFamily?.primaryArcReport?.arcOutcome, 'completed', 'arc_outcome 应为 completed');
      },
    },
    {
      name: 'P3 US-014 - payoff gate 区分 static 与 simulated',
      description: '静态 map 全绿时 priority-route 仿真缺口应为 blocker',
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
        assertEqual(evaluation.summary.staticPayoffRate, 1, '静态 map 应为 100%');
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
        const blocker = evaluation.findings.find(
          finding =>
            finding.sampleId === 'golden-sect' &&
            finding.severity === 'blocker' &&
            finding.status === 'fail',
        );
        assert(blocker, 'priority-route 仿真不足应为 blocker');
      },
    },
    {
      name: 'P3 US-029 - neutral 仿真 payoff 为 blocker',
      description: 'golden-neutral-baseline 仿真不足在 US-029 应为 blocker',
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
        const blocker = evaluation.findings.find(
          finding =>
            finding.sampleId === 'golden-neutral-baseline' &&
            finding.severity === 'blocker' &&
            finding.status === 'fail',
        );
        assert(blocker, 'neutral 样本仿真不足应为 blocker');
      },
    },
    {
      name: 'P3 US-029 - P3-EVAL romance 聚合阈值',
      description: 'p3_romance_family_achievement_rate < 0.20 应 fail',
      test: () => {
        const stub = (achieved: boolean) =>
          createSimulationReportStub({
            finalAge: 50,
            isAlive: true,
            statistics: achieved
              ? ({ spouse: 'x', children: 0 } as import('../src/types/simulationRecordTypes').GameProcessReport['statistics'])
              : ({} as import('../src/types/simulationRecordTypes').GameProcessReport['statistics']),
          });
        const lowRateEntries = Array.from({ length: 5 }, (_, index) => ({
          sampleId: `sample-${index}`,
          report: stub(false),
        }));
        const lowGate = evaluateExperienceHealthGate([], [], lowRateEntries);
        const lowMetric = lowGate.blockingMetrics.find(
          m => m.key === 'p3_romance_family_achievement_rate',
        );
        assert(lowMetric, '应有 P3 romance 聚合指标');
        assertEqual(lowMetric?.status, 'fail', '0% 应 fail');

        const passEntries = [
          { sampleId: 'a', report: stub(true) },
          ...Array.from({ length: 4 }, (_, index) => ({
            sampleId: `b-${index}`,
            report: stub(false),
          })),
        ];
        const passGate = evaluateExperienceHealthGate([], [], passEntries);
        const passMetric = passGate.blockingMetrics.find(
          m => m.key === 'p3_romance_family_achievement_rate',
        );
        assertEqual(passMetric?.status, 'pass', '20% 应 pass');
      },
    },
    {
      name: 'P3 US-014 - golden line gate 集成 payoff 阻断',
      description: '仿真 payoff blocker 应使 evaluateGoldenLineGates 失败',
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
        assertEqual(gate.pass, false, '仿真 payoff 未达标时 gate 应 fail');
        assert(
          gate.payoffEvaluation.summary.staticPayoffRate >= 0.7,
          '静态 map 仍应通过阈值',
        );
        assert(
          gate.findings.some(
            finding => finding.gate === 'payoff' && finding.severity === 'blocker',
          ),
          '应含 payoff blocker finding',
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
        assert(m.relationshipState !== undefined, 'midlife relationshipState');
        assert(m.deathStatus !== undefined, 'midlife deathStatus');
        assert(m.payoffStatus !== undefined, 'midlife payoffStatus');
        assert(typeof m.payoffStatus.simulatedPayoffRate === 'number', 'payoff rate');
      },
    },
    {
      name: 'P3 US-017 - P3-EVAL 队列分段报告',
      description: 'P3-EVAL 全样本应产出 youth/midlife 双分段指标',
      test: async () => {
        assertEqual(P3_EVAL_SAMPLES.length, 5, 'P3-EVAL 应为 5 个样本');
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
      name: 'P3 US-010 - golden-romance-family 0–50 回归样本',
      description: 'P3-RF 样本应存活至 50 并完成 arc_rf_mingyue',
      test: async () => {
        const run = await runP3EvalSimulation(GOLDEN_ROMANCE_FAMILY_SAMPLE);
        const arc = run.report.romanceFamilyArcReport;
        assert(arc, '报告应包含 romanceFamilyArcReport');
        assertEqual(run.report.finalAge, 50, '应跑至 50 岁');
        assertEqual(run.report.isAlive, true, '情感线样本应存活');
        assertEqual(arc.arcOutcome, 'completed', `arc 应 completed，实际=${arc.arcOutcome}`);
        assert(arc.achievement, '应达成 romance/family achievement');
        assert(arc.primarySamplePass, 'primarySamplePass 应为 true');
        assert(
          arc.keyChoices.find(kc => kc.id === 'KC-1')?.triggered,
          'KC-1 love_first_meet 应触发',
        );
        assert(
          arc.keyChoices.find(kc => kc.id === 'KC-3')?.choiceId === 'marry_mingyue',
          'KC-3 应选迎娶明月',
        );
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
      description: '测试 saveGame 只写入 Canonical Snapshot 3.15.0',
      test: () => {
        saveManager.clearAllSaves();
        const state = new GameEngineIntegration().getGameState();
        const saveId = saveManager.saveGame(state, 'us-018-version-marker');
        const loaded = saveManager.loadGame(saveId);
        assert(loaded !== null, '当前版本存档应可正常读取');
        assertEqual(loaded!.snapshot.metadata.schemaVersion, '3.15.0', '存档应写入 Canonical Snapshot 3.15.0');
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
