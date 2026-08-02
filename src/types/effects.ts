/**
 * 效果系统类型定义
 *
 * 声明式效果系统，用于统一处理事件效果
 */

import type { HealthStatus, StatusId } from './eventTypes';

/**
 * 效果类型定义
 */
export type EffectDefinition =
  // 时间推进
  | {
      type: 'time_advance';
      target: string;
      value: number;
      timeUnit: 'year' | 'month' | 'day';
    }

  // 属性修改
  | {
      type: 'stat_modify';
      stat: StatType;
      target: string;
      value: number;
      operator: 'add' | 'subtract' | 'multiply' | 'divide';
    }

  // 属性设置（绝对值）
  | {
      type: 'stat_set';
      stat: StatType;
      target: string;
      value: number;
    }

  // 标志设置
  | {
      type: 'flag_set';
      flag: string;
      target: string;
      value?: string | boolean | number;
    }

  // 标志清除
  | {
      type: 'flag_unset';
      flag: string;
      target: string;
    }

  // Canonical health/status operations
  | {
      type: 'health_status_set';
      value: HealthStatus;
    }
  | {
      type: 'status_add' | 'status_remove';
      status: StatusId;
    }

  // 事件记录
  | {
      type: 'event_record';
      target: string;
    }

  // 金钱修改
  | {
      type: 'money_modify';
      value: number;
      operator: 'add' | 'subtract';
    }

  // 结局设置
  | {
      type: 'ending_set';
      reason: string;
      epitaph: string;
    };

/**
 * 属性类型
 */
export type StatType =
  | 'age'
  | 'martialPower'
  | 'chivalry'
  | 'charisma'
  | 'constitution'
  | 'comprehension'
  | 'reputation'
  | 'influence'
  | 'connections'
  | 'knowledge'
  | 'businessAcumen'
  | 'money'
  | 'scholarlyHeritage'
  | 'martialHeritage'
  | 'merchantNetwork';
