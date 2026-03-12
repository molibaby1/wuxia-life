<template>
  <div class="game-screen">
    <div class="header">
      <div class="player-info">
        <span class="name">{{ player?.name }}</span>
        <span class="age">{{ player?.age }}岁</span>
        <span v-if="player?.sect" class="sect">{{ player.sect }}</span>
      </div>
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
        <span class="stat-label">银两</span>
        <span class="stat-value">{{ player?.money }}</span>
      </div>
    </div>
    
    <div class="content-area">
      <div v-if="currentNode" class="story-card card">
        <p class="story-text">{{ currentNode.text }}</p>
        <div v-if="isAutoPlaying" class="auto-play-indicator">
          <span class="loading-dot"></span>
          <span class="loading-dot"></span>
          <span class="loading-dot"></span>
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
import { useGameStore } from '../store/gameStore';
import type { StoryChoice } from '../types';

const props = defineProps<{
  currentNode: any;
  availableChoices: StoryChoice[];
  isAutoPlaying: boolean;
}>();

const emit = defineEmits<{
  (e: 'choice', choice: StoryChoice): void;
}>();

const store = useGameStore();
const player = store.state.player;

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

.stats-bar {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
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

.choice-btn {
  text-align: left;
  color: var(--primary-color) !important;
}
</style>
