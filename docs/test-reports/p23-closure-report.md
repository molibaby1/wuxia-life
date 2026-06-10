# P23 Closure Report

## Before / After
- Acceptance: P16–P22 gates proved system health and content volume but lacked unified experience acceptance baselines.
- Comparison: Tuning waves could pass without demonstrating player-experience improvement over volume growth.
- Balance: Long-term balance relied on scattered P20/P22 metrics without wave-to-wave indicator set.
- Decision: Low-value content waves were not systematically detectable or redirectable.

# P23 Experience Acceptance Gate

- Decision: **pass**
- Dimensions: 7
- Baselines: 4
- Comparisons: 4
- Balance indicators: 5
- Live-balance samples: 4

## Validation
- Baselines: PASS
- Comparisons: PASS
- Indicators healthy: PASS
- Matrix: PASS
- Full-life operation: PASS
- Low-value detection: PASS
- Tuning redirection: PASS

## Messages
- Dimensions: 7
- Baselines passing: 4/4
- Comparisons passing: 4/4
- Indicators healthy: 5/5
- Matrix decision: pass
- Full-life operation: pass

# P23 Experience Acceptance Gate

- Decision: **pass**
- Dimensions: 7
- Baselines: 4
- Comparisons: 4
- Balance indicators: 5
- Live-balance samples: 4

## Validation
- Baselines: PASS
- Comparisons: PASS
- Indicators healthy: PASS
- Matrix: PASS
- Full-life operation: PASS
- Low-value detection: PASS
- Tuning redirection: PASS

## Messages
- Dimensions: 7
- Baselines passing: 4/4
- Comparisons passing: 4/4
- Indicators healthy: 5/5
- Matrix decision: pass
- Full-life operation: pass

# P23 Experience Acceptance Matrix

- Decision: **pass**
- Dimensions: 7
- Baselines passing: 4
- Comparisons passing: 4
- Indicators healthy: 5
- Low-value waves detected: 1
- Tuning redirections: 1

## Dimension rows
- **archetype_strength**: baseline=PASS, comparison=PASS, indicator=HEALTHY — baseline Δ=0.437; comparison Δ=0.437; indicator=0.930
- **replay_distinctiveness**: baseline=FAIL, comparison=FAIL, indicator=HEALTHY — no baseline; no comparison; indicator=0.760
- **route_differentiation**: baseline=FAIL, comparison=FAIL, indicator=HEALTHY — no baseline; no comparison; no indicator
- **stage_pacing_health**: baseline=PASS, comparison=PASS, indicator=HEALTHY — baseline Δ=0.068; comparison Δ=0.068; indicator=0.650
- **mid_late_payoff**: baseline=PASS, comparison=PASS, indicator=HEALTHY — baseline Δ=0.254; comparison Δ=0.254; indicator=0.832
- **legacy_resonance**: baseline=PASS, comparison=FAIL, indicator=HEALTHY — baseline Δ=0.321; no comparison; indicator=0.886
- **endgame_aftertaste**: baseline=FAIL, comparison=PASS, indicator=HEALTHY — no baseline; comparison Δ=0.321; no indicator

## Live-balance samples
- [PASS] p23_wave_high_value_pacing_tune: Pacing tune: hermit spacing 1.15, delta 0.150
- [PASS] p23_wave_low_value_volume: Volume +5 events, experience gain 0.008 vs volume-only 0.010 — low-value detected
- [PASS] p23_wave_tuning_redirect: Redirected from p23_wave_low_value_volume: midlife payoff delta 0.254
- [PASS] p23_wave_full_life_operation: Full-life wave: archetype 0.93, legacy 0.89

# P23 Full-Life Operation

- [PASS] Bounded wave covers archetype, pacing, payoff, and legacy/endgame via matrix rows
- [PASS] Previously weak experience dimension becomes measurably stronger
- [PASS] Low-value volume wave detected and tuning redirected
- [PASS] Long-term balance indicators changed chosen tuning direction
- [PASS] P22 expansion wave remains compatible upstream signal
- [PASS] Archetype and pacing differentiation slices remain healthy

## Upstream Gates
- Playability: PASS — Warnings: 2 JSON: /Users/zhouyun/code/wuxia-life/docs/test-reports/p8-playability-gate-latest.json Markdown: /Users/zhouyun/code/wuxia-life/docs/test-reports/p8-playability-gate-latest.md
- P12 profile: PASS — P12 profile gate decision: pass Wrote docs/test-reports/p12-profile-gate-latest.{json,md} Wrote docs/test-reports/p12-profile-smoke-latest.json
- P22: PASS — > tsx scripts/runP22Gate.ts  P22 gate decision: pass