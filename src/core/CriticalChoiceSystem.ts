/**
 * 关键选择系统
 * 
 * 记录玩家的关键人生选择，这些选择会影响：
 * - 后续事件链的触发
 * - 身份判定
 * - 结局走向
 * 
 * @version 1.0.0
 * @since 2026-03-15
 */

import type { CriticalChoices, GameState } from '../types/eventTypes';

export class CriticalChoiceSystem {
  /**
   * 关键选择点定义
   */
  private static readonly CHOICE_POINTS = {
    // 1. 门派选择（13-15 岁）
    sect_choice: {
      id: 'sect_choice',
      name: '门派抉择',
      ageRange: { min: 13, max: 15 },
      options: {
        orthodox: '名门正派',
        demon: '邪魔外道',
        none: '不入门派',
      },
    },
    
    // 2. 人生目标（20 岁）
    life_goal: {
      id: 'life_goal',
      name: '人生目标',
      ageRange: { min: 20, max: 25 },
      options: {
        hero: '行侠仗义',
        merchant: '经商致富',
        scholar: '钻研武学',
        hermit: '归隐田园',
      },
    },
    
    // 3. 婚姻选择（20-30 岁）
    marriage_choice: {
      id: 'marriage_choice',
      name: '婚姻抉择',
      ageRange: { min: 20, max: 30 },
      options: {
        arranged: '门当户对',
        love: '自由恋爱',
        single: '终身不娶',
      },
    },
    
    // 4. 中年抉择（40 岁）
    midlife_choice: {
      id: 'midlife_choice',
      name: '中年抉择',
      ageRange: { min: 40, max: 45 },
      options: {
        sect_leader: '开宗立派',
        hermit: '归隐田园',
        wanderer: '继续闯荡',
      },
    },
    
    // 5. 正邪大战（45-50 岁）
    war_choice: {
      id: 'war_choice',
      name: '正邪大战',
      ageRange: { min: 45, max: 50 },
      options: {
        hero: '挺身而出',
        neutral: '明哲保身',
        villain: '助纣为虐',
      },
    },
  };

  /**
   * 初始化关键选择系统
   */
  static create(): CriticalChoices {
    return {};
  }

  /**
   * 记录关键选择
   * @param state 游戏状态
   * @param choiceId 选择 ID
   * @param option 选择的选项
   * @param gameState 当前游戏状态
   */
  static recordChoice(
    state: GameState,
    choiceId: string,
    option: string,
    gameState?: any
  ): GameState {
    if (!state.criticalChoices) {
      state.criticalChoices = this.create();
    }

    const choices = state.criticalChoices;
    
    // 验证选择 ID 是否有效
    if (!this.CHOICE_POINTS[choiceId as keyof typeof this.CHOICE_POINTS]) {
      console.warn(`无效的选择 ID: ${choiceId}`);
      return state;
    }

    // 记录选择
    (choices as any)[choiceId] = option;


    // 触发选择后果（可选）
    if (gameState) {
      this.applyChoiceConsequences(state, choiceId, option);
    }

    return state;
  }

  /**
   * 应用选择后果
   * 根据选择立即或延迟影响游戏状态
   */
  private static applyChoiceConsequences(
    state: GameState,
    choiceId: string,
    option: string
  ): void {
    const { player } = state;

    switch (choiceId) {
      case 'sect_choice':
        // 门派选择影响
        if (option === 'orthodox') {
          player.chivalry += 10;
          player.reputation += 5;
        } else if (option === 'demon') {
          player.chivalry -= 10;
          player.martialPower += 5;
        }
        break;

      case 'life_goal':
        // 人生目标影响
        if (option === 'hero') {
          player.chivalry += 5;
        } else if (option === 'merchant') {
          player.money += 500;
        } else if (option === 'scholar') {
          player.comprehension += 5;
        }
        break;

      case 'marriage_choice':
        // 婚姻选择影响
        if (option === 'arranged') {
          player.connections += 20;
          player.money += 200;
        } else if (option === 'love') {
          player.charisma += 5;
          player.chivalry += 5;
        }
        break;

      case 'midlife_choice':
        // 中年抉择影响
        if (option === 'sect_leader') {
          player.reputation += 20;
          player.flags['establish_sect'] = true;
        } else if (option === 'hermit') {
          player.flags['retired'] = true;
          player.internalSkill += 10;
        }
        break;

      case 'war_choice':
        // 正邪大战影响
        if (option === 'hero') {
          player.chivalry += 20;
          player.reputation += 30;
        } else if (option === 'villain') {
          player.chivalry -= 30;
          player.martialPower += 15;
        }
        break;
    }
  }

  /**
   * 检查是否已做出某个选择
   */
  static hasMadeChoice(state: GameState, choiceId: string): boolean {
    if (!state.criticalChoices) return false;
    return (state.criticalChoices as any)[choiceId] !== undefined;
  }

  /**
   * 获取某个选择的结果
   */
  static getChoice(state: GameState, choiceId: string): string | undefined {
    if (!state.criticalChoices) return undefined;
    return (state.criticalChoices as any)[choiceId];
  }

  /**
   * 检查是否满足选择条件
   * 用于事件触发时检查前置选择
   */
  static checkChoiceRequirement(
    state: GameState,
    requirements: {
      required?: string[];    // 必需的选择 ['sect_choice:orthodox']
      forbidden?: string[];   // 禁止的选择 ['war_choice:villain']
    }
  ): boolean {
    if (!state.criticalChoices) {
      return !requirements.required || requirements.required.length === 0;
    }

    // 检查必需的选择
    if (requirements.required) {
      for (const req of requirements.required) {
        const [choiceId, option] = req.split(':');
        const actualChoice = this.getChoice(state, choiceId);
        
        if (actualChoice !== option) {
          return false;
        }
      }
    }

    // 检查禁止的选择
    if (requirements.forbidden) {
      for (const forbidden of requirements.forbidden) {
        const [choiceId, option] = forbidden.split(':');
        const actualChoice = this.getChoice(state, choiceId);
        
        if (actualChoice === option) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * 获取所有已做出的选择
   */
  static getAllChoices(state: GameState): CriticalChoices {
    return state.criticalChoices || this.create();
  }

  /**
   * 获取选择点的定义
   */
  static getChoicePoint(choiceId: string): any {
    return this.CHOICE_POINTS[choiceId as keyof typeof this.CHOICE_POINTS];
  }

  /**
   * 检查是否到达某个选择点的年龄范围
   */
  static isAtChoicePoint(state: GameState, choiceId: string): boolean {
    const choicePoint = this.getChoicePoint(choiceId);
    if (!choicePoint) return false;

    const age = state.player.age;
    const { min, max } = choicePoint.ageRange;

    return age >= min && age <= max;
  }

  /**
   * 获取所有可用的选择点
   */
  static getAvailableChoicePoints(state: GameState): string[] {
    const available: string[] = [];
    const age = state.player.age;

    for (const [id, point] of Object.entries(this.CHOICE_POINTS)) {
      const { min, max } = point.ageRange;
      if (age >= min && age <= max && !this.hasMadeChoice(state, id)) {
        available.push(id);
      }
    }

    return available;
  }

  /**
   * 序列化选择数据（用于存档）
   */
  static serialize(state: GameState): any {
    if (!state.criticalChoices) return null;
    return { ...state.criticalChoices };
  }

  /**
   * 反序列化选择数据（用于读档）
   */
  static deserialize(data: any): CriticalChoices {
    if (!data) return this.create();
    return { ...data };
  }
}
