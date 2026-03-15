import type { EffectDefinition, OnCompleteConfig } from './effects';
import type { EffectOperator, EffectType, EventCategory, EventPriority, TalentDefinition } from './eventTypes';

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

export interface PlayerState {
  age: number;
  gender: 'male' | 'female';
  name: string;
  sect: string | null;
  
  martialPower: number;
  externalSkill: number;
  internalSkill: number;
  qinggong: number;
  
  chivalry: number;
  money: number;
  
  flags: Set<string>;
  events: Set<string>;
  children: number;
  
  alive: boolean;
  deathReason: string | null;
  title: string | null;
  
  // 时间单位：'year' | 'month' | 'day'
  timeUnit: 'year' | 'month' | 'day';
  // 当前时间进度（按月或日计算）
  monthProgress: number; // 0-11
  dayProgress: number; // 1-30
}

export interface StoryChoice {
  id: string;
  text: string;
  condition?: (state: PlayerState) => boolean;
  // 支持新旧两种效果格式
  effects?: Effect[];
  effect?: (state: PlayerState) => any;
  nextNodeId?: string;
  // 时间跨度配置
  timeSpan?: {
    value: number;
    unit: 'year' | 'month' | 'day';
  };
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
  onComplete?: OnCompleteConfig;
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
