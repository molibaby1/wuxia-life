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

        <div v-if="periodSummaryDisplay" class="progression-card period-summary-card">
          <span class="progression-source-label">{{ periodSummaryDisplay.sourceLabel }}</span>
          <h3
            v-if="periodSummaryDisplay.headline !== currentNode.title"
            class="progression-card-title"
          >
            {{ periodSummaryDisplay.headline }}
          </h3>
          <p class="disturbance-body">{{ periodSummaryDisplay.body }}</p>
          <p class="progression-meta">{{ periodSummaryDisplay.statDeltaSummary }}</p>
          <p class="progression-hint">本期已落幕，点击继续见证下一季成长。</p>
        </div>

        <div v-if="activeActionSummaryDisplay" class="progression-card active-action-summary-card">
          <span class="progression-source-label">{{ activeActionSummaryDisplay.sourceLabel }}</span>
          <h3
            v-if="activeActionSummaryDisplay.actionName !== currentNode.title"
            class="progression-card-title"
          >
            {{ activeActionSummaryDisplay.actionName }}
          </h3>
          <dl class="progression-detail-list">
            <div><dt>耗时</dt><dd>{{ activeActionSummaryDisplay.durationLabel }}</dd></div>
            <div><dt>收益</dt><dd>{{ activeActionSummaryDisplay.rewardSummary }}</dd></div>
            <div><dt>消耗</dt><dd>{{ activeActionSummaryDisplay.costSummary }}</dd></div>
            <div><dt>风险</dt><dd>{{ activeActionSummaryDisplay.riskSummary }}</dd></div>
          </dl>
          <p class="progression-meta">{{ activeActionSummaryDisplay.appliedDeltaSummary }}</p>
          <div v-if="activeActionLongTermImpacts.length > 0" class="feedback-group active-action-long-term">
            <p class="feedback-group-title">长期影响</p>
            <ul class="feedback-list">
              <li v-for="(line, index) in activeActionLongTermImpacts" :key="`active-lt-${index}`">
                {{ line }}
              </li>
            </ul>
          </div>
          <p class="progression-hint">{{ activeActionSummaryDisplay.nextStepHint }}</p>
        </div>

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

        <div v-if="displayedNarrative" class="outcome-section">
          <span v-if="storyEventSourceLabel" class="progression-source-label">{{ storyEventSourceLabel }}</span>
          <p class="outcome-text">{{ displayedNarrative }}</p>
          <p v-if="showNarrativeFallbackHint" class="outcome-fallback-hint">
            反馈细节暂不完整，后续影响仍在推进。
          </p>
          <div v-if="hasStructuredFeedback" class="feedback-structured">
            <div v-if="visibleStatImpacts.length > 0" class="feedback-group">
              <p class="feedback-group-title">数值影响</p>
              <ul class="feedback-list">
                <li v-for="impact in visibleStatImpacts" :key="`stat-${impact.stat}`">
                  {{ getStatName(String(impact.label || impact.stat)) }} {{ formatDelta(impact.delta) }}
                </li>
              </ul>
            </div>
            <div v-if="visibleRelationshipImpacts.length > 0" class="feedback-group">
              <p class="feedback-group-title">关系影响</p>
              <ul class="feedback-list">
                <li
                  v-for="impact in visibleRelationshipImpacts"
                  :key="`relation-${impact.relationId}`"
                >
                  {{ impact.relationName || '某位关系人' }} {{ formatDelta(impact.delta) }}
                </li>
              </ul>
            </div>
            <div v-if="visibleLongTermFlags.length > 0" class="feedback-group">
              <p class="feedback-group-title">长期影响</p>
              <ul class="feedback-list">
                <li v-for="flag in visibleLongTermFlags" :key="`flag-${flag.flag}`">
                  {{ describeFlag(flag.flag, flag.value) }}
                </li>
              </ul>
            </div>
          </div>
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

      <MainScreenLifeSummary
        ref="summarySectionRef"
        class="summary-section"
        :current-goal-summary="mainScreenModel.currentGoalSummary"
        :affiliation-summary="mainScreenModel.affiliationSummary"
        :experience-summary="mainScreenModel.experienceSummary"
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
import { computed, nextTick, ref } from 'vue';
import { gameEngine } from '../core/GameEngineIntegration';
import { useNewGameEngine } from '../composables/useNewGameEngine';
import MainScreenLifeSummary from './MainScreenLifeSummary.vue';
import MainScreenStatsPanel from './MainScreenStatsPanel.vue';
import { buildMainScreenModel, type MainScreenPlayer } from './mainScreenModel';
import { deriveLifeMemorySummary } from '../core/deriveLifeMemorySummary';
import type { StoryChoice } from '../types';
import { formatLongTermFlag } from '../utils/playerFacingLabels';

import type {
  ActiveActionSummaryDisplay,
  DisturbanceNarrativeDisplay,
  PeriodSummaryDisplay,
} from '../types/activeActionTypes';
import type { SessionPhase, PlayerSummaryDto } from '../contracts/sessionProgression';
import type { LifeMemorySummary } from '../types/lifeMemory';

const props = defineProps<{
  currentNode: any;
  availableChoices: StoryChoice[];
  isAutoPlaying: boolean;
  apiMode?: boolean;
  apiActiveActionSummary?: ActiveActionSummaryDisplay | null;
  apiDisturbanceNarrative?: DisturbanceNarrativeDisplay | null;
  apiSessionPhase?: SessionPhase | null;
  apiStoryEventAutomatic?: boolean;
  apiNeedsProgressionAck?: boolean;
  apiPeriodSummary?: PeriodSummaryDisplay | null;
  apiPlayer?: PlayerSummaryDto | null;
  apiLifeMemory?: LifeMemorySummary | null;
}>();

const emit = defineEmits<{
  (e: 'choice', choice: StoryChoice): void;
  (e: 'manual-save'): void;
  (e: 'api-progression-ack'): void;
}>();

// 使用 useNewGameEngine 获取 lastOutcomeText
const { engineState, continueProgressionFlow, saveCurrentGame, loadGameFromSave, getAllSaves } =
  useNewGameEngine();

const lastOutcomeText = computed(() => {
  return engineState.lastOutcomeText;
});

const lastChoiceFeedback = computed(() => {
  return engineState.lastChoiceFeedback;
});

const visibleStatImpacts = computed(() => {
  return (lastChoiceFeedback.value?.player.statImpacts || []).filter(
    impact => impact.visibility === 'player' && impact.delta !== 0,
  );
});

const visibleRelationshipImpacts = computed(() => {
  return (lastChoiceFeedback.value?.player.relationshipImpacts || []).filter(
    impact => impact.visibility === 'player' && impact.delta !== 0,
  );
});

const visibleLongTermFlags = computed(() => {
  return (lastChoiceFeedback.value?.player.longTermFlags || []).filter(
    flag => flag.visibility === 'player',
  );
});

const hasStructuredFeedback = computed(() => {
  return (
    visibleStatImpacts.value.length > 0 ||
    visibleRelationshipImpacts.value.length > 0 ||
    visibleLongTermFlags.value.length > 0
  );
});

const periodSummaryDisplay = computed(() => {
  if (props.apiMode) {
    if (props.apiSessionPhase !== 'period_summary') return null;
    return props.apiPeriodSummary ?? null;
  }
  return engineState.pendingPeriodSummary;
});

const activeActionSummaryDisplay = computed(() => {
  if (periodSummaryDisplay.value) return null;
  if (props.apiMode) {
    if (props.apiSessionPhase === 'disturbance_narrative') return null;
    return props.apiActiveActionSummary ?? null;
  }
  if (engineState.showingDisturbanceNarrative) return null;
  return engineState.lastActiveActionSummary;
});

const activeActionLongTermImpacts = computed(() => {
  return activeActionSummaryDisplay.value?.longTermImpactLines ?? [];
});

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
    periodSummaryDisplay.value ||
      activeActionSummaryDisplay.value ||
      disturbanceNarrativeDisplay.value,
  );
});

const storyEventSourceLabel = computed(() => {
  if (hasCanonicalProgressionCard.value) return null;
  if (!props.currentNode?.id || props.currentNode.id.startsWith('active_')) return null;
  if (props.currentNode.id === 'action_or_choice_result' || props.currentNode.id === 'disturbance_narrative') {
    return null;
  }
  const narrative = lastChoiceFeedback.value?.player.narrativeResult?.trim();
  if (!narrative) return null;
  return '剧情事件';
});

const displayedNarrative = computed(() => {
  if (hasCanonicalProgressionCard.value) {
    return null;
  }
  const narrative = lastChoiceFeedback.value?.player.narrativeResult?.trim();
  if (narrative) {
    return narrative;
  }
  if (lastOutcomeText.value) {
    return lastOutcomeText.value;
  }
  return null;
});

const showNarrativeFallbackHint = computed(() => {
  if (!displayedNarrative.value) {
    return false;
  }
  const fallbackUsed = lastChoiceFeedback.value?.diagnostic.fallbackUsed ?? false;
  return fallbackUsed || !hasStructuredFeedback.value;
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

const showContinueButton = computed(() => {
  if (props.isAutoPlaying) return false;
  if (props.availableChoices.length > 0) return false;
  if (props.apiMode) {
    return props.apiNeedsProgressionAck === true;
  }
  if (engineState.isActiveActionMode) return false;
  return (
    engineState.isPassiveProgressionMode ||
    !!engineState.pendingPeriodSummary ||
    !!engineState.lastActiveActionSummary ||
    engineState.showingDisturbanceNarrative ||
    !!engineState.lastOutcomeText ||
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
      comprehension: p.comprehension,
      affiliation: p.affiliation,
      title: p.title,
      reputation: p.reputation,
      money: p.money,
      knowledge: p.knowledge,
      charisma: p.charisma,
      businessAcumen: p.businessAcumen,
      influence: p.influence,
      connections: p.connections,
      lifeStates: p.lifeStates,
    };
  }
  return gameEngine.getGameState().player;
});

const lifeMemorySummary = computed(() => {
  if (props.apiMode && props.apiLifeMemory) {
    return props.apiLifeMemory;
  }
  void engineState.lastChoiceFeedback;
  void engineState.currentEvent;
  return deriveLifeMemorySummary(gameEngine.getGameState());
});

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

const formatDelta = (value: number) => {
  if (value > 0) {
    return `+${value}`;
  }
  return `${value}`;
};

const describeFlag = (flag: string, value: boolean) => formatLongTermFlag(flag, value);

const getStatName = (stat: string): string => {
  const statNames: Record<string, string> = {
    martialPower: '功力',
    chivalry: '侠义',
    charisma: '魅力',
    constitution: '体魄',
    comprehension: '悟性',
    reputation: '名望',
    influence: '影响力',
    connections: '人脉',
    knowledge: '学识',
    businessAcumen: '经营',
    money: '银两',
  };
  return statNames[stat] || stat;
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
  const loaded = loadGameFromSave(targetSave.id);
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

.outcome-display {
  margin-top: 1rem;
  padding: 1rem;
  background: linear-gradient(135deg, rgba(139, 90, 43, 0.1), rgba(34, 139, 34, 0.1));
  border-left: 4px solid var(--primary-color);
  border-radius: 4px;
  animation: fadeIn 0.5s ease-out;
}

.outcome-text {
  color: var(--text-color);
  font-size: 0.95rem;
  line-height: 1.6;
  margin: 0;
}

.progression-card {
  margin-top: 1rem;
  padding: 14px 16px;
  border-radius: 8px;
  animation: fadeIn 0.3s ease-out;
}

.active-action-summary-card {
  background: linear-gradient(135deg, rgba(34, 139, 34, 0.08), rgba(139, 90, 43, 0.1));
  border-left: 4px solid #2e7d32;
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

.progression-detail-list {
  margin: 0;
  display: grid;
  gap: 6px;
}

.progression-detail-list div {
  display: grid;
  grid-template-columns: 56px 1fr;
  gap: 8px;
  font-size: 14px;
}

.progression-detail-list dt {
  margin: 0;
  color: #8b6914;
  font-weight: 600;
}

.progression-detail-list dd {
  margin: 0;
  color: var(--text-color);
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

.outcome-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px dashed var(--border-color);
  animation: fadeIn 0.3s ease-out;
}

.outcome-fallback-hint {
  margin-top: 8px;
  color: #8b6914;
  font-size: 12px;
}

.feedback-structured {
  margin-top: 12px;
  display: grid;
  gap: 10px;
}

.feedback-group-title {
  margin: 0 0 6px;
  font-size: 12px;
  color: #8b6914;
  font-weight: 700;
}

.feedback-list {
  margin: 0;
  padding-left: 18px;
  color: var(--text-color);
  font-size: 13px;
  line-height: 1.5;
}

.feedback-line {
  margin: 0;
  color: var(--text-color);
  font-size: 13px;
  line-height: 1.5;
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
  .outcome-text {
    font-size: 15px;
  }

  .status-resources,
  .secondary-action-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 768px) {
  .game-screen {
    max-width: 720px;
    margin: 0 auto;
  }

  .choices-area {
    max-width: 100%;
  }
}

</style>
