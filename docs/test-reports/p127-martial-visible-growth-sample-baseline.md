# P127 Martial Visible Growth Sample Baseline

Locked verification chain for `martial_family` early visible growth (P127-001).

## Sample scope

| Field | Value |
| --- | --- |
| Route / origin | `martial_family` via `origin_wuxia_family` |
| Primary age band | 5–8 |
| Continuation band | 8–16 (readability only, no sect/orthodox content expansion) |
| Shaping axis | `trainingHabit` only |
| Shaping threshold | `trainingHabit >= 2` on existing habit wiring |
| Expected shapingSummary at threshold | `习武 · 渐成` |

## Locked sample actions

1. `action_childhood_training` — primary proof action, +1 trainingHabit per completion, sets echo hooks
2. `action_childhood_yard_play` — lighter prelude reference only (not a second main chain)

## Baseline chain

```
age 5 start → trainingHabit 0 → 塑形未成
after 1st training → trainingHabit 1 → 塑形未成 + p9_echo_training_hook
after 2nd training → trainingHabit 2 → 习武 · 渐成 + p9_early_training_focus
age 8–16 → p42_training_habit_youth_sparring (trainingHabit >= 2)
age 16+ → p22_early_martial_route_fork (trainingHabit >= 2 or origin_martial_family)
```

## Continuation targets (readability only)

- `p9_echo_training_hook` / `p9_early_training_focus` — early echo flags
- `p22_early_martial_route_fork` — martial route fork at 16
- `p42_training_habit_youth_sparring` — youth sparring echo at 14

## Signal B — period settlement

Period settlement reuses `buildShapingPeriodGrowthLine` via `periodSummaryDisplay`. At `trainingHabit >= 2`, body includes `习武` shaping axis and behavior-driven growth copy (`反复做事积累`).

## Out of scope guards

- No `scholar_house` or `poor_family` parallel sample
- No new growth containers, panels, or skill trees
- No sect route / orthodox route content expansion in this wave
- No multi-axis template abstraction

## Code anchor

Constants: `src/hvg/p127MartialSampleBaseline.ts`
