# P112 Merchant Martial Patron Endgame Targeted Proof

> **Stage:** P112 Patron Endgame Playable Implementation
> **Date:** 2026-07-02
> **Contract:** P111 merchant-martial-patron-endgame-contract

## Core nodes (validation shape §2.2)

| Node | Verification |
| ---- | ------------ |
| 9 Pre-endgame state | `late_life_done` true, `endgame_echo_done` false — cost/goal reflect late-life |
| 10 Endgame fires | auto events at age 60–65 keyed on late-life marker |
| 11 Checkpoint | `merchant_patron_endgame_echo_done` via autoEffects |
| 12 Identity done | `merchant_patron_endgame_identity_done` via autoEffects |
| 13 Branch marker | one of `merchant_patron_endgame_*` matches late-life branch |
| 14 Cost label | endgame branch cost label per branch |
| 15 Current goal | endgame branch goal per branch |

## Path A: Native orthodox → payoff hold → late-life covenant → endgame 担

| Step | Flags / Expression |
| ---- | ------------------ |
| Entry | `merchant_patron_on_ramp_orthodox` |
| Payoff | `merchant_patron_payoff_covenant_holder` |
| Late-life | `merchant_patron_late_covenant_bound` |
| Pre-endgame | cost=盟约终老之累, goal=守盟约至终 |
| Endgame event | `merchant_patron_endgame_echo_covenant_bound` fires at 62 |
| Post-endgame | `merchant_patron_endgame_covenant_echo`, cost=商武终局·担, goal=盟约碑立 |
| Identity | 盟约碑上的商武金主 |

## Path B: Native martial → payoff break → late-life isolated → endgame 孤

| Step | Flags / Expression |
| ---- | ------------------ |
| Entry | `merchant_patron_on_ramp_martial` |
| Payoff | `merchant_patron_payoff_covenant_breaker` |
| Late-life | `merchant_patron_late_isolated_merchant` |
| Pre-endgame | cost=孤商自在之快, goal=商路自分断 |
| Endgame event | `merchant_patron_endgame_echo_isolated_merchant` fires at 62 |
| Post-endgame | `merchant_patron_endgame_solitary_echo`, cost=商武终局·孤, goal=商号是自己的定论 |

## Path C: Bridge apprentice → payoff balance → late-life sustainable → endgame 传

| Step | Flags / Expression |
| ---- | ------------------ |
| Entry | `merchant_patron_bridge_apprentice_craft` + `apprentice_merchant_bridge_crossed` |
| Payoff | `merchant_patron_payoff_balancer` |
| Late-life | `merchant_patron_late_sustainable_covenant` |
| Pre-endgame | cost=新盟久立之累, goal=守新盟规矩 |
| Endgame event | `merchant_patron_endgame_echo_sustainable_covenant` fires at 62 |
| Post-endgame | `merchant_patron_endgame_legacy_echo`, cost=商武终局·传, goal=新盟分寸 |
| Identity | 新盟传统的金主 + 手艺标准 overlay |

## Lightweight constraint

- No stat_modify in endgame autoEffects
- `merchant_patron_late_life_done` preserved (not unset)

## Regression

- P102–P110 patron tests pass
- P100/P101 magnate tests pass
- `guard:sample-lines-baseline` pass
