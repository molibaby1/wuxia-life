<template>
  <div class="attribute-panel">
    <!-- 面板标题 -->
    <div class="panel-header">
      <h3>角色属性</h3>
      <button @click="toggleDetail" class="toggle-btn">
        {{ showDetail ? '收起详情' : '展开详情' }}
      </button>
    </div>

    <!-- 基础属性概览 -->
    <div class="stats-overview">
      <div class="stat-group">
        <h4>战斗属性</h4>
        <div class="stat-item" v-for="stat in combatStats" :key="stat.key">
          <span class="stat-name">{{ stat.name }}</span>
          <span v-if="stat.purpose" class="stat-purpose">{{ stat.purpose }}</span>
          <div class="stat-value-wrapper">
            <span class="stat-value">{{ stat.value }}</span>
            <span class="stat-max" v-if="stat.max">/{{ stat.max }}</span>
            <span class="stat-growth" v-if="stat.growth">
              <arrow-up-icon v-if="stat.growth > 0" class="arrow-up" />
              <arrow-down-icon v-if="stat.growth < 0" class="arrow-down" />
              {{ Math.abs(stat.growth) }}
            </span>
          </div>
          <div class="stat-bar">
            <div 
              class="stat-bar-fill" 
              :style="{ width: getStatPercent(stat.value, stat.max) + '%' }"
              :class="getStatBarClass(stat.key)"
            ></div>
          </div>
        </div>
      </div>

      <div class="stat-group">
        <h4>非战斗属性</h4>
        <div class="stat-item" v-for="stat in nonCombatStats" :key="stat.key">
          <span class="stat-name">{{ stat.name }}</span>
          <span v-if="stat.purpose" class="stat-purpose">{{ stat.purpose }}</span>
          <span v-if="stat.displayLabel" class="stat-fuzzy">{{ stat.displayLabel }}</span>
          <div class="stat-value-wrapper">
            <span class="stat-value">{{ stat.value }}</span>
            <span class="stat-growth" v-if="stat.growth">
              <arrow-up-icon v-if="stat.growth > 0" class="arrow-up" />
              <arrow-down-icon v-if="stat.growth < 0" class="arrow-down" />
              {{ Math.abs(stat.growth) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 所属与称号信息 -->
    <div class="affiliation-section" v-if="currentAffiliationInfo || player.title || importantFlags.length > 0">
      <h4>所属与称号</h4>
      <div class="affiliation-content">
        <div v-if="currentAffiliationInfo" class="affiliation-badge" :class="currentAffiliationInfo.organizationClass">
          <span class="affiliation-name">{{ currentAffiliationInfo.displayName }}</span>
          <span class="affiliation-class">{{ factionNameMap[currentAffiliationInfo.organizationClass] }}</span>
        </div>
        <div v-if="player.title" class="player-title">
          称号：{{ player.title }}
        </div>
        <div v-if="importantFlags.length > 0" class="important-flags">
          <span 
            v-for="flag in importantFlags" 
            :key="flag.key"
            class="flag-badge"
            :class="flag.type"
          >
            {{ flag.label }}
          </span>
        </div>
      </div>
    </div>

    <!-- 详细信息（展开） -->
    <div v-if="showDetail" class="stats-detail">
      <!-- 属性详情 -->
      <div class="stats-breakdown">
        <h4>属性详情</h4>
        <div class="breakdown-grid">
          <div class="breakdown-item" v-for="detail in allStatDetails" :key="detail.key">
            <div class="breakdown-header">
              <span class="breakdown-name">{{ detail.name }}</span>
              <span class="breakdown-value">{{ detail.current }}/{{ detail.max }}</span>
            </div>
            <div class="breakdown-details">
              <div class="breakdown-row">
                <span class="label">基础值:</span>
                <span class="value">{{ detail.base }}</span>
              </div>
              <div class="breakdown-row">
                <span class="label">成长速度:</span>
                <span class="value" :class="{ positive: detail.growthRate > 0 }">
                  {{ detail.growthRate.toFixed(2) }}/年
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 属性认知指引（P7） -->
      <div class="suggestions-section">
        <h4>属性认知</h4>
        <div class="suggestion-list">
          <div
            v-for="tip in attributeGuidanceTips"
            :key="tip.key"
            class="suggestion-item recommended"
          >
            <div class="suggestion-header">
              <span class="suggestion-title">{{ tip.name }}</span>
            </div>
            <p class="suggestion-desc">{{ tip.purpose }}</p>
            <p v-if="tip.example" class="suggestion-desc">{{ tip.example }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { ArrowUpIcon, ArrowDownIcon, CheckIcon, XIcon } from 'lucide-vue-next';
import type { PlayerState } from '../types/eventTypes';
import { getAffiliationDefinition } from '../core/affiliationCatalog';
import {
  attributeMeaningCatalog,
  defaultSelfAwareness,
  fuzzyLabelForStat,
  getAttributeMeaning,
  preciseLabelForStat,
} from '../data/attributeMeanings';

interface Props {
  player: PlayerState;
}

const props = defineProps<Props>();

const showDetail = ref(false);

// 切换详情显示
const toggleDetail = () => {
  showDetail.value = !showDetail.value;
};

// 战斗属性配置
const combatStatConfigs = [
  { key: 'martialPower', name: '功力', max: 120 },
  { key: 'constitution', name: '体魄', max: 110 }
];

// 非战斗属性配置
const nonCombatStatConfigs = [
  { key: 'charisma', name: '魅力' },
  { key: 'comprehension', name: '悟性' },
  { key: 'chivalry', name: '侠义', min: -100, max: 100 },
  { key: 'reputation', name: '名望', min: -1000, max: 1000 },
  { key: 'connections', name: '人脉' },
  { key: 'knowledge', name: '学识' },
  { key: 'wealth', name: '财富', max: 10000 }
];

// 获取战斗属性
const selfAwarenessScore = computed(() => defaultSelfAwareness(props.player));

const statPurpose = (key: string): string | undefined => getAttributeMeaning(key)?.purpose;

const implicitDisplayLabel = (key: string, value: number): string | undefined => {
  const meaning = getAttributeMeaning(key);
  if (!meaning || meaning.visibilityTier === 'explicit' || meaning.visibilityTier === 'hidden') {
    return undefined;
  }
  if (meaning.visibilityTier === 'implicit' && selfAwarenessScore.value < 40) {
    return fuzzyLabelForStat(key);
  }
  if (meaning.visibilityTier === 'semi_implicit' && selfAwarenessScore.value < 55) {
    return fuzzyLabelForStat(key);
  }
  if (meaning.visibilityTier === 'implicit' || meaning.visibilityTier === 'semi_implicit') {
    return preciseLabelForStat(key, value);
  }
  return undefined;
};

const combatStats = computed(() => {
  return combatStatConfigs.map(config => ({
    key: config.key,
    name: config.name,
    value: props.player[config.key as keyof PlayerState] as number || 0,
    max: config.max || 100,
    growth: 0,
    purpose: statPurpose(config.key),
  }));
});

// 获取非战斗属性
const nonCombatStats = computed(() => {
  return nonCombatStatConfigs.map(config => {
    const value = props.player[config.key as keyof PlayerState] as number || 0;
    return {
      key: config.key,
      name: config.name,
      value,
      growth: 0,
      purpose: statPurpose(config.key),
      displayLabel: implicitDisplayLabel(config.key, value),
    };
  });
});

const attributeGuidanceTips = computed(() =>
  attributeMeaningCatalog
    .filter(entry => entry.visibilityTier === 'explicit' || entry.visibilityTier === 'semi_implicit')
    .slice(0, 6)
    .map(entry => ({
      key: entry.key,
      name: entry.name,
      purpose: entry.purpose,
      example: entry.examples[0] ? `例：${entry.examples[0]}` : '',
    })),
);

// 阵营名称映射
const factionNameMap: Record<string, string> = {
  'orthodox': '正道',
  'unconventional': '非传统',
  'neutral': '中立',
};

const currentAffiliationInfo = computed(() => {
  const affiliation = props.player.affiliation;
  return affiliation ? getAffiliationDefinition(affiliation) : null;
});

// 重要标志列表
const importantFlags = computed(() => {
  const flags: { key: string; label: string; type: string }[] = [];
  
  if (props.player.flags?.sect_switch_cooldown) {
    flags.push({
      key: 'cooldown',
      label: `门派冷却(${props.player.flags.sect_switch_cooldown}年)`,
      type: 'warning'
    });
  }
  if (props.player.flags?.beggars_departed) {
    flags.push({ key: 'beggars_departed', label: '已脱离丐帮', type: 'info' });
  }
  if (props.player.flags?.border_departed) {
    flags.push({ key: 'border_departed', label: '已离开边关', type: 'info' });
  }
  if (props.player.flags?.marginal_departed) {
    flags.push({ key: 'marginal_departed', label: '已脱离幽影门', type: 'info' });
  }
  if (props.player.flags?.orthodox_departed) {
    flags.push({ key: 'orthodox_departed', label: '已离开师门', type: 'info' });
  }
  if (props.player.flags?.buddhist_secularized) {
    flags.push({ key: 'buddhist_secularized', label: '已还俗', type: 'info' });
  }
  
  return flags;
});

// 获取属性百分比
const getStatPercent = (value: number, max: number) => {
  return Math.min(100, Math.max(0, (value / max) * 100));
};

// 获取属性条颜色
const getStatBarClass = (statKey: string) => {
  const classMap: { [key: string]: string } = {
    'martialPower': 'bar-martial',
    'constitution': 'bar-constitution'
  };
  return classMap[statKey] || '';
};

// 属性详情
const allStatDetails = computed(() => {
  const allConfigs = [...combatStatConfigs, ...nonCombatStatConfigs];
  return allConfigs.map(config => {
    const currentValue = props.player[config.key as keyof PlayerState] as number || 0;
    const max = config.max || 100;
    
    return {
      key: config.key,
      name: config.name,
      current: currentValue,
      max: max,
      base: currentValue, // TODO: 分离基础值和加成
      growthRate: 0 // TODO: 从成长系统获取
    };
  });
});

</script>

<style scoped>
.attribute-panel {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 12px;
  padding: 20px;
  color: #fff;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
}

.panel-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.toggle-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #fff;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.toggle-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.stats-overview {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.stat-group h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
}

.stat-item {
  margin-bottom: 12px;
}

.stat-name {
  display: block;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 4px;
}

.stat-purpose {
  display: block;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.45);
  margin-bottom: 4px;
  line-height: 1.3;
}

.stat-fuzzy {
  display: block;
  font-size: 11px;
  color: rgba(255, 215, 128, 0.75);
  margin-bottom: 4px;
  font-style: italic;
}

.stat-value-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
}

.stat-max {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
}

.stat-growth {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  color: #4ade80;
}

.arrow-up {
  width: 12px;
  height: 12px;
}

.arrow-down {
  width: 12px;
  height: 12px;
  color: #ef4444;
}

.stat-bar {
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.stat-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.bar-martial { background: linear-gradient(90deg, #ef4444, #f97316); }
.bar-constitution { background: linear-gradient(90deg, #8b5cf6, #ec4899); }

.stats-detail {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 2px solid rgba(255, 255, 255, 0.1);
}

.stats-breakdown,
.suggestions-section {
  margin-bottom: 20px;
}

.stats-breakdown h4,
.suggestions-section h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
}

.breakdown-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 12px;
}

.breakdown-item {
  background: rgba(255, 255, 255, 0.05);
  padding: 12px;
  border-radius: 8px;
}

.breakdown-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.breakdown-name {
  font-weight: 600;
}

.breakdown-value {
  color: #4ade80;
}

.breakdown-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.breakdown-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.breakdown-row .label {
  color: rgba(255, 255, 255, 0.6);
}

.breakdown-row .value {
  color: rgba(255, 255, 255, 0.9);
}

.breakdown-row .value.positive {
  color: #4ade80;
}

.suggestion-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.suggestion-item {
  padding: 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
}

.suggestion-item.recommended {
  border: 2px solid #4ade80;
}

.suggestion-item.locked {
  opacity: 0.7;
}

.suggestion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.suggestion-title {
  font-weight: 600;
  font-size: 15px;
}

.suggestion-path {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(74, 222, 128, 0.2);
  color: #4ade80;
}

.suggestion-desc {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 12px 0;
}

.requirements {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.requirement {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.2);
}

.requirement.met {
  background: rgba(74, 222, 128, 0.2);
  color: #4ade80;
}

.check-icon,
.x-icon {
  width: 14px;
  height: 14px;
}

.check-icon {
  color: #4ade80;
}

.x-icon {
  color: #ef4444;
}

/* 所属与称号区域 */
.affiliation-section {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 2px solid rgba(255, 255, 255, 0.1);
}

.affiliation-section h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
}

.affiliation-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.affiliation-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  font-weight: 600;
}

.affiliation-badge.orthodox {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(139, 92, 246, 0.3));
  border: 2px solid rgba(59, 130, 246, 0.6);
  color: #93c5fd;
}

.affiliation-badge.unconventional {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(249, 115, 22, 0.3));
  border: 2px solid rgba(239, 68, 68, 0.6);
  color: #fca5a5;
}

.affiliation-badge.neutral {
  background: linear-gradient(135deg, rgba(234, 179, 8, 0.3), rgba(234, 179, 8, 0.3));
  border: 2px solid rgba(234, 179, 8, 0.6);
  color: #fde047;
}

.affiliation-name {
  font-size: 15px;
}

.affiliation-class {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.2);
}

 .player-title {
  color: rgba(255, 255, 255, 0.85);
  font-size: 14px;
}

/* 重要标志 */
.important-flags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}

.flag-badge {
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 11px;
}

.flag-badge.warning {
  background: rgba(249, 115, 22, 0.3);
  color: #fdba74;
  border: 1px solid rgba(249, 115, 22, 0.5);
}

.flag-badge.info {
  background: rgba(139, 92, 246, 0.2);
  color: #c4b5fd;
  border: 1px solid rgba(139, 92, 246, 0.4);
}
</style>
