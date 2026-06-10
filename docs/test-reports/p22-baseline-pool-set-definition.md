# P22 Baseline Pool Set Definition (US-005)

Five representative baseline pools for long-term live-ops comparison. Executable definitions live in `WUXIA_BASELINE_POOL_CONFIGS`.

| Pool ID | Label | Min events | Known thin areas |
|---------|-------|------------|------------------|
| `p22_pool_origin` | 出身与开局池 | 6 | frontier_military, streetborn, scholar_house variance |
| `p22_pool_childhood_shaping` | 童年塑形池 | 8 | streetborn formative band |
| `p22_pool_early_route` | 早期路线分歧池 | 5 | wealth merchant early fork |
| `p22_pool_midlife_consequence` | 中年后果池 | 10 | mentor obligation, sect exposure |
| `p22_pool_legacy_endgame` | 传承终局池 | 8 | hermit fade, wealth dynasty memory |

## Coverage Expectations

`WUXIA_LIBRARY_COVERAGE_EXPECTATIONS` records minimum event counts, route-signal floors, archetype-tag floors, and thin/repetitive thresholds per pool.

## Comparison Usage

Future waves should run `npm run gate:p22` and compare `p22-coverage-matrix-latest.json` against this baseline snapshot.
