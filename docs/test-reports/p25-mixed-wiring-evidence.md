# P25 Mixed Achievement Wiring Evidence (US-014)

Generated: 2026-06-23

## Layer choice (simulation-driven workflow)

| Issue | Layer | Rationale |
| --- | --- | --- |
| `route_wealth` commitment not readable by mixed gates | **world profile / content** | `p22_early_wealth_route_fork` already maps `route_wealth` in `narrativeScheduling`; added durable `route_wealth_committed` alongside `p22_wealth_route_forked` for explicit mixed-gate consumption. |
| Merchant empire / invest flags absent from runtime loader | **content** (`merchant.json` → `EventLoader`) | `merchant_empire`, `merchant_wealthy`, `merchant_invest_*` authored in `merchant.json` but not imported; wired like Wave 1 `medical.json`. |

## Wiring

- **route_wealth:** `p22_early_wealth_route_fork` choices set `route_wealth_committed` + `p22_wealth_route_forked`; `narrativeScheduling.routePoints[].routeId = route_wealth`.
- **merchant line:** `merchant.json` loaded; flags `merchant_empire`, `merchant_wealthy`, `merchant_invest_*` reachable via merchant chain events.
- **Traceability:** `src/p25/mixedUnlockTraceability.ts` → `buildMixedUnlockTraceReport` (flag setter events + mid-life surface pointers).

## Regression guard

Wave 1 mainstream and Wave 2 pinnacle unlock tests unchanged; mixed gates use separate `WUXIA_MIXED_DESTINY_OUTCOMES` array.
