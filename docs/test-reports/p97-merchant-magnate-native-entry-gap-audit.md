# P97 Merchant Magnate Native Entry Gap Audit

> **Stage:** P97 Wuxia Merchant Magnate Native Entry Differentiation  
> **Story:** P97-001 (read-only; no runtime changes)  
> **Date:** 2026-07-02  
> **Gaps addressed:** GAP-P96-D01, GAP-P96-D02, GAP-P96-D03

## 1. Purpose

Document `magnate_on_ramp` gates, flags, and expression for **native `merchant_house`** vs **P63 bridge-origin** paths. Isolate where P95/P96 ledger/caravan operating personality is **not read** at magnate entry (age 28–32), so P97 targets continuity wiring without reopening P55 magnate skeleton.

---

## 2. Magnate Spine Anchors (P55)

| Age band | Event ID | Key flags | Gate summary |
| -------- | -------- | --------- | ------------ |
| 28–32 | `magnate_on_ramp` | `magnate_on_ramp_done` | route_merchant + shop/caravan/wealthy/chamber OR bridge_crossed |
| 36–40 | `magnate_midlife_pressure` | `magnate_midlife_pressure_done` | requires `magnate_on_ramp_done` |
| 42–46 | `magnate_payoff` | `magnate_payoff_done`, `magnate_payoff_resolved` | requires on-ramp + pressure |

**P55 skeleton is intact:** on-ramp → pressure → payoff chain uses fixed event IDs and sequential flag gates. P97 must not replace these IDs.

---

## 3. Native vs Bridge-Origin Entry

### 3.1 Gate (`magnate_on_ramp` conditions)

Both native and bridge players enter via the **same gate expression**:

- Route: `route_merchant` OR childhood seed OR `p8_route_wealth` OR `*_merchant_bridge_crossed`
- Milestone: shop/caravan/wealthy/chamber OR `*_merchant_bridge_crossed`
- Excludes: orthodox/demonic childhood, already `magnate_on_ramp_done`

**Native `merchant_house`** typically arrives with `origin_merchant_family`, `route_merchant`, `merchant_shop_*`, and P94/P95 track flags.

**Bridge-origin (P63/P64)** arrives with `apprentice_merchant_bridge_crossed`, `tavern_merchant_bridge_crossed`, or `peasant_merchant_bridge_crossed` — bridge flag alone satisfies both route and milestone clauses.

### 3.2 Current on-ramp content (pre-P97)

| Surface | Native path | Bridge path |
| ------- | ----------- | ----------- |
| Event type | `auto` | `auto` |
| Title/text | Generic「巨贾门槛」 | Same generic text |
| autoEffects | `magnate_on_ramp_done` only | Same |
| Downstream markers | None track-specific | P63 bridge markers read in expression only |

### 3.3 Expression differentiation today (`sampleLineExpression.ts`)

| Surface | Reads P63 bridge? | Reads P95/P96 native track? |
| ------- | ----------------- | --------------------------- |
| `deriveSampleLineCurrentGoal` @ `magnate_on_ramp_done` | Yes (apprentice/tavern/peasant) | **No** — falls through to「产业初成，巨贾之路刚起步」 |
| `deriveSampleLineCostLabel` @ `magnate_on_ramp_done` | Yes | **No** —「巨贾负担」 |
| `merchantAge40Identity` @ `magnate_on_ramp_done` | Yes (craft/network/labor magnate) | **No** —「富甲一方却身不由己的巨贾」 |

**P63 bridge differentiation is implemented and must retain priority over native track branches.**

---

## 4. P95/P96 Upstream Flags (Unread at Magnate Entry)

| Flag family | Set by | Read at magnate_on_ramp? |
| ----------- | ------ | ------------------------ |
| `hvg_merchant_ledger_track` / `hvg_merchant_caravan_track` | P94 fork | **No** |
| `hvg_merchant_*_pressure_*` | P95 operating pressure | **No** |
| `hvg_merchant_expansion_rhythm_done` | P96 expansion rhythm | **No** |
| `hvg_merchant_ledger_expansion_*` / `hvg_merchant_caravan_expansion_*` | P96 expansion choices | **No** |
| `merchant_midlife_debt_*` | P96 debt milestone (32–38) | **No** at on-ramp (fires later) |
| `merchant_age40_identity_done` | P47 age-40 summary (38–42) | **No** at on-ramp |

### Timeline: where personality goes flat

```
Age 22──25────28────32────36────40
  │     │      │      │      │      │
  P95   P96    magnate_on_ramp     pressure
  done  expansion   │◄─ generic ─►│
        rhythm     │   entry     │
```

After P96 expansion rhythm (26–30), native ledger/caravan goals are track-specific until age ~28. At `magnate_on_ramp` (28–32), expression **resets** to generic magnate voice regardless of operating track.

---

## 5. Gap Inventory

| Gap | ID | Description |
| --- | -- | ----------- |
| **G-01 On-ramp flag silence** | GAP-P96-D01 | `magnate_on_ramp` autoEffects set only `magnate_on_ramp_done`; no native track marker |
| **G-02 Expression flattening** | GAP-P96-D02 | currentGoal/costLabel at magnate entry ignore ledger/caravan; only bridge branches differ |
| **G-03 Age-40 magnate identity flat** | GAP-P96-D03 | `merchantAge40Identity()` uses generic magnate sentence for native path with `magnate_on_ramp_done` |
| **G-04 Pressure continuity** | GAP-P97-04 | `magnate_midlife_pressure` expression does not read P96 expansion sub-flags for native entrants |

### Events exist vs player feels continuity

| Signal | Today | Target (P97) |
| ------ | ----- | ------------ |
| magnate entry marker | `magnate_on_ramp_done` only | + `magnate_native_ledger_entry` / `magnate_native_caravan_entry` |
| currentGoal age 28–32 | Generic or bridge-only | Ledger「稳扩积势跨门槛」/ caravan「赌市扩货跨门槛」 |
| cost label |「巨贾负担」for native | Track-specific burden labels |
| P55 chain | Reachable (seed 804) | Must remain reachable |
| P63/P64 bridge | Differentiated | Must not regress |

---

## 6. P63 Bridge vs Native Track — Scope Boundary

| Dimension | P63/P64 bridge | P97 native |
| --------- | -------------- | ---------- |
| Origin | apprentice / tavern / peasant | `origin_merchant_family` merchant_house |
| Entry marker | `*_merchant_bridge_crossed` | `hvg_merchant_ledger_track` / `hvg_merchant_caravan_track` |
| Expression priority | **Higher** — checked first in expression | Only when no bridge marker |
| magnate mid/late | P64 differentiated pressure/payoff for bridge | **Deferred** to P98+ for native mid/late |
| Implementation surface | Already in `sampleLineExpression.ts` | `magnate_on_ramp` choice wiring + expression |

**P97 does not reopen P63 entry or P64 bridge mid/late differentiation.**

---

## 7. Implementation Scope (for P97-002+)

1. Convert `magnate_on_ramp` to **choice** event with native ledger/caravan branches (pattern: `merchant_midlife_debt_milestone`)
2. Set lightweight downstream markers (`magnate_native_ledger_entry`, `magnate_native_caravan_entry`, sub-flags)
3. Extend `sampleLineExpression.ts` — bridge branches first, then native track
4. Connect P96 expansion flags to `magnate_midlife_pressure` expression (minimal read path)
5. Narrow proof + regression; seed 804 magnate chain baseline

**Non-goals confirmed:** no `merchant_martial_patron`, no full magnate rewrite, no P55 event ID replacement.
