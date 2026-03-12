<script setup lang="ts">
import { computed, ref } from 'vue';
import StartScreen from './components/StartScreen.vue';
import GameScreen from './components/GameScreen.vue';
import EndingScreen from './components/EndingScreen.vue';
import DebugPanel from './components/DebugPanel.vue';
import { useNewGameEngine } from './composables/useNewGameEngine';
import { gameEngine } from './core/GameEngineIntegration';

const showDebug = ref(false);
const gameStarted = ref(false);

// 不要解构 engineState，保持完整引用
const gameEngineComposable = useNewGameEngine();
const { startNewGame, restartGame, handleChoice, isProcessing } = gameEngineComposable;

const gamePhase = computed(() => {
  if (!gameStarted.value) return 'start';
  
  const state = gameEngine.getGameState();
  if (!state.player?.alive) return 'ending';
  return 'playing';
});

const handleStart = (name: string, gender: 'male' | 'female') => {
  startNewGame(name, gender);
  gameStarted.value = true;
};

const handleRestart = () => {
  restartGame();
  gameStarted.value = false;
};

const toggleDebug = () => {
  showDebug.value = !showDebug.value;
};

// 计算属性，保持响应性 - 直接引用 gameEngineComposable.engineState
const currentNode = computed(() => {
  const event = gameEngineComposable.engineState.currentEvent;
  if (!event) return null;
  return {
    id: event.id,
    text: event.content?.text || '(无文本)',
    title: event.content?.title || '',
    choices: gameEngineComposable.engineState.availableChoices,
  };
});

const availableChoices = computed(() => gameEngineComposable.engineState.availableChoices);
</script>

<template>
  <div id="app">
    <!-- 调试面板切换按钮 -->
    <button 
      class="debug-toggle" 
      @click="toggleDebug"
      title="切换调试面板"
    >
      {{ showDebug ? '🔒' : '🔧' }}
    </button>
    
    <!-- 调试面板（可选显示） -->
    <DebugPanel v-if="showDebug" />
    
    <!-- 游戏主界面 -->
    <StartScreen v-if="gamePhase === 'start'" @start="handleStart" />
    <GameScreen 
      v-else-if="gamePhase === 'playing'"
      :current-node="currentNode"
      :available-choices="availableChoices"
      :is-auto-playing="isProcessing"
      @choice="handleChoice"
    />
    <EndingScreen v-else @restart="handleRestart" />
  </div>
</template>

<style>
html, body, #app {
  margin: 0;
  padding: 0;
  height: 100%;
}

.debug-toggle {
  position: fixed;
  top: 10px;
  right: 10px;
  z-index: 9999;
  padding: 8px 12px;
  font-size: 20px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: 2px solid #4ec9b0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.debug-toggle:hover {
  background: rgba(78, 201, 176, 0.3);
  transform: scale(1.1);
}
</style>
