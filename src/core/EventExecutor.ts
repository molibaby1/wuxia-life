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
  PlayerIdentity,
  KarmaChange,
  EventDefinition,
  FactionType,
  FocusType,
} from '../types/eventTypes';
import { IdentitySystem } from './IdentitySystem';
import { KarmaManager } from './KarmaSystem';
import { CriticalChoiceSystem } from './CriticalChoiceSystem';
import { EndingSystem } from './EndingSystem';
import { LifePathManager } from './LifePathSystem';
import { traitSystem } from './TraitSystem';

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
    // 深拷贝 state，确保 flags 等嵌套对象被正确复制
    let newState: GameState = {
      ...state,
      player: {
        ...state.player,
        flags: { ...(state.player.flags || {}) },
        events: [...(state.player.events || [])],
        items: [...(state.player.items || [])],
        relationships: [...(state.player.relationships || [])],
      },
    };
    
    for (const effect of effects) {
      const handler = this.handlers.get(effect.type);
      if (!handler) {
        throw new Error(`Unknown effect type: ${effect.type}`);
      }
      newState = await handler.execute(effect, newState);
    }
    
    // 重新判定身份（如果有变化）
    const newIdentity = IdentitySystem.determineIdentity(newState);
    if (newIdentity) {
      const currentPrimary = newState.identity?.primary;
      if (newIdentity !== currentPrimary) {
        newState.identity = {
          identities: [newIdentity],
          primary: newIdentity,
        };
      }
    }
    
    // 处理结局效果
    for (const effect of effects) {
      if (effect.ending_effect) {
        // 可以在这里添加结局触发逻辑
        // 例如：设置游戏结束标志、播放结局动画等
        newState.player.flags = newState.player.flags || {};
        newState.player.flags['ending_triggered'] = true;
        newState.player.flags[`ending_${effect.ending_effect.ending_id}`] = true;
      }
    }
    
    return newState;
  }
  
  /**
   * 检查事件是否可以触发
   * 验证所有触发条件（包括选择、身份、因果）
   */
  static canTriggerEvent(event: EventDefinition, state: GameState): boolean {
    const conditions = event.triggerConditions;
    
    if (!conditions) return true;
    
    // 检查选择条件
    if (conditions.choices) {
      if (!CriticalChoiceSystem.checkChoiceRequirement(state, conditions.choices)) {
        return false;
      }
    }
    
    // 检查身份条件
    if (conditions.identity) {
      if (conditions.identity.required && !state.identity) {
        return false;
      }
      const identities = state.identity?.identities || [];
      if (conditions.identity.required && !conditions.identity.required.some(identity => identities.includes(identity))) {
        return false;
      }
      if (conditions.identity.forbidden && conditions.identity.forbidden.some(identity => identities.includes(identity))) {
        return false;
      }
    }
    
    // 检查因果条件
    if (conditions.karma && state.karma) {
      if (conditions.karma.good_min !== undefined && state.karma.good_karma < conditions.karma.good_min) {
        return false;
      }
      if (conditions.karma.evil_min !== undefined && state.karma.evil_karma < conditions.karma.evil_min) {
        return false;
      }
      const netKarma = KarmaManager.getNetKarma(state);
      if (conditions.karma.net_min !== undefined && netKarma < conditions.karma.net_min) {
        return false;
      }
      if (conditions.karma.net_max !== undefined && netKarma > conditions.karma.net_max) {
        return false;
      }
    }
    
    return true;
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
    // 新增：因果变化处理器
    this.handlers.set(EffectType.KARMA_CHANGE, new KarmaChangeHandler());
    
    // 新增：人生轨迹系统处理器
    this.handlers.set(EffectType.SET_FACTION, new SetFactionHandler());
    this.handlers.set(EffectType.LIFEPATH_ADD_FOCUS, new LifepathAddFocusHandler());
    this.handlers.set(EffectType.LIFEPATH_RECORD_ACHIEVEMENT, new LifepathRecordAchievementHandler());
    this.handlers.set(EffectType.LIFEPATH_ADD_COMMITMENT, new LifepathAddCommitmentHandler());
    this.handlers.set(EffectType.LIFEPATH_ADD_RELATIONSHIP, new LifepathAddRelationshipHandler());
    
    // 新增：触发事件处理器
    this.handlers.set(EffectType.TRIGGER_EVENT, new TriggerEventHandler());
    this.handlers.set(EffectType.LIFE_STATE_CHANGE, new LifeStateChangeHandler());
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
  private static readonly MODIFIABLE_PLAYER_STATS = new Set<string>([
    'age',
    'martialPower',
    'externalSkill',
    'internalSkill',
    'qinggong',
    'chivalry',
    'charisma',
    'constitution',
    'comprehension',
    'reputation',
    'knowledge',
    'connections',
    'money',
    'businessAcumen',
    'influence',
    'martialHeritage',
    'scholarlyHeritage',
    'merchantNetwork',
    'wealth',
    'health',
    'energy',
  ]);

  async execute(effect: EffectDefinition, state: GameState): Promise<GameState> {
    const target = effect.target || (effect as any).stat;
    const { value, operator = 'set', randomRange } = effect;

    if (!target || typeof target !== 'string') {
      console.warn('[StatModifyHandler] 跳过无效属性修改效果:', effect);
      return state;
    }
    
    // 处理随机效果
    let finalValue = value;
    if (randomRange) {
      finalValue = Math.floor(
        Math.random() * (randomRange.maxValue - randomRange.minValue + 1)
        + randomRange.minValue
      );
    }
    
    // 获取当前值
    const rawCurrentValue = (state.player as any)[target];
    if (rawCurrentValue === undefined && !StatModifyHandler.MODIFIABLE_PLAYER_STATS.has(target)) {
      console.warn(`Unknown stat: ${target}`);
      return state;
    }
    const currentValue = rawCurrentValue ?? 0;
    
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

      if (adjustedValue > 0) {
        const multiplier = traitSystem.getGrowthMultiplier(state.player, target);
        adjustedValue = Math.max(1, Math.round(adjustedValue * multiplier));
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

class LifeStateChangeHandler implements EffectHandler {
  async execute(effect: EffectDefinition, state: GameState): Promise<GameState> {
    const stateKey = effect.target as keyof NonNullable<GameState['player']['lifeStates']>;
    if (!state.player) {
      return state;
    }

    const currentStates = state.player.lifeStates || traitSystem.createInitialLifeStates();
    const currentValue = currentStates[stateKey] || 0;
    const delta = Number(effect.value || 0);
    const nextValue = traitSystem.clampLifeState(stateKey, currentValue + delta);

    return {
      ...state,
      player: {
        ...state.player,
        lifeStates: {
          ...currentStates,
          [stateKey]: nextValue,
        },
      },
    };
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
 * 支持阵营互斥机制：当设置 sect_faction 时，自动清除其他阵营标记
 * 
 * 支持两种格式：
 * - 新格式：{ type: 'flag_set', flag: 'xxx', value: 'yyy' }
 * - 旧格式：{ type: 'flag_set', target: 'xxx', value: 'yyy' }
 */
export class FlagSetHandler implements EffectHandler {
  async execute(effect: EffectDefinition, state: GameState): Promise<GameState> {
    // 兼容新格式（flag）和旧格式（target）
    const flagName = effect.flag || effect.target;
    const flagValue = effect.value !== undefined ? effect.value : true;
    
    if (!flagName) {
      console.warn('[FlagSetHandler] 未找到 flag 名称，跳过');
      return state;
    }
    
    
    // 同步维护顶层与 player 下的 flags，避免读取路径不一致导致状态丢失
    let newFlags = {
      ...(state.flags || {}),
      ...(state.player?.flags || {}),
      [flagName]: flagValue,
    };
    
    // 如果设置 sect_faction，需要清除旧阵营的标记
    if (flagName === 'sect_faction' && flagValue) {
      const faction = flagValue as string;
      
      // 清除其他阵营标记
      if (faction === 'orthodox') {
        newFlags = {
          ...newFlags,
          sect_faction: 'orthodox',
          orthodox_member: true,
        };
        // 清除 unconventional 阵营标记
        delete newFlags['unconventional_member'];
      } else if (faction === 'unconventional') {
        newFlags = {
          ...newFlags,
          sect_faction: 'unconventional',
          unconventional_member: true,
        };
        // 清除 orthodox 阵营标记
        delete newFlags['orthodox_member'];
      } else if (faction === 'neutral' || faction === 'none') {
        newFlags = {
          ...newFlags,
          sect_faction: 'neutral',
        };
        // 清除所有阵营标记
        delete newFlags['orthodox_member'];
        delete newFlags['unconventional_member'];
      }
    }
    
    const result = {
      ...state,
      flags: newFlags,
      player: {
        ...state.player,
        flags: newFlags,
      },
    };


    return result;
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
      const existing = relationships[existingIndex];
      if (!existing) {
        return state;
      }
      relationships[existingIndex] = {
        ...existing,
        id: existing.id || relationId,
        role: (role || existing.role) as any,
        name: name || existing.name,
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
    // 支持 event_record 和 EVENT_RECORD 两种格式
    const target = effect.event || effect.target;
    
    // 将事件记录添加到玩家的事件列表中
    if (state.player && target) {
      const eventRecord = {
        eventId: target,
        timestamp: state.currentTime
          ? {
              year: state.currentTime.year,
              month: state.currentTime.month,
              day: state.currentTime.day,
            }
          : {
              year: state.player.age,
              month: 1,
              day: 1,
            },
        age: state.player.age,
      };
      
      return {
        ...state,
        player: {
          ...state.player,  // 保留所有 player 属性
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
    if (!selectedEffect) {
      return state;
    }
    
    // 递归执行选中的效果
    const executor = new EventExecutor();
    return executor.executeEffects([selectedEffect], state);
  }
}

/**
 * 因果变化处理器
 */
export class KarmaChangeHandler implements EffectHandler {
  async execute(effect: EffectDefinition, state: GameState): Promise<GameState> {
    const effectDef = effect as any;
    const good = effectDef.good || 0;
    const evil = effectDef.evil || 0;
    const description = effect.description || '因果变化';
    
    if (good === 0 && evil === 0) {
      return state;
    }
    
    const timestamp = state.currentTime 
      ? state.currentTime.year * 10000 + state.currentTime.month * 100 + state.currentTime.day
      : Date.now();
    
    // 处理善行
    if (good > 0) {
      state = KarmaManager.addKarma(
        state,
        good,
        description,
        timestamp
      );
    }
    
    // 处理恶行
    if (evil > 0) {
      state = KarmaManager.addKarma(
        state,
        -evil,
        description,
        timestamp
      );
    }
    
    return state;
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
      
      // 触发结局判定
      const ending = EndingSystem.determineEnding(state);
      
      // 设置游戏结束标志和结局信息
      return {
        ...state,
        player: state.player ? {
          ...state.player,
          alive: false,
          deathReason: ending.name,
        } : state.player,
        flags: {
          ...state.flags,
          gameEnded: true,
          ending_triggered: true,
          [`ending_${ending.id}`]: true,
        },
        ending: {
          id: ending.id,
          name: ending.name,
          description: ending.description,
          category: ending.category,
        },
      };
    }
    
    // 其他特殊效果可以在这里添加
    return state;
  }
}

/**
 * 设置阵营处理器
 */
export class SetFactionHandler implements EffectHandler {
  async execute(effect: EffectDefinition, state: GameState): Promise<GameState> {
    const { value } = effect;
    const faction: FactionType = value as FactionType;
    
    if (!state.lifePath) {
      state = LifePathManager.initialize(state);
    }
    
    return {
      ...state,
      lifePath: {
        ...state.lifePath!,
        faction,
      },
    };
  }
}

/**
 * 添加专注度处理器
 */
export class LifepathAddFocusHandler implements EffectHandler {
  async execute(effect: EffectDefinition, state: GameState): Promise<GameState> {
    const { target, value = 1 } = effect;
    const focusType: FocusType = target as FocusType;
    
    if (!state.lifePath) {
      state = LifePathManager.initialize(state);
    }
    
    const currentFocus = state.lifePath.focus || { martial: 0, business: 0, academic: 0, leadership: 0 };
    
    return {
      ...state,
      lifePath: {
        ...state.lifePath!,
        focus: {
          ...currentFocus,
          [focusType]: (currentFocus[focusType] || 0) + value,
        },
      },
    };
  }
}

/**
 * 记录成就处理器
 */
export class LifepathRecordAchievementHandler implements EffectHandler {
  async execute(effect: EffectDefinition, state: GameState): Promise<GameState> {
    const { target } = effect;
    const achievementId = target;
    
    if (!state.lifePath) {
      state = LifePathManager.initialize(state);
    }
    
    const achievements = state.lifePath.achievements || [];
    if (!achievements.includes(achievementId)) {
      achievements.push(achievementId);
    }
    
    return {
      ...state,
      lifePath: {
        ...state.lifePath!,
        achievements,
      },
    };
  }
}

/**
 * 添加承诺处理器
 */
export class LifepathAddCommitmentHandler implements EffectHandler {
  async execute(effect: EffectDefinition, state: GameState): Promise<GameState> {
    const { target, value } = effect;
    const commitmentType = target as 'cannotJoin' | 'mustProtect' | 'swornEnemies';
    
    if (!state.lifePath) {
      state = LifePathManager.initialize(state);
    }
    
    const commitments = state.lifePath.commitments || { cannotJoin: [], mustProtect: [], swornEnemies: [] };
    const commitmentList = commitments[commitmentType] || [];
    
    if (!commitmentList.includes(value)) {
      commitmentList.push(value);
    }
    
    return {
      ...state,
      lifePath: {
        ...state.lifePath!,
        commitments: {
          ...commitments,
          [commitmentType]: commitmentList,
        },
      },
    };
  }
}

/**
 * 添加关系处理器
 */
export class LifepathAddRelationshipHandler implements EffectHandler {
  async execute(effect: EffectDefinition, state: GameState): Promise<GameState> {
    const { target, value } = effect;
    const relationshipType = target as 'allies' | 'enemies' | 'mentors' | 'disciples';
    const relationId = value;
    
    if (!state.lifePath) {
      state = LifePathManager.initialize(state);
    }
    
    const relationships = state.lifePath.relationships || { allies: [], enemies: [], mentors: [], disciples: [] };
    const relationshipList = relationships[relationshipType] || [];
    
    if (!relationshipList.includes(relationId)) {
      relationshipList.push(relationId);
    }
    
    return {
      ...state,
      lifePath: {
        ...state.lifePath!,
        relationships: {
          ...relationships,
          [relationshipType]: relationshipList,
        },
      },
    };
  }
}

/**
 * 触发事件处理器
 * 用于在事件效果中直接触发另一个事件
 */
export class TriggerEventHandler implements EffectHandler {
  async execute(effect: EffectDefinition, state: GameState): Promise<GameState> {
    const { target } = effect;
    const eventId = target as string;
    
    
    // 从 eventLoader 获取事件定义
    const eventLoader = (this as any).eventLoader;
    if (!eventLoader) {
      console.error(`[TriggerEvent] eventLoader 不存在，无法触发 ${eventId}`);
      return state;
    }
    
    const event = eventLoader.getEventById(eventId);
    if (!event) {
      console.error(`[TriggerEvent] 事件 ${eventId} 不存在`);
      return state;
    }
    
    
    // 如果是自动事件，直接执行效果
    if (event.eventType === 'auto' && event.autoEffects) {
      const updatedState = await this.execute(event.autoEffects, state);
      return updatedState;
    }
    
    // 否则只记录事件
    if (state.player) {
      state.player.events.push({
        eventId: eventId,
        timestamp: state.currentTime
          ? {
              year: state.currentTime.year,
              month: state.currentTime.month,
              day: state.currentTime.day,
            }
          : {
              year: state.player.age,
              month: 1,
              day: 1,
            },
      });
    }
    
    return state;
  }
}
