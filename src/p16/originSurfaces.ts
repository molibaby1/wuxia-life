import { getWorldProfile } from '../narrative/worldProfile';
import type { WorldProfileOriginSurface } from '../narrative/profile/types';
import type { GameState, PlayerState } from '../types/eventTypes';
import { readPlayerNumeric } from '../utils/playerStatAccess';
import { resolvePrimaryOriginFamilyFlag } from './primaryOriginFlag';
import { PRIMARY_ORIGIN_TO_TRAIT_ORIGIN } from './primaryOriginTraitBridge';

export function getOriginSurfaceForPlayer(
  player: PlayerState | undefined,
  worldId = 'wuxia',
): WorldProfileOriginSurface | undefined {
  const originId = player?.traitProfile?.origin;
  if (!originId) return undefined;
  const surfaces = getWorldProfile(worldId).originSurfaces ?? [];
  return surfaces.find(surface => surface.originId === originId);
}

/**
 * Childhood / sample-line gameplay: primary origin flag is canonical; trait-only origin is ignored.
 */
export function getCanonicalOriginSurfaceForGameplay(
  player?: PlayerState,
  flags?: Record<string, unknown>,
  worldId = 'wuxia',
): WorldProfileOriginSurface | undefined {
  const state = {
    player,
    flags: { ...(flags ?? {}), ...(player?.flags ?? {}) },
  } as GameState;
  const primary = resolvePrimaryOriginFamilyFlag(state);
  if (!primary) return undefined;
  return getOriginSurfaceById(PRIMARY_ORIGIN_TO_TRAIT_ORIGIN[primary], worldId);
}

export function getOriginSurfaceById(
  originId: string,
  worldId = 'wuxia',
): WorldProfileOriginSurface | undefined {
  const surfaces = getWorldProfile(worldId).originSurfaces ?? [];
  return surfaces.find(surface => surface.originId === originId);
}

/** Material-condition weight from family resources and hardship exposure. */
export function getOriginMaterialEventMultiplier(
  surface: WorldProfileOriginSurface | undefined,
  eventTags: Set<string>,
): number {
  if (!surface) return 1;
  let multiplier = 1;
  const { familyResources, hardshipExposure } = surface.immediateConditions;
  if (eventTags.has('survival') || eventTags.has('family')) {
    multiplier *= 0.85 + hardshipExposure * 0.5;
    multiplier *= 1.1 - familyResources * 0.25;
  }
  if (eventTags.has('business')) {
    multiplier *= 0.7 + familyResources * 0.6;
  }
  for (const bias of surface.eventBiasTags) {
    if (eventTags.has(bias.tag)) {
      multiplier *= bias.multiplier;
    }
  }
  return Math.max(0.35, Math.min(2.5, multiplier));
}

/** Guidance/social worldview weight for upbringing-biased childhood pools. */
export function getOriginGuidanceEventMultiplier(
  surface: WorldProfileOriginSurface | undefined,
  eventTags: Set<string>,
): number {
  if (!surface) return 1;
  let multiplier = 1;
  const { guidanceQuality, socialCapital } = surface.immediateConditions;
  if (eventTags.has('comprehension') || eventTags.has('discipline')) {
    multiplier *= 0.75 + guidanceQuality * 0.5;
  }
  if (eventTags.has('social') || eventTags.has('family')) {
    multiplier *= 0.8 + socialCapital * 0.45;
  }
  return Math.max(0.35, Math.min(2.5, multiplier));
}

export function getOriginChildhoodEventMultiplier(
  player: PlayerState | undefined,
  eventTags: Set<string>,
  worldId = 'wuxia',
): number {
  const age = player?.age ?? 0;
  if (age > 18) return 1;
  const surface = getOriginSurfaceForPlayer(player, worldId);
  const material = getOriginMaterialEventMultiplier(surface, eventTags);
  const guidance = getOriginGuidanceEventMultiplier(surface, eventTags);
  return Math.max(0.35, Math.min(2.5, material * guidance));
}

export function summarizeOriginResourceContrast(
  originA: string,
  originB: string,
  worldId = 'wuxia',
): {
  originA: string;
  originB: string;
  materialDelta: number;
  guidanceDelta: number;
  materiallyDifferent: boolean;
} {
  const surfaceA = getOriginSurfaceById(originA, worldId);
  const surfaceB = getOriginSurfaceById(originB, worldId);
  const materialA =
    (surfaceA?.immediateConditions.familyResources ?? 0) +
    (surfaceA?.immediateConditions.hardshipExposure ?? 0);
  const materialB =
    (surfaceB?.immediateConditions.familyResources ?? 0) +
    (surfaceB?.immediateConditions.hardshipExposure ?? 0);
  const guidanceA =
    (surfaceA?.immediateConditions.guidanceQuality ?? 0) +
    (surfaceA?.immediateConditions.socialCapital ?? 0);
  const guidanceB =
    (surfaceB?.immediateConditions.guidanceQuality ?? 0) +
    (surfaceB?.immediateConditions.socialCapital ?? 0);
  const materialDelta = Math.abs(materialA - materialB);
  const guidanceDelta = Math.abs(guidanceA - guidanceB);
  return {
    originA,
    originB,
    materialDelta,
    guidanceDelta,
    materiallyDifferent: materialDelta >= 0.35 || guidanceDelta >= 0.35,
  };
}

export function readDimensionValueForDestiny(
  player: PlayerState | undefined,
  flags: Record<string, unknown>,
  dimension: string,
): number {
  if (!player) return 0;
  switch (dimension) {
    case 'skill_growth':
      return readPlayerNumeric(player, 'martialPower');
    case 'social_capital':
      return readPlayerNumeric(player, 'connections');
    case 'resources':
      return readPlayerNumeric(player, 'money');
    case 'reputation':
      return readPlayerNumeric(player, 'reputation');
    default:
      return flags[dimension] ? 1 : 0;
  }
}
