# P27 Habit Pool Expansion — Audit Delta

**Date:** 2026-06-24  
**Branch:** `codex/p27-wuxia-habit-pool-expansion-and-consequence-wiring`  
**Story:** P27-001  
**Baseline:** `docs/test-reports/p26-habit-content-audit.md`, `docs/test-reports/p26-closure-report.md`

Read-only re-inventory of legacy `*_habit` readers and P27 execution mapping. No gameplay behavior changed in this story.

---

## 1. Hit Inventory (Post-P26)

| Location | Flag(s) | Classification | P27 Story | Notes |
| --- | --- | --- | --- | --- |
| `src/core/GameEngineIntegration.ts` | all three | **compatibility-only** | — | `LONG_TERM_HABIT_FLAG_MAP` projects `lifeStates` → flags at ≥2 |
| `src/data/life/dailyEvents.ts` | `training_habit` | **compatibility-only** | — | Hook name; runtime maps to `trainingHabit` |
| `src/narrative/profile/wuxiaReplayabilitySurfaces.ts` | all three | **replayability surface** | P27-002, P27-003 | Archetype `growthPatternFlags` + slice `seedFlags` |
| `src/p20/archetypeCoverage.ts` | via flags | **replayability surface** | P27-002, P27-003 | `scoreArchetypeFamily` growth dimension; needs `lifeStates` dual-read |
| `src/p20/validationSlices.ts` | all three | **validation fixture** | P27-003 | Archetype/pacing/replay slice seed states |
| `src/p24/sliceFixtures.ts` | `business_habit` | **validation fixture** | P27-003 | P24 calibration references wealth slice seed |
| `tests/p20ReplayabilityTests.ts` | `training_habit`, `study_habit` | **validation fixture** | P27-002 | Gate fixtures; keep legacy path + add lifeStates-led test |
| `tests/personalityHabitTrajectoryTests.ts` | `training_habit` | **validation fixture** | P27-008 | Projection assertion after daily hook |
| `src/data/lines/p21-content-samples.json` | `p9_echo_study_hook` | **echo hook** | P27-004 | `p21_study_echo_callback` — not legacy `study_habit` but hook-only |
| `src/data/lines/medical.json` | — | **content pool gap** | P27-007 | No `lifeStates.*` conditions; stat/talent gates only |
| `src/data/lines/p22-content-expansions.json` | — | **consequence gap** | P27-005, P27-006 | Only `p26_business_habit_obligation` habit consequence |
| `src/p20/habitTrajectorySlice.ts` | — | **validation slice** | P27-009 | P26 event IDs only; extend for P27 samples |
| `src/p25/habitTrajectorySlice.ts` | — | **validation slice** | P27-009 | Later-echo phase; extend after P27 consequences |

**Content JSON with `lifeStates.*` (P26, unchanged):** 7 samples in P21/P22 — reinforcement, forks, midlife callbacks, business obligation.

---

## 2. Classification Summary

| Class | Count | P27 Action |
| --- | --- | --- |
| compatibility-only | 2 | No change |
| replayability surface | 2 files | Dual-read `lifeStates` ≥2 in archetype scoring |
| validation fixture | 4 files | Migrate seeds to `lifeStates`-led profiles |
| echo hook | 1 event | OR `lifeStates.studyHabit >= 2` into callback |
| content pool gap | medical + P17 | Add 3 samples (mentor, renown, medical) |
| validation slice | P20/P25 | Extend event lists after content lands |

---

## 3. P27 Execution Order

| Priority | Story | Target | Axis / Layer |
| --- | --- | --- | --- |
| 1 | P27-001 | This audit | Docs only |
| 2 | P27-002 | `archetypeCoverage` + martial/scholar surfaces | `trainingHabit`, `studyHabit` dual-read |
| 3 | P27-003 | Wealth surface + `validationSlices` | `businessHabit` + fixture migration |
| 4 | P27-004 | `p21_study_echo_callback` | `studyHabit` OR `p9_echo_study_hook` |
| 5 | P27-005 | New P17 consequence | `trainingHabit` or `studyHabit` — mentor obligation |
| 6 | P27-006 | New P17 consequence | `studyHabit` — renown maintenance |
| 7 | P27-007 | `medical.json` sample | `studyHabit` — healer path reinforcement |
| 8 | P27-008 | `personalityHabitTrajectoryTests.ts` | Regression for P27-004–007 |
| 9 | P27-009 | `habitTrajectorySlice.ts` | P20 reporting for new mirrors + samples |
| 10 | P27-010 | Closure report | Docs only |

---

## 4. Deferred (Out of P27 Scope)

| Item | Reason | Target |
| --- | --- | --- |
| `socialMomentum` / `familyBond` habit content | P27 Non-goals | P28+ |
| P25 Wave 1 `jianghu_renown_sage` / `medical_sage_healer` full trace | P25 chain | Not P27 |
| Full legacy `*_habit` reader removal | Compatibility policy | Future pool |
| `tests/AllTests.ts` projection test | Intentional compatibility assert | Keep |

---

## 5. Medical Pool Evaluation Notes (for P27-007)

| Event | Current gate | Habit fit |
| --- | --- | --- |
| `medical_talent_discovery` | `comprehension`, `chivalry` | Stat-only; no behavior axis |
| `medical_master_apprentice` | `medical_talent` flag | Chain continuation |
| *(new)* `p27_study_habit_healer_reinforcement` | `lifeStates.studyHabit >= 2` | Behavior-led healer emergence; low martial |

Remaining medical pool events stay stat/flag-gated; habit axis coverage deferred to future waves.

---

## 6. Verification

```bash
# Audit-only story — no gameplay tests required
rg 'training_habit|study_habit|business_habit' --glob '*.{ts,json}'
```
