# P101 Merchant Magnate Bridge-Origin Endgame Scope Contract

> **Date:** 2026-07-02  
> **Stage:** P101 Wuxia Merchant Magnate Bridge-Origin Endgame Differentiation  
> **Branch:** `codex/p101-wuxia-merchant-magnate-bridge-origin-endgame-differentiation`

---

## 1. Purpose

Lock P101 as a **bounded bridge-origin post-late-life endgame echo sample** for apprentice / tavern / peasant magnate paths. Prevent scope drift into full magnate empire rewrite, native P100 reopening, or `merchant_martial_patron` bridge work.

---

## 2. Bridge-Origin Endgame Echo Event Band

| Field | Value |
| ----- | ----- |
| **New event IDs** | `magnate_endgame_echo_apprentice_craft`, `magnate_endgame_echo_tavern_network`, `magnate_endgame_echo_peasant_grain` |
| **Retained generic** | `magnate_endgame_echo_generic` — unmatched native only (bridge flags removed) |
| **Unchanged native** | `magnate_endgame_echo_ledger_legacy`, `magnate_endgame_echo_caravan_legacy` |
| **Age band** | 58–65 (trigger at age 58) |
| **Prerequisite** | `magnate_late_life_done` && !`magnate_endgame_echo_done` |
| **Shared checkpoint** | `magnate_endgame_echo_done`, `magnate_endgame_identity_done` |
| **Bridge branch markers** | `magnate_bridge_endgame_apprentice_craft`, `magnate_bridge_endgame_tavern_network`, `magnate_bridge_endgame_peasant_grain` |
| **Event type** | `auto` (P93/P100 lightweight pattern — narrative echo, no stat change) |

### Bridge branch coverage (minimum 2 origins)

| Origin | Reads | Sets |
| ------ | ----- | ---- |
| Apprentice craft | `apprentice_merchant_bridge_crossed` | `magnate_bridge_endgame_apprentice_craft` |
| Tavern network | `tavern_merchant_bridge_crossed` | `magnate_bridge_endgame_tavern_network` |
| Peasant grain (optional 3rd) | `peasant_merchant_bridge_crossed` | `magnate_bridge_endgame_peasant_grain` |

---

## 3. Allowed Surfaces

| Layer | Allowed |
| ----- | ------- |
| **Spine wiring** | Three bridge-specific auto echo events + narrow generic fallback |
| **Expression** | Endgame tier reads P101 bridge endgame markers; P64 bridge priority preserved |
| **Markers** | `magnate_bridge_endgame_*` branch flags + shared P100 checkpoints |
| **Consequences** | No stat_modify (P93 lightweight compliant) |
| **Proof** | One targeted chain proof under `docs/test-reports/` |
| **Tests** | Focused test file `tests/p101MerchantMagnateBridgeOriginEndgameTests.ts` |

---

## 4. Forbidden Items

| Forbidden | Reason |
| --------- | ------ |
| Native P100 ledger/caravan endgame rewrite | P100 closed scope |
| P63/P64 bridge entry/mid/late wiring changes | Prior stages closed |
| Bridge-origin **late-life** differentiation | P99 defer — expression only |
| `merchant_martial_patron` cross-route bridge | Explicit non-goal |
| Full merchant empire ending graph | PRD non-goal |
| New UI panels | PRD non-goal |
| New economy / trade-platform / second progression container | PRD non-goal |
| Heavy stat changes at endgame | P93 lightweight echo pattern |
| Full-lifetime `gate:p20` broad rerun | Out of bounded sample scope |
| North Star §8 full spectrum | Wave 3 bridge sample only |

---

## 5. Expression Priority (Endgame Tier)

1. P63/P64 bridge markers — **highest** when bridge crossed and no native late-life markers override
2. P101 bridge endgame markers — after `magnate_endgame_echo_done` for bridge paths
3. P100 native endgame markers — when native late-life lineage present (bridge blocked from native spine)
4. Generic magnate fallback

Native P100 expressions retain priority when native late-life markers are set **and** player is not on bridge path (native spine conditions unchanged).

---

## 6. P101 vs Adjacent Stages

| Stage | Scope | P101 relationship |
| ----- | ----- | ----------------- |
| P63 | Bridge entry differentiation | Bridge markers are endgame input |
| P64 | Bridge mid/late expression | Unchanged; expression priority preserved |
| P99 | Native late-life sample | Unchanged; not reopened |
| P100 | Native endgame echo | Unchanged; bridge split is additive |
| P102+ | Martial patron, full empire | Deferred |

---

## 7. Success Criteria

- At least 2 bridge origins have distinguishable endgame echo events with checkpoint flags beyond flavor text
- P100 native ledger/caravan endgame tests pass (no regression)
- P63/P64 bridge tests pass (no regression)
- `npm run guard:sample-lines-baseline` stays green
- `npm run typecheck` passes
