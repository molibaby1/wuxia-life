# P24 Playtest Calibration Gate

- Decision: **pass**
- Generated: 2026-06-10T09:44:42.383Z

## Surfaces
- Dimensions: 6
- Baselines: 6
- Comparison samples: 4
- Alignment indicators: 5
- RC samples: 3
- Playtest feedback schema: yes
- RC evaluation schema: yes

## Validation
- baselinesPass: PASS
- comparisonsPass: PASS
- indicatorsHealthy: PASS
- matrixPass: PASS
- rcWavePass: PASS
- falsePositiveDetectionPass: PASS
- redirectionPass: PASS
- targetedFixPass: PASS
- fullClosurePass: PASS

## Messages
- Dimensions: 6
- Baselines passing: 6/6
- Comparisons passing: 4/4
- Matrix decision: pass
- RC wave: pass
- Full closure: pass

# P24 Playtest Calibration Matrix

- Decision: **pass**
- Dimensions: 6
- Baselines passing: 6
- Comparisons passing: 4
- Indicators aligned/healthy: 5
- RC samples passing: 3
- False-positive detected: 1
- Redirections validated: 1
- Targeted fixes validated: 1

## Dimension rows
- **first_run_readability**: baseline=PASS, comparison=PASS, indicator=OK — baseline Δ=0.367; comparison Δ=0.367; gap=0.128 aligned
- **onboarding_motivation**: baseline=PASS, comparison=PASS, indicator=OK — baseline Δ=0.329; comparison Δ=0.329; no indicator
- **replay_distinctiveness**: baseline=PASS, comparison=PASS, indicator=OK — baseline Δ=0.437; comparison Δ=0.437; gap=0.003 aligned
- **route_differentiation**: baseline=PASS, comparison=FAIL, indicator=OK — baseline Δ=0.105; no comparison; gap=-0.042 aligned
- **late_game_payoff**: baseline=PASS, comparison=FAIL, indicator=OK — baseline Δ=0.254; no comparison; gap=0.008 aligned
- **ending_aftertaste**: baseline=PASS, comparison=PASS, indicator=OK — baseline Δ=0.321; comparison Δ=0.321; gap=0.028 aligned

## RC comparison samples
- [PASS] p24_rc_weak_outward (weak_outward_experience): False-positive risk: internal=0.82, external=0.38, RC=redirect
- [PASS] p24_rc_feedback_redirect (feedback_redirection): Redirect: Redirect from volume expansion to P22 origin pool clarity tune.
- [PASS] p24_rc_targeted_fix (targeted_fix_validation): Fix validated: Origin pool clarity tune improves onboarding proxy measurably.