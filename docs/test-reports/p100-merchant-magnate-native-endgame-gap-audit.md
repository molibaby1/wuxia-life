# P100 Merchant Magnate Native Endgame Gap Audit

> **Stage:** P100 Wuxia Merchant Magnate Native Endgame Echo Sample  
> **Story:** P100-002 (read-only; no runtime changes beyond P100-001)  
> **Date:** 2026-07-02  
> **Gaps addressed:** GAP-P99-N01, GAP-P99-V01 (guard fixed on P99 branch)

## 1. Purpose

Document the post-`magnate_late_life_done` magnate spine terminus and available endgame hooks. Isolate where P99 native late-life markers stop being consumed so P100 targets late-life → endgame continuity without reopening P55 skeleton, P97 entry, P98 mid/late, or P99 late-life wiring.

---

## 2. Magnate Spine Terminus After Late-Life (Pre-P100)

| Age band | Event ID | Key flags | Post-late-life status |
| -------- | -------- | --------- | --------------------- |
| 28–32 | `magnate_on_ramp` | `magnate_on_ramp_done`, P97 native entry markers | ✅ Complete |
| 36–40 | `magnate_midlife_pressure` | `magnate_midlife_pressure_done`, P98 pressure markers | ✅ Complete |
| 42–46 | `magnate_payoff` | `magnate_payoff_done`, P98 payoff markers | ✅ Complete |
| 48–56 | `magnate_late_life` | `magnate_late_life_done`, P99 late-life markers | ✅ Complete (P99) |
| **58–65** | **(none)** | — | **❌ No endgame echo event** |
| 60+ | Other sample lines (medical endgame, renown, etc.) | Unrelated route gates | N/A for merchant_house |

**P99 spine terminus:** After `magnate_late_life_done`, the magnate chain has no downstream endgame echo. Native ledger/caravan players at age 56+ retain P99 late-life expression but receive no endgame checkpoint, auto echo, or identity refresh.

---

## 3. P99 Late-Life Markers Not Consumed Downstream

| Marker | Set at | Consumed at late-life expression? | Consumed at endgame? |
| ------ | ------ | --------------------------------- | -------------------- |
| `magnate_native_late_ledger_steady` | `magnate_late_life` choice | ✅ goal / cost / identity | **❌ No event reads it** |
| `magnate_native_late_ledger_credit` | same | ✅ | **❌** |
| `magnate_native_late_caravan_market` | same | ✅ | **❌** |
| `magnate_native_late_caravan_fast` | same | ✅ | **❌** |
| `magnate_native_late_ledger` | same | ✅ | **❌** |
| `magnate_native_late_caravan` | same | ✅ | **❌** |
| `magnate_late_life_identity_done` | all late-life branches | N/A (checkpoint) | **❌** |

### Expression flattening at endgame band (age 58+)

| Surface | Reads P99 late-life markers? | Ledger vs caravan differ at age 60? |
| ------- | ---------------------------- | ----------------------------------- |
| `merchantCurrentGoal` | Only while `magnate_late_life_done` (no endgame tier) | **Frozen at late-life text** — no endgame refresh |
| `deriveSampleLineCostLabel` | Same | **Frozen at late-life label** |
| `merchantAge40Identity` | Stops at `magnate_late_life_identity_done` tier | **No `magnate_endgame_*` identity hook** |

P98 payoff lineage and P97 entry markers persist in flags but have no endgame spine consumer after P99 late-life checkpoint.

---

## 4. Available Endgame Hooks (Pattern Reference)

| Reference stage | Endgame event pattern | Age band | Prerequisite |
| --------------- | ----------------------- | -------- | ------------ |
| P93 medical | `medical_endgame_echo_*` auto events (6 branches) | 60–65 | `medical_late_life_done` + late-life branch marker |
| P81 renown | `renown_endgame_echo_*` auto events (3 branches) | 52+ | renown payoff + branch marker |
| **P100 target** | `magnate_endgame_echo_*` auto events (ledger + caravan + generic) | **58–65** | `magnate_late_life_done` + P99 late-life or P98/P97 fallback marker |

**Recommended P100 hook:** Lightweight auto echo events (P93 pattern) reading P99 late-life markers with ledger/caravan branches, setting `magnate_endgame_echo_done` + native endgame branch markers + minimal/no stat consequence.

---

## 5. Native Track vs Bridge-Origin — Scope Boundary

| Dimension | Native merchant_house (P100 target) | Bridge-origin (defer) |
| --------- | ----------------------------------- | ---------------------- |
| Entry | `magnate_native_*_entry` (P97) | `*_merchant_bridge_crossed` (P63) |
| Mid/late | P98 pressure/payoff markers | Generic pressure/payoff choices (P64 expression only) |
| Late-life | P99 ledger/caravan late-life sample | Generic `magnate_late_life_generic` fallback only |
| Endgame | **P100: ledger/caravan endgame echo sample** | **Defer** — generic `magnate_endgame_echo_generic` fallback only |
| Expression priority | After bridge checks | Bridge markers retain priority (P64) |

**P100 does not reopen P64 bridge endgame differentiation.** Bridge players may receive a generic endgame echo checkpoint but no apprentice/tavern/peasant endgame rewrite.

---

## 6. Gap Inventory

| Gap | ID | Description |
| --- | -- | ----------- |
| No endgame spine event after late-life | GAP-P99-N01 | Native magnate chain stops at `magnate_late_life_done`; Wave 3 `merchant_magnate` narrative unclosed |
| Late-life markers unused downstream | GAP-P99-N01 | P99 `magnate_native_late_*` flags have no endgame consumer |
| Expression frozen at late-life tier | GAP-P99-N01 | Goal/cost/identity do not refresh at endgame checkpoint |
| P50 guard regression | GAP-P99-V01 | **Resolved on P99 branch** (4776c5c) — orthodox age-25 goal alignment restored |

---

## 7. P100 Target Surface

| Layer | P100 action |
| ----- | ----------- |
| Spine | Add `magnate_endgame_echo_ledger_legacy`, `magnate_endgame_echo_caravan_legacy`, `magnate_endgame_echo_generic` auto events |
| Markers | `magnate_endgame_echo_done`, `magnate_endgame_identity_done`, `magnate_native_endgame_ledger_legacy`, `magnate_native_endgame_caravan_legacy` |
| Expression | Endgame tier in goal / cost / identity reading P99 late-life markers |
| Proof | Focused test + chain proof under `docs/test-reports/` |
