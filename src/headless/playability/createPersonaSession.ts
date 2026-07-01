/**
 * Bootstrap HeadlessEngineSession for a P8 persona new game.
 */

import { HeadlessEngineSessionImpl } from '../session/HeadlessEngineSessionImpl';
import type { HeadlessEngineSession } from '../session/HeadlessEngineSession';
import { createDefaultInMemoryCatalogAdapter } from '../catalog/InMemoryEventCatalogAdapter';
import { defaultSnapshotConverter } from '../snapshot/SnapshotConverter';
import { SeededRandomSource } from '../adapters/randomSource';
import { noopLogger } from '../dependencies/HeadlessSessionDependencies';
import type { P8Persona } from '../../p8/types';
import { resolvePersonaYouthRouteSeeds } from '../../p8/personaYouthRouteSeeds';
import { PERSONA_ROUTE_MAP } from '../../p11/schedulingContext';

const DEFAULT_CATALOG_VERSION = '1.0.0';

export function applyPersonaBootstrapFlags(session: HeadlessEngineSession, persona: P8Persona): void {
  const state = session.getRuntimeState();
  if (!state.flags) {
    state.flags = {};
  }
  if (state.flags.p8_youth_route_seeds_applied) {
    return;
  }
  state.flags.p8_persona_id = persona.id;
  Object.assign(state.flags, resolvePersonaYouthRouteSeeds(persona));
  state.flags.p8_youth_route_seeds_applied = true;
}

export function createPersonaHeadlessSession(
  persona: P8Persona,
  catalogVersion = DEFAULT_CATALOG_VERSION,
): HeadlessEngineSession {
  const session = HeadlessEngineSessionImpl.create(
    {
      playerName: persona.name,
      gender: persona.gender,
      catalogVersion,
      randomSeed: persona.seed,
    },
    {
      catalog: createDefaultInMemoryCatalogAdapter(),
      snapshot: defaultSnapshotConverter,
      logger: noopLogger,
      random: new SeededRandomSource(persona.seed),
    },
  );
  applyPersonaBootstrapFlags(session, persona);
  return session;
}

/** Apply P8/P16 youth route seeds before age-10 mandatory milestones. */
export function applyPersonaYouthRouteSeedsAtAge(session: HeadlessEngineSession, persona: P8Persona): void {
  const state = session.getRuntimeState();
  const age = state.player?.age ?? 0;
  if (age < 8) return;
  if (!state.flags) {
    state.flags = {};
  }
  if (state.flags.p8_youth_route_seeds_applied) return;

  const seeds = { ...resolvePersonaYouthRouteSeeds(persona) };
  if (age < 10 && persona.routePreference === 'demonic') {
    delete seeds.p9_childhood_dark_spark;
  }
  Object.assign(state.flags, seeds);
  state.flags.p8_persona_id = persona.id;
  const routeId = PERSONA_ROUTE_MAP[persona.id];
  if (routeId) {
    state.flags[`p8_${routeId}`] = true;
  }
  state.flags.p8_youth_route_seeds_applied = true;
}
