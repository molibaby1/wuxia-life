# P103 Merchant Martial Patron Bridge-Origin Gap Audit

> **Stage:** P103 Wuxia Merchant Martial Patron Bridge-Origin (Narrow Playable)  
> **Story:** P103-001 (read-only; no runtime changes)  
> **Date:** 2026-07-02  
> **Gaps addressed:** GAP-P102-N01

## 1. Purpose

Document the P102 patron bridge entry gate and where P63 bridge-origin markers (`apprentice_merchant_bridge_crossed`, `tavern_merchant_bridge_crossed`, `peasant_merchant_bridge_crossed`) are not consumed at patron spine entry. P103 targets the wealth-only gate discontinuity without reopening P102 native wiring or P55/P97–P101 magnate spine.

---

## 2. P102 Patron Bridge Entry Gate (Pre-P103)

| Field | Value |
| ----- | ----- |
| **Event ID** | `merchant_patron_bridge_entry` |
| **Age band** | 34–38 |
| **Gate expression** | `(route_wealth_committed \|\| p22_wealth_route_forked)` **AND** `(merchant_invest_good \|\| merchant_invest_evil \|\| merchant_invest_both)` **AND** !`merchant_patron_bridge_crossed` |
| **Choices** | `patron_embrace_orthodox_sect` (reads `merchant_invest_good/both`); `patron_embrace_martial_backer` (reads `merchant_invest_evil/both`) |
| **Checkpoint flags** | `merchant_patron_bridge_crossed`, `merchant_patron_on_ramp_done`, variant `merchant_patron_on_ramp_orthodox` or `merchant_patron_on_ramp_martial` |

**Native path (P102 closed):** `merchant_house` players with P22 wealth fork + `merchant_sect_investment` reach patron entry. Expression differentiates orthodox vs martial variants.

---

## 3. P63 Bridge Markers Not Consumed at Patron Entry

| Marker | Set at | Consumed at magnate spine? | Consumed at patron entry? |
| ------ | ------ | -------------------------- | ------------------------- |
| `apprentice_merchant_bridge_crossed` | P58 bridge | ✅ `magnate_on_ramp` gate | **❌ Not read** |
| `tavern_merchant_bridge_crossed` | P59 bridge | ✅ `magnate_on_ramp` gate | **❌ Not read** |
| `peasant_merchant_bridge_crossed` | P60 bridge | ✅ `magnate_on_ramp` gate | **❌ Not read** |

### Bridge-origin vs patron gate mismatch

| Bridge-origin prerequisite (P63 evidence) | P102 patron gate requires | Gap |
| ----------------------------------------- | ------------------------- | --- |
| `route_wealth_committed` | ✅ Same | — |
| `*_merchant_bridge_crossed` | ❌ Not read | **Primary gap** |
| `merchant_invest_*` | ✅ Required | Bridge players may lack sect investment — need bridge-origin alternate gate arm |

**Impact:** Apprentice/tavern/peasant players who crossed P63 merchant bridge can enter magnate path but cannot reach `merchant_patron_bridge_entry` unless they also completed `merchant_sect_investment`. Wave 3 `merchant_martial_patron` narrative remains unclosed for ordinary-origin bridge players.

---

## 4. Prerequisite Flags (P63/P102 Evidence)

| Flag | Source | Role in bridge-origin patron entry |
| ---- | ------ | ------------------------------------ |
| `route_wealth_committed` | P22 wealth fork / P58/P59/P60 bridge | Wealth route commitment (shared) |
| `apprentice_merchant_bridge_crossed` | P58 `town_apprentice` bridge | Apprentice-origin patron entry arm |
| `tavern_merchant_bridge_crossed` | P59 `tavern_hand` bridge | Tavern-origin patron entry arm |
| `peasant_merchant_bridge_crossed` | P60 `farm_peasant` bridge | Deferred — apprentice/tavern prioritized |
| `merchant_invest_*` | `merchant_sect_investment` | Native P102 path only — not required for bridge arm |
| `merchant_patron_bridge_crossed` | P102 patron entry | Terminal once-per-lifetime guard |

---

## 5. Bridge-Origin Patron vs Native P102 — Scope Boundary

| Dimension | Native merchant_house (P102 closed) | Bridge-origin (P103 target) |
| --------- | ----------------------------------- | ---------------------------- |
| Entry gate | wealth + invest flags | **P103: bridge marker + route_wealth_committed** |
| Entry choices | orthodox / martial (invest-driven) | **P103: origin-specific variant choices** |
| Checkpoint markers | `merchant_patron_on_ramp_orthodox/martial` | **P103: `merchant_patron_bridge_apprentice_craft` / `merchant_patron_bridge_tavern_network`** |
| Payoff echo | `merchant_patron_payoff_echo` (unchanged) | Same event — reads `merchant_patron_on_ramp_done` |
| Expression | P102 orthodox/martial branches | **P103: bridge-origin expression pairs** |
| Magnate coexistence | Expression priority: magnate wins | Unchanged |

**P103 does not reopen P102 native wealth+invest wiring.** Native gate arm retains existing expression unchanged.

---

## 6. Gap Inventory

| Gap | ID | P103 story |
| --- | -- | ---------- |
| Patron entry ignores P63 bridge markers | GAP-P102-N01 | P103-003 |
| No bridge-origin patron expression | GAP-P102-N01 | P103-004 |
| No bridge-origin patron proof/tests | GAP-P102-N01 | P103-005 |
| No scope contract | GAP-P102-N01 | P103-002 |

---

## 7. Recommended P103 Hook (Minimal Spine Extension)

1. **Extend** `merchant_patron_bridge_entry` gate: OR arm for `(route_wealth_committed && (apprentice_merchant_bridge_crossed || tavern_merchant_bridge_crossed))`
2. **Add** origin-specific choices with distinct text + checkpoint flags (`merchant_patron_bridge_apprentice_craft`, `merchant_patron_bridge_tavern_network`)
3. **Refine** patron expression tiers to read bridge markers (native invest variants retain priority when `merchant_patron_on_ramp_orthodox/martial` set; magnate tiers retain priority)
4. **Proof** focused test + chain proof under `docs/test-reports/`

**No changes** to `merchant_patron_payoff_echo`, magnate spine, or P58/P59/P60 bridge events.
