# P7 Action Duration Units (US-007)

## Duration rules

| Unit | Meaning | Default use |
| --- | --- | --- |
| month | 1 in-game month | Fine-grained training/study |
| quarter | 3 months | Standard action block |
| short_stage | 6 months | Extended focus period |
| year | 12 months | **Milestones only** (birthday, sect entry, critical events) |
| milestone | Explicit story-flagged year jump | Critical/mainline events with documented intent |

## Default duration per P7 minimum category

| Category | Default |
| --- | --- |
| training | 1 quarter |
| study | 1 quarter |
| socializing | 1 month |

All minimum actions stay **below 1 year**.

## When year-scale is allowed

- Event effect `time_advance` with `unit: 'year'` on CRITICAL/HIGH storyline events
- Explicit simulator milestone flag `allowAnnualAdvance: true`
- Player age milestone events (e.g. identity-year-events when wired)

## Same-year multi-event display

Reports and simulator records must:

- Track `currentTime.year` + `currentTime.month` on each record
- Count events/actions sharing the same calendar year
- Surface same-year counts in P7 report diagnostics (US-037)
