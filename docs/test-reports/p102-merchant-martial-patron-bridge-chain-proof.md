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

## Payoff choice branches (P108)

| Choice | Marker | Cost label | Goal |
| ------ | ------ | ---------- | ---- |
| 硬扛盟约 | `merchant_patron_payoff_covenant_holder` | 盟约如山之累 | 硬扛盟约护商 |
| 撕破盟约 | `merchant_patron_payoff_covenant_breaker` | 断武从商之快 | 撕破盟约，商号不再听山门差遣 |
| 商武平衡 | `merchant_patron_payoff_balancer` | 商武新矩之累 | 重谈盟约边界 |

## Expression differentiation

| Surface | Patron signal | Generic merchant | Magnate priority |
| ------- | ------------- | ---------------- | ---------------- |
| `merchantCurrentGoal` | payoff choice goal / pressure / on-ramp | 财富带来选择 | 巨贾 when `magnate_on_ramp_done` |
| `deriveSampleLineCostLabel` | payoff choice 之累/之快 / pressure 之债 / on-ramp 之累 | 商路债务 | 巨贾负担 when magnate markers |
| `merchantAge40Identity` | payoff choice identity + entry overlay | 商路中人 | 巨贾 identity when magnate markers |

## Regression scope

- P97–P101 magnate tests: unchanged spine events
- `guard:sample-lines-baseline`: no new guard script; spine additive only

## Deferred

- Full 5×3 entry×payoff identity matrix
- Patron late-life / endgame echo (P109+)
- Ordinary-origin patron expression
- Full Wave 3 mixed-achievement graph
