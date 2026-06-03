<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, ref } from 'vue';
import StartScreen from './components/StartScreen.vue';
import SaveSlotStartScreen from './components/SaveSlotStartScreen.vue';
import { useNewGameEngine } from './composables/useNewGameEngine';
import { isApiModeEnabled, useApiGameEngine } from './composables/useApiGameEngine';
import { gameEngine } from './core/GameEngineIntegration';
import { isPlayerDebugEnabled } from './utils/debugAccess';
import { webPlatformStorage } from './adapters/platform/webPlatformStorage';

const GameScreen = defineAsyncComponent(() => import('./components/GameScreen.vue'));
const EndingScreen = defineAsyncComponent(() => import('./components/EndingScreen.vue'));
const DebugPanel = defineAsyncComponent(() => import('./components/DebugPanel.vue'));

const apiMode = isApiModeEnabled();
const debugEnabled = isPlayerDebugEnabled();
const showDebug = ref(false);
const gameStarted = ref(false);
const pendingOverwriteSlot = ref<number | null>(null);
const apiPlayerName = ref('');
const apiGender = ref<'male' | 'female'>('male');

const gameEngineComposable = useNewGameEngine();
const { startNewGame, restartGame, handleChoice, handleActiveAction, isProcessing, getAllSaves, loadGameFromSave } =
  gameEngineComposable;

const apiEngine = useApiGameEngine();
const {
  flowState,
  flowMessage,
  saveSlots,
  engineState: apiEngineState,
  isProcessing: apiIsProcessing,
  bootstrap,
  startNewGameInSlot,
  continueSlot,
  handleChoice: apiHandleChoice,
  saveCurrentGame: apiSaveCurrentGame,
  activeSession,
} = apiEngine;

onMounted(() => {
  if (apiMode) {
    void bootstrap();
  }
});

const gamePhase = computed(() => {
  if (!gameStarted.value) return 'start';
  if (apiMode) {
    const terminal =
      activeSession.value?.nextEvent === null && apiEngineState.availableChoices.length === 0;
    if (terminal) return 'ending';
    return 'playing';
  }
  const state = gameEngine.getGameState();
  if (!state.player?.alive) return 'ending';
  return 'playing';
});

const handleStart = (name: string, gender: 'male' | 'female') => {
  startNewGame(name, gender);
  gameStarted.value = true;
};

const handleApiNewGame = async (slotIndex: number, name: string, gender: 'male' | 'female') => {
  const slot = saveSlots.value.find(s => s.slotIndex === slotIndex);
  if (slot?.occupied && pendingOverwriteSlot.value !== slotIndex) {
    const ok = window.confirm(`槽位 ${slotIndex} 已有存档，确定开启新人生并覆盖？`);
    if (!ok) return;
    pendingOverwriteSlot.value = slotIndex;
  }
  const started = await startNewGameInSlot(
    slotIndex,
    name,
    gender,
    slot?.occupied ? true : undefined,
  );
  if (started) gameStarted.value = true;
};

const onApiNewGameSlot = (slotIndex: number) => {
  if (!apiPlayerName.value.trim()) return;
  void handleApiNewGame(slotIndex, apiPlayerName.value.trim(), apiGender.value);
};

const onApiContinueSlot = async (slotIndex: number) => {
  const ok = await continueSlot(slotIndex);
  if (ok) gameStarted.value = true;
};

const handleRestart = () => {
  if (apiMode) {
    apiEngine.activeSession.value = null;
    webPlatformStorageClearSession();
    void bootstrap();
  } else {
    restartGame();
  }
  gameStarted.value = false;
};

function webPlatformStorageClearSession(): void {
  webPlatformStorage.clearSessionAuth();
}

const latestSave = computed(() => getAllSaves()[0] ?? null);

const latestSaveLabel = computed(() => {
  if (!latestSave.value) return '';
  return `${latestSave.value.name}（${new Date(latestSave.value.timestamp).toLocaleString('zh-CN')}）`;
});

const handleLoadLatestSaveFromEnding = () => {
  if (!latestSave.value) return;
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

const currentNode = computed(() => {
  if (apiMode) {
    const event = apiEngineState.currentEvent;
    if (!event) return null;
    return {
      id: event.eventId,
      text: event.text || '(无文本)',
      title: event.title || '',
      choices: apiEngineState.availableChoices,
    };
  }
  const event = gameEngineComposable.engineState.currentEvent;
  if (!event) {
    if (gameEngineComposable.engineState.isActiveActionMode) {
      return {
        id: 'active_planning',
        text: '本期暂无强求的江湖变故，你可安排日常行动。',
        title: '规划本期人生',
        choices: [],
      };
    }
    const pendingOutcome = gameEngineComposable.engineState.lastOutcomeText;
    if (pendingOutcome) {
      return {
        id: 'action_or_choice_result',
        text: pendingOutcome,
        title: '本期小结',
        choices: [],
      };
    }
    return null;
  }
  return {
    id: event.id,
    text: event.content?.text || '(无文本)',
    title: event.content?.title || '',
    choices: gameEngineComposable.engineState.availableChoices,
  };
});

const availableChoices = computed(() => {
  if (apiMode) return apiEngineState.availableChoices;
  if (gameEngineComposable.engineState.isActiveActionMode) {
    return gameEngineComposable.engineState.availableActiveActions.map(action => ({
      id: action.id,
      text: action.text,
      description: `${action.description}｜收益：${action.rewardSummary}｜消耗：${action.costSummary}｜风险：${action.riskLevel}`,
      actionId: action.actionId,
      isActiveAction: true,
    }));
  }
  return gameEngineComposable.engineState.availableChoices;
});

const endingPlayer = computed(() => {
  if (apiMode) return null;
  return gameEngine.getGameState().player ?? null;
});

const onChoice = (choice: { id: string; text: string; actionId?: string; isActiveAction?: boolean; locked?: boolean }) => {
  if (apiMode) {
    void apiHandleChoice(choice);
    return;
  }
  if (choice.isActiveAction) {
    void handleActiveAction(choice.actionId ?? choice.id.replace(/^active_/, ''));
    return;
  }
  if (choice.locked) {
    const msg = gameEngine.consumePlayerFeedbackMessage() ?? '该选项尚未解锁';
    window.alert(msg);
    return;
  }
  void handleChoice(choice);
};

const onApiManualSave = async () => {
  const ok = await apiSaveCurrentGame();
  window.alert(ok ? '进度已保存到服务器' : flowMessage.value || '保存失败');
};
</script>

<template>
  <div id="app">
    <button
      v-if="debugEnabled && gamePhase === 'playing' && !apiMode"
      class="debug-toggle"
      @click="toggleDebug"
      :title="showDebug ? '关闭调试面板' : '打开调试面板'"
      :aria-label="showDebug ? '关闭调试面板' : '打开调试面板'"
    >
      {{ showDebug ? '关闭调试' : '调试面板' }}
    </button>

    <DebugPanel v-if="debugEnabled && showDebug && !apiMode" />

    <SaveSlotStartScreen
      v-if="gamePhase === 'start' && apiMode"
      v-model:player-name="apiPlayerName"
      v-model:gender="apiGender"
      :slots="saveSlots"
      :flow-state="flowState"
      :flow-message="flowMessage"
      :busy="apiIsProcessing"
      @continue-slot="onApiContinueSlot"
      @new-game-slot="onApiNewGameSlot"
      @retry="bootstrap"
    />
    <StartScreen v-else-if="gamePhase === 'start'" @start="handleStart" />
    <GameScreen
      v-else-if="gamePhase === 'playing'"
      :api-mode="apiMode"
      :current-node="currentNode"
      :available-choices="availableChoices"
      :is-auto-playing="apiMode ? apiIsProcessing : isProcessing"
      @choice="onChoice"
      @manual-save="onApiManualSave"
    />
    <EndingScreen
      v-else
      :player="endingPlayer"
      :has-latest-save="!!latestSave && !apiMode"
      :latest-save-label="latestSaveLabel"
      @restart="handleRestart"
      @load-latest-save="handleLoadLatestSaveFromEnding"
    />
  </div>
</template>

<style>
html,
body,
#app {
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
