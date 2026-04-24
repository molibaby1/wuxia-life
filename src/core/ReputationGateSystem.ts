/**
 * 声望门槛系统 - 处理基于声望的事件触发限制
 *
 * @version 1.0.0
 * @since 2026-03-19
 */

import type { EventDefinition } from '../types/eventTypes';
import type { ReputationGateCheck } from '../types/difficultyTypes';
import {
  REPUTATION_TIERS,
  getReputationTier,
  getNextReputationTier,
  getDistanceToNextTier,
  canTriggerEventType,
  isEventUnlocked
} from '../data/reputationTiers';
import { difficultyManager } from './DifficultyManager';
import { difficultyMonitor } from './DifficultyMonitor';

/**
 * 检查事件是否满足声望门槛
 */
export function checkReputationGate(
  event: EventDefinition,
  playerReputation: number
): ReputationGateCheck {
  if (!event.reputationGate) {
    return {
      canTrigger: true,
      currentTier: getReputationTier(playerReputation),
      reason: '无声望门槛要求'
    };
  }

  const { minReputation, maxReputation } = event.reputationGate;
  const thresholdCoefficient = difficultyManager.config.eventThresholdCoefficient;

  const adjustedMin = Math.floor(minReputation * thresholdCoefficient);
  const adjustedMax = maxReputation
    ? Math.floor(maxReputation * thresholdCoefficient)
    : Infinity;

  const currentTier = getReputationTier(playerReputation);

  if (playerReputation < adjustedMin) {
    const distance = adjustedMin - playerReputation;
    difficultyMonitor.recordGateBlocked(event.id);

    return {
      canTrigger: false,
      currentTier,
      reason: `声望不足（当前: ${playerReputation}, 要求: ≥${adjustedMin}，还需 ${distance} 点）`,
      distanceToNextTier: distance
    };
  }

  if (playerReputation > adjustedMax) {
    difficultyMonitor.recordGateBlocked(event.id);

    return {
      canTrigger: false,
      currentTier,
      reason: `声望过高（当前: ${playerReputation}, 要求: ≤${adjustedMax}）`
    };
  }

  return {
    canTrigger: true,
    currentTier,
    reason: '声望满足要求'
  };
}

/**
 * 检查事件类型是否在当前声望等级可用
 */
export function checkEventTypeAvailability(
  category: EventDefinition['category'],
  playerReputation: number
): ReputationGateCheck {
  const canTrigger = canTriggerEventType(category, playerReputation);
  const currentTier = getReputationTier(playerReputation);

  if (!canTrigger) {
    return {
      canTrigger: false,
      currentTier,
      reason: `当前声望等级「${currentTier.name}」无法触发 ${category} 类型事件`
    };
  }

  return {
    canTrigger: true,
    currentTier,
    reason: `声望等级「${currentTier.name}」可触发此类事件`
  };
}

/**
 * 获取事件的声望建议
 */
export function getReputationAdvice(event: EventDefinition): string {
  if (!event.reputationGate) {
    return '此事件无声望门槛';
  }

  const { minReputation } = event.reputationGate;
  const thresholdCoefficient = difficultyManager.config.eventThresholdCoefficient;
  const adjustedMin = Math.floor(minReputation * thresholdCoefficient);

  const currentTier = getReputationTier(adjustedMin);

  return `建议达到「${currentTier.name}」后再尝试触发此事件（声望 ≥ ${adjustedMin}）`;
}

/**
 * 获取声望提升提示
 */
export function getReputationImprovementTips(currentReputation: number): string[] {
  const tips: string[] = [];
  const nextTier = getNextReputationTier(currentReputation);

  if (nextTier) {
    const distance = getDistanceToNextTier(currentReputation);
    tips.push(`再获得 ${distance} 点声望即可晋升为「${nextTier.name}」`);
    tips.push(`「${nextTier.name}」可解锁: ${nextTier.unlockedEvents.length} 个特殊事件`);
  } else {
    tips.push('你已达到最高声望等级！');
  }

  const currentTier = getReputationTier(currentReputation);
  tips.push(`当前等级「${currentTier.name}」：${currentTier.description}`);

  return tips;
}

/**
 * 计算声望对事件触发率的加成
 */
export function getReputationBonus(playerReputation: number): number {
  const tier = getReputationTier(playerReputation);
  return tier.eventProbabilityBonus;
}

/**
 * 获取所有已解锁的事件列表
 */
export function getUnlockedEvents(playerReputation: number): string[] {
  const unlockedEvents: string[] = [];

  for (const tier of REPUTATION_TIERS) {
    if (playerReputation >= tier.range.min) {
      unlockedEvents.push(...tier.unlockedEvents);
    }
  }

  return Array.from(new Set(unlockedEvents));
}

/**
 * 检查特定事件是否已解锁
 */
export function checkEventUnlocked(eventId: string, playerReputation: number): boolean {
  return isEventUnlocked(eventId, playerReputation);
}

/**
 * 获取声望状态摘要
 */
export function getReputationSummary(playerReputation: number): {
  currentTier: string;
  tierDescription: string;
  nextTier: string | null;
  distanceToNext: number | null;
  unlockedEventCount: number;
  eventBonus: string;
} {
  const currentTier = getReputationTier(playerReputation);
  const nextTier = getNextReputationTier(playerReputation);
  const distance = getDistanceToNextTier(playerReputation);
  const unlocked = getUnlockedEvents(playerReputation);
  const bonus = getReputationBonus(playerReputation);

  return {
    currentTier: currentTier.name,
    tierDescription: currentTier.description,
    nextTier: nextTier?.name || null,
    distanceToNext: distance,
    unlockedEventCount: unlocked.length,
    eventBonus: `+${(bonus * 100).toFixed(0)}%`
  };
}
