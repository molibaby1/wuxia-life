# P104 Merchant Martial Patron Bridge-Origin Peasant Chain Proof

> **Stage:** P104 Wuxia Merchant Martial Patron Bridge-Origin Peasant (Narrow Playable)
> **Date:** 2026-07-02

## Chain nodes

| Step | Age | Event | Flags in | Flags out |
| ---- | --- | ----- | -------- | --------- |
| 1 | 18–28 | P60 bridge entry | origin markers | `peasant_merchant_bridge_crossed`, `route_wealth_committed` |
| 2 | 34–38 | `merchant_patron_bridge_entry` (peasant bridge arm) | `route_wealth_committed` + `peasant_merchant_bridge_crossed` | `merchant_patron_bridge_crossed`, `merchant_patron_on_ramp_done`, `merchant_patron_bridge_peasant_grain` |
| 3 | 48–52 | `merchant_patron_payoff_echo` | `merchant_patron_on_ramp_done` | `merchant_patron_payoff_done`, `merchant_patron_identity_done` |

## Gate arms

| Arm | Expression fragment |
| --- | ------------------- |
| Native (P102) | `(flags.has('route_wealth_committed') || flags.has('p22_wealth_route_forked')) && (flags.has('merchant_invest_good') || flags.has('merchant_invest_evil') || flags.has('merchant_invest_both'))` |
| Bridge (P103 + P104) | `flags.has('route_wealth_committed') && (flags.has('apprentice_merchant_bridge_crossed') || flags.has('tavern_merchant_bridge_crossed') || flags.has('peasant_merchant_bridge_crossed'))` |

## Peasant bridge-origin checkpoint

| Origin | Choice ID | Checkpoint flag |
| ------ | --------- | --------------- |
| Peasant | `patron_bridge_peasant_grain_alliance` | `merchant_patron_bridge_peasant_grain` |

## Expression differentiation

| Surface | Peasant bridge | Priority |
| ------- | -------------- | -------- |
| `merchantCurrentGoal` | 粮路脚力换门派护商 | orthodox/martial when invest markers set |
| `deriveSampleLineCostLabel` | 粮路护商之累 | 侠义盟约/护商武力 when native variants set |
| `merchantAge40Identity` | 粮路金主 | magnate tiers win when magnate markers set |

## Regression scope

- P102 native patron bridge tests: unchanged native path
- P103 apprentice/tavern patron bridge tests: unchanged bridge paths
- P97–P101 magnate tests: no spine regression
- `guard:sample-lines-baseline`: spine additive extension only

## Deferred

- Full patron pressure/mid/late chain
- Full Wave 3 mixed-achievement graph
