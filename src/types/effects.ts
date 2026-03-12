/**
 * 效果系统类型定义
 * 
 * 声明式效果系统，用于统一处理事件效果
 */

/**
 * 效果类型定义
 */
export type EffectDefinition =
  // 时间推进
  | {
      type: 'TIME_ADVANCE';
      unit: 'year' | 'month' | 'day';
      value: number;
    }
  
  // 属性修改
  | {
      type: 'STAT_MODIFY';
      stat: StatType;
      value: number;
      operator: 'add' | 'subtract' | 'multiply' | 'divide';
    }
  
  // 属性设置（绝对值）
  | {
      type: 'STAT_SET';
      stat: StatType;
      value: number;
    }
  
  // 标志设置
  | {
      type: 'FLAG_SET';
      flag: string;
    }
  
  // 标志清除
  | {
      type: 'FLAG_CLEAR';
      flag: string;
    }
  
  // 事件记录
  | {
      type: 'EVENT_RECORD';
      event: string;
    }
  
  // 金钱修改
  | {
      type: 'MONEY_MODIFY';
      value: number;
      operator: 'add' | 'subtract';
    }
  
  // 结局设置
  | {
      type: 'ENDING_SET';
      reason: string;
      epitaph: string;
    };

/**
 * 属性类型
 */
export type StatType =
  | 'age'
  | 'martialPower'
  | 'externalSkill'
  | 'internalSkill'
  | 'qinggong'
  | 'chivalry'
  | 'money';

/**
 * 效果执行结果
 */
export interface EffectResult {
  // 状态更新
  updates: Partial<PlayerStateUpdates>;
  
  // 时间跨度（如果有）
  timeSpan?: {
    value: number;
    unit: 'year' | 'month' | 'day';
  };
  
  // 是否触发结局
  ending?: {
    reason: string;
    epitaph: string;
  };
}

/**
 * 玩家状态更新（不包含 flags 和 events，由系统自动合并）
 */
export interface PlayerStateUpdates {
  age?: number;
  martialPower?: number;
  externalSkill?: number;
  internalSkill?: number;
  qinggong?: number;
  chivalry?: number;
  money?: number;
  sect?: string | null;
  title?: string | null;
  alive?: boolean;
  deathReason?: string | null;
  children?: number;
  flags?: Set<string>;
  events?: Set<string>;
}

/**
 * 完成标志配置
 */
export interface OnCompleteConfig {
  // 自动设置事件完成标志（可选）
  setEvent?: string;
  
  // 自动设置标志（可选）
  setFlag?: string;
  
  // 可选的回调（用于复杂逻辑）
  callback?: (state: PlayerState) => void;
}
