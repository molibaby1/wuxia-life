# Product Experience Governance — Key Choice Payoff Map

**Stories:** US-008  
**Machine source:** `src/data/golden-line-payoff-map.json`

---

## Summary

| Metric | Value |
| --- | ---: |
| Key choices | 9 |
| With payoff within 0–30 | 9 |
| Payoff rate | **100%** (threshold ≥ 70%) |

---

## Key choice definition

A **key choice** must:

1. Appear in `golden-line-spine.json` → `keyChoiceEventIds`
2. Write durable state: flag, route, relationship, or identity
3. Be player-facing (manual choice event)

## Payoff definition

A **payoff** is a later event (age ≤ 30) that:

- Reads the durable state in `conditions` / `triggerConditions`, **or**
- Changes availability, narrative text, or choices based on that state

Text-only callbacks count when tied to mechanical state read (scope freeze §4 resolved decision #3).

---

## Map (human-readable)

| Key choice | Writes | Later payoff (≤ 30) | Payoff type |
| --- | --- | --- | --- |
| `childhood_preference` | `diligentStudent`, `freeSpirit`, `balancedApproach` | `martial_arts_enlightenment` | altered choice availability |
| `martial_arts_enlightenment` | `externalFocus`, `internalFocus`, … | `sect_trial`, `martial_improvement` | route / text |
| `sect_path_choice` | `route_orthodox`, `route_wanderer` | `orthodox_initiation`, `jianghu_experience`, `demonic_encounter` | altered availability |
| `orthodox_trial_entry` | `orthodox_trial_*_done` | `orthodox_trial_service`, `orthodox_trial_recovery` | gate chain |
| `orthodox_trial_service` | `orthodox_trial_service_done` | `orthodox_trial_completion` | gate chain |
| `demonic_encounter` | `route_demonic` | `demonic_trial` → `demonic_trial_shadow` → `understand_unconventional_truth` | route chain |
| `demonic_power_struggle` | `demonic_path_usurp` / `renounce` | `demonic_usurpation`, `demonic_renounce_path` | branch payoff |
| `sect_trial_final` | `sect_trial_completed` | `martial_improvement`, sect progression | route state |
| `hero_first_case` | `hero_first_case` | `hero_save_village` (25–30), `continued_journey` | achievement gate |

---

## Residual notes for PXG3/PXG4

- `hero_first_case` still requires `identity: hero` at runtime — wanderer route lifecycle should wire hero identity earlier (PXG3).
- `understand_unconventional_truth` reads `sect_faction == unconventional`; demonic arc should set this consistently (PXG3).
- PXG4 continuity gate should validate payoff rate from this JSON automatically.

---

*PXG2 — 2026-05-30*
