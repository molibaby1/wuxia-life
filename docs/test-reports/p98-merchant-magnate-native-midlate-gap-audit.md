# P98 Merchant Magnate Native Mid/Late Gap Audit

> **Stage:** P98 Wuxia Merchant Magnate Native Mid/Late Differentiation  
> **Story:** P98-001 (read-only; no runtime changes)  
> **Date:** 2026-07-02  
> **Gaps addressed:** GAP-P97-N01, GAP-P97-N02, GAP-P97-N03

## 1. Purpose

Document `magnate_midlife_pressure` and `magnate_payoff` gates, flags, and expression for **native `merchant_house`** vs **P63/P64 bridge-origin** paths. Isolate where P97 native entry markers stop being consumed at pressure/payoff so P98 targets mid/late continuity without reopening P55 skeleton or P64 bridge differentiation.

---

## 2. Magnate Spine Anchors (P55 — Do Not Replace)

| Age band | Event ID | Key flags | Gate summary |
| -------- | -------- | --------- | ------------ |
| 28–32 | `magnate_on_ramp` | `magnate_on_ramp_done`, P97 native entry markers | route/milestone + !on_ramp_done |
| 36–40 | `magnate_midlife_pressure` | `magnate_midlife_pressure_done` | requires `magnate_on_ramp_done` |
| 42–46 | `magnate_payoff` | `magnate_payoff_done`, `magnate_payoff_resolved` | requires on-ramp + pressure |

**P55 skeleton is intact:** fixed event IDs, sequential flag gates. P98 must feed into these IDs, not replace them.

---

## 3. P64 Bridge Mid/Late (Baseline — Must Not Regress)

P64 differentiated **expression only** for three bridge origins at pressure/payoff:

| Surface | Bridge apprentice | Bridge tavern | Bridge peasant |
| ------- | ----------------- | ------------- | -------------- |
| `merchantCurrentGoal` @ pressure | 合伙/供货/销路债 | 人情/老主顾债 | 车马/仓储债 |
| `merchantCurrentGoal` @ payoff | 手艺商路收束 | 人情网络收束 | 粮路奔波收束 |
| `deriveSampleLineCostLabel` @ pressure/payoff | 合伙与账目 | 人情与面子 | 粮路与奔波 |
| Spine event text | Generic auto (shared) | Generic auto | Generic auto |

Bridge markers (`apprentice_merchant_bridge_crossed`, etc.) **take priority** in expression branches. P98 native branches must sit **after** bridge checks.

---

## 4. Native vs Bridge at Pressure/Payoff (Pre-P98)

### 4.1 Spine (`sample-lines-spine.json`)

| Event | Event type | Native track markers set? | Bridge path |
| ----- | ---------- | --------------------------- | ----------- |
| `magnate_midlife_pressure` | `auto` | **No** — only `magnate_midlife_pressure_done` | Same auto path |
| `magnate_payoff` | `auto` | **No** — only payoff checkpoint flags | Same auto path |

Event text is **generic magnate** for all paths:「人情债」「利润沾着人情」— no ledger/caravan framing in spine.

### 4.2 Expression (`sampleLineExpression.ts`)

| Surface | Reads P97 native entry? | Reads P98 pressure markers? | Native ledger vs caravan differ? |
| ------- | ---------------------- | --------------------------- | -------------------------------- |
| `merchantCurrentGoal` @ pressure | **Partial** — reads `magnate_native_*_entry` + P96 sub-flags | **No** | **Yes** (expression only) |
| `merchantCurrentGoal` @ payoff | **No** — falls through to generic「巨贾之位已成」 | **No** | **No** |
| `deriveSampleLineCostLabel` @ pressure | **No** | **No** | **No** —「巨贾负担」 |
| `deriveSampleLineCostLabel` @ payoff | **No** | **No** | **No** —「巨贾负担」 |
| `merchantAge40Identity` @ magnate | **Yes** @ `magnate_on_ramp_done` only | **No** | **Yes** at on-ramp checkpoint only |

### 4.3 P97 Entry Markers (Upstream, Set at On-Ramp)

| Marker | Meaning |
| ------ | ------- |
| `magnate_native_ledger_entry` | Native merchant_house entered magnate via ledger track |
| `magnate_native_caravan_entry` | Native merchant_house entered magnate via caravan track |
| `magnate_native_ledger_steady` / `_credit` | Ledger expansion sub-personality |
| `magnate_native_caravan_market` / `_fast` | Caravan expansion sub-personality |

These markers persist into age 36+ but **pressure/payoff spine does not branch on them** and **payoff expression ignores them**.

---

## 5. Gap Inventory

| Gap | ID | Description |
| --- | -- | ----------- |
| **G-01 Pressure spine silence** | GAP-P97-N01 | `magnate_midlife_pressure` autoEffects set only checkpoint flag; no native pressure-phase marker or choice consequence |
| **G-02 Payoff flattening** | GAP-P97-N02 | `magnate_payoff` does not read native entry or pressure lineage; ledger/caravan payoff goals identical |
| **G-03 Cost label flattening** | GAP-P97-N03 | `deriveSampleLineCostLabel` at pressure/payoff returns generic「巨贾负担」for native paths |
| **G-04 Mid/late identity gap** | GAP-P98-04 | `merchantAge40Identity` differentiates native track only at `magnate_on_ramp_done`, not at pressure/payoff checkpoints |

### Continuity break timeline

```
Age 28────32────36────40────42────46
  │       │      │      │      │
  P97 on-ramp     pressure      payoff
  (choice+markers) │◄─ spine generic ─►│◄─ expression generic ─►│
  expression OK   │   cost flat        │   goal+cost flat       │
```

---

## 6. P64 Bridge vs P97/P98 Native — Scope Boundary

| Dimension | P64 bridge | P97 entry | P98 native mid/late (target) |
| --------- | ---------- | --------- | ---------------------------- |
| Origin | apprentice / tavern / peasant | `origin_merchant_family` | Same native path, ages 36–46 |
| Entry marker | `*_merchant_bridge_crossed` | `magnate_native_*_entry` | Reads P97 + sets P98 pressure/payoff markers |
| Expression priority | **Highest** at all magnate stages | After bridge | After bridge; before generic magnate |
| Spine differentiation | Expression-only (P64) | Choice at on-ramp (P97) | Choice at pressure/payoff (P98) |
| Implementation surface | `sampleLineExpression.ts` | `sample-lines-spine.json` + expression | Spine choice wiring + expression |

**P98 does not reopen P63 entry or P64 bridge mid/late differentiation.**

---

## 7. P98 Implementation Scope (From Gaps)

1. `magnate_midlife_pressure`: choice branches for native ledger/caravan reading P97 markers; set P98 pressure-phase markers + light stat consequence
2. `magnate_payoff`: choice branches reading pressure-phase or entry lineage; distinguishable payoff expression
3. Expression: native cost labels + payoff goals + `merchantAge40Identity` at pressure/payoff checkpoints
4. Proof + regression: ledger/caravan samples through age 36–46; P55/P63/P64/P97 baselines guarded

---

## 8. Out of Scope (Explicit)

- `merchant_martial_patron` cross-route bridge
- Full magnate empire / ending rewrite
- North Star §8 Wave 1/4 broad waves
- Reopening P97 on-ramp wiring or P64 bridge expression branches
