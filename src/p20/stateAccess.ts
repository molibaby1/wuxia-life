import type { GameState } from '../types/eventTypes';

export function getMergedFlags(state: GameState): Record<string, boolean | number | string> {
  return {
    ...(state.flags ?? {}),
    ...(state.player?.flags ?? {}),
  };
}

export function hasAnyFlag(
  flags: Record<string, boolean | number | string>,
  keys: string[] | undefined,
): boolean {
  if (!keys?.length) {
    return false;
  }
  return keys.some(key => Boolean(flags[key]));
}

export function hasAllFlags(
  flags: Record<string, boolean | number | string>,
  keys: string[] | undefined,
): boolean {
  if (!keys?.length) {
    return false;
  }
  return keys.every(key => Boolean(flags[key]));
}

export function getPlayerAge(state: GameState): number {
  return state.player?.age ?? 0;
}

export function getOriginId(state: GameState): string | undefined {
  const fromFlag = state.flags?.origin_id ?? state.flags?.originId;
  if (typeof fromFlag === 'string') {
    return fromFlag;
  }
  return undefined;
}

export function getActiveRouteKeys(state: GameState): string[] {
  const keys: string[] = [];
  const flags = getMergedFlags(state);
  for (const [key, value] of Object.entries(flags)) {
    if (!value) {
      continue;
    }
    if (key.startsWith('p8_route_') || key.startsWith('route_')) {
      keys.push(key.replace(/^p8_route_/, '').replace(/^route_/, ''));
    }
  }
  if (state.lifePath?.faction) {
    keys.push(state.lifePath.faction);
  }
  return [...new Set(keys)];
}
