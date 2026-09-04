/**
 * 新版游戏引擎 Composable - 集成事件系统
 * 
 * 功能：
 * - 使用 EventLoader 加载事件
 * - 使用 GameEngineIntegration 管理游戏状态
 * - 支持自动事件和选择事件
 * - 提供 Vue 响应式接口
 */

import { reactive, ref, computed } from 'vue';
import { gameEngine } from '../core/GameEngineIntegration';
import { saveManager } from '../core/SaveManager';
import { defaultSnapshotConverter } from '../headless/snapshot/SnapshotConverter';
import { generateChoiceFeedback } from '../core/ChoiceFeedbackGenerator';
import { cloneCanonicalGameState } from '../contracts/validation/canonicalGameStateValidation';
import { eventLoader } from '../core/EventLoader';
import type { EventDefinition, Effect } from '../types/eventTypes';
import type { StoryChoice, ChoiceOutcomeUI } from '../types';
import type { ChoiceFeedbackModel } from '../types';
import type {
  ActiveActionSummaryDisplay,
  DisturbanceNarrativeDisplay,
  PassiveNarrativeDisplay,
  PeriodSummaryDisplay,
} from '../types/activeActionTypes';
import { applyStatDeltas } from '../core/activePlanning/ActivePlanningService';
import { clampPassiveStatDeltasForAge } from '../core/activePlanning/ageActionStatCaps';
import { buildPeriodSummary } from '../core/activePlanning/periodSummaryBuilder';
import {
  commitAnnualPassiveMemory,
  isAnnualPassiveMemoryAge,
  prepareAnnualPassiveMemory,
  type AnnualPassiveMemoryPlan,
} from '../core/activePlanning/annualPassiveMemory';
import { selectPassiveNarrative, shouldRecordPassiveNarrativeInHistory } from '../data/infantPassiveNarratives';
import { applyPassiveNarrativeFlags } from '../data/originInfantPassiveChain';
import { shouldOfferDailyPlanning, shouldPreferStoryGapPassiveBeforePlanning } from '../p16/childhoodAgency';
import { markDisturbanceNarrativeShown } from '../core/activePlanning/disturbanceNarrativeBuilder';
import {
  buildActiveActionOverlayCard,
  buildAutomaticStageOverlayCards,
  buildChoiceFeedbackOverlayCard,
  buildPeriodSummaryOverlayCard,
  buildPlayerDeltaOverlayCard,
  buildStageResultOverlayCard,
  type ProgressionOverlayCard,
  type ProgressionOverlayPayload,
} from '../types/progressionOverlay';

interface EventState {
  currentEvent: EventDefinition | null;
  availableChoices: StoryChoice[];
  availableActiveActions: Array<{
    id: string;
    text: string;
    description: string;
    actionId: string;
    rewardSummary: string;
    costSummary: string;
    riskLevel: string;
  }>;
  isActiveActionMode: boolean;
  isAutoPlaying: boolean;
  lastEffects: Effect[];
  lastOutcomeText: string | null;
  lastChoiceFeedback: ChoiceFeedbackModel | null;
  lastActiveActionSummary: ActiveActionSummaryDisplay | null;
  pendingDisturbanceNarrative: DisturbanceNarrativeDisplay | null;
  showingDisturbanceNarrative: boolean;
  isPassiveProgressionMode: boolean;
  passiveNarrative: PassiveNarrativeDisplay | null;
  annualPassiveMemory: AnnualPassiveMemoryPlan | null;
  pendingPeriodSummary: PeriodSummaryDisplay | null;
  storyGapPassiveServed: boolean;
  progressionOverlay: ProgressionOverlayPayload | null;
  pendingStageResult: ProgressionOverlayCard[] | null;
}

// 单例状态
let engineStateInstance: {
  state: EventState;
  isProcessing: boolean;
} | null = null;

function getEngineStateInstance() {
  if (!engineStateInstance) {
    engineStateInstance = {
      state: reactive<EventState>({
        currentEvent: null,
        availableChoices: [],
        availableActiveActions: [],
        isActiveActionMode: false,
        isAutoPlaying: false,
        lastEffects: [],
        lastOutcomeText: null,
        lastChoiceFeedback: null,
        lastActiveActionSummary: null,
        pendingDisturbanceNarrative: null,
        showingDisturbanceNarrative: false,
        isPassiveProgressionMode: false,
        passiveNarrative: null,
        annualPassiveMemory: null,
        pendingPeriodSummary: null,
        storyGapPassiveServed: false,
        progressionOverlay: null,
        pendingStageResult: null,
      }),
      isProcessing: false,
    };
  }
  return engineStateInstance;
}

export function useNewGameEngine() {
  const instance = getEngineStateInstance();
  const engineState = instance.state;
  const isProcessing = ref(instance.isProcessing);
  // 不要在这里重置 lastOutcomeText，否则 UI 会看不到

  /**
   * 获取下一个事件
   */
  const getNextEvent = () => {
    if (isProcessing.value) return;

    const gameState = gameEngine.getGameState();
    const age = gameState.player?.age || 0;

    // 选择一个事件
    const selectedEvent =
      isAnnualPassiveMemoryAge(age) && gameState.flags?.origin_id
        ? null
        : gameEngine.selectEvent(age);

    if (selectedEvent) {
      engineState.storyGapPassiveServed = false;
      engineState.isActiveActionMode = false;
      engineState.availableActiveActions = [];
      engineState.currentEvent = selectedEvent;
      engineState.lastEffects = [];

      // 如果是自动事件，自动执行
      if (selectedEvent.eventType === 'auto' || selectedEvent.eventType === 'ending') {
        engineState.availableChoices = [];
        processAutoEvent(selectedEvent);
      } else if (selectedEvent.eventType === 'choice' && selectedEvent.choices) {
        if (selectedEvent.metadata?.autoResolve) {
          const availableChoices = selectedEvent.choices.filter(choice =>
            gameEngine.isChoiceAvailable(choice.condition)
          );
          if (availableChoices.length === 0) {
            console.warn('[NewGameEngine] 自动判定事件无可用选项:', selectedEvent.id);
            getNextEvent();
            return;
          }
          const autoChoice = pickAutoChoice(availableChoices, gameEngine.getGameState(), selectedEvent.id);
          void handleChoice(autoChoice, { source: 'autoResolve', eventId: selectedEvent.id }).then(success => {
            if (!success) {
              console.warn('[NewGameEngine] 自动判定执行失败，跳过当前事件:', selectedEvent.id);
              getNextEvent();
            }
          });
          return;
        }
        // 如果是选择事件，准备选择项
        engineState.availableChoices = selectedEvent.choices.map(choice => {
          const explanation = choice.condition
            ? gameEngine.explainChoice(choice.id, choice.condition)
            : null;
          return {
            id: choice.id,
            text: choice.text,
            description: choice.description,
            outcomes: choice.outcomes as any,
            requirements: choice.requirements,
            condition: choice.condition,
            locked: explanation ? !explanation.available : false,
            lockReason: explanation?.summary,
            rewardSummary: choice.metadata?.rewardSummary,
            costSummary: choice.metadata?.costSummary,
            riskLevel: choice.metadata?.riskLevel,
          };
        }) as any;
      }
    } else {
      const actions = gameEngine.getAvailableActiveActions();
      const preferPassive = shouldPreferStoryGapPassiveBeforePlanning(
        age,
        engineState.storyGapPassiveServed,
      );
      if (preferPassive) {
        engineState.currentEvent = null;
        engineState.availableChoices = [];
        engineState.availableActiveActions = [];
        engineState.isActiveActionMode = false;
        engineState.isPassiveProgressionMode = true;
        if (isAnnualPassiveMemoryAge(age)) {
          const annual = prepareAnnualPassiveMemory(gameEngine.getGameState());
          engineState.annualPassiveMemory = annual;
          engineState.passiveNarrative = { title: annual.headline, text: annual.body };
        } else {
          const entry = selectPassiveNarrative(gameEngine.getGameState());
          engineState.annualPassiveMemory = null;
          engineState.passiveNarrative = { title: entry.title, text: entry.text };
        }
        return;
      }
      if (actions.length > 0) {
        engineState.currentEvent = null;
        engineState.availableChoices = [];
        engineState.availableActiveActions = actions;
        engineState.isActiveActionMode = true;
        engineState.isPassiveProgressionMode = false;
        engineState.passiveNarrative = null;
        engineState.annualPassiveMemory = null;
      } else {
        const fallbackAge = gameEngine.getGameState().player?.age ?? 0;
        if (!shouldOfferDailyPlanning(fallbackAge)) {
          engineState.currentEvent = null;
          engineState.availableChoices = [];
          engineState.availableActiveActions = [];
          engineState.isActiveActionMode = false;
          engineState.isPassiveProgressionMode = true;
          if (isAnnualPassiveMemoryAge(age)) {
            const annual = prepareAnnualPassiveMemory(gameEngine.getGameState());
            engineState.annualPassiveMemory = annual;
            engineState.passiveNarrative = { title: annual.headline, text: annual.body };
          } else {
            const entry = selectPassiveNarrative(gameEngine.getGameState());
            engineState.annualPassiveMemory = null;
            engineState.passiveNarrative = { title: entry.title, text: entry.text };
          }
          return;
        }
        gameEngine.advanceTime(3, 'month');
        getNextEvent();
      }
    }
  };

  /**
   * 处理自动事件
   */
  const processAutoEvent = async (event: EventDefinition) => {
    if (!event.autoEffects || event.autoEffects.length === 0) {
      engineState.pendingStageResult = [buildStageResultOverlayCard(
        `event-${event.id}`,
        event.content?.title || '上一阶段',
      )];
      isProcessing.value = false;
      return;
    }

    engineState.isAutoPlaying = true;
    isProcessing.value = true;
    const playerBeforeEvent = { ...gameEngine.getGameState().player };

    try {
      // 执行事件效果
      const execution = await gameEngine.executeAutoEvent(event);
      engineState.lastEffects = event.autoEffects;
      engineState.pendingStageResult = buildAutomaticStageOverlayCards(execution.stageResults);

      // 检查是否是结局事件
      if (event.eventType === 'ending') {
        console.log(`🎉 游戏结束 - 结局：${event.content.title}`);
        engineState.isAutoPlaying = false;
        isProcessing.value = false;
        return;
      }

      engineState.isAutoPlaying = false;
      isProcessing.value = false;
    } catch (error) {
      console.error('[NewGameEngine] 执行事件失败:', error);
      engineState.isAutoPlaying = false;
      isProcessing.value = false;
    }
  };

  /**
   * 判定多结果分支条件
   */
  const evaluateOutcomeCondition = (outcome: { condition?: unknown }, state: any): boolean => {
    if (!outcome.condition) return true;

    try {
      // 运行时不再执行函数条件，避免与受控 evaluator 分叉
      if (typeof outcome.condition === 'function') {
        console.warn('[NewGameEngine] outcome.condition 不支持函数形式，按不满足处理');
        return false;
      }

      // 结构化表达式条件统一复用核心评估入口，避免前端“默认 true”
      if (
        typeof outcome.condition === 'object' &&
        outcome.condition !== null &&
        (outcome.condition as { type?: unknown }).type === 'expression'
      ) {
        return gameEngine.isChoiceAvailable(outcome.condition as any);
      }

      console.warn('[NewGameEngine] 未识别的 outcome.condition，按不满足处理:', outcome.condition);
      return false;
    } catch (error) {
      console.warn('[NewGameEngine] outcome.condition 评估失败，按不满足处理:', outcome.condition, error);
      return false;
    }
  };

  /**
   * 处理选择
   */
  const handleChoice = async (
    choice: StoryChoice,
    context?: { source?: 'manual' | 'autoResolve'; eventId?: string },
  ): Promise<boolean> => {
    if (isProcessing.value || !engineState.currentEvent) return false;

    // 查找对应的选择定义
    const currentEvent = engineState.currentEvent;
    if (currentEvent.eventType !== 'choice' || !currentEvent.choices) return false;

    const selectedChoice = currentEvent.choices.find(c => c.id === choice.id);
    if (!selectedChoice) {
      console.warn('[NewGameEngine] 未找到选择项定义:', {
        source: context?.source ?? 'manual',
        eventId: context?.eventId ?? currentEvent.id,
        choiceId: choice.id,
      });
      return false;
    }

    if (selectedChoice.condition && !gameEngine.isChoiceAvailable(selectedChoice.condition)) {
      const explanation = gameEngine.explainChoice(selectedChoice.id, selectedChoice.condition);
      gameEngine.setPlayerFeedbackMessage(explanation.summary);
      console.warn('[NewGameEngine] 选择项条件不满足，已拒绝执行:', {
        source: context?.source ?? 'manual',
        eventId: context?.eventId ?? currentEvent.id,
        choiceId: selectedChoice.id,
        condition: selectedChoice.condition ?? null,
      });
      return false;
    }

    // 确定要执行的效果
    let effectsToExecute = selectedChoice.effects || [];
    let outcomeText: string | null = null;
    let selectedOutcomeId: string | undefined;

    // 如果有多结果分支，根据条件判定
    if (selectedChoice.outcomes && selectedChoice.outcomes.length > 0) {
      const gameState = gameEngine.getGameState();
      let hasMatchedOutcome = false;
      for (const outcome of selectedChoice.outcomes) {
        // 检查条件是否满足
        if (evaluateOutcomeCondition(outcome, gameState)) {
          hasMatchedOutcome = true;
          effectsToExecute = outcome.effects || [];
          outcomeText = outcome.text;
          selectedOutcomeId = outcome.id;
          break;
        }
      }
      if (!hasMatchedOutcome) {
        console.warn('[NewGameEngine] 未命中任何可用 outcome，回退到 choice.effects:', {
          source: context?.source ?? 'manual',
          eventId: context?.eventId ?? currentEvent.id,
          choiceId: selectedChoice.id,
        });
      }
    }

    if (effectsToExecute.length === 0) {
      console.warn('[NewGameEngine] 选择无可用效果:', {
        source: context?.source ?? 'manual',
        eventId: context?.eventId ?? currentEvent.id,
        choiceId: choice.id,
      });
      return false;
    }

    isProcessing.value = true;
    engineState.isAutoPlaying = true;
    // Detached snapshot: getGameState() returns the live reactive reference.
    const stateBeforeChoice = cloneCanonicalGameState(gameEngine.getGameState());

    try {
      // 执行选择的效果
      await gameEngine.executeChoiceEffects(effectsToExecute, currentEvent.id, selectedChoice.id);
      const stateAfterChoice = cloneCanonicalGameState(gameEngine.getGameState());
      const feedback = generateChoiceFeedback({
        narrativeResult: outcomeText,
        effects: effectsToExecute,
        sourceEventId: currentEvent.id,
        sourceChoiceId: selectedChoice.id,
        sourceOutcomeId: selectedOutcomeId,
        beforePlayer: stateBeforeChoice.player,
        afterPlayer: stateAfterChoice.player,
        beforeFlags: stateBeforeChoice.flags,
        afterFlags: stateAfterChoice.flags,
      });
      engineState.lastEffects = effectsToExecute;
      engineState.lastOutcomeText = feedback.player.narrativeResult;
      engineState.lastChoiceFeedback = feedback;
      const overlayCard = buildChoiceFeedbackOverlayCard(
        `choice-${currentEvent.id}-${selectedChoice.id}`,
        currentEvent.content?.title || '上一阶段',
        selectedChoice.text,
        feedback,
        [selectedChoice.text, selectedChoice.description],
      );
      if (context?.source === 'autoResolve') {
        engineState.pendingStageResult = overlayCard ? [overlayCard] : null;
      } else {
        engineState.progressionOverlay = overlayCard ? { cards: [overlayCard] } : null;
      }
      // 清空选项，防止重复点击
      engineState.availableChoices = [];
      engineState.isAutoPlaying = false;
      isProcessing.value = false;
      if (context?.source !== 'autoResolve') {
        getNextEvent();
      }
      return true;
    } catch (error) {
      console.error('[NewGameEngine] 执行选择失败:', error);
      engineState.isAutoPlaying = false;
      isProcessing.value = false;
      return false;
    }
  };

  /**
   * P7: 执行主动行动
   */
  const handleActiveAction = async (actionId: string): Promise<boolean> => {
    if (isProcessing.value || !engineState.isActiveActionMode) return false;

    isProcessing.value = true;
    engineState.isAutoPlaying = true;
    const ageBefore = gameEngine.getGameState().player?.age ?? 0;

    try {
      const result = gameEngine.executeActiveAction(actionId, { random: Math.random });
      if (!result) {
        isProcessing.value = false;
        engineState.isAutoPlaying = false;
        return false;
      }

      engineState.lastOutcomeText = result.feedbackText;
      engineState.lastChoiceFeedback = null;
      engineState.lastActiveActionSummary = result.activeActionSummary;
      engineState.progressionOverlay = {
        cards: [buildActiveActionOverlayCard(`active-action-${actionId}`, result.activeActionSummary)],
      };
      engineState.pendingDisturbanceNarrative = result.disturbanceNarrative;
      engineState.showingDisturbanceNarrative = false;
      engineState.availableActiveActions = [];
      engineState.isActiveActionMode = false;
      engineState.isAutoPlaying = false;
      isProcessing.value = false;

      const ageAfter = gameEngine.getGameState().player?.age ?? 0;
      if (ageAfter - ageBefore >= 1) {
        console.warn('[NewGameEngine] Active action caused year-scale advance', actionId);
      }

      continueProgressionFlow();
      return true;
    } catch (error) {
      console.error('[NewGameEngine] 执行主动行动失败:', error);
      engineState.isAutoPlaying = false;
      isProcessing.value = false;
      return false;
    }
  };

  const pickAutoChoice = (choices: any[], state: any, eventId: string) => {
    let best = choices[0];
    let bestScore = -Infinity;

    for (const choice of choices) {
      let score = typeof choice.weight === 'number' ? choice.weight : 1;

      // 如果有多结果分支，评估最佳结果
      if (choice.outcomes && choice.outcomes.length > 0) {
        let bestOutcomeScore = -Infinity;
        let hasAvailableOutcome = false;
        for (const outcome of choice.outcomes) {
          if (!evaluateOutcomeCondition(outcome, state)) {
            continue;
          }
          hasAvailableOutcome = true;
          let outcomeScore = 0;
          if (outcome.effects) {
            for (const effect of outcome.effects) {
              const target = effect.stat || effect.target || '';
              if (target === 'money') {
                continue;
              }
              if (effect.operator === 'add') {
                const value = typeof effect.value === 'number' ? effect.value : 0;
                if (['martialPower', 'knowledge', 'constitution', 'chivalry', 'charisma', 'reputation'].includes(target)) {
                  outcomeScore += value * 2;
                } else {
                  outcomeScore += value;
                }
              } else if (effect.operator === 'subtract') {
                const value = typeof effect.value === 'number' ? effect.value : 0;
                outcomeScore -= value;
              }
            }
          }
          if (outcomeScore > bestOutcomeScore) {
            bestOutcomeScore = outcomeScore;
          }
        }
        if (hasAvailableOutcome) {
          score = bestOutcomeScore;
        } else {
          console.warn('[NewGameEngine] 自动判定选择无可用 outcome，退回 choice.effects 评分:', {
            eventId,
            choiceId: choice.id,
          });
        }
      } else if (choice.effects) {
        // 无多结果分支，评估原有效果
        for (const effect of choice.effects) {
          const target = effect.stat || effect.target || '';
          if (target === 'money') {
            continue;
          }
          if (effect.operator === 'add') {
            const value = typeof effect.value === 'number' ? effect.value : 0;
            if (['martialPower', 'knowledge', 'constitution', 'chivalry', 'charisma', 'reputation'].includes(target)) {
              score += value * 2;
            } else {
              score += value;
            }
          } else if (effect.operator === 'subtract') {
            const value = typeof effect.value === 'number' ? effect.value : 0;
            score -= value;
          }
        }
      }
      if (score > bestScore) {
        bestScore = score;
        best = choice;
      }
    }

    return best;
  };

  const clearProgressionPresentation = () => {
    engineState.lastOutcomeText = null;
    engineState.lastChoiceFeedback = null;
    engineState.lastActiveActionSummary = null;
    engineState.pendingDisturbanceNarrative = null;
    engineState.showingDisturbanceNarrative = false;
    engineState.pendingPeriodSummary = null;
    engineState.annualPassiveMemory = null;
    engineState.pendingStageResult = null;
  };

  const clearProgressionOverlay = () => {
    engineState.progressionOverlay = null;
  };

  const executePassiveChildhoodTick = (): PeriodSummaryDisplay => {
    const state = gameEngine.getGameState();
    const age = state.player?.age ?? 0;
    if (isAnnualPassiveMemoryAge(age)) {
      const annual = engineState.annualPassiveMemory;
      if (!annual) throw new Error('Annual passive memory must be prepared before acknowledgement');
      const result = commitAnnualPassiveMemory(state, annual);
      gameEngine.advanceTime(1, 'year');
      engineState.annualPassiveMemory = null;
      engineState.passiveNarrative = null;
      engineState.isPassiveProgressionMode = false;
      engineState.storyGapPassiveServed = false;
      return buildPeriodSummary({
        sourceLabel: '童年岁月',
        headline: result.headline,
        body: result.body,
        deltas: result.deltas,
        deltaCause: result.headline,
        lifeStates: gameEngine.getGameState().player?.lifeStates,
      });
    }
    const selected = selectPassiveNarrative(state);
    const deltas = clampPassiveStatDeltasForAge(age, selected.statDeltas);
    applyStatDeltas(state.player, deltas);
    applyPassiveNarrativeFlags(state, selected.flags);
    gameEngine.advanceTime(3, 'month');
    if (!state.eventHistory) {
      state.eventHistory = [];
    }
    if (shouldRecordPassiveNarrativeInHistory(selected.id)) {
      const record = {
        eventId: selected.id,
        age: state.player.age,
        ...(state.currentTime ? { timestamp: { ...state.currentTime } } : {}),
      };
      state.eventHistory.push(record);
    }
    const summary = buildPeriodSummary({
      sourceLabel: '童年岁月',
      headline: selected.title,
      body: selected.text,
      deltas,
      deltaCause: selected.title,
      lifeStates: gameEngine.getGameState().player?.lifeStates,
    });
    engineState.isPassiveProgressionMode = false;
    engineState.passiveNarrative = null;
    engineState.annualPassiveMemory = null;
    engineState.storyGapPassiveServed = true;
    return summary;
  };

  /** Complete one visible stage and enter the next visible stage in the same player action. */
  const continueProgressionFlow = () => {
    if (engineState.pendingStageResult) {
      const resultCards = engineState.pendingStageResult;
      clearProgressionPresentation();
      engineState.progressionOverlay = { cards: resultCards };
      engineState.storyGapPassiveServed = false;
      getNextEvent();
      return;
    }
    if (engineState.isPassiveProgressionMode && engineState.passiveNarrative) {
      const summary = executePassiveChildhoodTick();
      engineState.progressionOverlay = {
        cards: [buildPeriodSummaryOverlayCard(`period-${summary.headline}`, summary)],
      };
      getNextEvent();
      return;
    }
    if (engineState.pendingDisturbanceNarrative && !engineState.showingDisturbanceNarrative) {
      engineState.showingDisturbanceNarrative = true;
      engineState.lastActiveActionSummary = null;
      engineState.lastOutcomeText = engineState.pendingDisturbanceNarrative.bodyText;
      markDisturbanceNarrativeShown(
        gameEngine.getGameState(),
        engineState.pendingDisturbanceNarrative.disturbanceId,
      );
      return;
    }
    if (engineState.showingDisturbanceNarrative && engineState.pendingDisturbanceNarrative) {
      const narrative = engineState.pendingDisturbanceNarrative;
      const resultCard = buildStageResultOverlayCard(
        `disturbance-${narrative.disturbanceId}`,
        narrative.title,
        [narrative.impactSummary],
      );
      clearProgressionPresentation();
      engineState.progressionOverlay = { cards: [resultCard] };
      engineState.storyGapPassiveServed = false;
      getNextEvent();
      return;
    }
    clearProgressionPresentation();
    engineState.storyGapPassiveServed = false;
    getNextEvent();
  };

  /**
   * 开始新游戏
   */
  const startNewGame = (name: string, gender: 'male' | 'female') => {
    gameEngine.startNewGame(name, gender);
    engineState.currentEvent = null;
    engineState.availableChoices = [];
    engineState.availableActiveActions = [];
    engineState.isActiveActionMode = false;
    engineState.isAutoPlaying = false;
    engineState.lastEffects = [];
    clearProgressionPresentation();
    clearProgressionOverlay();
    isProcessing.value = false;

    // 等待下一帧再开始第一个事件，让 UI 有时间更新
    requestAnimationFrame(() => {
      getNextEvent();
    });
  };

  /**
   * 重置游戏
   */
  const restartGame = () => {
    gameEngine.resetGame();
    engineState.currentEvent = null;
    engineState.availableChoices = [];
    engineState.availableActiveActions = [];
    engineState.isActiveActionMode = false;
    engineState.isAutoPlaying = false;
    engineState.lastEffects = [];
    clearProgressionPresentation();
    clearProgressionOverlay();
    isProcessing.value = false;
  };

  const saveCurrentGame = (saveName?: string) => {
    const state = gameEngine.getGameState();
    const fallbackName = `手动存档-${state.player?.name || '侠客'}-${state.player?.age || 0}岁`;
    return saveManager.saveGame(state, saveName?.trim() || fallbackName);
  };

  const getAllSaves = () => {
    return saveManager.getAllSaves();
  };

  const loadGameFromSave = (saveId: string) => {
    const saveData = saveManager.loadGame(saveId);
    if (!saveData) {
      return false;
    }
    gameEngine.loadGameState(defaultSnapshotConverter.fromSnapshot(saveData.snapshot));
    engineState.currentEvent = null;
    engineState.availableChoices = [];
    engineState.availableActiveActions = [];
    engineState.isActiveActionMode = false;
    engineState.isAutoPlaying = false;
    engineState.lastEffects = [];
    clearProgressionPresentation();
    clearProgressionOverlay();
    isProcessing.value = false;
    getNextEvent();
    return true;
  };

  /**
   * 获取当前游戏状态
   */
  const getGameState = () => {
    return gameEngine.getGameState();
  };

  /**
   * 打印事件统计
   */
  const printEventStatistics = () => {
    eventLoader.printStatistics();
  };

  return {
    // 状态
    engineState,
    isProcessing,
    
    // 方法
    startNewGame,
    restartGame,
    handleChoice,
    handleActiveAction,
    continueProgressionFlow,
    getNextEvent,
    getGameState,
    saveCurrentGame,
    loadGameFromSave,
    getAllSaves,
    printEventStatistics,
    
    // 计算属性
    currentEvent: computed(() => engineState.currentEvent),
    availableChoices: computed(() => engineState.availableChoices),
    availableActiveActions: computed(() => engineState.availableActiveActions),
    isActiveActionMode: computed(() => engineState.isActiveActionMode),
    isAutoPlaying: computed(() => engineState.isAutoPlaying),
    lastEffects: computed(() => engineState.lastEffects),
  };
}
