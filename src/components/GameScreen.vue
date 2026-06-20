<template>
  <div class="game-screen">
    <div class="header">
      <div class="player-info">
        <span class="name">{{ player?.name }}</span>
        <span class="age">{{ player?.age }}岁 (时间：{{ getCurrentDate() }})</span>
        <span v-if="player?.sect" class="sect">{{ player.sect }}</span>
      </div>
      <div class="save-controls">
        <button class="save-btn" @click="saveGame">保存</button>
        <button v-if="!apiMode" class="save-btn" @click="loadLatestSave">读档</button>
      </div>
    </div>
    
    <!-- 属性面板 -->
    <div class="attribute-section">
      <AttributePanel 
        :player="attributePanelPlayer" 
        :talents="talentDefinitions"
      />
    </div>
    
    <div class="stats-bar">
      <div class="stat-item">
        <span class="stat-label">功力</span>
        <span class="stat-value">{{ player?.martialPower }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">外功</span>
        <span class="stat-value">{{ player?.externalSkill }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">内功</span>
        <span class="stat-value">{{ player?.internalSkill }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">轻功</span>
        <span class="stat-value">{{ player?.qinggong }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">侠义</span>
        <span class="stat-value">{{ player?.chivalry }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">体魄</span>
        <span class="stat-value">{{ player?.constitution }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">悟性</span>
        <span class="stat-value">{{ player?.comprehension }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">银两</span>
        <span class="stat-value">{{ player?.money }}</span>
      </div>
    </div>

    <LifeMemoryPanel :summary="lifeMemorySummary" />

    <div class="content-area">
      <div v-if="currentNode" class="story-card card">
        <h3
          v-if="showPlanningIntroTitle"
          class="progression-card-title planning-intro-title"
        >
          {{ currentNode.title }}
        </h3>
        <p
          v-if="!activeActionSummaryDisplay && !disturbanceNarrativeDisplay && !periodSummaryDisplay"
          class="story-text"
        >
          {{ currentNode.text }}
        </p>

        <div v-if="periodSummaryDisplay" class="progression-card period-summary-card">
          <span class="progression-source-label">{{ periodSummaryDisplay.sourceLabel }}</span>
          <h3 class="progression-card-title">{{ periodSummaryDisplay.headline }}</h3>
          <p class="disturbance-body">{{ periodSummaryDisplay.body }}</p>
          <p class="progression-meta">{{ periodSummaryDisplay.statDeltaSummary }}</p>
          <p class="progression-hint">本期已落幕，点击继续见证下一季成长。</p>
        </div>

        <div v-if="activeActionSummaryDisplay" class="progression-card active-action-summary-card">
          <span class="progression-source-label">{{ activeActionSummaryDisplay.sourceLabel }}</span>
          <h3 class="progression-card-title">{{ activeActionSummaryDisplay.actionName }}</h3>
          <dl class="progression-detail-list">
            <div><dt>耗时</dt><dd>{{ activeActionSummaryDisplay.durationLabel }}</dd></div>
            <div><dt>收益</dt><dd>{{ activeActionSummaryDisplay.rewardSummary }}</dd></div>
            <div><dt>消耗</dt><dd>{{ activeActionSummaryDisplay.costSummary }}</dd></div>
            <div><dt>风险</dt><dd>{{ activeActionSummaryDisplay.riskSummary }}</dd></div>
          </dl>
          <p class="progression-hint">{{ activeActionSummaryDisplay.nextStepHint }}</p>
        </div>

        <div v-if="disturbanceNarrativeDisplay" class="progression-card disturbance-narrative-card">
          <span class="progression-source-label">{{ disturbanceNarrativeDisplay.sourceLabel }}</span>
          <h3 class="progression-card-title">{{ disturbanceNarrativeDisplay.title }}</h3>
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
            <div v-if="displayedRouteImpact" class="feedback-group">
              <p class="feedback-group-title">路线变化</p>
              <p class="feedback-line">
                {{ formatRouteLabel(displayedRouteImpact.from) }} → {{ formatRouteLabel(displayedRouteImpact.to) }}
              </p>
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
        <div v-if="isAutoPlaying" class="auto-play-indicator">
          <span class="loading-dot"></span>
          <span class="loading-dot"></span>
          <span class="loading-dot"></span>
        </div>
        <div v-else-if="showContinueButton" class="continue-area">
          <button class="continue-btn btn" @click="continueToNext">
            继续
          </button>
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { gameEngine } from '../core/GameEngineIntegration';
import { talentSystem } from '../core/TalentSystem';
import { useNewGameEngine } from '../composables/useNewGameEngine';
import AttributePanel from './AttributePanel.vue';
import LifeMemoryPanel from './LifeMemoryPanel.vue';
import { deriveLifeMemorySummary } from '../core/deriveLifeMemorySummary';
import type { StoryChoice, TalentDefinition } from '../types';
import {
  formatLongTermFlag,
  formatRouteLabel,
} from '../utils/playerFacingLabels';

import type {
  ActiveActionSummaryDisplay,
  DisturbanceNarrativeDisplay,
  PeriodSummaryDisplay,
} from '../types/activeActionTypes';
import type { SessionPhase, PlayerSummaryDto } from '../contracts/sessionProgression';
import type { LifeMemorySummary } from '../types/lifeMemory';
import type { PlayerState } from '../types/eventTypes';

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

const displayedRouteImpact = computed(() => {
  const routeImpact = lastChoiceFeedback.value?.player.routeImpact;
  if (!routeImpact || routeImpact.visibility !== 'player') {
    return null;
  }
  if (!routeImpact.from && !routeImpact.to) {
    return null;
  }
  return routeImpact;
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
    !!displayedRouteImpact.value ||
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

const disturbanceNarrativeDisplay = computed(() => {
  if (props.apiMode) {
    if (props.apiSessionPhase !== 'disturbance_narrative') return null;
    return props.apiDisturbanceNarrative ?? null;
  }
  if (!engineState.showingDisturbanceNarrative) return null;
  return engineState.pendingDisturbanceNarrative;
});

const storyEventSourceLabel = computed(() => {
  if (activeActionSummaryDisplay.value || disturbanceNarrativeDisplay.value) return null;
  if (!props.currentNode?.id || props.currentNode.id.startsWith('active_')) return null;
  if (props.currentNode.id === 'action_or_choice_result' || props.currentNode.id === 'disturbance_narrative') {
    return null;
  }
  const narrative = lastChoiceFeedback.value?.player.narrativeResult?.trim();
  if (!narrative) return null;
  return '剧情事件';
});

const displayedNarrative = computed(() => {
  if (activeActionSummaryDisplay.value || disturbanceNarrativeDisplay.value) {
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

const continueToNext = () => {
  if (props.apiMode) {
    if (props.apiNeedsProgressionAck) {
      emit('api-progression-ack');
    }
    return;
  }
  continueProgressionFlow();
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

// 加载天赋定义
const talentDefinitions = ref<TalentDefinition[]>([]);
talentSystem.loadTalents();
talentDefinitions.value = talentSystem.getAllTalents();

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

const attributePanelPlayer = computed((): PlayerState => {
  if (props.apiMode && props.apiPlayer) {
    const p = props.apiPlayer;
    return {
      name: p.name,
      age: p.age,
      gender: 'male',
      martialPower: p.martialPower,
      externalSkill: p.externalSkill,
      internalSkill: p.internalSkill,
      qinggong: p.qinggong,
      chivalry: p.chivalry,
      constitution: p.constitution,
      comprehension: p.comprehension,
      sect: p.sect ?? null,
      title: null,
      reputation: 0,
      money: p.money,
      knowledge: 0,
      charisma: 0,
      businessAcumen: 0,
      influence: 0,
      connections: 0,
      martialHeritage: 0,
      scholarlyHeritage: 0,
      merchantNetwork: 0,
      flags: {},
      children: 0,
      spouse: null,
      alive: p.alive,
      talents: [],
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
    externalSkill: '外功',
    internalSkill: '内功',
    qinggong: '轻功',
    chivalry: '侠义',
    charisma: '魅力',
    constitution: '体魄',
    comprehension: '悟性',
    reputation: '声望',
    influence: '影响力',
    connections: '人脉',
    knowledge: '学识',
    businessAcumen: '商路',
    money: '银两',
    health: '健康',
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
}

.header {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  padding: 16px 20px;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.player-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.save-controls {
  display: flex;
  gap: 8px;
}

.save-btn {
  border: 1px solid rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 13px;
  cursor: pointer;
}

.save-btn:hover {
  background: rgba(255, 255, 255, 0.25);
}

.name {
  font-size: 20px;
  font-weight: 700;
}

.age, .sect {
  font-size: 14px;
  opacity: 0.9;
  background: rgba(255,255,255,0.2);
  padding: 4px 10px;
  border-radius: 12px;
}

.attribute-section {
  padding: 16px 20px;
  background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%);
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
}

.stats-bar {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  padding: 12px;
  background: white;
  border-bottom: 1px solid rgba(139, 69, 19, 0.1);
}

.stat-item {
  text-align: center;
  padding: 8px;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #8b6914;
  margin-bottom: 4px;
}

.stat-value {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: var(--primary-color);
}

.content-area {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.story-card {
  margin-bottom: 24px;
  position: relative;
}

.story-text {
  font-size: 16px;
  line-height: 1.8;
  color: var(--text-color);
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

.continue-area {
  margin-top: 1.5rem;
  text-align: center;
}

.continue-btn {
  padding: 0.75rem 2rem;
  font-size: 1rem;
  background: linear-gradient(135deg, var(--primary-color), #8b5a2b);
  color: white !important;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.continue-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 90, 43, 0.3);
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
  .header {
    flex-direction: column;
    align-items: flex-start;
  }

  .save-controls {
    width: 100%;
    justify-content: flex-end;
  }

  .stats-bar {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .story-text,
  .outcome-text {
    font-size: 15px;
  }

  .content-area {
    padding: 16px 12px;
  }
}

@media (min-width: 768px) {
  .game-screen {
    max-width: 960px;
    margin: 0 auto;
  }

  .stats-bar {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .content-area {
    padding: 24px 32px;
  }

  .choices-area {
    max-width: 720px;
    margin: 0 auto;
  }
}

</style>
