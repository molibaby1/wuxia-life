# P102 Merchant Martial Patron Bridge Chain Proof

> **Stage:** P102 Wuxia Merchant Martial Patron Bridge (Narrow Playable)
> **Date:** 2026-07-02

## Chain nodes

| Step | Age | Event | Flags in | Flags out |
| ---- | --- | ----- | -------- | --------- |
| 1 | 18 | `p22_early_wealth_route_fork` (merchant.json path) | — | `route_wealth_committed`, `p22_wealth_route_forked` |
| 2 | 32 | `merchant_sect_investment` | `merchant_wealthy` | `merchant_invest_good` |
| 3 | 34–38 | `merchant_patron_bridge_entry` | (flags.has('route_wealth_committed') || flags.has('p22_wealt… | `merchant_patron_bridge_crossed`, `merchant_patron_on_ramp_done`, variant marker |
| 4 | 40–44 | `merchant_patron_midlife_pressure` | `merchant_patron_on_ramp_done` | `merchant_patron_midlife_pressure_done`, variant pressure marker |
| 5 | 48–52 | `merchant_patron_payoff_echo` (choice v2.0.0) | flags.has('merchant_patron_midlife_pressure_done') && !flags… | `merchant_patron_payoff_done`, `merchant_patron_identity_done`, `merchant_patron_payoff_resolved`, choice marker |
| 6 | 52–56 | `merchant_patron_late_life_*` (auto v1.0.0) | `merchant_patron_payoff_done` + payoff marker + !late_life_done | `merchant_patron_late_life_done`, `merchant_patron_late_life_identity_done`, `merchant_patron_late_*` branch marker |

## Payoff choice branches (P108)

| Choice | Marker | Cost label | Goal |
| ------ | ------ | ---------- | ---- |
| 硬扛盟约 | `merchant_patron_payoff_covenant_holder` | 盟约如山之累 | 硬扛盟约护商 |
| 撕破盟约 | `merchant_patron_payoff_covenant_breaker` | 断武从商之快 | 撕破盟约，商号不再听山门差遣 |
| 商武平衡 | `merchant_patron_payoff_balancer` | 商武新矩之累 | 重谈盟约边界 |

## Late-life branches (P110)

| Payoff marker | Late-life event | Branch marker | Cost label | Goal |
| ------------- | --------------- | ------------- | ---------- | ---- |
| covenant_holder | `merchant_patron_late_life_covenant_bound` | `merchant_patron_late_covenant_bound` | 盟约终老之累 | 守盟约至终，商武名号不能倒 |
| covenant_breaker | `merchant_patron_late_life_isolated_merchant` | `merchant_patron_late_isolated_merchant` | 孤商自在之快 | 商路自分断，不再求山门庇护 |
| balancer | `merchant_patron_late_life_sustainable_covenant` | `merchant_patron_late_sustainable_covenant` | 新盟久立之累 | 守新盟规矩，传商武分寸给后来人 |

Expression priority after P110: `late_life_done` > `payoff_done` > pressure > on-ramp. Identity reads `merchant_patron_late_life_identity_done` + late-life branch marker before payoff choice.

## Expression differentiation

| Surface | Patron signal | Generic merchant | Magnate priority |
| ------- | ------------- | ---------------- | ---------------- |
| `merchantCurrentGoal` | late-life / payoff choice goal / pressure / on-ramp | 财富带来选择 | 巨贾 when `magnate_on_ramp_done` |
| `deriveSampleLineCostLabel` | late-life / payoff choice 之累/之快 / pressure 之债 / on-ramp 之累 | 商路债务 | 巨贾负担 when magnate markers |
| `merchantAge40Identity` | late-life / payoff choice identity + entry overlay | 商路中人 | 巨贾 identity when magnate markers |

## Regression scope

- P97–P101 magnate tests: unchanged spine events
- `guard:sample-lines-baseline`: no new guard script; spine additive only

## Deferred

- Full 5×3 entry×payoff×late-life identity matrix
- Patron endgame echo (P111+)
- Ordinary-origin patron expression
- Full Wave 3 mixed-achievement graph
