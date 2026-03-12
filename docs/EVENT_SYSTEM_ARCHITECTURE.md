# 事件系统架构设计文档

**版本**: v1.0  
**创建时间**: 2026-03-12  
**状态**: 设计中  
**负责人**: 架构组

---

## 1. 概述

### 1.1 设计目标
- **标准化**: 统一事件数据格式，支持前后端分离架构
- **可扩展**: 支持动态添加新事件，无需修改核心逻辑
- **声明式**: 事件定义为纯数据，与执行逻辑解耦
- **可持久化**: 支持序列化存储和恢复
- **高性能**: 支持快速事件匹配和触发

### 1.2 设计原则
1. **数据与逻辑分离**: 事件定义是纯数据，执行逻辑独立
2. **接口明确**: 所有交互通过明确定义的接口
3. **类型安全**: 使用 TypeScript 提供完整类型定义
4. **向后兼容**: 支持现有事件格式的平滑迁移

---

## 2. 事件数据结构

### 2.1 核心类型定义

```typescript
/**
 * 事件分类（为后端分类管理做准备）
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
 * 事件优先级（决定触发顺序）
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
```

### 2.2 事件定义结构

```typescript
/**
 * 事件定义（纯数据，无业务逻辑）
 * 
 * 设计原则：
 * - 可序列化：可以转换为 JSON 存储
 * - 可验证：可以通过验证器检查完整性
 * - 可迁移：支持版本升级和数据迁移
 */
export interface EventDefinition {
  // ========== 基础信息 ==========
  /** 唯一标识符（格式：category_age_description） */
  id: string;
  
  /** 版本号（用于数据迁移） */
  version: string;
  
  /** 事件分类 */
  category: EventCategory;
  
  /** 优先级 */
  priority: EventPriority;
  
  /** 权重（影响触发概率） */
  weight: number;
  
  // ========== 触发条件 ==========
  /** 年龄范围 */
  ageRange: {
    min: number;
    max?: number;  // undefined 表示无上限
  };
  
  /** 触发器列表（支持多种触发方式） */
  triggers: EventTrigger[];
  
  /** 前置条件 */
  conditions?: EventCondition[];
  
  /** 依赖关系（用于事件链） */
  dependencies?: EventDependency[];
  
  // ========== 事件内容 ==========
  /** 事件文本（支持多语言） */
  content: {
    text: string;
    title?: string;
    description?: string;
    media?: {
      images?: string[];
      audio?: string;
    };
  };
  
  /** 事件类型：自动触发 或 需要选择 */
  eventType: 'auto' | 'choice';
  
  /** 选择列表（仅 choice 类型需要） */
  choices?: EventChoice[];
  
  /** 自动效果（仅 auto 类型需要） */
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
```

### 2.3 触发器定义

```typescript
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
  handler: string;  // 处理器函数名
  params?: Record<string, any>;
}
```

### 2.4 条件表达式

```typescript
/**
 * 条件定义（支持两种格式）
 */
export interface EventCondition {
  // 格式 1: 结构化条件（推荐）
  type: 'expression';
  /** 
   * 表达式字符串
   * 示例："martialPower > 30 AND age >= 18 AND !flags.has('metBully')"
   */
  expression: string;
}

export interface EventCondition {
  // 格式 2: 对象条件（向后兼容）
  type: 'function';
  handler: string;
  params?: Record<string, any>;
}

/**
 * 依赖关系
 */
export interface EventDependency {
  eventId: string;
  dependencyType: 'prerequisite' | 'mutex' | 'chain';
  condition?: string;
}
```

### 2.5 效果定义

```typescript
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
  
  /** 随机效果范围（用于 random 类型） */
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
```

### 2.6 选择定义

```typescript
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
```

---

## 3. 执行引擎架构

### 3.1 核心接口

```typescript
/**
 * 事件执行器接口
 */
export interface IEventExecutor {
  /**
   * 执行事件效果
   * @param effects 效果定义数组
   * @param state 当前状态
   * @returns 新状态
   */
  executeEffects(
    effects: EffectDefinition[],
    state: GameState
  ): Promise<GameState>;
}

/**
 * 条件评估器接口
 */
export interface IConditionEvaluator {
  /**
   * 评估条件
   * @param condition 条件定义
   * @param state 当前状态
   * @returns 是否满足条件
   */
  evaluate(
    condition: EventCondition,
    state: GameState
  ): boolean;
}

/**
 * 事件管理器接口
 */
export interface IEventManager {
  /**
   * 获取可用事件
   */
  getAvailableEvents(state: GameState): Promise<EventDefinition[]>;
  
  /**
   * 触发事件
   */
  triggerEvent(
    eventId: string,
    state: GameState,
    choiceId?: string
  ): Promise<EventResult>;
  
  /**
   * 验证事件
   */
  validateEvent(event: EventDefinition): ValidationResult;
}
```

### 3.2 执行器实现

```typescript
/**
 * 事件执行器实现
 */
export class EventExecutor implements IEventExecutor {
  private handlers: Map<EffectType, EffectHandler>;
  
  constructor() {
    this.handlers = new Map();
    this.registerDefaultHandlers();
  }
  
  async executeEffects(
    effects: EffectDefinition[],
    state: GameState
  ): Promise<GameState> {
    let newState = { ...state };
    
    for (const effect of effects) {
      const handler = this.handlers.get(effect.type);
      if (!handler) {
        throw new Error(`Unknown effect type: ${effect.type}`);
      }
      newState = await handler.execute(effect, newState);
    }
    
    return newState;
  }
  
  private registerDefaultHandlers() {
    // 注册默认处理器
    this.handlers.set(EffectType.STAT_MODIFY, new StatModifyHandler());
    this.handlers.set(EffectType.TIME_ADVANCE, new TimeAdvanceHandler());
    this.handlers.set(EffectType.FLAG_SET, new FlagSetHandler());
    // ... 更多处理器
  }
}

/**
 * 效果处理器接口
 */
export interface EffectHandler {
  execute(effect: EffectDefinition, state: GameState): Promise<GameState>;
}

/**
 * 属性修改处理器
 */
export class StatModifyHandler implements EffectHandler {
  async execute(effect: EffectDefinition, state: GameState): Promise<GameState> {
    const { target, value, operator = 'set', randomRange } = effect;
    
    // 处理随机效果
    let finalValue = value;
    if (randomRange) {
      finalValue = Math.floor(
        Math.random() * (randomRange.maxValue - randomRange.minValue + 1)
        + randomRange.minValue
      );
    }
    
    // 获取当前值
    const currentValue = (state.player as any)[target];
    
    // 应用操作符
    let newValue: number;
    switch (operator) {
      case 'add':
        newValue = currentValue + finalValue;
        break;
      case 'subtract':
        newValue = currentValue - finalValue;
        break;
      case 'multiply':
        newValue = currentValue * finalValue;
        break;
      case 'divide':
        newValue = Math.floor(currentValue / finalValue);
        break;
      default:
        newValue = finalValue;
    }
    
    return {
      ...state,
      player: {
        ...state.player,
        [target]: newValue,
      },
    };
  }
}

/**
 * 时间推进处理器
 */
export class TimeAdvanceHandler implements EffectHandler {
  async execute(effect: EffectDefinition, state: GameState): Promise<GameState> {
    const { value = 1 } = effect;
    
    return {
      ...state,
      player: {
        ...state.player,
        age: state.player.age + value,
      },
      timestamp: Date.now(),
    };
  }
}
```

### 3.3 条件评估器

```typescript
/**
 * 条件评估器实现
 */
export class ConditionEvaluator implements IConditionEvaluator {
  evaluate(condition: EventCondition, state: GameState): boolean {
    if (condition.type === 'expression') {
      return this.evaluateExpression(condition.expression, state);
    } else {
      // 调用自定义处理器
      const handler = this.getHandler(condition.handler);
      return handler.evaluate(condition.params, state);
    }
  }
  
  private evaluateExpression(expression: string, state: GameState): boolean {
    // 安全的表达式解析和评估
    // 使用 jsep 或其他表达式解析库
    const ast = this.parse(expression);
    return this.evaluateAST(ast, state);
  }
  
  private parse(expression: string): ASTNode {
    // 实现表达式解析
    // 支持的操作符：AND, OR, NOT, >, <, ==, !=, >=, <=
    // 支持的函数：flags.has(), events.has() 等
  }
  
  private evaluateAST(node: ASTNode, state: GameState): boolean {
    // 递归评估 AST
  }
}
```

---

## 4. 存储方案

### 4.1 游戏状态结构

```typescript
/**
 * 游戏状态（可序列化）
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
```

### 4.2 存储接口

```typescript
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
 * 本地存储实现
 */
export class LocalStorageProvider implements StorageProvider {
  private readonly PREFIX = 'wuxia_save_';
  
  async saveGame(userId: string, state: GameState): Promise<void> {
    const key = `${this.PREFIX}${userId}`;
    const serialized = JSON.stringify(state);
    localStorage.setItem(key, serialized);
  }
  
  async loadGame(userId: string): Promise<GameState | null> {
    const key = `${this.PREFIX}${userId}`;
    const serialized = localStorage.getItem(key);
    if (!serialized) return null;
    
    const state = JSON.parse(serialized);
    return this.migrateState(state);
  }
  
  private migrateState(state: GameState): GameState {
    // 版本迁移逻辑
    return state;
  }
}
```

---

## 5. 事件开发模板

### 5.1 标准事件模板

```typescript
import { EventDefinition, EventCategory, EventPriority, EffectType } from './types';

/**
 * 事件开发模板
 * 复制此模板开始创建新事件
 */
export const newEventTemplate: EventDefinition = {
  // 基础信息
  id: 'unique_event_id',
  version: '1.0.0',
  category: EventCategory.MAIN_STORY,
  priority: EventPriority.NORMAL,
  weight: 30,
  
  // 触发条件
  ageRange: { min: 18, max: 25 },
  triggers: [
    { type: 'age_reach', value: 18 },
  ],
  conditions: [
    {
      type: 'expression',
      expression: 'martialPower >= 25 AND !flags.has("event_triggered")',
    },
  ],
  
  // 事件内容
  content: {
    text: '事件描述文本...',
    title: '事件标题',
  },
  
  eventType: 'choice',
  
  choices: [
    {
      id: 'choice_1',
      text: '选择 1 文本',
      effects: [
        {
          type: EffectType.STAT_MODIFY,
          target: 'martialPower',
          value: 5,
          operator: 'add',
        },
        {
          type: EffectType.TIME_ADVANCE,
          target: 'age',
          value: 1,
        },
      ],
    },
  ],
  
  // 元数据
  metadata: {
    createdAt: Date.now(),
    updatedAt: Date.now(),
    author: 'developer_name',
    tags: ['门派', '修炼'],
    enabled: true,
  },
};
```

---

## 6. 迁移指南

### 6.1 从旧格式迁移

```typescript
/**
 * 旧格式 -> 新格式迁移函数
 */
export function migrateEventDefinition(oldEvent: any): EventDefinition {
  return {
    id: oldEvent.id,
    version: '1.0.0',
    category: EventCategory.MAIN_STORY,
    priority: EventPriority.NORMAL,
    weight: oldEvent.weight || 30,
    ageRange: {
      min: oldEvent.minAge,
      max: oldEvent.maxAge,
    },
    triggers: [],
    content: {
      text: oldEvent.text,
    },
    eventType: oldEvent.autoNext ? 'auto' : 'choice',
    autoEffects: oldEvent.autoEffect 
      ? [convertEffect(oldEvent.autoEffect)] 
      : undefined,
    choices: oldEvent.choices?.map(convertChoice),
    metadata: {
      createdAt: Date.now(),
      updatedAt: Date.now(),
      enabled: true,
    },
  };
}
```

---

## 7. 验证规则

### 7.1 事件验证器

```typescript
export class EventValidator {
  validate(event: EventDefinition): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // 必填字段检查
    if (!event.id) errors.push('Missing id');
    if (!event.category) errors.push('Missing category');
    
    // ID 格式检查
    if (!/^[a-z0-9_]+$/.test(event.id)) {
      errors.push('Invalid id format');
    }
    
    // 年龄范围检查
    if (event.ageRange.min < 0) errors.push('Invalid ageRange.min');
    
    // 权重检查
    if (event.weight <= 0) warnings.push('Weight should be positive');
    
    return { valid: errors.length === 0, errors, warnings };
  }
}
```

---

## 8. 性能优化

### 8.1 事件索引

```typescript
export class EventIndex {
  private byId: Map<string, EventDefinition>;
  private byCategory: Map<EventCategory, Set<string>>;
  private byAgeRange: IntervalTree<EventDefinition>;
  
  add(event: EventDefinition) {
    this.byId.set(event.id, event);
    // 更新其他索引
  }
  
  getByAge(age: number): EventDefinition[] {
    // 快速查询指定年龄的事件
    return this.byAgeRange.query(age);
  }
}
```

---

## 9. 测试策略

### 9.1 单元测试

```typescript
describe('EventExecutor', () => {
  it('should execute stat modify effect', async () => {
    const executor = new EventExecutor();
    const state = createTestState();
    const effects: EffectDefinition[] = [
      {
        type: EffectType.STAT_MODIFY,
        target: 'martialPower',
        value: 5,
        operator: 'add',
      },
    ];
    
    const newState = await executor.executeEffects(effects, state);
    expect(newState.player.martialPower).toBe(state.player.martialPower + 5);
  });
});
```

---

## 10. 附录

### 10.1 术语表
- **EventDefinition**: 事件定义，纯数据结构
- **EffectDefinition**: 效果定义，声明式效果
- **EventExecutor**: 事件执行器，执行效果
- **ConditionEvaluator**: 条件评估器，评估条件

### 10.2 参考资料
- 现有事件数据：`src/data/storyData.ts`
- 长事件示例：`src/data/longEventExample.json`
- 类型定义：`src/types/index.ts`

---

**文档状态**: 待审批  
**下次审查日期**: 2026-03-19
