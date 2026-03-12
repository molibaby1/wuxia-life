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
import type { StoryChoice } from '../types';

interface EventState {
  currentEvent: EventDefinition | null;
  availableChoices: StoryChoice[];
  isAutoPlaying: boolean;
  lastEffects: Effect[];
}

export function useNewGameEngine() {
  const engineState = reactive<EventState>({
    currentEvent: null,
    availableChoices: [],
    isAutoPlaying: false,
    lastEffects: [],
  });

  const isProcessing = ref(false);

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
        // 如果是选择事件，准备选择项
        engineState.availableChoices = selectedEvent.choices.map(choice => ({
          id: choice.id,
          text: choice.text,
          condition: choice.condition ? { type: 'expression', expression: choice.condition.expression } : undefined,
          requirements: choice.requirements,
        }));
      }
    } else {
      // 没有可用事件，推进时间
      console.log(`[NewGameEngine] ${age}岁没有可用事件，推进时间`);
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

    // 延迟执行，给 UI 渲染时间
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      // 执行事件效果
      await gameEngine.executeAutoEvent(event);
      engineState.lastEffects = event.autoEffects;

      // 记录日志
      if (event.content.text) {
        console.log(`[Event] ${event.content.title}: ${event.content.text}`);
      }

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
      
      // 短暂延迟后继续
      setTimeout(() => {
        getNextEvent();
      }, 500);
    } catch (error) {
      console.error('[NewGameEngine] 执行事件失败:', error);
      engineState.isAutoPlaying = false;
      isProcessing.value = false;
    }
  };

  /**
   * 处理选择
   */
  const handleChoice = async (choice: StoryChoice) => {
    if (isProcessing.value || !engineState.currentEvent) return;

    // 查找对应的选择定义
    const currentEvent = engineState.currentEvent;
    if (currentEvent.eventType !== 'choice' || !currentEvent.choices) return;

    const selectedChoice = currentEvent.choices.find(c => c.id === choice.id);
    if (!selectedChoice || !selectedChoice.effects) return;

    isProcessing.value = true;
    engineState.isAutoPlaying = true;

    try {
      // 执行选择的效果
      await gameEngine.executeChoiceEffects(selectedChoice.effects);
      engineState.lastEffects = selectedChoice.effects;

      // 记录日志
      if (currentEvent.content.text) {
        console.log(`[Choice] 选择：${selectedChoice.text}`);
      }

      // 继续下一个事件
      engineState.isAutoPlaying = false;
      isProcessing.value = false;
      
      setTimeout(() => {
        getNextEvent();
      }, 500);
    } catch (error) {
      console.error('[NewGameEngine] 执行选择失败:', error);
      engineState.isAutoPlaying = false;
      isProcessing.value = false;
    }
  };

  /**
   * 开始新游戏
   */
  const startNewGame = (name: string, gender: 'male' | 'female') => {
    console.log('[NewGameEngine] 开始新游戏');
    gameEngine.startNewGame(name, gender);
    engineState.currentEvent = null;
    engineState.availableChoices = [];
    engineState.isAutoPlaying = false;
    engineState.lastEffects = [];
    isProcessing.value = false;

    // 开始第一个事件
    setTimeout(() => {
      getNextEvent();
    }, 500);
  };

  /**
   * 重置游戏
   */
  const restartGame = () => {
    console.log('[NewGameEngine] 重置游戏');
    gameEngine.resetGame();
    engineState.currentEvent = null;
    engineState.availableChoices = [];
    engineState.isAutoPlaying = false;
    engineState.lastEffects = [];
    isProcessing.value = false;
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
