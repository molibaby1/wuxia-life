# P113 Founding Patriarch Bridge Chain Proof

> **Stage:** P113 Wuxia Founding Patriarch Bridge (Narrow Playable)
> **Date:** 2026-07-02

## Chain nodes

| Step | Age | Event | Flags in | Flags out |
| ---- | --- | ----- | -------- | --------- |
| 1 | 15 | `scholar_mentor_line` rare roll | scholar_house + focus_on_study | `p16_scholar_mentor` |
| 2 | 30 | `p22_faction_sect_continuation` | `sect_exposure`/`joined_sect` | `p22_faction_continuation_active`, `p16_alliance_brokered` |
| 3 | 32–38 | `founding_patriarch_bridge_entry` | (flags.has('p16_scholar_mentor') || flags.has('p16_alliance_… | `founding_patriarch_bridge_crossed`, `founding_patriarch_on_ramp_done`, on-ramp variant marker |
| 4 | 40–45 | `founding_patriarch_midlife_pressure` | `founding_patriarch_on_ramp_done && !founding_patriarch_midlife_pressure_done` | `founding_patriarch_midlife_pressure_done`, `founding_patriarch_pressure_rule_first/alliance_first` |
| 5 | 48–52 | `founding_patriarch_payoff_echo` (choice v2.0.0) | flags.has('founding_patriarch_midlife_pressure_done') && !flags.has('founding_patriarch_payoff_done') | `founding_patriarch_payoff_done`, `founding_patriarch_identity_done`, `founding_patriarch_payoff_resolved`, choice marker |
| 6 | 52–56 | `founding_patriarch_late_life_*` (auto) | `founding_patriarch_payoff_done` + pressure marker | `founding_patriarch_late_life_done`, `founding_patriarch_late_life_identity_done`, `founding_patriarch_late_rule_keeper` / `founding_patriarch_late_alliance_bearer` |
| 7 | 60–65 | `founding_patriarch_endgame_echo_*` (auto) | `founding_patriarch_late_life_done` + late-life marker | `founding_patriarch_endgame_echo_done`, `founding_patriarch_endgame_identity_done`, `founding_patriarch_endgame_rule_echo` / `founding_patriarch_endgame_alliance_echo` |

## Payoff choice branches

| Choice | Marker | Cost label | Goal |
| ------ | ------ | ---------- | ---- |
| 续责开派 | `founding_patriarch_payoff_legacy_holder` | 续责开派之累 | 续责如山，开派名号落在门派与治学一并传承之上 |
| 自立开派 | `founding_patriarch_payoff_independent_founder` | 自立开派之快 | 自立山门，治学规矩自己定 |
| 双门并立 | `founding_patriarch_payoff_dual_gate` | 双门并立之累 | 盟约师承各守其份 |

## Late-life branches (P117)

| Late-life branch | Marker | Cost label | Goal |
| ---------------- | ------ | ---------- | ---- |
| 门规守成终老 | `founding_patriarch_late_rule_keeper` | 门规守成之累 | 守门规至终，治学师承不能断 |
| 盟约续责终老 | `founding_patriarch_late_alliance_bearer` | 盟约续责之累 | 守盟约至终，诸派续责不能推 |

## Endgame branches (P119)

| Endgame branch | Marker | Cost label | Goal |
| -------------- | ------ | ---------- | ---- |
| 开派终局·规 | `founding_patriarch_endgame_rule_echo` | 开派终局·规 | 门规碑立，治学师承交给后来人续 |
| 开派终局·盟 | `founding_patriarch_endgame_alliance_echo` | 开派终局·盟 | 盟约碑立，诸派续责交给后来人扛 |

## Expression differentiation

| Surface | Founding patriarch signal | Generic orthodox | Renown on-ramp |
| ------- | ------------------------- | ---------------- | -------------- |
| `orthodoxCurrentGoal` | 开宗立派 / payoff choice goal | 行侠守义 / 守正 | 江湖名号 / 引荐主事 |
| `deriveSampleLineCostLabel` | 开派盟约之累 / payoff 之累/之快 | 守正代价 | 人情债 (renown line) |
| `orthodoxAge40Identity` | 开派苗子 / payoff identity / late-life / endgame identity | 正派武者 | renown identity |

## Full spine trace (P113 → P119)

```
bridge_entry → midlife_pressure → payoff_echo → late_life_* → endgame_echo_*
```

Expression priority: `endgame_echo_done` > `late_life_done` > `payoff_done` > `midlife_pressure_done` > on-ramp

## Regression scope

- P37 pinnacle parity tests: unchanged lifetime traces
- P102–P112 patron tests: unchanged spine events
- P115/P117/P119 founding-patriarch tests: additive spine only
- `guard:sample-lines-baseline`: spine additive only

## Deferred

- Full faction empire graph / multi-event pinnacle arc
- Ordinary-origin founding-patriarch bridges
- Full North Star §8 Wave 2 pinnacle content wave
- Midlife pressure chain between entry and payoff
