import type { GameState, OriginId } from '../types/eventTypes';

export const P22_LIVE_OPS_ACTIVE_FLAG = 'p22_live_ops_active';

/** Origins aligned with P22 weak archetype / thin-pool audit bands. */
export const P22_WEAK_ORIGIN_IDS: ReadonlySet<OriginId> = new Set([
  'frontier_military',
  'poor_family',
  'streetborn',
  'merchant_house',
]);

export function shouldActivateLiveOpsForOrigin(originId: OriginId | string | undefined): boolean {
  if (!originId) return false;
  return P22_WEAK_ORIGIN_IDS.has(originId as OriginId);
}

export function applyLiveOpsActivationFlags<T extends Record<string, unknown>>(
  flags: T,
  originId: OriginId | undefined,
): T & { p22_live_ops_active?: boolean; p22_weak_origin_band?: boolean } {
  if (!originId || !shouldActivateLiveOpsForOrigin(originId)) {
    return flags;
  }
  return {
    ...flags,
    [P22_LIVE_OPS_ACTIVE_FLAG]: true,
    p22_weak_origin_band: true,
  };
}

export function applyLiveOpsActivationToState(state: GameState, originId: OriginId | undefined): GameState {
  const mergedFlags = {
    ...(state.flags ?? {}),
    ...(state.player?.flags ?? {}),
  };
  const activated = applyLiveOpsActivationFlags(mergedFlags, originId);
  return {
    ...state,
    flags: activated,
    player: state.player,
  };
}
