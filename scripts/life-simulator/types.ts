/**
 * 玩家生命周期自动模拟测试系统 - 类型定义
 */

import type { PlayerState, StoryNode, StoryChoice } from '../../src/types';

/**
 * 模拟配置参数
 */
export interface SimulationConfig {
  /** 模拟时长（年数），默认 80 年 */
  simulationYears: number;
  /** 随机性权重 (0-1)，0 表示完全随机，1 表示完全基于属性权重 */
  randomnessWeight: number;
  /** 记录详细程度：'minimal' | 'normal' | 'detailed' | 'verbose' */
  logLevel: 'minimal' | 'normal' | 'detailed' | 'verbose';
  /** 是否启用 AI 评估 */
  enableAiEvaluation: boolean;
  /** 是否输出详细日志到控制台 */
  verboseOutput: boolean;
  /** 随机种子（用于可重复测试） */
  randomSeed?: number;
  /** 初始年龄 */
  startAge: number;
  /** 结束年龄 */
  endAge: number;
}

/**
 * 选择记录（包括用户选择和自动节点）
 */
export interface ChoiceRecord {
  /** 时间戳 */
  timestamp: string;
  /** 游戏内时间（年） */
  gameYear: number;
  /** 节点 ID */
  nodeId: string;
  /** 节点文本（完整描述） */
  nodeText: string;
  /** 节点类型 */
  nodeType: 'choice' | 'auto';
  /** 可用选择列表（仅用户选择节点） */
  availableChoices?: Array<{
    id: string;
    text: string;
    condition?: any;
  }>;
  /** 已选择的选择 ID（自动节点为 'auto_trigger'） */
  selectedChoiceId: string;
  /** 已选择的选择文本（自动节点为 '自动触发'） */
  selectedChoiceText: string;
  /** 选择理由（随机/权重/自动） */
  selectionReason: string;
  /** 权重信息（如果适用） */
  weights?: Record<string, number>;
  /** 系统反馈 */
  systemFeedback: string;
  /** 选择前的状态 */
  stateBefore: Partial<PlayerState>;
  /** 选择后的状态 */
  stateAfter: Partial<PlayerState>;
  /** 状态变化 */
  stateChanges: Array<{
    field: string;
    oldValue: any;
    newValue: any;
  }>;
  /** 节点详细描述（用于 HTML 展示） */
  nodeDescription?: string;
}

/**
 * 关键决策点
 */
export interface CriticalDecisionPoint {
  /** 决策点 ID */
  id: string;
  /** 决策类型 */
  type: 'sect_join' | 'tournament' | 'love' | 'career' | 'life_death';
  /** 决策时间 */
  timestamp: string;
  /** 游戏内年龄 */
  age: number;
  /** 决策内容 */
  decision: string;
  /** 决策影响 */
  impact: string;
  /** 合理性评分 (0-10) */
  rationalityScore: number;
  /** AI 评估意见 */
  aiComment?: string;
}

/**
 * 游戏状态快照
 */
export interface StateSnapshot {
  /** 快照时间 */
  timestamp: string;
  /** 游戏内年龄 */
  age: number;
  /** 完整玩家状态 */
  state: PlayerState;
  /** 最近的事件 */
  recentEvents: string[];
  /** 最近的 Flags */
  recentFlags: string[];
}

/**
 * 逻辑矛盾记录
 */
export interface LogicConflict {
  /** 矛盾 ID */
  id: string;
  /** 矛盾类型 */
  type: 'state_inconsistency' | 'event_order' | 'condition_violation' | 'causality_error';
  /** 严重程度：'low' | 'medium' | 'high' | 'critical' */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** 矛盾描述 */
  description: string;
  /** 相关选择记录 IDs */
  relatedChoiceIds: number[];
  /** 建议修复 */
  suggestedFix?: string;
}

/**
 * AI 评估报告
 */
export interface AiEvaluationReport {
  /** 整体合理性评分 (0-100) */
  overallScore: number;
  /** 各维度评分 */
  dimensions: {
    /** 选择路径连贯性 (0-100) */
    coherence: number;
    /** 系统反馈关联性 (0-100) */
    feedbackRelevance: number;
    /** 状态转换逻辑性 (0-100) */
    stateTransitionLogic: number;
    /** 决策合理性 (0-100) */
    decisionRationality: number;
  };
  /** 发现的逻辑矛盾 */
  conflicts: LogicConflict[];
  /** 关键决策点评估 */
  criticalDecisions: CriticalDecisionPoint[];
  /** AI 总结意见 */
  summary: string;
  /** 改进建议 */
  recommendations: string[];
}

/**
 * 完整测试报告
 */
export interface SimulationReport {
  /** 报告 ID */
  reportId: string;
  /** 生成时间 */
  generatedAt: string;
  /** 模拟配置 */
  config: SimulationConfig;
  /** 模拟开始时间 */
  startTime: string;
  /** 模拟结束时间 */
  endTime: string;
  /** 模拟持续时间（毫秒） */
  duration: number;
  /** 总选择次数 */
  totalChoices: number;
  /** 关键决策点数量 */
  criticalDecisions: number;
  /** 完整选择记录 */
  choiceRecords: ChoiceRecord[];
  /** 状态快照列表 */
  stateSnapshots: StateSnapshot[];
  /** AI 评估报告 */
  aiEvaluation?: AiEvaluationReport;
  /** 统计信息 */
  statistics: {
    /** 平均每个选择耗时（毫秒） */
    avgChoiceTime: number;
    /** 状态变化总次数 */
    totalStateChanges: number;
    /** 触发的事件总数 */
    totalEvents: number;
    /** 寿命（年） */
    lifespan: number;
    /** 加入的门派 */
    sect: string | null;
    /** 最终头衔 */
    title: string | null;
    /** 婚姻状况 */
    married: boolean;
    /** 子女数量 */
    children: number;
    /** 死亡原因 */
    deathReason: string | null;
  };
}

/**
 * 随机选择引擎接口
 */
export interface IRandomEngine {
  /** 生成 0-1 之间的随机数 */
  random(): number;
  /** 从数组中随机选择一个元素 */
  choose<T>(array: T[]): T;
  /** 根据权重随机选择 */
  weightedChoose<T>(items: Array<{ item: T; weight: number }>): T;
  /** 设置随机种子 */
  setSeed(seed: number): void;
}

/**
 * 决策引擎接口
 */
export interface IDecisionEngine {
  /** 根据配置做出决策 */
  makeChoice(
    nodeId: string,
    choices: StoryChoice[],
    state: PlayerState,
    config: SimulationConfig
  ): Promise<{
    selectedChoice: StoryChoice;
    reason: string;
    weights?: Record<string, number>;
  }>;
}

/**
 * 日志记录器接口
 */
export interface ILogger {
  /** 记录选择 */
  logChoice(record: ChoiceRecord): void;
  /** 记录状态快照 */
  logSnapshot(snapshot: StateSnapshot): void;
  /** 记录关键决策 */
  logCriticalDecision(decision: CriticalDecisionPoint): void;
  /** 记录逻辑矛盾 */
  logConflict(conflict: LogicConflict): void;
  /** 生成完整报告 */
  generateReport(config: SimulationConfig): Promise<SimulationReport>;
}
