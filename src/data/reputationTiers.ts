/**
 * 声望等级配置
 *
 * 定义玩家声望等级体系及对应的事件触发权限
 *
 * @version 1.0.0
 * @since 2026-03-19
 */

import { EventCategory } from '../types/eventTypes';
import type { ReputationTier } from '../types/difficultyTypes';

export const REPUTATION_TIERS: ReputationTier[] = [
  {
    name: '无名之辈',
    range: { min: -1000, max: -101 },
    availableEventTypes: [EventCategory.DAILY_EVENT, EventCategory.RANDOM_ENCOUNTER],
    eventProbabilityBonus: -0.3,
    unlockedEvents: [],
    description: '江湖上无人知晓的存在，默默无闻'
  },
  {
    name: '市井小民',
    range: { min: -100, max: 0 },
    availableEventTypes: [
      EventCategory.DAILY_EVENT,
      EventCategory.RANDOM_ENCOUNTER,
      EventCategory.TIME_EVENT
    ],
    eventProbabilityBonus: -0.1,
    unlockedEvents: [],
    description: '在本地有些许名气，邻里皆知'
  },
  {
    name: '崭露头角',
    range: { min: 1, max: 100 },
    availableEventTypes: [
      EventCategory.DAILY_EVENT,
      EventCategory.RANDOM_ENCOUNTER,
      EventCategory.TIME_EVENT,
      EventCategory.SIDE_QUEST
    ],
    eventProbabilityBonus: 0,
    unlockedEvents: ['minor_sect_invitation'],
    description: '开始引起江湖人士注意，小有名气'
  },
  {
    name: '小有名气',
    range: { min: 101, max: 300 },
    availableEventTypes: [
      EventCategory.DAILY_EVENT,
      EventCategory.RANDOM_ENCOUNTER,
      EventCategory.TIME_EVENT,
      EventCategory.SIDE_QUEST,
      EventCategory.MAIN_STORY
    ],
    eventProbabilityBonus: 0.1,
    unlockedEvents: ['minor_sect_invitation', 'martial_arts_tournament_observer'],
    description: '在一方地域有了名气，门派关注'
  },
  {
    name: '一方豪杰',
    range: { min: 301, max: 600 },
    availableEventTypes: [
      EventCategory.DAILY_EVENT,
      EventCategory.RANDOM_ENCOUNTER,
      EventCategory.TIME_EVENT,
      EventCategory.SIDE_QUEST,
      EventCategory.MAIN_STORY,
      EventCategory.SPECIAL_EVENT
    ],
    eventProbabilityBonus: 0.2,
    unlockedEvents: [
      'martial_arts_tournament_participant',
      'important_person_invitation'
    ],
    description: '成为一方霸主，门派争相拉拢'
  },
  {
    name: '江湖名侠',
    range: { min: 601, max: 1000 },
    availableEventTypes: [
      EventCategory.DAILY_EVENT,
      EventCategory.RANDOM_ENCOUNTER,
      EventCategory.TIME_EVENT,
      EventCategory.SIDE_QUEST,
      EventCategory.MAIN_STORY,
      EventCategory.SPECIAL_EVENT
    ],
    eventProbabilityBonus: 0.35,
    unlockedEvents: ['sect_leader_invitation', 'wulin_conference_leader'],
    description: '名震江湖，受人敬仰，一呼百应'
  },
  {
    name: '一代宗师',
    range: { min: 1001, max: 2000 },
    availableEventTypes: Object.values(EventCategory),
    eventProbabilityBonus: 0.5,
    unlockedEvents: ['ending_legendary'],
    description: '开宗立派，武林至尊，千古流芳'
  }
];

/**
 * 根据声望值获取对应的声望等级
 */
export function getReputationTier(reputation: number): ReputationTier {
  for (const tier of REPUTATION_TIERS) {
    if (reputation >= tier.range.min && reputation <= tier.range.max) {
      return tier;
    }
  }

  if (reputation < REPUTATION_TIERS[0].range.min) {
    return REPUTATION_TIERS[0];
  }

  return REPUTATION_TIERS[REPUTATION_TIERS.length - 1];
}

/**
 * 获取声望等级的下一个等级
 */
export function getNextReputationTier(currentReputation: number): ReputationTier | null {
  const currentTier = getReputationTier(currentReputation);
  const currentIndex = REPUTATION_TIERS.indexOf(currentTier);

  if (currentIndex < REPUTATION_TIERS.length - 1) {
    return REPUTATION_TIERS[currentIndex + 1];
  }

  return null;
}

/**
 * 计算距离下一等级还差多少声望
 */
export function getDistanceToNextTier(currentReputation: number): number | null {
  const nextTier = getNextReputationTier(currentReputation);

  if (nextTier) {
    return nextTier.range.min - currentReputation;
  }

  return null;
}

/**
 * 获取声望等级名称
 */
export function getReputationTierName(reputation: number): string {
  return getReputationTier(reputation).name;
}

/**
 * 检查声望是否满足某事件类型的要求
 */
export function canTriggerEventType(
  category: EventCategory,
  reputation: number
): boolean {
  const tier = getReputationTier(reputation);
  return tier.availableEventTypes.includes(category);
}

/**
 * 获取某声望等级可解锁的所有事件 ID
 */
export function getUnlockedEventsForTier(reputation: number): string[] {
  const tier = getReputationTier(reputation);
  return tier.unlockedEvents;
}

/**
 * 检查是否已解锁特定事件
 */
export function isEventUnlocked(eventId: string, reputation: number): boolean {
  const tier = getReputationTier(reputation);

  for (const t of REPUTATION_TIERS) {
    if (t.unlockedEvents.includes(eventId)) {
      return reputation >= t.range.min;
    }
  }

  return true;
}

/**
 * 获取声望范围的显示字符串
 */
export function getReputationRangeString(reputation: number): string {
  const tier = getReputationTier(reputation);
  return `${tier.range.min} ~ ${tier.range.max}`;
}

/**
 * 获取所有声望等级列表
 */
export function getAllReputationTiers(): ReputationTier[] {
  return [...REPUTATION_TIERS];
}
