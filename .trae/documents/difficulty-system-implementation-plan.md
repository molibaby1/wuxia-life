# 难度提升系统实施计划

**版本**: v1.0
**创建时间**: 2026-03-19
**状态**: 计划中
**语言**: 中文

---

## 一、需求概述

为提升游戏的多样性与趣味性，需系统性地实施难度提升方案，包括：
1. **选择失败概率系统** - 基于角色状态的动态失败概率
2. **事件触发门槛机制** - 基于声望/知名度的事件解锁
3. **意外挫折事件系统** - 随机负面事件模块
4. **难度配置与测试支持** - 全局配置面板和测试模式

---

## 二、技术现状分析

### 2.1 现有系统
- **事件定义**: `EventDefinition` 结构，包含 `conditions`、`triggers`、`thresholds`
- **条件评估**: `ConditionEvaluator` 支持表达式解析
- **事件执行**: `EventExecutor` 处理各种效果类型
- **游戏状态**: `GameState` 追踪玩家属性、flags、事件历史
- **声望范围**: -1000 ~ 1000

### 2.2 核心文件
| 文件 | 功能 |
|------|------|
| `src/core/GameEngineIntegration.ts` | 事件选择与触发逻辑 |
| `src/core/EventExecutor.ts` | 效果执行器 |
| `src/core/ConditionEvaluator.ts` | 条件评估 |
| `src/types/eventTypes.ts` | 类型定义 |
| `src/components/DebugPanel.vue` | 调试面板 |

---

## 三、系统设计

### 3.1 选择失败概率系统

#### 3.1.1 核心类型定义

```typescript
// src/types/difficultyTypes.ts (新文件)

/**
 * 难度配置
 */
export interface DifficultyConfig {
  /** 失败概率系数 (0.5-2.0) */
  failureProbabilityCoefficient: number;
  
  /** 事件触发门槛系数 (0.5-2.0) */
  eventThresholdCoefficient: number;
  
  /** 挫折事件触发概率 (0-100%) */
  setbackEventProbability: number;
  
  /** 测试模式开关 */
  testModeEnabled: boolean;
}

/**
 * 挑战难度等级
 */
export enum ChallengeLevel {
  EASY = 'easy',           // 新手友好
  NORMAL = 'normal',        // 标准难度
  HARD = 'hard',           // 挑战模式
  NIGHTMARE = 'nightmare'   // 噩梦模式
}

/**
 * 选择失败判定
 */
export interface ChoiceFailureCheck {
  /** 基础失败概率 (0-100) */
  baseFailureRate: number;
  
  /** 失败原因描述 */
  failureReason: string;
  
  /** 难度系数调整 */
  difficultyModifier: number;
  
  /** 最终失败概率 */
  finalFailureRate: number;
}

/**
 * 挑战场景配置
 */
export interface ChallengeScene {
  /** 场景 ID */
  id: string;
  
  /** 场景名称 */
  name: string;
  
  /** 基础失败概率 */
  baseFailureRate: number;
  
  /** 能力评估字段 */
  relevantStats: (keyof PlayerStats)[];
  
  /** 能力阈值 */
  thresholds: {
    [stat: string]: {
      /** 合格阈值 */
      qualified: number;
      /** 优秀阈值 */
      excellent: number;
      /** 失败概率减免 */
      failureRateReduction: number;
    };
  };
}

/**
 * 失败反馈类型
 */
export interface FailureFeedback {
  /** 视觉反馈类型 */
  visualType: 'shake' | 'red_flash' | 'darken' | 'none';
  
  /** 文本反馈 */
  textFeedback: string;
  
  /** 音效标识 */
  soundEffect: string;
  
  /** 失败动画时长 (ms) */
  animationDuration: number;
}
```

#### 3.1.2 失败概率计算公式

```typescript
// src/core/ChallengeSystem.ts (新文件)

/**
 * 失败概率 = 基础概率 × 难度系数 × 能力修正
 * 
 * 能力修正规则：
 * - 能力 < 合格阈值: 基础概率 + 20%
 * - 能力 >= 优秀阈值: 基础概率 - 30%
 * - 其他: 基础概率不变
 */
export function calculateFailureProbability(
  scene: ChallengeScene,
  playerStats: PlayerStats,
  difficultyCoefficient: number,
  testModeMultiplier: number = 1.0
): ChoiceFailureCheck {
  let failureRate = scene.baseFailureRate;
  let failureReason = '';
  let totalModifier = 1.0;
  
  // 检查各项能力
  for (const stat of scene.relevantStats) {
    const statValue = playerStats[stat] || 0;
    const threshold = scene.thresholds[stat];
    
    if (threshold) {
      if (statValue < threshold.qualified) {
        // 能力不足
        totalModifier += 0.2;
        failureReason += `${stat}不足(${statValue}/${threshold.qualified}) `;
      } else if (statValue >= threshold.excellent) {
        // 能力优秀
        totalModifier -= threshold.failureRateReduction;
        failureReason += `${stat}优秀(${statValue}) `;
      }
    }
  }
  
  // 确保失败概率在有效范围内
  const finalFailureRate = Math.max(5, Math.min(95, 
    failureRate * difficultyCoefficient * totalModifier * testModeMultiplier
  ));
  
  return {
    baseFailureRate: failureRate,
    failureReason: failureReason || '能力评估完成',
    difficultyModifier: difficultyCoefficient,
    finalFailureRate
  };
}
```

#### 3.1.3 预设挑战场景

```typescript
// src/data/challengeScenes.ts (新文件)

export const CHALLENGE_SCENES: Record<string, ChallengeScene> = {
  // 武林大会
  martial_arts_tournament: {
    id: 'martial_arts_tournament',
    name: '武林大会',
    baseFailureRate: 50,
    relevantStats: ['martialPower', 'externalSkill', 'internalSkill', 'comprehension'],
    thresholds: {
      martialPower: { qualified: 80, excellent: 150, failureRateReduction: 0.3 },
      externalSkill: { qualified: 60, excellent: 100, failureRateReduction: 0.15 },
      internalSkill: { qualified: 50, excellent: 90, failureRateReduction: 0.15 },
      comprehension: { qualified: 40, excellent: 70, failureRateReduction: 0.1 }
    }
  },
  
  // 新手参加武林大会
  martial_arts_tournament_novice: {
    id: 'martial_arts_tournament_novice',
    name: '武林大会（新手武者）',
    baseFailureRate: 80,  // 极高基础失败率
    relevantStats: ['martialPower', 'externalSkill'],
    thresholds: {
      martialPower: { qualified: 100, excellent: 200, failureRateReduction: 0.35 },
      externalSkill: { qualified: 80, excellent: 120, failureRateReduction: 0.2 }
    }
  },
  
  // 科举考试
  imperial_exam: {
    id: 'imperial_exam',
    name: '科举考试',
    baseFailureRate: 40,
    relevantStats: ['knowledge', 'comprehension', 'charisma'],
    thresholds: {
      knowledge: { qualified: 60, excellent: 85, failureRateReduction: 0.25 },
      comprehension: { qualified: 50, excellent: 75, failureRateReduction: 0.15 },
      charisma: { qualified: 40, excellent: 70, failureRateReduction: 0.1 }
    }
  },
  
  // 商业谈判
  business_negotiation: {
    id: 'business_negotiation',
    name: '商业谈判',
    baseFailureRate: 35,
    relevantStats: ['charisma', 'businessAcumen', 'connections'],
    thresholds: {
      charisma: { qualified: 50, excellent: 80, failureRateReduction: 0.2 },
      businessAcumen: { qualified: 50, excellent: 80, failureRateReduction: 0.2 },
      connections: { qualified: 40, excellent: 70, failureRateReduction: 0.1 }
    }
  },
  
  // 门派比武
  sect_sparring: {
    id: 'sect_sparring',
    name: '门派比武',
    baseFailureRate: 30,
    relevantStats: ['martialPower', 'externalSkill', 'qinggong'],
    thresholds: {
      martialPower: { qualified: 50, excellent: 100, failureRateReduction: 0.25 },
      externalSkill: { qualified: 40, excellent: 80, failureRateReduction: 0.15 },
      qinggong: { qualified: 30, excellent: 60, failureRateReduction: 0.1 }
    }
  }
};
```

### 3.2 事件触发门槛机制

#### 3.2.1 声望等级定义

```typescript
// src/data/reputationTiers.ts (新文件)

/**
 * 声望等级配置
 */
export interface ReputationTier {
  /** 等级名称 */
  name: string;
  
  /** 声望范围 */
  range: {
    min: number;
    max: number;
  };
  
  /** 可触发的事件类型 */
  availableEventTypes: EventCategory[];
  
  /** 事件触发加成 */
  eventProbabilityBonus: number;
  
  /** 解锁的特殊事件 ID */
  unlockedEvents: string[];
  
  /** 描述 */
  description: string;
}

export const REPUTATION_TIERS: ReputationTier[] = [
  {
    name: '无名之辈',
    range: { min: -1000, max: -101 },
    availableEventTypes: [EventCategory.DAILY_EVENT, EventCategory.RANDOM_ENCOUNTER],
    eventProbabilityBonus: -0.3,
    unlockedEvents: [],
    description: '江湖上无人知晓的存在'
  },
  {
    name: '市井小民',
    range: { min: -100, max: 0 },
    availableEventTypes: [EventCategory.DAILY_EVENT, EventCategory.RANDOM_ENCOUNTER, EventCategory.TIME_EVENT],
    eventProbabilityBonus: -0.1,
    unlockedEvents: [],
    description: '在本地有些许名气'
  },
  {
    name: '崭露头角',
    range: { min: 1, max: 100 },
    availableEventTypes: [EventCategory.DAILY_EVENT, EventCategory.RANDOM_ENCOUNTER, EventCategory.TIME_EVENT, EventCategory.SIDE_QUEST],
    eventProbabilityBonus: 0,
    unlockedEvents: ['minor_sect_invitation'],
    description: '开始引起江湖人士注意'
  },
  {
    name: '小有名气',
    range: { min: 101, max: 300 },
    availableEventTypes: [EventCategory.DAILY_EVENT, EventCategory.RANDOM_ENCOUNTER, EventCategory.TIME_EVENT, EventCategory.SIDE_QUEST, EventCategory.MAIN_STORY],
    eventProbabilityBonus: 0.1,
    unlockedEvents: ['minor_sect_invitation', 'martial_arts_tournament_observer'],
    description: '在一方地域有了名气'
  },
  {
    name: '一方豪杰',
    range: { min: 301, max: 600 },
    availableEventTypes: [EventCategory.DAILY_EVENT, EventCategory.RANDOM_ENCOUNTER, EventCategory.TIME_EVENT, EventCategory.SIDE_QUEST, EventCategory.MAIN_STORY, EventCategory.SPECIAL_EVENT],
    eventProbabilityBonus: 0.2,
    unlockedEvents: ['martial_arts_tournament_participant', 'important_person_invitation'],
    description: '成为一方霸主，门派争相拉拢'
  },
  {
    name: '江湖名侠',
    range: { min: 601, max: 1000 },
    availableEventTypes: [EventCategory.DAILY_EVENT, EventCategory.RANDOM_ENCOUNTER, EventCategory.TIME_EVENT, EventCategory.SIDE_QUEST, EventCategory.MAIN_STORY, EventCategory.SPECIAL_EVENT],
    eventProbabilityBonus: 0.35,
    unlockedEvents: ['sect_leader_invitation', 'wulin_conference_leader'],
    description: '名震江湖，受人敬仰'
  },
  {
    name: '一代宗师',
    range: { min: 1001, max: 2000 },
    availableEventTypes: Object.values(EventCategory),
    eventProbabilityBonus: 0.5,
    unlockedEvents: ['ending_legendary'],
    description: '开宗立派，武林至尊'
  }
];
```

#### 3.2.2 门槛检查逻辑

```typescript
// src/core/ReputationGateSystem.ts (新文件)

import { REPUTATION_TIERS, ReputationTier } from '../data/reputationTiers';
import { EventDefinition, EventCategory } from '../types/eventTypes';

/**
 * 获取当前声望等级
 */
export function getReputationTier(reputation: number): ReputationTier {
  for (const tier of REPUTATION_TIERS) {
    if (reputation >= tier.range.min && reputation <= tier.range.max) {
      return tier;
    }
  }
  return REPUTATION_TIERS[0]; // 默认无名之辈
}

/**
 * 检查事件是否满足声望门槛
 */
export function checkReputationGate(
  event: EventDefinition,
  playerReputation: number,
  thresholdCoefficient: number = 1.0
): { canTrigger: boolean; reason: string } {
  // 检查事件是否有声望要求
  if (!event.thresholds?.attributes?.reputation) {
    return { canTrigger: true, reason: '无声望门槛' };
  }
  
  const requiredRep = event.thresholds.attributes.reputation;
  const minRequired = requiredRep.min || 0;
  const maxAllowed = requiredRep.max || Infinity;
  
  // 应用难度系数（难度越高，要求越高）
  const adjustedMin = minRequired * thresholdCoefficient;
  const adjustedMax = maxAllowed === Infinity ? Infinity : maxAllowed * thresholdCoefficient;
  
  if (playerReputation < adjustedMin) {
    return {
      canTrigger: false,
      reason: `声望不足（当前: ${playerReputation}, 要求: ≥${Math.floor(adjustedMin)}）`
    };
  }
  
  if (playerReputation > adjustedMax) {
    return {
      canTrigger: false,
      reason: `声望过高（当前: ${playerReputation}, 要求: ≤${Math.floor(adjustedMax)}）`
    };
  }
  
  return { canTrigger: true, reason: '声望满足要求' };
}

/**
 * 检查事件类型是否在当前声望等级可用
 */
export function checkEventTypeAvailability(
  category: EventCategory,
  playerReputation: number
): boolean {
  const tier = getReputationTier(playerReputation);
  return tier.availableEventTypes.includes(category);
}
```

### 3.3 意外挫折事件系统

#### 3.3.1 挫折事件定义

```typescript
// src/data/setbackEvents.ts (新文件)

/**
 * 挫折事件配置
 */
export interface SetbackEventConfig {
  /** 事件 ID */
  id: string;
  
  /** 事件名称 */
  name: string;
  
  /** 严重程度 */
  severity: 'minor' | 'moderate' | 'severe' | 'critical';
  
  /** 基础触发概率 (%) */
  baseProbability: number;
  
  /** 触发条件 */
  conditions: {
    /** 最小年龄 */
    minAge?: number;
    /** 最小体质要求（豁免用） */
    minConstitution?: number;
    /** 必需身份 */
    requiredIdentities?: PlayerIdentity[];
    /** 禁止身份 */
    forbiddenIdentities?: PlayerIdentity[];
  };
  
  /** 效果 */
  effects: {
    /** 属性变化 */
    statChanges?: Partial<Record<keyof PlayerStats, number>>;
    /** 持续时间 (天数) */
    duration?: number;
    /** 死亡概率 */
    deathProbability?: number;
  };
  
  /** 豁免概率 (%) */
  exemptionRate: {
    /** 体质豁免阈值 */
    constitutionThreshold?: number;
    /** 基础豁免率 */
    baseRate: number;
  };
  
  /** 描述文本 */
  description: string;
}

export const SETBACK_EVENTS: SetbackEventConfig[] = [
  {
    id: 'serious_illness',
    name: '大病一场',
    severity: 'moderate',
    baseProbability: 4, // 3-5%
    conditions: {
      minAge: 16,
      minConstitution: 30
    },
    effects: {
      statChanges: {
        constitution: -15,
        martialPower: -10,
        energy: -20
      },
      duration: 180 // 约6个月
    },
    exemptionRate: {
      constitutionThreshold: 60,
      baseRate: 30
    },
    description: '一场突如其来的大病让你卧床不起，消耗大量精力'
  },
  {
    id: 'injury_accident',
    name: '意外受伤',
    severity: 'minor',
    baseProbability: 8,
    conditions: {
      minAge: 10
    },
    effects: {
      statChanges: {
        constitution: -5,
        martialPower: -3
      },
      duration: 90 // 约3个月
    },
    exemptionRate: {
      constitutionThreshold: 50,
      baseRate: 40
    },
    description: '意外受伤，需要休养一段时间'
  },
  {
    id: 'early_death',
    name: '英年早逝',
    severity: 'critical',
    baseProbability: 0.3, // ≤0.5%
    conditions: {
      minAge: 18,
      maxAge: 40 // 40岁之前
    },
    effects: {
      deathProbability: 100,
      statChanges: {
        constitution: -50
      }
    },
    exemptionRate: {
      constitutionThreshold: 80,
      baseRate: 60
    },
    description: '天妒英才，你的生命走到了尽头...'
  },
  {
    id: 'property_loss',
    name: '财产损失',
    severity: 'minor',
    baseProbability: 10,
    conditions: {},
    effects: {
      statChanges: {
        money: -100
      },
      duration: 0
    },
    exemptionRate: {
      baseRate: 20
    },
    description: '遭遇盗匪或经营失败，损失部分财产'
  },
  {
    id: 'relationship_betrayal',
    name: '挚友背叛',
    severity: 'moderate',
    baseProbability: 3,
    conditions: {
      minAge: 20
    },
    effects: {
      statChanges: {
        chivalry: -10,
        connections: -15
      },
      duration: 365 // 1年
    },
    exemptionRate: {
      constitutionThreshold: 50,
      baseRate: 25
    },
    description: '曾经信任的人背叛了你，让你心寒'
  }
];
```

#### 3.3.2 挫折事件触发器

```typescript
// src/core/SetbackEventSystem.ts (新文件)

import { SETBACK_EVENTS, SetbackEventConfig } from '../data/setbackEvents';
import type { GameState, PlayerState } from '../types/eventTypes';

/**
 * 触发挫折事件检查
 * 每次年度事件触发前调用
 */
export function checkSetbackEvents(
  state: GameState,
  globalProbabilityMultiplier: number = 1.0
): SetbackEventConfig[] {
  const triggeredSetbacks: SetbackEventConfig[] = [];
  const player = state.player;
  
  for (const event of SETBACK_EVENTS) {
    // 检查是否应该触发
    if (shouldTriggerSetback(event, player, globalProbabilityMultiplier)) {
      // 检查豁免
      if (!checkExemption(event, player)) {
        triggeredSetbacks.push(event);
        console.log(`[SetbackEvent] 触发挫折事件: ${event.name}`);
      } else {
        console.log(`[SetbackEvent] 挫折事件 ${event.name} 被豁免`);
      }
    }
  }
  
  return triggeredSetbacks;
}

/**
 * 判断是否应该触发挫折事件
 */
function shouldTriggerSetback(
  event: SetbackEventConfig,
  player: PlayerState,
  globalProbabilityMultiplier: number
): boolean {
  // 检查触发条件
  if (event.conditions.minAge && player.age < event.conditions.minAge) {
    return false;
  }
  
  // 随机概率检查
  const finalProbability = event.baseProbability * globalProbabilityMultiplier;
  const random = Math.random() * 100;
  
  return random < finalProbability;
}

/**
 * 检查是否豁免
 */
function checkExemption(
  event: SetbackEventConfig,
  player: PlayerState
): boolean {
  const exemption = event.exemptionRate;
  
  // 体质豁免检查
  if (exemption.constitutionThreshold) {
    if (player.constitution >= exemption.constitutionThreshold) {
      // 体质足够高，完全豁免
      return true;
    }
  }
  
  // 基础豁免率检查
  const random = Math.random() * 100;
  return random < exemption.baseRate;
}

/**
 * 应用挫折事件效果
 */
export function applySetbackEffects(
  state: GameState,
  setback: SetbackEventConfig
): GameState {
  let newState = { ...state };
  
  // 应用属性变化
  if (setback.effects.statChanges) {
    for (const [stat, value] of Object.entries(setback.effects.statChanges)) {
      const currentValue = (newState.player as any)[stat] || 0;
      (newState.player as any)[stat] = Math.max(0, currentValue + value);
    }
  }
  
  // 处理死亡
  if (setback.effects.deathProbability && setback.effects.deathProbability >= 100) {
    newState.player.alive = false;
    newState.player.deathReason = setback.name;
    newState.flags = { ...newState.flags, gameEnded: true };
  }
  
  // 设置状态标记（用于UI显示）
  if (setback.effects.duration && setback.effects.duration > 0) {
    newState.flags[`setback_${setback.id}_endTime`] = 
      (newState.currentTime?.year || 0) + Math.ceil(setback.effects.duration / 365);
    newState.flags[`setback_${setback.id}_active`] = true;
  }
  
  return newState;
}
```

### 3.4 难度配置系统

#### 3.4.1 全局配置管理

```typescript
// src/core/DifficultyManager.ts (新文件)

import { reactive } from 'vue';
import type { DifficultyConfig } from '../types/difficultyTypes';

/**
 * 默认难度配置
 */
const DEFAULT_DIFFICULTY_CONFIG: DifficultyConfig = {
  failureProbabilityCoefficient: 1.0,
  eventThresholdCoefficient: 1.0,
  setbackEventProbability: 1.0,
  testModeEnabled: false
};

/**
 * 难度配置管理器（响应式单例）
 */
export const difficultyManager = reactive({
  config: { ...DEFAULT_DIFFICULTY_CONFIG } as DifficultyConfig,
  
  /**
   * 更新配置
   */
  updateConfig(partial: Partial<DifficultyConfig>) {
    Object.assign(this.config, partial);
    this.saveConfig();
  },
  
  /**
   * 重置为默认配置
   */
  resetConfig() {
    this.config = { ...DEFAULT_DIFFICULTY_CONFIG };
    this.saveConfig();
  },
  
  /**
   * 启用测试模式
   */
  enableTestMode() {
    this.config.testModeEnabled = true;
    this.config.failureProbabilityCoefficient = 1.5;
    this.config.setbackEventProbability = 2.0;
    this.saveConfig();
  },
  
  /**
   * 禁用测试模式
   */
  disableTestMode() {
    this.config.testModeEnabled = false;
    this.config.failureProbabilityCoefficient = 1.0;
    this.config.setbackEventProbability = 1.0;
    this.saveConfig();
  },
  
  /**
   * 应用预设难度
   */
  applyPreset(preset: 'easy' | 'normal' | 'hard' | 'nightmare') {
    const presets = {
      easy: {
        failureProbabilityCoefficient: 0.7,
        eventThresholdCoefficient: 0.8,
        setbackEventProbability: 0.5
      },
      normal: {
        failureProbabilityCoefficient: 1.0,
        eventThresholdCoefficient: 1.0,
        setbackEventProbability: 1.0
      },
      hard: {
        failureProbabilityCoefficient: 1.3,
        eventThresholdCoefficient: 1.2,
        setbackEventProbability: 1.5
      },
      nightmare: {
        failureProbabilityCoefficient: 1.8,
        eventThresholdCoefficient: 1.5,
        setbackEventProbability: 2.0
      }
    };
    
    Object.assign(this.config, presets[preset]);
    this.saveConfig();
  },
  
  /**
   * 保存配置到 localStorage
   */
  saveConfig() {
    try {
      localStorage.setItem('wuxia_difficulty_config', JSON.stringify(this.config));
    } catch (e) {
      console.warn('[DifficultyManager] 保存配置失败', e);
    }
  },
  
  /**
   * 从 localStorage 加载配置
   */
  loadConfig() {
    try {
      const saved = localStorage.getItem('wuxia_difficulty_config');
      if (saved) {
        this.config = { ...DEFAULT_DIFFICULTY_CONFIG, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('[DifficultyManager] 加载配置失败', e);
    }
  }
});

// 初始化时加载配置
difficultyManager.loadConfig();
```

#### 3.4.2 难度数据监控

```typescript
// src/core/DifficultyMonitor.ts (新文件)

import { reactive } from 'vue';

interface DifficultyMetrics {
  /** 总选择次数 */
  totalChoices: number;
  
  /** 失败次数 */
  totalFailures: number;
  
  /** 失败率 */
  failureRate: number;
  
  /** 事件触发总数 */
  totalEventsTriggered: number;
  
  /** 尝试触发但被门槛阻挡的次数 */
  gateBlockedAttempts: number;
  
  /** 挫折事件触发次数 */
  setbackEventsTriggered: number;
  
  /** 玩家存活率 */
  playerSurvivalRate: number;
  
  /** 每年龄事件密度 */
  eventsPerAge: Record<number, number>;
  
  /** 记录时间戳 */
  lastUpdated: number;
}

/**
 * 难度数据监控器
 */
export const difficultyMonitor = reactive({
  metrics: {
    totalChoices: 0,
    totalFailures: 0,
    failureRate: 0,
    totalEventsTriggered: 0,
    gateBlockedAttempts: 0,
    setbackEventsTriggered: 0,
    playerSurvivalRate: 100,
    eventsPerAge: {},
    lastUpdated: Date.now()
  } as DifficultyMetrics,
  
  /**
   * 记录选择
   */
  recordChoice(failed: boolean) {
    this.metrics.totalChoices++;
    if (failed) {
      this.metrics.totalFailures++;
    }
    this.metrics.failureRate = 
      this.metrics.totalChoices > 0 
        ? (this.metrics.totalFailures / this.metrics.totalChoices) * 100 
        : 0;
    this.metrics.lastUpdated = Date.now();
  },
  
  /**
   * 记录事件触发
   */
  recordEventTrigger(eventId: string, age: number) {
    this.metrics.totalEventsTriggered++;
    this.metrics.eventsPerAge[age] = (this.metrics.eventsPerAge[age] || 0) + 1;
    this.metrics.lastUpdated = Date.now();
  },
  
  /**
   * 记录门槛阻挡
   */
  recordGateBlocked(eventId: string) {
    this.metrics.gateBlockedAttempts++;
    this.metrics.lastUpdated = Date.now();
  },
  
  /**
   * 记录挫折事件
   */
  recordSetbackEvent(eventId: string) {
    this.metrics.setbackEventsTriggered++;
    this.metrics.lastUpdated = Date.now();
  },
  
  /**
   * 更新存活状态
   */
  updateSurvivalRate(alive: boolean) {
    this.metrics.playerSurvivalRate = alive ? 100 : 0;
    this.metrics.lastUpdated = Date.now();
  },
  
  /**
   * 获取监控报告
   */
  getReport(): string {
    return `
=== 难度监控报告 ===
总选择次数: ${this.metrics.totalChoices}
失败次数: ${this.metrics.totalFailures}
失败率: ${this.metrics.failureRate.toFixed(2)}%
事件触发数: ${this.metrics.totalEventsTriggered}
门槛阻挡数: ${this.metrics.gateBlockedAttempts}
挫折事件数: ${this.metrics.setbackEventsTriggered}
存活率: ${this.metrics.playerSurvivalRate}%
最后更新: ${new Date(this.metrics.lastUpdated).toLocaleString()}
    `.trim();
  },
  
  /**
   * 重置监控数据
   */
  reset() {
    this.metrics = {
      totalChoices: 0,
      totalFailures: 0,
      failureRate: 0,
      totalEventsTriggered: 0,
      gateBlockedAttempts: 0,
      setbackEventsTriggered: 0,
      playerSurvivalRate: 100,
      eventsPerAge: {},
      lastUpdated: Date.now()
    };
  }
});
```

---

## 四、类型扩展

### 4.1 事件类型扩展

在 `EventDefinition` 中新增字段：

```typescript
// src/types/eventTypes.ts 扩展

export interface EventDefinition {
  // ... 现有字段 ...
  
  /** ========== 难度系统扩展 ========== */
  
  /** 挑战场景配置 */
  challengeScene?: {
    /** 场景 ID */
    sceneId: string;
    /** 是否启用失败判定 */
    enableFailureCheck: boolean;
    /** 失败时的替代效果 */
    failureEffects?: EffectDefinition[];
    /** 失败描述文本 */
    failureText?: string;
  };
  
  /** 声望门槛（扩展） */
  reputationGate?: {
    /** 最小声望要求 */
    minReputation: number;
    /** 最大声望限制 */
    maxReputation?: number;
    /** 声望不足时的替代事件 */
    alternativeEventId?: string;
  };
  
  /** 是否为挫折事件 */
  isSetbackEvent?: boolean;
  
  /** 挫折事件严重程度 */
  setbackSeverity?: 'minor' | 'moderate' | 'severe' | 'critical';
}
```

---

## 五、实施步骤

### Phase 1: 核心类型与数据定义

1. 创建 `src/types/difficultyTypes.ts` - 难度系统类型定义
2. 创建 `src/data/challengeScenes.ts` - 挑战场景配置
3. 创建 `src/data/reputationTiers.ts` - 声望等级配置
4. 创建 `src/data/setbackEvents.ts` - 挫折事件配置
5. 更新 `src/types/eventTypes.ts` - 扩展 EventDefinition

### Phase 2: 核心系统实现

6. 创建 `src/core/ChallengeSystem.ts` - 失败概率计算
7. 创建 `src/core/ReputationGateSystem.ts` - 声望门槛系统
8. 创建 `src/core/SetbackEventSystem.ts` - 挫折事件系统
9. 创建 `src/core/DifficultyManager.ts` - 难度配置管理
10. 创建 `src/core/DifficultyMonitor.ts` - 难度数据监控

### Phase 3: UI 集成

11. 创建 `src/components/DifficultyConfigPanel.vue` - 难度配置面板
12. 更新 `src/components/DebugPanel.vue` - 添加难度监控显示
13. 更新 `src/components/EventDisplay.vue` - 添加失败反馈

### Phase 4: 游戏引擎集成

14. 更新 `GameEngineIntegration.ts` - 集成难度检查
15. 更新 `ConditionEvaluator.ts` - 添加难度相关条件
16. 更新事件数据文件 - 添加难度相关配置

### Phase 5: 测试验证

17. 编写测试用例
18. 验证各难度等级效果
19. 调整平衡参数

---

## 六、文件清单

| 序号 | 文件路径 | 描述 | 优先级 |
|------|----------|------|--------|
| 1 | `src/types/difficultyTypes.ts` | 难度系统类型定义 | P0 |
| 2 | `src/data/challengeScenes.ts` | 挑战场景配置 | P0 |
| 3 | `src/data/reputationTiers.ts` | 声望等级配置 | P0 |
| 4 | `src/data/setbackEvents.ts` | 挫折事件配置 | P0 |
| 5 | `src/core/ChallengeSystem.ts` | 失败概率计算 | P0 |
| 6 | `src/core/ReputationGateSystem.ts` | 声望门槛系统 | P0 |
| 7 | `src/core/SetbackEventSystem.ts` | 挫折事件系统 | P1 |
| 8 | `src/core/DifficultyManager.ts` | 难度配置管理 | P1 |
| 9 | `src/core/DifficultyMonitor.ts` | 难度数据监控 | P1 |
| 10 | `src/components/DifficultyConfigPanel.vue` | 难度配置面板 | P2 |

---

## 七、配置方法

### 7.1 难度配置面板

玩家可通过设置菜单访问难度配置面板，调整以下参数：
- 滑块控制：失败概率系数 (0.5 - 2.0)
- 滑块控制：事件触发门槛系数 (0.5 - 2.0)
- 滑块控制：挫折事件触发概率 (0% - 100%)
- 预设按钮：简单 / 普通 / 困难 / 噩梦
- 测试模式开关

### 7.2 难度预设

| 预设 | 失败系数 | 门槛系数 | 挫折概率 | 描述 |
|------|----------|----------|----------|------|
| 简单 | 0.7 | 0.8 | 0.5 | 新手友好，降低失败惩罚 |
| 普通 | 1.0 | 1.0 | 1.0 | 标准游戏体验 |
| 困难 | 1.3 | 1.2 | 1.5 | 挑战模式，需要一定技巧 |
| 噩梦 | 1.8 | 1.5 | 2.0 | 高风险高回报，极限挑战 |

---

## 八、测试流程

### 8.1 测试模式

启用测试模式后：
- 自动设置高失败概率环境
- 挫折事件触发率翻倍
- 实时显示失败概率计算过程
- 提供一键重置游戏功能

### 8.2 验证清单

- [ ] 新手武者参加武林大会失败概率 ≥ 80%
- [ ] 满足声望门槛后可触发高级事件
- [ ] 挫折事件按配置概率触发
- [ ] 体质达标可获得豁免
- [ ] 难度配置正确保存和加载
- [ ] 监控数据正确记录
- [ ] 失败反馈正确显示（视觉+文本+音效）

---

## 九、风险与对策

| 风险 | 影响 | 对策 |
|------|------|------|
| 难度过高导致玩家流失 | 高 | 提供难度预设，允许随时调整 |
| 概率计算过于复杂 | 中 | 提供测试模式和详细日志 |
| 挫折事件过于频繁 | 中 | 添加豁免机制和全局开关 |
| 与现有系统冲突 | 低 | 采用渐进式集成，逐步验证 |
