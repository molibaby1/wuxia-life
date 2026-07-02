# P99 Merchant Magnate Native Late-Life Scope Contract

> **Date:** 2026-07-02  
> **Stage:** P99 Wuxia Merchant Magnate Native Late-Life Sample  
> **Branch:** `codex/p99-wuxia-merchant-magnate-native-late-life-sample`

---

## 1. Purpose

Lock P99 as a **bounded post-payoff late-life sample** for native `merchant_house` ledger vs caravan paths. Prevent scope drift into full magnate empire rewrite, bridge late-life differentiation, or `merchant_martial_patron` bridge work.

---

## 2. Single Late-Life Spine Event Band

| Field | Value |
| ----- | ----- |
| **Event ID** | `magnate_late_life` |
| **Age band** | 48–56 (trigger at age 48) |
| **Prerequisite** | `magnate_payoff_done` && !`magnate_late_life_done` |
| **Checkpoint flags** | `magnate_late_life_done`, `magnate_late_life_identity_done` |
| **Native branch markers** | `magnate_native_late_ledger_*`, `magnate_native_late_caravan_*` |
| **Event type** | `choice` (P98 pattern — consequences need ledger/caravan differentiation) |

### Native branch coverage (minimum)

| Track | Reads | Sets |
| ----- | ----- | ---- |
| Ledger steady | `magnate_native_payoff_ledger_steady` or P97 steady lineage | `magnate_native_late_ledger_steady` |
| Ledger credit | `magnate_native_payoff_ledger_credit` or P97 credit lineage | `magnate_native_late_ledger_credit` |
| Caravan market | `magnate_native_payoff_caravan_market` or P97 market lineage | `magnate_native_late_caravan_market` |
| Caravan fast | `magnate_native_payoff_caravan_fast` or P97 fast lineage | `magnate_native_late_caravan_fast` |
| Ledger generic | `magnate_native_payoff_ledger` or `magnate_native_ledger_entry` | `magnate_native_late_ledger` |
| Caravan generic | `magnate_native_payoff_caravan` or `magnate_native_caravan_entry` | `magnate_native_late_caravan` |
| Generic fallback | (bridge or unmatched native) | checkpoint flags only |

---

## 3. Allowed Surfaces

| Layer | Allowed |
| ----- | ------- |
| **Spine wiring** | Single `magnate_late_life` choice event with native ledger/caravan branches + generic fallback |
| **Expression** | `merchantCurrentGoal`, `deriveSampleLineCostLabel`, `merchantAge40Identity` late-life tier reading P99 markers |
| **Markers** | `magnate_late_life_done`, `magnate_late_life_identity_done`, `magnate_native_late_*` |
| **Consequences** | Light stat_modify per branch (reputation, connections, businessAcumen, money) |
| **Proof** | One targeted chain proof under `docs/test-reports/` |
| **Tests** | Focused test file `tests/p99MerchantMagnateNativeLateLifeTests.ts` |

---

## 4. Forbidden Items

| Forbidden | Reason |
| --------- | ------ |
| Endgame legacy wave / empire ending rewrite | P100+ defer |
| `merchant_martial_patron` cross-route bridge | Explicit non-goal |
| Bridge-origin late-life rewrite (apprentice/tavern/peasant branches) | P64 bridge late-life defer — generic fallback only |
| New UI panels | PRD non-goal |
| New economy / trade-platform / second progression container | PRD non-goal |
| Reopening P97 on-ramp or P98 pressure/payoff wiring | Prior stages closed |
| Full-lifetime `gate:p20` broad rerun | Out of bounded sample scope |
| North Star §8 full spectrum | Wave 3 item 1 sample only |

---

## 5. Expression Priority (Unchanged)

1. P63/P64 bridge markers — **highest** (retain existing bridge payoff expression; no bridge late-life rewrite)
2. P99 native late-life markers — after `magnate_late_life_done`
3. P98 payoff markers — while payoff done but late-life not yet
4. Generic magnate fallback

---

## 6. P99 vs Adjacent Stages

| Stage | Scope | P99 relationship |
| ----- | ----- | ------------------ |
| P55 | Magnate on-ramp → pressure → payoff skeleton | P99 **adds** late-life after payoff; does not replace event IDs |
| P97 | Native magnate entry differentiation | P99 reads P97 entry lineage as fallback |
| P98 | Native pressure/payoff differentiation | P99 reads P98 payoff markers as primary input |
| P64 | Bridge pressure/payoff expression | P99 does not rewrite bridge late-life |
| P100+ | Endgame echo / final legacy | Deferred |

---

## 7. Success Criteria (Stage Close)

- Native ledger and caravan each have a playable magnate payoff → late-life sample
- Replay at age 48–56 shows distinguishable goals, cost labels, identity
- P55/P63/P64/P97/P98 regression baselines pass
- No new system-level complexity

---

## 8. Next Bounded Candidate After P99

**P100 — Merchant Magnate Endgame Echo / Final Legacy (bounded sample)**  
Extend native magnate chain with a narrow endgame echo checkpoint, without full empire graph or `merchant_martial_patron`.
