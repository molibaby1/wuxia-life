import type { EffectDefinition } from './effects';
import type {
  EffectOperator,
  EffectType,
  EventCategory,
  EventPriority,
  TalentDefinition,
  PlayerState,
  GameState,
  EventRecord,
} from './eventTypes';

export type ConditionOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'hasFlag' | 'hasEvent' | 'not' | 'and' | 'or' | 'random';

export interface Condition {
  op: ConditionOperator;
  field?: keyof PlayerState;
  value?: any;
  conditions?: Condition[];
}

// 从 eventTypes 重新导出
export type { EffectOperator, EffectType, EventCategory, EventPriority, TalentDefinition };

export interface Effect {
  op: EffectOperator;
  field?: keyof PlayerState;
  value?: any;
  minValue?: number;
  maxValue?: number;
  condition?: Condition;
  effects?: Effect[];
}

export type { PlayerState, GameState, EventRecord };
export type { EffectDefinition };

export interface PlayerStateUpdates {
  [key: string]: unknown;
  flags?: Set<string>;
  events?: Set<string>;
}

export interface EffectResult {
  updates: PlayerStateUpdates;
  timeSpan?: {
    value: number;
    unit: 'year' | 'month' | 'day';
  };
  ending?: {
    reason: string;
    epitaph: string;
  };
}

export interface StoryChoice {
  id: string;
  text: string;
  description?: string;
  condition?: ((state: PlayerState) => boolean) | { type: string; expression: string };
  effects?: Effect[];
  effect?: (state: PlayerState) => any;
  nextNodeId?: string;
  outcomes?: ChoiceOutcomeUI[] | Array<{
    id: string;
    text: string;
    condition?: ((state: PlayerState) => boolean) | { type: string; expression: string };
    effects?: Effect[];
  }>;
  timeSpan?: {
    value: number;
    unit: 'year' | 'month' | 'day';
  };
}

export interface ChoiceOutcomeUI {
  id: string;
  text: string;
  condition?: ((state: PlayerState) => boolean) | { type: string; expression: string };
  effects?: Effect[];
}

export interface StoryNode {
  id: string;
  minAge: number;
  maxAge?: number;
  text: string;
  choices?: StoryChoice[];
  // 支持新旧两种效果格式
  autoEffects?: Effect[];
  autoEffect?: (state: PlayerState) => any;
  // 新的声明式效果系统
  effects?: EffectDefinition[];
  // 完成标志（自动设置）
  onComplete?: {
    setEvent?: string;
    setFlag?: string;
  };
  autoNext?: boolean;
  condition?: (state: PlayerState) => boolean;
  weight?: number;
  // 时间跨度配置
  timeSpan?: {
    value: number;
    unit: 'year' | 'month' | 'day';
  };
}

export interface DeathEnding {
  id: string;
  title: string;
  text: string;
  condition: (state: PlayerState) => boolean;
  epitaph: string;
}
