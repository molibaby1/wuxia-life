# P100 Merchant Magnate Native Endgame Scope Contract

> **Date:** 2026-07-02  
> **Stage:** P100 Wuxia Merchant Magnate Native Endgame Echo Sample  
> **Branch:** `codex/p100-wuxia-merchant-magnate-native-endgame-echo-sample`

---

## 1. Purpose

Lock P100 as a **bounded post-late-life endgame echo sample** for native `merchant_house` ledger vs caravan paths. Prevent scope drift into full magnate empire rewrite, bridge endgame differentiation, or `merchant_martial_patron` bridge work.

---

## 2. Single Endgame Echo Event Band

| Field | Value |
| ----- | ----- |
| **Event IDs** | `magnate_endgame_echo_ledger_legacy`, `magnate_endgame_echo_caravan_legacy`, `magnate_endgame_echo_generic` |
| **Age band** | 58–65 (trigger at age 58) |
| **Prerequisite** | `magnate_late_life_done` && !`magnate_endgame_echo_done` |
| **Checkpoint flags** | `magnate_endgame_echo_done`, `magnate_endgame_identity_done` |
| **Native branch markers** | `magnate_native_endgame_ledger_legacy`, `magnate_native_endgame_caravan_legacy` |
| **Generic marker** | `magnate_endgame_generic` |
| **Event type** | `auto` (P93 pattern — lightweight narrative echo, no player choice) |

### Native branch coverage (minimum)

| Track | Reads | Sets |
| ----- | ----- | ---- |
| Ledger legacy | `magnate_native_late_ledger_*` or P98 payoff ledger / P97 entry fallback | `magnate_native_endgame_ledger_legacy` |
| Caravan legacy | `magnate_native_late_caravan_*` or P98 payoff caravan / P97 entry fallback | `magnate_native_endgame_caravan_legacy` |
| Generic fallback | bridge crossed or unmatched native late-life | `magnate_endgame_generic` |

---

## 3. Allowed Surfaces

| Layer | Allowed |
| ----- | ------- |
| **Spine wiring** | Three auto echo events with mutually exclusive conditions + shared checkpoint |
| **Expression** | `merchantCurrentGoal`, `deriveSampleLineCostLabel`, `merchantAge40Identity` endgame tier reading P99/P100 markers |
| **Markers** | `magnate_endgame_echo_done`, `magnate_endgame_identity_done`, `magnate_native_endgame_*`, `magnate_endgame_generic` |
| **Consequences** | No stat_modify (P93 lightweight compliant) |
| **Proof** | One targeted chain proof under `docs/test-reports/` |
| **Tests** | Focused test file `tests/p100MerchantMagnateNativeEndgameTests.ts` |

---

## 4. Forbidden Items

| Forbidden | Reason |
| --------- | ------ |
| Full merchant empire ending graph | PRD non-goal |
| `merchant_martial_patron` cross-route bridge | Explicit non-goal |
| Bridge-origin endgame rewrite (apprentice/tavern/peasant branches) | P64 bridge endgame defer — generic fallback only |
| New UI panels | PRD non-goal |
| New economy / trade-platform / second progression container | PRD non-goal |
| Reopening P97 on-ramp, P98 pressure/payoff, or P99 late-life wiring | Prior stages closed |
| Heavy stat changes at endgame | P93 lightweight echo pattern |
| Full-lifetime `gate:p20` broad rerun | Out of bounded sample scope |
| North Star §8 full spectrum | Wave 3 item 1 sample only |

---

## 5. Expression Priority (Unchanged + Endgame Tier)

1. P63/P64 bridge markers — **highest** (retain existing bridge expression at endgame)
2. P100 native endgame markers — after `magnate_endgame_echo_done`
3. P99 native late-life markers — while late-life done but endgame not yet
4. P98 payoff markers — while payoff done but late-life not yet
5. Generic magnate fallback

---

## 6. P100 vs Adjacent Stages

| Stage | Scope | P100 relationship |
| ----- | ----- | ----------------- |
| P55 | Magnate skeleton on-ramp/pressure/payoff | Unchanged; endgame is additive after late-life |
| P97 | Native entry differentiation | Entry markers read as endgame fallback only |
| P98 | Native mid/late payoff | Payoff markers read as endgame fallback only |
| P99 | Native late-life sample | Late-life markers are primary endgame input |
| P100+ | Full empire graph, martial patron | Deferred |

---

## 7. Success Criteria

- Native ledger and caravan each have a distinguishable endgame echo with checkpoint flag beyond flavor text
- P55 magnate chain through late-life remains reachable; endgame is additive
- P63/P64 bridge expressions retain priority; bridge gets generic endgame only
- `npm run guard:sample-lines-baseline` stays green
- P97/P98/P99 merchant tests pass
