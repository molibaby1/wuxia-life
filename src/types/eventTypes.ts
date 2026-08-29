import type { ConditionExpression } from './conditionExpression';
import type { EventAuthoringSemantics } from '../narrative/config/authoringSchema';
import type { WealthCapacity } from './wealthCapacity';
import type { AssetId } from './asset';

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

  /** Canonical organization affiliation */
  AFFILIATION_SET = 'affiliation_set',
  AFFILIATION_CLEAR = 'affiliation_clear',

  /** Canonical health/status operations */
  HEALTH_STATUS_SET = 'health_status_set',
  STATUS_ADD = 'status_add',
  STATUS_REMOVE = 'status_remove',
  
  /** Event 记录 */
  EVENT_RECORD = 'event_record',

  /** 财富容量设置 */
  WEALTH_CAPACITY_SET = 'wealth_capacity_set',

  /** 财富容量单调提升至下限 */
  WEALTH_CAPACITY_RAISE_TO = 'wealth_capacity_raise_to',

  /** Canonical asset ownership operations */
  ASSET_ADD = 'asset_add',
  ASSET_REMOVE = 'asset_remove',
  
  /** 物品操作 */
  ITEM_ADD = 'item_add',
  ITEM_REMOVE = 'item_remove',
  
  /** 关系操作 */
  RELATION_CHANGE = 'relation_change',
  
  /** 特殊效果 */
  SPECIAL = 'special',
  
  /** 随机效果 */
  RANDOM = 'random',
  
  /** ========== 新增：因果系统 ========== */
  /** 因果变化 */
  KARMA_CHANGE = 'karma_change',
  
  /** ========== 新增：人生轨迹系统 ========== */
  /** 设置阵营 */
  SET_FACTION = 'set_faction',
  
  /** 记录成就 */
  LIFEPATH_RECORD_ACHIEVEMENT = 'lifepath_record_achievement',
  
  /** 添加承诺 */
  LIFEPATH_ADD_COMMITMENT = 'lifepath_add_commitment',

  
  /** 添加关系 */
  LIFEPATH_ADD_RELATIONSHIP = 'lifepath_add_relationship',
  
  /** 触发指定事件 */
  TRIGGER_EVENT = 'trigger_event',

  /** 生活状态变化 */
  LIFE_STATE_CHANGE = 'life_state_change',
}

// ========== 角色底色系统类型 ==========

export type TraitStatKey =
  | 'martialPower'
  | 'constitution'
  | 'charisma'
  | 'chivalry'
  | 'reputation'
  | 'connections'
  | 'knowledge'
  | 'businessAcumen'
  | 'influence';

export type EventBiasTag =
  | 'training'
  | 'learning'
  | 'social'
  | 'romance'
  | 'family'
  | 'business'
  | 'survival'
  | 'risk'
  | 'discipline'
  | 'indulgence'
  | 'reputation';

export type CoreTalentId =
  | 'martial_born'
  | 'keen_mind'
  | 'social_gift'
  | 'iron_abacus'
  | 'unyielding'
  | 'heroic_heart'
  | 'cold_reader'
  | 'perfect_memory';

export type WeaknessId =
  | 'frail'
  | 'slow_witted'
  | 'lazy'
  | 'soft_eared'
  | 'unstable_mood'
  | 'grand_dreams_poor_followthrough'
  | 'loner'
  | 'fear_of_responsibility';

export type TemperamentId =
  | 'competitive'
  | 'affectionate'
  | 'profit_driven'
  | 'orderly'
  | 'adventurous'
  | 'risk_averse'
  | 'disciplined'
  | 'indulgent';

export type TraitId = CoreTalentId | WeaknessId | TemperamentId;

export type HealthStatus =
  | 'healthy'
  | 'unwell'
  | 'seriously_ill'
  | 'seriously_injured'
  | 'critical';

export type StatusId = 'fatigued' | 'anxious' | 'injured' | 'ill';

export const HEALTH_STATUS_VALUES: readonly HealthStatus[] = [
  'healthy',
  'unwell',
  'seriously_ill',
  'seriously_injured',
  'critical',
];

export const STATUS_ID_VALUES: readonly StatusId[] = ['fatigued', 'anxious', 'injured', 'ill'];

export function isHealthStatus(value: unknown): value is HealthStatus {
  return typeof value === 'string' && (HEALTH_STATUS_VALUES as readonly string[]).includes(value);
}

export function isStatusId(value: unknown): value is StatusId {
  return typeof value === 'string' && (STATUS_ID_VALUES as readonly string[]).includes(value);
}

export type FactValue = boolean | string | number;
export type Facts = Record<string, FactValue>;

export type OriginId =
  | 'martial_family'
  | 'merchant_house'
  | 'scholar_house'
  | 'frontier_military'
  | 'poor_family'
  | 'streetborn';

export const LIFE_STATE_KEYS = [
  'trainingHabit',
  'studyHabit',
  'businessHabit',
] as const;

export type LifeStateKey = (typeof LIFE_STATE_KEYS)[number];

export interface TraitStatModifier {
  stat: TraitStatKey;
  value: number;
}

export interface TraitGrowthModifier {
  stat: TraitStatKey;
  multiplier: number;
}

export interface EventBiasModifier {
  tag: EventBiasTag;
  multiplier: number;
}

export interface LifeStateEffect {
  state: LifeStateKey;
  value: number;
}

export interface CoreTalentConfig {
  id: CoreTalentId;
  name: string;
  rarity: 'common' | 'rare';
  summary: string;
  flavor: string;
  initialStats: TraitStatModifier[];
  growthModifiers: TraitGrowthModifier[];
  eventBiases: EventBiasModifier[];
  resultModifiers?: {
    successBonus?: number;
    failureBonus?: number;
    relationshipGainBonus?: number;
    relationshipLossBonus?: number;
  };
  hiddenCosts?: string[];
}

export interface WeaknessConfig {
  id: WeaknessId;
  name: string;
  summary: string;
  flavor: string;
  initialStats?: TraitStatModifier[];
  growthModifiers?: TraitGrowthModifier[];
  eventBiases: EventBiasModifier[];
  resultModifiers?: {
    successPenalty?: number;
    failureBonus?: number;
    stressBonus?: number;
  };
  removable: false;
}

export interface TemperamentConfig {
  id: TemperamentId;
  name: string;
  summary: string;
  flavor: string;
  eventBiases: EventBiasModifier[];
  autoChoiceBias?: {
    aggressive?: number;
    cautious?: number;
    relational?: number;
    profitable?: number;
    disciplined?: number;
    indulgent?: number;
  };
}

export interface OriginConfig {
  id: OriginId;
  name: string;
  summary: string;
  flavor: string;
  initialStats: TraitStatModifier[];
  earlyEventBiases: EventBiasModifier[];
  startingFlags?: string[];
}

export interface PlayerLifeStates {
  trainingHabit: number;
  studyHabit: number;
  businessHabit: number;
}

export interface LifeStateConfig {
  key: LifeStateKey;
  name: string;
  min: number;
  max: number;
  defaultValue: number;
  thresholds?: Array<{
    min: number;
    label: string;
    description: string;
  }>;
}

export interface DailyEventVariantConfig {
  id: string;
  weight: number;
  text: string;
  statEffects?: TraitStatModifier[];
  stateEffects?: LifeStateEffect[];
  effects?: EffectDefinition[];
  flags?: string[];
}

export interface DailyEventConfig {
  id: string;
  group: 'training' | 'study' | 'livelihood' | 'family' | 'emotion';
  title: string;
  ageRange: {
    min: number;
    max: number;
  };
  baseWeight: number;
  conditions?: EventCondition[];
  preferredTraits?: TraitId[];
  suppressedTraits?: TraitId[];
  preferredOrigins?: OriginId[];
  suppressedOrigins?: OriginId[];
  variants: {
    positive: DailyEventVariantConfig[];
    neutral: DailyEventVariantConfig[];
    negative: DailyEventVariantConfig[];
  };
  outcomeBias?: {
    positiveByTraits?: TraitId[];
    negativeByTraits?: TraitId[];
    positiveByOrigins?: OriginId[];
    negativeByOrigins?: OriginId[];
  };
  /** Optional origin gate probe metadata for daily pool entries (Stage-7). */
  spineOriginStageFit?: string[];
}

// ========== 组织归属类型 ==========

export type AffiliationId =
  | 'shaolin'
  | 'wudang'
  | 'beggars'
  | 'border'
  | 'shadow_sect';

/**
 * 因果系统
 */
export interface KarmaSystem {
  good_karma: number;  // 善行积累
  evil_karma: number;  // 恶行积累
  history: KarmaChange[]; // 因果变化历史
}

/**
 * 因果变化记录
 */
export interface KarmaChange {
  amount: number;     // 变化量（正为善，负为恶）
  reason: string;     // 变化原因
  timestamp: number;  // 时间戳（游戏内时间）
}

/**
 * 关键选择记录
 */
export interface CriticalChoices {
  sect_choice?: 'orthodox' | 'unconventional' | 'neutral' | 'none';  // 门派/阵营选择
  life_goal?: 'hero' | 'merchant' | 'scholar' | 'hermit'; // 人生目标
  marriage_choice?: 'arranged' | 'love' | 'single';      // 婚姻选择
  midlife_choice?: 'sect_leader' | 'hermit' | 'wanderer'; // 中年抉择
  war_choice?: 'traditional' | 'reformist' | 'neutral' | 'pacifist';  // 正邪大战选择
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
export type EventCondition =
  | {
      type: 'expression';
      expression: ConditionExpression;
    }
  | {
      type: 'status_has';
      status: StatusId;
    }
  | {
      type: 'wealth_capacity_at_least';
      minimum: WealthCapacity;
    }
  | {
      type: 'asset_owned';
      asset: AssetId;
    };

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
  target?: string;
  
  /** 变化值 */
  value?: any;

  /** Canonical status identifier for status_add/status_remove effects. */
  status?: StatusId;

  /** Canonical asset identifier for asset_add/asset_remove effects. */
  asset?: AssetId;

  /** Minimum canonical Wealth Capacity for wealth_capacity_raise_to. */
  minimum?: WealthCapacity;
  
  /** 操作符 */
  operator?: EffectOperator;
  
  /** 随机效果范围 */
  randomRange?: {
    minValue: number;
    maxValue: number;
  };
  
  /** 时间推进单位（仅 TIME_ADVANCE 使用） */
  timeUnit?: 'year' | 'month' | 'day';
  
  /** 持续时间 */
  duration?: {
    value: number;
    unit: 'year' | 'month' | 'day' | 'permanent';
  };
  
  /** 嵌套效果 */
  effects?: EffectDefinition[];
  
  /** ========== 新增字段：因果系统 ========== */
  // 因果变化（用于记录善恶行为）
  karma_change?: {
    good: number;  // 善行值
    evil: number;  // 恶行值
  };
  
  // 效果描述（用于因果记录）
  description?: string;
  
  /** ========== 结局系统 ========== */
  // 结局效果（用于触发结局）
  ending_effect?: {
    ending_id: string;
    immediate?: boolean;  // 是否立即触发结局
  };

  ///** 兼容旧字段命名 */
  stat?: string;
  flag?: string;
  event?: string;

  /** 因果变化 - 善行值（用于 karma_change 效果） */
  good?: number;

  /** 因果变化 - 恶行值（用于 karma_change 效果） */
  evil?: number;
}

// 兼容旧代码中的命名
export type Effect = EffectDefinition;
export interface EffectHandler {
  execute(effect: EffectDefinition, state: GameState): Promise<GameState> | GameState;
}

// ========== 事件选择 ==========

/**
 * 选择结果分支
 * 当选择有多个可能的结果时使用
 */
export interface ChoiceOutcome {
  /** 结果ID */
  id: string;

  /** 结果描述（显示给玩家） */
  text: string;

  /** 触发条件 */
  condition: EventCondition;

  /** 该结果的效果 */
  effects: EffectDefinition[];

  /** 权重（当多个条件满足时使用） */
  weight?: number;
}

/**
 * 事件选择
 */
export interface EventChoice {
  /** 唯一标识 */
  id: string;

  /** 选择文本 */
  text: string;

  /** 选择描述（显示在选择下方） */
  description?: string;

  /** 选择条件 */
  condition?: EventCondition;

  /** 选择效果（当 outcomes 不存在时使用） */
  effects: EffectDefinition[];

  /** 多结果分支（当存在时，优先于 effects） */
  outcomes?: ChoiceOutcome[];

  /** 自动判定权重 */
  weight?: number;

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
    rewardSummary?: string;
    costSummary?: string;
    riskLevel?: string;
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
  
  /** 按年龄段权重（可选，优先于 ageRange） */
  ageWeights?: {
    min: number;
    max?: number;
    weight: number;
  }[];
  
  /** 触发器列表 */
  triggers: EventTrigger[];
  
  /** 前置条件 */
  conditions?: EventCondition[];
  
  /** 依赖关系 */
  dependencies?: EventDependency[];
  
  /** 前置条件（扩展） */
  triggerConditions?: any;
  
  // ========== 触发门槛（新增）============
  /** 触发门槛 - 用于限制事件的触发条件 */
  thresholds?: {
    /** 属性门槛 */
    attributes?: {
      [attr: string]: {
        min?: number;
        max?: number;
      };
    };
    /** 背景门槛 - 检查角色出身背景 */
    background?: {
      required?: string[];      // 必需的背景标签
      forbidden?: string[];    // 禁止的背景标签
      evaluation?: 'all' | 'at_least_one' | 'none';  // 评估方式
    };
    /** 经历门槛 - 检查是否触发过特定事件 */
    experience?: {
      required?: string[];       // 必须触发过的事件
      forbidden?: string[];    // 不能触发过的事件
      evaluation?: 'all' | 'at_least_one' | 'none';
    };
  };
  
  /** 冷却时间（年）- 防止事件重复触发 */
  cooldown?: number;
  
  /** 最大触发次数 - 限制事件总触发次数 */
  maxTriggers?: number;
  
  /** 剧情线标签 - 用于密度控制 */
  storyLine?: string;
  
  // ========== 事件内容 ==========
  /** 事件文本 */
  content: {
    text: string;
    title?: string;
    description?: string;
    autoEffects?: EffectDefinition[]; // 兼容旧访问路径
    media?: {
      images?: string[];
      audio?: string;
    };
  };
  
  /** 事件类型 */
  eventType: 'auto' | 'choice' | 'ending';
  endingType?: string;
  
  /** 选择列表 */
  choices?: EventChoice[];

  /** 兼容旧引擎入口 */
  requirements?: {
    [key: string]: unknown;
  };
  
  /** 自动效果 */
  autoEffects?: EffectDefinition[];
  
  // ========== 元数据 ==========
  metadata?: {
    createdAt: number;
    updatedAt: number;
    author?: string;
    tags?: string[];
    enabled: boolean;
    autoResolve?: boolean;
    pathAffinity?: Record<string, number>;
    pathConflicts?: string[];
    routeTransition?: 'turn' | 'betrayal' | 'corruption' | 'redemption' | 'exile';
    routeTargets?: string[];
    /** P11: stage/route scheduling coverage declarations */
    narrativeScheduling?: {
      stageSignals?: string[];
      routePoints?: Array<{
        routeId: string;
        kind: 'entry' | 'reinforcement' | 'divergence' | 'identity';
        ageBand: string;
        eventId?: string;
        flagKey?: string;
      }>;
    };
    /** P21: explicit authoring semantics for LLM-safe content production */
    authoringSemantics?: EventAuthoringSemantics;
  };

  // ========== 难度系统扩展 ==========
  /** 挑战场景配置 - 用于选择事件的失败判定 */
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

  /** 声望门槛 - 限制高规格事件的触发 */
  reputationGate?: {
    /** 最小声望要求 */
    minReputation: number;
    /** 最大声望限制 */
    maxReputation?: number;
    /** 声望不足时的替代事件 ID */
    alternativeEventId?: string;
  };

  /** 是否为挫折事件 */
  isSetbackEvent?: boolean;

  /** 挫折事件严重程度 */
  setbackSeverity?: 'minor' | 'moderate' | 'severe' | 'critical';
}

// ========== 玩家状态类型 ==========

/**
 * 玩家属性
 * 
 * 属性说明：
 * - Canonical 六项属性没有固定产品上限；功力、体魄、学识、人脉、名望不低于 0，侠义声誉允许负值
 * - 属性之间相互影响，共同决定角色发展方向
 * - 属性值通过事件、修炼、天赋等方式提升
 */
export interface PlayerStats {
  // ========== 战斗属性 ==========
  martialPower: number;      // 功力：非负的综合武学能力，无固定上限
  constitution: number;      // 体魄：非负的长期身体基础
  
  // ========== 非战斗属性 ==========
  charisma: number;          // 魅力：0-100，个人魅力，影响社交、说服和 NPC 态度
  chivalry: number;          // 侠义声誉：允许负值、中立和正值，无固定上限
  reputation: number;        // 名望：非负的知名程度和影响传播范围，无固定上限
  connections: number;       // 人脉：非负的社会关系网络能力，无固定上限
  knowledge: number;         // 学识：非负的知识、理解和文化积累，无固定上限
  
  // ========== 隐藏属性（通过天赋影响） ==========
  martialPotential?: number; // 武学潜力：0-100，影响战斗属性成长速度（天赋决定）
  socialPotential?: number;  // 社交潜力：0-100，影响社交属性成长速度（天赋决定）
  learningPotential?: number;// 学习潜力：0-100，影响知识和技能学习速度（天赋决定）
}

export type InvestmentId = 'martial' | 'statecraft' | 'official' | 'hermit';

export interface Investments {
  martial: number;
  statecraft: number;
  official: number;
  hermit: number;
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
  chivalry: number;
  constitution: number;
  
  // 社会属性
  affiliation: AffiliationId | null;
  title: string | null;
  reputation: number;
  wealthCapacity: WealthCapacity;
  
  // ========== 扩展社会属性 ==========
  /** 学识 - 影响科举、仕途、学术活动 */
  knowledge: number;
  /** 魅力 - 影响人际关系、仕途 */
  charisma: number;
  /** 商业头脑 - 影响商业活动收益 */
  businessAcumen: number;
  /** 影响力 - 江湖地位、社会影响力 */
  influence: number;

  /** 人脉值 */
  connections: number;
  
  // ========== 传承属性（根据背景获得初始加成） ==========
  /** 武学传承 - 武林世家背景加成 */
  martialHeritage: number;
  /** 书香传承 - 书香门第背景加成 */
  scholarlyHeritage: number;
  /** 商脉 - 商人身份专用 */
  merchantNetwork: number;

  /** Canonical lifetime investment directions. */
  investments: Investments;

  items?: unknown[];
  flags: any;
  events?: any;
  
  // 关系属性
  children: number;
  spouse: string | null;
  relationships?: Relationship[];
  
  // 状态
  alive: boolean;
  deathReason?: string;
  timeUnit?: 'year' | 'month' | 'day';
  monthProgress?: number;
  dayProgress?: number;
  
  /** Canonical stable personal traits. */
  traits: TraitId[];

  /** Canonical overall physical condition. */
  healthStatus: HealthStatus;

  /** Canonical present circumstances that affect future content. */
  statuses: StatusId[];

  /** Canonical long-term practice habits. */
  lifeStates: PlayerLifeStates;

}

/**
 * 人际关系
 */
export interface Relationship {
  id: string;
  role: 'master' | 'lover' | 'sworn' | 'rival' | 'friend' | 'family' | 'enemy' | 'patron';
  name: string;
  affinity: number;
  status?: string;
}

/**
 * 游戏状态
 */
export interface GameState {
  // 元数据
  saveVersion?: string;
  lastSavedAt?: number;
  gameTimestamp?: number;
  
  // 玩家状态
  player: PlayerState;
  
  // 当前时间
  currentTime?: {
    year: number;
    month: number;
    day: number;
  };
  
  // 事件历史
  triggeredEvents?: string[];
  eventHistory: EventRecord[];
  events?: EventRecord[];
  
  // 世界状态
  facts: Facts;
  flags: Record<string, any>;
  relations: Record<string, number>;
  inventory?: InventoryItem[];
  
  // 统计信息
  statistics?: GameStatistics;
  
  // ========== 新增字段：人生轨迹系统 ==========
  // 人生轨迹追踪
  lifePath?: LifePath;
  
  // 因果系统
  karma?: KarmaSystem;
  
  // 关键选择记录
  criticalChoices?: CriticalChoices;
  
  // 成就列表
  achievements?: string[];
  ending?: unknown;

  /** P7: active action history entries */
  actionHistory?: import('./activeActionTypes').ActionHistoryEntry[];
  /** P7: consecutive same-category action streak */
  actionFocusStreak?: import('./activeActionTypes').ActionFocusStreak;
  /** P7: self-awareness for implicit attribute visibility (0–100) */
  selfAwareness?: number;
  /** P7: transient player-facing feedback (e.g. locked choice) */
  playerFeedbackMessage?: string;

  /** P16: accumulated childhood tendency shaping (optional; save-compatible) */
  p16TendencyShaping?: import('../narrative/profile/types').OriginWorldviewShaping;
  /** P16: rare event line ids that fired */
  p16RareLineLog?: string[];
}

/**
 * 人生阶段
 */
export type LifeStage = 'growth' | 'development' | 'achievement' | 'legacy';

/**
 * 阵营类型
 * 
 * 设计说明：
 * - orthodox: 传统名门正派（少林、武当等）= 获得朝廷/主流认可的门派
 * - unconventional: 非传统门派（幽影门等）= 未获主流认可、被定义为"异端"的门派
 * - neutral: 中立/独立门派（丐帮、逍遥等）
 * 
 * 注意：此标签仅代表"江湖地位"，不直接等同于道德判断
 */
export type FactionType = string;

/**
 * 人生轨迹
 * 
 * 追踪玩家的核心人生选择、身份、阵营和成长轨迹，
 * 确保事件触发的逻辑一致性和叙事连贯性。
 */
export interface LifePath {
  // 阵营立场（二选一）
  faction: FactionType;
  
  // 人生阶段
  lifeStage: LifeStage;
  
  // 重大成就（影响后续事件）
  achievements: string[];
  
  // 重要关系
  relationships: {
    allies: string[];      // 盟友
    enemies: string[];     // 敌人
    mentors: string[];     // 师长
    disciples: string[];   // 弟子
  };
  
  // 承诺与约束（防止矛盾行为）
  commitments: {
    cannotJoin: string[];   // 不能加入的组织
    mustProtect: string[];  // 必须保护的对象
    swornEnemies: string[]; // 誓敌
  };
  
}

/**
 * 事件记录
 */
export interface EventRecord {
  eventId: string;
  gameTime?: number;
  realTime?: number;
  age?: number;
  timestamp?: number | {
    year: number;
    month: number;
    day: number;
  };
  triggeredAt?: number | {
    year: number;
    month: number;
    day: number;
  };
  selectedChoice?: string;
  stateSnapshot?: Partial<GameState>;
  appliedEffects?: EffectDefinition[];
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
  playTime?: number;
  totalYears?: number;
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
