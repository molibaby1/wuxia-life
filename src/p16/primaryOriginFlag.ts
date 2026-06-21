import type { GameState } from '../types/eventTypes';
import { getOriginInfantPassiveChains } from '../data/originInfantPassiveChain';

export const PRIMARY_ORIGIN_FAMILY_FLAGS = [
  'origin_scholar_family',
  'origin_wuxia_family',
  'origin_merchant_family',
  'origin_frontier',
] as const;

export type PrimaryOriginFamilyFlag = (typeof PRIMARY_ORIGIN_FAMILY_FLAGS)[number];

export function isPrimaryOriginFamilyFlag(flag: string): flag is PrimaryOriginFamilyFlag {
  return (PRIMARY_ORIGIN_FAMILY_FLAGS as readonly string[]).includes(flag);
}

function hasFlag(state: GameState, flag: string): boolean {
  return !!(state.flags?.[flag] || state.player?.flags?.[flag]);
}

function presentPrimaryOriginFamilyFlags(state: GameState): PrimaryOriginFamilyFlag[] {
  return PRIMARY_ORIGIN_FAMILY_FLAGS.filter(flag => hasFlag(state, flag));
}

/** origin_background choice writes event_record with target = primary flag id. */
function resolveOriginBackgroundChoiceFlag(state: GameState): PrimaryOriginFamilyFlag | null {
  let chosen: PrimaryOriginFamilyFlag | null = null;
  for (const record of state.player?.events ?? []) {
    if (record.eventId && isPrimaryOriginFamilyFlag(record.eventId)) {
      chosen = record.eventId;
    }
  }
  return chosen;
}

/** Mutate flags map: keep one primary origin flag, drop the other three. */
export function applyPrimaryOriginFamilyExclusivity(
  flags: Record<string, boolean | undefined>,
  keepFlag: PrimaryOriginFamilyFlag,
): Record<string, boolean | undefined> {
  const next = { ...flags, [keepFlag]: true };
  for (const other of PRIMARY_ORIGIN_FAMILY_FLAGS) {
    if (other !== keepFlag) {
      delete next[other];
    }
  }
  return next;
}

/**
 * Canonical primary origin from origin_background four-choice flags.
 * When multiple primary flags coexist (trait startingFlags + choice), the
 * origin_background event_record wins (Stage-6/7 four-choice priority).
 * Single-flag fallback uses infant chain order for legacy reads.
 */
export function resolvePrimaryOriginFamilyFlag(state: GameState): PrimaryOriginFamilyFlag | null {
  const present = presentPrimaryOriginFamilyFlags(state);
  if (present.length === 0) return null;
  if (present.length === 1) return present[0];

  const fromChoice = resolveOriginBackgroundChoiceFlag(state);
  if (fromChoice && hasFlag(state, fromChoice)) {
    return fromChoice;
  }

  for (const chain of getOriginInfantPassiveChains()) {
    if (hasFlag(state, chain.originFlag)) {
      return chain.originFlag as PrimaryOriginFamilyFlag;
    }
  }
  return null;
}
