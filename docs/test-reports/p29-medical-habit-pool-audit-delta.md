# P29 Medical Habit Pool Expansion — Audit Delta

**Date:** 2026-06-24  
**Branch:** `codex/p29-wuxia-medical-habit-pool-expansion-and-social-consequence-wiring`  
**Story:** P29-001  
**Baseline:** `docs/test-reports/p28-closure-report.md`, `docs/test-reports/p27-habit-pool-audit-delta.md`

Read-only inventory of medical pool habit / semi-personality readiness. No gameplay behavior changed in this story.

---

## 1. Medical Pool Event Inventory

| Event ID | Gate type | `lifeStates` reader | Classification |
| --- | --- | --- | --- |
| `medical_talent_discovery` | stat (`comprehension`, `chivalry`) | — | stat/talent gate |
| `p27_study_habit_healer_reinforcement` | `lifeStates.studyHabit >= 2` | studyHabit | **habit-led (P27)** |
| `medical_master_apprentice` | `flags.medical_talent` | — | chain continuation |
| `medical_herb_gathering` | apprentice/self-taught flags | — | chain continuation |
| `medical_clinic_practice` | `flags.medical_herb_master` | — | chain continuation |
| `medical_plague_outbreak` | `flags.medical_apprentice` (+ choice stat gate) | — | chain + stat |
| `medical_poison_temptation` | `flags.medical_herb_master` | — | chain fork |
| `medical_dual_cultivation` | `flags.medical_poison_path` | — | chain continuation |
| `medical_divine_doctor_fame` | plague_hero \|\| medical_pure flags | — | chain outcome |
| `medical_imperial_doctor` | `flags.medical_divine_doctor_fame` | — | chain outcome |
| `medical_palace_intrigue` | `flags.medical_imperial` | — | chain continuation |
| `medical_medical_book` | `flags.medical_apprentice` | — | chain outcome |
| `medical_poison_king` | poison_path + `martialPower >= 100` | — | martial stat gate |
| `medical_ending_*` (5) | flags + stats | — | ending gates |

**Habit/semi-personality readers in medical pool:** 1 of 18 events (`p27_study_habit_healer_reinforcement`).

**Semi-personality crossover:** 0 events read `socialMomentum` or `familyBond` in medical pool.

---

## 2. Gap Classification

| Gap | Current | P29 target | Story |
| --- | --- | --- | --- |
| Medical `studyHabit` deepening | 1 sample at ≥2 (reinforcement only) | +1 sample at ≥3 (obligation / case-record duty) | P29-002 |
| Medical `socialMomentum` crossover | none | +1 sample at ≥2 (healer network opportunity) | P29-002 |
| `socialMomentum` P17 consequence | deferred from P28 | +1 sample at ≥3 (patron/network upkeep burden) | P29-003 |
| P25 habit trajectory slice | P27/P28 events only | +P29 medical + social consequence IDs | P29-004 |
| Isolated regression | P27/P28 asserts | +P29 medical + social asserts | P29-005 |
| P20 replay slice | P28 event IDs | +P29 event IDs if replay-linked | P29-006 |

---

## 3. Wave 1 Achievement Traceability Hooks

| Achievement | Behavior-led gap | P29 wiring target |
| --- | --- | --- |
| `medical_sage_healer` | Chain is flag/stat-gated; only P27 `studyHabit` reinforcement bridges behavior → medical flags | P29-002 `studyHabit` deepening sets `p29_study_healer_case_duty` → reinforces non-martial healer path |
| `jianghu_renown_sage` | No medical/social crossover; P28 social samples are P22-only | P29-002 `socialMomentum` healer network + P29-003 social patron obligation |

Per `achievementTraceability.ts`: `medical_sage_healer` midLife surfaces include `medical_divine_doctor_fame`, `medical_imperial_doctor`; P29 samples provide earlier behavior-led on-ramps, not full achievement closure.

---

## 4. P29 Execution Order

| Priority | Story | Target | Axis / Layer |
| --- | --- | --- | --- |
| 1 | P29-001 | This audit | Docs only |
| 2 | P29-002 | `medical.json` | `studyHabit` obligation + `socialMomentum` healer network |
| 3 | P29-003 | `p22-content-expansions.json` | `socialMomentum` P17 patron obligation |
| 4 | P29-004 | `src/p25/habitTrajectorySlice.ts` | P29 event lists |
| 5 | P29-005 | `tests/personalityHabitTrajectoryTests.ts` | P29 regression |
| 6 | P29-006 | `src/p20/habitTrajectorySlice.ts` | Replay sync |
| 7 | P29-007 | Closure report | Docs only |

---

## 5. Deferred (Out of P29 Scope)

| Item | Reason | Target |
| --- | --- | --- |
| Full medical pool stat/talent gate migration | P29 Non-goals | Future wave |
| P25 Wave 2–4 achievement configs | P29 Non-goals | P25 end-state |
| `familyBond` medical crossover | P28 closed family axis | Future |
| Legacy `*_habit` reader removal | Compatibility policy | Future |
| P24 calibration fixture refresh | P29 Non-goals | P24 reconciliation |

---

## 6. Verification

```bash
# Audit-only story — inventory commands
rg 'lifeStates\.' src/data/lines/medical.json
rg 'medical_' src/data/lines/medical.json --count
```
