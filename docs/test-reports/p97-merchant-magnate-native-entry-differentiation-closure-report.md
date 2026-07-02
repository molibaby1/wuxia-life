# P97 Merchant Magnate Native Entry Differentiation Closure Report

> **Stage:** P97 Wuxia Merchant Magnate Native Entry Differentiation  
> **Date:** 2026-07-02  
> **Branch:** `codex/p97-wuxia-merchant-magnate-native-entry-differentiation`

## 1. What Was Added (Magnate Native Entry)

| Node | Age | ID | Purpose |
| ---- | --- | -- | ------- |
| Magnate on-ramp wiring | 28–32 | `magnate_on_ramp` | Choice event reading P95/P96 ledger/caravan track and expansion flags; sets `magnate_native_ledger_entry` / `magnate_native_caravan_entry` + sub-flags with stat effects |
| Entry expression | 28–32+ | `sampleLineExpression.ts` | currentGoal + costLabel for native ledger/caravan at magnate entry; P63 bridge branches retain priority |
| Pressure continuity | 36–40+ | `sampleLineExpression.ts` | `magnate_midlife_pressure_done` reads native entry markers + P96 expansion sub-flags |
| Age-40 magnate identity | 38–42+ | `merchantAge40Identity()` | Native ledger/caravan magnate identity when `magnate_native_*_entry` is set |
| Gap audit | — | `p97-merchant-magnate-native-entry-gap-audit.md` | Read-only inventory mapping GAP-P96-D01/D02/D03 |
| Proof + regression | — | `tests/p97MerchantMagnateNativeEntryTests.ts` | Gates, track divergence, bridge priority, P55 chain continuity |

## 2. What This Stage Proves

- Native `merchant_house` ledger and caravan each have a **magnate on-ramp sample** with distinguishable player-facing outcomes
- `magnate_on_ramp` reads P95/P96 flags and sets **downstream markers** beyond flavor text (reputation/connections/businessAcumen/money stat effects)
- P55 magnate skeleton (**on-ramp → pressure → payoff**) remains reachable; seed 804 baseline passes
- P63/P64 bridge-origin differentiation **does not regress**; bridge expressions take priority over native track
- P96 expansion flags connect forward into magnate entry and first pressure checkpoint expression

## 3. Explicitly Deferred

- Native path `magnate_midlife_pressure` / `magnate_payoff` **full differentiation** (P64 covers bridge; native mid/late left to P98+)
- `merchant_martial_patron` cross-route bridge
- Full merchant 40+ empire / ending route rewrite
- New economy / trade-platform / second progression container
- Full-lifetime broad audits or gate:p20 full reruns

## 4. Does Not Implement merchant_martial_patron or Full Magnate Rewrite

This stage **does not** implement `merchant_martial_patron`, does not replace P55 magnate spine event IDs, and does not expand `magnate_midlife_pressure` / `magnate_payoff` into a full native empire chain. Scope is bounded to magnate **entry** wiring and expression only.

## 5. Next Bounded Candidate Stage

**P98 — Native Magnate Mid/Late Differentiation (narrow playable)**

Scope candidate:

- Extend ledger/caravan personality into native `magnate_midlife_pressure` and `magnate_payoff` content branches (pattern: P64 bridge differentiation)
- Still does not implement `merchant_martial_patron` or full empire rewrite

Prerequisite: P97 closure verified (this report + `p97-merchant-magnate-native-entry-chain-proof.md`).

## 6. Story Completion

| Story | Status |
| ----- | ------ |
| P97-001 Gap audit | ✅ |
| P97-002 Magnate on-ramp wiring | ✅ |
| P97-003 Entry expression | ✅ |
| P97-004 Chain continuity | ✅ |
| P97-005 Proof + regression | ✅ |
| P97-006 Closure report | ✅ |

**6/6 stories complete. Ready for A1-verify.**
