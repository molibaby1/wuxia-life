# US-010 Event Repetition Metrics and P0 Thresholds

## Scope

This story adds measurable repetition metrics to the simulation output from `npm run repro:event-repetition` (`scripts/reproduceEventRepetition.ts`).

## Metrics in simulation output

- Adjacent repetition statistics
  - `same_event`: adjacent same-event-id repetition count and rate
  - `same_class`: adjacent same-class repetition count and rate
- Short-window same-class repetition statistics
  - `repeated_events`: count and rate of events whose class appears in the previous `window=5` events
  - per-class counters: `class_injury_window_repeats`, `class_illness_window_repeats`, `class_economy_window_repeats`
- Most repeated events
  - Top 5 repeated event IDs (count > 1), including event title and occurrence count

## P0 thresholds

- `adjacentSameEventRate <= 8%`
- `adjacentSameClassRate <= 35%`
- `shortWindowSameClassRate <= 45%` (window size = 5)

These thresholds are printed directly in the simulation output to make regressions visible in local runs and CI logs.
