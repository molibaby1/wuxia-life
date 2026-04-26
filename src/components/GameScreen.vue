<template>
  <div class="game-screen">
    <div class="header">
      <div class="player-info">
        <span class="name">{{ player?.name }}</span>
        <span class="age">{{ player?.age }}岁 (时间：{{ getCurrentDate() }})</span>
        <span v-if="player?.sect" class="sect">{{ player.sect }}</span>
      </div>
    </div>
    
    <!-- 属性面板 -->
    <div class="attribute-section">
      <AttributePanel 
        :player="player" 
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

    <div class="relations-bar">
      <div class="relation-summary">
        <span class="relation-label">路线</span>
        <span class="relation-value">{{ routeLabel }}</span>
      </div>
      <div v-if="relationships.length > 0" class="relation-list">
        <div v-for="rel in relationships" :key="rel.id" class="relation-item">
          <span class="relation-role">{{ formatRole(rel.role) }}</span>
          <span class="relation-name">{{ rel.name }}</span>
          <span class="relation-affinity">好感 {{ rel.affinity }}</span>
        </div>
      </div>
      <div v-else class="relation-empty">暂无关键关系</div>
    </div>
    
    <div class="content-area">
      <div v-if="currentNode" class="story-card card">
        <p class="story-text">{{ currentNode.text }}</p>
        <div v-if="lastOutcomeText" class="outcome-section">
          <p class="outcome-text">{{ lastOutcomeText }}</p>
        </div>
        <div v-if="isAutoPlaying" class="auto-play-indicator">
          <span class="loading-dot"></span>
          <span class="loading-dot"></span>
          <span class="loading-dot"></span>
        </div>
        <div v-else-if="!isAutoPlaying && !availableChoices.length" class="continue-area">
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
          @click="makeChoice(choice)"
        >
          {{ choice.text }}
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
import type { StoryChoice, TalentDefinition } from '../types';

const props = defineProps<{
  currentNode: any;
  availableChoices: StoryChoice[];
  isAutoPlaying: boolean;
}>();

const emit = defineEmits<{
  (e: 'choice', choice: StoryChoice): void;
}>();

// 使用 useNewGameEngine 获取 lastOutcomeText
const { engineState, getNextEvent } = useNewGameEngine();

const lastOutcomeText = computed(() => {
  return engineState.lastOutcomeText;
});

// 继续到下一个事件
const continueToNext = () => {
  // 清除结果文本
  engineState.lastOutcomeText = null;
  // 获取下一个事件
  getNextEvent();
};

// 加载天赋定义
const talentDefinitions = ref<TalentDefinition[]>([]);
talentSystem.loadTalents();
talentDefinitions.value = talentSystem.getAllTalents();

// 使用 computed 直接获取最新的游戏状态，确保响应式更新
const player = computed(() => {
  const state = gameEngine.getGameState();
  return state.player;
});

const relationships = computed(() => {
  return player.value?.relationships || [];
});

const routeLabel = computed(() => {
  const flags = gameEngine.getGameState().flags || {};
  const faction = flags.sect_faction as unknown;
  
  // 使用新的 sect_faction 系统
  if (faction === 'orthodox') return '传统门派';
  if (faction === 'unconventional') return '非传统门派';
  if (faction === 'neutral') return '中立门派';
  
  // 兼容旧数据
  if (flags.route_orthodox) return '正道';
  if (flags.route_demonic) return '非传统';
  if (flags.route_wanderer) return '游侠';
  
  return '未定';
});

const formatRole = (role: string) => {
  switch (role) {
    case 'master':
      return '师父';
    case 'lover':
      return '恋人';
    case 'sworn':
      return '结义';
    case 'rival':
      return '宿敌';
    case 'friend':
      return '友人';
    case 'family':
      return '亲族';
    case 'enemy':
      return '仇敌';
    case 'patron':
      return '恩主';
    default:
      return role;
  }
};

const getCurrentDate = () => {
  const state = gameEngine.getGameState();
  const time = state.currentTime || { year: 1, month: 1, day: 1 };
  return `${time.year}年${time.month}月${time.day}日`;
};

const makeChoice = (choice: StoryChoice) => {
  emit('choice', choice);
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
}

.player-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
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

.relations-bar {
  background: #fffaf0;
  border-bottom: 1px solid rgba(139, 69, 19, 0.08);
  padding: 10px 12px;
  display: grid;
  gap: 8px;
}

.relation-summary {
  display: flex;
  align-items: center;
  gap: 10px;
}

.relation-label {
  font-size: 12px;
  color: #8b6914;
}

.relation-value {
  font-size: 14px;
  font-weight: 700;
  color: var(--primary-color);
}

.relation-list {
  display: grid;
  gap: 6px;
}

.relation-item {
  display: grid;
  grid-template-columns: 64px 1fr auto;
  gap: 8px;
  align-items: center;
  background: white;
  border-radius: 10px;
  padding: 6px 10px;
  border: 1px solid rgba(139, 69, 19, 0.08);
}

.relation-role {
  font-size: 12px;
  color: #8b6914;
}

.relation-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
}

.relation-affinity {
  font-size: 12px;
  color: #8b6914;
}

.relation-empty {
  font-size: 12px;
  color: #b08a44;
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

.outcome-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px dashed var(--border-color);
  animation: fadeIn 0.3s ease-out;
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

</style>
