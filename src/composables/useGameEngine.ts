import { reactive, nextTick } from 'vue';
import { useGameStore } from '../store/gameStore';
import { getAvailableNodes } from '../data/storyData';
import { evaluateCondition, applyEffects } from '../utils/storyInterpreter';
import type { StoryNode, StoryChoice } from '../types';

export function useGameEngine() {
  const store = useGameStore();
  
  const engineState = reactive({
    currentNode: null as StoryNode | null,
    availableChoices: [] as StoryChoice[],
    isAutoPlaying: false,
  });

  const processAutoNode = async (node: StoryNode) => {
    if (!store.state.player) return;
    
    engineState.isAutoPlaying = true;
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    let effect;
    if ('autoEffects' in node && (node as any).autoEffects) {
      effect = applyEffects((node as any).autoEffects, store.state.player);
    } else if ('autoEffect' in node && node.autoEffect) {
      effect = node.autoEffect(store.state.player);
    }
    
    // 构建更新对象，包含 timeSpan
    const updates: any = { ...effect };
    if (node.timeSpan) {
      updates.timeSpan = node.timeSpan;
    }
    
    if (Object.keys(updates).length > 0) {
      store.updatePlayer(updates);
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

  const getNextNode = () => {
    if (!store.state.player || engineState.isAutoPlaying) return;
    
    const nodes = getAvailableNodes(store.state.player);
    
    if (nodes.length > 0) {
      const node = nodes[0];
      engineState.currentNode = node;
      
      const hasAutoEffects = ('autoEffects' in node && (node as any).autoEffects) || ('autoEffect' in node && node.autoEffect);
      
      if (node.autoNext && hasAutoEffects) {
        engineState.availableChoices = [];
        processAutoNode(node);
      } else if (node.choices) {
        engineState.availableChoices = node.choices.filter(choice => {
          if (!choice.condition) return true;
          if (typeof choice.condition === 'function') {
            return choice.condition(store.state.player!);
          } else if (typeof choice.condition === 'object') {
            return evaluateCondition(choice.condition, store.state.player!);
          }
          return true;
        });
      } else {
        engineState.availableChoices = [];
      }
    }
  };

  const makeChoice = (choice: StoryChoice) => {
    if (!store.state.player || engineState.isAutoPlaying) return;

    let effect;
    if ('effects' in choice && (choice as any).effects) {
      effect = applyEffects((choice as any).effects, store.state.player);
    } else if ('effect' in choice && choice.effect) {
      effect = choice.effect(store.state.player);
    }
    
    // 构建更新对象，包含 timeSpan
    const updates: any = { ...effect };
    if (choice.timeSpan) {
      updates.timeSpan = choice.timeSpan;
    }
    
    if (Object.keys(updates).length > 0) {
      store.updatePlayer(updates);
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
