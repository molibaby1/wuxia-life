# P102 Merchant Martial Patron Bridge Scope Contract

> **Date:** 2026-07-02  
> **Stage:** P102 Wuxia Merchant Martial Patron Bridge (Narrow Playable)  
> **Branch:** `codex/p102-wuxia-merchant-martial-patron-bridge-narrow-playable`

---

## 1. Purpose

Lock P102 as a **bounded cross-route patron bridge sample** from martial/wealth commitment into `merchant_martial_patron` playable checkpoints. Prevent scope drift into magnate spine rewrite (P55/P97–P101), full Wave 3 mixed-achievement graph, or new systems.

---

## 2. Patron Bridge Event Band

| Field | Value |
| ----- | ----- |
| **Entry event ID** | `merchant_patron_bridge_entry` |
| **Entry age band** | 34–38 (trigger at age 34) |
| **Entry prerequisite** | `(route_wealth_committed \|\| p22_wealth_route_forked)` && `(merchant_invest_good \|\| merchant_invest_evil \|\| merchant_invest_both)` && !`merchant_patron_bridge_crossed` |
| **Entry checkpoint flags** | `merchant_patron_bridge_crossed`, `merchant_patron_on_ramp_done`, variant: `merchant_patron_on_ramp_orthodox` or `merchant_patron_on_ramp_martial` |
| **Payoff event ID** | `merchant_patron_payoff_echo` |
| **Payoff age band** | 48–52 (trigger at age 48) |
| **Payoff prerequisite** | `merchant_patron_on_ramp_done` && !`merchant_patron_payoff_done` |
| **Terminal checkpoint flags** | `merchant_patron_payoff_done`, `merchant_patron_identity_done` |
| **Event types** | Entry: `choice` (2 variants); Payoff: `auto` (P93 lightweight — narrative + flags, minimal stat change) |

### Entry choice coverage

| Choice | Reads | Sets |
| ------ | ----- | ---- |
| Orthodox sect patron | `merchant_invest_good` or `merchant_invest_both` | `merchant_patron_on_ramp_orthodox` |
| Martial backer patron | `merchant_invest_evil` or `merchant_invest_both` | `merchant_patron_on_ramp_martial` |

---

## 3. Allowed Surfaces

| Layer | Allowed |
| ----- | ------- |
| **Spine wiring** | Two events (`merchant_patron_bridge_entry`, `merchant_patron_payoff_echo`) in `sample-lines-spine.json` |
| **Expression** | Patron branches in `merchantCurrentGoal`, `merchantAge40Identity`, `deriveSampleLineCostLabel` (minimum 2 surfaces) |
| **Markers** | `merchant_patron_*` checkpoint flags listed above |
| **Consequences** | Entry: light stat_modify optional; Payoff: no stat_modify (P93 compliant) |
| **Proof** | One chain proof under `docs/test-reports/` |
| **Tests** | Focused test file `tests/p102MerchantMartialPatronBridgeTests.ts` |

---

## 4. Forbidden Items

| Forbidden | Reason |
| --------- | ------ |
| P55/P97–P101 magnate spine rewrite | Prior stages closed |
| `magnate_on_ramp` condition reuse for patron entry | PRD core decision — distinct fork |
| Full patron pressure/mid/late chain | Narrow playable only |
| Ordinary-origin bridge rewrite (P58/P59/P60/P63) | Out of scope |
| Full Wave 3 mixed-achievement graph | PRD non-goal |
| New UI panels | PRD non-goal |
| New economy / trade-platform / second progression container | PRD non-goal |
| Heavy stat changes at payoff echo | P93 lightweight pattern |
| Full-lifetime `gate:p20` broad rerun | Out of bounded sample scope |

---

## 5. Magnate vs Patron Path Rules

| Rule | Detail |
| ---- | ------ |
| **Coexistence** | Gate definition allows `merchant_martial_patron` to coexist with `merchant_magnate` |
| **Spine independence** | Patron entry does not read `magnate_on_ramp_done`; magnate entry does not read patron flags |
| **Expression priority** | When `magnate_on_ramp_done` or downstream magnate markers are set, magnate expression tiers **win** over patron branches |
| **Patron visibility** | Patron expression surfaces activate when patron checkpoint flags are set and magnate tier markers are absent |
| **No mutual-exclusion lock** | Patron bridge does not block magnate; magnate does not block patron spine firing — expression resolves priority |

---

## 6. P102 vs Adjacent Stages

| Stage | Scope | P102 relationship |
| ----- | ----- | ----------------- |
| P37 | Habit-led lifetime trace for patron | Evidence chain input; unchanged |
| P55–P101 | Magnate spine | Regression guard only |
| P63 | Ordinary → magnate bridge entry | Not reopened |
| P83 | Medical sage bridge pattern | Reference for narrow bridge shape |
| P102+ | Full patron graph, ordinary-origin patron bridges | Deferred |

---

## 7. Success Criteria

- At least one wealth+invest → patron checkpoint playable path through spine
- At least two player-facing expression pairs distinguish patron from generic merchant and magnate on-ramp
- P97–P101 magnate tests pass (no regression)
- P101 bridge-origin endgame tests pass (no regression)
- `npm run guard:sample-lines-baseline` stays green
- `npm run typecheck` passes
