# P22 Live-Ops Baseline Scope And Deferral Rules (US-006)

## In-Scope Baseline Proof

P22 must prove in practice:

1. Five baseline pools with explicit coverage expectations
2. Ten config-only expansion events across early/mid/late bands
3. Three live-ops content waves (`WUXIA_LIVE_OPS_WAVE_CONFIGS`)
4. Three tuning samples stabilizing expanded pools
5. One bounded expansion-and-tuning wave with validation artifacts

## Wave Scope

| Wave | Target weakness | Workflow |
|------|-----------------|----------|
| `p22_wave_early_growth` | frontier/streetborn origin variance | audit → author → validate → gate:p22 |
| `p22_wave_mid_consequence` | wealth merchant + mentor mid-life | weak-spot → author → matrix → tune |
| `p22_wave_late_closure` | hermit fade + teaching legacy | closure audit → author → tune density |

## Deferred Beyond P22

- Automated weekly content drops
- Multi-theme profile packs
- Runtime scheduling policy rewrites
- Player-facing content-library browser UI

## Profile-First Loading Note

P22 expansion JSON is wired through `events.json` → `EventLoader` like other line packs. `getAvailableEvents()` excludes `live_ops_expansion` events until `flags.p22_live_ops_active` is set. New games with weak-origin bands (`frontier_military`, `poor_family`, `streetborn`, `merchant_house`) receive the flag via `src/p22/liveOpsActivation.ts` in `startNewGame` (default on). Playability/persona simulators pass `enableLiveOpsActivation: false` so gate personas stay isolated.

## Post-P22 Comparison

After each future wave, compare:

- `expansionEventCount` and per-pool `healthClass`
- `weakSpots` severity counts
- tuning comparison slice deltas
