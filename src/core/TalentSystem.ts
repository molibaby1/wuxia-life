/**
 * 天赋系统工具类
 * 
 * 负责：
 * - 加载天赋定义
 * - 计算天赋效果
 * - 属性成长计算
 */

import type { TalentDefinition } from '../types/eventTypes';

export class TalentSystem {
  private static instance: TalentSystem;
  private talents: Map<string, TalentDefinition> = new Map();

  private constructor() {}

  /**
   * 获取单例实例
   */
  public static getInstance(): TalentSystem {
    if (!TalentSystem.instance) {
      TalentSystem.instance = new TalentSystem();
    }
    return TalentSystem.instance;
  }

  /**
   * 加载天赋定义
   */
  public async loadTalents(): Promise<void> {
    try {
      const talentData = await import('../data/lines/talents.json');
      talentData.default.forEach((talent: TalentDefinition) => {
        this.talents.set(talent.id, talent);
      });
    } catch (error) {
      console.error('[TalentSystem] 加载天赋失败:', error);
    }
  }

  /**
   * 获取天赋定义
   */
  public getTalent(talentId: string): TalentDefinition | undefined {
    return this.talents.get(talentId);
  }

  /**
   * 获取所有天赋
   */
  public getAllTalents(): TalentDefinition[] {
    return Array.from(this.talents.values());
  }

  /**
   * 根据稀有度筛选天赋
   */
  public getTalentsByRarity(rarity: string): TalentDefinition[] {
    return Array.from(this.talents.values()).filter(t => t.rarity === rarity);
  }

  /**
   * 随机选择一个天赋（按权重）
   */
  public randomTalent(): TalentDefinition {
    const talents = this.getAllTalents();
    const weights = {
      'common': 50,      // 普通天赋权重 50
      'uncommon': 30,    // 优秀天赋权重 30
      'rare': 15,        // 稀有天赋权重 15
      'legendary': 5     // 传说天赋权重 5
    };

    const totalWeight = talents.reduce((sum, talent) => {
      return sum + (weights[talent.rarity] || 10);
    }, 0);

    let random = Math.random() * totalWeight;

    for (const talent of talents) {
      random -= weights[talent.rarity] || 10;
      if (random <= 0) {
        return talent;
      }
    }

    return talents[Math.floor(Math.random() * talents.length)];
  }

  /**
   * 计算属性成长加成
   * @param statName 属性名
   * @param talents 玩家拥有的天赋列表
   * @returns 成长加成系数（1.0 为基础）
   */
  public calculateGrowthBonus(statName: string, talentIds: string[]): number {
    let multiplier = 1.0;

    talentIds.forEach(talentId => {
      const talent = this.getTalent(talentId);
      if (!talent) return;

      // 加成
      if (talent.growthBonus && talent.growthBonus[statName]) {
        multiplier += talent.growthBonus[statName];
      }

      // 惩罚
      if (talent.penalties && talent.penalties[statName]) {
        multiplier += talent.penalties[statName];
      }
    });

    return multiplier;
  }

  /**
   * 计算属性上限
   * @param statName 属性名
   * @param talents 玩家拥有的天赋列表
   * @returns 属性上限
   */
  public calculateStatCap(statName: string, talentIds: string[]): number {
    let cap = 100; // 基础上限

    talentIds.forEach(talentId => {
      const talent = this.getTalent(talentId);
      if (!talent) return;

      if (talent.statCapBonus && talent.statCapBonus[statName]) {
        cap += talent.statCapBonus[statName];
      }
    });

    return cap;
  }

  /**
   * 计算初始属性加成
   * @param statName 属性名
   * @param talents 玩家拥有的天赋列表
   * @returns 初始属性加成值
   */
  public calculateInitialBonus(statName: string, talentIds: string[]): number {
    let bonus = 0;

    talentIds.forEach(talentId => {
      const talent = this.getTalent(talentId);
      if (!talent) return;

      if (talent.initialBonus && talent.initialBonus[statName]) {
        bonus += talent.initialBonus[statName];
      }
    });

    return bonus;
  }

  /**
   * 应用天赋到玩家属性
   * @param playerStats 玩家属性
   * @param talents 玩家拥有的天赋列表
   */
  public applyTalentsToPlayer(playerStats: any, talentIds: string[]): void {
    // 应用初始加成
    const stats = ['martialPower', 'externalSkill', 'internalSkill', 
                   'qinggong', 'constitution', 'charisma', 
                   'comprehension', 'knowledge', 'connections'];
    
    stats.forEach(statName => {
      const bonus = this.calculateInitialBonus(statName, talentIds);
      if (bonus > 0) {
        playerStats[statName] = (playerStats[statName] || 0) + bonus;
      }
    });
  }

  /**
   * 获取天赋描述文本
   */
  public getTalentDescription(talentId: string): string {
    const talent = this.getTalent(talentId);
    if (!talent) return '未知天赋';

    return `${talent.name} (${this.getRarityName(talent.rarity)}): ${talent.description}`;
  }

  /**
   * 获取稀有度名称
   */
  private getRarityName(rarity: string): string {
    const names: { [key: string]: string } = {
      'common': '普通',
      'uncommon': '优秀',
      'rare': '稀有',
      'legendary': '传说'
    };
    return names[rarity] || rarity;
  }
}

// 导出单例
export const talentSystem = TalentSystem.getInstance();
