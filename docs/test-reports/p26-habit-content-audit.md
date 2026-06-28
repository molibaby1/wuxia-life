# P26 Habit-Gated Content Audit

**Date:** 2026-06-24  
**Branch:** `codex/p26-wuxia-personality-habit-trajectory-optimization`  
**Story:** P26-002

Read-only inventory of `training_habit`, `study_habit`, and `business_habit` references.

---

## 1. Hit Inventory

| Location | Flag(s) | Classification | Notes |
| --- | --- | --- | --- |
| `src/core/GameEngineIntegration.ts` | all three | **compatibility-only** | `LONG_TERM_HABIT_FLAG_MAP` projects `lifeStates` → legacy flags at threshold |
| `src/data/life/dailyEvents.ts` | `training_habit` | **compatibility-only** | `addTendency` hook name; runtime maps to `trainingHabit` state |
| `src/narrative/profile/wuxiaReplayabilitySurfaces.ts` | all three | **replayability surface** | Archetype `growthPatternFlags` / `seedFlags` for P20 slices |
| `src/p20/validationSlices.ts` | all three | **validation fixture** | Archetype/pacing slice seed states |
| `src/p24/sliceFixtures.ts` | `business_habit` | **validation fixture** | P24 calibration slice seed |
| `tests/AllTests.ts` | `training_habit` | **validation fixture** | Daily hook accumulation + flag projection test |
| `tests/p20ReplayabilityTests.ts` | `training_habit`, `study_habit` | **validation fixture** | Replayability gate fixtures |
| `tests/personalityHabitTrajectoryTests.ts` | `training_habit` | **validation fixture** | Asserts compatibility projection after hook run |

**Content JSON:** No event in `src/data/lines/*.json` currently reads legacy `*_habit` flags directly (pre-P26). Route samples use route flags or (post-migration) `lifeStates.*`.

---

## 2. Highest-Value Direct Migration Targets

Priority order for P26 execution-sized migrations:

| Priority | Target | Axis | Rationale |
| --- | --- | --- | --- |
| 1 | `p21_scholar_route_reinforcement` | `studyHabit` | High-visibility P21 reinforcement; players expect scholarly identity from behavior |
| 2 | `p22_early_wealth_route_fork` | `businessHabit` | Early merchant divergence; wealth route identity |
| 3 | *(new)* `p21_martial_route_reinforcement` | `trainingHabit` | Martial reinforcement parallel to scholar sample |
| 4 | *(new)* `p22_early_martial_route_fork` | `trainingHabit` | Non-merchant early fork proving reusable pattern |
| 5 | *(new)* midlife callbacks (study / training) | `studyHabit`, `trainingHabit` | Medium-term narrative echo for FR-4 |
| 6 | *(new)* `p26_habit_borne_obligation` | `trainingHabit` | P17-style consequence changing obligation, not flavor |

**Deferred (compatibility-only this phase):** P20 replay surfaces, P24 fixtures, archetype seed flags — update in a later pool migration after content JSON path is proven.

---

## 3. Migration Order Rationale

1. **Runtime + evaluator** — ensure `lifeStates.*` conditions work (`ConditionEvaluator`, daily hooks).
2. **P21/P22 content** — highest player-facing impact; one sample per axis minimum.
3. **Midlife callbacks** — echo legibility (age 20–35).
4. **P17 consequence** — later-life obligation/burden.
5. **P20/P25 slices** — measure divergence; do not block on full legacy flag migration.

---

## 4. Verification

Audit produced via repository search for `training_habit|study_habit|business_habit` in `*.ts`, `*.json`, `*.vue`, `*.md`.

```bash
npm exec tsx tests/personalityHabitTrajectoryTests.ts
```
