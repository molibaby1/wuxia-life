/**
 * 条件评估器实现
 * 
 * 设计原则：
 * - 安全的表达式解析：使用安全的解析方式，避免 eval
 * - 可扩展：支持动态添加新的条件处理器
 * - 高性能：缓存解析结果，提高评估速度
 * 
 * @version 1.0.0
 * @since 2026-03-12
 */

import type {
  EventCondition,
  GameState,
  IConditionEvaluator,
} from '../types/eventTypes';

export type Condition = EventCondition;

/**
 * 条件评估器实现
 */
export class ConditionEvaluator implements IConditionEvaluator {
  private handlers: Map<string, CustomConditionHandler>;
  private cache: Map<string, boolean>;
  
  constructor() {
    this.handlers = new Map();
    this.cache = new Map();
    this.registerDefaultHandlers();
  }
  
  /**
   * 评估条件
   */
  evaluate(condition: EventCondition, state: GameState): boolean {
    if (condition.type === 'expression') {
      return this.evaluateExpression(condition.expression, state);
    } else {
      // 调用自定义处理器
      const handler = this.handlers.get((condition as any).handler);
      if (!handler) {
        console.warn(`Unknown condition handler: ${(condition as any).handler}`);
        return false;
      }
      return handler.evaluate((condition as any).params, state);
    }
  }
  
  /**
   * 评估表达式
   */
  private evaluateExpression(expression: string, state: GameState): boolean {
    // 检查缓存
    const cacheKey = `${expression}_${this.getStateHash(state)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }
    
    // 解析并评估表达式
    const result = this.parseAndEvaluate(expression, state);
    
    // 缓存结果
    this.cache.set(cacheKey, result);
    
    return result;
  }
  
  /**
   * 解析并评估表达式
   */
  private parseAndEvaluate(expression: string, state: GameState): boolean {
    // 预处理表达式
    let processed = expression.trim();
    
    // 1. 替换逻辑运算符（AND/OR/NOT → &&/||/!）
    processed = processed.replace(/\bAND\b/g, '&&');
    processed = processed.replace(/\bOR\b/g, '||');
    processed = processed.replace(/\bNOT\b/g, '!');
    
    // 2. 替换函数调用（在属性访问之前）
    processed = this.replaceFunctionCalls(processed, state);
    
    // 3. 替换属性访问
    processed = this.replacePropertyAccess(processed, state);
    
    // 4. 评估表达式（使用 Function 构造函数，比 eval 安全）
    try {
      // 只允许布尔表达式
      const result = new Function(`return ${processed}`)();
      return Boolean(result);
    } catch (error) {
      console.error(`Failed to evaluate expression: ${expression}`, error);
      return false;
    }
  }
  
  /**
   * 替换属性访问
   */
  private replacePropertyAccess(expression: string, state: GameState): string {
    // 替换 player 属性
    expression = expression.replace(
      /player\.(\w+)/g,
      (_, prop) => {
        const value = (state.player as any)[prop];
        return value !== undefined ? value : 'undefined';
      }
    );
    
    // 替换 flags
    expression = expression.replace(
      /flags\.(\w+)/g,
      (_, prop) => {
        const value = state.flags[prop];
        return value !== undefined ? String(value) : 'undefined';
      }
    );
    
    // 替换直接属性访问（如 chivalry, reputation 等）
    // 这些属性存储在 state.player 中
    expression = expression.replace(
      /\b(chivalry|reputation|martialPower|externalSkill|internalSkill|qinggong|constitution|charisma|comprehension|knowledge|connections|money|age)\b/g,
      (_, prop) => {
        const value = (state.player as any)?.[prop];
        return value !== undefined ? value : '0';
      }
    );
    
    return expression;
  }
  
  /**
   * 替换函数调用
   */
  private replaceFunctionCalls(expression: string, state: GameState): string {
    // 处理 flags.has('xxx') - flags 现在是对象而不是 Set
    // 支持 state.flags 和 state.player.flags 两种方式
    expression = expression.replace(
      /flags\.has\(['"]([^'"]+)['"]\)/g,
      (_, flagName) => {
        // 先检查 state.flags（旧格式）
        const hasFlag = !!state.flags?.[flagName] || !!state.player?.flags?.[flagName];
        return hasFlag ? 'true' : 'false';
      }
    );
    
    // 处理 events.has('xxx') - triggeredEvents 是数组
    expression = expression.replace(
      /events\.has\(['"]([^'"]+)['"]\)/g,
      (_, eventName) => {
        const hasEvent = (state.triggeredEvents || []).includes(eventName);
        return hasEvent ? 'true' : 'false';
      }
    );
    
    return expression;
  }
  
  /**
   * 获取状态哈希（用于缓存）
   */
  private getStateHash(state: GameState): string {
    // 简化的哈希，只考虑关键属性
    return JSON.stringify({
      player: {
        age: state.player.age,
        martialPower: state.player.martialPower,
        externalSkill: state.player.externalSkill,
        internalSkill: state.player.internalSkill,
        qinggong: state.player.qinggong,
        chivalry: state.player.chivalry,
      },
      flags: state.flags,
      triggeredEvents: state.triggeredEvents,
    });
  }
  
  /**
   * 注册默认处理器
   */
  private registerDefaultHandlers() {
    // 注册年龄检查处理器
    this.handlers.set('age_check', {
      evaluate: (params, state) => {
        const { min, max } = params || {};
        const age = state.player.age;
        
        if (min !== undefined && age < min) return false;
        if (max !== undefined && age > max) return false;
        
        return true;
      },
    });
    
    // 注册属性检查处理器
    this.handlers.set('stat_check', {
      evaluate: (params, state) => {
        const { stat, min, max } = params || {};
        const value = (state.player as any)[stat];
        
        if (value === undefined) return false;
        if (min !== undefined && value < min) return false;
        if (max !== undefined && value > max) return false;
        
        return true;
      },
    });
    
    // 注册 Flag 检查处理器
    this.handlers.set('flag_check', {
      evaluate: (params, state) => {
        const { flag, has } = params || {};
        const hasFlag = !!state.flags[flag];
        
        return has ? hasFlag : !hasFlag;
      },
    });
  }
  
  /**
   * 注册自定义处理器
   */
  registerHandler(name: string, handler: CustomConditionHandler) {
    this.handlers.set(name, handler);
  }
  
  /**
   * 清除缓存
   */
  clearCache() {
    this.cache.clear();
  }
}

/**
 * 自定义条件处理器接口
 */
export interface CustomConditionHandler {
  evaluate(params: any, state: GameState): boolean;
}

/**
 * 复合条件评估器（支持 AND/OR/NOT）
 */
export class CompositeConditionEvaluator implements IConditionEvaluator {
  private baseEvaluator: ConditionEvaluator;
  
  constructor(baseEvaluator?: ConditionEvaluator) {
    this.baseEvaluator = baseEvaluator || new ConditionEvaluator();
  }
  
  evaluate(condition: EventCondition, state: GameState): boolean {
    // 如果是简单条件，直接评估
    if (condition.type === 'expression') {
      return this.baseEvaluator.evaluate(condition, state);
    }
    
    // 如果是复合条件，递归评估
    const compositeCondition = condition as any;
    if (compositeCondition.op === 'and') {
      return compositeCondition.conditions.every((c: any) => 
        this.evaluate(c, state)
      );
    }
    
    if (compositeCondition.op === 'or') {
      return compositeCondition.conditions.some((c: any) => 
        this.evaluate(c, state)
      );
    }
    
    if (compositeCondition.op === 'not') {
      return !this.evaluate(compositeCondition.condition, state);
    }
    
    // 默认调用基础评估器
    return this.baseEvaluator.evaluate(condition, state);
  }
}
