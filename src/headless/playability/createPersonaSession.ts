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

const DEFAULT_CATALOG_VERSION = '1.0.0';

export function createPersonaHeadlessSession(
  persona: P8Persona,
  catalogVersion = DEFAULT_CATALOG_VERSION,
): HeadlessEngineSession {
  return HeadlessEngineSessionImpl.create(
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
}

/** Apply P16/P8 youth route seeds at age 13 — same lifecycle point as GameProcessSimulator. */
export function applyPersonaYouthRouteSeedsAtAge(session: HeadlessEngineSession, persona: P8Persona): void {
  const state = session.getRuntimeState();
  const age = state.player?.age ?? 0;
  if (age !== 13) return;
  Object.assign(state.flags, resolvePersonaYouthRouteSeeds(persona));
}
