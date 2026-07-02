# P104 Merchant Martial Patron Bridge-Origin Peasant Gap Audit

> **Stage:** P104 Wuxia Merchant Martial Patron Bridge-Origin Peasant (Narrow Playable)  
> **Story:** P104-001 (read-only; no runtime changes)  
> **Date:** 2026-07-02  
> **Gaps addressed:** GAP-P103-N01

## 1. Purpose

Document the P103 patron bridge entry gate and where `peasant_merchant_bridge_crossed` is not consumed at patron spine entry. P104 targets the P103 peasant deferral without reopening P102 native wiring, P103 apprentice/tavern wiring, or P55/P97–P101 magnate spine.

---

## 2. P103 Patron Bridge Entry Gate (Pre-P104)

| Field | Value |
| ----- | ----- |
| **Event ID** | `merchant_patron_bridge_entry` |
| **Age band** | 34–38 |
| **Native gate arm** | `(route_wealth_committed \|\| p22_wealth_route_forked)` **AND** `(merchant_invest_good \|\| merchant_invest_evil \|\| merchant_invest_both)` |
| **Bridge gate arm (P103)** | `route_wealth_committed` **AND** (`apprentice_merchant_bridge_crossed` **OR** `tavern_merchant_bridge_crossed`) |
| **Combined gate** | `(native arm \|\| bridge arm)` **AND** !`merchant_patron_bridge_crossed` |
| **Bridge choices** | `patron_bridge_apprentice_craft_alliance`, `patron_bridge_tavern_network_alliance` |
| **Bridge checkpoint flags** | `merchant_patron_bridge_apprentice_craft`, `merchant_patron_bridge_tavern_network` |

**P103 closed scope:** Apprentice and tavern bridge-origin players can enter patron bridge without `merchant_invest_*`. Native P102 wealth+invest path unchanged.

---

## 3. Peasant Bridge Marker Not Consumed at Patron Entry

| Marker | Set at | Consumed at magnate spine? | Consumed at patron entry? |
| ------ | ------ | -------------------------- | ------------------------- |
| `peasant_merchant_bridge_crossed` | P60 `farm_peasant` bridge | ✅ `magnate_on_ramp` gate | **❌ Not read** |

### Peasant vs P103 closed scope

| Dimension | P103 closed (apprentice/tavern) | P104 target (peasant) |
| --------- | ------------------------------- | --------------------- |
| Bridge marker | `apprentice_merchant_bridge_crossed`, `tavern_merchant_bridge_crossed` | `peasant_merchant_bridge_crossed` |
| Entry choice | origin-specific alliance choice | **P104: `patron_bridge_peasant_grain_alliance`** |
| Checkpoint flag | `merchant_patron_bridge_apprentice_craft`, `merchant_patron_bridge_tavern_network` | **P104: `merchant_patron_bridge_peasant_grain`** |
| Payoff echo | `merchant_patron_payoff_echo` (unchanged) | Same — reads `merchant_patron_on_ramp_done` |

**Impact:** Peasant bridge-origin players who crossed P60 merchant bridge can enter magnate path but cannot reach `merchant_patron_bridge_entry` unless they also completed `merchant_sect_investment`. Wave 3 `merchant_martial_patron` narrative remains unclosed for the third ordinary-origin bridge.

---

## 4. Prerequisite Flags (P60/P103 Evidence)

| Flag | Source | Role in peasant patron entry |
| ---- | ------ | ------------------------------ |
| `route_wealth_committed` | P22 wealth fork / P60 bridge | Wealth route commitment (shared) |
| `peasant_merchant_bridge_crossed` | P60 `farm_peasant` bridge | **P104 peasant-origin patron entry arm** |
| `merchant_invest_*` | `merchant_sect_investment` | Native P102 path only — not required for bridge arm |
| `merchant_patron_bridge_crossed` | P102/P103 patron entry | Terminal once-per-lifetime guard |
| `merchant_patron_on_ramp_done` | Patron entry choice | Shared payoff prerequisite |

---

## 5. Gap Inventory

| Gap | ID | P104 story |
| --- | -- | ---------- |
| Patron bridge gate ignores `peasant_merchant_bridge_crossed` | GAP-P103-N01 | P104-003 |
| No peasant bridge-origin patron expression | GAP-P103-N01 | P104-004 |
| No peasant bridge-origin patron proof/tests | GAP-P103-N01 | P104-005 |
| No scope contract | GAP-P103-N01 | P104-002 |

---

## 6. Recommended P104 Hook (Minimal Spine Extension)

1. **Extend** `merchant_patron_bridge_entry` bridge gate arm: add `peasant_merchant_bridge_crossed` to OR clause alongside apprentice/tavern
2. **Add** `patron_bridge_peasant_grain_alliance` choice with checkpoint flag `merchant_patron_bridge_peasant_grain`
3. **Refine** patron expression tiers to read peasant bridge marker (native invest and apprentice/tavern variants retain priority)
4. **Proof** focused test + chain proof under `docs/test-reports/`

**No changes** to `merchant_patron_payoff_echo`, magnate spine, or P58/P59/P60 bridge events.
