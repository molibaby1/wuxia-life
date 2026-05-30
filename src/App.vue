<script setup lang="ts">
import { computed, defineAsyncComponent, ref } from 'vue';
import StartScreen from './components/StartScreen.vue';
import { useNewGameEngine } from './composables/useNewGameEngine';
import { gameEngine } from './core/GameEngineIntegration';
import { isPlayerDebugEnabled } from './utils/debugAccess';

const GameScreen = defineAsyncComponent(() => import('./components/GameScreen.vue'));
const EndingScreen = defineAsyncComponent(() => import('./components/EndingScreen.vue'));
const DebugPanel = defineAsyncComponent(() => import('./components/DebugPanel.vue'));

const debugEnabled = isPlayerDebugEnabled();
const showDebug = ref(false);
const gameStarted = ref(false);

// 不要解构 engineState，保持完整引用
const gameEngineComposable = useNewGameEngine();
const { startNewGame, restartGame, handleChoice, isProcessing, getAllSaves, loadGameFromSave } = gameEngineComposable;

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

const latestSave = computed(() => getAllSaves()[0] ?? null);

const latestSaveLabel = computed(() => {
  if (!latestSave.value) {
    return '';
  }
  return `${latestSave.value.name}（${new Date(latestSave.value.timestamp).toLocaleString('zh-CN')}）`;
});

const handleLoadLatestSaveFromEnding = () => {
  if (!latestSave.value) {
    return;
  }
  const loaded = loadGameFromSave(latestSave.value.id);
  if (!loaded) {
    window.alert('读取失败，存档可能不兼容');
    return;
  }
  gameStarted.value = true;
  window.alert(`已从结局页恢复：${latestSave.value.name}`);
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
const endingPlayer = computed(() => gameEngine.getGameState().player ?? null);
</script>

<template>
  <div id="app">
    <!-- 调试入口：仅 dev 且 ?debug=1 或 localStorage wuxia-debug=1 -->
    <button
      v-if="debugEnabled && gamePhase === 'playing'"
      class="debug-toggle"
      @click="toggleDebug"
      :title="showDebug ? '关闭调试面板' : '打开调试面板'"
      :aria-label="showDebug ? '关闭调试面板' : '打开调试面板'"
    >
      {{ showDebug ? '关闭调试' : '调试面板' }}
    </button>

    <DebugPanel v-if="debugEnabled && showDebug" />
    
    <!-- 游戏主界面 -->
    <StartScreen v-if="gamePhase === 'start'" @start="handleStart" />
    <GameScreen 
      v-else-if="gamePhase === 'playing'"
      :current-node="currentNode"
      :available-choices="availableChoices"
      :is-auto-playing="isProcessing"
      @choice="handleChoice"
    />
    <EndingScreen
      v-else
      :player="endingPlayer"
      :has-latest-save="!!latestSave"
      :latest-save-label="latestSaveLabel"
      @restart="handleRestart"
      @load-latest-save="handleLoadLatestSaveFromEnding"
    />
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
  padding: 8px 14px;
  font-size: 14px;
  font-weight: 600;
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
