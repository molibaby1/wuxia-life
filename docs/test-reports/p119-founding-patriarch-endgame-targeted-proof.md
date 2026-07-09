# P119 Founding Patriarch Endgame Targeted Proof

> **Stage:** P119 Founding Patriarch Endgame Playable Implementation
> **Date:** 2026-07-02
> **Contract:** P118 founding-patriarch-endgame-contract

## Core nodes (validation shape §2.2)

| Node | Verification |
| ---- | ------------ |
| 9 Pre-endgame state | `late_life_done` true, `endgame_echo_done` false — cost/goal reflect late-life |
| 10 Endgame fires | auto events at age 60–65 keyed on late-life marker |
| 11 Checkpoint | `founding_patriarch_endgame_echo_done` via autoEffects |
| 12 Identity done | `founding_patriarch_endgame_identity_done` via autoEffects |
| 13 Branch marker | one of `founding_patriarch_endgame_*` matches late-life branch |
| 14 Cost label | endgame branch cost label per branch |
| 15 Current goal | endgame branch goal per branch |

## Branch A: Scholar on-ramp → rule_first → payoff → late-life rule_keeper → endgame rule_echo

| Step | Flag / Signal | Value |
| ---- | ------------- | ----- |
| Pre-endgame | `founding_patriarch_late_life_done` | true |
| Pre-endgame | `founding_patriarch_endgame_echo_done` | false |
| Pre-endgame cost | deriveSampleLineCostLabel | 门规守成之累 |
| Pre-endgame goal | deriveSampleLineCurrentGoal | 守门规至终，治学师承不能断 |
| Endgame event | `founding_patriarch_endgame_echo_rule_keeper` fires at 62 |
| Post-endgame | `founding_patriarch_endgame_rule_echo` | true |
| Post-endgame cost | deriveSampleLineCostLabel | 开派终局·规 |
| Post-endgame goal | deriveSampleLineCurrentGoal | 门规碑立，治学师承交给后来人续 |
| Post-endgame identity | deriveSampleLineAge40Identity | 你是门规碑上的开宗祖师：学者师徒线拉着门规传承，书斋封了，门规立了，诸派还照着走。开派名号比人长久，规矩也还在 |

## Branch B: Alliance on-ramp → alliance_first → payoff → late-life alliance_bearer → endgame alliance_echo

| Step | Flag / Signal | Value |
| ---- | ------------- | ----- |
| Post-endgame | `founding_patriarch_endgame_alliance_echo` | true |
| Post-endgame cost | deriveSampleLineCostLabel | 开派终局·盟 |
| Post-endgame goal | deriveSampleLineCurrentGoal | 盟约碑立，诸派续责交给后来人扛 |
| Post-endgame identity | deriveSampleLineAge40Identity | 你是盟约碑上的开宗祖师：诸派盟约线拉着续责差遣，山门立了，盟约续了，诸派还记着这笔账。开派名号比人长久，续责也还在 |

## Lightweight constraint

- No stat_modify in endgame autoEffects
- `founding_patriarch_late_life_done` preserved (not unset)

## Cross-route regression

- `npm run test:sample-lines-routes` — flat patron/magnate/founding chain + baseline guard
