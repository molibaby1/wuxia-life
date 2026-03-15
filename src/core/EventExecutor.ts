/**
 * 事件执行器实现
 * 
 * 设计原则：
 * - 与事件定义解耦：执行器只处理 EffectDefinition，不依赖具体事件
 * - 可扩展：支持动态添加新的效果处理器
 * - 类型安全：完整的 TypeScript 类型支持
 * 
 * @version 1.0.0
 * @since 2026-03-12
 */

import { EffectType } from '../types/eventTypes';
import type {
  EffectDefinition,
  EffectOperator,
  GameState,
  IEventExecutor,
  EffectHandler,
} from '../types/eventTypes';

/**
 * 事件执行器实现
 */
export class EventExecutor implements IEventExecutor {
  private handlers: Map<EffectType, EffectHandler>;
  
  constructor() {
    this.handlers = new Map();
    this.registerDefaultHandlers();
  }
  
  /**
   * 执行事件效果
   */
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
  
  /**
   * 注册默认处理器
   */
  private registerDefaultHandlers() {
    this.handlers.set(EffectType.STAT_MODIFY, new StatModifyHandler());
    this.handlers.set(EffectType.TIME_ADVANCE, new TimeAdvanceHandler());
    this.handlers.set(EffectType.FLAG_SET, new FlagSetHandler());
    this.handlers.set(EffectType.FLAG_UNSET, new FlagUnsetHandler());
    this.handlers.set(EffectType.EVENT_RECORD, new EventRecordHandler());
    this.handlers.set(EffectType.RELATION_CHANGE, new RelationChangeHandler());
    this.handlers.set(EffectType.RANDOM, new RandomEffectHandler());
    this.handlers.set(EffectType.SPECIAL, new SpecialEffectHandler());
  }
  
  /**
   * 注册自定义处理器
   */
  registerHandler(type: EffectType, handler: EffectHandler) {
    this.handlers.set(type, handler);
  }
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
    if (currentValue === undefined) {
      console.warn(`Unknown stat: ${target}`);
      return state;
    }
    
    // 为内外功提供差异化成长加成
    let adjustedValue = finalValue;
    if (operator === 'add') {
      if (target === 'internalSkill') {
        const bonus = Math.floor(((state.player as any).comprehension || 0) / 20);
        adjustedValue += bonus;
      } else if (target === 'externalSkill') {
        const bonus = Math.floor(((state.player as any).constitution || 0) / 20);
        adjustedValue += bonus;
      }
    }
    
    // 应用操作符
    let newValue: number;
    switch (operator) {
      case 'add':
        newValue = currentValue + adjustedValue;
        break;
      case 'subtract':
        newValue = currentValue - adjustedValue;
        break;
      case 'multiply':
        newValue = currentValue * adjustedValue;
        break;
      case 'divide':
        newValue = adjustedValue === 0 ? currentValue : Math.floor(currentValue / adjustedValue);
        break;
      default:
        newValue = adjustedValue;
    }
    
    // 确保值在合理范围内
    newValue = this.clampValue(newValue, target);
    
    return {
      ...state,
      player: {
        ...state.player,
        [target]: newValue,
      },
    };
  }
  
  /**
   * 限制值在合理范围内
   */
  private clampValue(value: number, statName: string): number {
    // 不同属性有不同的范围限制
    const ranges: Record<string, [number, number]> = {
      martialPower: [0, 999],
      externalSkill: [0, 999],
      internalSkill: [0, 999],
      qinggong: [0, 999],
      chivalry: [0, 100],
      charisma: [0, 100],
      constitution: [0, 100],
      comprehension: [0, 100],
      reputation: [-100, 100],
      connections: [0, 100],
      money: [0, Number.MAX_SAFE_INTEGER],
    };
    
    const range = ranges[statName];
    if (!range) return value;
    
    return Math.max(range[0], Math.min(range[1], value));
  }
}

/**
 * 时间推进处理器
 */
export class TimeAdvanceHandler implements EffectHandler {
  async execute(effect: EffectDefinition, state: GameState): Promise<GameState> {
    const { value = 1, timeUnit = 'year' } = effect;
    const currentTime = state.currentTime || { year: 1, month: 1, day: 1 };
    let year = currentTime.year;
    let month = currentTime.month;
    let day = currentTime.day;
    let age = state.player.age;

    if (timeUnit === 'year') {
      year += value;
      age += value;
    } else if (timeUnit === 'month') {
      month += value;
      while (month > 12) {
        month -= 12;
        year += 1;
        age += 1;
      }
    } else {
      day += value;
      while (day > 30) {
        day -= 30;
        month += 1;
        if (month > 12) {
          month = 1;
          year += 1;
          age += 1;
        }
      }
    }
    
    return {
      ...state,
      player: {
        ...state.player,
        age,
      },
      currentTime: {
        year,
        month,
        day,
      },
      gameTimestamp: Date.now(),
    };
  }
}

/**
 * Flag 设置处理器
 */
export class FlagSetHandler implements EffectHandler {
  async execute(effect: EffectDefinition, state: GameState): Promise<GameState> {
    const { target } = effect;
    
    return {
      ...state,
      player: {
        ...state.player,
        flags: {
          ...state.player.flags,
          [target]: true,
        },
      },
    };
  }
}

/**
 * Flag 移除处理器
 */
export class FlagUnsetHandler implements EffectHandler {
  async execute(effect: EffectDefinition, state: GameState): Promise<GameState> {
    const { target } = effect;
    
    const newFlags = { ...state.player.flags };
    delete newFlags[target];
    
    return {
      ...state,
      player: {
        ...state.player,
        flags: newFlags,
      },
    };
  }
}

/**
 * 关系变更处理器
 */
export class RelationChangeHandler implements EffectHandler {
  async execute(effect: EffectDefinition, state: GameState): Promise<GameState> {
    const { target, value, operator = 'add' } = effect;
    const relations = { ...(state.relations || {}) };

    let relationId = target;
    let role: string | undefined;
    let name: string | undefined;
    let delta = 0;

    if (typeof value === 'number') {
      delta = value;
    } else if (value && typeof value === 'object') {
      if (typeof value.id === 'string') relationId = value.id;
      if (typeof value.role === 'string') role = value.role;
      if (typeof value.name === 'string') name = value.name;
      if (typeof value.delta === 'number') delta = value.delta;
      if (typeof value.value === 'number') delta = value.value;
      if (typeof value.affinity === 'number') delta = value.affinity;
    }

    const current = relations[relationId] ?? 0;
    let next = current;

    switch (operator) {
      case 'set':
        next = delta;
        break;
      case 'subtract':
        next = current - delta;
        break;
      case 'multiply':
        next = current * delta;
        break;
      case 'divide':
        next = delta === 0 ? current : Math.floor(current / delta);
        break;
      default:
        next = current + delta;
    }

    relations[relationId] = next;

    if (!state.player) {
      return {
        ...state,
        relations,
      };
    }

    const relationships = [...(state.player.relationships || [])];
    const existingIndex = relationships.findIndex(rel => rel.id === relationId);

    if (existingIndex === -1) {
      relationships.push({
        id: relationId,
        role: (role || target) as any,
        name: name || relationId,
        affinity: next,
      });
    } else {
      relationships[existingIndex] = {
        ...relationships[existingIndex],
        role: (role || relationships[existingIndex].role) as any,
        name: name || relationships[existingIndex].name,
        affinity: next,
      };
    }

    return {
      ...state,
      relations,
      player: {
        ...state.player,
        relationships,
      },
    };
  }
}

/**
 * 事件记录处理器
 */
export class EventRecordHandler implements EffectHandler {
  async execute(effect: EffectDefinition, state: GameState): Promise<GameState> {
    const { target } = effect;
    
    // 将事件记录添加到玩家的事件列表中
    if (state.player) {
      const eventRecord = {
        eventId: target,
        timestamp: Date.now(),
        age: state.player.age,
      };
      
      return {
        ...state,
        player: {
          ...state.player,
          events: [...(state.player.events || []), eventRecord],
        },
      };
    }
    
    return state;
  }
}

/**
 * 随机效果处理器
 */
export class RandomEffectHandler implements EffectHandler {
  async execute(effect: EffectDefinition, state: GameState): Promise<GameState> {
    const { effects } = effect;
    
    if (!effects || effects.length === 0) {
      return state;
    }
    
    // 随机选择一个效果执行
    const randomIndex = Math.floor(Math.random() * effects.length);
    const selectedEffect = effects[randomIndex];
    
    // 递归执行选中的效果
    const executor = new EventExecutor();
    return executor.executeEffects([selectedEffect], state);
  }
}

/**
 * 复合效果处理器（处理嵌套效果）
 */
export class CompositeEffectHandler implements EffectHandler {
  async execute(effect: EffectDefinition, state: GameState): Promise<GameState> {
    const { effects } = effect;
    
    if (!effects) {
      return state;
    }
    
    const executor = new EventExecutor();
    return executor.executeEffects(effects, state);
  }
}

/**
 * 特殊效果处理器（处理 end_game 等特殊效果）
 */
export class SpecialEffectHandler implements EffectHandler {
  async execute(effect: EffectDefinition, state: GameState): Promise<GameState> {
    const { target } = effect;
    
    // 处理游戏结束效果
    if (target === 'end_game') {
      console.log('游戏结束！');
      // 设置游戏结束标志
      return {
        ...state,
        flags: {
          ...state.flags,
          gameEnded: true,
        },
      };
    }
    
    // 其他特殊效果可以在这里添加
    return state;
  }
}
