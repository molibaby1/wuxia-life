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

import type { GameState, PlayerLifeStates, CriticalChoices } from '../types/eventTypes';
import { profileHasP19Sections } from '../p19/reportBuilder';
import { composeP19FinalSummary } from '../p19/finalSummaryComposition';
import { buildHistoricalMemoryReport } from '../p19/historicalMemory';
import { buildLateLifePracticeRecapLine } from '../utils/practiceTrajectorySummary';

/**
 * 结局类型
 */
export type EndingType =
  // 正面结局
  | 'legendary_hero'       // 传奇英雄 - 侠义 > 80, 声望 > 80
  | 'martial_god'          // 武学之神 - 功力 >= 95 且年龄 >= 68
  | 'sect_founder'         // 开宗立派 - 建立门派，弟子 > 100
  | 'beloved_saint'        // 在世活佛 - 善行 > 100, 救人 > 500
  | 'great_scholar'        // 一代宗师 - 学识 > 90, 著作流传
  | 'official_minister'
  | 'hermit_master'
  
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
    chivalry?: number;
    reputation?: number;
    martialPower?: number;
    good_karma?: number;
    evil_karma?: number;
    flags?: string[];
    not_flags?: string[];
    achievements?: string[];
    age?: number;
    connections?: number;
    knowledge?: number;
    businessAcumen?: number;
    influence?: number;
  };
  priority: number;  // 优先级，用于冲突时判定
}

interface EndingEvaluationData {
  chivalry: number;
  reputation: number;
  martialPower: number;
  connections: number;
  knowledge: number;
  businessAcumen: number;
  influence: number;
  good_karma: number;
  evil_karma: number;
  flags: string[];
  achievements: string[];
  age: number;
  spouse: string | null;
  children: number;
  lifeStates: PlayerLifeStates;
  choices?: CriticalChoices;
}

const EMPTY_LIFE_STATES = {
  trainingHabit: 0,
  studyHabit: 0,
  businessHabit: 0,
} as PlayerLifeStates;

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
      description: '你穷尽一生钻研武学，功力臻于化境，成为武林中公认的武学之神。一招一式皆含天地之威。',
      category: 'positive',
      requirements: {
        martialPower: 95,
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
      id: 'great_scholar',
      name: '一代宗师',
      description: '你学识渊博，著书立说，武学理论影响后世数百年。你的著作被奉为经典，代代相传。',
      category: 'positive',
      requirements: {
        knowledge: 85,
        age: 65,
      },
      priority: 87,
    },
    {
      id: 'official_minister',
      name: '定国名臣',
      description: '你在制度中承担公共责任，以持续治理成果留下了清明而有力的名声。',
      category: 'positive',
      requirements: {
        reputation: 70,
        age: 60,
        flags: ['official_first_post', 'route_official_completed'],
      },
      priority: 89,
    },
    {
      id: 'hermit_master',
      name: '隐逸高士',
      description: '你主动退出公共竞争，并以持续独立的生活实践守住了自己的清静道路。',
      category: 'positive',
      requirements: {
        age: 60,
        flags: ['peacefulHermit', 'retiredInCountryside'],
      },
      priority: 86,
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
    const playerData = this.buildEndingEvaluationData(state);

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
    data: EndingEvaluationData,
    requirements: EndingInfo['requirements']
  ): boolean {
    const numericFields: Array<
      'knowledge' | 'reputation' | 'martialPower'
      | 'connections'
      | 'businessAcumen' | 'influence' | 'good_karma' | 'evil_karma' | 'age'
    > = [
      'knowledge', 'reputation', 'martialPower',
      'connections',
      'businessAcumen', 'influence', 'good_karma', 'evil_karma', 'age',
    ];

    for (const field of numericFields) {
      const threshold = requirements[field];
      if (threshold === undefined) continue;
      const value = data[field as keyof EndingEvaluationData] as number;
      if (value < threshold) return false;
    }

    if (requirements.chivalry !== undefined) {
      if (requirements.chivalry < 0) {
        if (data.chivalry > requirements.chivalry) return false;
      } else {
        if (data.chivalry < requirements.chivalry) return false;
      }
    }

    if (requirements.flags) {
      for (const flag of requirements.flags) {
        if (!data.flags.includes(flag)) return false;
      }
    }

    if (requirements.not_flags) {
      for (const flag of requirements.not_flags) {
        if (data.flags.includes(flag)) return false;
      }
    }

    if (requirements.achievements) {
      for (const achievement of requirements.achievements) {
        if (!data.achievements.includes(achievement)) return false;
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
    
    let review = '';
    
    if (profileHasP19Sections()) {
      const composition = composeP19FinalSummary(state, ending);
      const memoryReport = buildHistoricalMemoryReport(state);
      review += `【${ending.name}】\n\n`;
      review += `${composition.composedSummary}\n`;
      if (memoryReport.classificationLines.length > 0) {
        review += `\n=== 历史记忆分类 ===\n`;
        memoryReport.classificationLines.forEach(line => {
          review += `• ${line}\n`;
        });
      }
    } else {
      review += `【${ending.name}】\n\n`;
      review += `${ending.description}\n\n`;
    }
    
    // 人生总结
    review += '=== 人生总结 ===\n';
    review += `寿命：${player.age} 岁\n`;
    review += `侠义值：${player.chivalry}\n`;
    review += `名望：${player.reputation}\n`;
    review += `财富：${player.money}\n`;
    review += `武力：${player.martialPower}\n`;
    review += `学识：${player.knowledge}\n`;
    
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
    if (profileHasP19Sections()) {
      return composeP19FinalSummary(state, ending).composedSummary;
    }

    const shapingRecap = buildLateLifePracticeRecapLine(state.player.lifeStates);

    let categoryLine: string;
    if (ending.category === 'positive') {
      categoryLine = '高门槛成就成立，人生主轴清晰且完成度高。';
    } else if (ending.id === 'bittersweet_success') {
      categoryLine = '有明显成就，但状态、关系或代价阻止了它成为完美结局。';
    } else if (ending.id === 'quiet_family_life') {
      categoryLine = '最终重心落在身边人和安稳生活，而不是江湖传说。';
    } else if (ending.id === 'unfulfilled_ambition') {
      categoryLine = '一生持续向上，但始终差一步，留下了明显遗憾。';
    } else if (ending.id === 'hermit_life') {
      categoryLine = '你主动从纷扰中退身，把后半生过成了离江湖更远的样子。';
    } else if (ending.id === 'wanderer_life') {
      categoryLine = '没有扎下根，也没有真正停下脚步，人生最后仍带着漂泊感。';
    } else if (ending.id === 'ordinary_life') {
      categoryLine = '没有走成传说，也没有跌入深渊，一生的重量更多落在平凡日常里。';
    } else if (ending.category === 'negative') {
      categoryLine = '长期的恶果、孤立或失控状态压过了成就。';
    } else {
      categoryLine = '没有达到传奇门槛，人生以更普通但也更真实的方式收束。';
    }

    return `${shapingRecap}\n${categoryLine}`;
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
    
    const playerData = this.buildEndingEvaluationData(state);
    const meetsRequirements = this.meetsEndingRequirements(playerData, ending.requirements);
    return meetsRequirements
      && (ending.category !== 'positive' || this.qualifiesForPositiveEnding(playerData, ending.id));
  }

  private static buildEndingEvaluationData(state: GameState): EndingEvaluationData {
    const { player, karma, criticalChoices, achievements } = state;
    return {
      chivalry: player.chivalry,
      reputation: player.reputation,
      martialPower: player.martialPower,
      connections: player.connections,
      knowledge: player.knowledge ?? 0,
      businessAcumen: player.businessAcumen ?? 0,
      influence: player.influence ?? 0,
      good_karma: karma?.good_karma || 0,
      evil_karma: karma?.evil_karma || 0,
      flags: Object.keys(player.flags || {}).filter(f => player.flags?.[f]),
      achievements: achievements || [],
      choices: criticalChoices || {},
      age: player.age,
      spouse: player.spouse,
      children: player.children,
      lifeStates: player.lifeStates || EMPTY_LIFE_STATES,
    };
  }

  /**
   * 获取所有可解锁的结局
   */
  static getUnlockableEndings(state: GameState): EndingInfo[] {
    return this.ENDINGS.filter(ending => 
      this.canUnlockEnding(state, ending.id)
    );
  }

  private static qualifiesForPositiveEnding(data: EndingEvaluationData, endingId: EndingType): boolean {
    switch (endingId) {
      case 'legendary_hero':
        return data.chivalry >= 80 && data.reputation >= 85 && data.good_karma >= 70;
      case 'martial_god':
        return data.martialPower >= 95;
      case 'sect_founder':
        return data.reputation >= 80 && data.influence >= 35;
      case 'beloved_saint':
        return data.good_karma >= 110;
      case 'great_scholar':
        return data.knowledge >= 85;
      default:
        return true;
    }
  }

  private static determineNeutralEnding(data: EndingEvaluationData): EndingInfo {
    const hasFamilyAnchor = Boolean(data.spouse) || data.children > 0;
    const hasModerateAchievement =
      data.martialPower >= 55 ||
      data.reputation >= 45 ||
      data.knowledge >= 60;
    const highAchievement =
      data.martialPower >= 75 ||
      data.reputation >= 70 ||
      data.knowledge >= 75;

    if (data.flags.includes('retired')) {
      return this.ENDINGS.find(e => e.id === 'hermit_life')!;
    }

    if (
      hasFamilyAnchor &&
      !highAchievement &&
      data.reputation < 70
    ) {
      return this.ENDINGS.find(e => e.id === 'quiet_family_life')!;
    }

    if (
      hasModerateAchievement &&
      !hasFamilyAnchor
    ) {
      return this.ENDINGS.find(e => e.id === 'unfulfilled_ambition')!;
    }

    if (
      data.connections <= 10 &&
      !hasModerateAchievement
    ) {
      return this.ENDINGS.find(e => e.id === 'wanderer_life')!;
    }

    return this.ENDINGS.find(e => e.id === 'ordinary_life')!;
  }
}
