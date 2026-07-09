# P129 Ordinary-Origin Visible Growth Sample Baseline

Locked verification chain for `tavern_hand` early visible growth (P129-001).

## Sample scope

| Field | Value |
| --- | --- |
| Route / origin | `tavern_hand` via `origin_tavern_hand` |
| Primary age band | 5–8 |
| Continuation band | 8–13 (readability only, no Wave 4 midlife expansion) |
| Shaping axis | `socialMomentum` only |
| Shaping threshold | `socialMomentum >= 2` on existing habit wiring |
| Expected shapingSummary at threshold | `人情 · 渐成` |

## Habit axis directness (pre-check)

| Link | Value |
| --- | --- |
| Primary action | `action_socializing_lite` |
| Echo hook | `p9_echo_social_hook` → `socialMomentum` via `ActivePlanningService.mapEchoFlagToLifeState` |
| Shaping label | `人情 · 渐成` at `socialMomentum >= 2` |
| NOT used | `studyHabit` / comprehension-indirect chain |

## Locked sample actions

1. `action_socializing_lite` — primary proof action, +1 socialMomentum per completion, sets echo hooks

## Baseline chain

```
age 5 start → socialMomentum 0 → 塑形未成
after 1st socializing → socialMomentum 1 → 塑形未成 + p9_echo_social_hook
after 2nd socializing → socialMomentum 2 → 人情 · 渐成 + p9_early_social_focus
age 9–13 → ordinary_tavern_network_fork (childhood choice readability)
age 24+ → p28_social_momentum_network_fork (socialMomentum >= 2, continuation reference)
```

## Continuation targets (readability only)

- `p9_echo_social_hook` / `p9_early_social_focus` — early echo flags
- `ordinary_tavern_network_fork` — tavern childhood fork at 9–13
- `p28_social_momentum_network_fork` — P28 socialMomentum event at 24+

## Signal B — period settlement

Period settlement reuses `buildShapingPeriodGrowthLine` via `periodSummaryDisplay`. At `socialMomentum >= 2`, body includes `人情` shaping axis and behavior-driven growth copy (`反复做事积累`).

## Out of scope guards

- No `farm_peasant` or `town_apprentice` parallel sample
- No `scholar_house` or vivid origin respawn
- No new growth containers, panels, or skill trees
- No P59 merchant bridge or P71 renown bridge content expansion
- No multi-axis template abstraction

## Code anchor

Constants: `src/hvg/p129TavernSampleBaseline.ts`
