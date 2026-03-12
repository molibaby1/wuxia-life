<template>
  <div class="demo-page">
    <h1 class="page-title">🎮 新版事件系统演示</h1>
    
    <!-- 控制区域 -->
    <div class="control-panel card">
      <h2 class="panel-title">游戏控制</h2>
      
      <div class="control-group">
        <button class="btn btn-primary" @click="startGame" :disabled="gameStarted">
          🎯 开始新游戏
        </button>
        <button class="btn btn-secondary" @click="restartGame" :disabled="!gameStarted">
          🔄 重新开始
        </button>
        <button class="btn btn-info" @click="showStats" :disabled="!gameStarted">
          📊 事件统计
        </button>
      </div>
      
      <div v-if="gameStarted" class="player-status">
        <h3>玩家状态</h3>
        <div class="status-grid">
          <div class="status-item">
            <span class="label">姓名:</span>
            <span class="value">{{ playerInfo.name }}</span>
          </div>
          <div class="status-item">
            <span class="label">年龄:</span>
            <span class="value">{{ playerInfo.age }}岁</span>
          </div>
          <div class="status-item">
            <span class="label">性别:</span>
            <span class="value">{{ playerInfo.gender === 'male' ? '男' : '女' }}</span>
          </div>
          <div class="status-item">
            <span class="label">武力:</span>
            <span class="value">{{ playerInfo.martialPower }}</span>
          </div>
          <div class="status-item">
            <span class="label">外功:</span>
            <span class="value">{{ playerInfo.externalSkill }}</span>
          </div>
          <div class="status-item">
            <span class="label">内功:</span>
            <span class="value">{{ playerInfo.internalSkill }}</span>
          </div>
          <div class="status-item">
            <span class="label">轻功:</span>
            <span class="value">{{ playerInfo.qinggong }}</span>
          </div>
          <div class="status-item">
            <span class="label">侠义:</span>
            <span class="value">{{ playerInfo.chivalry }}</span>
          </div>
          <div class="status-item">
            <span class="label">事件数:</span>
            <span class="value">{{ playerInfo.events?.length || 0 }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 事件显示区域 -->
    <div v-if="currentEvent" class="event-section">
      <EventDisplay
        :event="currentEvent"
        :choices="availableChoices"
        :is-auto-playing="isAutoPlaying"
        :last-effects="lastEffects"
        :show-effects="true"
        @choice="handleChoice"
      />
    </div>
    
    <!-- 日志区域 -->
    <div class="log-section card">
      <h2 class="panel-title">游戏日志</h2>
      <div class="log-container">
        <div v-for="(log, index) in logs" :key="index" class="log-item">
          <span class="log-time">{{ log.time }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useNewGameEngine } from '../composables/useNewGameEngine';
import EventDisplay from '../components/EventDisplay.vue';

const {
  startNewGame,
  restartGame,
  handleChoice,
  getGameState,
  printEventStatistics,
  currentEvent,
  availableChoices,
  isAutoPlaying,
  lastEffects,
  isProcessing,
} = useNewGameEngine();

const gameStarted = ref(false);
const logs = ref<Array<{ time: string; message: string }>>([]);

// 玩家信息
const playerInfo = computed(() => {
  if (!gameStarted.value) {
    return {
      name: '-',
      age: 0,
      gender: 'male' as const,
      martialPower: 0,
      externalSkill: 0,
      internalSkill: 0,
      qinggong: 0,
      chivalry: 0,
      events: [],
    };
  }
  
  const state = getGameState();
  return state.player || {
    name: '-',
    age: 0,
    gender: 'male' as const,
    martialPower: 0,
    externalSkill: 0,
    internalSkill: 0,
    qinggong: 0,
    chivalry: 0,
    events: [],
  };
});

// 添加日志
const addLog = (message: string) => {
  const time = new Date().toLocaleTimeString();
  logs.value.push({ time, message });
  // 限制日志数量
  if (logs.value.length > 50) {
    logs.value.shift();
  }
};

// 开始游戏
const startGame = () => {
  addLog('开始新游戏...');
  startNewGame('张三', 'male');
  gameStarted.value = true;
  addLog('游戏开始！');
};

// 重新开始
const restartGame = () => {
  addLog('重新开始游戏...');
  restartGame();
  logs.value = [];
  addLog('游戏已重置');
};

// 处理选择
const onHandleChoice = async (choice: any) => {
  addLog(`做出选择：${choice.text}`);
  await handleChoice(choice);
};

// 显示统计
const showStats = () => {
  addLog('打印事件统计...');
  printEventStatistics();
  addLog('统计信息已输出到控制台');
};
</script>

<style scoped>
.demo-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  background: #f8f5f0;
  min-height: 100vh;
}

.page-title {
  text-align: center;
  font-size: 32px;
  color: var(--primary-color);
  margin-bottom: 30px;
}

.control-panel {
  margin-bottom: 24px;
  padding: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.panel-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 20px;
}

.control-group {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.btn {
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 500;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--secondary-color);
  transform: translateY(-2px);
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #5a6268;
}

.btn-info {
  background: #17a2b8;
  color: white;
}

.btn-info:hover:not(:disabled) {
  background: #138496;
}

.player-status {
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.player-status h3 {
  font-size: 18px;
  margin-bottom: 16px;
  color: var(--text-color);
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 6px;
}

.status-item .label {
  font-size: 14px;
  color: #666;
}

.status-item .value {
  font-size: 14px;
  font-weight: 600;
  color: var(--primary-color);
}

.event-section {
  margin-bottom: 24px;
}

.log-section {
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.log-container {
  max-height: 300px;
  overflow-y: auto;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 12px;
}

.log-item {
  display: flex;
  gap: 12px;
  padding: 8px;
  margin-bottom: 4px;
  font-size: 14px;
  border-bottom: 1px solid #eee;
}

.log-time {
  font-size: 12px;
  color: #999;
  min-width: 80px;
}

.log-message {
  color: var(--text-color);
}
</style>
