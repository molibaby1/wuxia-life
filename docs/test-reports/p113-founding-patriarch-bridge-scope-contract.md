# P113 Founding Patriarch Bridge Scope Contract

> **Date:** 2026-07-02  
> **Stage:** P113 Wuxia Founding Patriarch Bridge (Narrow Playable)  
> **Branch:** `codex/p113-wuxia-founding-patriarch-bridge-narrow-playable`

---

## 1. Purpose

Lock P113 as a **bounded cross-route pinnacle bridge sample** from scholar/faction commitment into `founding_patriarch` playable checkpoints. Prevent scope drift into full faction graph rewrite, P37 lifetime trace reopen, or P102–P112 patron spine changes.

---

## 2. Founding Patriarch Bridge Event Band

| Field | Value |
| ----- | ----- |
| **Entry event ID** | `founding_patriarch_bridge_entry` |
| **Entry age band** | 32–38 (trigger at age 32) |
| **Entry prerequisite** | `(p16_scholar_mentor \|\| p16_alliance_brokered)` && `(p22_faction_continuation_active \|\| p16_alliance_brokered)` && `orthodox_childhood_seed_done` && !`founding_patriarch_bridge_crossed` && !renown/medical/merchant childhood seeds |
| **Entry checkpoint flags** | `founding_patriarch_bridge_crossed`, `founding_patriarch_on_ramp_done`, variant: `founding_patriarch_on_ramp_scholar` or `founding_patriarch_on_ramp_alliance` |
| **Payoff event ID** | `founding_patriarch_payoff_echo` |
| **Payoff age band** | 48–52 (trigger at age 48) |
| **Payoff prerequisite** | `founding_patriarch_on_ramp_done` && !`founding_patriarch_payoff_done` |
| **Terminal checkpoint flags** | `founding_patriarch_payoff_done`, `founding_patriarch_identity_done`, choice marker |
| **Event types** | Entry: `choice` (2 variants); Payoff: `choice` v2.0.0 (P93 lightweight terminal + flags) |

### Entry choice coverage

| Choice | Reads | Sets |
| ------ | ----- | ---- |
| Scholar mentor founding path | `p16_scholar_mentor` | `founding_patriarch_on_ramp_scholar` |
| Alliance faction founding path | `p16_alliance_brokered` or `p22_faction_continuation_active` | `founding_patriarch_on_ramp_alliance` |

---

## 3. Allowed Surfaces

| Layer | Allowed |
| ----- | ------- |
| **Spine wiring** | Two events (`founding_patriarch_bridge_entry`, `founding_patriarch_payoff_echo`) in `sample-lines-spine.json` |
| **Expression** | Founding-patriarch branches in `orthodoxCurrentGoal`, `orthodoxAge40Identity`, `deriveSampleLineCostLabel` (minimum 2 surfaces) |
| **Markers** | `founding_patriarch_*` checkpoint flags listed above |
| **Consequences** | Entry: light stat_modify optional; Payoff: minimal stat_modify (P93 compliant) |
| **Proof** | One chain proof under `docs/test-reports/` |
| **Tests** | Focused test file `tests/p113FoundingPatriarchBridgeTests.ts` |

---

## 4. Forbidden Items

| Forbidden | Reason |
| --------- | ------ |
| P37 `founding_patriarch` lifetime trace rewrite | Prior stage closed |
| P35 `jianghu_myth_legend` lifetime trace reopen | Prior stage closed |
| P102–P112 patron spine rewrite | Prior stages closed |
| Full faction empire graph / multi-event pinnacle arc | PRD non-goal |
| Renown endgame condition reuse for founding-patriarch entry | PRD core decision — distinct fork |
| Full founding-patriarch pressure/mid/late chain | Narrow playable only |
| New UI panels | PRD non-goal |
| New scheduler / second sect container | PRD non-goal |
| Heavy stat changes at payoff echo | P93 lightweight pattern |
| Full-lifetime `gate:p20` broad rerun | Out of bounded sample scope |

---

## 5. Founding Patriarch vs Renown vs Patron Path Rules

| Rule | Detail |
| ---- | ------ |
| **Sample line** | Founding-patriarch bridge uses `orthodox` sample line (scholar/faction origin) |
| **Renown orthogonality** | Renown bridge reads `tavern_renown_bridge_crossed`; founding-patriarch entry excludes active renown bridge flags |
| **Patron orthogonality** | Patron spine reads wealth+invest flags; founding-patriarch does not read `merchant_patron_*` or `merchant_invest_*` |
| **Spine independence** | Founding-patriarch entry does not read patron/magnate checkpoint flags |
| **Expression priority** | Founding-patriarch expression activates on `founding_patriarch_on_ramp_done`; generic orthodox tiers checked when patriarch markers absent |
| **No mutual-exclusion lock** | Founding-patriarch bridge does not block patron/magnate; different sample lines resolve independently |

---

## 6. P113 vs Adjacent Stages

| Stage | Scope | P113 relationship |
| ----- | ----- | ----------------- |
| P37 | Habit-led lifetime trace for founding_patriarch | Evidence chain input; unchanged |
| P35 | `jianghu_myth_legend` pinnacle trace | Regression guard only |
| P79–P81 | Renown endgame chain | Distinct outcome; not reopened |
| P102–P112 | Patron spine | Regression guard only |
| P102 | Patron bridge pattern reference | Structural precedent only |

---

## 7. Success Criteria

- At least one scholar/faction commitment → founding-patriarch checkpoint playable path through spine
- At least two player-facing expression pairs distinguish founding-patriarch from generic orthodox and renown on-ramp
- P37 + P102–P112 tests pass (no regression)
- `npm run guard:sample-lines-baseline` stays green
- `npm run typecheck` passes
