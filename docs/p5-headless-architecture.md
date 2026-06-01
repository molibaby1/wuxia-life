# P5 Headless Architecture

## Headless session

- **Interface:** `HeadlessEngineSession` (`src/headless/session/HeadlessEngineSession.ts`)
- **Implementation:** `HeadlessEngineSessionImpl` — Node constructible, injected dependencies, wraps `GameEngineIntegration` instance (core still Vue-reactive internally; headless package has no direct Vue imports).

### Methods

`hydrate`, `getNextEvent`, `progressAutomatic`, `executeChoice`, `serialize`, `restart`, `getTerminalState`, `getLifeMemory`.

## Dependencies

See `HeadlessSessionDependencies`: catalog, random, time, snapshot converter, optional logger.

Forbidden in `src/headless/**`: Vue, DOM, browser storage, `prompt`, `alert`, `requestAnimationFrame`.

## Catalog

- **Interface:** `EventCatalogReadService`
- **P5 adapter:** `InMemoryEventCatalogAdapter` (bundled JSON via existing `EventLoader` data)
- **Future HTTP replacement:** implement the same interface; engine keeps trigger eligibility

## Snapshot

- **Converter:** `DefaultSnapshotConverter`
- **Policy doc:** `docs/contracts/headless-snapshot-conversion-boundary.md`

## Parity

- **Model:** `src/headless/parity/parityModel.ts`
- **Harness:** `src/headless/parity/dualTrackParityHarness.ts`
- **Full 0–50 sample parity:** `npm run test:headless:parity` (see closure report for current status)

## Web adapter

`docs/contracts/web-runtime-adapter-boundary.md`

## Explicit non-goals (P5)

No HTTP API, database, accounts, cloud saves, or mini-program runtime in this phase.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run test:headless` | Headless unit suite |
| `npm run test:headless:parity` | Dual-track 0–50 replay parity |
| `npm run gate:p5` | P5 extraction gate |
