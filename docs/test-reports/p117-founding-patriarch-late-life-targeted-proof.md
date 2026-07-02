# P117 Founding Patriarch Late-Life Targeted Proof

> **Stage:** P117 Founding Patriarch Late-Life Playable Implementation
> **Date:** 2026-07-02
> **Contract:** P116 founding-patriarch-late-life-contract

## Core nodes (validation shape §2.2)

| Node | Verification |
| ---- | ------------ |
| 9 Pre-late-life state | `payoff_done` true, `late_life_done` false — cost/goal reflect payoff |
| 10 Late-life fires | auto events at age 52–56 keyed on pressure marker |
| 11 Checkpoint | `founding_patriarch_late_life_done` via autoEffects |
| 13 Branch marker | one of `founding_patriarch_late_*` matches pressure marker |
| 14 Cost label | late-life branch cost label per branch |
| 15 Current goal | late-life branch goal per branch |

## Branch A: Scholar on-ramp → rule_first → payoff → late-life rule_keeper

| Step | Flag / Signal | Value |
| ---- | ------------- | ----- |
| Pre-late-life | `founding_patriarch_payoff_done` | true |
| Pre-late-life | `founding_patriarch_late_life_done` | false |
| Pre-late-life cost | deriveSampleLineCostLabel | 续责开派之累 |
| Pre-late-life goal | deriveSampleLineCurrentGoal | 续责如山，开派名号落在门派与治学一并传承之上 |
| Post-late-life | `founding_patriarch_late_rule_keeper` | true |
| Post-late-life cost | deriveSampleLineCostLabel | 门规守成之累 |
| Post-late-life goal | deriveSampleLineCurrentGoal | 守门规至终，治学师承不能断 |
| Post-late-life identity | deriveSampleLineAge40Identity | 你是门规守成的开宗祖师：学者师徒线拉着门规传承，晚年以书斋治学为主。弟子争议、门规执行一件接一件，盟约事务退为背景 |

## Branch B: Alliance on-ramp → alliance_first → payoff → late-life alliance_bearer

| Step | Flag / Signal | Value |
| ---- | ------------- | ----- |
| Post-late-life | `founding_patriarch_late_alliance_bearer` | true |
| Post-late-life cost | deriveSampleLineCostLabel | 盟约续责之累 |
| Post-late-life goal | deriveSampleLineCurrentGoal | 守盟约至终，诸派续责不能推 |
| Post-late-life identity | deriveSampleLineAge40Identity | 你是盟约续责的开宗祖师：诸派盟约线拉着续责差遣，晚年以山门对外为主。续责诸派、盟会差遣一件接一件，门规收束为执行工具 |

## Endgame interface reserved

- Late-life events do **not** set `founding_patriarch_endgame_echo_done`
- Pressure markers preserved after late-life (not cleared)

## Regression

- `tests/p117FoundingPatriarchLateLifeTests.ts` — R1–R30
- `tests/p113FoundingPatriarchBridgeTests.ts` — P113
- `tests/p115FoundingPatriarchMidlifePressureTests.ts` — P115
- `guard:sample-lines-baseline` pass
