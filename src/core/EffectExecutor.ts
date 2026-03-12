/**
 * 效果执行器
 * 
 * 统一执行声明式效果，确保所有事件使用相同的逻辑处理流程
 */

import type { EffectDefinition, EffectResult, PlayerState, PlayerStateUpdates } from '../types';
import { advanceTime } from '../utils/timeSystem';

export class EffectExecutor {
  /**
   * 执行单个效果
   */
  executeEffect(effect: EffectDefinition, state: PlayerState): EffectResult {
    const result: EffectResult = {
      updates: {},
    };

    switch (effect.type) {
      case 'TIME_ADVANCE': {
        // 统一的时间推进逻辑
        const timeUpdates = advanceTime(state, effect.value, effect.unit);
        result.updates = { ...timeUpdates };
        result.timeSpan = {
          value: effect.value,
          unit: effect.unit,
        };
        break;
      }

      case 'STAT_MODIFY': {
        // 属性修改（相对值）
        const currentValue = this.getStatValue(state, effect.stat);
        const newValue = this.applyOperator(currentValue, effect.value, effect.operator);
        result.updates[effect.stat] = newValue;
        break;
      }

      case 'STAT_SET': {
        // 属性设置（绝对值）
        result.updates[effect.stat] = effect.value;
        break;
      }

      case 'FLAG_SET': {
        // 标志设置
        if (!result.updates.flags) {
          result.updates.flags = new Set();
        }
        result.updates.flags.add(effect.flag);
        break;
      }

      case 'FLAG_CLEAR': {
        // 标志清除（由 store 处理）
        if (!result.updates.flags) {
          result.updates.flags = new Set();
        }
        // 添加特殊标记，store 会清除这个标志
        result.updates.flags.add(`__CLEAR__${effect.flag}`);
        break;
      }

      case 'EVENT_RECORD': {
        // 事件记录
        if (!result.updates.events) {
          result.updates.events = new Set();
        }
        result.updates.events.add(effect.event);
        break;
      }

      case 'MONEY_MODIFY': {
        // 金钱修改
        const currentMoney = state.money || 0;
        const newMoney = effect.operator === 'add'
          ? currentMoney + effect.value
          : Math.max(0, currentMoney - effect.value);
        result.updates.money = newMoney;
        break;
      }

      case 'ENDING_SET': {
        // 结局设置
        result.ending = {
          reason: effect.reason,
          epitaph: effect.epitaph,
        };
        result.updates.alive = false;
        result.updates.deathReason = effect.reason;
        break;
      }

      default:
        console.warn(`[EffectExecutor] 未知效果类型：${effect}`);
    }

    return result;
  }

  /**
   * 执行效果数组
   */
  executeEffects(effects: EffectDefinition[], state: PlayerState): EffectResult {
    const finalResult: EffectResult = {
      updates: {},
    };

    for (const effect of effects) {
      const result = this.executeEffect(effect, state);
      
      // 合并更新
      finalResult.updates = {
        ...finalResult.updates,
        ...result.updates,
      };

      // 合并时间跨度（取最后一个）
      if (result.timeSpan) {
        finalResult.timeSpan = result.timeSpan;
      }

      // 合并结局（取第一个）
      if (result.ending && !finalResult.ending) {
        finalResult.ending = result.ending;
      }

      // 更新状态用于下一个效果
      Object.assign(state, result.updates);
    }

    return finalResult;
  }

  /**
   * 获取属性值
   */
  private getStatValue(state: PlayerState, stat: string): number {
    const value = state[stat as keyof PlayerState];
    return typeof value === 'number' ? value : 0;
  }

  /**
   * 应用操作符
   */
  private applyOperator(current: number, value: number, operator: string): number {
    switch (operator) {
      case 'add':
        return current + value;
      case 'subtract':
        return current - value;
      case 'multiply':
        return current * value;
      case 'divide':
        return value !== 0 ? Math.floor(current / value) : current;
      default:
        return current;
    }
  }
}

/**
 * 全局效果执行器实例
 */
export const effectExecutor = new EffectExecutor();
