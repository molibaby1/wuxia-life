/**
 * 挫折事件配置
 *
 * 定义各种负面事件及其触发条件和效果
 *
 * @version 1.0.0
 * @since 2026-03-19
 */

import type { SetbackEventConfig } from '../types/difficultyTypes';

export const SETBACK_EVENTS: SetbackEventConfig[] = [
  {
    id: 'serious_illness',
    name: '大病一场',
    severity: 'moderate',
    baseProbability: 4,
    conditions: {
      minAge: 16,
      minConstitution: 30
    },
    effects: {
      statChanges: {
        constitution: -15,
        martialPower: -10,
        energy: -20
      },
      duration: 180
    },
    exemption: {
      constitutionThreshold: 60,
      baseRate: 30
    },
    description: '一场突如其来的大病让你卧床不起，消耗大量精力',
    failureText: '病来如山倒，你不得不停下修炼的脚步'
  },
  {
    id: 'injury_accident',
    name: '意外受伤',
    severity: 'minor',
    baseProbability: 8,
    conditions: {
      minAge: 10
    },
    effects: {
      statChanges: {
        constitution: -5,
        martialPower: -3
      },
      duration: 90
    },
    exemption: {
      constitutionThreshold: 50,
      baseRate: 40
    },
    description: '意外受伤，需要休养一段时间',
    failureText: '天有不测风云，你在一次意外中受了伤'
  },
  {
    id: 'early_death',
    name: '英年早逝',
    severity: 'critical',
    baseProbability: 0.3,
    conditions: {
      minAge: 18,
      maxAge: 40
    },
    effects: {
      deathProbability: 100,
      statChanges: {
        constitution: -50
      }
    },
    exemption: {
      constitutionThreshold: 80,
      baseRate: 60
    },
    description: '天妒英才，你的生命走到了尽头...',
    failureText: '命数已尽，英雄早逝'
  },
  {
    id: 'property_loss',
    name: '财产损失',
    severity: 'minor',
    baseProbability: 10,
    conditions: {},
    effects: {
      statChanges: {
        money: -100
      },
      duration: 0
    },
    exemption: {
      baseRate: 20
    },
    description: '遭遇盗匪或经营失败，损失部分财产',
    failureText: '世事无常，财富来得快去得也快'
  },
  {
    id: 'relationship_betrayal',
    name: '挚友背叛',
    severity: 'moderate',
    baseProbability: 3,
    conditions: {
      minAge: 20
    },
    effects: {
      statChanges: {
        chivalry: -10,
        connections: -15
      },
      duration: 365
    },
    exemption: {
      constitutionThreshold: 50,
      baseRate: 25
    },
    description: '曾经信任的人背叛了你，让你心寒',
    failureText: '人心叵测，你最信任的人却伤你最深'
  },
  {
    id: 'sect_discipline',
    name: '门派责罚',
    severity: 'minor',
    baseProbability: 5,
    conditions: {
      minAge: 14
    },
    effects: {
      statChanges: {
        reputation: -10,
        martialPower: -5
      },
      duration: 60
    },
    exemption: {
      constitutionThreshold: 40,
      baseRate: 30
    },
    description: '违反门规，受到责罚',
    failureText: '违反门规的你受到了应有的惩罚'
  },
  {
    id: ' cultivation_deviation',
    name: '走火入魔',
    severity: 'severe',
    baseProbability: 2,
    conditions: {
      minAge: 16,
      minConstitution: 25
    },
    effects: {
      statChanges: {
        internalSkill: -20,
        martialPower: -15,
        constitution: -10
      },
      duration: 365
    },
    exemption: {
      constitutionThreshold: 70,
      baseRate: 40
    },
    description: '修炼时心神不宁，导致内息紊乱',
    failureText: '修炼之道，最忌心浮气躁，你陷入了走火入魔的境地'
  },
  {
    id: 'robbery',
    name: '遭遇劫匪',
    severity: 'minor',
    baseProbability: 7,
    conditions: {},
    effects: {
      statChanges: {
        money: -150,
        constitution: -3
      },
      duration: 30
    },
    exemption: {
      constitutionThreshold: 45,
      baseRate: 25
    },
    description: '路遇劫匪，钱财受损',
    failureText: '江湖险恶，你遭遇了劫匪的洗劫'
  },
  {
    id: 'slandering',
    name: '遭受诽谤',
    severity: 'moderate',
    baseProbability: 4,
    conditions: {
      minAge: 15
    },
    effects: {
      statChanges: {
        reputation: -25,
        chivalry: -5
      },
      duration: 180
    },
    exemption: {
      constitutionThreshold: 50,
      baseRate: 30
    },
    description: '小人散布谣言，损害你的名声',
    failureText: '流言蜚语如同利刃，刺伤了你辛苦积攒的名声'
  },
  {
    id: 'failed_exam',
    name: '名落孙山',
    severity: 'minor',
    baseProbability: 15,
    conditions: {
      minAge: 18
    },
    effects: {
      statChanges: {
        knowledge: -5,
        chivalry: -3
      },
      duration: 90
    },
    exemption: {
      constitutionThreshold: 40,
      baseRate: 35
    },
    description: '科举落第，榜上无名',
    failureText: '十年寒窗付诸东流，金榜题名终是梦'
  },
  {
    id: 'business_failure',
    name: '生意失败',
    severity: 'moderate',
    baseProbability: 6,
    conditions: {},
    effects: {
      statChanges: {
        money: -300,
        businessAcumen: -5
      },
      duration: 180
    },
    exemption: {
      constitutionThreshold: 45,
      baseRate: 25
    },
    description: '商业决策失误，导致严重亏损',
    failureText: '商场如战场，一次失误可能万劫不复'
  },
  {
    id: 'natural_disaster',
    name: '天灾人祸',
    severity: 'severe',
    baseProbability: 1,
    conditions: {},
    effects: {
      statChanges: {
        money: -500,
        constitution: -10,
        reputation: -15
      },
      duration: 365
    },
    exemption: {
      constitutionThreshold: 60,
      baseRate: 50
    },
    description: '遭遇洪水、火灾等天灾',
    failureText: '天灾无情，一夜之间一无所有'
  }
];

/**
 * 根据 ID 获取挫折事件配置
 */
export function getSetbackEvent(eventId: string): SetbackEventConfig | undefined {
  return SETBACK_EVENTS.find(event => event.id === eventId);
}

/**
 * 获取所有挫折事件
 */
export function getAllSetbackEvents(): SetbackEventConfig[] {
  return [...SETBACK_EVENTS];
}

/**
 * 根据严重程度获取挫折事件
 */
export function getSetbackEventsBySeverity(
  severity: SetbackEventConfig['severity']
): SetbackEventConfig[] {
  return SETBACK_EVENTS.filter(event => event.severity === severity);
}

/**
 * 获取严重程度排序的事件列表（从轻到重）
 */
export function getSetbackEventsSortedBySeverity(): SetbackEventConfig[] {
  const severityOrder: Record<SetbackEventConfig['severity'], number> = {
    minor: 1,
    moderate: 2,
    severe: 3,
    critical: 4
  };

  return [...SETBACK_EVENTS].sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
  );
}

/**
 * 检查事件是否可以被触发（根据条件）
 */
export function canSetbackEventTrigger(
  event: SetbackEventConfig,
  playerAge: number,
  playerConstitution: number
): boolean {
  if (event.conditions.minAge && playerAge < event.conditions.minAge) {
    return false;
  }

  if (event.conditions.maxAge && playerAge > event.conditions.maxAge) {
    return false;
  }

  if (
    event.exemption.constitutionThreshold &&
    playerConstitution >= event.exemption.constitutionThreshold
  ) {
    return false;
  }

  return true;
}

/**
 * 计算实际触发概率（考虑全局倍率）
 */
export function calculateSetbackProbability(
  event: SetbackEventConfig,
  globalMultiplier: number
): number {
  return event.baseProbability * globalMultiplier;
}
