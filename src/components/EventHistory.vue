<template>
  <div class="event-history">
    <div class="history-header">
      <h2 class="history-title">📜 事件历史</h2>
      <button class="btn btn-sm btn-secondary" @click="toggleCollapse" :title="isCollapsed ? '展开' : '收起'">
        {{ isCollapsed ? '▶' : '▼' }}
      </button>
    </div>
    
    <transition name="slide">
      <div v-show="!isCollapsed" class="history-content">
        <div v-if="events.length === 0" class="empty-state">
          <span class="empty-icon">📭</span>
          <p class="empty-text">暂无事件记录</p>
        </div>
        
        <div v-else class="event-list">
          <div 
            v-for="(event, index) in sortedEvents" 
            :key="index"
            class="event-item"
            :class="{ 'highlighted': highlightedEventId === event.eventId }"
            @click="selectEvent(event)"
          >
            <div class="event-meta">
              <span class="event-age">{{ event.age }}岁</span>
              <span class="event-time">{{ formatTime(event.timestamp) }}</span>
            </div>
            <div class="event-info">
              <span class="event-id">{{ event.eventId }}</span>
              <button 
                class="btn-icon btn-view"
                @click.stop="viewEventDetails(event)"
                title="查看详情"
              >
                👁️
              </button>
            </div>
          </div>
        </div>
        
        <!-- 事件详情弹窗 -->
        <transition name="fade">
          <div v-if="selectedEvent" class="modal-overlay" @click="closeDetails">
            <div class="modal-content" @click.stop>
              <div class="modal-header">
                <h3 class="modal-title">事件详情</h3>
                <button class="btn-close" @click="closeDetails">×</button>
              </div>
              <div class="modal-body">
                <div class="detail-row">
                  <span class="detail-label">事件 ID:</span>
                  <span class="detail-value">{{ selectedEvent.eventId }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">触发年龄:</span>
                  <span class="detail-value">{{ selectedEvent.age }}岁</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">触发时间:</span>
                  <span class="detail-value">{{ formatFullTime(selectedEvent.timestamp) }}</span>
                </div>
                <div v-if="eventDetails" class="detail-content">
                  <h4 class="content-title">{{ eventDetails.content?.title }}</h4>
                  <p class="content-text">{{ eventDetails.content?.text }}</p>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { eventLoader } from '../core/EventLoader';
import type { EventRecord } from '../types/eventTypes';

interface Props {
  events: EventRecord[];
  highlightedEventId?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  highlightedEventId: null,
});

const isCollapsed = ref(false);
const selectedEvent = ref<EventRecord | null>(null);
const eventDetails = ref<any>(null);

// 排序事件（最新的在前）
const toEpoch = (timestamp: EventRecord['timestamp']): number => {
  if (typeof timestamp === 'number') return timestamp;
  if (!timestamp) return 0;
  return new Date(timestamp.year, timestamp.month - 1, timestamp.day).getTime();
};

const sortedEvents = computed(() => {
  return [...props.events].sort((a, b) => toEpoch(b.timestamp) - toEpoch(a.timestamp));
});

// 格式化时间（相对时间）
const formatTime = (timestamp: EventRecord['timestamp']): string => {
  const ts = toEpoch(timestamp);
  const now = Date.now();
  const diff = now - ts;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  return `${days}天前`;
};

// 格式化完整时间
const formatFullTime = (timestamp: EventRecord['timestamp']): string => {
  return new Date(toEpoch(timestamp)).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// 切换折叠状态
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
};

// 选择事件
const selectEvent = (_event: EventRecord) => {
  // 可以在这里添加选择事件的处理
};

// 查看事件详情
const viewEventDetails = async (event: EventRecord) => {
  selectedEvent.value = event;
  
  // 加载事件详情
  const eventDef = eventLoader.getEventById(event.eventId);
  if (eventDef) {
    eventDetails.value = {
      content: eventDef.content,
      eventType: eventDef.eventType,
    };
  } else {
    eventDetails.value = null;
  }
};

// 关闭详情
const closeDetails = () => {
  selectedEvent.value = null;
  eventDetails.value = null;
};

// 监听高亮事件变化
watch(() => props.highlightedEventId, (newId) => {
  if (newId) {
    // 自动滚动到高亮事件
    setTimeout(() => {
      const element = document.querySelector(`.event-item.highlighted`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }
}, { immediate: true });
</script>

<style scoped>
.event-history {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  color: white;
}

.history-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 14px;
}

.history-content {
  max-height: 400px;
  overflow-y: auto;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #999;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 14px;
}

.event-list {
  display: flex;
  flex-direction: column;
}

.event-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.3s ease;
}

.event-item:hover {
  background: #f8f9fa;
}

.event-item.highlighted {
  background: rgba(139, 69, 19, 0.1);
  border-left: 3px solid var(--primary-color);
}

.event-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.event-age {
  font-size: 14px;
  font-weight: 600;
  color: var(--primary-color);
}

.event-time {
  font-size: 12px;
  color: #999;
}

.event-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.event-id {
  font-size: 13px;
  color: #666;
  font-family: monospace;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  font-size: 16px;
  opacity: 0.6;
  transition: opacity 0.3s ease;
}

.btn-icon:hover {
  opacity: 1;
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
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-title {
  font-size: 20px;
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
  transition: all 0.3s ease;
}

.btn-close:hover {
  background: #f5f5f5;
  color: #333;
}

.modal-body {
  padding: 20px;
}

.detail-row {
  display: flex;
  margin-bottom: 12px;
}

.detail-label {
  font-size: 14px;
  font-weight: 600;
  color: #666;
  min-width: 100px;
}

.detail-value {
  font-size: 14px;
  color: var(--text-color);
}

.detail-content {
  margin-top: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.content-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--primary-color);
}

.content-text {
  font-size: 15px;
  line-height: 1.8;
  color: var(--text-color);
  white-space: pre-wrap;
}

/* 动画 */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  max-height: 0;
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
