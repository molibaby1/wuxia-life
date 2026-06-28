# P30 Habit-To-Achievement Traceability — Audit Delta

**Date:** 2026-06-24  
**Branch:** `codex/p30-wuxia-wave1-behavior-led-achievement-sim-trace`  
**Story:** P30-001  
**Baseline:** `docs/test-reports/p29-closure-report.md`, `src/p25/achievementTraceability.ts`, `src/p25/validationSlices.ts`

Read-only inventory of P27–P29 habit/semi-personality events vs Wave 1 composite achievement requirements. No gameplay behavior changed in this story.

---

## 1. P27–P29 Event Inventory (Habit / Semi-Personality)

| Event ID | Axis | Gate | Output flags | Pool |
| --- | --- | --- | --- | --- |
| `p27_study_habit_healer_reinforcement` | `studyHabit` | ≥2, age≥20 | `p27_study_healer_path`, `p27_study_healer_path_declined` | medical |
| `p27_mentor_obligation_consequence` | `trainingHabit` | ≥3, age≥32 | `p27_mentor_obligation_assumed`, `p27_mentor_obligation_declined` | p22 |
| `p27_renown_upkeep_pressure` | `studyHabit` | ≥3, age≥34 | `p27_renown_upkeep_active`, `p27_renown_upkeep_declined` | p22 |
| `p28_social_momentum_network_fork` | `socialMomentum` | ≥2, age≥24 | `p28_social_network_merchant`, `p28_social_network_renown` | p22 |
| `p28_social_reputation_reinforcement` | `socialMomentum` | ≥2, age≥28 | `p28_social_reputation_reinforced`, `p28_social_reputation_declined` | p22 |
| `p28_family_bond_elder_care` | `familyBond` | ≥2, age≥40 | `p28_elder_care_in_person`, `p28_elder_care_hired` | family-life |
| `p28_family_bond_sibling_support` | `familyBond` | ≥2, age≥32 | `p28_sibling_support_full`, `p28_sibling_support_partial` | family-life |
| `p28_family_bond_caretaker_obligation` | `familyBond` | ≥3, age≥44 | `p28_family_stewardship_assumed`, `p28_family_stewardship_declined` | p22 |
| `p29_study_habit_case_record_duty` | `studyHabit` | ≥3, age≥28 | `p29_study_healer_case_duty`, `p29_study_healer_case_declined` | medical |
| `p29_social_momentum_healer_network` | `socialMomentum` | ≥2, age≥26 | `p29_social_healer_network`, `p29_social_healer_network_limited` | medical |
| `p29_social_momentum_patron_obligation` | `socialMomentum` | ≥3, age≥36 | `p29_social_patron_obligation_assumed`, `p29_social_patron_obligation_declined` | p22 |

**P26 business echo (context only):** `p26_business_habit_obligation` — not P27–P29; excluded from P30 trace targets.

---

## 2. Wave 1 Achievement Composite Requirements

| Achievement | Stat gates | Key choice flags | Traceability today (pre-P30) |
| --- | --- | --- | --- |
| `jianghu_renown_sage` | martial≥45, rep≥65, social≥55 | `mentor_bond` **or** `ally_network` | Legacy mid-life surfaces only; **no P27–P29 event IDs** |
| `medical_sage_healer` | rep≥55, resources≥30 | `medical_divine_doctor_fame` **or** `medical_imperial`; ethic: `medical_plague_hero` **or** `medical_pure`; mutex `medical_poison_path` | Legacy medical chain surfaces only; **no P27–P29 event IDs** |

---

## 3. Bridge Gap Classification

| Event cluster | Achievement target | Bridge gap | Class |
| --- | --- | --- | --- |
| P28 social fork + reinforcement + P29 patron obligation | `jianghu_renown_sage` | Sets `p28_*` / `p29_social_patron_*` — not `mentor_bond` / `ally_network` | **trace gap** (sim cannot see habit on-ramp); not a gameplay dead-end if traceability + fixtures added |
| P27 healer reinforcement + P29 case duty + P29 healer network | `medical_sage_healer` | Sets `p27_study_healer_path` / `p29_*` — not `medical_divine_doctor_fame` / `medical_imperial` | **trace gap**; medical chain still reachable via stat/flag gates |
| P27 mentor obligation | `jianghu_renown_sage` | Training-axis; sets `p27_mentor_obligation_*` not `mentor_bond` | **adjacent** — thematic overlap, low P30 priority |
| P27 renown upkeep | `jianghu_renown_sage` | Study-axis upkeep; no direct achievement flag | **adjacent** — behavior echo, not unlock bridge |
| P28 familyBond samples | both achievements | Family stewardship; no achievement crossover | **out of scope** for Wave 1 trace |

**Validation slice gap:** `P25_REPRESENTATIVE_LIFE_PATHS` (`jianghu_renown_path`, `medical_sage_path`) **direct-seed** achievement flags — sim baseline cannot observe habit-led entry.

---

## 4. P30 Wiring Targets (Story Order)

| Priority | Story | Target | Rationale |
| --- | --- | --- | --- |
| 1 | P30-001 | This audit | Docs only |
| 2 | P30-002 | `achievementTraceability.ts` | Link `habitLedOnRampEvents` for both Wave 1 achievements |
| 3 | P30-003 | `validationSlices.ts` | ≥2 habit-led fixtures (social/renown + medical/study) |
| 4 | P30-004 | Sim baseline JSON + delta doc | Before/after observability vs P29 direct-flag paths |
| 5 | P30-005 | `p25LifetimeSimulationTests.ts` | Assert P27–P29 IDs in trace map + fixture inspectability |
| 6 | P30-006 | Optional flag bridge | **Skip-first:** trace closable without content changes (see §5) |
| 7 | P30-007 | Closure report | Docs only |

**Highest-value trace links (P30-002):**

- `jianghu_renown_sage` ← `p28_social_momentum_network_fork`, `p28_social_reputation_reinforcement`, `p29_social_momentum_patron_obligation`
- `medical_sage_healer` ← `p27_study_habit_healer_reinforcement`, `p29_study_habit_case_record_duty`, `p29_social_momentum_healer_network`

---

## 5. P30-006 Skip Decision

Audit shows bridge flags are **intentionally upstream** of composite `key_choices` — full unlock still requires medical chain / mentor-network flags per North Star §3.1 multi-factor design.

Sim trace is closable via:

1. `habitLedOnRampEvents` in traceability map  
2. Habit-led fixtures seeding `lifeStates.*` + bridge flags (not achievement flags)  
3. Partial progress reporting on `key_choices` dimension  

**No dead-end requiring minimal flag bridge wiring in P30-006.**

---

## 6. Verification

```bash
rg 'p27_|p28_|p29_' src/data/lines/
rg 'jianghu_renown_sage|medical_sage_healer' src/p25/
```

Audit-only story — no test run required.
