/**
 * 难度系统类型定义
 *
 * @version 1.0.0
 * @since 2026-03-19
 */

import type { EventCategory } from './eventTypes';

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
 * 预设难度等级
 */
export type DifficultyPreset = 'easy' | 'normal' | 'hard' | 'nightmare';

/**
 * 挑战场景配置
 */
export interface ChallengeScene {
  /** 场景 ID */
  id: string;

  /** 场景名称 */
  name: string;

  /** 基础失败概率 (0-100) */
  baseFailureRate: number;

  /** 能力评估字段 */
  relevantStats: string[];

  /** 能力阈值配置 */
  thresholds: {
    [stat: string]: {
      /** 合格阈值 */
      qualified: number;
      /** 优秀阈值 */
      excellent: number;
      /** 失败概率减免 (0-1) */
      failureRateReduction: number;
    };
  };

  /** 场景描述 */
  description?: string;
}

/**
 * 选择失败判定结果
 */
export interface ChoiceFailureCheck {
  /** 场景 ID */
  sceneId: string;

  /** 场景名称 */
  sceneName: string;

  /** 基础失败概率 (0-100) */
  baseFailureRate: number;

  /** 能力评估详情 */
  abilityAssessment: {
    stat: string;
    value: number;
    threshold: number;
    status: 'insufficient' | 'qualified' | 'excellent';
    modifier: number;
  }[];

  /** 失败原因描述 */
  failureReason: string;

  /** 难度系数调整 */
  difficultyModifier: number;

  /** 测试模式倍数 */
  testModeMultiplier: number;

  /** 最终失败概率 (0-100) */
  finalFailureRate: number;

  /** 是否失败 */
  isFailed: boolean;
}

/**
 * 失败反馈类型
 */
export interface FailureFeedback {
  /** 视觉反馈类型 */
  visualType: 'shake' | 'red_flash' | 'darken' | 'icon_shake' | 'none';

  /** 文本反馈 */
  textFeedback: string;

  /** 详细失败描述 */
  detailedDescription?: string;

  /** 音效标识 */
  soundEffect: string;

  /** 失败动画时长 (ms) */
  animationDuration: number;
}

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

  /** 解锁的特殊事件 ID 列表 */
  unlockedEvents: string[];

  /** 描述 */
  description: string;
}

/**
 * 声望门槛检查结果
 */
export interface ReputationGateCheck {
  /** 是否可触发 */
  canTrigger: boolean;

  /** 当前声望等级 */
  currentTier: ReputationTier | null;

  /** 原因描述 */
  reason: string;

  /** 距离下一等级还差多少声望 */
  distanceToNextTier?: number;
}

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
    /** 最大年龄 */
    maxAge?: number;
    /** 最小体质要求 */
    minConstitution?: number;
    /** 必需的身份 */
    requiredIdentities?: string[];
    /** 禁止的身份 */
    forbiddenIdentities?: string[];
  };

  /** 效果 */
  effects: {
    /** 属性变化 */
    statChanges?: Partial<Record<string, number>>;
    /** 持续时间 (天数) */
    duration?: number;
    /** 死亡概率 (%) */
    deathProbability?: number;
  };

  /** 豁免配置 */
  exemption: {
    /** 体质豁免阈值 (达到此体质完全豁免) */
    constitutionThreshold?: number;
    /** 基础豁免率 (%) */
    baseRate: number;
  };

  /** 描述文本 */
  description: string;

  /** 失败描述 */
  failureText?: string;
}

/**
 * 挫折事件触发结果
 */
export interface SetbackEventResult {
  /** 触发的事件 */
  event: SetbackEventConfig;

  /** 是否被豁免 */
  wasExempted: boolean;

  /** 豁免原因 */
  exemptionReason?: string;
}

/**
 * 难度监控指标
 */
export interface DifficultyMetrics {
  /** 总选择次数 */
  totalChoices: number;

  /** 失败次数 */
  totalFailures: number;

  /** 失败率 (%) */
  failureRate: number;

  /** 事件触发总数 */
  totalEventsTriggered: number;

  /** 门槛阻挡次数 */
  gateBlockedAttempts: number;

  /** 挫折事件触发次数 */
  setbackEventsTriggered: number;

  /** 玩家存活率 (%) */
  playerSurvivalRate: number;

  /** 每年龄事件密度 */
  eventsPerAge: Record<number, number>;

  /** 最后更新时间戳 */
  lastUpdated: number;
}

/**
 * 难度预设配置
 */
export const DIFFICULTY_PRESETS: Record<DifficultyPreset, {
  failureProbabilityCoefficient: number;
  eventThresholdCoefficient: number;
  setbackEventProbability: number;
  description: string;
}> = {
  easy: {
    failureProbabilityCoefficient: 0.7,
    eventThresholdCoefficient: 0.8,
    setbackEventProbability: 0.5,
    description: '新手友好，降低失败惩罚'
  },
  normal: {
    failureProbabilityCoefficient: 1.0,
    eventThresholdCoefficient: 1.0,
    setbackEventProbability: 1.0,
    description: '标准游戏体验'
  },
  hard: {
    failureProbabilityCoefficient: 1.3,
    eventThresholdCoefficient: 1.2,
    setbackEventProbability: 1.5,
    description: '挑战模式，需要一定技巧'
  },
  nightmare: {
    failureProbabilityCoefficient: 1.8,
    eventThresholdCoefficient: 1.5,
    setbackEventProbability: 2.0,
    description: '高风险高回报，极限挑战'
  }
};

/**
 * 默认难度配置
 */
export const DEFAULT_DIFFICULTY_CONFIG: DifficultyConfig = {
  failureProbabilityCoefficient: 1.0,
  eventThresholdCoefficient: 1.0,
  setbackEventProbability: 1.0,
  testModeEnabled: false
};
