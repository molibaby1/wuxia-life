# Childhood Payoff Spine Slice C — Gate Regression

Generated: 2026-06-23

## Commands Run

| Command | Result |
| --- | --- |
| `npm run typecheck` | **PASS** |
| `npm run gate:playability` | **PASS** (0 blockers, 3 warnings — pacing warnings **0**) |
| `npm run gate:p20` | **PASS** |
| `npm run report:event-asset-inventory` | **PASS** — new events active |
| `SECOND_TUNING_SAMPLE_COUNT=50 npm run audit:second-tuning-metrics` | M3 max=5y, avg=3.44 |

## Metric Guard Summary

| Guard | Baseline | After | Status |
| --- | --- | --- | --- |
| M1 personas >5y | 8/8 | **0/8** | Improved |
| M2 max persona span | 7y | **4y** | Improved |
| M3 cohort max | 5y | 5y | OK |
| Playability blockers | 0 | 0 | OK |
| P20 gate | pass | pass | OK |

## Remaining Warnings (non-pacing)

- causality direct echoes (2 personas)
- replayability near-duplicate pairs (3)

Not slice blockers.
