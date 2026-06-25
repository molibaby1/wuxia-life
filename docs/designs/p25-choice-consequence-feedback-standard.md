# P25 Choice Consequence Feedback Standard (US-004)

Wave 1 application of the three-layer feedback model for lifetime simulation. Extends `docs/test-reports/product-experience-governance-choice-feedback-standard.md` and `docs/designs/p25-lifetime-simulation-design-rules.md` §2.

---

## 1. Required Layers (both channels)

| Layer | Active planning | Event-triggered (golden spine) |
| --- | --- | --- |
| **Immediate narrative** | Action result text from resolver | `choice.description` or `outcomes[].text` |
| **Visible impact** | `ChoiceFeedbackModel.player.statImpacts` etc. | Same via `ChoiceFeedbackGenerator` |
| **Future implication** | Route/identity flags in feedback | `flag_set` + narrative tie-in; listed in `golden-line-payoff-map.json` |

Gate: `npm run report:golden-line-feedback` (0 issues on manual spine choices).

---

## 2. Priority Paths Covered

### Event-triggered (golden spine)

All `golden-line-spine.json` `manualChoiceEventIds` and `keyChoiceEventIds`:

- childhood_preference → martial_arts_enlightenment payoff
- sect_path_choice → orthodox trial / wanderer arcs (+ `mentor_bond` on orthodox path)
- orthodox_trial_* chain → midlife stewardship
- demonic_encounter / sect_trial_final / hero_first_case → mid/late payoffs

### Active planning

P16 agency actions ages 5+ via `ActionResultResolver` + `ChoiceFeedbackGenerator` (unchanged runtime; validated by existing headless tests).

---

## 3. Long-Term State Contract

Key spine choices must write flags in `golden-line-payoff-map.json` `durableWrites`. Runtime validation: `src/p25/choiceFeedbackValidation.ts` `validateKeyChoicePayoffCoverage()`.

P25 achievement flags (`mentor_bond`, `p16_guardian_oath`, etc.) are additional durable writes surfaced in choice/auto effect narratives.

---

## 4. Fixes Applied (Wave 1)

| Surface | Change |
| --- | --- |
| `sect_path_choice` join_orthodox | Sets `mentor_bond`; existing description covers future implication |
| `orthodox_trial_completion` | Sets `p16_guardian_oath` with narrative auto text |
| `jianghu_year_patrol` patrol_righteous | Sets `ally_network` with visible reputation/chivalry impacts |
| `relationship.json` 知遇之恩 | Sets `mentor_bond` alongside `has_mentor` |
| `medical_divine_doctor_fame` | Sets `medical_divine_doctor_fame` flag (fixes hidden-only stat delta) |

No banned vague patterns on active golden-line choices (scan PASS 2026-06-23).

---

## 5. Verification

```bash
npm run report:golden-line-feedback
npm exec tsx tests/p25LifetimeSimulationTests.ts
```

Relevant tests include `testKeyChoiceFeedbackCoverage` and golden-line scan integration.
