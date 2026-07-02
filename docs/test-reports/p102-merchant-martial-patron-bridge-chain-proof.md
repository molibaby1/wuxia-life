# P102 Merchant Martial Patron Bridge Chain Proof

> **Stage:** P102 Wuxia Merchant Martial Patron Bridge (Narrow Playable)
> **Date:** 2026-07-02

## Chain nodes

| Step | Age | Event | Flags in | Flags out |
| ---- | --- | ----- | -------- | --------- |
| 1 | 18 | `p22_early_wealth_route_fork` (merchant.json path) | — | `route_wealth_committed`, `p22_wealth_route_forked` |
| 2 | 32 | `merchant_sect_investment` | `merchant_wealthy` | `merchant_invest_good` |
| 3 | 34–38 | `merchant_patron_bridge_entry` | (flags.has('route_wealth_committed') || flags.has('p22_wealt… | `merchant_patron_bridge_crossed`, `merchant_patron_on_ramp_done`, variant marker |
| 4 | 48–52 | `merchant_patron_payoff_echo` | flags.has('merchant_patron_on_ramp_done') && !flags.has('mer… | `merchant_patron_payoff_done`, `merchant_patron_identity_done` |

## Expression differentiation

| Surface | Patron signal | Generic merchant | Magnate priority |
| ------- | ------------- | ---------------- | ---------------- |
| `merchantCurrentGoal` | 侠义盟约 / 商武一体 | 财富带来选择 | 巨贾 when `magnate_on_ramp_done` |
| `deriveSampleLineCostLabel` | 侠义盟约之累 / 商武名号之累 | 商路债务 | 巨贾负担 when magnate markers |
| `merchantAge40Identity` | 商武金主 | 商路中人 | 巨贾 identity when magnate markers |

## Regression scope

- P97–P101 magnate tests: unchanged spine events
- `guard:sample-lines-baseline`: no new guard script; spine additive only

## Deferred

- Ordinary-origin patron bridges (apprentice/tavern/peasant)
- Full patron pressure/mid/late chain
- Full Wave 3 mixed-achievement graph
