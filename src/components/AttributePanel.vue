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

    <!-- 门派与身份信息 -->
    <div class="identity-section" v-if="currentSectInfo || playerIdentities.length > 0">
      <h4>门派与身份</h4>
      <div class="identity-content">
        <!-- 当前门派 -->
        <div v-if="currentSectInfo" class="sect-badge" :class="currentSectInfo.faction">
          <span class="sect-name">{{ currentSectInfo.name }}</span>
          <span class="sect-faction">{{ currentSectInfo.factionName }}</span>
        </div>
        
        <!-- 身份标签 -->
        <div v-if="playerIdentities.length > 0" class="identity-tags">
          <span 
            v-for="identity in playerIdentities" 
            :key="identity"
            class="identity-tag"
            :class="getIdentityClass(identity)"
          >
            {{ getIdentityName(identity) }}
          </span>
        </div>
        
        <!-- 重要标志 -->
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
      <!-- 天赋展示 -->
      <div class="talents-section">
        <h4>天赋潜能</h4>
        <div class="talent-list">
          <div 
            v-for="talent in playerTalents" 
            :key="talent.id"
            class="talent-item"
            :class="talent.rarity"
          >
            <div class="talent-header">
              <span class="talent-name">{{ talent.name }}</span>
              <span class="talent-rarity">{{ getRarityName(talent.rarity) }}</span>
            </div>
            <p class="talent-desc">{{ getTalentNarrative(talent.id) }}</p>
            <div class="talent-effects" v-if="showDetail && talent.growthBonus">
              <div 
                v-for="(effect, key) in talent.growthBonus" 
                :key="key"
                class="talent-effect"
              >
                {{ getStatName(key) }} +{{ ((effect || 0) * 100).toFixed(0) }}%
              </div>
            </div>
          </div>
          <div v-if="playerTalents.length === 0" class="no-talent">
            尚未发现天赋
          </div>
        </div>
      </div>

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
                <span class="label">天赋加成:</span>
                <span class="value" :class="{ positive: detail.talentBonus > 0 }">
                  {{ detail.talentBonus > 0 ? '+' : '' }}{{ (detail.talentBonus * 100).toFixed(0) }}%
                </span>
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

      <!-- 发展建议 -->
      <div class="suggestions-section">
        <h4>发展建议</h4>
        <div class="suggestion-list">
          <div 
            v-for="suggestion in developmentSuggestions" 
            :key="suggestion.id"
            class="suggestion-item"
            :class="suggestion.priority"
          >
            <div class="suggestion-header">
              <span class="suggestion-title">{{ suggestion.title }}</span>
              <span class="suggestion-path">{{ suggestion.path }}</span>
            </div>
            <p class="suggestion-desc">{{ suggestion.description }}</p>
            <div class="suggestion-requirements">
              <div 
                v-for="(req, key) in suggestion.requirements" 
                :key="key"
                class="requirement"
                :class="{ met: req?.met }"
              >
                {{ req?.name || key }}: {{ req?.current || 0 }}/{{ req?.required || 0 }}
                <check-icon v-if="req?.met" class="check-icon" />
                <x-icon v-else class="x-icon" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { ArrowUpIcon, ArrowDownIcon, CheckIcon, XIcon } from 'lucide-vue-next';
import type { PlayerState, TalentDefinition } from '@/types/eventTypes';

interface Props {
  player: PlayerState;
  talents?: TalentDefinition[];
}

const props = withDefaults(defineProps<Props>(), {
  talents: () => []
});

const showDetail = ref(false);

// 切换详情显示
const toggleDetail = () => {
  showDetail.value = !showDetail.value;
};

// 战斗属性配置
const combatStatConfigs = [
  { key: 'martialPower', name: '功力', max: 120 },
  { key: 'externalSkill', name: '外功', max: 115 },
  { key: 'internalSkill', name: '内功', max: 115 },
  { key: 'qinggong', name: '轻功', max: 110 },
  { key: 'constitution', name: '体魄', max: 110 }
];

// 非战斗属性配置
const nonCombatStatConfigs = [
  { key: 'charisma', name: '魅力' },
  { key: 'comprehension', name: '悟性' },
  { key: 'chivalry', name: '侠义', min: -100, max: 100 },
  { key: 'reputation', name: '声望', min: -1000, max: 1000 },
  { key: 'connections', name: '人脉' },
  { key: 'knowledge', name: '学识' },
  { key: 'wealth', name: '财富', max: 10000 }
];

// 获取战斗属性
const combatStats = computed(() => {
  return combatStatConfigs.map(config => ({
    key: config.key,
    name: config.name,
    value: props.player[config.key as keyof PlayerState] as number || 0,
    max: config.max || 100,
    growth: 0 // TODO: 从成长系统获取
  }));
});

// 获取非战斗属性
const nonCombatStats = computed(() => {
  return nonCombatStatConfigs.map(config => ({
    key: config.key,
    name: config.name,
    value: props.player[config.key as keyof PlayerState] as number || 0,
    growth: 0 // TODO: 从成长系统获取
  }));
});

// 获取玩家天赋
const playerTalents = computed(() => {
  if (!props.player.talents) return [];
  return props.talents.filter(t => props.player.talents?.includes(t.id));
});

// 门派名称映射
const sectNameMap: Record<string, { name: string; faction: string }> = {
  'shaolin': { name: '少林寺', faction: 'orthodox' },
  'wudang': { name: '武当派', faction: 'orthodox' },
  'beggars': { name: '丐帮', faction: 'neutral' },
  'shadow_sect': { name: '幽影门', faction: 'unconventional' },
  'youying': { name: '幽影门', faction: 'unconventional' },
  'tangmen': { name: '唐门', faction: 'neutral' },
  'mingjiao': { name: '明教', faction: 'unconventional' },
  'border': { name: '边关守军', faction: 'neutral' },
};

// 阵营名称映射
const factionNameMap: Record<string, string> = {
  'orthodox': '正道',
  'unconventional': '非传统',
  'neutral': '中立',
};

// 获取当前门派信息
const currentSectInfo = computed(() => {
  const currentSect = props.player.flags?.current_sect;
  if (!currentSect) return null;
  
  const sectInfo = sectNameMap[currentSect];
  if (!sectInfo) {
    return {
      name: currentSect,
      faction: 'neutral',
      factionName: '未知'
    };
  }
  
  return {
    name: sectInfo.name,
    faction: sectInfo.faction,
    factionName: factionNameMap[sectInfo.faction] || sectInfo.faction
  };
});

// 玩家身份列表
const playerIdentities = computed(() => {
  const identities: string[] = [];
  
  // 根据 flags 判断身份
  if (props.player.flags?.route_beggars) identities.push('beggar');
  if (props.player.flags?.route_border) identities.push('border');
  if (props.player.flags?.route_demonic || props.player.flags?.sect_faction === 'unconventional') identities.push('outlaw');
  if (props.player.flags?.route_orthodox || props.player.flags?.sect_shaolin || props.player.flags?.sect_wudang) identities.push('orthodox');
  if (props.player.flags?.route_official) identities.push('official');
  if (props.player.flags?.married) identities.push('married');
  if (props.player.flags?.has_child) identities.push('parent');
  if (props.player.flags?.retired) identities.push('retired');
  if (props.player.flags?.is_sect_leader) identities.push('sect_leader');
  
  return identities;
});

// 身份名称映射
const identityNameMap: Record<string, string> = {
  'beggar': '丐帮弟子',
  'border': '边关将士',
  'outlaw': '绿林好汉',
  'orthodox': '名门弟子',
  'official': '朝廷官员',
  'married': '已婚',
  'parent': '为人父母',
  'retired': '退隐江湖',
  'sect_leader': '一派之主',
};

// 获取身份名称
const getIdentityName = (identity: string): string => {
  return identityNameMap[identity] || identity;
};

// 获取身份样式类
const getIdentityClass = (identity: string): string => {
  const classMap: Record<string, string> = {
    'beggar': 'tag-neutral',
    'border': 'tag-neutral',
    'outlaw': 'tag-unconventional',
    'orthodox': 'tag-orthodox',
    'official': 'tag-orthodox',
    'married': 'tag-normal',
    'parent': 'tag-normal',
    'retired': 'tag-normal',
    'sect_leader': 'tag-special',
  };
  return classMap[identity] || 'tag-normal';
};

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
    'externalSkill': 'bar-external',
    'internalSkill': 'bar-internal',
    'qinggong': 'bar-qinggong',
    'constitution': 'bar-constitution'
  };
  return classMap[statKey] || '';
};

// 获取稀有度名称
const getRarityName = (rarity: string) => {
  const names: { [key: string]: string } = {
    'common': '普通',
    'uncommon': '优秀',
    'rare': '稀有',
    'legendary': '传说'
  };
  return names[rarity] || rarity;
};

// 天赋叙事文本
const talentNarratives: { [key: string]: string } = {
  // 战斗天赋
  'martial_genius': '你生来就展现出非凡的武学天赋，一招一式都能迅速领悟',
  'internal_focus': '你性情沉静，适合修炼内功心法，真气运转比常人顺畅',
  'external_focus': '你筋骨强健，天生神力，外功招式上手极快',
  'qigong_master': '你天生对气息敏感，轻功身法一点就通',
  'iron_body': '你体质特殊，皮糙肉厚，抗击打能力远超常人',
  
  // 学习天赋
  'quick_learner': '你天资聪颖，任何知识都能快速掌握',
  'scholar': '你酷爱读书，过目不忘，学识积累速度惊人',
  'martial_scholar': '你悟性超群，能触类旁通，从武学中领悟道理',
  
  // 社交天赋
  'charismatic': '你天生具有领袖气质，言谈举止自然吸引他人',
  'networker': '你善于交际，人脉广阔，消息灵通',
  'generous': '你乐善好施，侠名远播，容易获得他人好感',
  'diplomat': '你口才出众，善于说服，谈判能力极强',
  
  // 特殊天赋
  'lucky': '你运气极佳，总能在关键时刻化险为夷',
  'wealthy': '你出身富裕，家底丰厚，银钱来源不断',
  'martial_family': '你生于武学世家，从小耳濡目染，起点更高'
};

// 获取天赋叙事文本
const getTalentNarrative = (talentId: string): string => {
  return talentNarratives[talentId] || '你展现出特殊的天赋潜能';
};

// 获取属性名称
const getStatName = (key: string) => {
  const names: { [key: string]: string } = {
    'martialPower': '功力',
    'externalSkill': '外功',
    'internalSkill': '内功',
    'qinggong': '轻功',
    'constitution': '体魄',
    'charisma': '魅力',
    'comprehension': '悟性',
    'chivalry': '侠义',
    'reputation': '声望',
    'connections': '人脉',
    'knowledge': '学识',
    'wealth': '财富'
  };
  return names[key] || key;
};

// 属性详情
const allStatDetails = computed(() => {
  const allConfigs = [...combatStatConfigs, ...nonCombatStatConfigs];
  return allConfigs.map(config => {
    const currentValue = props.player[config.key as keyof PlayerState] as number || 0;
    const talentBonus = calculateTalentBonus(config.key);
    const max = config.max || 100;
    
    return {
      key: config.key,
      name: config.name,
      current: currentValue,
      max: max,
      base: currentValue, // TODO: 分离基础值和加成
      talentBonus: talentBonus,
      growthRate: 0 // TODO: 从成长系统获取
    };
  });
});

// 计算天赋加成
const calculateTalentBonus = (statKey: string): number => {
  if (!props.player.talents) return 0;
  
  let bonus = 0;
  props.player.talents.forEach(talentId => {
    const talent = props.talents.find(t => t.id === talentId);
    const growthMap = talent?.growthBonus as Record<string, number> | undefined;
    if (growthMap && growthMap[statKey]) {
      bonus += growthMap[statKey];
    }
  });
  
  return bonus;
};

// 发展建议
const developmentSuggestions = computed(() => {
  const suggestions = [];
  
  // 仕途线建议
  const officialReq = {
    knowledge: 60,
    charisma: 50,
    connections: 40
  };
  const officialMet = {
    knowledge: (props.player.knowledge || 0) >= officialReq.knowledge,
    charisma: (props.player.charisma || 0) >= officialReq.charisma,
    connections: (props.player.connections || 0) >= officialReq.connections
  };
  const officialAllMet = Object.values(officialMet).every(v => v);
  
  suggestions.push({
    id: 'official',
    title: '入仕为官',
    path: '仕途',
    priority: officialAllMet ? 'recommended' : 'locked',
    description: '通过科举入仕，官至高位，流芳百世',
    requirements: {
      knowledge: {
        name: '学识',
        current: props.player.knowledge || 0,
        required: officialReq.knowledge,
        met: officialMet.knowledge
      },
      charisma: {
        name: '魅力',
        current: props.player.charisma || 0,
        required: officialReq.charisma,
        met: officialMet.charisma
      },
      connections: {
        name: '人脉',
        current: props.player.connections || 0,
        required: officialReq.connections,
        met: officialMet.connections
      }
    }
  });
  
  // 商业线建议
  const merchantReq = {
    wealth: 500,
    charisma: 40,
    connections: 30
  };
  const merchantMet = {
    wealth: (props.player.wealth || 0) >= merchantReq.wealth,
    charisma: (props.player.charisma || 0) >= merchantReq.charisma,
    connections: (props.player.connections || 0) >= merchantReq.connections
  };
  const merchantAllMet = Object.values(merchantMet).every(v => v);
  
  suggestions.push({
    id: 'merchant',
    title: '经商致富',
    path: '商业',
    priority: merchantAllMet ? 'recommended' : 'locked',
    description: '投资经商，积累财富，成一方首富',
    requirements: {
      wealth: {
        name: '财富',
        current: props.player.wealth || 0,
        required: merchantReq.wealth,
        met: merchantMet.wealth
      },
      charisma: {
        name: '魅力',
        current: props.player.charisma || 0,
        required: merchantReq.charisma,
        met: merchantMet.charisma
      },
      connections: {
        name: '人脉',
        current: props.player.connections || 0,
        required: merchantReq.connections,
        met: merchantMet.connections
      }
    }
  });
  
  // 隐士线建议
  const hermitReq = {
    chivalry: 60,
    knowledge: 40
  };
  const hermitMet = {
    chivalry: (props.player.chivalry || 0) >= hermitReq.chivalry,
    knowledge: (props.player.knowledge || 0) >= hermitReq.knowledge
  };
  const hermitAllMet = Object.values(hermitMet).every(v => v);
  
  suggestions.push({
    id: 'hermit',
    title: '江湖隐士',
    path: '隐士',
    priority: hermitAllMet ? 'recommended' : 'locked',
    description: '远离尘世，专心修炼，成世外高人',
    requirements: {
      chivalry: {
        name: '侠义',
        current: props.player.chivalry || 0,
        required: hermitReq.chivalry,
        met: hermitMet.chivalry
      },
      knowledge: {
        name: '学识',
        current: props.player.knowledge || 0,
        required: hermitReq.knowledge,
        met: hermitMet.knowledge
      }
    }
  });
  
  return suggestions;
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
.bar-external { background: linear-gradient(90deg, #f97316, #eab308); }
.bar-internal { background: linear-gradient(90deg, #3b82f6, #8b5cf6); }
.bar-qinggong { background: linear-gradient(90deg, #10b981, #3b82f6); }
.bar-constitution { background: linear-gradient(90deg, #8b5cf6, #ec4899); }

.stats-detail {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 2px solid rgba(255, 255, 255, 0.1);
}

.talents-section,
.stats-breakdown,
.suggestions-section {
  margin-bottom: 20px;
}

.talents-section h4,
.stats-breakdown h4,
.suggestions-section h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
}

.talent-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.talent-item {
  padding: 12px;
  border-radius: 8px;
  border-left: 4px solid;
}

.talent-item.legendary {
  background: rgba(234, 179, 8, 0.1);
  border-color: #eab308;
}

.talent-item.rare {
  background: rgba(139, 92, 246, 0.1);
  border-color: #8b5cf6;
}

.talent-item.uncommon {
  background: rgba(59, 130, 246, 0.1);
  border-color: #3b82f6;
}

.talent-item.common {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.3);
}

.talent-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.talent-name {
  font-weight: 600;
  font-size: 15px;
}

.talent-rarity {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.2);
}

.talent-desc {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 8px 0;
}

.talent-effects {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.talent-effect {
  font-size: 12px;
  color: #4ade80;
  background: rgba(74, 222, 128, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
}

.no-talent {
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  padding: 20px;
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

/* 门派与身份区域 */
.identity-section {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 2px solid rgba(255, 255, 255, 0.1);
}

.identity-section h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
}

.identity-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 门派徽章 */
.sect-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  font-weight: 600;
}

.sect-badge.orthodox {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(139, 92, 246, 0.3));
  border: 2px solid rgba(59, 130, 246, 0.6);
  color: #93c5fd;
}

.sect-badge.unconventional {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(249, 115, 22, 0.3));
  border: 2px solid rgba(239, 68, 68, 0.6);
  color: #fca5a5;
}

.sect-badge.neutral {
  background: linear-gradient(135deg, rgba(234, 179, 8, 0.3), rgba(234, 179, 8, 0.3));
  border: 2px solid rgba(234, 179, 8, 0.6);
  color: #fde047;
}

.sect-name {
  font-size: 15px;
}

.sect-faction {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.2);
}

/* 身份标签 */
.identity-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.identity-tag {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.tag-orthodox {
  background: rgba(59, 130, 246, 0.2);
  color: #93c5fd;
  border: 1px solid rgba(59, 130, 246, 0.4);
}

.tag-unconventional {
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.4);
}

.tag-neutral {
  background: rgba(234, 179, 8, 0.2);
  color: #fde047;
  border: 1px solid rgba(234, 179, 8, 0.4);
}

.tag-normal {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.tag-special {
  background: linear-gradient(135deg, rgba(234, 179, 8, 0.3), rgba(249, 115, 22, 0.3));
  color: #fde047;
  border: 1px solid rgba(234, 179, 8, 0.5);
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
