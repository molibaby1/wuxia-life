# P113 Founding Patriarch Bridge Chain Proof

> **Stage:** P113 Wuxia Founding Patriarch Bridge (Narrow Playable)
> **Date:** 2026-07-02

## Chain nodes

| Step | Age | Event | Flags in | Flags out |
| ---- | --- | ----- | -------- | --------- |
| 1 | 15 | `scholar_mentor_line` rare roll | scholar_house + focus_on_study | `p16_scholar_mentor` |
| 2 | 30 | `p22_faction_sect_continuation` | `sect_exposure`/`joined_sect` | `p22_faction_continuation_active`, `p16_alliance_brokered` |
| 3 | 32–38 | `founding_patriarch_bridge_entry` | (flags.has('p16_scholar_mentor') || flags.has('p16_alliance_… | `founding_patriarch_bridge_crossed`, `founding_patriarch_on_ramp_done`, variant marker |
| 4 | 48–52 | `founding_patriarch_payoff_echo` (choice v2.0.0) | flags.has('founding_patriarch_on_ramp_done') && !flags.has('founding_patriarch_payoff_done') | `founding_patriarch_payoff_done`, `founding_patriarch_identity_done`, `founding_patriarch_payoff_resolved`, choice marker |

## Payoff choice branches

| Choice | Marker | Cost label | Goal |
| ------ | ------ | ---------- | ---- |
| 续责开派 | `founding_patriarch_payoff_legacy_holder` | 续责开派之累 | 续责如山，开派名号落在门派与治学一并传承之上 |
| 自立开派 | `founding_patriarch_payoff_independent_founder` | 自立开派之快 | 自立山门，治学规矩自己定 |
| 双门并立 | `founding_patriarch_payoff_dual_gate` | 双门并立之累 | 盟约师承各守其份 |

## Expression differentiation

| Surface | Founding patriarch signal | Generic orthodox | Renown on-ramp |
| ------- | ------------------------- | ---------------- | -------------- |
| `orthodoxCurrentGoal` | 开宗立派 / payoff choice goal | 行侠守义 / 守正 | 江湖名号 / 引荐主事 |
| `deriveSampleLineCostLabel` | 开派盟约之累 / payoff 之累/之快 | 守正代价 | 人情债 (renown line) |
| `orthodoxAge40Identity` | 开派苗子 / payoff identity | 正派武者 | renown identity |

## Regression scope

- P37 pinnacle parity tests: unchanged lifetime traces
- P102–P112 patron tests: unchanged spine events
- `guard:sample-lines-baseline`: spine additive only

## Deferred

- Full faction empire graph / multi-event pinnacle arc
- Ordinary-origin founding-patriarch bridges
- Full North Star §8 Wave 2 pinnacle content wave
- Midlife pressure chain between entry and payoff
