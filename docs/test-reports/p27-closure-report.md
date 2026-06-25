# P27 Closure Report — Habit Pool Expansion And Consequence Wiring

**Date:** 2026-06-24  
**Branch:** `codex/p27-wuxia-habit-pool-expansion-and-consequence-wiring`  
**PRD:** `docs/PRD/p27-wuxia-habit-pool-expansion-and-consequence-wiring.md`

---

## 1. Summary

P27 completed the second-round habit pool migration: P20 replay surfaces dual-read `lifeStates` habit axes, P21 study echo callback wires to `studyHabit`, two new P17 consequence samples (mentor obligation + renown upkeep), and one medical pool habit-driven reinforcement. Validation slices and isolated regression tests prove the migration without removing legacy flag projection.

---

## 2. Migrated Surfaces

| Surface | Change | Story |
| --- | --- | --- |
| `src/p20/stateAccess.ts` | `hasAnyGrowthPatternFlag` dual-reads `lifeStates` ≥2 | P27-002/003 |
| `src/p20/archetypeCoverage.ts` | Growth dimension uses dual-read helper | P27-002/003 |
| `wuxiaReplayabilitySurfaces.ts` | Documented dual-read on martial/scholar/wealth seeds | P27-002/003 |
| `src/p20/validationSlices.ts` | Fixtures use `lifeStates`-led habit seeds | P27-003 |
| `p21_study_echo_callback` | `p9_echo_study_hook` OR `lifeStates.studyHabit >= 2` | P27-004 |
| `src/p20/habitTrajectorySlice.ts` | Extended event list for P27 samples | P27-009 |

---

## 3. New Content Samples

| Event ID | Axis | Layer | Story |
| --- | --- | --- | --- |
| `p27_mentor_obligation_consequence` | `trainingHabit` / `studyHabit` | P17 consequence | P27-005 |
| `p27_renown_upkeep_pressure` | `studyHabit` | P17 consequence | P27-006 |
| `p27_study_habit_healer_reinforcement` | `studyHabit` | Medical pool | P27-007 |

**P17 habit consequence count (incl. P26):** 3 samples across business, mentor, renown axes.

---

## 4. Verification Commands

```bash
npx tsc --noEmit
npm exec tsx tests/personalityHabitTrajectoryTests.ts
npm exec tsx tests/p20ReplayabilityTests.ts
npm exec tsx tests/p25LifetimeSimulationTests.ts
```

All above passed on 2026-06-24.

---

## 5. Remaining Legacy-Only Surfaces

| Location | Status | Recommended next |
| --- | --- | --- |
| `tests/p20ReplayabilityTests.ts` | Legacy flag fixtures retained for backward-compat gate | Optional lifeStates mirror tests |
| `tests/AllTests.ts` | Projection assertion after daily hook | Keep |
| `src/p24/sliceFixtures.ts` | `business_habit` seed reference | Migrate in future P20/P24 pass |
| `src/data/life/dailyEvents.ts` | Hook name `training_habit` | Compatibility-only |
| Medical pool (beyond P27 sample) | Stat/talent gates | Future habit waves |

---

## 6. Deferred Semi-Personality Axes (P28+)

- `socialMomentum` / `familyBond` — not habit-driven content分流器 this phase
- Full medical pool habit migration
- P24 calibration fixture migration

---

## 7. P25 Wave 1 Achievement Gaps (Out of P27 Scope)

Per `docs/designs/p25-lifetime-simulation-north-star.md` §3.1:

- `jianghu_renown_sage` — config/sim trace incomplete
- `medical_sage_healer` — full achievement wiring deferred to P25 chain

P27 `p27_study_habit_healer_reinforcement` contributes behavior-led healer emergence but does not complete Wave 1 achievement delivery.

---

## 8. Artifacts

| Artifact | Path |
| --- | --- |
| Audit delta | `docs/test-reports/p27-habit-pool-audit-delta.md` |
| Closure (this doc) | `docs/test-reports/p27-closure-report.md` |
| Regression tests | `tests/personalityHabitTrajectoryTests.ts` |
| P20 slice | `src/p20/habitTrajectorySlice.ts` |
| Migration rules (baseline) | `docs/designs/p26-habit-trajectory-migration-rules.md` |

---

## 9. prd.json

All 10 P27 stories: `passes: true`.
