/**
 * 事件系统类型定义
 * 
 * 设计原则：
 * - 类型安全：提供完整的 TypeScript 类型支持
 * - 可扩展：支持未来功能扩展
 * - 向后兼容：支持现有格式的平滑迁移
 * 
 * @version 1.0.0
 * @since 2026-03-12
 */

// ========== 基础枚举类型 ==========

/**
 * 事件分类
 */
export enum EventCategory {
  /** 主线剧情：出生、成长、门派、武林大会 */
  MAIN_STORY = 'main_story',
  
  /** 支线任务：爱情线、奇遇线 */
  SIDE_QUEST = 'side_quest',
  
  /** 随机遭遇：江湖传闻、路人事件 */
  RANDOM_ENCOUNTER = 'random_encounter',
  
  /** 时间事件：节日、季节变化 */
  TIME_EVENT = 'time_event',
  
  /** 日常事件：修炼、打工 */
  DAILY_EVENT = 'daily_event',
  
  /** 特殊事件：隐藏剧情、彩蛋 */
  SPECIAL_EVENT = 'special_event',
}

/**
 * 事件优先级
 */
export enum EventPriority {
  CRITICAL = 0,  // 主线剧情，必须触发
  HIGH = 1,      // 重要支线
  NORMAL = 2,    // 普通事件
  LOW = 3,       // 可选事件
}

/**
 * 效果类型（声明式定义）
 */
export enum EffectType {
  /** 属性修改 */
  STAT_MODIFY = 'stat_modify',
  
  /** 时间推进 */
  TIME_ADVANCE = 'time_advance',
  
  /** Flag 操作 */
  FLAG_SET = 'flag_set',
  FLAG_UNSET = 'flag_unset',
  
  /** Event 记录 */
  EVENT_RECORD = 'event_record',
  
  /** 物品操作 */
  ITEM_ADD = 'item_add',
  ITEM_REMOVE = 'item_remove',
  
  /** 关系操作 */
  RELATION_CHANGE = 'relation_change',
  
  /** 特殊效果 */
  SPECIAL = 'special',
  
  /** 随机效果 */
  RANDOM = 'random',
}

/**
 * 操作符类型
 */
export type EffectOperator = 
  | 'set'      // 设置值
  | 'add'      // 增加值
  | 'subtract' // 减少值
  | 'multiply' // 乘以
  | 'divide';  // 除以

// ========== 触发器类型 ==========

/**
 * 触发器联合类型
 */
export type EventTrigger = 
  | AgeTrigger
  | FlagTrigger
  | StatTrigger
  | TimeTrigger
  | CustomTrigger;

/**
 * 年龄触发器
 */
export interface AgeTrigger {
  type: 'age_reach';
  value: number;
}

/**
 * Flag 触发器
 */
export interface FlagTrigger {
  type: 'flag_set' | 'flag_unset' | 'event_triggered';
  flagName: string;
}

/**
 * 属性触发器
 */
export interface StatTrigger {
  type: 'stat_reach';
  statName: keyof PlayerStats;
  value: number;
  operator: '>=' | '>' | '==' | '<' | '<=';
}

/**
 * 时间触发器
 */
export interface TimeTrigger {
  type: 'season' | 'festival' | 'month';
  value: string;
}

/**
 * 自定义触发器
 */
export interface CustomTrigger {
  type: 'custom';
  handler: string;
  params?: Record<string, any>;
}

// ========== 条件类型 ==========

/**
 * 条件定义
 */
export interface EventCondition {
  type: 'expression';
  expression: string;
}

/**
 * 依赖关系
 */
export interface EventDependency {
  eventId: string;
  dependencyType: 'prerequisite' | 'mutex' | 'chain';
  condition?: string;
}

// ========== 效果定义 ==========

/**
 * 效果定义（声明式）
 */
export interface EffectDefinition {
  /** 效果类型 */
  type: EffectType;
  
  /** 目标属性或对象 */
  target: string;
  
  /** 变化值 */
  value?: any;
  
  /** 操作符 */
  operator?: EffectOperator;
  
  /** 随机效果范围 */
  randomRange?: {
    minValue: number;
    maxValue: number;
  };
  
  /** 持续时间 */
  duration?: {
    value: number;
    unit: 'year' | 'month' | 'day' | 'permanent';
  };
  
  /** 嵌套效果 */
  effects?: EffectDefinition[];
}

// ========== 事件选择 ==========

/**
 * 事件选择
 */
export interface EventChoice {
  /** 唯一标识 */
  id: string;
  
  /** 选择文本 */
  text: string;
  
  /** 选择条件 */
  condition?: EventCondition;
  
  /** 选择效果 */
  effects: EffectDefinition[];
  
  /** 前置要求 */
  requirements?: {
    statRequirements?: {
      statName: string;
      minValue: number;
    }[];
    itemRequirements?: string[];
  };
  
  /** 元数据 */
  metadata?: {
    hidden?: boolean;
    visibleCondition?: EventCondition;
  };
}

// ========== 事件定义 ==========

/**
 * 事件定义（纯数据，无业务逻辑）
 */
export interface EventDefinition {
  // ========== 基础信息 ==========
  /** 唯一标识符 */
  id: string;
  
  /** 版本号 */
  version: string;
  
  /** 事件分类 */
  category: EventCategory;
  
  /** 优先级 */
  priority: EventPriority;
  
  /** 权重 */
  weight: number;
  
  // ========== 触发条件 ==========
  /** 年龄范围 */
  ageRange: {
    min: number;
    max?: number;
  };
  
  /** 触发器列表 */
  triggers: EventTrigger[];
  
  /** 前置条件 */
  conditions?: EventCondition[];
  
  /** 依赖关系 */
  dependencies?: EventDependency[];
  
  // ========== 事件内容 ==========
  /** 事件文本 */
  content: {
    text: string;
    title?: string;
    description?: string;
    media?: {
      images?: string[];
      audio?: string;
    };
  };
  
  /** 事件类型 */
  eventType: 'auto' | 'choice';
  
  /** 选择列表 */
  choices?: EventChoice[];
  
  /** 自动效果 */
  autoEffects?: EffectDefinition[];
  
  // ========== 元数据 ==========
  metadata: {
    createdAt: number;
    updatedAt: number;
    author?: string;
    tags?: string[];
    enabled: boolean;
  };
}

// ========== 玩家状态类型 ==========

/**
 * 玩家属性
 */
export interface PlayerStats {
  martialPower: number;      // 武功
  externalSkill: number;     // 外功
  internalSkill: number;     // 内力
  qinggong: number;         // 轻功
  charisma: number;         // 魅力
}

/**
 * 玩家状态
 */
export interface PlayerState {
  // 基础属性
  age: number;
  gender: 'male' | 'female';
  name: string;
  
  // 武功属性
  martialPower: number;
  externalSkill: number;
  internalSkill: number;
  qinggong: number;
  chivalry: number;
  
  // 社会属性
  sect: string | null;
  title: string | null;
  reputation: number;
  money: number;
  
  // 关系属性
  children: number;
  spouse: string | null;
  
  // 状态
  alive: boolean;
  deathReason?: string;
}

/**
 * 游戏状态
 */
export interface GameState {
  // 元数据
  saveVersion: string;
  lastSavedAt: number;
  gameTimestamp: number;
  
  // 玩家状态
  player: PlayerState;
  
  // 事件历史
  triggeredEvents: string[];
  eventHistory: EventRecord[];
  
  // 世界状态
  flags: Record<string, boolean>;
  relations: Record<string, number>;
  inventory: InventoryItem[];
  
  // 统计信息
  statistics: GameStatistics;
}

/**
 * 事件记录
 */
export interface EventRecord {
  eventId: string;
  gameTime: number;
  realTime: number;
  selectedChoice?: string;
  stateSnapshot: Partial<GameState>;
  appliedEffects: EffectDefinition[];
}

/**
 * 物品
 */
export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
}

/**
 * 统计信息
 */
export interface GameStatistics {
  totalEvents: number;
  totalChoices: number;
  playTime: number;
}

// ========== 接口定义 ==========

/**
 * 事件执行器接口
 */
export interface IEventExecutor {
  executeEffects(
    effects: EffectDefinition[],
    state: GameState
  ): Promise<GameState>;
}

/**
 * 条件评估器接口
 */
export interface IConditionEvaluator {
  evaluate(
    condition: EventCondition,
    state: GameState
  ): boolean;
}

/**
 * 事件管理器接口
 */
export interface IEventManager {
  getAvailableEvents(state: GameState): Promise<EventDefinition[]>;
  triggerEvent(
    eventId: string,
    state: GameState,
    choiceId?: string
  ): Promise<EventResult>;
  validateEvent(event: EventDefinition): ValidationResult;
}

/**
 * 事件结果
 */
export interface EventResult {
  eventId: string;
  newState: GameState;
  message: string;
}

/**
 * 验证结果
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * 存储提供者接口
 */
export interface StorageProvider {
  saveGame(userId: string, state: GameState): Promise<void>;
  loadGame(userId: string): Promise<GameState | null>;
  deleteSave(userId: string): Promise<void>;
  listSaves(userId: string): Promise<SaveMetadata[]>;
}

/**
 * 存档元数据
 */
export interface SaveMetadata {
  saveId: string;
  createdAt: number;
  updatedAt: number;
  gameAge: number;
  playerName: string;
  summary: string;
}
