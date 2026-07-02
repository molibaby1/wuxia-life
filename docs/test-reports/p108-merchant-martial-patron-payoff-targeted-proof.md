# P108 Merchant Martial Patron Payoff Targeted Proof

> **Stage:** P108 Patron Payoff Playable Implementation
> **Date:** 2026-07-02
> **Contract:** P107 merchant-martial-patron-payoff-contract

## Core nodes (validation shape §2.2)

| Node | Verification |
| ---- | ------------ |
| 7 Pre-payoff state | `midlife_pressure_done` true, `payoff_done` false — cost=之债, goal=pressure |
| 8 Payoff fires | `merchant_patron_payoff_echo` choice at age 48–52 |
| 9 Checkpoint | `merchant_patron_payoff_done` via autoEffects |
| 10 Resolved | `merchant_patron_payoff_resolved` via autoEffects |
| 13–14 Expression | cost label + goal per choice marker |

## Path A: Native orthodox → hold covenant

| Step | Flags / Expression |
| ---- | ------------------ |
| Entry | `merchant_patron_on_ramp_orthodox` |
| Pressure | `merchant_patron_midlife_pressure_done`, cost=侠义盟约之债 |
| Payoff choice A | `merchant_patron_payoff_covenant_holder` |
| Post-payoff | cost=盟约如山之累, goal=硬扛盟约护商 |
| Identity | 靠盟约定型的商武金主 |

## Path B: Native martial → break covenant

| Step | Flags / Expression |
| ---- | ------------------ |
| Entry | `merchant_patron_on_ramp_martial` |
| Pressure | `merchant_patron_midlife_pressure_done`, cost=护商武力之债 |
| Payoff choice B | `merchant_patron_payoff_covenant_breaker` |
| Post-payoff | cost=断武从商之快, goal=撕破盟约 |
| Identity | 断武从商的巨贾 |

## Path C: Bridge apprentice → balance covenant

| Step | Flags / Expression |
| ---- | ------------------ |
| Entry | `merchant_patron_bridge_apprentice_craft` + `apprentice_merchant_bridge_crossed` |
| Pressure | `merchant_patron_midlife_pressure_done`, cost=手艺护商之债 |
| Payoff choice C | `merchant_patron_payoff_balancer` |
| Post-payoff | cost=商武新矩之累, goal=重谈盟约边界 |
| Identity | 懂商武分寸的金主 (bridge overlay on covenant_holder variant tested separately) |

## Late-life interface

- `merchant_patron_late_life_done` not set by payoff (reserved P109+)

## Regression

- P102–P106 tests pass
- P100/P101 magnate tests pass
- `guard:sample-lines-baseline` pass
