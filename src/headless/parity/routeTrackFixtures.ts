/**
 * Shared route-track fixtures for GameProcessSimulator and headless parity replay.
 */

import type { GameState } from '../../types/eventTypes';

export type RouteTrack = 'official' | 'beggars' | 'demonic' | 'sect' | 'wanderer';

export function applyRouteTrackPreparation(
  state: GameState,
  routeTrack: RouteTrack | undefined,
  age: number,
): void {
  if (!routeTrack) return;

  const player = state.player;
  if (!player) return;

  const flags = {
    ...(state.flags || {}),
    ...(player.flags || {}),
  };
  state.flags = flags;
  player.flags = flags;

  if (routeTrack === 'official') {
    if (age >= 1 && age <= 6) {
      flags.origin_scholar_family = true;
      player.knowledge = Math.max(player.knowledge || 0, 14);
    }
    if (age >= 20 && age <= 32) {
      flags.origin_scholar_family = true;
      player.knowledge = Math.max(player.knowledge || 0, 16);
      player.charisma = Math.max(player.charisma || 0, 10);
      player.reputation = Math.max(player.reputation || 0, 20);
    }
  }

  if (routeTrack === 'beggars' && age >= 13 && age <= 22) {
    player.chivalry = Math.max(player.chivalry || 0, 18);
    player.connections = Math.max(player.connections || 0, 16);
  }

  if (routeTrack === 'demonic' && age >= 13 && age <= 22) {
    player.chivalry = Math.min(player.chivalry || 0, 28);
    player.chivalry = Math.max(player.chivalry, 8);
    player.martialPower = Math.max(player.martialPower || 0, 12);
  }

  if (routeTrack === 'sect' && age >= 10 && age <= 22) {
    player.knowledge = Math.max(player.knowledge || 0, 14);
    player.chivalry = Math.max(player.chivalry || 0, 16);
    player.martialPower = Math.max(player.martialPower || 0, 10);
  }

  if (routeTrack === 'wanderer' && age >= 13 && age <= 22) {
    player.chivalry = Math.max(player.chivalry || 0, 18);
    player.connections = Math.max(player.connections || 0, 14);
  }
}

export function enforceRouteTrackIsolation(state: GameState, routeTrack: RouteTrack | undefined): void {
  if (!routeTrack || !['sect', 'wanderer', 'demonic'].includes(routeTrack)) {
    return;
  }

  const player = state.player;
  if (!player) return;

  const flags = {
    ...(state.flags || {}),
    ...(player.flags || {}),
  };
  state.flags = flags;
  player.flags = flags;
  const clearFlag = (flagName: string) => {
    if (!flags[flagName]) return;
    flags[flagName] = false;
  };

  if (routeTrack === 'sect') {
    clearFlag('route_demonic');
    clearFlag('route_beggars');
    clearFlag('route_official');
  } else if (routeTrack === 'wanderer') {
    clearFlag('route_demonic');
    clearFlag('route_orthodox');
    clearFlag('route_beggars');
  } else if (routeTrack === 'demonic') {
    clearFlag('route_orthodox');
    clearFlag('route_beggars');
    clearFlag('route_official');
  }
}

export function applyRouteTrackFixtureBootstrap(
  state: GameState,
  routeTrack: RouteTrack | undefined,
  age: number,
): void {
  if (!routeTrack) return;

  enforceRouteTrackIsolation(state, routeTrack);

  const player = state.player;
  if (!player) return;

  const flags = {
    ...(state.flags || {}),
    ...(player.flags || {}),
  };
  state.flags = flags;
  player.flags = flags;
  const syncFlag = (flagName: string) => {
    flags[flagName] = true;
  };

  if (routeTrack === 'official') {
    if (age === 22 && !flags.route_official) {
      flags.origin_scholar_family = true;
      syncFlag('route_official');
    }
    if (flags.route_official && age >= 24 && !flags.official_first_post) {
      flags.official_first_post = true;
    }
    if (flags.route_official && age >= 34 && !flags.route_official_completed) {
      syncFlag('route_official_completed');
    }
  }

  if (routeTrack === 'beggars') {
    if (age === 14 && !flags.route_beggars) {
      syncFlag('route_beggars');
      flags.current_sect = 'beggars';
    }
    if (flags.route_beggars && age >= 20 && !flags.beggars_rumor_network) {
      flags.beggars_rumor_network = true;
    }
    if (flags.route_beggars && age >= 22 && !flags.beggars_strife_done) {
      flags.beggars_strife_done = true;
    }
    if (flags.route_beggars && age >= 26 && !flags.route_beggars_completed) {
      syncFlag('route_beggars_completed');
    }
  }

  if (routeTrack === 'demonic') {
    if (age >= 7 && !flags.p8_route_demonic) {
      flags.p8_route_demonic = true;
    }
    if (age === 14 && !flags.route_demonic) {
      syncFlag('route_demonic');
    }
    if (flags.route_demonic && age >= 20) {
      flags.demonic_trial_active = true;
      flags.demonic_trial_shadow_done = true;
      flags.demonic_trial_blood_done = true;
    }
    if (flags.route_demonic && age >= 24 && !flags.demonic_leader) {
      flags.demonic_leader = true;
      flags.demonic_path_usurp = true;
    }
    if (flags.route_demonic && age >= 28 && !flags.route_demonic_completed) {
      syncFlag('route_demonic_completed');
    }
  }

  if (routeTrack === 'sect') {
    if (age >= 7 && !flags.p8_route_martial) {
      flags.p8_route_martial = true;
    }
    if (age === 13 && !flags.route_orthodox) {
      syncFlag('route_orthodox');
      flags.orthodox_trial_active = true;
    }
    if (flags.route_orthodox && age >= 16) {
      flags.orthodox_trial_mind_done = true;
      flags.orthodox_trial_force_done = true;
    }
    if (flags.route_orthodox && age >= 18 && !flags.orthodox_trial_service_done) {
      flags.orthodox_trial_service_done = true;
    }
    if (flags.route_orthodox && age >= 20 && !flags.orthodox_trial_completed) {
      flags.orthodox_trial_completed = true;
    }
    if (flags.route_orthodox && age >= 26 && !flags.sect_trial_completed) {
      flags.sect_trial_completed = true;
    }
  }

  if (routeTrack === 'wanderer') {
    if (age === 13 && !flags.route_wanderer) {
      syncFlag('route_wanderer');
    }
    if (flags.route_wanderer && age >= 20 && !flags.hero_first_case) {
      flags.hero_first_case = true;
    }
    if (flags.route_wanderer && age >= 25 && !flags.save_village) {
      flags.save_village = true;
    }
    if (flags.route_wanderer && age >= 31 && age <= 50) {
      player.chivalry = Math.max(player.chivalry || 0, 35);
      player.reputation = Math.max(player.reputation || 0, 40);
      player.connections = Math.max(player.connections || 0, 15);
    }
  }
}

export function ensureYearAdvanced(engine: { getGameState(): GameState; advanceTime(years: number): void }, ageBeforeEvent: number): void {
  const state = engine.getGameState();
  if (!state.player?.alive || hasGameEnded(state)) {
    return;
  }
  const ageAfter = state.player?.age ?? 0;
  if (ageAfter <= ageBeforeEvent) {
    engine.advanceTime(1);
  }
}

export function hasGameEnded(state: GameState | null | undefined): boolean {
  if (!state) return false;
  return state.flags?.ending_triggered === true || Boolean(state.ending);
}
