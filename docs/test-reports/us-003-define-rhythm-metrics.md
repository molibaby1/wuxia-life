# US-003 Define Rhythm Metrics

## Scope

This story defines measurable rhythm metrics and binds them to reproducible simulation samples from `npm run report:rhythm-metrics` (`scripts/reportRhythmMetrics.ts`).

## Command

```bash
npm run report:rhythm-metrics
```

Optional sample controls:

```bash
RHYTHM_SEED=1 RHYTHM_MAX_AGE=40 npm run report:rhythm-metrics
```

## Metric Definitions

- `event_count_per_age`: event count for each age in `[0, maxAge]`.
- `empty_ages`: ages where no event is selected.
- `formal_event_ratio`: `formal_events / timeline_events`.
- `daily_event_ratio`: `daily_events / timeline_events`.
- `choice_event_ratio`: `choice_events / timeline_events`.
- `storyline_continuity`: continuity pairs and rate for adjacent storyline-tagged events.
- `critical_event_delay`: delay (years) between consecutive critical/mandatory events, with average and max delay.

## P1 Observation Baselines

- `formal_event_ratio`: `50% - 90%`
- `daily_event_ratio`: `10% - 50%`
- `choice_event_ratio`: `20% - 80%`
- `storyline_continuity_rate`: `30% - 100%`
- `critical_event_delay_max`: `<= 15 years`
- `empty_age_count`: `0 - 20`

These are P1 observation baselines (not hard blockers yet) used to judge rhythm trend quality in later adjustment stories.

## Sample Association

Every metric output is attached to one simulation sample through:

- `sampleId` (format: `seed-<seed>-age-<maxAge>`)
- `seed`
- `maxAge`

This allows direct comparison of metric snapshots across deterministic samples.

## Sample Output Snapshot (`seed=1`, `maxAge=40`)

- `sampleId=seed-1-age-40`
- `timelineEvents=38`
- `empty_ages=[2,5,7]` (count `3`)
- `formal_event_ratio=97.4%`
- `daily_event_ratio=2.6%`
- `choice_event_ratio=81.6%`
- `storyline_continuity=0/0 (0.0%)` (current sample has no `storyLine` field usage)
- `critical_event_delay_avg=2.09y`, `critical_event_delay_max=5y`

## Notes for Follow-up Stories

- This story defines metrics and baselines only; it does not change runtime event selection behavior.
- `US-004` can use this command as the baseline-report generator entrypoint and compare multiple seeds.
