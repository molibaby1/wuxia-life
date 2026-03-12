<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { gameEngine } from '../core/GameEngineIntegration';
import { useNewGameEngine } from '../composables/useNewGameEngine';

const debugLogs = ref<Array<{ time: string; type: string; message: string }>>([]);
const gameStatus = ref('未开始');
const currentAge = ref(0);
const currentEventId = ref('无');
const eventCount = ref(0);

// 劫持 console.log
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

const addLog = (type: string, message: string) => {
  const time = new Date().toLocaleTimeString();
  debugLogs.value.push({ time, type, message });
  // 限制日志数量
  if (debugLogs.value.length > 100) {
    debugLogs.value.shift();
  }
  // 同时输出到原始 console
  if (type === 'log') originalConsoleLog(message);
  else if (type === 'error') originalConsoleError(message);
  else if (type === 'warn') originalConsoleWarn(message);
};

console.log = (...args: any[]) => addLog('log', args.join(' '));
console.error = (...args: any[]) => addLog('error', args.join(' '));
console.warn = (...args: any[]) => addLog('warn', args.join(' '));

const {
  startNewGame,
  engineState,
  isProcessing,
} = useNewGameEngine();

// 定时更新状态
onMounted(() => {
  setInterval(() => {
    const state = gameEngine.getGameState();
    if (state.player) {
      currentAge.value = state.player.age;
      eventCount.value = state.player.events?.length || 0;
    }
    if (engineState.currentEvent) {
      currentEventId.value = engineState.currentEvent.id;
    }
    gameStatus.value = isProcessing.value ? '处理中...' : '等待中';
  }, 500);
  
  // 添加 engineState 的调试信息
  setInterval(() => {
    addLog('debug', `engineState.currentEvent: ${engineState.currentEvent ? engineState.currentEvent.id : 'null'}`);
    addLog('debug', `engineState.availableChoices: ${engineState.availableChoices.length}`);
  }, 1000);
});

const startGame = () => {
  addLog('info', '开始新游戏...');
  
  // 先检查 0 岁的事件
  const eventsAt0 = gameEngine.getAvailableEvents(0);
  addLog('info', `0 岁可用事件：${eventsAt0.length}个 - ${eventsAt0.map(e => e.id).join(', ')}`);
  
  startNewGame('测试', 'male');
  addLog('info', '游戏已启动');
  
  // 再次检查
  const state = gameEngine.getGameState();
  addLog('info', `当前年龄：${state.player?.age}`);
  
  const eventsAtCurrentAge = gameEngine.getAvailableEvents(state.player?.age || 0);
  addLog('info', `当前年龄可用事件：${eventsAtCurrentAge.length}个 - ${eventsAtCurrentAge.map(e => e.id).join(', ')}`);
};

const clearLogs = () => {
  debugLogs.value = [];
};

const exportLogs = () => {
  const logsText = debugLogs.value.map(log => 
    `[${log.time}] [${log.type}] ${log.message}`
  ).join('\n');
  
  const blob = new Blob([logsText], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `debug-logs-${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
};
</script>

<template>
  <div class="debug-page">
    <h1>🔧 游戏调试面板</h1>
    
    <div class="status-panel">
      <h2>游戏状态</h2>
      <div class="status-grid">
        <div class="status-item">
          <span class="label">状态:</span>
          <span class="value">{{ gameStatus }}</span>
        </div>
        <div class="status-item">
          <span class="label">年龄:</span>
          <span class="value">{{ currentAge }}岁</span>
        </div>
        <div class="status-item">
          <span class="label">当前事件:</span>
          <span class="value">{{ currentEventId }}</span>
        </div>
        <div class="status-item">
          <span class="label">事件数:</span>
          <span class="value">{{ eventCount }}</span>
        </div>
        <div class="status-item">
          <span class="label">处理中:</span>
          <span class="value">{{ isProcessing ? '是' : '否' }}</span>
        </div>
        <div class="status-item">
          <span class="label">自动播放:</span>
          <span class="value">{{ engineState.isAutoPlaying ? '是' : '否' }}</span>
        </div>
      </div>
      
      <button @click="startGame" class="btn btn-start">
        开始游戏
      </button>
    </div>
    
    <div class="logs-panel">
      <div class="logs-header">
        <h2>调试日志 ({{ debugLogs.length }})</h2>
        <div class="logs-actions">
          <button @click="clearLogs" class="btn btn-clear">清空</button>
          <button @click="exportLogs" class="btn btn-export">导出</button>
        </div>
      </div>
      
      <div class="logs-container">
        <div 
          v-for="(log, index) in debugLogs" 
          :key="index"
          class="log-entry"
          :class="'log-' + log.type"
        >
          <span class="log-time">{{ log.time }}</span>
          <span class="log-type">{{ log.type }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
      </div>
    </div>
    
    <div class="help-panel">
      <h2>使用说明</h2>
      <ol>
        <li>点击"开始游戏"按钮</li>
        <li>观察"游戏状态"和"调试日志"</li>
        <li>如果卡住，查看日志中的错误信息</li>
        <li>点击"导出"按钮保存日志</li>
      </ol>
    </div>
  </div>
</template>

<style scoped>
.debug-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  font-family: monospace;
  background: #1e1e1e;
  color: #d4d4d4;
  min-height: 100vh;
}

h1 {
  color: #569cd6;
  border-bottom: 2px solid #569cd6;
  padding-bottom: 10px;
}

h2 {
  color: #4ec9b0;
  margin-top: 0;
}

.status-panel {
  background: #252526;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.status-item {
  background: #333;
  padding: 10px;
  border-radius: 4px;
}

.label {
  color: #9cdcfe;
  margin-right: 10px;
}

.value {
  color: #ce9178;
  font-weight: bold;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  margin-right: 10px;
}

.btn-start {
  background: #4ec9b0;
  color: #1e1e1e;
}

.btn-clear, .btn-export {
  background: #569cd6;
  color: white;
}

.logs-panel {
  background: #252526;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.logs-actions {
  display: flex;
  gap: 10px;
}

.logs-container {
  background: #1e1e1e;
  border: 1px solid #333;
  border-radius: 4px;
  max-height: 500px;
  overflow-y: auto;
}

.log-entry {
  display: flex;
  gap: 10px;
  padding: 5px 10px;
  border-bottom: 1px solid #333;
  font-size: 13px;
}

.log-time {
  color: #808080;
  min-width: 80px;
}

.log-type {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: bold;
  min-width: 60px;
  text-align: center;
}

.log-log {
  .log-type {
    background: #569cd6;
  }
}

.log-error {
  .log-type {
    background: #f44336;
  }
  .log-message {
    color: #f44336;
  }
}

.log-warn {
  .log-type {
    background: #ff9800;
  }
  .log-message {
    color: #ff9800;
  }
}

.log-info {
  .log-type {
    background: #4ec9b0;
  }
}

.log-message {
  flex: 1;
  word-break: break-all;
}

.help-panel {
  background: #252526;
  padding: 20px;
  border-radius: 8px;
}

.help-panel ol {
  color: #d4d4d4;
  line-height: 1.8;
}
</style>
