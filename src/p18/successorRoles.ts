import { getWorldProfile } from '../narrative/worldProfile';
import type { SuccessorRoleConfig } from '../narrative/profile/types';
import type { GameState } from '../types/eventTypes';
import { flagIsActive, inferSuccessorQuality, lifePathSignalActive, readMergedFlags } from './stateAccess';

export interface ActiveSuccessorRole {
  config: SuccessorRoleConfig;
  effectiveQuality: number;
  source: string;
}

function roleMatches(
  config: SuccessorRoleConfig,
  state: GameState,
  flags: Record<string, unknown>,
  baseQuality: number,
): ActiveSuccessorRole | null {
  const triggerFlag = config.triggerFlags?.find(flag => flagIsActive(flags, flag));
  if (triggerFlag) {
    return {
      config,
      effectiveQuality: Math.min(1, baseQuality * config.cultivationCapacityWeight),
      source: `flag:${triggerFlag}`,
    };
  }
  const lifePathSignal = config.lifePathSignals?.find(signal => lifePathSignalActive(state, signal));
  if (lifePathSignal) {
    return {
      config,
      effectiveQuality: Math.min(1, baseQuality * config.cultivationCapacityWeight),
      source: `lifePath:${lifePathSignal}`,
    };
  }
  return null;
}

export function resolveActiveSuccessorRoles(
  state: GameState,
  worldId = 'wuxia',
): ActiveSuccessorRole[] {
  const configs = getWorldProfile(worldId).successorRoleConfigs ?? [];
  const flags = readMergedFlags(state);
  const baseQuality = inferSuccessorQuality(state);
  const active: ActiveSuccessorRole[] = [];
  const seen = new Set<string>();

  for (const config of configs) {
    if (seen.has(config.id)) {
      continue;
    }
    const match = roleMatches(config, state, flags, baseQuality);
    if (match) {
      seen.add(config.id);
      active.push(match);
    }
  }

  return active;
}

export function getMaxSuccessorQuality(active: ActiveSuccessorRole[]): number {
  if (active.length === 0) {
    return 0;
  }
  return Math.max(...active.map(item => item.effectiveQuality));
}
