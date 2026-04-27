# US-013 Real Gameplay Simulation Metrics

## Scope

- Story: `US-013 - Define Real Gameplay Simulation Metrics`
- Goal: Define gameplay simulation metrics that evaluate playability quality, not just loop execution.
- This story defines metric contracts only; execution and fixed-seed runner implementation are handled in follow-up stories (`US-014+`).

## Metrics and Severity Classification

| Metric | Description | Severity |
|---|---|---|
| `choice_rate` | Ratio of choice events among all simulated events | blocker |
| `auto_event_rate` | Ratio of auto-resolved events among all simulated events | warning |
| `route_completion_rate` | Ratio of started routes that reach completed state | warning |
| `route_breakage_rate` | Ratio of started routes that end in failed/breakage state | blocker |
| `death_rate` | Ratio of runs ending in death outcome | warning |
| `ending_distribution` | Distribution of ending categories to detect one-ending dominance | info |
| `romance_family_achievement_rate` | Ratio of runs that achieve romance/family milestones | info |
| `save_count` | Save operations count per simulation run | info |

## Target Ranges / Observation Baselines

| Metric | Baseline Mode | Baseline |
|---|---|---|
| `choice_rate` | target_range | `0.20 ~ 0.75` |
| `auto_event_rate` | target_range | `0.25 ~ 0.80` |
| `route_completion_rate` | observation_baseline | `0.10 ~ 0.60` |
| `route_breakage_rate` | target_range | `<= 0.40` |
| `death_rate` | observation_baseline | `0.15 ~ 0.90` |
| `ending_distribution` | observation_baseline | Any single ending > `70%` is warning, > `85%` can be escalated to blocker |
| `romance_family_achievement_rate` | observation_baseline | `0.05 ~ 0.70` |
| `save_count` | target_range | `0 ~ 12` (definition-only baseline before save/restore simulation is enabled) |

## Implementation Artifact

- Canonical metric definitions are implemented in `scripts/gameplaySimulationMetricDefinitions.ts`.
- The module provides:
  - typed metric key list
  - severity (`blocker` / `warning` / `info`)
  - baseline mode (`target_range` / `observation_baseline`)
  - baseline notes for follow-up gate stories

## Follow-up Notes

- `US-014` should consume these definitions in a fixed-seed simulation runner.
- `US-016` should convert `severity + baseline` into executable pass/fail gate behavior.
