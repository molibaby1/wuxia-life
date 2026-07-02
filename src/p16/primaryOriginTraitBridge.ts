import { traitSystem } from '../core/TraitSystem';
import { applyLiveOpsActivationToState } from '../p22/liveOpsActivation';
import type { GameState, OriginId } from '../types/eventTypes';
import type { PrimaryOriginFamilyFlag } from './primaryOriginFlag';

/**
 * Childhood / sample-line / merchant HVG origin boundaries:
 * - Player-facing four-choice truth: `resolvePrimaryOriginFamilyFlag()` on origin_*_family flags
 * - Latent trait flavor after new game: coreTalent / weakness / temperament only (no origin yet)
 * - After origin_background: sync `traitProfile.origin` + `origin_id` from the chosen primary flag
 * - `traitProfile.origin` alone must not gate childhood merchant HVG (flag is canonical)
 */
export const PRIMARY_ORIGIN_TO_TRAIT_ORIGIN: Record<PrimaryOriginFamilyFlag, OriginId> = {
  origin_merchant_family: 'merchant_house',
  origin_scholar_family: 'scholar_house',
  origin_wuxia_family: 'martial_family',
  origin_frontier: 'frontier_military',
};

/** Bind trait origin metadata after origin_background; stats come from choice effects, not TraitSystem origin config. */
export function syncTraitOriginFromPrimaryChoice(
  state: GameState,
  primaryFlag: PrimaryOriginFamilyFlag,
): GameState {
  const originId = PRIMARY_ORIGIN_TO_TRAIT_ORIGIN[primaryFlag];
  if (!state.player) {
    return state;
  }

  const player = traitSystem.bindTraitOrigin(state.player, originId);
  const flags = {
    ...(state.flags ?? {}),
    ...(player.flags ?? {}),
    origin_id: originId,
  };
  const profile = player.traitProfile;
  let next: GameState = {
    ...state,
    flags,
    player: {
      ...player,
      flags,
    },
  };
  if (profile) {
    next = applyLiveOpsActivationToState(next, profile);
  }
  return next;
}
