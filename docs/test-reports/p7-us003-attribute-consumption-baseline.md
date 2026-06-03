# P7 US-003 — Attribute Consumption Baseline

生成时间：2026-06-03

## Active event conditions → player attributes

Most frequent `player.*` references in **runtime-loaded** line files:

| Attribute | Loaded-file refs (approx.) | Primary consumers |
| --- | ---: | --- |
| martialPower / externalSkill / internalSkill / qinggong | high (training, sect routes) | training.json, sect-*.json |
| chivalry | medium | identity-hero, general, setback |
| charisma | low–medium | general, identity-hero, love, training |
| comprehension | low | training, general |
| reputation | low | identity-hero, general |
| connections | low | identity-hero, general |
| constitution | rare in loaded set | training (sparse) |
| money | rare in loaded set | general (sparse) |
| knowledge / wealth / businessAcumen | mostly deferred modules | identity-merchant, official (deferred) |

## Outcome branches

Choice `outcomes[].condition` and `choice.condition` expressions use the same `player.*` and bare stat identifiers supported by `ConditionEvaluator.DIRECT_PLAYER_PROPERTIES`.

## Identity, ending, and report consumers

| System | Attributes read |
| --- | --- |
| `ReputationGateSystem` | reputation → event unlock tiers |
| `RouteStateManager` / route flags | chivalry, reputation, connections (fixture bootstrap) |
| `AttributePanel` development suggestions | knowledge, charisma, connections, wealth (hardcoded thresholds) |
| Ending weight / identity resolution | martialPower, chivalry, reputation, route flags |
| Simulator reports | full player snapshot per record |

## Classification

| Tier | Attributes |
| --- | --- |
| **Active** | martialPower, externalSkill, internalSkill, qinggong, chivalry, age |
| **Weakly used** | charisma, comprehension, reputation, connections, constitution, money |
| **Hidden / semi-implicit** | health, energy, influence, businessAcumen |
| **Unused in 0–30 spine** | wealth (panel only), knowledge (deferred official path) |

## Baseline note

Attribute meaning for P7 should anchor on **active + weakly used** stats in candidate spine events. Panel route suggestions currently reference thresholds for paths (official, merchant, hermit) that are deferred or non-priority — treat as stale guidance (see US-024).
