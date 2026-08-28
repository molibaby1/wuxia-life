/**
 * 挫折事件系统 - 处理随机负面事件的触发和效果
 *
 * @version 1.0.0
 * @since 2026-03-19
 */

import type { GameState, PlayerState } from '../types/eventTypes';
import type { SetbackEventResult } from '../types/difficultyTypes';
import {
  SETBACK_EVENTS,
  getSetbackEvent,
  getAllSetbackEvents,
  getSetbackEventsBySeverity,
  canSetbackEventTrigger,
  calculateSetbackProbability
} from '../data/setbackEvents';
import { difficultyManager } from './DifficultyManager';
import { difficultyMonitor } from './DifficultyMonitor';

export interface SetbackCheckResult {
  triggeredEvents: SetbackEventResult[];
  suppressedEvents: string[];
}

export type SetbackCheckOptions = {
  /** P3 deterministic runs: skip ENG-01 early_death (US-006 / WR-ENG-02). */
  suppressLethalSetbacks?: boolean;
};

const LETHAL_SETBACK_IDS = new Set(['early_death']);

/**
 * Difficulty setback ids that share player-visible meaning with a catalog formal fact.
 * When the difficulty system fires these, both ids are written to formal event history
 * so Condition `events.has(...)` stays aligned with the visible「意外受伤」outcome.
 */
export const DIFFICULTY_SETBACK_FORMAL_FACT_ALIASES: Readonly<Record<string, string>> = {
  injury_accident: 'setback_injury',
};

/** Formal history ids to record for a difficulty setback (self + optional catalog alias). */
export function formalFactsForDifficultySetback(setbackId: string): readonly string[] {
  const alias = DIFFICULTY_SETBACK_FORMAL_FACT_ALIASES[setbackId];
  return alias ? [setbackId, alias] : [setbackId];
}

/** Canonical numeric stats currently used by formal Setback configs. */
export const SETBACK_MODIFIABLE_STATS = new Set([
  'martialPower',
  'constitution',
  'chivalry',
  'connections',
  'reputation',
  'knowledge',
  'businessAcumen',
] as const);

type SetbackModifiableStat = typeof SETBACK_MODIFIABLE_STATS extends Set<infer T> ? T : never;

function isSetbackModifiableStat(stat: string): stat is SetbackModifiableStat {
  return (SETBACK_MODIFIABLE_STATS as Set<string>).has(stat);
}

/**
 * Apply Setback numeric deltas with an explicit allowlist.
 * Unknown / legacy keys are silently ignored; no ghost properties are created.
 */
export function applySetbackStatChanges(
  player: PlayerState,
  statChanges: Record<string, number> | undefined,
): PlayerState {
  if (!statChanges) return player;

  const nextPlayer = { ...player };
  for (const [stat, value] of Object.entries(statChanges)) {
    if (!isSetbackModifiableStat(stat)) continue;
    const currentValue = Number(nextPlayer[stat] ?? 0);
    nextPlayer[stat] = Math.max(0, currentValue + value);
  }
  return nextPlayer;
}

/**
 * 检查所有可能触发的挫折事件
 * 每次年度事件触发前调用
 */
export function checkSetbackEvents(
  state: GameState,
  options?: SetbackCheckOptions,
): SetbackCheckResult {
  const player = state.player;
  const globalMultiplier = difficultyManager.config.setbackEventProbability;
  const triggeredEvents: SetbackEventResult[] = [];
  const suppressedEvents: string[] = [];

  for (const event of SETBACK_EVENTS) {
    if (options?.suppressLethalSetbacks && LETHAL_SETBACK_IDS.has(event.id)) {
      continue;
    }
    const result = processSetbackEvent(event, player, globalMultiplier);

    if (result.triggered) {
      triggeredEvents.push({
        event: result.event,
        wasExempted: false
      });
      difficultyMonitor.recordSetbackEvent(event.id);
    } else if (result.suppressed) {
      suppressedEvents.push(event.id);
    }
  }

  return { triggeredEvents, suppressedEvents };
}

/**
 * 处理单个挫折事件
 */
function processSetbackEvent(
  event: typeof SETBACK_EVENTS[0],
  player: PlayerState,
  globalMultiplier: number
): { triggered: boolean; suppressed: boolean; event: typeof SETBACK_EVENTS[0] } {
  if (!canSetbackEventTrigger(event, player.age, player.constitution)) {
    return { triggered: false, suppressed: false, event };
  }

  const effectiveProbability = calculateSetbackProbability(event, globalMultiplier);
  const random = Math.random() * 100;

  if (random < effectiveProbability) {
    if (checkExemption(event, player)) {
      return { triggered: false, suppressed: true, event };
    }
    return { triggered: true, suppressed: false, event };
  }

  return { triggered: false, suppressed: false, event };
}

/**
 * 检查是否豁免
 */
function checkExemption(
  event: typeof SETBACK_EVENTS[0],
  player: PlayerState
): boolean {
  const { exemption } = event;

  if (exemption.constitutionThreshold) {
    if (player.constitution >= exemption.constitutionThreshold) {
      return true;
    }
  }

  const random = Math.random() * 100;
  return random < exemption.baseRate;
}

/**
 * 应用挫折事件效果到游戏状态
 */
export function applySetbackEffects(
  state: GameState,
  eventId: string
): GameState {
  const event = getSetbackEvent(eventId);
  if (!event) {
    console.warn(`[SetbackEvent] 未找到挫折事件: ${eventId}`);
    return state;
  }

  let newState = { ...state };

  if (newState.player) {
    newState.player = applySetbackStatChanges(newState.player, event.effects.statChanges);
  }

  if (event.effects.deathProbability && event.effects.deathProbability >= 100) {
    if (newState.player) {
      newState.player.alive = false;
      newState.player.deathReason = event.name;
    }
    newState.flags = {
      ...newState.flags,
      gameEnded: true
    };
    difficultyMonitor.updateSurvivalRate(false);
  }

  if (event.effects.duration && event.effects.duration > 0) {
    const endYear =
      (newState.currentTime?.year || 0) + Math.ceil(event.effects.duration / 365);
    const newFlags: Record<string, boolean> = {
      ...newState.flags,
      [`setback_${event.id}_endTime`]: true,
      [`setback_${event.id}_active`]: true
    };
    (newFlags as Record<string, number | boolean>)[`setback_${event.id}_endYear`] = endYear;
    newState.flags = newFlags;
  }


  return newState;
}

/**
 * 获取当前活跃的挫折事件
 */
export function getActiveSetbacks(state: GameState): string[] {
  const activeSetbacks: string[] = [];

  for (const event of SETBACK_EVENTS) {
    const flagKey = `setback_${event.id}_active`;
    if (state.flags[flagKey]) {
      activeSetbacks.push(event.id);
    }
  }

  return activeSetbacks;
}

/**
 * 检查并清除已结束的挫折事件
 */
export function clearExpiredSetbacks(state: GameState): GameState {
  const currentYear = state.currentTime?.year || 0;
  let hasChanges = false;
  const newFlags = { ...state.flags };

  for (const event of SETBACK_EVENTS) {
    const activeFlag = `setback_${event.id}_active`;
    const endYearFlag = `setback_${event.id}_endYear`;

    const isActive = newFlags[activeFlag] as boolean | undefined;
    if (isActive) {
      const flagsAny = newFlags as Record<string, number | boolean | undefined>;
      const endYear = flagsAny[endYearFlag] as number | undefined;
      if (endYear && currentYear >= endYear) {
        delete newFlags[activeFlag];
        delete newFlags[endYearFlag];
        delete newFlags[`setback_${event.id}_endTime`];
        hasChanges = true;
      }
    }
  }

  return hasChanges ? { ...state, flags: newFlags } : state;
}

/**
 * 获取挫折事件的视觉反馈类型
 */
export function getSetbackVisualFeedback(
  severity: 'minor' | 'moderate' | 'severe' | 'critical'
): 'icon_shake' | 'darken' | 'red_flash' | 'none' {
  const feedbackMap: Record<
    'minor' | 'moderate' | 'severe' | 'critical',
    'icon_shake' | 'darken' | 'red_flash' | 'none'
  > = {
    minor: 'icon_shake',
    moderate: 'darken',
    severe: 'red_flash',
    critical: 'none'
  };
  return feedbackMap[severity];
}

/**
 * 获取挫折事件的描述文本
 */
export function getSetbackDescription(eventId: string): string | null {
  const event = getSetbackEvent(eventId);
  return event?.description || null;
}

/**
 * 计算总体挫折风险等级
 */
export function calculateSetbackRiskLevel(
  player: PlayerState,
  globalMultiplier: number = 1.0
): 'low' | 'medium' | 'high' | 'critical' {
  let totalProbability = 0;

  for (const event of SETBACK_EVENTS) {
    if (canSetbackEventTrigger(event, player.age, player.constitution)) {
      totalProbability += calculateSetbackProbability(event, globalMultiplier);
    }
  }

  if (totalProbability >= 30) {
    return 'critical';
  } else if (totalProbability >= 20) {
    return 'high';
  } else if (totalProbability >= 10) {
    return 'medium';
  }
  return 'low';
}

/**
 * 获取挫折事件统计
 */
export function getSetbackStatistics(): {
  totalEvents: number;
  bySeverity: Record<string, number>;
  averageProbability: number;
} {
  const bySeverity: Record<string, number> = {
    minor: 0,
    moderate: 0,
    severe: 0,
    critical: 0
  };

  for (const event of SETBACK_EVENTS) {
    bySeverity[event.severity]++;
  }

  const totalProbability = SETBACK_EVENTS.reduce(
    (sum, event) => sum + event.baseProbability,
    0
  );

  return {
    totalEvents: SETBACK_EVENTS.length,
    bySeverity,
    averageProbability: totalProbability / SETBACK_EVENTS.length
  };
}
