# v1.0 Internal-External Alignment Indicators

Five indicators for v1.0 RC and post-launch comparison. Implemented via `WorldProfile.alignmentIndicatorConfigs` and `src/p24/alignmentIndicators.ts`.

## Indicators

| ID | Dimension | RC use |
|----|-----------|--------|
| `p24_ind_onboarding_clarity` | `first_run_readability` | Block ship when internal ≥ 0.7 but playtest proxy < 0.45 |
| `p24_ind_replay_motivation` | `replay_distinctiveness` | Patch-worthy when replay desire proxy lags internal novelty |
| `p24_ind_route_readability` | `route_differentiation` | Redirect when scheduling passes but route legibility fails |
| `p24_ind_payoff_strength` | `late_game_payoff` | Hold when consequence flags pass but payoff proxy flat |
| `p24_ind_ending_resonance` | `ending_aftertaste` | Patch or content wave when category aligned but aftertaste weak |

## Alignment gap

```
alignmentGap = internalScore - externalProxyScore
```

## Decision mapping

| Indicator state | Build readiness |
|-----------------|-----------------|
| In healthy range (`currentValue` within profile `healthyRange`) | RC comparison can proceed |
| Overestimate bias (gap > +0.15) | **Blocked** or **redirect** — do not ship on internal pass alone |
| Underestimate bias (gap < -0.15) | Verify gate not blocking shippable build; may **patch** internal proxy |
| Aligned | **Ship** candidate if other blockers clear |

## Future comparison

Each RC wave and post-launch patch should snapshot indicator values in validation matrix output for before/after trending.
