<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, ref } from 'vue';
import SaveSlotStartScreen from './components/SaveSlotStartScreen.vue';
import { useApiGameEngine } from './composables/useApiGameEngine';
import { resolvePlanningPlaceholderText } from './data/infantPassiveNarratives';
import { webPlatformStorage } from './adapters/platform/webPlatformStorage';
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

const gameStarted = ref(false);
const pendingOverwriteSlot = ref<number | null>(null);
const apiPlayerName = ref('');
const apiGender = ref<'male' | 'female'>('male');

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
  void bootstrap();
});

const gamePhase = computed(() => {
  if (!gameStarted.value) return 'start';
  return apiEngineState.sessionPhase === 'terminal' ? 'ending' : 'playing';
});

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
  apiEngine.activeSession.value = null;
  webPlatformStorage.clearSessionAuth();
  gameStarted.value = false;
  void bootstrap();
};

const currentNode = computed(() => {
  if (apiEngineState.sessionPhase === 'period_summary' && apiEngineState.periodSummary) {
    return {
      id: 'automatic_advance_status',
      text: apiEngineState.automaticAdvanceError || '阶段已经结算，正在进入下一阶段。',
      title: apiEngineState.automaticAdvanceError ? '下一阶段暂未载入' : '正在推进',
      choices: [],
    };
  }
  if (apiEngineState.sessionPhase === 'passive_progression' && apiEngineState.passiveNarrative) {
    const passive = apiEngineState.passiveNarrative;
    return { id: 'passive_progression', text: passive.text, title: passive.title, choices: [] };
  }
  if (apiEngineState.sessionPhase === 'active_planning') {
    const age = activeSession.value?.player?.age ?? 0;
    const placeholder = resolvePlanningPlaceholderText(age);
    return { id: 'active_planning', text: placeholder.text, title: placeholder.title, choices: [] };
  }
  if (apiEngineState.sessionPhase === 'disturbance_narrative' && apiEngineState.disturbanceNarrative) {
    const narrative = apiEngineState.disturbanceNarrative;
    return { id: 'disturbance_narrative', text: narrative.bodyText, title: narrative.title, choices: [] };
  }
  if (apiEngineState.sessionPhase === 'action_summary' && apiEngineState.activeActionSummary) {
    return {
      id: 'automatic_advance_status',
      text: apiEngineState.automaticAdvanceError || '行动已经结算，正在进入下一阶段。',
      title: apiEngineState.automaticAdvanceError ? '下一阶段暂未载入' : '正在推进',
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
});

const availableChoices = computed(() => {
  if (apiEngineState.sessionPhase === 'active_planning') {
    return apiEngineState.planningOptions.map(option => ({
      id: `active_${option.actionId}`,
      text: option.text,
      description: `${option.description}｜收益：${option.rewardSummary}｜消耗：${option.costSummary}｜风险：${option.riskLevel}`,
      actionId: option.actionId,
      isActiveAction: true,
    }));
  }
  return apiEngineState.availableChoices;
});

const apiStoryEventAutomatic = computed(
  () =>
    apiEngineState.sessionPhase === 'story_event' &&
    apiEngineState.currentEvent?.isAutomatic === true &&
    apiEngineState.availableChoices.length === 0,
);

const apiNeedsProgressionAck = computed(
  () =>
    apiEngineState.sessionPhase === 'disturbance_narrative' ||
    apiEngineState.sessionPhase === 'period_summary' ||
    apiEngineState.sessionPhase === 'passive_progression' ||
    apiStoryEventAutomatic.value,
);

const progressionOverlay = computed(() => apiEngineState.progressionOverlay);

const apiPlayer = computed(() => activeSession.value?.player ?? null);
const apiLifeMemory = computed(() => activeSession.value?.lifeMemory ?? null);

const endingPlayer = computed(() => {
  const terminal = activeSession.value?.terminal;
  const player = activeSession.value?.player;
  if (!terminal) return null;
  return {
    name: player?.name ?? (apiPlayerName.value || '侠客'),
    age: terminal.age,
    alive: terminal.isAlive,
    deathReason: terminal.deathReason ?? terminal.ending?.name ?? '人生落幕',
    title: player?.title ?? null,
    affiliation: player?.affiliation ?? null,
    martialPower: player?.martialPower ?? 0,
    chivalry: player?.chivalry ?? 0,
  };
});

const endingLifeMemory = computed(() => apiLifeMemory.value);
const endingInfo = computed(() => toEndingPayload(activeSession.value?.terminal?.ending));

const onChoice = (choice: { id: string; actionId?: string; isActiveAction?: boolean }) => {
  if (choice.isActiveAction) {
    void apiHandleActiveAction(choice.actionId ?? choice.id.replace(/^active_/, ''));
    return;
  }
  void apiHandleChoice(choice);
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
    <SaveSlotStartScreen
      v-if="gamePhase === 'start'"
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
    <template v-else-if="gamePhase === 'playing'">
      <p v-if="flowMessage" class="api-failure" role="alert">{{ flowMessage }}</p>
      <GameScreen
        v-if="apiPlayer && apiLifeMemory"
        :current-node="currentNode"
        :available-choices="availableChoices"
        :is-auto-playing="apiIsProcessing"
        :api-disturbance-narrative="apiEngineState.disturbanceNarrative"
        :api-session-phase="apiEngineState.sessionPhase"
        :api-needs-progression-ack="apiNeedsProgressionAck"
        :api-player="apiPlayer"
        :api-life-memory="apiLifeMemory"
        :progression-overlay="progressionOverlay"
        :api-automatic-advance-error="apiEngineState.automaticAdvanceError"
        @choice="onChoice"
        @manual-save="onApiManualSave"
        @api-progression-ack="onApiProgressionAck"
      />
      <p v-else class="api-failure" role="alert">游戏会话数据未就绪，请返回选档界面重试。</p>
    </template>
    <EndingScreen
      v-else
      :player="endingPlayer"
      :life-memory="endingLifeMemory"
      :ending="endingInfo"
      @restart="handleRestart"
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

.api-failure {
  margin: 16px;
  padding: 12px 16px;
  border: 1px solid #a33;
  border-radius: 8px;
  color: #8d2828;
  background: #fff5f4;
}
</style>
