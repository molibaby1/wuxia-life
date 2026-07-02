# P101 Merchant Magnate Bridge-Origin Endgame Gap Audit

> **Stage:** P101 Wuxia Merchant Magnate Bridge-Origin Endgame Differentiation  
> **Story:** P101-001 (read-only; no runtime changes)  
> **Date:** 2026-07-02  
> **Gaps addressed:** GAP-P100-N01

## 1. Purpose

Document the post-`magnate_late_life_done` magnate spine terminus for bridge-origin players (apprentice / tavern / peasant via P63) and isolate where P63 bridge markers stop being consumed at endgame. P101 targets the P100 generic-fallback discontinuity without reopening native P100 ledger/caravan wiring.

---

## 2. Magnate Spine Terminus for Bridge-Origin Players (Pre-P101)

| Age band | Event ID | Key flags | Bridge-origin status |
| -------- | -------- | --------- | -------------------- |
| 28–32 | `magnate_on_ramp` | `magnate_on_ramp_done`, P63 `*_merchant_bridge_crossed` | ✅ Reachable via bridge gate |
| 36–40 | `magnate_midlife_pressure` | `magnate_midlife_pressure_done` | ✅ Generic choices; P64 expression differentiates |
| 42–46 | `magnate_payoff` | `magnate_payoff_done` | ✅ Generic choices; P64 expression differentiates |
| 48–56 | `magnate_late_life` | `magnate_late_life_done`, `magnate_late_life_generic` fallback | ✅ Generic late-life; P64 expression differentiates |
| **58–65** | `magnate_endgame_echo_generic` only | `magnate_endgame_generic` | **⚠️ Flattened — no origin-specific branch** |
| 58–65 | `magnate_endgame_echo_ledger_legacy` / `caravan_legacy` | Native markers | ❌ Blocked by bridge flags |

**P100 bridge terminus:** Bridge-origin magnate players reach `magnate_endgame_echo_generic` at age 58–65. All three origins (apprentice, tavern, peasant) receive the same generic event text and `magnate_endgame_generic` checkpoint — no origin-specific endgame echo event or branch marker.

---

## 3. P63 Bridge Markers Not Consumed at Endgame Spine

| Marker | Set at | Consumed at mid/late expression? | Consumed at endgame spine? |
| ------ | ------ | -------------------------------- | -------------------------- |
| `apprentice_merchant_bridge_crossed` | P58 bridge | ✅ P64 pressure/payoff/late-life/endgame expression | **❌ Only generic echo event** |
| `tavern_merchant_bridge_crossed` | P59 bridge | ✅ P64 expression tiers | **❌ Only generic echo event** |
| `peasant_merchant_bridge_crossed` | P60 bridge | ✅ P64 expression tiers | **❌ Only generic echo event** |

### Expression vs spine gap at endgame band (age 58+)

| Surface | Reads P63 bridge markers? | Origin-differentiated at endgame? |
| ------- | --------------------------- | --------------------------------- |
| `merchantCurrentGoal` | ✅ `apprentice_merchant_bridge_crossed` etc. | ✅ Text differs by origin (P64/P100 expression) |
| `deriveSampleLineCostLabel` | ✅ | ✅ Text differs by origin |
| `merchantAge40Identity` | ✅ | ✅ Text differs by origin |
| **Endgame spine event** | Reads bridge flag for generic routing only | **❌ Single `magnate_endgame_echo_generic` for all origins** |
| **Endgame checkpoint flags** | Sets `magnate_endgame_generic` only | **❌ No `magnate_bridge_endgame_*` branch markers** |

P64 expression already differentiates bridge origins through late-life and into endgame expression tier. The spine gap is: all bridge origins collapse into one generic auto echo with no origin-specific narrative or downstream marker beyond `magnate_endgame_generic`.

---

## 4. Available Endgame Hooks (Pattern Reference)

| Reference | Pattern | P101 target |
| --------- | ------- | ----------- |
| P100 native | `magnate_endgame_echo_ledger_legacy` / `caravan_legacy` reading P99 markers | **Unchanged — blocked for bridge** |
| P100 generic | `magnate_endgame_echo_generic` for bridge + unmatched native | **Split into origin-specific bridge branches** |
| P93 medical bridge | `medical_endgame_echo_*` per bridge branch marker | **Model for P101 bridge magnate echo** |

**Recommended P101 hook:** Extend `magnate_endgame_echo_*` with apprentice/tavern/peasant origin-specific auto events (P100 condition-extension pattern), each setting a distinct `magnate_bridge_endgame_*` checkpoint flag. Generic fallback retains unmatched-native-only scope.

---

## 5. Bridge-Origin vs Native P100 — Scope Boundary

| Dimension | Native merchant_house (P100 closed) | Bridge-origin (P101 target) |
| --------- | ----------------------------------- | ---------------------------- |
| Entry | `magnate_native_*_entry` (P97) | `*_merchant_bridge_crossed` (P63) |
| Mid/late | P98 native markers | Generic choices + P64 expression |
| Late-life | P99 ledger/caravan sample | Generic `magnate_late_life_generic` + P64 expression |
| Endgame spine | `ledger_legacy` / `caravan_legacy` | **P101: origin-specific echo branches** |
| Endgame expression | Native endgame markers after bridge check | Bridge markers retain priority (unchanged) |
| Generic fallback | Unmatched native only | Peasant or unmatched after P101 split |

**P101 does not reopen P100 native ledger/caravan endgame wiring.** Native conditions retain `!apprentice_merchant_bridge_crossed && !tavern_merchant_bridge_crossed && !peasant_merchant_bridge_crossed` guards.

---

## 6. Gap Inventory

| Gap | ID | Description |
| --- | -- | ----------- |
| Bridge endgame spine flattening | GAP-P100-N01 | All bridge origins route to single `magnate_endgame_echo_generic` |
| No bridge endgame branch markers | GAP-P100-N01 | No `magnate_bridge_endgame_*` flags for downstream expression/checkpoint |
| Expression ahead of spine | GAP-P100-N01 | P64 expression differentiates origins but spine event text does not |
| Wave 3 narrative unclosed for bridge | GAP-P100-N01 | Bridge magnate chain lacks origin-specific endgame echo sample |

---

## 7. P101 Target Surface

| Layer | P101 action |
| ----- | ----------- |
| Spine | Add `magnate_endgame_echo_apprentice_craft`, `magnate_endgame_echo_tavern_network`, `magnate_endgame_echo_peasant_grain` auto events |
| Markers | `magnate_bridge_endgame_apprentice_craft`, `magnate_bridge_endgame_tavern_network`, `magnate_bridge_endgame_peasant_grain` |
| Generic | Narrow `magnate_endgame_echo_generic` to unmatched-native-only |
| Expression | Refine endgame tier to read P101 bridge endgame markers (native P100 priority when native late-life markers set) |
| Proof | Focused test + chain proof under `docs/test-reports/` |
