<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, ref } from 'vue';
import StartScreen from './components/StartScreen.vue';
import SaveSlotStartScreen from './components/SaveSlotStartScreen.vue';
import { useNewGameEngine } from './composables/useNewGameEngine';
import { isApiModeEnabled, useApiGameEngine } from './composables/useApiGameEngine';
import { gameEngine } from './core/GameEngineIntegration';
import { resolvePlanningPlaceholderText } from './data/infantPassiveNarratives';
import { isPlayerDebugEnabled } from './utils/debugAccess';
import { webPlatformStorage } from './adapters/platform/webPlatformStorage';
import { deriveLifeMemorySummary } from './core/deriveLifeMemorySummary';
import type { HeadlessTerminalDto } from './contracts/sessionProgression';

type EndingPayload = NonNullable<HeadlessTerminalDto['ending']>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toEndingPayload(value: unknown): EndingPayload | null {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.name !== 'string' ||
    typeof value.description !== 'string' ||
    typeof value.category !== 'string'
  ) {
    return null;
  }

  return {
    id: value.id,
    name: value.name,
    description: value.description,
    category: value.category,
  };
}

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
  handleActiveAction: apiHandleActiveAction,
  handleProgressionAck: apiHandleProgressionAck,
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
    if (apiEngineState.sessionPhase === 'terminal') return 'ending';
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
    if (apiEngineState.sessionPhase === 'period_summary' && apiEngineState.periodSummary) {
      const summary = apiEngineState.periodSummary;
      return {
        id: 'period_summary',
        text: summary.narrativeText,
        title: summary.headline,
        choices: [],
      };
    }
    if (apiEngineState.sessionPhase === 'passive_progression' && apiEngineState.passiveNarrative) {
      const passive = apiEngineState.passiveNarrative;
      return {
        id: 'passive_progression',
        text: passive.text,
        title: passive.title,
        choices: [],
      };
    }
    if (apiEngineState.sessionPhase === 'active_planning') {
      const age = activeSession.value?.player?.age ?? 0;
      const placeholder = resolvePlanningPlaceholderText(age);
      return {
        id: 'active_planning',
        text: placeholder.text,
        title: placeholder.title,
        choices: [],
      };
    }
    if (apiEngineState.sessionPhase === 'disturbance_narrative' && apiEngineState.disturbanceNarrative) {
      const narrative = apiEngineState.disturbanceNarrative;
      return {
        id: 'disturbance_narrative',
        text: narrative.bodyText,
        title: narrative.title,
        choices: [],
      };
    }
    if (apiEngineState.sessionPhase === 'action_summary' && apiEngineState.activeActionSummary) {
      const summary = apiEngineState.activeActionSummary;
      const resultLines = [
        summary.resultExplanation,
        summary.diminishingReturnNotice,
        summary.resourcePressureNotice,
      ].filter(Boolean).join(' ');
      return {
        id: 'action_or_choice_result',
        text: resultLines || `${summary.actionName}已结束（${summary.durationLabel}）。`,
        title: '本期小结',
        choices: [],
      };
    }
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
    if (gameEngineComposable.engineState.pendingPeriodSummary) {
      const summary = gameEngineComposable.engineState.pendingPeriodSummary;
      return {
        id: 'period_summary',
        text: summary.narrativeText,
        title: summary.headline,
        choices: [],
      };
    }
    if (gameEngineComposable.engineState.isPassiveProgressionMode && gameEngineComposable.engineState.passiveNarrative) {
      const passive = gameEngineComposable.engineState.passiveNarrative;
      return {
        id: 'passive_progression',
        text: passive.text,
        title: passive.title,
        choices: [],
      };
    }
    if (gameEngineComposable.engineState.isActiveActionMode) {
      const age = gameEngine.getGameState().player?.age ?? 0;
      const placeholder = resolvePlanningPlaceholderText(age);
      return {
        id: 'active_planning',
        text: placeholder.text,
        title: placeholder.title,
        choices: [],
      };
    }
    if (gameEngineComposable.engineState.showingDisturbanceNarrative) {
      const narrative = gameEngineComposable.engineState.pendingDisturbanceNarrative;
      return {
        id: 'disturbance_narrative',
        text: narrative?.bodyText ?? '江湖中泛起一丝涟漪。',
        title: narrative?.title ?? '江湖扰动',
        choices: [],
      };
    }
    if (gameEngineComposable.engineState.lastActiveActionSummary) {
      const summary = gameEngineComposable.engineState.lastActiveActionSummary;
      const resultLines = [
        summary.resultExplanation,
        summary.diminishingReturnNotice,
        summary.resourcePressureNotice,
      ].filter(Boolean).join(' ');
      return {
        id: 'action_or_choice_result',
        text: resultLines || `${summary.actionName}已结束（${summary.durationLabel}）。`,
        title: '本期小结',
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
  if (apiMode && apiEngineState.sessionPhase === 'active_planning') {
    return apiEngineState.planningOptions.map(option => ({
      id: `active_${option.actionId}`,
      text: option.text,
      description: `${option.description}｜收益：${option.rewardSummary}｜消耗：${option.costSummary}｜风险：${option.riskLevel}`,
      actionId: option.actionId,
      isActiveAction: true,
    }));
  }
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

const apiStoryEventAutomatic = computed(
  () =>
    apiEngineState.sessionPhase === 'story_event' &&
    apiEngineState.currentEvent?.isAutomatic === true &&
    apiEngineState.availableChoices.length === 0,
);

const apiNeedsProgressionAck = computed(
  () =>
    apiEngineState.sessionPhase === 'action_summary' ||
    apiEngineState.sessionPhase === 'disturbance_narrative' ||
    apiEngineState.sessionPhase === 'period_summary' ||
    apiEngineState.sessionPhase === 'passive_progression' ||
    apiStoryEventAutomatic.value,
);

const apiPlayer = computed(() => activeSession.value?.player ?? null);
const apiLifeMemory = computed(() => activeSession.value?.lifeMemory ?? null);

const endingPlayer = computed(() => {
  if (apiMode) {
    const terminal = activeSession.value?.terminal;
    const player = activeSession.value?.player;
    if (terminal) {
      return {
        name: player?.name ?? (apiPlayerName.value || '侠客'),
        age: terminal.age,
        alive: terminal.isAlive,
        deathReason: terminal.deathReason ?? terminal.ending?.name ?? '人生落幕',
        title: player?.title ?? null,
        affiliation: player?.affiliation ?? null,
        martialPower: player?.martialPower ?? 0,
        chivalry: player?.chivalry ?? 0,
        money: player?.money ?? 0,
      };
    }
    return null;
  }
  return gameEngine.getGameState().player ?? null;
});

const endingLifeMemory = computed(() => {
  if (apiMode) return apiLifeMemory.value;
  return deriveLifeMemorySummary(gameEngine.getGameState());
});

const endingInfo = computed(() => {
  const ending = apiMode
    ? activeSession.value?.terminal?.ending
    : gameEngine.getGameState().ending;
  return toEndingPayload(ending);
});

const onChoice = (choice: { id: string; text: string; actionId?: string; isActiveAction?: boolean; locked?: boolean }) => {
  if (apiMode) {
    if (choice.isActiveAction) {
      void apiHandleActiveAction(choice.actionId ?? choice.id.replace(/^active_/, ''));
      return;
    }
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

const onApiProgressionAck = () => {
  void apiHandleProgressionAck();
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
      :api-active-action-summary="apiMode ? apiEngineState.activeActionSummary : null"
      :api-disturbance-narrative="apiMode ? apiEngineState.disturbanceNarrative : null"
      :api-session-phase="apiMode ? apiEngineState.sessionPhase : null"
      :api-story-event-automatic="apiMode ? apiStoryEventAutomatic : false"
      :api-needs-progression-ack="apiMode ? apiNeedsProgressionAck : false"
      :api-period-summary="apiMode ? apiEngineState.periodSummary : null"
      :api-player="apiMode ? apiPlayer : null"
      :api-life-memory="apiMode ? apiLifeMemory : null"
      @choice="onChoice"
      @manual-save="onApiManualSave"
      @api-progression-ack="onApiProgressionAck"
    />
    <EndingScreen
      v-else
      :player="endingPlayer"
      :life-memory="endingLifeMemory"
      :ending="endingInfo"
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
