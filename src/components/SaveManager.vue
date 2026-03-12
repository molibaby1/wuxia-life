<template>
  <div class="save-manager">
    <div class="save-header">
      <h2 class="save-title">💾 存档管理</h2>
      <div class="save-actions">
        <button class="btn btn-sm btn-primary" @click="saveGame">
          💾 保存游戏
        </button>
        <button class="btn btn-sm btn-secondary" @click="autoSaveNow">
          ⚡ 快速保存
        </button>
      </div>
    </div>
    
    <div class="save-content">
      <!-- 自动存档提示 -->
      <div v-if="hasAutoSave" class="auto-save-notice">
        <span class="notice-icon">💡</span>
        <span class="notice-text">发现自动存档，是否加载？</span>
        <button class="btn btn-sm btn-primary" @click="loadAutoSave">
          加载
        </button>
        <button class="btn btn-sm btn-secondary" @click="clearAutoSave">
          忽略
        </button>
      </div>
      
      <!-- 存档列表 -->
      <div v-if="saves.length > 0" class="save-list">
        <div 
          v-for="save in saves" 
          :key="save.id"
          class="save-item"
          :class="{ 'selected': selectedSaveId === save.id }"
          @click="selectSave(save.id)"
        >
          <div class="save-info">
            <div class="save-name">{{ save.name }}</div>
            <div class="save-meta">
              <span class="meta-item">👤 {{ save.metadata.playerName }}</span>
              <span class="meta-item">🎂 {{ save.metadata.playerAge }}岁</span>
              <span class="meta-item">📜 {{ save.metadata.eventCount }}事件</span>
              <span class="meta-item">⏱️ {{ formatPlayTime(save.metadata.playTime) }}</span>
            </div>
            <div class="save-time">{{ formatSaveTime(save.timestamp) }}</div>
          </div>
          <div class="save-buttons">
            <button 
              class="btn-icon btn-load"
              @click.stop="loadSave(save.id)"
              title="加载存档"
            >
              📂
            </button>
            <button 
              class="btn-icon btn-export"
              @click.stop="exportSave(save.id)"
              title="导出存档"
            >
              📤
            </button>
            <button 
              class="btn-icon btn-delete"
              @click.stop="confirmDelete(save.id)"
              title="删除存档"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
      
      <!-- 空状态 -->
      <div v-else class="empty-state">
        <span class="empty-icon">📭</span>
        <p class="empty-text">暂无存档</p>
        <p class="empty-hint">保存游戏后，存档会显示在这里</p>
      </div>
    </div>
    
    <!-- 导入存档弹窗 -->
    <transition name="fade">
      <div v-if="showImportModal" class="modal-overlay" @click="closeImportModal">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3 class="modal-title">导入存档</h3>
            <button class="btn-close" @click="closeImportModal">×</button>
          </div>
          <div class="modal-body">
            <textarea 
              v-model="importData"
              class="import-textarea"
              placeholder="请粘贴存档数据..."
              rows="10"
            ></textarea>
            <div class="import-actions">
              <button class="btn btn-primary" @click="doImport" :disabled="!importData.trim()">
                导入
              </button>
              <button class="btn btn-secondary" @click="closeImportModal">
                取消
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
    
    <!-- 导入按钮 -->
    <div class="import-section">
      <button class="btn btn-secondary" @click="showImportModal = true">
        📥 导入存档
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { saveManager, type SaveData } from '../core/SaveManager';
import { gameEngine } from '../core/GameEngineIntegration';

const emits = defineEmits<{
  (e: 'gameLoaded', gameState: any): void;
  (e: 'gameSaved', saveId: string): void;
}>();

const saves = ref<SaveData[]>([]);
const selectedSaveId = ref<string | null>(null);
const hasAutoSave = ref(false);
const showImportModal = ref(false);
const importData = ref('');

// 加载存档列表
const loadSaves = () => {
  saves.value = saveManager.getAllSaves();
  hasAutoSave.value = saveManager.loadAutoSave() !== null;
};

// 保存游戏
const saveGame = () => {
  const gameState = gameEngine.getGameState();
  const name = prompt('请输入存档名称:', '手动存档') || '手动存档';
  const saveId = saveManager.saveGame(gameState, name);
  loadSaves();
  emits('gameSaved', saveId);
  alert('游戏已保存！');
};

// 快速保存
const autoSaveNow = () => {
  const gameState = gameEngine.getGameState();
  saveManager.autoSave(gameState);
  hasAutoSave.value = true;
  alert('快速保存完成！');
};

// 加载存档
const loadSave = (saveId: string) => {
  const save = saveManager.loadGame(saveId);
  if (save) {
    emits('gameLoaded', save.gameData);
    alert('游戏已加载！');
  }
};

// 加载自动存档
const loadAutoSave = () => {
  const autoSave = saveManager.loadAutoSave();
  if (autoSave) {
    emits('gameLoaded', autoSave.gameData);
    saveManager.clearAutoSave();
    hasAutoSave.value = false;
    alert('自动存档已加载！');
  }
};

// 清除自动存档
const clearAutoSave = () => {
  saveManager.clearAutoSave();
  hasAutoSave.value = false;
};

// 选择存档
const selectSave = (saveId: string) => {
  selectedSaveId.value = saveId;
};

// 导出存档
const exportSave = (saveId: string) => {
  const exportData = saveManager.exportSave(saveId);
  if (exportData) {
    // 复制到剪贴板
    navigator.clipboard.writeText(exportData).then(() => {
      alert('存档已导出到剪贴板！');
    }).catch(() => {
      // 如果剪贴板失败，显示在弹窗中
      importData.value = exportData;
      showImportModal.value = true;
    });
  }
};

// 删除存档
const confirmDelete = (saveId: string) => {
  if (confirm('确定要删除这个存档吗？')) {
    saveManager.deleteSave(saveId);
    loadSaves();
  }
};

// 导入存档
const doImport = () => {
  if (saveManager.importSave(importData.value)) {
    loadSaves();
    showImportModal.value = false;
    importData.value = '';
    alert('存档已导入！');
  } else {
    alert('导入失败，请检查存档数据格式');
  }
};

// 关闭导入弹窗
const closeImportModal = () => {
  showImportModal.value = false;
  importData.value = '';
};

// 格式化时间
const formatSaveTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString('zh-CN');
};

// 格式化游戏时长
const formatPlayTime = (seconds: number): string => {
  return saveManager.formatPlayTime(seconds);
};

// 组件挂载时加载存档列表
onMounted(() => {
  loadSaves();
});
</script>

<style scoped>
.save-manager {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.save-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.save-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

.save-actions {
  display: flex;
  gap: 8px;
}

.save-content {
  min-height: 200px;
}

.auto-save-notice {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(139, 69, 19, 0.1);
  border-radius: 8px;
  margin-bottom: 16px;
}

.notice-icon {
  font-size: 20px;
}

.notice-text {
  flex: 1;
  font-size: 14px;
  color: var(--text-color);
}

.save-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.save-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.save-item:hover {
  background: #e9ecef;
}

.save-item.selected {
  border-color: var(--primary-color);
  background: rgba(139, 69, 19, 0.05);
}

.save-info {
  flex: 1;
}

.save-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 8px;
}

.save-meta {
  display: flex;
  gap: 16px;
  margin-bottom: 4px;
  flex-wrap: wrap;
}

.meta-item {
  font-size: 13px;
  color: #666;
}

.save-time {
  font-size: 12px;
  color: #999;
}

.save-buttons {
  display: flex;
  gap: 8px;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  font-size: 18px;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.btn-icon:hover {
  background: rgba(139, 69, 19, 0.1);
}

.btn-load:hover {
  background: rgba(40, 167, 69, 0.1);
}

.btn-export:hover {
  background: rgba(23, 162, 184, 0.1);
}

.btn-delete:hover {
  background: rgba(220, 53, 69, 0.1);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #999;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 16px;
  margin-bottom: 8px;
}

.empty-hint {
  font-size: 14px;
  color: #bbb;
}

.import-section {
  margin-top: 20px;
  text-align: center;
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.btn-close {
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: #999;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.btn-close:hover {
  background: #f5f5f5;
  color: #333;
}

.modal-body {
  padding: 20px;
}

.import-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-family: monospace;
  font-size: 13px;
  resize: vertical;
  margin-bottom: 16px;
}

.import-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

/* 动画 */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
