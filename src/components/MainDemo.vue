<template>
  <div class="main-demo">
    <header class="demo-header">
      <h1 class="title">🎮 武侠人生模拟 - 完整版演示</h1>
      <p class="subtitle">Phase 2 功能展示：事件历史 + 存档管理 + 性能优化</p>
    </header>
    
    <div class="demo-content">
      <!-- 左侧：游戏主界面 -->
      <div class="left-panel">
        <!-- 游戏控制 -->
        <div class="game-control card">
          <h2 class="section-title">游戏控制</h2>
          <div class="control-buttons">
            <button class="btn btn-primary" @click="startGame" :disabled="gameStarted">
              🎯 开始新游戏
            </button>
            <button class="btn btn-secondary" @click="restartGame" :disabled="!gameStarted">
              🔄 重新开始
            </button>
          </div>
        </div>
        
        <!-- 玩家状态 -->
        <div v-if="gameStarted" class="player-status card">
          <h2 class="section-title">玩家状态</h2>
          <div class="status-grid">
            <div class="status-item">
              <span class="label">姓名</span>
              <span class="value">{{ playerInfo.name }}</span>
            </div>
            <div class="status-item">
              <span class="label">年龄</span>
              <span class="value">{{ playerInfo.age }}岁</span>
            </div>
            <div class="status-item">
              <span class="label">性别</span>
              <span class="value">{{ playerInfo.gender === 'male' ? '男' : '女' }}</span>
            </div>
            <div class="status-item">
              <span class="label">武力</span>
              <span class="value">{{ playerInfo.martialPower }}</span>
            </div>
            <div class="status-item">
              <span class="label">外功</span>
              <span class="value">{{ playerInfo.externalSkill }}</span>
            </div>
            <div class="status-item">
              <span class="label">内功</span>
              <span class="value">{{ playerInfo.internalSkill }}</span>
            </div>
            <div class="status-item">
              <span class="label">轻功</span>
              <span class="value">{{ playerInfo.qinggong }}</span>
            </div>
            <div class="status-item">
              <span class="label">侠义</span>
              <span class="value">{{ playerInfo.chivalry }}</span>
            </div>
          </div>
        </div>
        
        <!-- 当前事件显示 -->
        <div v-if="currentEvent" class="current-event">
          <EventDisplay
            :event="currentEvent"
            :choices="availableChoices"
            :is-auto-playing="isAutoPlaying"
            :last-effects="lastEffects"
            :show-effects="true"
            @choice="handleChoice"
          />
        </div>
      </div>
      
      <!-- 右侧：功能面板 -->
      <div class="right-panel">
        <!-- 事件历史 -->
        <div class="event-history-panel">
          <EventHistory
            :events="playerEvents"
            :highlighted-event-id="currentEvent?.id"
          />
        </div>
        
        <!-- 存档管理 -->
        <div class="save-manager-panel">
          <SaveManager
            @game-loaded="loadGameFromSave"
            @game-saved="onGameSaved"
          />
        </div>
        
        <!-- 性能监控 -->
        <div class="performance-panel card">
          <h2 class="section-title">⚡ 性能监控</h2>
          <div class="performance-stats">
            <div class="perf-item">
              <span class="perf-label">事件执行</span>
              <span class="perf-value">{{ perfStats.eventAvg }}ms</span>
            </div>
            <div class="perf-item">
              <span class="perf-label">条件评估</span>
              <span class="perf-value">{{ perfStats.conditionAvg }}ms</span>
            </div>
            <div class="perf-item">
              <span class="perf-label">内存使用</span>
              <span class="perf-value">{{ perfStats.memoryMB }}MB</span>
            </div>
          </div>
          <button class="btn btn-sm btn-info" @click="showPerformanceReport">
            📊 查看详细报告
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useNewGameEngine } from './composables/useNewGameEngine';
import EventDisplay from './components/EventDisplay.vue';
import EventHistory from './components/EventHistory.vue';
import SaveManager from './components/SaveManager.vue';
import { performanceMonitor } from './core/PerformanceMonitor';
import { eventPreloader } from './core/EventPreloader';

const {
  startNewGame,
  restartGame,
  handleChoice,
  getGameState,
  currentEvent,
  availableChoices,
  isAutoPlaying,
  lastEffects,
} = useNewGameEngine();

const gameStarted = ref(false);
const perfStats = ref({
  eventAvg: 0,
  conditionAvg: 0,
  memoryMB: 0,
});

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
  };
});

// 玩家事件列表
const playerEvents = computed(() => {
  if (!gameStarted.value) return [];
  const state = getGameState();
  return state.player?.events || [];
});

// 开始游戏
const startGame = () => {
  startNewGame('张三', 'male');
  gameStarted.value = true;
  
  // 预加载事件
  eventPreloader.preloadFutureAges(0);
};

// 重新开始
const onRestartGame = () => {
  restartGame();
  gameStarted.value = false;
};

// 处理选择
const onHandleChoice = async (choice: any) => {
  await handleChoice(choice);
};

// 加载存档
const loadGameFromSave = (gameState: any) => {
  console.log('加载存档:', gameState);
  // 这里需要实现存档加载逻辑
  gameStarted.value = true;
};

// 游戏保存回调
const onGameSaved = (saveId: string) => {
  console.log('游戏已保存:', saveId);
};

// 显示性能报告
const showPerformanceReport = () => {
  performanceMonitor.printPerformanceReport();
  const report = performanceMonitor.getPerformanceReport();
  perfStats.value = {
    eventAvg: report.eventExecution.average.toFixed(3),
    conditionAvg: report.conditionEvaluation.average.toFixed(3),
    memoryMB: (report.memory.usedHeapSize / 1024 / 1024).toFixed(2),
  };
  alert('性能报告已输出到控制台');
};

// 定期更新性能数据
onMounted(() => {
  setInterval(() => {
    performanceMonitor.updateMemoryUsage();
    const report = performanceMonitor.getPerformanceReport();
    perfStats.value = {
      eventAvg: report.eventExecution.average.toFixed(3),
      conditionAvg: report.conditionEvaluation.average.toFixed(3),
      memoryMB: (report.memory.usedHeapSize / 1024 / 1024).toFixed(2),
    };
  }, 2000);
});
</script>

<style scoped>
.main-demo {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  background: #f8f5f0;
  min-height: 100vh;
}

.demo-header {
  text-align: center;
  margin-bottom: 30px;
}

.title {
  font-size: 32px;
  color: var(--primary-color);
  margin-bottom: 8px;
}

.subtitle {
  font-size: 16px;
  color: #666;
}

.demo-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.left-panel, .right-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--text-color);
}

.control-buttons {
  display: flex;
  gap: 12px;
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

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-sm {
  padding: 8px 16px;
  font-size: 14px;
}

.btn-info {
  background: #17a2b8;
  color: white;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
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

.performance-stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.perf-item {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 6px;
}

.perf-label {
  font-size: 14px;
  color: #666;
}

.perf-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--primary-color);
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .demo-content {
    grid-template-columns: 1fr;
  }
}
</style>
