# P6B Integration Baseline (US-001)

Read-only inventory of P5 headless, Web runtime, snapshot, catalog, and save boundaries before PostgreSQL-backed session API work.

## P5 Headless Session Construction

| Area | Location | Notes |
| --- | --- | --- |
| Factory | `src/headless/session/HeadlessEngineSessionImpl.ts` | `HeadlessEngineSessionImpl.create(options, partialDeps?)` |
| Contract | `src/headless/session/HeadlessEngineSession.ts` | `hydrate`, `getNextEvent`, `progressAutomatic`, `executeChoice`, `serialize`, `restart` |
| Dependencies | `src/headless/dependencies/HeadlessSessionDependencies.ts` | `catalog`, `random`, `time`, `snapshot`, optional `logger` |
| Default catalog | `src/headless/catalog/InMemoryEventCatalogAdapter.ts` | Version `1.0.0`, reads bundled `eventLoader` |
| Snapshot IO | `src/headless/snapshot/SnapshotConverter.ts` | Runtime `GameState` ↔ `GameStateSnapshot` |
| RNG / time | `src/headless/adapters/randomSource.ts`, `timeSource.ts` | Injectable for determinism |

New-game path: `create({ playerName, gender, catalogVersion?, randomSeed? })` → `GameEngineIntegration.startNewGame`.

Restore path: `create({ snapshot })` → `hydrateSync` from validated snapshot.

## Web Entry Points (Current Local Save)

| Flow | Entry | Persistence |
| --- | --- | --- |
| New game | `App.vue` → `useNewGameEngine.startNewGame` | `SaveManager` / `localStorage` via composable |
| Continue | `loadGameFromSave(saveId)` | Local save list |
| Choice | `GameScreen` → `handleChoice` | In-memory engine + optional manual/auto save |
| Manual save | `saveCurrentGame` in composable | `saveManager.saveGame` |
| Load list | `getAllSaves` | Browser storage |
| Ending resume | `App.vue` `handleLoadLatestSaveFromEnding` | Latest local save |

Presentation: `StartScreen.vue` (name/gender only; no slot UI yet), `GameScreen.vue`, `EndingScreen.vue`.

## Snapshot, Replay, Catalog, Validation

| Concern | Location |
| --- | --- |
| Snapshot contract | `src/contracts/gameStateSnapshot.ts`, `docs/contracts/game-state-snapshot-contract.md` |
| Snapshot validation | `src/contracts/validation/contractValidation.ts` (`validateGameStateSnapshot`) |
| Choice execution | `src/contracts/choiceExecution.ts` |
| Replay log contract | `src/contracts/replayLog.ts` |
| Catalog contract | `src/contracts/eventCatalog.ts` |
| Headless catalog read | `src/headless/catalog/EventCatalogReadService.ts` |
| P4 API draft | `docs/contracts/backend-api-draft-boundaries.md` |
| Future DB model | `docs/contracts/future-database-model-boundary.md` |

## Service-Path Blockers

| Risk | Evidence | P6B mitigation |
| --- | --- | --- |
| Vue reactivity in engine state | `useNewGameEngine` holds `reactive(engineState)`; must not serialize proxies | Backend uses headless session only; Web sends tokens + ids, not state deltas |
| Global singletons | `gameEngine` in `GameEngineIntegration`, `eventLoader`, `saveManager` | Server constructs per-request `HeadlessEngineSessionImpl` with injected deps |
| Browser storage | `SaveManager`, `DifficultyManager` localStorage | Replace Web save loop with API + `deviceToken` / `sessionToken` in platform adapter |
| Direct `console.log` in engine | Various core modules | Backend injects `noopLogger` or structured logger (US-022) |
| `window.alert` / `prompt` | `SaveManager.vue`, `App.vue` ending load | Slot/overwrite flows use in-UI confirmation, not `prompt` |

## Recommended Integration Order

1. Schema + migrations + pool (US-003–006)
2. Device bootstrap + save slots + snapshots + catalog seed (US-007–011)
3. Session create/restore + choice + concurrency (US-012–020)
4. Web API client + slot UI + gameplay switch (US-024–026)
5. P6B gate + closure (US-027–030)

## Non-Goals for This Document

No business code was modified for US-001.
