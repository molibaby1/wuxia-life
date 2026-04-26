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
import { eventLoader } from '../core/EventLoader';
import type { EventDefinition, Effect } from '../types/eventTypes';
import type { StoryChoice, ChoiceOutcomeUI } from '../types';

interface EventState {
  currentEvent: EventDefinition | null;
  availableChoices: StoryChoice[];
  isAutoPlaying: boolean;
  lastEffects: Effect[];
  lastOutcomeText: string | null;
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
        isAutoPlaying: false,
        lastEffects: [],
        lastOutcomeText: null,
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
    const selectedEvent = gameEngine.selectEvent(age);

    if (selectedEvent) {
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
        engineState.availableChoices = selectedEvent.choices.map(choice => ({
          id: choice.id,
          text: choice.text,
          description: choice.description,
          outcomes: choice.outcomes as any,
          requirements: choice.requirements,
        })) as any;
      }
    } else {
      // 没有可用事件，推进时间
      gameEngine.advanceTime(1);
      getNextEvent();
    }
  };

  /**
   * 处理自动事件
   */
  const processAutoEvent = async (event: EventDefinition) => {
    if (!event.autoEffects || event.autoEffects.length === 0) {
      isProcessing.value = false;
      return;
    }

    engineState.isAutoPlaying = true;
    isProcessing.value = true;

    try {
      // 执行事件效果
      await gameEngine.executeAutoEvent(event);
      engineState.lastEffects = event.autoEffects;

      // 检查是否是结局事件
      if (event.eventType === 'ending') {
        console.log(`🎉 游戏结束 - 结局：${event.content.title}`);
        engineState.isAutoPlaying = false;
        isProcessing.value = false;
        return;
      }

      // 继续下一个事件
      engineState.isAutoPlaying = false;
      isProcessing.value = false;
      
      // 等待下一帧，让 Vue 有时间更新 UI
      await new Promise(resolve => requestAnimationFrame(resolve));
      
      // 只有在玩家还活着的情况下才继续
      const state = gameEngine.getGameState();
      if (state.player?.alive) {
        getNextEvent();
      }
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
      // 函数式条件（兼容历史数据）
      if (typeof outcome.condition === 'function') {
        return (outcome.condition as (s: unknown) => boolean)(state);
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

    // 如果没有匹配到结果文本，尝试使用选项的 description
    if (!outcomeText && selectedChoice.description) {
      outcomeText = selectedChoice.description;
    }

    // 如果还是没有，使用效果生成描述
    if (!outcomeText && effectsToExecute.length > 0) {
      outcomeText = generateOutcomeText(effectsToExecute);
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

    try {
      // 执行选择的效果
      await gameEngine.executeChoiceEffects(effectsToExecute, currentEvent.id, selectedChoice.id);
      engineState.lastEffects = effectsToExecute;
      engineState.lastOutcomeText = outcomeText;
      // 清空选项，防止重复点击
      engineState.availableChoices = [];

      // 等待下一帧，让 Vue 有时间更新 UI
      await new Promise(resolve => requestAnimationFrame(resolve));

      // 显示结果，等待用户点击"继续"
      engineState.isAutoPlaying = false;
      isProcessing.value = false;
      return true;
    } catch (error) {
      console.error('[NewGameEngine] 执行选择失败:', error);
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
          if (effect.operator === 'add') {
                const value = typeof effect.value === 'number' ? effect.value : 0;
            const target = effect.stat || effect.target || '';
            if (['externalSkill', 'internalSkill', 'qinggong', 'martialPower', 'comprehension', 'constitution', 'chivalry', 'charisma', 'money', 'reputation'].includes(target)) {
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
          if (effect.operator === 'add') {
            const value = typeof effect.value === 'number' ? effect.value : 0;
            const target = effect.stat || effect.target || '';
            if (['externalSkill', 'internalSkill', 'qinggong', 'martialPower', 'comprehension', 'constitution', 'chivalry', 'charisma', 'money', 'reputation'].includes(target)) {
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

  /**
   * 开始新游戏
   */
  const startNewGame = (name: string, gender: 'male' | 'female') => {
    gameEngine.startNewGame(name, gender);
    engineState.currentEvent = null;
    engineState.availableChoices = [];
    engineState.isAutoPlaying = false;
    engineState.lastEffects = [];
    engineState.lastOutcomeText = null;
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
    engineState.isAutoPlaying = false;
    engineState.lastEffects = [];
    engineState.lastOutcomeText = null;
    isProcessing.value = false;
  };

  /**
   * 根据效果生成叙事性结果描述（不暴露数值）
   */
  const generateOutcomeText = (effects: Effect[]): string => {
    const parts: string[] = [];
    const flagGains: string[] = [];
    const relationChanges: string[] = [];

    for (const effect of effects) {
      switch (effect.type) {
        case 'stat_modify': {
          const statName = getStatName(effect.stat || effect.target || 'unknown');
          const value = typeof effect.value === 'number' ? effect.value : 0;
          const isPositive = (effect.operator === 'add' && value > 0) ||
                           (effect.operator === 'subtract' && value < 0);

          if (statName === '武力' || statName === '外功' || statName === '内功' || statName === '轻功') {
            parts.push(isPositive ? '你的武功有了长进' : '你的武艺似乎有些生疏');
          } else if (statName === '侠义') {
            parts.push(isPositive ? '你的侠义之心更加坚定了' : '你的心中似乎多了一丝动摇');
          } else if (statName === '魅力') {
            parts.push(isPositive ? '你的气质愈发出众' : '你感觉自己有些黯淡');
          } else if (statName === '体质') {
            parts.push(isPositive ? '你的身体更加健壮' : '你似乎更容易感到疲惫');
          } else if (statName === '悟性') {
            parts.push(isPositive ? '你对武学的理解更加深刻' : '有些道理似乎变得难以领悟');
          } else if (statName === '声望') {
            parts.push(isPositive ? '江湖中越来越多的人听说了你的名字' : '关于你的传言似乎不那么美好了');
          } else if (statName === '学识') {
            parts.push(isPositive ? '你的见识增长了不少' : '你意识到自己还有太多不懂');
          } else if (statName === '健康') {
            parts.push(isPositive ? '你的身体状态好转了' : '你感到有些不适');
          } else if (statName === '金钱') {
            parts.push(isPositive ? '你的钱袋鼓了起来' : '你的积蓄少了一些');
          } else if (statName === '影响力') {
            parts.push(isPositive ? '你在江湖中的分量更重了' : '你感到自己说话不那么管用了');
          } else if (statName === '人脉') {
            parts.push(isPositive ? '你结识了新的朋友' : '某些关系似乎变得淡漠了');
          } else if (statName === '商路') {
            parts.push(isPositive ? '你的生意头脑愈发灵活' : '你对商场的感觉有些迟钝');
          }
          break;
        }
        case 'flag_set': {
          const flagName = effect.flag || effect.target;
          if (effect.value === true && flagName) {
            flagGains.push(flagName);
          }
          break;
        }
        case 'money_modify': {
          const value = typeof effect.value === 'number' ? effect.value : 0;
          if (value > 0) {
            parts.push('你的钱袋鼓了起来');
          } else if (value < 0) {
            parts.push('你的积蓄少了一些');
          }
          break;
        }
        case 'relation_change': {
          relationChanges.push('与某人的关系发生了微妙的变化');
          break;
        }
      }
    }

    // 组合叙事
    const narrative: string[] = [];

    if (parts.length > 0) {
      narrative.push(parts[0] || '');
    }

    if (flagGains.length > 0) {
      const flagDescriptions = flagGains.slice(0, 2).map(f => describeFlag(f));
      narrative.push(flagDescriptions.join('，') + '。');
    }

    if (relationChanges.length > 0) {
      narrative.push(relationChanges[0] || '');
    }

    if (narrative.length === 0) {
      return '你的心中泛起涟漪，但一切似乎又归于平静。';
    }

    return narrative.join('。') + '。';
  };

  /**
   * 描述标志的中文含义
   */
  const describeFlag = (flag: string): string => {
    const descriptions: Record<string, string> = {
      diligentStudent: '你养成了勤勉的习惯',
      sect_trial_active: '你在门派中开始了新的修行',
      shaolinDisciple: '你正式成为少林弟子',
      wudangDisciple: '你正式成为武当弟子',
      beggars_disciple: '你加入了丐帮',
      jianghuTraveler: '你的江湖之路开始了',
      heroPath: '你选择了行侠仗义的道路',
      demonPath: '你似乎走向了另一条路',
      married: '你的生命中多了一个人',
      has_child: '你有了新的牵挂',
    };

    if (descriptions[flag]) {
      return descriptions[flag];
    }

    // 通用描述
    if (flag.includes('_done') || flag.includes('_completed')) {
      return `你完成了某件重要的事`;
    }
    if (flag.includes('_active')) {
      return `新的机遇正在等待你`;
    }
    if (flag.includes('_started')) {
      return `一段新的旅程开始了`;
    }

    return '你获得了新的体悟';
  };

  /**
   * 获取属性中文名
   */
  const getStatName = (stat: string): string => {
    const statNames: Record<string, string> = {
      martialPower: '武力',
      internalSkill: '内功',
      externalSkill: '外功',
      qinggong: '轻功',
      chivalry: '侠义',
      charisma: '魅力',
      constitution: '体质',
      comprehension: '悟性',
      reputation: '声望',
      influence: '影响力',
      connections: '人脉',
      knowledge: '学识',
      businessAcumen: '商路',
      money: '金钱',
      health: '健康',
    };
    return statNames[stat] || stat;
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
    getNextEvent,
    getGameState,
    printEventStatistics,
    
    // 计算属性
    currentEvent: computed(() => engineState.currentEvent),
    availableChoices: computed(() => engineState.availableChoices),
    isAutoPlaying: computed(() => engineState.isAutoPlaying),
    lastEffects: computed(() => engineState.lastEffects),
  };
}
