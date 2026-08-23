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
import { isHealthStatus, isStatusId } from '../types/eventTypes';
import { isWealthCapacity } from '../types/wealthCapacity';
import { isAssetId } from '../types/asset';
import { addAsset, removeAsset } from './assetOwnership';
import type {
  EffectDefinition,
  EffectOperator,
  GameState,
  IEventExecutor,
  EffectHandler,
  KarmaChange,
  EventDefinition,
  FactionType,
  HealthStatus,
  StatusId,
} from '../types/eventTypes';
import {
  applyPrimaryOriginFamilyExclusivity,
  isPrimaryOriginFamilyFlag,
} from '../p16/primaryOriginFlag';
import { syncOriginFromPrimaryChoice } from '../p16/primaryOriginTraitBridge';
import { KarmaManager } from './KarmaSystem';
import { CriticalChoiceSystem } from './CriticalChoiceSystem';
import { EndingSystem } from './EndingSystem';
import { buildEndingPresentationDescription } from './endingPresentation';
import { LifePathManager } from './LifePathSystem';
import { traitSystem } from './TraitSystem';
import { isAffiliationId } from './affiliationCatalog';

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
    if (typeof conditions !== 'object') {
      return false;
    }
    
    // 检查选择条件
    if (conditions.choices) {
      if (!CriticalChoiceSystem.checkChoiceRequirement(state, conditions.choices)) {
        return false;
      }
    }
    
    if (conditions.flags) {
      const playerFlags = state.player?.flags || {};
      const hasFlag = (flagName: string) => Boolean(playerFlags[flagName]);

      if (conditions.flags.required) {
        for (const flagName of conditions.flags.required) {
          if (!hasFlag(flagName)) {
            return false;
          }
        }
      }

      if (conditions.flags.not) {
        for (const flagName of conditions.flags.not) {
          if (hasFlag(flagName)) {
            return false;
          }
        }
      }
    }

    // 检查因果条件
    if (conditions.karma) {
      if (!state.karma) {
        return false;
      }
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
    this.handlers.set(EffectType.AFFILIATION_SET, new AffiliationSetHandler());
    this.handlers.set(EffectType.AFFILIATION_CLEAR, new AffiliationClearHandler());
    this.handlers.set(EffectType.HEALTH_STATUS_SET, new HealthStatusSetHandler());
    this.handlers.set(EffectType.STATUS_ADD, new StatusAddHandler());
    this.handlers.set(EffectType.STATUS_REMOVE, new StatusRemoveHandler());
    this.handlers.set(EffectType.EVENT_RECORD, new EventRecordHandler());
    this.handlers.set(EffectType.RELATION_CHANGE, new RelationChangeHandler());
    this.handlers.set(EffectType.RANDOM, new RandomEffectHandler());
    this.handlers.set(EffectType.SPECIAL, new SpecialEffectHandler());
    this.handlers.set(EffectType.WEALTH_CAPACITY_SET, new WealthCapacitySetHandler());
    this.handlers.set(EffectType.ASSET_ADD, new AssetAddHandler());
    this.handlers.set(EffectType.ASSET_REMOVE, new AssetRemoveHandler());
    // 新增：因果变化处理器
    this.handlers.set(EffectType.KARMA_CHANGE, new KarmaChangeHandler());
    
    // 新增：人生轨迹系统处理器
    this.handlers.set(EffectType.SET_FACTION, new SetFactionHandler());
    this.handlers.set(EffectType.LIFEPATH_RECORD_ACHIEVEMENT, new LifepathRecordAchievementHandler());
    this.handlers.set(EffectType.LIFEPATH_ADD_COMMITMENT, new LifepathAddCommitmentHandler());
    this.handlers.set(EffectType.LIFEPATH_ADD_RELATIONSHIP, new LifepathAddRelationshipHandler());
    
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
    'children',
    'martialPower',
    'chivalry',
    'charisma',
    'constitution',
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
  ]);

  private static readonly NON_NEGATIVE_CANONICAL_STATS = new Set([
    'martialPower',
    'constitution',
    'knowledge',
    'connections',
    'reputation',
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
    
    if (!StatModifyHandler.MODIFIABLE_PLAYER_STATS.has(target)) {
      return state;
    }

    // 获取当前值
    const rawCurrentValue = (state.player as any)[target];
    const currentValue = rawCurrentValue ?? 0;
    
    let adjustedValue = finalValue;
    if (operator === 'add') {
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
    if (StatModifyHandler.NON_NEGATIVE_CANONICAL_STATS.has(statName)) {
      return Math.max(0, value);
    }

    if (statName === 'chivalry') {
      return value;
    }

    // Canonical 属性不在这里设置固定上限；其余保留既有运行时边界。
    const ranges: Record<string, [number, number]> = {
      charisma: [0, 100],
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

    // origin_background 四选一：设置主出身 flag 时清除其他四主 flag
    if (flagValue && isPrimaryOriginFamilyFlag(flagName)) {
      newFlags = applyPrimaryOriginFamilyExclusivity(newFlags, flagName);
    }

    // 如果设置 sect_faction，需要清除旧阵营的标记
    if (flagName === 'sect_faction' && flagValue) {
      const faction = flagValue as string;

      if (faction === 'orthodox') {
        newFlags = {
          ...newFlags,
          sect_faction: 'orthodox',
          orthodox_member: true,
        };
        delete newFlags['unconventional_member'];
      } else if (faction === 'unconventional') {
        newFlags = {
          ...newFlags,
          sect_faction: 'unconventional',
          unconventional_member: true,
        };
        delete newFlags['orthodox_member'];
        delete newFlags['route_orthodox'];
      } else if (faction === 'neutral' || faction === 'none') {
        newFlags = {
          ...newFlags,
          sect_faction: 'neutral',
        };
        delete newFlags['orthodox_member'];
        delete newFlags['unconventional_member'];
      }
    }

    let result: GameState = {
      ...state,
      flags: newFlags,
      player: {
        ...state.player,
        flags: newFlags,
      },
    };
    if (flagValue && isPrimaryOriginFamilyFlag(flagName)) {
      result = syncOriginFromPrimaryChoice(result, flagName);
    }
    return result;
  }
}

class AffiliationSetHandler implements EffectHandler {
  execute(effect: EffectDefinition, state: GameState): GameState {
    if (!isAffiliationId(effect.value)) {
      throw new Error(`Unknown affiliation effect value: ${String(effect.value)}`);
    }
    return {
      ...state,
      player: {
        ...state.player,
        affiliation: effect.value,
      },
    };
  }
}

class AssetAddHandler implements EffectHandler {
  execute(effect: EffectDefinition, state: GameState): GameState {
    if (!isAssetId(effect.asset)) {
      throw new Error(`Invalid asset effect value: ${String(effect.asset)}`);
    }
    return { ...state, facts: addAsset(state.facts, effect.asset) };
  }
}

class AssetRemoveHandler implements EffectHandler {
  execute(effect: EffectDefinition, state: GameState): GameState {
    if (!isAssetId(effect.asset)) {
      throw new Error(`Invalid asset effect value: ${String(effect.asset)}`);
    }
    return { ...state, facts: removeAsset(state.facts, effect.asset) };
  }
}

class AffiliationClearHandler implements EffectHandler {
  execute(_effect: EffectDefinition, state: GameState): GameState {
    return {
      ...state,
      player: {
        ...state.player,
        affiliation: null,
      },
    };
  }
}

export class HealthStatusSetHandler implements EffectHandler {
  async execute(effect: EffectDefinition, state: GameState): Promise<GameState> {
    if (!isHealthStatus(effect.value)) {
      console.warn('[HealthStatusSetHandler] invalid health status, skipping:', effect.value);
      return state;
    }
    return {
      ...state,
      player: {
        ...state.player,
        healthStatus: effect.value as HealthStatus,
      },
    };
  }
}

export class WealthCapacitySetHandler implements EffectHandler {
  execute(effect: EffectDefinition, state: GameState): GameState {
    if (!isWealthCapacity(effect.value)) {
      throw new Error(`Invalid wealth capacity effect value: ${String(effect.value)}`);
    }

    return {
      ...state,
      player: {
        ...state.player,
        wealthCapacity: effect.value,
      },
    };
  }
}

export class StatusAddHandler implements EffectHandler {
  async execute(effect: EffectDefinition, state: GameState): Promise<GameState> {
    if (!isStatusId(effect.status)) {
      console.warn('[StatusAddHandler] invalid status, skipping:', effect.status);
      return state;
    }
    const statuses = state.player.statuses.includes(effect.status)
      ? [...state.player.statuses]
      : [...state.player.statuses, effect.status];
    return {
      ...state,
      player: {
        ...state.player,
        statuses,
      },
    };
  }
}

export class StatusRemoveHandler implements EffectHandler {
  async execute(effect: EffectDefinition, state: GameState): Promise<GameState> {
    if (!isStatusId(effect.status)) {
      console.warn('[StatusRemoveHandler] invalid status, skipping:', effect.status);
      return state;
    }
    return {
      ...state,
      player: {
        ...state.player,
        statuses: state.player.statuses.filter(status => status !== (effect.status as StatusId)),
      },
    };
  }
}

/**
 * Flag 移除处理器
 */
export class FlagUnsetHandler implements EffectHandler {
  async execute(effect: EffectDefinition, state: GameState): Promise<GameState> {
    const flagName = effect.flag || effect.target;
    if (!flagName) {
      return state;
    }

    const newFlags = {
      ...(state.flags || {}),
      ...(state.player?.flags || {}),
    };
    delete newFlags[flagName];

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
    const good = effect.good || 0;
    const evil = effect.evil || 0;
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
 * 特殊效果处理器（处理 end_game、end_life 等特殊效果）
 */
export class SpecialEffectHandler implements EffectHandler {
  async execute(effect: EffectDefinition, state: GameState): Promise<GameState> {
    const { target } = effect;
    
    if (target === 'set_spouse') {
      const spouseName = typeof effect.value === 'string' ? effect.value : null;
      if (!state.player || !spouseName) {
        return state;
      }
      return {
        ...state,
        player: {
          ...state.player,
          spouse: spouseName,
        },
      };
    }

    if (target === 'end_life') {
      if (typeof effect.value !== 'string' || effect.value.trim().length === 0) {
        throw new Error('end_life requires a non-empty death reason');
      }
      return {
        ...state,
        player: {
          ...state.player,
          alive: false,
          deathReason: effect.value,
        },
        flags: {
          ...state.flags,
          gameEnded: true,
        },
      };
    }

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
          description: buildEndingPresentationDescription(state, ending),
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
