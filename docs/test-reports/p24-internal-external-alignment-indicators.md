# P24 Internal-External Alignment Indicator Set

Stable alignment indicators for comparing internal quality signals against human playtest outcomes.

## Indicators (5)

| ID | Dimension | Meaning | Overestimate signal | Underestimate signal |
|----|-----------|---------|---------------------|----------------------|
| `p24_ind_onboarding_clarity` | `first_run_readability` | Internal early-clarity proxy vs playtest comprehension | Internal ≥ 0.7, playtest proxy < 0.45 | Playtest proxy ≥ 0.65, internal < 0.5 |
| `p24_ind_replay_motivation` | `replay_distinctiveness` | P20 replay novelty vs felt replay desire | High overlap-decay score, low replay proxy | Low internal novelty, high replay proxy |
| `p24_ind_route_readability` | `route_differentiation` | Scheduling health vs route legibility | Route points scheduled, players cannot distinguish paths | Thin scheduling, strong route recall proxy |
| `p24_ind_payoff_strength` | `late_game_payoff` | Consequence flags vs memorable stakes | P17/P23 scores pass, payoff proxy flat | Low consequence score, high payoff proxy |
| `p24_ind_ending_resonance` | `ending_aftertaste` | P19 category match vs post-run aftertaste | Category aligned, aftertaste proxy weak | Category thin, aftertaste proxy strong |

## Healthy range

Each indicator sets `currentValue = 1 - |alignmentGap|` (higher = better internal-external alignment). Profile `healthyRange` is typically `{ min: 0.85, max: 1.0 }`. Values outside range trigger RC review.

## Alignment gap interpretation

```
alignmentGap = internalScore - externalProxyScore
```

| Gap | Bias direction | Action |
|-----|----------------|--------|
| > +0.15 | `overestimate` | Do not ship on internal pass alone; run playtest comparison |
| < -0.15 | `underestimate` | Verify internal gate not blocking shippable build |
| otherwise | `aligned` | RC comparison can proceed |

## Future RC wave suitability

Indicators are wired through `WorldProfile.alignmentIndicatorConfigs` and evaluated in `src/p24/alignmentIndicators.ts`. Each RC wave should snapshot indicator values for before/after comparison.
