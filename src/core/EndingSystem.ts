/**
 * 多结局系统
 * 
 * 根据玩家的身份、选择、因果、成就等因素，
 * 判定玩家获得的人生结局。
 * 
 * 设计目标：
 * - 至少 10 种截然不同的结局
 * - 结局判定基于玩家一生的行为
 * - 提供结局评价和回顾
 * 
 * @version 1.0.0
 * @since 2026-03-15
 */

import type { GameState, PlayerIdentity } from '../types/eventTypes';

/**
 * 结局类型
 */
export type EndingType =
  // 正面结局
  | 'legendary_hero'       // 传奇英雄 - 侠义 > 80, 声望 > 80
  | 'martial_god'          // 武学之神 - 全武学 > 90
  | 'sect_founder'         // 开宗立派 - 建立门派，弟子 > 100
  | 'richest_man'          // 首富 - 财富 > 10000
  | 'beloved_saint'        // 在世活佛 - 善行 > 100, 救人 > 500
  | 'heavenly_immortal'    // 得道成仙 - 综合 > 90, 因果 > 100
  | 'great_scholar'        // 一代宗师 - 学识 > 90, 著作流传
  
  // 中性结局
  | 'bittersweet_success'  // 有成有憾 - 有所成就，但代价明显
  | 'quiet_family_life'    // 人间烟火 - 回到家庭与平静生活
  | 'unfulfilled_ambition' // 壮志未酬 - 半生奔忙，终究差了口气
  | 'ordinary_life'        // 平凡一生 - 无特殊成就
  | 'hermit_life'          // 隐士生活 - 归隐，与世无争
  | 'wanderer_life'        // 流浪江湖 - 无门无派，逍遥自在
  
  // 负面结局
  | 'tragic_death'         // 悲剧收场 - 恶行 > 100
  | 'lonely_death'         // 孤独终老 - 人际关系 < 0
  | 'eternal_damnation';   // 遗臭万年 - 邪恶 > 80, 被万人唾弃

/**
 * 结局信息
 */
export interface EndingInfo {
  id: EndingType;
  name: string;
  description: string;
  category: 'positive' | 'neutral' | 'negative';
  requirements: {
    identity?: PlayerIdentity[];
    chivalry?: number;
    money?: number;
    comprehension?: number;
    reputation?: number;
    martialPower?: number;
    good_karma?: number;
    evil_karma?: number;
    flags?: string[];
    achievements?: string[];
    age?: number;
    externalSkill?: number;
    internalSkill?: number;
    qinggong?: number;
    connections?: number;
    knowledge?: number;
    businessAcumen?: number;
    influence?: number;
    not_flags?: string[];
  };
  priority: number;  // 优先级，用于冲突时判定
}

export class EndingSystem {
  /**
   * 结局定义
   */
  private static readonly ENDINGS: EndingInfo[] = [
    // ========== 正面结局 ==========
    {
      id: 'legendary_hero',
      name: '传奇英雄',
      description: '你一生行侠仗义，救危济困，成为武林中人人传颂的传奇英雄。你的事迹被编成评书，在茶馆酒肆中广为流传。',
      category: 'positive',
      requirements: {
        chivalry: 80,
        reputation: 85,
        good_karma: 70,
        age: 68,
      },
      priority: 95,
    },
    {
      id: 'martial_god',
      name: '武学之神',
      description: '你穷尽一生钻研武学，外功、内功、轻功皆臻化境，成为武林中公认的武学之神。一招一式皆含天地之威。',
      category: 'positive',
      requirements: {
        martialPower: 95,
        externalSkill: 80,
        internalSkill: 80,
        qinggong: 80,
        age: 68,
      },
      priority: 100,  // 最高优先级
    },
    {
      id: 'sect_founder',
      name: '开宗立派',
      description: '你创立了自己的门派，门徒遍布天下。你的武学理念代代相传，成为武林中的一股重要力量。',
      category: 'positive',
      requirements: {
        reputation: 60,
        martialPower: 70,
        flags: ['establish_sect', 'succession_completed'],
        age: 65,
      },
      priority: 90,
    },
    {
      id: 'richest_man',
      name: '首富',
      description: '你凭借过人的商业头脑，积累了富可敌国的财富。你的商号遍布大江南北，影响武林经济命脉。',
      category: 'positive',
      requirements: {
        money: 1500,
        businessAcumen: 70,
        flags: ['business_empire'],
        age: 60,
      },
      priority: 85,
    },
    {
      id: 'beloved_saint',
      name: '在世活佛',
      description: '你一生救人无数，善行累累，被百姓尊为在世活佛。所到之处，万人空巷，香火供奉不绝。',
      category: 'positive',
      requirements: {
        chivalry: 75,
        good_karma: 110,
        age: 65,
      },
      priority: 88,
    },
    {
      id: 'heavenly_immortal',
      name: '得道成仙',
      description: '你超脱世俗，悟得大道，最终得道成仙。传说你在某日驾鹤西去，留下凡人无尽的敬仰。',
      category: 'positive',
      requirements: {
        martialPower: 90,
        internalSkill: 88,
        comprehension: 88,
        good_karma: 85,
        age: 68,
      },
      priority: 98,
    },
    {
      id: 'great_scholar',
      name: '一代宗师',
      description: '你学识渊博，著书立说，武学理论影响后世数百年。你的著作被奉为经典，代代相传。',
      category: 'positive',
      requirements: {
        comprehension: 82,
        knowledge: 85,
        age: 65,
      },
      priority: 87,
    },
    
    // ========== 中性结局 ==========
    {
      id: 'bittersweet_success',
      name: '有成有憾',
      description: '你这一生并非没有成就，只是所有收获都伴随着代价。有人记得你的名字，也有人记得你错过的人与事。',
      category: 'neutral',
      requirements: {},
      priority: 55,
    },
    {
      id: 'quiet_family_life',
      name: '人间烟火',
      description: '你最终没有把自己活成传说，却把日子过成了能让人安心坐下吃饭的模样。江湖渐远，身边的人反而更真实。',
      category: 'neutral',
      requirements: {},
      priority: 52,
    },
    {
      id: 'unfulfilled_ambition',
      name: '壮志未酬',
      description: '你一生都在往上走，也确实走出了一段路，只是总差那么一步，始终没能真正抵达自己最想去的地方。',
      category: 'neutral',
      requirements: {},
      priority: 51,
    },
    {
      id: 'ordinary_life',
      name: '平凡一生',
      description: '你平平淡淡度过一生，没有惊天动地的壮举，也没有大起大落的波折。这就是普通人的江湖人生。',
      category: 'neutral',
      requirements: {},  // 默认结局
      priority: 10,
    },
    {
      id: 'hermit_life',
      name: '隐士生活',
      description: '你看破红尘，归隐山林，过起了与世无争的生活。春种秋收，夏长冬藏，逍遥自在。',
      category: 'neutral',
      requirements: {
        flags: ['retired'],
      },
      priority: 50,
    },
    {
      id: 'wanderer_life',
      name: '流浪江湖',
      description: '你一生无门无派，流浪江湖，居无定所。虽然孤独，但也自由自在，无拘无束。',
      category: 'neutral',
      requirements: {
        flags: ['join_beggar Sect'],
        not_flags: ['establish_sect'],
      },
      priority: 45,
    },
    
    // ========== 负面结局 ==========
    {
      id: 'tragic_death',
      name: '悲剧收场',
      description: '你一生作恶多端，最终众叛亲离，死于非命。江湖中人谈及你，无不摇头叹息。',
      category: 'negative',
      requirements: {
        evil_karma: 100,
      },
      priority: 80,
    },
    {
      id: 'lonely_death',
      name: '孤独终老',
      description: '你一生孤僻，不善交际，最终孤独终老。临终之时，身边无一人相伴。',
      category: 'negative',
      requirements: {
        connections: -50,
        flags: ['single'],
      },
      priority: 75,
    },
    {
      id: 'eternal_damnation',
      name: '遗臭万年',
      description: '你一生罪恶滔天，死后仍被人唾弃。你的名字成为邪恶的代名词，遗臭万年。',
      category: 'negative',
      requirements: {
        chivalry: -80,
        evil_karma: 200,
      },
      priority: 82,
    },
  ];

  /**
   * 判定玩家结局
   * 根据玩家状态判定最匹配的结局
   */
  static determineEnding(state: GameState): EndingInfo {
    const { player, karma, criticalChoices, achievements } = state;
    
    // 构建判定数据
    const playerData = {
      chivalry: player.chivalry,
      money: player.money,
      comprehension: player.comprehension,
      reputation: player.reputation,
      martialPower: player.martialPower,
      externalSkill: player.externalSkill,
      internalSkill: player.internalSkill,
      qinggong: player.qinggong,
      connections: player.connections,
      knowledge: player.knowledge,
      businessAcumen: player.businessAcumen,
      influence: player.influence,
      good_karma: karma?.good_karma || 0,
      evil_karma: karma?.evil_karma || 0,
      flags: Object.keys(player.flags || {}).filter(f => player.flags?.[f]),
      achievements: achievements || [],
      choices: criticalChoices || {},
      age: player.age,
      spouse: player.spouse,
      children: player.children,
      lifeStates: player.lifeStates || {
        fatigue: 0,
        discipline: 0,
        indulgence: 0,
        familyBond: 0,
        socialMomentum: 0,
        anxiety: 0,
      },
      traitProfile: player.traitProfile,
    };

    const negative = this.ENDINGS
      .filter(ending => ending.category === 'negative')
      .sort((a, b) => b.priority - a.priority);

    for (const ending of negative) {
      if (this.meetsEndingRequirements(playerData, ending.requirements)) {
        return ending;
      }
    }

    const positiveCandidates = this.ENDINGS
      .filter(ending => ending.category === 'positive')
      .sort((a, b) => b.priority - a.priority)
      .filter(ending => this.meetsEndingRequirements(playerData, ending.requirements))
      .filter(ending => this.qualifiesForPositiveEnding(playerData, ending.id));

    if (positiveCandidates.length > 0) {
      return positiveCandidates[0];
    }

    return this.determineNeutralEnding(playerData);
  }

  /**
   * 检查是否满足结局要求
   */
  private static meetsEndingRequirements(
    data: any,
    requirements: EndingInfo['requirements']
  ): boolean {
    // 检查属性要求
    if (requirements.chivalry !== undefined) {
      // 侠义要求：如果要求是负数，表示必须低于该值；如果要求是正数，表示必须高于该值
      if (requirements.chivalry < 0) {
        // 要求侠义低于某值（如遗臭万年）
        if (data.chivalry > requirements.chivalry) {
          return false;
        }
      } else {
        // 要求侠义高于某值（如传奇英雄）
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
    if (requirements.knowledge !== undefined && data.knowledge < requirements.knowledge) {
      return false;
    }
    if (requirements.reputation !== undefined && data.reputation < requirements.reputation) {
      return false;
    }
    if (requirements.martialPower !== undefined && data.martialPower < requirements.martialPower) {
      return false;
    }
    if (requirements.externalSkill !== undefined && data.externalSkill < requirements.externalSkill) {
      return false;
    }
    if (requirements.internalSkill !== undefined && data.internalSkill < requirements.internalSkill) {
      return false;
    }
    if (requirements.qinggong !== undefined && data.qinggong < requirements.qinggong) {
      return false;
    }
    if (requirements.connections !== undefined && data.connections < requirements.connections) {
      return false;
    }
    if (requirements.businessAcumen !== undefined && data.businessAcumen < requirements.businessAcumen) {
      return false;
    }
    if (requirements.influence !== undefined && data.influence < requirements.influence) {
      return false;
    }
    if (requirements.good_karma !== undefined && data.good_karma < requirements.good_karma) {
      return false;
    }
    if (requirements.evil_karma !== undefined && data.evil_karma < requirements.evil_karma) {
      return false;
    }
    if (requirements.age !== undefined && data.age < requirements.age) {
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

    // 检查 not_flags 要求
    if ((requirements as any).not_flags) {
      for (const flag of (requirements as any).not_flags) {
        if (data.flags.includes(flag)) {
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
   * 获取所有结局
   */
  static getAllEndings(): EndingInfo[] {
    return [...this.ENDINGS];
  }

  /**
   * 获取结局 by ID
   */
  static getEndingById(id: string): EndingInfo | undefined {
    return this.ENDINGS.find(e => e.id === id);
  }

  /**
   * 获取结局分类
   */
  static getEndingCategory(ending: EndingInfo): string {
    switch (ending.category) {
      case 'positive':
        return '正面结局';
      case 'neutral':
        return '中性结局';
      case 'negative':
        return '负面结局';
      default:
        return '未知';
    }
  }

  /**
   * 生成结局评价
   */
  static generateEndingReview(state: GameState, ending: EndingInfo): string {
    const { player, karma } = state;
    
    let review = `【${ending.name}】\n\n`;
    review += `${ending.description}\n\n`;
    
    // 人生总结
    review += '=== 人生总结 ===\n';
    review += `寿命：${player.age} 岁\n`;
    review += `侠义值：${player.chivalry}\n`;
    review += `声望：${player.reputation}\n`;
    review += `财富：${player.money}\n`;
    review += `武力：${player.martialPower}\n`;
    review += `学识：${player.comprehension}\n`;
    
    if (karma) {
      review += `善行：${karma.good_karma}\n`;
      review += `恶行：${karma.evil_karma}\n`;
    }
    
    // 成就列表
    if (state.achievements && state.achievements.length > 0) {
      review += `\n=== 达成成就 ===\n`;
      state.achievements.forEach(achievement => {
        review += `• ${achievement}\n`;
      });
    }
    
    // 关键选择
    if (state.criticalChoices) {
      review += `\n=== 人生抉择 ===\n`;
      Object.entries(state.criticalChoices).forEach(([key, value]) => {
        review += `• ${key}: ${value}\n`;
      });
    }
    
    return review;
  }

  static getEndingSummary(state: GameState, ending: EndingInfo): string {
    const lifeStates = state.player.lifeStates || {
      fatigue: 0,
      discipline: 0,
      indulgence: 0,
      familyBond: 0,
      socialMomentum: 0,
      anxiety: 0,
    };

    if (ending.category === 'positive') {
      if (lifeStates.anxiety >= 3 || lifeStates.fatigue >= 3) {
        return '虽有高成就，但一路代价不小。';
      }
      return '高门槛成就成立，人生主轴清晰且完成度高。';
    }

    if (ending.id === 'bittersweet_success') {
      return '有明显成就，但状态、关系或代价阻止了它成为完美结局。';
    }
    if (ending.id === 'quiet_family_life') {
      return '最终重心落在身边人和安稳生活，而不是江湖传说。';
    }
    if (ending.id === 'unfulfilled_ambition') {
      return '一生持续向上，但始终差一步，留下了明显遗憾。';
    }
    if (ending.id === 'hermit_life') {
      return '你主动从纷扰中退身，把后半生过成了离江湖更远的样子。';
    }
    if (ending.id === 'wanderer_life') {
      return '没有扎下根，也没有真正停下脚步，人生最后仍带着漂泊感。';
    }
    if (ending.id === 'ordinary_life') {
      return '没有走成传说，也没有跌入深渊，一生的重量更多落在平凡日常里。';
    }
    if (ending.category === 'negative') {
      return '长期的恶果、孤立或失控状态压过了成就。';
    }
    return '没有达到传奇门槛，人生以更普通但也更真实的方式收束。';
  }

  static getForcedLateLifeEnding(state: GameState): EndingInfo | null {
    if (!state.player || state.player.age < 70) {
      return null;
    }
    return this.determineEnding(state);
  }

  /**
   * 检查是否可以解锁某个结局
   */
  static canUnlockEnding(state: GameState, endingId: string): boolean {
    const ending = this.getEndingById(endingId);
    if (!ending) return false;
    
    const { player, karma, achievements } = state;
    
    const playerData = {
      chivalry: player.chivalry,
      money: player.money,
      comprehension: player.comprehension,
      reputation: player.reputation,
      martialPower: player.martialPower,
      externalSkill: player.externalSkill,
      internalSkill: player.internalSkill,
      qinggong: player.qinggong,
      connections: player.connections,
      good_karma: karma?.good_karma || 0,
      evil_karma: karma?.evil_karma || 0,
      flags: Object.keys(player.flags || {}).filter(f => player.flags?.[f]),
      achievements: achievements || [],
      age: player.age,
    };
    
    return this.meetsEndingRequirements(playerData, ending.requirements);
  }

  /**
   * 获取所有可解锁的结局
   */
  static getUnlockableEndings(state: GameState): EndingInfo[] {
    return this.ENDINGS.filter(ending => 
      this.canUnlockEnding(state, ending.id)
    );
  }

  private static qualifiesForPositiveEnding(data: any, endingId: EndingType): boolean {
    const { lifeStates } = data;
    const fatigue = lifeStates?.fatigue || 0;
    const anxiety = lifeStates?.anxiety || 0;
    const discipline = lifeStates?.discipline || 0;
    const familyBond = lifeStates?.familyBond || 0;

    switch (endingId) {
      case 'legendary_hero':
        return anxiety <= 2 && data.chivalry >= 80 && data.reputation >= 85 && data.good_karma >= 70;
      case 'martial_god':
        return fatigue <= 2 && anxiety <= 2 && data.martialPower >= 95;
      case 'sect_founder':
        return anxiety <= 3 && data.reputation >= 80 && data.influence >= 35;
      case 'richest_man':
        return anxiety <= 2 && familyBond <= 2;
      case 'beloved_saint':
        return anxiety <= 3 && data.good_karma >= 110;
      case 'heavenly_immortal':
        return fatigue <= 2 && anxiety <= 2 && discipline >= 2;
      case 'great_scholar':
        return fatigue <= 3 && discipline >= 1 && data.knowledge >= 85;
      default:
        return true;
    }
  }

  private static determineNeutralEnding(data: any): EndingInfo {
    const { lifeStates } = data;
    const fatigue = lifeStates?.fatigue || 0;
    const anxiety = lifeStates?.anxiety || 0;
    const familyBond = lifeStates?.familyBond || 0;
    const socialMomentum = lifeStates?.socialMomentum || 0;
    const discipline = lifeStates?.discipline || 0;
    const indulgence = lifeStates?.indulgence || 0;
    const hasFamilyAnchor = Boolean(data.spouse) || data.children > 0 || familyBond >= 2;
    const hasModerateAchievement =
      data.martialPower >= 55 ||
      data.money >= 400 ||
      data.reputation >= 45 ||
      data.knowledge >= 60;
    const highAchievement =
      data.martialPower >= 75 ||
      data.money >= 1000 ||
      data.reputation >= 70 ||
      data.knowledge >= 75;

    if (
      data.flags.includes('retired') &&
      familyBond <= 1 &&
      socialMomentum <= 1 &&
      anxiety <= 1 &&
      discipline >= 1
    ) {
      return this.ENDINGS.find(e => e.id === 'hermit_life')!;
    }

    if (
      hasFamilyAnchor &&
      !highAchievement &&
      anxiety <= 2 &&
      data.reputation < 70 &&
      data.money < 900
    ) {
      return this.ENDINGS.find(e => e.id === 'quiet_family_life')!;
    }

    if (
      highAchievement &&
      (anxiety >= 2 || fatigue >= 2 || data.money < 0 || familyBond <= 1 || indulgence >= 2)
    ) {
      return this.ENDINGS.find(e => e.id === 'bittersweet_success')!;
    }

    if (
      hasModerateAchievement &&
      (!hasFamilyAnchor || anxiety >= 1 || discipline <= 1)
    ) {
      return this.ENDINGS.find(e => e.id === 'unfulfilled_ambition')!;
    }

    if (
      socialMomentum <= 1 &&
      data.connections <= 10 &&
      familyBond <= 1 &&
      discipline <= 1 &&
      !hasModerateAchievement
    ) {
      return this.ENDINGS.find(e => e.id === 'wanderer_life')!;
    }

    return this.ENDINGS.find(e => e.id === 'ordinary_life')!;
  }
}
