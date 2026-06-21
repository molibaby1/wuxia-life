import type { GameState } from '../types/eventTypes';
import { getOriginInfantPassiveChains } from '../data/originInfantPassiveChain';

export const PRIMARY_ORIGIN_FAMILY_FLAGS = [
  'origin_scholar_family',
  'origin_wuxia_family',
  'origin_merchant_family',
  'origin_frontier',
] as const;

export type PrimaryOriginFamilyFlag = (typeof PRIMARY_ORIGIN_FAMILY_FLAGS)[number];

function hasFlag(state: GameState, flag: string): boolean {
  return !!(state.flags?.[flag] || state.player?.flags?.[flag]);
}

/**
 * Canonical primary origin from origin_background four-choice flags.
 * Priority matches Stage-5 infant chain order / resolveOriginTags.
 * Returns null before origin_background completes (no primary flag on state).
 */
export function resolvePrimaryOriginFamilyFlag(state: GameState): PrimaryOriginFamilyFlag | null {
  for (const chain of getOriginInfantPassiveChains()) {
    if (hasFlag(state, chain.originFlag)) {
      return chain.originFlag as PrimaryOriginFamilyFlag;
    }
  }
  return null;
}
