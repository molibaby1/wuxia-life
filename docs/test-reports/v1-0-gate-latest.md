# v1.0 Release Candidate Gate

- Decision: **warning**
- Generated: 2026-06-10T10:50:00.701Z

## v1.0 launch rules (semantic)
- Contract: v1.0-rules-v1
- Launch rules pass: PASS
- Docs present: PASS
- Launch dimensions doc: PASS
- Blocker/deferral doc: PASS
- Freeze boundary doc: PASS
- Post-launch cadence doc: PASS
- Surfaces audit doc: PASS
- Alignment indicators doc: PASS
- Profile dimension alignment: PASS

## Launch readiness (P24-backed signals)
- launchRulesPass: PASS
- baselinesHealthy: PASS
- playtestComparisonsHealthy: FAIL
- alignmentHealthy: PASS
- falsePositiveDetected: PASS
- redirectionValidated: PASS
- blockerFixValidated: PASS
- closureWavePass: PASS

## Playtest calibration (P24 surfaces)
- Decision: **warning**
- Generated: 2026-06-10T10:50:00.695Z

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
- comparisonsPass: FAIL
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
- Comparison samples passing: 4/4
- Comparison dimension coverage: 4/6
- Comparison dimensions passing: 4/6
- Matrix decision: warning
- RC wave: pass
- Full closure: pass

## Warnings
- Playtest comparison coverage incomplete (missing: route_differentiation, late_game_payoff)

## Messages
- v1.0 launch rules contract v1.0-rules-v1 satisfied
- Dimensions: 6
- Baselines passing: 6/6
- Comparison samples passing: 4/4
- Comparison dimension coverage: 4/6
- Comparison dimensions passing: 4/6
- Matrix decision: warning
- RC wave: pass
- Full closure: pass
- Launch matrix: warning
- RC wave: pass
- Full closure: pass

## Warnings
- Playtest comparison coverage incomplete (missing: route_differentiation, late_game_payoff)