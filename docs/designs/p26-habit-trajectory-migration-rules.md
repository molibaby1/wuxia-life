# P26 Habit Trajectory Migration Rules

**Date:** 2026-06-24  
**Branch:** `codex/p26-wuxia-personality-habit-trajectory-optimization`  
**PRD:** `docs/PRD/p26-wuxia-personality-habit-trajectory-optimization.md`

---

## 1. Allowed Habit Axes

P26 uses the existing long-term habit axes in `player.lifeStates`:

| Axis | Legacy flag (compatibility) | Threshold |
| --- | --- | --- |
| `trainingHabit` | `training_habit` | ≥ 2 |
| `studyHabit` | `study_habit` | ≥ 2 |
| `businessHabit` | `business_habit` | ≥ 2 |

- Range: 0–5 (defined in `src/data/life/lifeStates.ts`).
- Accumulation: daily event `longTermHooks` in `GameEngineIntegration` increment state; flags project at threshold.
- **No new personality container** — do not introduce `personalityTrajectory` or parallel stores.

---

## 2. In-Scope Layers

| Layer | P26 work |
| --- | --- |
| **P21** | Migrate/add route reinforcement samples reading `lifeStates.*` |
| **P22** | Migrate/add early fork samples reading `lifeStates.*` |
| **P17** | Add at least one mid/late-life consequence sample keyed by habit axis |
| **P20 / P25** | Add habit trajectory replayability / lifetime acceptance slices |
| **Runtime** | Preserve `ConditionEvaluator` `lifeStates.*` / `player.lifeStates.*` access |
| **Tests** | Isolated `personalityHabitTrajectoryTests.ts` + gate registration |

---

## 3. Out of Scope (P26)

- New UI panels or large frontend habit displays
- Full migration of all `*_habit` legacy readers
- Social / moral / emotional multi-axis personality modeling
- Scheduler, event engine, or save contract rewrites
- Broad numeric rebalance outside content wiring and validation

---

## 4. Compatibility Rules

1. **Legacy flags remain** — `training_habit`, `study_habit`, `business_habit` stay as projection targets from `lifeStates` thresholds (`LONG_TERM_HABIT_FLAG_MAP` in `GameEngineIntegration`).
2. **Content migration pattern** — prefer direct conditions:
   ```text
   lifeStates.studyHabit >= 2 || flags.has("scholar_path_started")
   ```
   Keep route/origin guards where they define intended audience; habit axis adds behavior-led access.
3. **Tests** — new regression tests prove trigger via `lifeStates` **without** legacy flag when story requires it.
4. **Old content** — untouched `*_habit` readers stay compatibility-only until a future pool migration.

---

## 5. Content Authoring Checklist

When migrating or adding a habit-gated sample:

1. Condition uses `lifeStates.<axis> >= 2` (or documented threshold).
2. Copy makes long-term shaping legible (not one-shot flavor).
3. Effects change access, obligation, burden, or opportunity — not text-only for consequence samples.
4. Add targeted assertion in `personalityHabitTrajectoryTests.ts` or relevant slice.
5. Do not remove legacy flag projection in runtime.

---

## 6. Verification Commands

```bash
npx tsc --noEmit
npm exec tsx tests/personalityHabitTrajectoryTests.ts
npm exec tsx tests/p21ContentProductionTests.ts
npm exec tsx tests/p22ContentLibraryTests.ts
npm exec tsx tests/p20ReplayabilityTests.ts
npm exec tsx tests/p25LifetimeSimulationTests.ts
```
