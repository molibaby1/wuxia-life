import type { GameState } from '../types/eventTypes';

export function readMergedFlags(state: GameState): Record<string, unknown> {
  return {
    ...(state.flags ?? {}),
    ...(state.player?.flags ?? {}),
  };
}

export function flagIsActive(flags: Record<string, unknown>, flagName: string): boolean {
  const value = flags[flagName];
  if (value === undefined || value === null || value === false) {
    return false;
  }
  if (value === 'neutral' || value === 'none') {
    return false;
  }
  return true;
}

export function lifePathSignalActive(
  state: GameState,
  signal: string,
): boolean {
  const lifePath = state.lifePath;
  if (!lifePath) {
    return false;
  }
  const relationships = lifePath.relationships;
  const commitments = lifePath.commitments;
  switch (signal) {
    case 'ally':
      return (relationships?.allies?.length ?? 0) > 0;
    case 'enemy':
      return (relationships?.enemies?.length ?? 0) > 0;
    case 'mentor':
      return (relationships?.mentors?.length ?? 0) > 0;
    case 'disciple':
      return (relationships?.disciples?.length ?? 0) > 0;
    case 'must_protect':
      return (commitments?.mustProtect?.length ?? 0) > 0;
    case 'sworn_enemy':
      return (commitments?.swornEnemies?.length ?? 0) > 0;
    default:
      return false;
  }
}

export type P17MaintenanceDimension =
  | 'reputation'
  | 'followers'
  | 'alliances'
  | 'internal_stability'
  | 'external_threat';

const DIMENSION_CEILINGS: Record<P17MaintenanceDimension, number> = {
  reputation: 100,
  followers: 80,
  alliances: 80,
  internal_stability: 100,
  external_threat: 100,
};

export function inferMaintenanceDimensionLevel(
  state: GameState,
  dimension: P17MaintenanceDimension,
): number {
  const player = state.player;
  if (!player) {
    return 0;
  }
  switch (dimension) {
    case 'reputation':
      return Math.min(1, (player.reputation ?? 0) / DIMENSION_CEILINGS.reputation);
    case 'followers':
      return Math.min(
        1,
        ((player.connections ?? 0) + (state.lifePath?.relationships?.disciples?.length ?? 0) * 10) /
          DIMENSION_CEILINGS.followers,
      );
    case 'alliances':
      return Math.min(
        1,
        ((player.connections ?? 0) + (state.lifePath?.relationships?.allies?.length ?? 0) * 8) /
          DIMENSION_CEILINGS.alliances,
      );
    case 'internal_stability':
      return Math.min(1, (player.influence ?? 0) / DIMENSION_CEILINGS.internal_stability);
    case 'external_threat': {
      const martial = player.martialPower ?? 0;
      const influence = player.influence ?? 0;
      return Math.min(1, (martial * 0.6 + influence * 0.4) / DIMENSION_CEILINGS.external_threat);
    }
    default:
      return 0;
  }
}
