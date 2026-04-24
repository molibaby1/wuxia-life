/**
 * 因果系统
 * 
 * 记录玩家的善恶行为，善有善报，恶有恶报。
 * 因果值影响事件触发和结局。
 * 
 * @version 1.0.0
 * @since 2026-03-15
 */

import type { KarmaSystem as KarmaSystemType, KarmaChange, GameState } from '../types/eventTypes';

export class KarmaManager {
  /**
   * 创建初始因果系统
   */
  static create(): KarmaSystemType {
    return {
      good_karma: 0,
      evil_karma: 0,
      history: [],
    };
  }

  /**
   * 添加因果变化
   * @param state 游戏状态
   * @param amount 变化量（正为善，负为恶）
   * @param reason 变化原因
   * @param timestamp 时间戳
   */
  static addKarma(
    state: GameState,
    amount: number,
    reason: string,
    timestamp: number
  ): GameState {
    // 创建新的状态对象
    const newState = { ...state };
    
    if (!newState.karma) {
      newState.karma = this.create();
    }

    const karma = newState.karma;
    const change: KarmaChange = {
      amount: Math.abs(amount),
      reason,
      timestamp,
    };

    if (amount > 0) {
      // 善行
      karma.good_karma += amount;
    } else {
      // 恶行
      karma.evil_karma += Math.abs(amount);
    }

    karma.history.push(change);

    // 限制历史记录长度
    if (karma.history.length > 100) {
      karma.history = karma.history.slice(-100);
    }

    return newState;
  }

  /**
   * 获取因果净值
   * 正值为善，负值为恶
   */
  static getNetKarma(state: GameState): number {
    if (!state.karma) return 0;
    return state.karma.good_karma - state.karma.evil_karma;
  }

  /**
   * 获取因果等级
   */
  static getKarmaLevel(state: GameState): string {
    const netKarma = this.getNetKarma(state);
    
    if (netKarma >= 200) return 'saint';      // 圣人
    if (netKarma >= 100) return 'virtuous';   // 贤德
    if (netKarma >= 50) return 'good';        // 善良
    if (netKarma >= -50) return 'neutral';    // 中立
    if (netKarma >= -100) return 'morally_grey'; // 灰色地带
    if (netKarma >= -200) return 'controversial'; // 争议人物
    return 'legendary';                        // 传奇人物（正负评价都极高）
  }

  /**
   * 检查是否可以触发因果事件
   */
  static canTriggerKarmaEvent(
    state: GameState,
    karmaType: 'good' | 'evil' | 'any',
    threshold: number
  ): boolean {
    if (!state.karma) return false;

    switch (karmaType) {
      case 'good':
        return state.karma.good_karma >= threshold;
      case 'evil':
        return state.karma.evil_karma >= threshold;
      case 'any':
        return Math.abs(this.getNetKarma(state)) >= threshold;
      default:
        return false;
    }
  }

  /**
   * 获取因果报应
   * 根据因果值返回相应的报应事件
   */
  static getKarmaReward(state: GameState): { type: string; amount: number } | null {
    if (!state.karma) return null;

    const netKarma = this.getNetKarma(state);

    // 善有善报
    if (netKarma >= 200) {
      return { type: 'divine_blessing', amount: 50 };  // 天神庇佑
    } else if (netKarma >= 100) {
      return { type: 'lucky_encounter', amount: 30 };  // 幸运邂逅
    } else if (netKarma >= 50) {
      return { type: 'small_fortune', amount: 15 };    // 小幸运
    }

    // 恶有恶报
    if (netKarma <= -200) {
      return { type: 'divine_punishment', amount: -50 };  // 天谴
    } else if (netKarma <= -100) {
      return { type: 'misfortune', amount: -30 };         // 不幸
    } else if (netKarma <= -50) {
      return { type: 'small_misfortune', amount: -15 };   // 小不幸
    }

    return null;
  }

  /**
   * 清除因果（用于转世等特殊事件）
   */
  static clearKarma(state: GameState): GameState {
    state.karma = this.create();
    return state;
  }

  /**
   * 序列化因果数据（用于存档）
   */
  static serialize(state: GameState): any {
    if (!state.karma) return null;
    return {
      good_karma: state.karma.good_karma,
      evil_karma: state.karma.evil_karma,
      history: state.karma.history,
    };
  }

  /**
   * 反序列化因果数据（用于读档）
   */
  static deserialize(data: any): KarmaSystemType {
    if (!data) return this.create();
    return {
      good_karma: data.good_karma || 0,
      evil_karma: data.evil_karma || 0,
      history: data.history || [],
    };
  }
}
