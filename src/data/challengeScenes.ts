/**
 * 挑战场景配置
 *
 * 定义各种挑战场景的基础失败概率和能力阈值
 *
 * @version 1.0.0
 * @since 2026-03-19
 */

import type { ChallengeScene } from '../types/difficultyTypes';

export const CHALLENGE_SCENES: Record<string, ChallengeScene> = {
  martial_arts_tournament: {
    id: 'martial_arts_tournament',
    name: '武林大会',
    baseFailureRate: 50,
    relevantStats: ['martialPower', 'externalSkill', 'internalSkill', 'comprehension'],
    thresholds: {
      martialPower: { qualified: 80, excellent: 150, failureRateReduction: 0.3 },
      externalSkill: { qualified: 60, excellent: 100, failureRateReduction: 0.15 },
      internalSkill: { qualified: 50, excellent: 90, failureRateReduction: 0.15 },
      comprehension: { qualified: 40, excellent: 70, failureRateReduction: 0.1 }
    },
    description: '高手云集的武林大会，挑战各路英雄'
  },

  martial_arts_tournament_novice: {
    id: 'martial_arts_tournament_novice',
    name: '武林大会（新手武者）',
    baseFailureRate: 80,
    relevantStats: ['martialPower', 'externalSkill'],
    thresholds: {
      martialPower: { qualified: 100, excellent: 200, failureRateReduction: 0.35 },
      externalSkill: { qualified: 80, excellent: 120, failureRateReduction: 0.2 }
    },
    description: '初出茅庐的武者参加武林大会，胜算极低'
  },

  imperial_exam: {
    id: 'imperial_exam',
    name: '科举考试',
    baseFailureRate: 40,
    relevantStats: ['knowledge', 'comprehension', 'charisma'],
    thresholds: {
      knowledge: { qualified: 60, excellent: 85, failureRateReduction: 0.25 },
      comprehension: { qualified: 50, excellent: 75, failureRateReduction: 0.15 },
      charisma: { qualified: 40, excellent: 70, failureRateReduction: 0.1 }
    },
    description: '十年寒窗，一举成名天下知'
  },

  business_negotiation: {
    id: 'business_negotiation',
    name: '商业谈判',
    baseFailureRate: 35,
    relevantStats: ['charisma', 'businessAcumen', 'connections'],
    thresholds: {
      charisma: { qualified: 50, excellent: 80, failureRateReduction: 0.2 },
      businessAcumen: { qualified: 50, excellent: 80, failureRateReduction: 0.2 },
      connections: { qualified: 40, excellent: 70, failureRateReduction: 0.1 }
    },
    description: '与商界巨擘谈判，利益攸关'
  },

  sect_sparring: {
    id: 'sect_sparring',
    name: '门派比武',
    baseFailureRate: 30,
    relevantStats: ['martialPower', 'externalSkill', 'qinggong'],
    thresholds: {
      martialPower: { qualified: 50, excellent: 100, failureRateReduction: 0.25 },
      externalSkill: { qualified: 40, excellent: 80, failureRateReduction: 0.15 },
      qinggong: { qualified: 30, excellent: 60, failureRateReduction: 0.1 }
    },
    description: '门派内部的切磋比试'
  },

  sect_trial: {
    id: 'sect_trial',
    name: '门派试炼',
    baseFailureRate: 45,
    relevantStats: ['martialPower', 'constitution', 'comprehension'],
    thresholds: {
      martialPower: { qualified: 40, excellent: 80, failureRateReduction: 0.2 },
      constitution: { qualified: 40, excellent: 70, failureRateReduction: 0.15 },
      comprehension: { qualified: 30, excellent: 60, failureRateReduction: 0.1 }
    },
    description: '入门弟子必须通过的试炼考验'
  },

  jianghu_duel: {
    id: 'jianghu_duel',
    name: '江湖决斗',
    baseFailureRate: 55,
    relevantStats: ['martialPower', 'externalSkill', 'qinggong'],
    thresholds: {
      martialPower: { qualified: 70, excellent: 130, failureRateReduction: 0.3 },
      externalSkill: { qualified: 55, excellent: 100, failureRateReduction: 0.2 },
      qinggong: { qualified: 40, excellent: 75, failureRateReduction: 0.15 }
    },
    description: '江湖上的生死决斗，不成功便成仁'
  },

  cultivation_breakthrough: {
    id: 'cultivation_breakthrough',
    name: '闭关突破',
    baseFailureRate: 35,
    relevantStats: ['internalSkill', 'comprehension', 'constitution'],
    thresholds: {
      internalSkill: { qualified: 50, excellent: 90, failureRateReduction: 0.25 },
      comprehension: { qualified: 45, excellent: 75, failureRateReduction: 0.15 },
      constitution: { qualified: 35, excellent: 65, failureRateReduction: 0.1 }
    },
    description: '试图突破武学瓶颈，更上一层楼'
  },

  rescue_mission: {
    id: 'rescue_mission',
    name: '营救任务',
    baseFailureRate: 50,
    relevantStats: ['martialPower', 'qinggong', 'connections'],
    thresholds: {
      martialPower: { qualified: 60, excellent: 110, failureRateReduction: 0.25 },
      qinggong: { qualified: 50, excellent: 85, failureRateReduction: 0.2 },
      connections: { qualified: 30, excellent: 60, failureRateReduction: 0.1 }
    },
    description: '深入敌营营救被困之人'
  },

  bounty_hunt: {
    id: 'bounty_hunt',
    name: '悬赏追捕',
    baseFailureRate: 40,
    relevantStats: ['martialPower', 'qinggong', 'constitution'],
    thresholds: {
      martialPower: { qualified: 55, excellent: 100, failureRateReduction: 0.2 },
      qinggong: { qualified: 45, excellent: 80, failureRateReduction: 0.15 },
      constitution: { qualified: 40, excellent: 70, failureRateReduction: 0.1 }
    },
    description: '追捕悬赏犯，获取丰厚报酬'
  },

  formation_challenge: {
    id: 'formation_challenge',
    name: '阵法破解',
    baseFailureRate: 60,
    relevantStats: ['comprehension', 'internalSkill', 'martialPower'],
    thresholds: {
      comprehension: { qualified: 55, excellent: 85, failureRateReduction: 0.25 },
      internalSkill: { qualified: 45, excellent: 80, failureRateReduction: 0.2 },
      martialPower: { qualified: 40, excellent: 75, failureRateReduction: 0.15 }
    },
    description: '破解高深阵法，一展聪慧'
  },

  trade_negotiation: {
    id: 'trade_negotiation',
    name: '商贸谈判',
    baseFailureRate: 30,
    relevantStats: ['businessAcumen', 'charisma', 'connections'],
    thresholds: {
      businessAcumen: { qualified: 45, excellent: 75, failureRateReduction: 0.2 },
      charisma: { qualified: 40, excellent: 70, failureRateReduction: 0.15 },
      connections: { qualified: 35, excellent: 65, failureRateReduction: 0.1 }
    },
    description: '与各国商人洽谈贸易合作'
  },

  official_exam: {
    id: 'official_exam',
    name: '殿试对策',
    baseFailureRate: 55,
    relevantStats: ['knowledge', 'charisma', 'comprehension'],
    thresholds: {
      knowledge: { qualified: 70, excellent: 90, failureRateReduction: 0.3 },
      charisma: { qualified: 50, excellent: 80, failureRateReduction: 0.2 },
      comprehension: { qualified: 55, excellent: 80, failureRateReduction: 0.15 }
    },
    description: '面见圣上，阐述治国之策'
  },

  medical_challenge: {
    id: 'medical_challenge',
    name: '疑难杂症',
    baseFailureRate: 45,
    relevantStats: ['knowledge', 'comprehension', 'connections'],
    thresholds: {
      knowledge: { qualified: 60, excellent: 85, failureRateReduction: 0.25 },
      comprehension: { qualified: 50, excellent: 75, failureRateReduction: 0.15 },
      connections: { qualified: 30, excellent: 60, failureRateReduction: 0.1 }
    },
    description: '诊治棘手病症，妙手回春'
  }
};

/**
 * 根据场景 ID 获取挑战场景配置
 */
export function getChallengeScene(sceneId: string): ChallengeScene | undefined {
  return CHALLENGE_SCENES[sceneId];
}

/**
 * 获取所有挑战场景列表
 */
export function getAllChallengeScenes(): ChallengeScene[] {
  return Object.values(CHALLENGE_SCENES);
}

/**
 * 根据场景名称搜索挑战场景
 */
export function searchChallengeScenes(keyword: string): ChallengeScene[] {
  const lowerKeyword = keyword.toLowerCase();
  return Object.values(CHALLENGE_SCENES).filter(
    scene =>
      scene.name.toLowerCase().includes(lowerKeyword) ||
      scene.description?.toLowerCase().includes(lowerKeyword)
  );
}
