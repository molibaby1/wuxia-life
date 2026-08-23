<template>
  <div class="game-screen">
    <header class="top-status card">
      <div class="status-row status-row-top">
        <div class="player-block">
          <span class="name">{{ player?.name }}</span>
        </div>
        <div class="save-controls">
          <button class="save-btn" @click="saveGame">保存</button>
          <button v-if="!apiMode" class="save-btn" @click="loadLatestSave">读档</button>
        </div>
      </div>

      <div class="status-row">
        <span class="age-line">{{ player?.age }}岁 · {{ getCurrentDate() }}</span>
      </div>

      <div v-if="mainScreenModel.stageTags.length > 0" class="status-row status-tags">
        <span
          v-for="tag in mainScreenModel.stageTags"
          :key="tag"
          class="status-tag"
        >
          {{ tag }}
        </span>
      </div>

      <div class="status-row status-resources">
        <div
          v-for="item in mainScreenModel.topResources"
          :key="item.key"
          class="resource-item"
        >
          <span class="resource-label">
            {{ item.label }}<template v-if="item.description">·{{ item.description }}</template>
          </span>
          <span class="resource-value">{{ item.value }}</span>
        </div>
      </div>
    </header>

    <div class="content-area">
      <div class="flow-layout">
        <aside
          v-if="progressionEchoCards.length > 0"
          class="progression-echo card"
          aria-live="polite"
          aria-label="上一阶段结果"
        >
          <p class="progression-echo-kicker">上一阶段结果</p>
          <article
            v-for="card in progressionEchoCards"
            :key="card.id"
            class="progression-echo-card"
          >
            <div class="progression-echo-heading">
              <span v-if="card.sourceLabel">{{ card.sourceLabel }}</span>
              <strong>{{ card.title }}</strong>
            </div>
            <p v-if="card.body" class="progression-echo-body">{{ card.body }}</p>
            <ul v-if="card.metaLines?.length" class="progression-echo-meta">
              <li v-for="line in card.metaLines" :key="line">{{ line }}</li>
            </ul>
          </article>
        </aside>

      <section v-if="currentNode" class="story-card card">
        <div class="event-header">
          <div>
            <p class="event-kicker">当前经历</p>
            <h3 class="event-title">
              {{ showPlanningIntroTitle ? currentNode.title : currentNode.title || '江湖当前进展' }}
            </h3>
          </div>
        </div>
        <p v-if="!hasCanonicalProgressionCard" class="story-text">
          {{ currentNode.text }}
        </p>

        <div v-if="disturbanceNarrativeDisplay" class="progression-card disturbance-narrative-card">
          <span class="progression-source-label">{{ disturbanceNarrativeDisplay.sourceLabel }}</span>
          <h3
            v-if="disturbanceNarrativeDisplay.title !== currentNode.title"
            class="progression-card-title"
          >
            {{ disturbanceNarrativeDisplay.title }}
          </h3>
          <p class="disturbance-body">{{ disturbanceNarrativeDisplay.bodyText }}</p>
          <p class="progression-meta">缘起：{{ disturbanceNarrativeDisplay.sourceActionName }}</p>
          <p class="progression-meta">{{ disturbanceNarrativeDisplay.impactSummary }}</p>
          <p class="progression-hint">{{ disturbanceNarrativeDisplay.returnToPlanHint }}</p>
        </div>

        <div v-if="!isAutoPlaying && availableChoices.length > 0" class="choices-area">
          <button
            v-for="choice in availableChoices"
            :key="choice.id"
            class="choice-btn btn"
            :class="{ 'choice-locked': choice.locked }"
            @click="makeChoice(choice)"
          >
            <span class="choice-text">{{ choice.text }}</span>
            <span v-if="choice.locked" class="lock-hint">🔒 {{ choice.lockReason || '条件不足' }}</span>
            <span v-else-if="choice.description" class="choice-desc">{{ choice.description }}</span>
          </button>
        </div>
        <div v-if="isAutoPlaying" class="auto-play-indicator">
          <span class="loading-dot"></span>
          <span class="loading-dot"></span>
          <span class="loading-dot"></span>
        </div>
        <div v-else class="event-actions">
          <button
            v-if="apiAutomaticAdvanceError"
            class="continue-btn retry-advance-btn btn"
            type="button"
            @click="retryAutomaticAdvance"
          >
            重试进入下一阶段
          </button>
          <button v-if="showContinueButton" class="continue-btn btn" @click="continueToNext">
            继续
          </button>
          <div class="secondary-action-row">
            <button class="secondary-btn" type="button" @click="scrollToSummary">
              人生摘要
            </button>
            <button class="secondary-btn" type="button" @click="openFullStats">
              全部属性
            </button>
          </div>
        </div>
      </section>
      </div>

      <MainScreenLifeSummary
        ref="summarySectionRef"
        class="summary-section"
        :current-goal-summary="mainScreenModel.currentGoalSummary"
        :affiliation-summary="mainScreenModel.affiliationSummary"
        :asset-summary="mainScreenModel.assetSummary"
        :experience-summary="mainScreenModel.experienceSummary"
        :practice-summary="mainScreenModel.practiceSummary"
        :milestone-summary="mainScreenModel.milestoneSummary"
        :milestone-prospect-summary="mainScreenModel.milestoneProspectSummary"
        :risk-summary="mainScreenModel.riskSummary"
        :tendency-summary="mainScreenModel.tendencySummary"
      />

      <MainScreenStatsPanel
        ref="statsPanelRef"
        :core-stats="mainScreenModel.coreStats"
        :groups="mainScreenModel.fullStatGroups"
      />

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { gameEngine } from '../core/GameEngineIntegration';
import { useNewGameEngine } from '../composables/useNewGameEngine';
import MainScreenLifeSummary from './MainScreenLifeSummary.vue';
import MainScreenStatsPanel from './MainScreenStatsPanel.vue';
import { buildMainScreenModel, type MainScreenPlayer } from './mainScreenModel';
import {
  buildLifeMemoryFeedbackOverlayCard,
  collectNewLifeMemoryFeedback,
  type LifeMemoryFeedbackItem,
} from './lifeMemoryFeedback';
import { deriveLifeMemorySummary } from '../core/deriveLifeMemorySummary';
import { getOwnedAssets } from '../core/assetOwnership';
import type { StoryChoice } from '../types';

import type { DisturbanceNarrativeDisplay } from '../types/activeActionTypes';
import type { SessionPhase, PlayerSummaryDto } from '../contracts/sessionProgression';
import type { LifeMemorySummary } from '../types/lifeMemory';
import type {
  ProgressionOverlayCard,
  ProgressionOverlayPayload,
} from '../types/progressionOverlay';

const props = defineProps<{
  currentNode: any;
  availableChoices: StoryChoice[];
  isAutoPlaying: boolean;
  apiMode?: boolean;
  apiDisturbanceNarrative?: DisturbanceNarrativeDisplay | null;
  apiSessionPhase?: SessionPhase | null;
  apiStoryEventAutomatic?: boolean;
  apiNeedsProgressionAck?: boolean;
  apiPlayer?: PlayerSummaryDto | null;
  apiLifeMemory?: LifeMemorySummary | null;
  progressionOverlay?: ProgressionOverlayPayload | null;
  apiAutomaticAdvanceError?: string | null;
}>();

const emit = defineEmits<{
  (e: 'choice', choice: StoryChoice): void;
  (e: 'manual-save'): void;
  (e: 'api-progression-ack'): void;
}>();

const { engineState, continueProgressionFlow, saveCurrentGame, loadGameFromSave, getAllSaves } =
  useNewGameEngine();

const disturbanceNarrativeDisplay = computed(() => {
  if (props.apiMode) {
    if (props.apiSessionPhase !== 'disturbance_narrative') return null;
    return props.apiDisturbanceNarrative ?? null;
  }
  if (!engineState.showingDisturbanceNarrative) return null;
  return engineState.pendingDisturbanceNarrative;
});

const hasCanonicalProgressionCard = computed(() => {
  return Boolean(
    disturbanceNarrativeDisplay.value,
  );
});

let continueClickLocked = false;

const continueToNext = () => {
  if (continueClickLocked || props.isAutoPlaying) return;
  continueClickLocked = true;
  if (props.apiMode) {
    if (props.apiNeedsProgressionAck) {
      emit('api-progression-ack');
    }
  } else {
    continueProgressionFlow();
  }
  void nextTick(() => {
    continueClickLocked = false;
  });
};

const retryAutomaticAdvance = () => {
  if (props.isAutoPlaying || !props.apiAutomaticAdvanceError) return;
  emit('api-progression-ack');
};

const showContinueButton = computed(() => {
  if (props.isAutoPlaying) return false;
  if (props.apiAutomaticAdvanceError) return false;
  if (props.availableChoices.length > 0) return false;
  if (props.apiMode) {
    return props.apiNeedsProgressionAck === true;
  }
  if (engineState.isActiveActionMode) return false;
  return (
    engineState.isPassiveProgressionMode ||
    engineState.showingDisturbanceNarrative ||
    !!props.currentNode
  );
});

const isApiPlanningPhase = computed(
  () => props.apiMode && props.apiSessionPhase === 'active_planning',
);

const showPlanningIntroTitle = computed(() => {
  if (!props.currentNode?.title?.trim()) return false;
  if (props.currentNode.id !== 'active_planning') return false;
  return isApiPlanningPhase.value || engineState.isActiveActionMode;
});

// 使用 computed 直接获取最新的游戏状态，确保响应式更新
const player = computed(() => {
  if (props.apiMode && props.apiPlayer) {
    return props.apiPlayer;
  }
  const state = gameEngine.getGameState();
  return state.player;
});

const attributePanelPlayer = computed((): MainScreenPlayer => {
  if (props.apiMode && props.apiPlayer) {
    const p = props.apiPlayer;
    return {
      martialPower: p.martialPower,
      chivalry: p.chivalry,
      constitution: p.constitution,
      wealthCapacity: p.wealthCapacity,
      affiliation: p.affiliation,
      title: p.title,
      reputation: p.reputation,
      money: p.money,
      knowledge: p.knowledge,
      charisma: p.charisma,
      businessAcumen: p.businessAcumen,
      influence: p.influence,
      connections: p.connections,
      ownedAssets: p.ownedAssets,
      lifeStates: p.lifeStates,
    };
  }
  const state = gameEngine.getGameState();
  return {
    ...state.player,
    ownedAssets: getOwnedAssets(state.facts),
  };
});

const lifeMemorySummary = computed(() => {
  if (props.apiMode && props.apiLifeMemory) {
    return props.apiLifeMemory;
  }
  void engineState.lastChoiceFeedback;
  void engineState.currentEvent;
  return deriveLifeMemorySummary(gameEngine.getGameState());
});

const lifeMemoryFeedbackItems = ref<LifeMemoryFeedbackItem[]>([]);
const lifeMemoryFeedbackCard = ref<ProgressionOverlayCard | null>(null);
const seenLifeMemoryFeedbackIds = new Set<string>();
let hasLifeMemoryBaseline = false;
let suppressNextLifeMemoryFeedback = false;

const progressionEchoCards = computed(() => [
  ...(props.progressionOverlay?.cards ?? []),
  ...(lifeMemoryFeedbackCard.value ? [lifeMemoryFeedbackCard.value] : []),
]);

watch(
  () => props.progressionOverlay,
  () => {
    lifeMemoryFeedbackItems.value = [];
    lifeMemoryFeedbackCard.value = null;
  },
  { flush: 'sync' },
);

watch(
  lifeMemorySummary,
  (current, previous) => {
    if (!hasLifeMemoryBaseline || suppressNextLifeMemoryFeedback) {
      if (suppressNextLifeMemoryFeedback) {
        seenLifeMemoryFeedbackIds.clear();
        lifeMemoryFeedbackItems.value = [];
        lifeMemoryFeedbackCard.value = null;
      }
      for (const item of collectNewLifeMemoryFeedback(null, current)) {
        seenLifeMemoryFeedbackIds.add(item.id);
      }
      suppressNextLifeMemoryFeedback = false;
      hasLifeMemoryBaseline = true;
      return;
    }

    const freshItems = collectNewLifeMemoryFeedback(previous, current)
      .filter(item => !seenLifeMemoryFeedbackIds.has(item.id));
    if (freshItems.length === 0) return;

    for (const item of freshItems) {
      seenLifeMemoryFeedbackIds.add(item.id);
    }
    lifeMemoryFeedbackItems.value = [...lifeMemoryFeedbackItems.value, ...freshItems];
    lifeMemoryFeedbackCard.value = buildLifeMemoryFeedbackOverlayCard(
      lifeMemoryFeedbackItems.value,
    );
  },
  { immediate: true },
);

const mainScreenModel = computed(() =>
  buildMainScreenModel(attributePanelPlayer.value, lifeMemorySummary.value),
);

const summarySectionRef = ref<InstanceType<typeof MainScreenLifeSummary> | HTMLElement | null>(null);
const statsPanelRef = ref<InstanceType<typeof MainScreenStatsPanel> | null>(null);

const scrollToSummary = async () => {
  await nextTick();
  const element = summarySectionRef.value as unknown as { $el?: HTMLElement } | HTMLElement | null;
  const target = element instanceof HTMLElement ? element : element?.$el;
  target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const openFullStats = async () => {
  statsPanelRef.value?.openDetails();
  await nextTick();
  const element = statsPanelRef.value?.$el as HTMLElement | undefined;
  element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const getCurrentDate = () => {
  if (props.apiMode && props.apiPlayer) {
    const p = props.apiPlayer;
    return `${p.currentYear}年${p.currentMonth}月${p.currentDay}日`;
  }
  const state = gameEngine.getGameState();
  const time = state.currentTime || { year: 1, month: 1, day: 1 };
  return `${time.year}年${time.month}月${time.day}日`;
};

const makeChoice = (choice: StoryChoice) => {
  emit('choice', choice);
};

const saveGame = () => {
  if (props.apiMode) {
    emit('manual-save');
    return;
  }
  const defaultName = `手动存档-${player.value?.name || '侠客'}-${player.value?.age || 0}岁`;
  const inputName = window.prompt('请输入存档名称', defaultName);
  if (inputName === null) {
    return;
  }
  saveCurrentGame(inputName);
  window.alert('存档完成');
};

const loadLatestSave = () => {
  const saves = getAllSaves();
  if (saves.length === 0) {
    window.alert('暂无可加载存档');
    return;
  }
  const preview = saves
    .slice(0, 5)
    .map((save, index) => `${index + 1}. ${save.name}（${new Date(save.timestamp).toLocaleString('zh-CN')}）`)
    .join('\n');
  const selected = window.prompt(`请输入要读取的存档序号（默认 1）:\n${preview}`, '1');
  if (selected === null) {
    return;
  }
  const parsed = Number.parseInt(selected, 10);
  const saveIndex = Number.isNaN(parsed) || parsed < 1 ? 0 : parsed - 1;
  const targetSave = saves[saveIndex] || saves[0];
  if (!targetSave) {
    window.alert('未找到对应存档');
    return;
  }
  suppressNextLifeMemoryFeedback = true;
  const loaded = loadGameFromSave(targetSave.id);
  if (!loaded) {
    suppressNextLifeMemoryFeedback = false;
  }
  window.alert(loaded ? `已加载：${targetSave.name}` : '读取失败，存档可能不兼容');
};
</script>

<style scoped>
.game-screen {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: max(12px, env(safe-area-inset-top)) 16px max(16px, env(safe-area-inset-bottom));
  background: linear-gradient(180deg, #f6f0e3 0%, #efe4d2 100%);
}

.top-status {
  padding: 10px 14px;
  border-radius: 20px;
  background: linear-gradient(135deg, #6f4b1f 0%, #8c6330 100%);
  color: #fffaf1;
}

.status-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.status-row + .status-row {
  margin-top: 5px;
}

.status-row-top {
  justify-content: space-between;
  align-items: flex-start;
}

.player-block {
  min-width: 0;
}

.save-controls {
  display: flex;
  gap: 6px;
}

.save-btn {
  min-height: 32px;
  border: 1px solid rgba(255, 245, 230, 0.4);
  background: rgba(255, 250, 241, 0.12);
  color: #fffaf1;
  border-radius: 10px;
  padding: 0 10px;
  font-size: 12px;
  cursor: pointer;
}

.save-btn:hover {
  background: rgba(255, 255, 255, 0.25);
}

.name {
  font-size: 22px;
  font-weight: 600;
  line-height: 1.1;
}

.age-line {
  font-size: 13px;
  line-height: 1.25;
  color: rgba(255, 250, 241, 0.88);
}

.status-tags {
  gap: 6px;
}

.status-tag {
  min-height: 20px;
  display: inline-flex;
  align-items: center;
  padding: 0 8px;
  border-radius: 10px;
  font-size: 11px;
  color: rgba(255, 250, 241, 0.88);
  background: rgba(255, 250, 241, 0.1);
  border: 1px solid rgba(255, 245, 230, 0.16);
}

.status-resources {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}

.resource-item {
  min-height: 30px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 5px 8px;
  border-radius: 999px;
  background: rgba(255, 250, 241, 0.08);
  border: 1px solid rgba(255, 245, 230, 0.12);
}

.resource-label {
  font-size: 11px;
  line-height: 1;
  color: rgba(255, 250, 241, 0.68);
}

.resource-value {
  font-size: 14px;
  line-height: 1;
  font-weight: 700;
  color: #fffaf1;
}

.content-area {
  flex: 1;
  display: grid;
  gap: 12px;
}

.flow-layout {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.progression-echo {
  box-sizing: border-box;
  max-height: 110px;
  overflow-y: auto;
  padding: 10px 12px;
  border: 1px solid rgba(139, 105, 20, 0.2);
  border-left: 4px solid #8b6914;
  border-radius: 14px;
  background: #fff9e9;
  scrollbar-width: thin;
}

.progression-echo-kicker {
  margin: 0 0 6px;
  color: #8b6914;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
}

.progression-echo-card + .progression-echo-card {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed rgba(139, 105, 20, 0.2);
}

.progression-echo-heading {
  display: flex;
  align-items: baseline;
  gap: 8px;
  color: var(--primary-color);
  font-size: 13px;
}

.progression-echo-heading span {
  color: #8b6914;
  font-size: 11px;
  font-weight: 700;
}

.progression-echo-body {
  margin: 4px 0 0;
  color: var(--text-color);
  font-size: 13px;
  line-height: 1.45;
}

.progression-echo-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
  margin: 5px 0 0;
  padding: 0;
  list-style: none;
  color: #6b5b3a;
  font-size: 11px;
  line-height: 1.4;
}

.story-card {
  position: relative;
  padding: 16px;
  border-radius: 20px;
  background: #fffdf7;
  border: 1px solid rgba(139, 105, 20, 0.12);
  overflow: visible;
}

.event-header {
  margin-bottom: 10px;
}

.event-kicker {
  margin: 0 0 6px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #8b6914;
}

.event-title {
  margin: 0;
  font-size: 20px;
  color: var(--primary-color);
}

.story-text {
  font-size: 16px;
  line-height: 1.7;
  color: var(--text-color);
  margin: 0;
}

.auto-play-indicator {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  margin-top: 16px;
}

.loading-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--primary-color);
  animation: bounce 1.4s infinite ease-in-out both;
}

.loading-dot:nth-child(1) {
  animation-delay: -0.32s;
}

.loading-dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.choices-area {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.choice-btn.choice-locked {
  opacity: 0.65;
  border-style: dashed;
}

.lock-hint {
  display: block;
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.choice-desc {
  display: block;
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.choice-btn {
  text-align: left;
  color: var(--primary-color) !important;
}

.progression-card {
  margin-top: 1rem;
  padding: 14px 16px;
  border-radius: 8px;
  animation: fadeIn 0.3s ease-out;
}

.disturbance-narrative-card {
  background: linear-gradient(135deg, rgba(70, 130, 180, 0.1), rgba(139, 90, 43, 0.06));
  border-left: 4px solid #4682b4;
}

.progression-source-label {
  display: inline-block;
  font-size: 12px;
  font-weight: 700;
  color: #8b6914;
  margin-bottom: 8px;
  letter-spacing: 0.05em;
}

.progression-card-title {
  margin: 0 0 10px;
  font-size: 17px;
  color: var(--primary-color);
}

.progression-meta,
.disturbance-body,
.progression-hint {
  margin: 8px 0 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-color);
}

.progression-hint {
  color: #5c4a1a;
  font-style: italic;
}

.event-actions {
  position: sticky;
  bottom: 12px;
  z-index: 2;
  margin-top: 18px;
  padding-top: 10px;
  display: grid;
  gap: 10px;
  background: linear-gradient(180deg, rgba(255, 253, 247, 0), #fffdf7 18%);
}

.continue-btn {
  min-height: 50px;
  width: 100%;
  padding: 0 18px;
  font-size: 16px;
  font-weight: 700;
  background: linear-gradient(135deg, var(--primary-color), #8b5a2b);
  color: white !important;
  border: none;
  border-radius: 14px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.continue-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 90, 43, 0.3);
}

.secondary-action-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.secondary-btn {
  min-height: 36px;
  padding: 0 12px;
  border-radius: 12px;
  border: 1px solid rgba(139, 105, 20, 0.22);
  background: #fff;
  color: #8b6914;
  font-size: 13px;
  cursor: pointer;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 600px) {
  .save-controls {
    margin-left: auto;
  }

  .story-text,
  .progression-echo-body {
    font-size: 15px;
  }

  .status-resources,
  .secondary-action-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 768px) {
  .game-screen {
    max-width: 1040px;
    margin: 0 auto;
  }

  .flow-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(260px, 0.42fr);
    align-items: start;
  }

  .story-card {
    grid-column: 1;
    grid-row: 1;
  }

  .story-card:only-child {
    grid-column: 1 / -1;
  }

  .progression-echo {
    grid-column: 2;
    grid-row: 1;
    max-height: none;
    position: sticky;
    top: 12px;
  }

  .choices-area {
    max-width: 100%;
  }
}

</style>
