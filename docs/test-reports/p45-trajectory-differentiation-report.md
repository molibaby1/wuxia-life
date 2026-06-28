# P45 Trajectory Differentiation Report

Generated: 2026-06-25

## Scope

This report compares the bounded P45 replay matrix on one question:

- do different shaping pushes actually produce materially different life directions across ages 0-40?

Evidence source:

- `p45-trajectory-replay-latest.md`
- `p45-trajectory-validation-contract.md`
- `p44-habit-operator-audit-summary.md`

## Top-Level Verdict

Current verdict: **warning, materially improved**

Reason:

- the replay harness is deterministic and readable
- route labels and shaping axes now diverge much more clearly than before
- scholar is no longer locked into training-led recap
- mixed is no longer training-dominant and now ends on `营生塑形`
- but business still does not become a clear early dominant line, and age-20 divergence is still incomplete

This means the mechanism is now closer to the P45 goal, but the bounded matrix still does not fully prove stable whole-life directional steering across all target personas.

## Matrix Comparison

| Persona | Intended direction | Age-20 dominant axis | Age-40 dominant axis | Route / identity signal by 40 | Current verdict |
| --- | --- | --- | --- | --- | --- |
| Martial / `p8-martial-lin` | training-led martial life | none | `习武塑形 · 渐成` | `route_orthodox`, 正道门派 | still aligned, but early axis forms later than ideal |
| Scholarly / `p8-scholar-su` | study-led scholar life | `习武塑形 · 渐成` + `饱学塑形 · 渐成` | `饱学塑形 · 成形` + `习武塑形 · 渐成` | `scholar_path_started`, 正道门派 | first clear P45 success case beyond martial |
| Business / `p8-wealth-shen` | livelihood / merchant life | `习武塑形 · 渐成` | `习武塑形 · 渐成` + `营生塑形 · 渐成` | `route_demonic`, 魔道 | late secondary livelihood only |
| Mixed / `p8-balanced-wei` | blended non-extreme life | none | `营生塑形 · 渐成` | `route_demonic`, 魔道 | no longer training collapse, but route drift is still off-target |

## Growth Emphasis

### Where differentiation now exists

- `p8-scholar-su` now reaches `饱学塑形 · 成形` by age 40 and ends with study-led life-memory.
- `p8-balanced-wei` now ends with `营生塑形 · 渐成` rather than training-led recap.
- `p8-wealth-shen` retains a livelihood secondary line by age 30-40 instead of pure training collapse.
- `p8-martial-lin` remains the clearest training-led baseline.

### Where differentiation is still weak

- business still does not win the top-axis race by age 20 or age 40
- martial and mixed both have no dominant shaping line at age 20
- mixed now differentiates, but not toward the intended balanced profile

Interpretation:

- top-axis separation is no longer globally collapsed
- but age-20 directional steering is still not reliable enough across the full baseline matrix

## Route / Identity Drift

### Material divergence

- martial goes to `正道门派`
- scholar keeps `scholar_path_started`
- business goes to `魔道`
- mixed also goes to `魔道`

### Remaining mismatch

- scholar’s route and shaping direction now support each other much better
- business still diverges in route without becoming livelihood-led in top-axis shaping
- mixed has escaped training collapse, but route drift to demonic still does not match the intended balanced identity

This remains an important distinction:

- route divergence alone is still not enough
- the shaping direction must also land in the intended top axis

## Midlife Consequence Pattern

### Positive signals

- scholar now has strong midlife evidence:
  - `p27_study_habit_healer_reinforcement`
  - `p21_scholar_route_reinforcement`
  - `p29_study_habit_case_record_duty`
- martial still retains route stability and later family-bond callback
- mixed shows an actual route identity turning point by age 30: `outlaw_identity_beginning`

### Weak signals

- business still lacks a visible business callback in the compact replay output by 30 or 40
- mixed differentiates by route and recap, but still lacks strong consequence proof tied to an early balanced push

## Life-Memory / Recap Differentiation

Current result:

- martial remains training-led
- scholar is now study-led
- business remains training-led with livelihood secondary
- mixed is now livelihood-led

This is a substantial improvement over the previous replay, where all four final life-memory entries were training-dominant.

However:

- two of four target directions are still not landing exactly where intended
- business remains the clearest weak sample

## Comparison Conclusions

### Strongest evidence of success

- scholar now demonstrates the P45 target pattern:
  early push -> later scholar callbacks -> study-led final shaping line
- mixed is no longer trapped in a training-led ending
- final life-memory differentiation is now materially visible across the matrix

### Strongest evidence of remaining weakness

- business still does not become livelihood-led in the top axis
- age-20 top-axis formation remains weak or absent for multiple personas
- mixed differentiates, but not toward the intended balanced route identity

## P45-004 Outcome

For this bounded matrix, the current replay evidence supports:

- **runtime-complete**: yes
- **quantitatively validated**: not yet
- **main issue**: strong improvement in late-life differentiation, but early top-axis steering is still incomplete and business remains a weak sample
