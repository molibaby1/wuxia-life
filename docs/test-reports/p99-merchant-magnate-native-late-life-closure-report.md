# P99 Merchant Magnate Native Late-Life Sample — Closure Report

> **Stage:** P99 Wuxia Merchant Magnate Native Late-Life Sample  
> **Branch:** `codex/p99-wuxia-merchant-magnate-native-late-life-sample`  
> **Date:** 2026-07-02

## 1. What P99 Proves

P99 closes the gap between P98 native magnate payoff markers and generic post-payoff magnate experience for `merchant_house` ledger vs caravan paths at ages 48–56.

### Added

| Layer | Change |
| ----- | ------ |
| **Spine — late-life** | `magnate_late_life` choice event (age 48–56, requires `magnate_payoff_done`) with native ledger/caravan branches reading P98 payoff or P97 entry lineage; sets `magnate_late_life_done`, `magnate_late_life_identity_done`, `magnate_native_late_*` markers + light stat consequences |
| **Expression — goals** | `merchantCurrentGoal` late-life tier differentiates native ledger/caravan (after P64 bridge priority) |
| **Expression — cost labels** | `deriveSampleLineCostLabel` adds native late-life burden labels (稳态守成/信誉收束/行市收势/货路收束) |
| **Expression — identity** | `merchantAge40Identity` reflects native track at `magnate_late_life_identity_done` checkpoint |
| **Evidence** | Gap audit, scope contract, chain proof, focused test suite `tests/p99MerchantMagnateNativeLateLifeTests.ts` |

### Regression Guarded

- P55 magnate skeleton: same on-ramp/pressure/payoff event IDs; late-life is additive after payoff
- P63/P64 bridge: bridge expressions retain priority at late-life; bridge players use generic late-life choice
- P97 entry: on-ramp choice wiring and entry markers unchanged
- P98 mid/late: pressure/payoff choice wiring and expression unchanged

---

## 2. What Remains Deferred

This stage **does not** implement:

1. **Merchant magnate endgame echo / final legacy** (P100+ bounded endgame sample)
2. **Bridge-origin magnate late-life differentiation** beyond generic fallback expression
3. **`merchant_martial_patron`** cross-route bridge
4. **North Star §8 broader waves** — Wave 1 mainstream achievements, Wave 2 pinnacle, Wave 4 ordinary origins
5. **Full-lifetime `gate:p20`** broad rerun
6. **Full magnate empire rewrite** or second progression container

---

## 3. Next Bounded Candidate Stage

**P100 — Merchant Magnate Endgame Echo / Final Legacy (bounded sample)**  
Extend native ledger/caravan magnate chain with a narrow post-late-life endgame echo checkpoint for Wave 3 §8 `merchant_magnate` chain closure, without full empire graph or `merchant_martial_patron`.

Alternative if martial patron is prioritized:

**P100 — Merchant Martial Patron Bridge (narrow playable)**  
Wire `merchant_martial_patron` as a bounded cross-route bridge from martial origins into merchant magnate entry, without reopening P55/P99 magnate spine.

---

## 4. Verification Summary

| Check | Result |
| ----- | ------ |
| `npm run typecheck` | Pass |
| `p99MerchantMagnateNativeLateLifeTests` | Pass |
| `p98MerchantMagnateNativeMidlateTests` | Pass (no regression) |
| `p97MerchantMagnateNativeEntryTests` | Pass (no regression) |

---

## 5. Story Completion

| Story | Title | Status |
| ----- | ----- | ------ |
| P99-001 | Audit native magnate post-payoff flattening | ✅ |
| P99-002 | Lock native magnate late-life scope contract | ✅ |
| P99-003 | Wire native payoff lineage into magnate late-life | ✅ |
| P99-004 | Strengthen native late-life expression | ✅ |
| P99-005 | Add narrow proof and regression coverage | ✅ |
| P99-006 | Produce stage closure and next-step boundary | ✅ |
