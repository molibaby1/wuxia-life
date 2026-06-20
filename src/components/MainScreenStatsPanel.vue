<template>
  <section class="stats-card card" aria-label="核心属性">
    <header class="stats-header">
      <h3>核心属性</h3>
    </header>

    <div class="core-grid">
      <article
        v-for="item in coreStats"
        :key="item.key"
        class="core-item"
      >
        <span class="core-label">{{ item.label }}</span>
        <span class="core-value">{{ item.value }}</span>
      </article>
    </div>

    <button type="button" class="detail-entry" @click="toggleDetails">
      {{ expanded ? '返回主界面' : '查看完整属性说明' }}
    </button>

    <div v-if="expanded" class="full-stats-panel">
      <div class="tab-row">
        <button
          v-for="group in groups"
          :key="group.id"
          type="button"
          class="tab-btn"
          :class="{ active: group.id === activeTab }"
          @click="activeTab = group.id"
        >
          {{ group.label }}
        </button>
      </div>

      <div v-if="activeGroup" class="detail-list">
        <article
          v-for="item in activeGroup.items"
          :key="item.key"
          class="detail-item"
        >
          <div class="detail-main">
            <span class="detail-label">{{ item.label }}</span>
            <span class="detail-value">{{ item.value }}</span>
          </div>
          <p v-if="item.description" class="detail-description">{{ item.description }}</p>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { MainScreenStatGroup, MainScreenStatItem } from './mainScreenModel';

const props = defineProps<{
  coreStats: MainScreenStatItem[];
  groups: MainScreenStatGroup[];
}>();

const expanded = ref(false);
const activeTab = ref(props.groups[0]?.id ?? 'combat');

const activeGroup = computed(() => {
  return props.groups.find((group) => group.id === activeTab.value) ?? props.groups[0] ?? null;
});

function toggleDetails(): void {
  expanded.value = !expanded.value;
}

function openDetails(): void {
  expanded.value = true;
}

defineExpose({
  openDetails,
});
</script>

<style scoped>
.stats-card {
  padding: 16px;
  border-radius: 20px;
  background: #fffdf7;
  border: 1px solid rgba(139, 105, 20, 0.12);
}

.stats-header h3 {
  margin: 0;
  font-size: 20px;
  color: var(--primary-color);
}

.core-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 14px;
}

.core-item {
  min-height: 52px;
  display: grid;
  gap: 4px;
  align-content: center;
  border-radius: 16px;
  padding: 12px;
  background: #f7efe1;
  border: 1px solid rgba(139, 105, 20, 0.08);
}

.core-label {
  font-size: 14px;
  color: #8b6914;
}

.core-value {
  font-size: 28px;
  line-height: 1;
  font-weight: 700;
  color: var(--primary-color);
}

.detail-entry {
  margin-top: 14px;
  min-height: 36px;
  padding: 0 12px;
  border-radius: 12px;
  border: 1px solid rgba(139, 105, 20, 0.22);
  background: #fff;
  color: #8b6914;
  font-size: 13px;
  cursor: pointer;
}

.full-stats-panel {
  margin-top: 16px;
  display: grid;
  gap: 12px;
  padding-top: 14px;
  border-top: 1px dashed rgba(139, 105, 20, 0.18);
}

.tab-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tab-btn {
  min-height: 36px;
  padding: 0 12px;
  border-radius: 12px;
  border: 1px solid rgba(139, 105, 20, 0.18);
  background: #f6efe2;
  color: #7c5b1b;
  font-size: 13px;
  cursor: pointer;
}

.tab-btn.active {
  background: #6e4b1f;
  border-color: #6e4b1f;
  color: #fff;
}

.detail-list {
  display: grid;
  gap: 10px;
}

.detail-item {
  padding: 12px;
  border-radius: 14px;
  background: #fffaf1;
  border: 1px solid rgba(139, 105, 20, 0.08);
}

.detail-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.detail-label {
  font-size: 15px;
  font-weight: 600;
  color: var(--primary-color);
}

.detail-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--primary-color);
}

.detail-description {
  margin: 6px 0 0;
  font-size: 13px;
  line-height: 1.5;
  color: #7d6744;
}

@media (max-width: 600px) {
  .core-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
