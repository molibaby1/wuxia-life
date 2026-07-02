# P103 Merchant Martial Patron Bridge-Origin Chain Proof

> **Stage:** P103 Wuxia Merchant Martial Patron Bridge-Origin (Narrow Playable)
> **Date:** 2026-07-02

## Chain nodes

| Step | Age | Event | Flags in | Flags out |
| ---- | --- | ----- | -------- | --------- |
| 1 | 18–28 | P58/P59 bridge entry | origin markers | `*_merchant_bridge_crossed`, `route_wealth_committed` |
| 2 | 34–38 | `merchant_patron_bridge_entry` (bridge arm) | `route_wealth_committed` + bridge marker | `merchant_patron_bridge_crossed`, `merchant_patron_on_ramp_done`, origin checkpoint |
| 3 | 48–52 | `merchant_patron_payoff_echo` | `merchant_patron_on_ramp_done` | `merchant_patron_payoff_done`, `merchant_patron_identity_done` |

## Gate arms

| Arm | Expression fragment |
| --- | ------------------- |
| Native (P102) | `(flags.has('route_wealth_committed') || flags.has('p22_wealth_route_forked')) && (flags.has('merchant_invest_good') || flags.has('merchant_invest_evil') || flags.has('merchant_invest_both'))` |
| Bridge (P103) | `flags.has('route_wealth_committed') && (flags.has('apprentice_merchant_bridge_crossed') || flags.has('tavern_merchant_bridge_crossed'))` |

## Bridge-origin checkpoint flags

| Origin | Choice ID | Checkpoint flag |
| ------ | --------- | --------------- |
| Apprentice | `patron_bridge_apprentice_craft_alliance` | `merchant_patron_bridge_apprentice_craft` |
| Tavern | `patron_bridge_tavern_network_alliance` | `merchant_patron_bridge_tavern_network` |

## Expression differentiation

| Surface | Apprentice bridge | Tavern bridge | Native priority |
| ------- | ----------------- | ------------- | --------------- |
| `merchantCurrentGoal` | 手艺眼光换门派护商 | 酒肆人脉换门派借道 | orthodox/martial when invest markers set |
| `deriveSampleLineCostLabel` | 手艺护商之累 | 人脉护商之累 | 侠义盟约/护商武力 when native variants set |
| `merchantAge40Identity` | 手艺金主 | 人脉金主 | magnate tiers win when magnate markers set |

## Regression scope

- P102 native patron bridge tests: unchanged native path
- P97–P101 magnate tests: no spine regression
- `guard:sample-lines-baseline`: spine additive extension only

## Deferred

- Peasant bridge-origin patron entry
- Full patron pressure/mid/late chain
- Full Wave 3 mixed-achievement graph
