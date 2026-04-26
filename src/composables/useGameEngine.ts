import { reactive, nextTick } from 'vue';
import { useGameStore } from '../store/gameStore';
import { getAvailableNodes } from '../data/storyData';
import { effectExecutor } from '../core/EffectExecutor';
import type { StoryNode, StoryChoice } from '../types';

/**
 * @deprecated 仅用于历史兼容/演示链路。主流程请使用 useNewGameEngine + gameEngine。
 */
export function useGameEngine() {
  const store = useGameStore();
  
  const engineState = reactive({
    currentNode: null as StoryNode | null,
    availableChoices: [] as StoryChoice[],
    isAutoPlaying: false,
  });

  /**
   * 处理自动事件
   */
  const processAutoNode = async (node: StoryNode) => {
    if (!store.state.player) return;
    
    engineState.isAutoPlaying = true;
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // 执行效果
    const effectResult = node.effects 
      ? effectExecutor.executeEffects(node.effects, store.state.player)
      : { updates: {} };
    
    // 应用更新
    const updates: any = { ...effectResult.updates };
    if (effectResult.timeSpan) {
      updates.timeSpan = effectResult.timeSpan;
    }
    
    if (Object.keys(updates).length > 0) {
      store.updatePlayer(updates);
    }
    
    // 处理完成标志
    if (node.onComplete) {
      const onCompleteUpdates: any = {};
      if (node.onComplete.setEvent) {
        onCompleteUpdates.events = new Set([node.onComplete.setEvent]);
      }
      if (node.onComplete.setFlag) {
        onCompleteUpdates.flags = new Set([node.onComplete.setFlag]);
      }
      if (Object.keys(onCompleteUpdates).length > 0) {
        store.updatePlayer(onCompleteUpdates);
      }
    }
    
    // 处理结局
    if (effectResult.ending) {
      store.endGame(effectResult.ending.reason, effectResult.ending.epitaph);
    }
    
    if (node.text) {
      store.addHistory(node.text);
    }
    
    if (!store.state.player.alive) {
      engineState.currentNode = null;
      engineState.availableChoices = [];
      engineState.isAutoPlaying = false;
      return;
    }
    
    engineState.isAutoPlaying = false;
    await nextTick();
    getNextNode();
  };

  /**
   * 获取下一个事件
   */
  const getNextNode = () => {
    if (!store.state.player || engineState.isAutoPlaying) return;
    
    const nodes = getAvailableNodes(store.state.player);
    
    if (nodes.length > 0) {
      const node = nodes[0];
      engineState.currentNode = node;
      
      if (node.autoNext && node.effects) {
        engineState.availableChoices = [];
        processAutoNode(node);
      } else if (node.choices) {
        engineState.availableChoices = node.choices;
      } else {
        engineState.availableChoices = [];
      }
    }
  };

  /**
   * 处理玩家选择
   */
  const makeChoice = (choice: StoryChoice) => {
    if (!store.state.player || engineState.isAutoPlaying) return;

    // 执行选择效果
    const effectResult = choice.effects 
      ? effectExecutor.executeEffects(choice.effects as any, store.state.player)
      : { updates: {} };
    
    // 应用更新
    const updates: any = { ...effectResult.updates };
    if (effectResult.timeSpan) {
      updates.timeSpan = effectResult.timeSpan;
    }
    
    if (Object.keys(updates).length > 0) {
      store.updatePlayer(updates);
    }
    
    // 处理结局
    if (effectResult.ending) {
      store.endGame(effectResult.ending.reason, effectResult.ending.epitaph);
    }
    
    if (engineState.currentNode) {
      store.addHistory(engineState.currentNode.text);
    }

    if (!store.state.player.alive) {
      engineState.currentNode = null;
      engineState.availableChoices = [];
      return;
    }

    getNextNode();
  };

  const startNewGame = (name: string, gender: 'male' | 'female') => {
    store.startGame(name, gender);
    engineState.isAutoPlaying = false;
    getNextNode();
  };

  const restartGame = () => {
    store.resetGame();
    engineState.currentNode = null;
    engineState.availableChoices = [];
    engineState.isAutoPlaying = false;
  };

  return {
    engineState,
    makeChoice,
    startNewGame,
    restartGame,
  };
}
