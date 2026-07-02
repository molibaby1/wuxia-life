# P110 Merchant Martial Patron Late-Life Targeted Proof

> **Stage:** P110 Patron Late-Life Playable Implementation
> **Date:** 2026-07-02
> **Contract:** P109 merchant-martial-patron-late-life-contract

## Core nodes (validation shape §2.2)

| Node | Verification |
| ---- | ------------ |
| 9 Pre-late-life state | `payoff_done` true, `late_life_done` false — cost/goal reflect payoff |
| 10 Late-life fires | auto events at age 52–56 keyed on payoff marker |
| 11 Checkpoint | `merchant_patron_late_life_done` via autoEffects |
| 13 Branch marker | one of `merchant_patron_late_*` matches payoff choice |
| 14 Cost label | late-life branch cost label per branch |
| 15 Current goal | late-life branch goal per branch |

## Path A: Native orthodox → payoff hold → late-life covenant bound

| Step | Flags / Expression |
| ---- | ------------------ |
| Entry | `merchant_patron_on_ramp_orthodox` |
| Payoff | `merchant_patron_payoff_covenant_holder` |
| Pre-late-life | cost=盟约如山之累, goal=硬扛盟约护商 |
| Late-life event | `merchant_patron_late_life_covenant_bound` fires |
| Post-late-life | `merchant_patron_late_covenant_bound`, cost=盟约终老之累, goal=守盟约至终 |
| Identity | 盟约终老的商武金主 |

## Path B: Native martial → payoff break → late-life isolated merchant

| Step | Flags / Expression |
| ---- | ------------------ |
| Entry | `merchant_patron_on_ramp_martial` |
| Payoff | `merchant_patron_payoff_covenant_breaker` |
| Pre-late-life | cost=断武从商之快, goal=撕破盟约 |
| Late-life event | `merchant_patron_late_life_isolated_merchant` fires |
| Post-late-life | `merchant_patron_late_isolated_merchant`, cost=孤商自在之快, goal=商路自分断 |

## Path C: Bridge apprentice → payoff balance → late-life sustainable covenant

| Step | Flags / Expression |
| ---- | ------------------ |
| Entry | `merchant_patron_bridge_apprentice_craft` + `apprentice_merchant_bridge_crossed` |
| Payoff | `merchant_patron_payoff_balancer` |
| Pre-late-life | cost=商武新矩之累, goal=重谈盟约边界 |
| Late-life event | `merchant_patron_late_life_sustainable_covenant` fires |
| Post-late-life | `merchant_patron_late_sustainable_covenant`, cost=新盟久立之累, goal=守新盟规矩 |
| Identity | 新盟掌局的金主 + 手艺标准 overlay |

## Endgame interface

- `merchant_patron_endgame_echo_done` not set by late-life (reserved P111+)

## Regression

- P102–P108 patron tests pass
- P100/P101 magnate tests pass
- `guard:sample-lines-baseline` pass
