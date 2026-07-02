# P103 Merchant Martial Patron Bridge-Origin Scope Contract

> **Date:** 2026-07-02  
> **Stage:** P103 Wuxia Merchant Martial Patron Bridge-Origin (Narrow Playable)  
> **Branch:** `codex/p103-wuxia-merchant-martial-patron-bridge-origin-narrow-playable`

---

## 1. Purpose

Lock P103 as a **bounded bridge-origin patron entry extension** for apprentice/tavern (≥2 origins) into `merchant_martial_patron` playable checkpoints. Prevent scope drift into P102 native rewrite, magnate spine rewrite (P55/P97–P101), or full Wave 3 graph.

---

## 2. Bridge-Origin Patron Entry Event Band

| Field | Value |
| ----- | ----- |
| **Entry event ID** | `merchant_patron_bridge_entry` (extended — not new event) |
| **Entry age band** | 34–38 (unchanged from P102) |
| **Native gate arm** | `(route_wealth_committed \|\| p22_wealth_route_forked)` && `(merchant_invest_good \|\| merchant_invest_evil \|\| merchant_invest_both)` — **unchanged** |
| **Bridge gate arm** | `route_wealth_committed` && (`apprentice_merchant_bridge_crossed` \|\| `tavern_merchant_bridge_crossed`) |
| **Combined gate** | `(native arm \|\| bridge arm)` && !`merchant_patron_bridge_crossed` && childhood seed guards |
| **Bridge checkpoint flags** | `merchant_patron_bridge_apprentice_craft`, `merchant_patron_bridge_tavern_network` |
| **Shared checkpoint flags** | `merchant_patron_bridge_crossed`, `merchant_patron_on_ramp_done` |
| **Payoff event** | `merchant_patron_payoff_echo` — **unchanged** (reads `merchant_patron_on_ramp_done`) |

### Bridge-origin entry choices

| Choice ID | Condition | Sets |
| --------- | --------- | ---- |
| `patron_bridge_apprentice_craft_alliance` | `apprentice_merchant_bridge_crossed` | `merchant_patron_bridge_apprentice_craft` |
| `patron_bridge_tavern_network_alliance` | `tavern_merchant_bridge_crossed` | `merchant_patron_bridge_tavern_network` |

### Native entry choices (P102 — unchanged)

| Choice ID | Condition | Sets |
| --------- | --------- | ---- |
| `patron_embrace_orthodox_sect` | `merchant_invest_good` or `merchant_invest_both` | `merchant_patron_on_ramp_orthodox` |
| `patron_embrace_martial_backer` | `merchant_invest_evil` or `merchant_invest_both` | `merchant_patron_on_ramp_martial` |

---

## 3. Allowed Surfaces

| Layer | Allowed |
| ----- | ------- |
| **Spine wiring** | Extend `merchant_patron_bridge_entry` conditions + bridge-origin choices in `sample-lines-spine.json` |
| **Expression** | Bridge-origin branches in `merchantCurrentGoal`, `merchantAge40Identity`, `deriveSampleLineCostLabel` (minimum 2 surfaces) |
| **Markers** | `merchant_patron_bridge_apprentice_craft`, `merchant_patron_bridge_tavern_network` |
| **Proof** | Chain proof + closure report under `docs/test-reports/` |
| **Tests** | Focused test file `tests/p103MerchantMartialPatronBridgeOriginTests.ts` |

---

## 4. Forbidden Items

| Forbidden | Reason |
| --------- | ------ |
| P102 native wealth+invest gate rewrite | Prior stage closed — extend only |
| P55/P97–P101 magnate spine rewrite | Prior stages closed |
| P58/P59/P60/P63 bridge event rewrite | Out of scope |
| Full patron pressure/mid/late chain | Narrow playable only |
| Full Wave 3 mixed-achievement graph | PRD non-goal |
| New UI panels | PRD non-goal |
| New economy / trade-platform | PRD non-goal |
| Heavy stat changes at payoff echo | P93 lightweight pattern |
| Full-lifetime `gate:p20` broad rerun | Out of bounded sample scope |

---

## 5. Bridge-Origin vs Native Entry Priority Rules

| Rule | Detail |
| ---- | ------ |
| **Gate coexistence** | Native arm and bridge arm are OR-combined; either can open entry |
| **Choice visibility** | Native choices require invest flags; bridge choices require bridge markers — mutually exclusive in typical play |
| **Dual-marker edge case** | If both invest and bridge markers present, native invest choices remain available; expression prefers native orthodox/martial variants |
| **Expression priority (magnate)** | When `magnate_on_ramp_done` or downstream magnate markers set, magnate expression tiers **win** over patron branches |
| **Expression priority (native patron)** | When `merchant_patron_on_ramp_orthodox/martial` set, native patron expression **wins** over bridge-origin patron branches |
| **Expression priority (bridge patron)** | Bridge-origin expression activates when `merchant_patron_bridge_apprentice_craft` or `merchant_patron_bridge_tavern_network` set (or P63 bridge marker + `merchant_patron_on_ramp_done` without native variant) |
| **Payoff echo** | Unchanged — fires on `merchant_patron_on_ramp_done` regardless of entry arm |

---

## 6. P103 vs Adjacent Stages

| Stage | Relationship |
| ----- | ------------ |
| P102 | Extends patron entry; does not rewrite native path |
| P101 | Pattern reference (bridge-origin branches); different achievement (`merchant_magnate` vs `merchant_martial_patron`) |
| P63/P58/P59 | Reads bridge markers; does not modify bridge events |
| P97–P101 | Regression guard only |

---

## 7. Deferred

- Peasant bridge-origin patron entry (`peasant_merchant_bridge_crossed`)
- Full patron pressure/mid/late chain
- Full Wave 3 mixed-achievement graph
- North Star §8 broader waves
