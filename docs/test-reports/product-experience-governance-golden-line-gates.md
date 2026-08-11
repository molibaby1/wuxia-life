# Product Experience Governance — Golden Line Gates (PXG4)

生成时间：2026-08-09T10:17:35.025Z

结果：**PASS**

## Active scope summary

- active blockers: **0**
- total quality issues: 186
- deferred warnings (major+): 72
- candidate warnings (major+): 4

## Simulation samples

| Sample | Route track | Final age | Choices |
| --- | --- | --- | --- |
| golden-sect | sect | 50 | 24 |
| golden-wanderer | wanderer | 50 | 27 |
| golden-demonic | demonic | 50 | 26 |
| golden-neutral-baseline | neutral | 50 | 26 |
| golden-romance-family | neutral | 50 | 26 |

## Payoff coverage (static vs simulated)

- static map: **90.0%**
- simulated threshold: **70%**
- missed opportunities (simulated_gap): **0**
- never-reached key choices: **8**

| Sample | Sim rate | Static | Pass |
| --- | ---: | ---: | --- |
| golden-sect | 100.0% | 90.0% | yes |
| golden-wanderer | 100.0% | 90.0% | yes |
| golden-demonic | 100.0% | 90.0% | yes |
| golden-neutral-baseline | 100.0% | 90.0% | yes |
| golden-romance-family | 100.0% | 90.0% | yes |

## Gate findings

| Gate | Severity | Status | Detail |
| --- | --- | --- | --- |
| payoff | info | warning | Never-reached key choice (cohort): childhood_preference; expected=martial_arts_enlightenment; blockReason=condition_unmet (prerequisite chain not completed in deterministic replay) |
| payoff | info | warning | Never-reached key choice (cohort): martial_arts_enlightenment; expected=martial_focus_payoff, martial_improvement, sect_trial; blockReason=condition_unmet (prerequisite chain not completed in deterministic replay) |
| payoff | info | warning | Never-reached key choice (cohort): orthodox_trial_entry; expected=orthodox_trial_service, orthodox_trial_recovery, sect_midlife_stewardship; blockReason=condition_unmet (prerequisite chain not completed in deterministic replay) |
| payoff | info | warning | Never-reached key choice (cohort): orthodox_trial_service; expected=orthodox_trial_completion, sect_midlife_gray_mission; blockReason=condition_unmet (prerequisite chain not completed in deterministic replay) |
| payoff | info | warning | Never-reached key choice (cohort): demonic_encounter; expected=; blockReason=route_fixture_skip (demonic track fixture may skip demonic_encounter entirely) |
| payoff | info | warning | Never-reached key choice (cohort): demonic_power_struggle; expected=demonic_usurpation, demonic_renounce_path; blockReason=condition_unmet (prerequisite chain not completed in deterministic replay) |
| payoff | info | warning | Never-reached key choice (cohort): sect_trial_final; expected=sect_trial, martial_improvement; blockReason=route_fixture_skip (sect fixture may sync sect_trial_completed without sect_trial_final event) |
| payoff | info | warning | Never-reached key choice (cohort): hero_first_case; expected=hero_save_village, hero_old_case_returns, continued_journey; blockReason=condition_unmet (hero identity and faction gates not satisfied in P3-EVAL replays) |

Regenerate: `npm run gate:golden-line`
