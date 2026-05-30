<template>
  <section class="life-memory-panel">
    <header class="life-memory-header">
      <h3 class="life-memory-title">人生摘要</h3>
      <button
        type="button"
        class="life-memory-toggle"
        :aria-expanded="expanded"
        @click="expanded = !expanded"
      >
        {{ expanded ? '收起' : '展开' }}
      </button>
    </header>

    <div v-show="expanded" class="life-memory-body">
      <!-- 人生路线：始终显示 -->
      <div class="memory-section">
        <p class="memory-section-title">人生路线</p>
        <div class="route-primary">
          <span class="route-name">{{ routePrimary.name }}</span>
          <span class="route-phase">{{ routePrimary.phase }}</span>
        </div>
        <div v-if="routeStatus?.secondary" class="route-secondary">
          <span class="route-secondary-label">兼修</span>
          <span class="route-name">{{ routeStatus.secondary.name }}</span>
          <span class="route-phase">{{ routeStatus.secondary.phase }}</span>
        </div>
        <p v-if="routeStatus?.factionLabel" class="route-meta">
          门派倾向：{{ routeStatus.factionLabel }}
        </p>
        <p v-if="routeStatus?.lastTransition" class="route-meta">
          {{ routeStatus.lastTransition.label }}
          <span v-if="routeStatus.lastTransition.age">（{{ routeStatus.lastTransition.age }}岁）</span>
        </p>
      </div>

      <!-- 风险信号 -->
      <div v-if="visibleRisks.length > 0" class="memory-section">
        <p class="memory-section-title">风险信号</p>
        <ul class="memory-list">
          <li
            v-for="risk in visibleRisks"
            :key="risk.id"
            class="memory-item"
          >
            <span class="memory-badge" :class="severityClass(risk.severity)">
              {{ severityLabel(risk.severity) }}
            </span>
            <span class="memory-label">{{ risk.label }}</span>
          </li>
        </ul>
      </div>

      <!-- 未了因缘 -->
      <div v-if="visibleDebts.length > 0" class="memory-section">
        <p class="memory-section-title">未了因缘</p>
        <ul class="memory-list">
          <li
            v-for="debt in visibleDebts"
            :key="debt.id"
            class="memory-item"
          >
            <span
              v-if="debt.urgency"
              class="memory-badge"
              :class="urgencyClass(debt.urgency)"
            >
              {{ urgencyLabel(debt.urgency) }}
            </span>
            <span class="memory-label">{{ debt.label }}</span>
          </li>
        </ul>
      </div>

      <!-- 关键抉择 -->
      <div v-if="visibleKeyChoices.length > 0" class="memory-section">
        <p class="memory-section-title">关键抉择</p>
        <ul class="memory-list">
          <li
            v-for="choice in visibleKeyChoices"
            :key="choice.id"
            class="memory-item memory-item-stacked"
          >
            <div class="memory-item-row">
              <span v-if="choice.occurredAtAge" class="memory-age">{{ choice.occurredAtAge }}岁</span>
              <span class="memory-label">{{ choice.label }}</span>
              <span
                v-if="choice.payoffStatus"
                class="memory-tag"
                :class="payoffClass(choice.payoffStatus)"
              >
                {{ payoffLabel(choice.payoffStatus) }}
              </span>
            </div>
            <p v-if="choice.consequence" class="memory-consequence">{{ choice.consequence }}</p>
          </li>
        </ul>
      </div>

      <!-- 重要关系 -->
      <div v-if="visibleRelationships.length > 0" class="memory-section">
        <p class="memory-section-title">重要关系</p>
        <ul class="memory-list">
          <li
            v-for="rel in visibleRelationships"
            :key="rel.id"
            class="memory-item memory-item-relationship"
          >
            <span class="memory-role">{{ rel.roleLabel }}</span>
            <span class="memory-label">{{ rel.name }}</span>
            <span class="memory-status" :class="affinityClass(rel.affinityBand)">
              {{ rel.statusLabel }}
            </span>
          </li>
        </ul>
      </div>

      <!-- 人生成就 -->
      <div v-if="visibleAchievements.length > 0" class="memory-section">
        <p class="memory-section-title">人生成就</p>
        <ul class="memory-list memory-list-inline">
          <li
            v-for="achievement in visibleAchievements"
            :key="achievement.id"
            class="memory-chip"
          >
            {{ achievement.label }}
          </li>
        </ul>
      </div>

      <!-- diagnostic：仅 debug 模式 -->
      <div v-if="showDiagnostic" class="memory-diagnostic">
        <p class="memory-section-title">诊断信息</p>
        <pre class="memory-diagnostic-json">{{ diagnosticJson }}</pre>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type {
  LifeMemoryDebtUrgency,
  LifeMemoryPayoffStatus,
  LifeMemoryRiskSeverity,
  LifeMemorySummary,
  LifeMemoryVisibility,
} from '../types/lifeMemory';
import { isPlayerDebugEnabled } from '../utils/debugAccess';

const props = defineProps<{
  summary: LifeMemorySummary;
}>();

const expanded = ref(true);
const showDiagnostic = isPlayerDebugEnabled();

const routeStatus = computed(() => props.summary.routeStatus);

const routePrimary = computed(() => {
  const primary = routeStatus.value?.primary;
  if (primary) {
    return primary;
  }
  return { routeId: 'unknown', name: '未定', phase: '未入门' };
});

function filterPlayer<T extends { visibility: LifeMemoryVisibility }>(entries?: T[]): T[] {
  return (entries ?? []).filter((entry) => entry.visibility === 'player');
}

const visibleRisks = computed(() => filterPlayer(props.summary.risks));
const visibleDebts = computed(() => filterPlayer(props.summary.unresolvedDebts));
const visibleKeyChoices = computed(() => filterPlayer(props.summary.keyChoices));
const visibleRelationships = computed(() => filterPlayer(props.summary.relationships));
const visibleAchievements = computed(() => filterPlayer(props.summary.achievements));

const diagnosticJson = computed(() => {
  if (!showDiagnostic) {
    return '';
  }
  return JSON.stringify(
    {
      routeStatus: routeStatus.value?.diagnostic,
      keyChoices: visibleKeyChoices.value.map((entry) => entry.diagnostic),
      relationships: visibleRelationships.value.map((entry) => entry.diagnostic),
      unresolvedDebts: visibleDebts.value.map((entry) => entry.diagnostic),
      risks: visibleRisks.value.map((entry) => entry.diagnostic),
      achievements: visibleAchievements.value.map((entry) => entry.diagnostic),
    },
    null,
    2,
  );
});

function severityLabel(severity: LifeMemoryRiskSeverity): string {
  switch (severity) {
    case 'high':
      return '高';
    case 'medium':
      return '中';
    case 'low':
      return '低';
    default:
      return severity;
  }
}

function severityClass(severity: LifeMemoryRiskSeverity): string {
  return `badge-severity-${severity}`;
}

function urgencyLabel(urgency: LifeMemoryDebtUrgency): string {
  switch (urgency) {
    case 'high':
      return '急';
    case 'medium':
      return '缓';
    case 'low':
      return '记';
    default:
      return urgency;
  }
}

function urgencyClass(urgency: LifeMemoryDebtUrgency): string {
  return `badge-urgency-${urgency}`;
}

function payoffLabel(status: LifeMemoryPayoffStatus): string {
  switch (status) {
    case 'pending':
      return '待回响';
    case 'echoed':
      return '已回响';
    case 'resolved':
      return '已落定';
    default:
      return status;
  }
}

function payoffClass(status: LifeMemoryPayoffStatus): string {
  return `tag-payoff-${status}`;
}

function affinityClass(band?: string): string {
  if (!band) {
    return '';
  }
  return `status-${band}`;
}
</script>

<style scoped>
.life-memory-panel {
  background: #fffaf0;
  border-bottom: 1px solid rgba(139, 69, 19, 0.08);
  padding: 10px 12px;
}

.life-memory-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.life-memory-title {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--primary-color);
}

.life-memory-toggle {
  border: 1px solid rgba(139, 105, 20, 0.25);
  background: white;
  color: #8b6914;
  border-radius: 8px;
  padding: 4px 10px;
  font-size: 12px;
  cursor: pointer;
}

.life-memory-toggle:hover {
  background: rgba(139, 105, 20, 0.06);
}

.life-memory-body {
  margin-top: 10px;
  display: grid;
  gap: 12px;
}

.memory-section {
  display: grid;
  gap: 6px;
}

.memory-section-title {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
  color: #8b6914;
}

.route-primary,
.route-secondary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.route-secondary {
  padding-left: 4px;
}

.route-secondary-label {
  font-size: 11px;
  color: #b08a44;
}

.route-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--primary-color);
}

.route-phase {
  font-size: 12px;
  color: #8b6914;
  background: rgba(139, 105, 20, 0.08);
  padding: 2px 8px;
  border-radius: 10px;
}

.route-meta {
  margin: 0;
  font-size: 12px;
  color: #8b6914;
}

.memory-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 6px;
}

.memory-list-inline {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.memory-item {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  background: white;
  border-radius: 10px;
  padding: 6px 10px;
  border: 1px solid rgba(139, 69, 19, 0.08);
}

.memory-item-stacked {
  flex-direction: column;
  align-items: stretch;
}

.memory-item-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.memory-item-relationship {
  display: grid;
  grid-template-columns: 64px 1fr auto;
  align-items: center;
}

.memory-label {
  font-size: 13px;
  color: var(--text-color);
  line-height: 1.4;
}

.memory-age {
  font-size: 11px;
  color: #b08a44;
  white-space: nowrap;
}

.memory-role {
  font-size: 12px;
  color: #8b6914;
}

.memory-status {
  font-size: 12px;
  color: #8b6914;
}

.status-close {
  color: #2d6a4f;
}

.status-strained,
.status-hostile {
  color: #b5451b;
}

.memory-consequence {
  margin: 0;
  padding-left: 2px;
  font-size: 12px;
  color: #8b6914;
  line-height: 1.4;
}

.memory-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.2;
}

.badge-severity-high,
.badge-urgency-high {
  background: rgba(181, 69, 27, 0.12);
  color: #b5451b;
}

.badge-severity-medium,
.badge-urgency-medium {
  background: rgba(180, 120, 20, 0.12);
  color: #9a6b12;
}

.badge-severity-low,
.badge-urgency-low {
  background: rgba(139, 105, 20, 0.1);
  color: #8b6914;
}

.memory-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  white-space: nowrap;
}

.tag-payoff-pending {
  background: rgba(180, 120, 20, 0.12);
  color: #9a6b12;
}

.tag-payoff-echoed {
  background: rgba(45, 106, 79, 0.12);
  color: #2d6a4f;
}

.tag-payoff-resolved {
  background: rgba(139, 105, 20, 0.1);
  color: #8b6914;
}

.memory-chip {
  list-style: none;
  font-size: 12px;
  color: var(--text-color);
  background: white;
  border: 1px solid rgba(139, 69, 19, 0.08);
  border-radius: 999px;
  padding: 4px 10px;
}

.memory-diagnostic {
  border-top: 1px dashed rgba(139, 69, 19, 0.15);
  padding-top: 8px;
}

.memory-diagnostic-json {
  margin: 0;
  padding: 8px;
  background: #1a1a2e;
  color: #c8d3f5;
  border-radius: 8px;
  font-size: 11px;
  line-height: 1.4;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
}

@media (max-width: 600px) {
  .life-memory-panel {
    padding: 10px;
  }

  .memory-item-relationship {
    grid-template-columns: 56px 1fr;
    grid-template-areas:
      'role name'
      'role status';
  }

  .memory-status {
    grid-column: 2;
  }
}
</style>
