# P31 Key-Choice Bridge Audit Delta

**Date:** 2026-06-24  
**Branch:** `codex/p31-wuxia-wave1-habit-led-achievement-unlock-chain`  
**Story:** P31-001  
**Baseline:** `docs/test-reports/p30-habit-to-achievement-traceability-audit-delta.md`, `docs/test-reports/p30-habit-led-sim-baseline-delta.md`

Read-only inventory of P30 bridge flags vs Wave 1 achievement `key_choices` gaps. No gameplay behavior changed in this story.

---

## 1. P30 Bridge Flags vs Achievement Key Choices

| Achievement | Stat gates (met by P30 fixtures) | Key choice flags required | P30 habit-led fixture bridge flags | Gap |
| --- | --- | --- | --- | --- |
| `jianghu_renown_sage` | martial≥45, rep≥65, social≥55 | `mentor_bond` **or** `ally_network` | `p28_social_network_renown`, `p28_social_reputation_reinforced`, `p29_social_patron_obligation_assumed` | **unlock gap** — stats 100%, key_choices 0% |
| `medical_sage_healer` | rep≥55, resources≥30 | `medical_divine_doctor_fame` **or** `medical_imperial`; ethic: `medical_plague_hero` **or** `medical_pure`; mutex `medical_poison_path` | `p27_study_healer_path`, `p29_study_healer_case_duty`, `p29_social_healer_network` | **unlock gap** — stats 100%, key_choices 0% |

P30 sim baseline: habit-led unlock **0%**, partial progress **100%** for both outcomes (`p30-habit-led-sim-baseline-delta.md`).

---

## 2. Bridge Target Classification

### Renown / social cluster → `jianghu_renown_sage`

| Event ID | Habit gate | Positive choice / bridge flag | Proposed key_choice bridge | Rationale |
| --- | --- | --- | --- | --- |
| `p28_social_momentum_network_fork` | `socialMomentum` ≥2 | `pursue_scholarly_renown` → `p28_social_network_renown` | — (defer) | Thematic overlap; `p28_social_reputation_reinforcement` is cleaner `ally_network` bridge |
| `p28_social_reputation_reinforcement` | `socialMomentum` ≥2 | `attend_banquet` → `p28_social_reputation_reinforced` | **`ally_network`** | Banquet networking → alliance graph; 1 flag max |
| `p29_social_momentum_patron_obligation` | `socialMomentum` ≥3 | `assume_patron_obligations` → `p29_social_patron_obligation_assumed` | **`mentor_bond`** (optional 2nd renown bridge) | Patron obligation sustains mentor-like bond; only 1 renown key_choice needed for unlock |

**P31-002 wiring (renown):** 1 required bridge (`ally_network` on `p28_social_reputation_reinforcement`); optional 2nd (`mentor_bond` on patron obligation) stays within max-4 budget.

### Medical / study cluster → `medical_sage_healer`

| Event ID | Habit gate | Positive choice / bridge flag | Proposed key_choice bridge | Preconditions |
| --- | --- | --- | --- | --- |
| `p27_study_habit_healer_reinforcement` | `studyHabit` ≥2 | `顺势钻研医理` → `p27_study_healer_path` | **`medical_pure`** | ethic dimension; no `medical_poison_path` |
| `p29_study_habit_case_record_duty` | `studyHabit` ≥3 | `接下汇辑之责` → `p29_study_healer_case_duty` | **`medical_divine_doctor_fame`** | requires `p27_study_healer_path` (chain, not bypass) |
| `p29_social_momentum_healer_network` | `socialMomentum` ≥2 | `开设驻点` → `p29_social_healer_network` | — (defer) | Case-duty + p27 chain covers medical key_choice + ethic |

**P31-002 wiring (medical):** 2 bridges — `medical_pure` on p27 positive choice; `medical_divine_doctor_fame` on p29 case duty when `p27_study_healer_path` held.

---

## 3. Bridge Budget Summary

| # | Event | Sets | Habit threshold | Bridge flag precondition |
| --- | --- | --- | --- | --- |
| 1 | `p28_social_reputation_reinforcement` | `ally_network` | `socialMomentum` ≥2 | positive choice (`p28_social_reputation_reinforced`) |
| 2 | `p27_study_habit_healer_reinforcement` | `medical_pure` | `studyHabit` ≥2 | positive choice (`p27_study_healer_path`) |
| 3 | `p29_study_habit_case_record_duty` | `medical_divine_doctor_fame` | `studyHabit` ≥3 | `p27_study_healer_path` + positive choice (`p29_study_healer_case_duty`) |

**Total: 3 bridges** (under max 4). No stat-gate bypass; `medical_poison_path` mutex unchanged.

---

## 4. P31 Story Wiring Order

| Priority | Story | Target |
| --- | --- | --- |
| 1 | P31-001 | This audit |
| 2 | P31-002 | JSON `flag_set` on 3 events + threshold-gated resolver for sim/fixtures |
| 3 | P31-003 | Full-unlock habit-led fixtures via bridge resolver (not direct achievement seed) |
| 4 | P31-004 | Sim baseline delta vs P30 0% unlock |
| 5 | P31-005 | Regression in `p25LifetimeSimulationTests.ts` |
| 6 | P31-006 | **Skip-first** if P31-003 proves unlock via fixtures |
| 7 | P31-007 | Closure report |

---

## 5. Verification

```bash
rg 'p28_social_reputation_reinforced|p27_study_healer_path|p29_study_healer_case_duty' src/p25/validationSlices.ts
rg 'ally_network|medical_pure|medical_divine_doctor_fame' src/data/lines/
```

Audit-only story — no test run required.
