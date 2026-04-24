/**
 * 身份系统
 * 
 * 根据玩家的行为、属性、选择自动判定身份，
 * 不同身份触发不同的事件链和结局。
 * 
 * @version 1.0.0
 * @since 2026-03-15
 */

import type { PlayerIdentity, IdentityCriteria, IdentityEffects, GameState } from '../types/eventTypes';

export class IdentitySystem {
  /**
   * 身份判定标准
   * 按优先级排序，优先级高的先判定
   */
  private static readonly IDENTITY_CRITERIA: IdentityCriteria[] = [
    {
      identity: 'outlaw',
      requirements: {
        chivalry: -80,  // 侠义极低（但这不代表邪恶，只是选择了非传统路线）
      },
      priority: 100,  // 最高优先级
    },
    {
      identity: 'hero',
      requirements: {
        chivalry: 80,
        reputation: 50,
      },
      priority: 90,
    },
    {
      identity: 'sect_leader',
      requirements: {
        reputation: 60,
        martialPower: 70,
        flags: ['establish_sect'],
      },
      priority: 85,
    },
    {
      identity: 'merchant',
      requirements: {
        money: 5000,
        flags: ['business_empire'],
      },
      priority: 80,
    },
    {
      identity: 'scholar',
      requirements: {
        comprehension: 80,
        flags: ['write_famous_book'],
      },
      priority: 75,
    },
    {
      identity: 'assassin',
      requirements: {
        martialPower: 60,
        chivalry: -30,
        flags: ['assassination_success'],
      },
      priority: 70,
    },
    {
      identity: 'doctor',
      requirements: {
        chivalry: 50,
        flags: ['heal_many_people'],
      },
      priority: 65,
    },
    {
      identity: 'official',
      requirements: {
        reputation: 50,
        comprehension: 60,
        flags: ['become_official'],
      },
      priority: 60,
    },
    {
      identity: 'beggar',
      requirements: {
        flags: ['join_beggar Sect'],
      },
      priority: 55,
    },
    {
      identity: 'hermit',
      requirements: {
        flags: ['retired'],
      },
      priority: 50,
    },
  ];

  /**
   * 身份效果配置
   */
  private static readonly IDENTITY_EFFECTS: Record<PlayerIdentity, IdentityEffects> = {
    hero: {
      identity: 'hero',
      events: ['hero_save_people', 'hero_fight_evil', 'hero_become_legend'],
      endings: ['heroic_sacrifice', 'legendary_hero'],
      bonuses: {
        chivalry: 1.5,  // 侠义成长 +50%
        reputation: 1.3,
      },
    },
    merchant: {
      identity: 'merchant',
      events: ['merchant_trade', 'merchant_invest', 'merchant_empire'],
      endings: ['richest_man', 'business_tycoon'],
      bonuses: {
        money: 1.5,  // 财富成长 +50%
        connections: 1.3,
      },
    },
    scholar: {
      identity: 'scholar',
      events: ['scholar_research', 'scholar_write', 'scholar_teach'],
      endings: ['great_scholar', 'wise_sage'],
      bonuses: {
        comprehension: 1.5,
        knowledge: 1.3,
      },
    },
    hermit: {
      identity: 'hermit',
      events: ['hermit_meditate', 'hermit_seek_dao', 'hermit_transcend'],
      endings: ['heavenly_immortal', 'peaceful_hermit'],
      bonuses: {
        internalSkill: 1.3,
        constitution: 1.2,
      },
    },
    sect_leader: {
      identity: 'sect_leader',
      events: ['sect_recruit', 'sect_expand', 'sect_war'],
      endings: ['sect_founder', 'legendary_leader'],
      bonuses: {
        martialPower: 1.3,
        reputation: 1.5,
      },
    },
    assassin: {
      identity: 'assassin',
      events: ['assassin_mission', 'assassin_training', 'assassin_betrayal'],
      endings: ['shadow_master', 'tragic_assassin'],
      bonuses: {
        martialPower: 1.4,
        qinggong: 1.3,
      },
    },
    doctor: {
      identity: 'doctor',
      events: ['doctor_heal', 'doctor_research_medicine', 'doctor_save_life'],
      endings: ['divine_doctor', 'benevolent_healer'],
      bonuses: {
        comprehension: 1.3,
        chivalry: 1.2,
      },
    },
    beggar: {
      identity: 'beggar',
      events: ['beggar_street', 'beggar Sect_quest', 'beggar_rise'],
      endings: ['beggar_king', 'street_legend'],
      bonuses: {
        connections: 1.5,
        externalSkill: 1.2,
      },
    },
    official: {
      identity: 'official',
      events: ['official_court', 'official_politics', 'official_promotion'],
      endings: ['great_minister', 'corrupt_official'],
      bonuses: {
        reputation: 1.5,
        money: 1.3,
      },
    },
    outlaw: {
      identity: 'outlaw',
      events: ['outlaw_cultivate', 'outlaw_revenge', 'outlaw_dominate'],
      endings: ['outlaw_king', 'reformed_outlaw'],
      bonuses: {
        martialPower: 1.5,
        reputation: -0.8,  // 江湖声望较低（因为不受主流认可）
      },
    },
  };

  /**
   * 判定玩家身份
   * 根据玩家状态和成就自动判定最匹配的身份
   */
  static determineIdentity(state: GameState): PlayerIdentity | undefined {
    const { player, karma, criticalChoices, achievements } = state;
    
    // 构建判定数据
    const playerData = {
      chivalry: player.chivalry,
      money: player.money,
      comprehension: player.comprehension,
      reputation: player.reputation,
      martialPower: player.martialPower,
      good_karma: karma?.good_karma || 0,
      evil_karma: karma?.evil_karma || 0,
      flags: Object.keys(player.flags || {}).filter(f => player.flags?.[f]),
      achievements: achievements || [],
      choices: criticalChoices || {},
    };

    // 按优先级排序检查
    const sortedCriteria = [...this.IDENTITY_CRITERIA].sort((a, b) => b.priority - a.priority);
    
    for (const criteria of sortedCriteria) {
      if (this.meetsRequirements(playerData, criteria.requirements)) {
        return criteria.identity;
      }
    }
    
    return undefined;  // 无特殊身份
  }

  /**
   * 检查是否满足身份要求
   */
  private static meetsRequirements(
    data: any,
    requirements: IdentityCriteria['requirements']
  ): boolean {
    // 检查属性要求
    if (requirements.chivalry !== undefined) {
      // 侠义要求：如果要求是负数，表示必须低于该值；如果要求是正数，表示必须高于该值
      if (requirements.chivalry < 0) {
        // 要求侠义低于某值（如魔教）
        if (data.chivalry > requirements.chivalry) {
          return false;
        }
      } else {
        // 要求侠义高于某值（如大侠）
        if (data.chivalry < requirements.chivalry) {
          return false;
        }
      }
    }
    
    if (requirements.money !== undefined && data.money < requirements.money) {
      return false;
    }
    if (requirements.comprehension !== undefined && data.comprehension < requirements.comprehension) {
      return false;
    }
    if (requirements.reputation !== undefined && data.reputation < requirements.reputation) {
      return false;
    }
    if (requirements.martialPower !== undefined && data.martialPower < requirements.martialPower) {
      return false;
    }
    if (requirements.good_karma !== undefined && data.good_karma < requirements.good_karma) {
      return false;
    }
    if (requirements.evil_karma !== undefined && data.evil_karma < requirements.evil_karma) {
      return false;
    }

    // 检查 Flag 要求
    if (requirements.flags) {
      for (const flag of requirements.flags) {
        if (!data.flags.includes(flag)) {
          return false;
        }
      }
    }

    // 检查成就要求
    if (requirements.achievements) {
      for (const achievement of requirements.achievements) {
        if (!data.achievements.includes(achievement)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * 获取身份效果
   */
  static getIdentityEffects(identity: PlayerIdentity): IdentityEffects {
    return this.IDENTITY_EFFECTS[identity];
  }

  /**
   * 应用身份加成
   * 根据身份调整属性成长倍率
   */
  static applyIdentityBonus(
    state: GameState,
    statName: string,
    baseValue: number
  ): number {
    if (!state.identity) return baseValue;
    
    const effects = this.getIdentityEffects(state.identity);
    const bonus = effects.bonuses[statName];
    
    if (bonus) {
      return Math.floor(baseValue * bonus);
    }
    
    return baseValue;
  }

  /**
   * 检查身份专属事件
   */
  static canTriggerIdentityEvent(state: GameState, eventId: string): boolean {
    if (!state.identity) return true;  // 无身份限制
    
    const effects = this.getIdentityEffects(state.identity);
    return effects.events.includes(eventId);
  }

  /**
   * 检查身份专属结局
   */
  static canUnlockIdentityEnding(state: GameState, endingId: string): boolean {
    if (!state.identity) return false;
    
    const effects = this.getIdentityEffects(state.identity);
    return effects.endings.includes(endingId);
  }
}
