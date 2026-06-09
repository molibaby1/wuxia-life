# P18 Legacy, Disciples, And Heirs Closure Gate

Generated: 2026-06-09T00:58:54.769Z
Decision: **pass**

## Coverage
- Successor roles: 5 (disciple, heir, offspring, adopted_successor, inheriting_student)
- Inheritance channels: 7 (asset: 3, burden: 2, mixed: 2)
- Cultivation cost patterns: 2 (dimensions: time, attention, resources, emotional_burden, political_exposure, deferred_progress)
- Legacy outcomes: 6

## Balance
- Asset+burden channels: true
- Cultivation cost+pressure: true
- Triumph+disappointment outcomes: true

## Sample trajectories
- Transmission success: successionQuality=0.65; multiplier=2.57; outcomes=p18_outcome_transmission_success,p18_outcome_underinvestment
- Network obligation: multiplier=1.82; channels=p18_channel_social_capital
- Inherited burden: risk=3.50; successionQuality=0.00
- Underinvestment: p18_cost_disciple_cultivation/time: required 0.45, current 0.00, pressure 0.65; p18_cost_disciple_cultivation/resources: required 0.35, current 0.04, pressure 0.42
- Rupture/betrayal: risk=2.79; outcomes=p18_outcome_underinvestment,p18_outcome_rupture_betrayal

## Readability
- LaterLifeLegacyReport exposes active roles, channels, outcomes, and succession quality
- Unmet cultivation pressure lines are human-readable for gate/debug
- P18 multiplier composes with P17 — no separate scheduler fork
