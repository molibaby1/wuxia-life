import { applyLiveOpsActivationToState } from '../p22/liveOpsActivation';
import type { GameState, OriginId } from '../types/eventTypes';
import type { PrimaryOriginFamilyFlag } from './primaryOriginFlag';

/**
 * Childhood / sample-line / merchant HVG origin boundaries:
 * - Player-facing four-choice truth: `resolvePrimaryOriginFamilyFlag()` on origin_*_family flags
 * - Latent trait flavor after new game: coreTalent / weakness / temperament only (no origin yet)
 * - After origin_background: sync `origin_id` from the chosen primary flag
 * - Origin-dependent behavior reads the canonical flag, not trait state
 */
export const PRIMARY_ORIGIN_TO_ORIGIN_ID: Record<PrimaryOriginFamilyFlag, OriginId> = {
  origin_merchant_family: 'merchant_house',
  origin_scholar_family: 'scholar_house',
  origin_wuxia_family: 'martial_family',
  origin_frontier: 'frontier_military',
};

/** Persist the chosen origin fact after origin_background; traits remain untouched. */
export function syncOriginFromPrimaryChoice(
  state: GameState,
  primaryFlag: PrimaryOriginFamilyFlag,
): GameState {
  const originId = PRIMARY_ORIGIN_TO_ORIGIN_ID[primaryFlag];
  if (!state.player) {
    return state;
  }

  const flags = {
    ...(state.flags ?? {}),
    origin_id: originId,
  };
  const next: GameState = {
    ...state,
    flags,
    player: {
      ...state.player,
      flags: { ...(state.player.flags ?? {}) },
    },
  };
  return applyLiveOpsActivationToState(next, originId);
}
