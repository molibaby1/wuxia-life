<template>
  <div class="event-display">
    <!-- 事件标题 -->
    <div v-if="event?.content?.title" class="event-header">
      <h2 class="event-title">{{ event.content.title }}</h2>
      <span v-if="event?.content?.description" class="event-description">
        {{ event.content.description }}
      </span>
    </div>
    
    <!-- 事件内容 -->
    <div v-if="event?.content?.text" class="event-content card">
      <p class="event-text">{{ event.content.text }}</p>
      
      <!-- 自动播放指示器 -->
      <div v-if="isAutoPlaying" class="auto-play-indicator">
        <span class="loading-dot"></span>
        <span class="loading-dot"></span>
        <span class="loading-dot"></span>
        <span class="status-text">自动推进中...</span>
      </div>
    </div>
    
    <!-- 选择区域 -->
    <div v-if="!isAutoPlaying && choices.length > 0" class="choices-area">
      <h3 class="choices-title">请选择：</h3>
      <button
        v-for="choice in choices"
        :key="choice.id"
        class="choice-btn btn"
        :disabled="!isChoiceAvailable(choice)"
        @click="handleChoice(choice)"
      >
        <span class="choice-text">{{ choice.text }}</span>
        <span v-if="choice.condition && !isChoiceAvailable(choice)" class="choice-locked">
          🔒 条件不足
        </span>
      </button>
    </div>
    
    <!-- 效果预览区域 -->
    <div v-if="showEffects && lastEffects?.length" class="effects-preview">
      <h4 class="effects-title">效果：</h4>
      <div class="effects-list">
        <div v-for="(effect, index) in lastEffects" :key="index" class="effect-item">
          {{ formatEffect(effect) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { EventDefinition, Effect } from '../types/eventTypes';
import type { StoryChoice } from '../types';

interface Props {
  event: EventDefinition | null;
  choices: StoryChoice[];
  isAutoPlaying: boolean;
  showEffects?: boolean;
  lastEffects?: Effect[];
}

const props = withDefaults(defineProps<Props>(), {
  showEffects: false,
  lastEffects: () => [],
});

const emit = defineEmits<{
  (e: 'choice', choice: StoryChoice): void;
}>();

// 检查选择是否可用
const isChoiceAvailable = (choice: StoryChoice): boolean => {
  if (!choice.condition) return true;
  
  // 这里可以集成条件评估器
  // 暂时简化处理
  return true;
};

// 处理选择
const handleChoice = (choice: StoryChoice) => {
  if (isChoiceAvailable(choice)) {
    emit('choice', choice);
  }
};

// 格式化效果显示
const formatEffect = (effect: Effect): string => {
  switch (effect.type) {
    case 'stat_modify':
      const op = effect.operator === 'add' ? '+' : 
                 effect.operator === 'subtract' ? '-' : 
                 effect.operator === 'multiply' ? '×' : '÷';
      return `${effect.target} ${op} ${effect.value}`;
    case 'time_advance':
      return `年龄 +${effect.value}`;
    case 'flag_set':
      return `获得状态：${effect.target}`;
    case 'event_record':
      return `记录事件：${effect.target}`;
    default:
      return String(effect.type);
  }
};
</script>

<style scoped>
.event-display {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.event-header {
  margin-bottom: 20px;
  text-align: center;
}

.event-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--primary-color);
  margin-bottom: 8px;
}

.event-description {
  display: block;
  font-size: 14px;
  color: #666;
  font-style: italic;
}

.event-content {
  margin-bottom: 24px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.event-text {
  font-size: 16px;
  line-height: 1.8;
  color: var(--text-color);
  white-space: pre-wrap;
}

.auto-play-indicator {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding: 12px;
  background: rgba(139, 69, 19, 0.05);
  border-radius: 8px;
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

.loading-dot:nth-child(3) {
  animation-delay: 0s;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.status-text {
  font-size: 14px;
  color: var(--primary-color);
  margin-left: 8px;
}

.choices-area {
  margin-top: 24px;
}

.choices-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 16px;
  text-align: center;
}

.choice-btn {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: 12px;
  padding: 16px 20px;
  text-align: left;
  font-size: 15px;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.choice-btn:hover:not(:disabled) {
  transform: translateX(8px);
  border-color: var(--primary-color);
}

.choice-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f5f5f5 !important;
}

.choice-text {
  flex: 1;
}

.choice-locked {
  font-size: 12px;
  color: #999;
  margin-left: 12px;
}

.effects-preview {
  margin-top: 24px;
  padding: 16px;
  background: rgba(139, 69, 19, 0.05);
  border-radius: 8px;
}

.effects-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--primary-color);
  margin-bottom: 12px;
}

.effects-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.effect-item {
  font-size: 14px;
  color: var(--text-color);
  padding: 8px 12px;
  background: white;
  border-radius: 4px;
  border-left: 3px solid var(--primary-color);
}
</style>
