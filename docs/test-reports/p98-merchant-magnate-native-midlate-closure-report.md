# P98 Merchant Magnate Native Mid/Late Differentiation — Closure Report

> **Stage:** P98 Wuxia Merchant Magnate Native Mid/Late Differentiation  
> **Branch:** `codex/p98-wuxia-merchant-magnate-native-midlate-differentiation`  
> **Date:** 2026-07-02

## 1. What P98 Proves

P98 closes the gap between P97 native magnate entry markers and generic magnate mid/late experience for `merchant_house` ledger vs caravan paths at ages 36–46.

### Added

| Layer | Change |
| ----- | ------ |
| **Spine — pressure** | `magnate_midlife_pressure` converted to choice event with native ledger/caravan branches; sets P98 pressure markers (`magnate_native_pressure_*`) + light stat consequences |
| **Spine — payoff** | `magnate_payoff` converted to choice event reading P98 pressure or P97 entry lineage; sets `magnate_native_payoff_*` markers |
| **Expression — goals** | `merchantCurrentGoal` differentiates native ledger/caravan at pressure and payoff (after P64 bridge priority) |
| **Expression — cost labels** | `deriveSampleLineCostLabel` adds native mid/late burden labels (稳扩/赊欠/赌市/压货 at pressure; 稳态/信誉/行市/货路 at payoff) |
| **Expression — identity** | `merchantAge40Identity` reflects native track at `magnate_midlife_pressure_done` and `magnate_payoff_done` checkpoints |
| **Evidence** | Gap audit, chain proof, focused test suite `tests/p98MerchantMagnateNativeMidlateTests.ts` |

### Regression Guarded

- P55 magnate skeleton: same event IDs, sequential gates; seed 804 spine tests pass
- P63/P64 bridge: bridge expressions retain priority; bridge players use generic pressure/payoff choices
- P97 entry: on-ramp choice wiring and entry markers unchanged in behavior

---

## 2. What Remains Deferred

This stage **does not** implement:

1. **`merchant_martial_patron`** cross-route bridge
2. **Full magnate empire / ending** rewrite (40+ empire graph, North Star §8 full spectrum)
3. **North Star §8 broader waves** — Wave 1 mainstream achievements, Wave 2 pinnacle, Wave 4 ordinary origins
4. **Full-lifetime `gate:p20`** broad rerun
5. **P97 on-ramp** or **P64 bridge** mid/late rewrites

---

## 3. Next Bounded Candidate Stage

**P99 — Merchant Martial Patron Bridge (narrow playable)**  
Wire `merchant_martial_patron` as a bounded cross-route bridge from martial origins into merchant magnate entry, without reopening P55/P98 magnate spine or full empire scope.

Alternative if martial patron is not next priority:

**P99 — Native Magnate Late-Life / Endgame Sample (bounded)**  
Extend native ledger/caravan differentiation into post-payoff late-life checkpoints for Wave 3 §8 `merchant_magnate` chain closure sample.

---

## 4. Verification Summary

| Check | Result |
| ----- | ------ |
| `npm run typecheck` | Pass |
| `p98MerchantMagnateNativeMidlateTests` | Pass |
| `p97MerchantMagnateNativeEntryTests` | Pass (no regression) |
| `p50SampleLineExpressionTests` | Pass (P64 bridge preserved) |
| `p50SampleLineSpineTests` | Pass (P55 chain preserved) |

---

## 5. Stage Boundary Statement

P98 is a **bounded native-path mid/late reinforcement** stage. It extends P97 entry personality into `magnate_midlife_pressure` and `magnate_payoff` via narrow spine choice wiring and expression differentiation. It is **not** a full magnate rewrite and **not** `merchant_martial_patron` implementation.
