# P99 Merchant Magnate Native Late-Life Gap Audit

> **Stage:** P99 Wuxia Merchant Magnate Native Late-Life Sample  
> **Story:** P99-001 (read-only; no runtime changes)  
> **Date:** 2026-07-02  
> **Gaps addressed:** GAP-P98-N01, GAP-P98-N02

## 1. Purpose

Document the post-`magnate_payoff_done` magnate spine terminus and available late-life hooks. Isolate where P98 native payoff markers stop being consumed so P99 targets payoff → late-life continuity without reopening P55 skeleton, P97 entry, or P98 mid/late wiring.

---

## 2. Magnate Spine Terminus After Payoff (Pre-P99)

| Age band | Event ID | Key flags | Post-payoff status |
| -------- | -------- | --------- | ------------------ |
| 28–32 | `magnate_on_ramp` | `magnate_on_ramp_done`, P97 native entry markers | ✅ Complete |
| 36–40 | `magnate_midlife_pressure` | `magnate_midlife_pressure_done`, P98 pressure markers | ✅ Complete (P98) |
| 42–46 | `magnate_payoff` | `magnate_payoff_done`, P98 payoff markers | ✅ Complete (P98) |
| **48–56** | **(none)** | — | **❌ No late-life event** |
| 52+ | Other sample lines (renown, medical, etc.) | Unrelated route gates | N/A for merchant_house |

**P55 skeleton terminus:** After `magnate_payoff_done`, the magnate chain has no downstream spine event. Native ledger/caravan players at age 46+ retain P98 payoff expression but receive no late-life checkpoint, choice, or identity refresh.

---

## 3. P98 Payoff Markers Not Consumed Downstream

| Marker | Set at | Consumed at payoff expression? | Consumed at late-life? |
| ------ | ------ | ------------------------------ | ---------------------- |
| `magnate_native_payoff_ledger_steady` | `magnate_payoff` choice | ✅ goal / cost / identity | **❌ No event reads it** |
| `magnate_native_payoff_ledger_credit` | same | ✅ | **❌** |
| `magnate_native_payoff_caravan_market` | same | ✅ | **❌** |
| `magnate_native_payoff_caravan_fast` | same | ✅ | **❌** |
| `magnate_native_payoff_ledger` | same | ✅ | **❌** |
| `magnate_native_payoff_caravan` | same | ✅ | **❌** |
| `magnate_payoff_resolved` | all payoff branches | N/A (checkpoint) | **❌** |

### Expression flattening at late-life band (age 48+)

| Surface | Reads P98 payoff markers? | Ledger vs caravan differ at age 50? |
| ------- | ------------------------- | ----------------------------------- |
| `merchantCurrentGoal` | Only while `magnate_payoff_done` (no late-life tier) | **Frozen at payoff text** — no late-life refresh |
| `deriveSampleLineCostLabel` | Same | **Frozen at payoff label** |
| `merchantAge40Identity` | Stops at `magnate_payoff_done` tier | **No `magnate_late_life_*` identity hook** |

P97 entry lineage (`magnate_native_ledger_entry`, `magnate_native_caravan_entry`) persists in flags but has no late-life spine consumer.

---

## 4. Available Late-Life Hooks (Pattern Reference)

| Reference stage | Late-life event pattern | Age band | Prerequisite |
| --------------- | ----------------------- | -------- | ------------ |
| P79 renown | `renown_late_life_*` auto events (3 branches) | 48–52 | `renown_midlife_payoff_done` + payoff branch marker |
| P91 medical | `medical_late_life_*` auto events (6 branches) | 52–56 | `medical_payoff_done` + payoff branch marker |
| **P99 target** | `magnate_late_life` choice event + native branches | **48–56** | `magnate_payoff_done` + P98 payoff or P97 entry marker |

**Recommended P99 hook:** Single `magnate_late_life` choice event (P98 pattern) reading P98 payoff markers with ledger/caravan branches, setting `magnate_late_life_done` + native late-life branch markers + light stat consequence.

---

## 5. Native Track vs Bridge-Origin — Scope Boundary

| Dimension | Native merchant_house (P99 target) | Bridge-origin (defer) |
| --------- | ----------------------------------- | ---------------------- |
| Entry | `magnate_native_*_entry` (P97) | `*_merchant_bridge_crossed` (P63) |
| Mid/late | P98 pressure/payoff markers | Generic pressure/payoff choices (P64 expression only) |
| Late-life | **P99: ledger/caravan late-life sample** | **Defer** — generic `magnate_late_life_generic` fallback only |
| Expression priority | After bridge checks | Bridge markers retain priority (P64) |

**P99 does not reopen P64 bridge late-life differentiation.** Bridge players may receive a generic late-life checkpoint but no apprentice/tavern/peasant late-life rewrite.

---

## 6. Gap Inventory

| Gap | ID | Description |
| --- | -- | ----------- |
| **G-01 Post-payoff spine void** | GAP-P98-N01 | No spine event after `magnate_payoff_done`; magnate chain ends at age 46 |
| **G-02 Payoff marker orphan** | GAP-P98-N02 | P98 `magnate_native_payoff_*` markers have no downstream consumer beyond static payoff expression |
| **G-03 Late-life expression freeze** | GAP-P99-03 | Goals, cost labels, identity lack a `magnate_late_life_done` tier |
| **G-04 Identity hook gap** | GAP-P99-04 | No `magnate_late_life_identity_done` equivalent to renown/medical late-life identity |

### Continuity break timeline

```
Age 28────36────42────46────48────56
  │      │      │      │      │
  on-ramp pressure payoff  │◄─ NO EVENT ─►│
  P97     P98     P98     │  expression  │
  OK      OK      OK      │  frozen here │
```

---

## 7. P99 Implementation Scope (From Gaps)

1. Add `magnate_late_life` choice event (age 48–56, requires `magnate_payoff_done`)
2. Native ledger/caravan branches read P98 payoff or P97 entry lineage; set late-life branch markers + checkpoint flags
3. Expression: late-life tier for goals, cost labels, `merchantAge40Identity`
4. Generic fallback for bridge-origin (no bridge late-life rewrite)
5. Narrow proof + regression tests

---

## 8. Out of Scope (Explicit)

- `merchant_martial_patron` cross-route bridge
- Full magnate empire / endgame echo rewrite (P100+)
- Bridge-origin magnate late-life differentiation beyond generic fallback
- North Star §8 Wave 1/2/4 broader waves
- Reopening P97 on-ramp or P98 pressure/payoff wiring
