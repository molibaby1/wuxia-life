import { getWorldProfile } from '../narrative/worldProfile';
import type { RareEventLineConfig } from '../narrative/profile/types';
import type { PlayerState } from '../types/eventTypes';

export interface RareLineRollResult {
  lineId: string;
  label: string;
  triggered: boolean;
  effectiveProbability: number;
  unlocksFlags: string[];
  altersOpportunityTags: string[];
}

function matchesOrigin(line: RareEventLineConfig, originId: string | undefined): boolean {
  if (!line.originConditions?.length) return true;
  if (!originId) return false;
  return line.originConditions.includes(originId);
}

function matchesStage(line: RareEventLineConfig, age: number): boolean {
  const stage = line.stageConditions;
  if (!stage) return true;
  if (stage.minAge !== undefined && age < stage.minAge) return false;
  if (stage.maxAge !== undefined && age > stage.maxAge) return false;
  return true;
}

function matchesPriorChoices(
  line: RareEventLineConfig,
  flags: Record<string, unknown>,
): boolean {
  if (!line.priorChoiceFlags?.length) return true;
  return line.priorChoiceFlags.every(flag => flags[flag]);
}

export function computeRareLineProbability(
  line: RareEventLineConfig,
  player: PlayerState | undefined,
  flags: Record<string, unknown>,
): number {
  const age = player?.age ?? 0;
  const originId = typeof flags.origin_id === 'string' ? flags.origin_id : undefined;
  if (!matchesOrigin(line, originId)) return 0;
  if (!matchesStage(line, age)) return 0;
  if (!matchesPriorChoices(line, flags)) return 0;
  return line.baseProbability;
}

export function rollRareEventLines(
  player: PlayerState | undefined,
  flags: Record<string, unknown>,
  random: () => number = Math.random,
  worldId = 'wuxia',
): RareLineRollResult[] {
  const lines = getWorldProfile(worldId).rareEventLines ?? [];
  return lines.map(line => {
    const effectiveProbability = computeRareLineProbability(line, player, flags);
    const triggered = effectiveProbability > 0 && random() < effectiveProbability;
    return {
      lineId: line.id,
      label: line.label,
      triggered,
      effectiveProbability,
      unlocksFlags: triggered ? (line.unlocksFlags ?? []) : [],
      altersOpportunityTags: triggered ? (line.altersOpportunityTags ?? []) : [],
    };
  });
}

export function applyRareLineFlags(
  flags: Record<string, unknown>,
  rollResults: RareLineRollResult[],
): Record<string, unknown> {
  const next = { ...flags };
  for (const result of rollResults) {
    if (!result.triggered) continue;
    for (const flag of result.unlocksFlags) {
      next[flag] = true;
    }
  }
  return next;
}

export function getRareLineOpportunityMultiplier(
  rollResults: RareLineRollResult[],
  eventTags: Set<string>,
): number {
  let multiplier = 1;
  for (const result of rollResults) {
    if (!result.triggered) continue;
    for (const tag of result.altersOpportunityTags) {
      if (eventTags.has(tag)) {
        multiplier *= 1.25;
      }
    }
  }
  return Math.min(2, multiplier);
}

/** Reconstruct triggered rare lines from durable flags (post-checkpoint). */
export function deriveRareLineRollResultsFromFlags(
  flags: Record<string, unknown>,
  worldId = 'wuxia',
): RareLineRollResult[] {
  const lines = getWorldProfile(worldId).rareEventLines ?? [];
  return lines.map(line => {
    const unlockFlags = line.unlocksFlags ?? [];
    const triggered = unlockFlags.length > 0 && unlockFlags.every(flag => Boolean(flags[flag]));
    return {
      lineId: line.id,
      label: line.label,
      triggered,
      effectiveProbability: triggered ? line.baseProbability : 0,
      unlocksFlags: triggered ? unlockFlags : [],
      altersOpportunityTags: triggered ? (line.altersOpportunityTags ?? []) : [],
    };
  });
}
