# P20 Repeated-Run Overlap Audit (US-002)

Read-only audit of cross-run repetition across events, stage rhythms, and payoff shapes.

## Data Sources

- P9 `p9-replayability-pair-comparison.json` — 8 persona near-duplicate pairs
- P9 warning triage — `replayability: 8 near-duplicate pairs`
- `GameEngineIntegration.getFormalRepetitionSuppressionMultiplier` — setback/injury/illness/economy only
- P11 scheduling gate — route-point reinforcement warnings

## High-Frequency Repetition Hotspots

| Hotspot | Manifestation | Driver classification |
| --- | --- | --- |
| Early training loop | martial-lin, cautious-han, deviant-ye share `training: 3` action distribution | **over-dominant routes** |
| Summary identity template | "幼年练功的习惯延续至今" across martial, conservative, demonic | **config gap** (summary template) |
| `martial_talent_acknowledged` route label | Appears for unlike route preferences (martial, conservative, demonic) | **pool scarcity** |
| Low-impact 6–7y spans | All 8 P8 personas in P9 pacing bucket | **spacing collapse** |
| Midlife route reinforcement | scholar/deviant route points never scheduled (P11 baseline) | **config gap** |
| Late-life closure | Different P17/P18 trajectories can share P19 `ordinary_life` category if stats align | **payoff shape collapse** |

## Setup Collapse Cases

| Persona A | Persona B | Similar dimensions | Similarity score |
| --- | --- | --- | --- |
| p8-martial-lin | p8-cautious-han | action_distribution, summary_identity | 0.91 |
| p8-martial-lin | p8-deviant-ye | summary_identity | 0.85 |
| p8-scholar-su | p8-social-gu | (partial) early study/social overlap | ~0.82 |
| p8-wealth-shen | p8-balanced-wei | midlife economy pacing | ~0.80 |

Different setup candidates (origin, risk preference, route preference) collapse when:

1. Active-action strategy reduces to the same category histogram before age 20.
2. Summary templates echo the same route-entry flag regardless of persona.
3. Formal repetition suppression ignores non-setback exact repeats and thematic pools.

## Repetition Driver Summary

| Driver | Evidence | P20 lever |
| --- | --- | --- |
| **Config gaps** | No cross-run novelty preference; no archetype-scoped event-pool diversity target | Profile `repetitionPressureConfigs` |
| **Over-dominant routes** | Active-route 1.35× multiplier + martial training bias | Archetype pacing offsets per family |
| **Pool scarcity** | Shared early tags and summary slots | Archetype opportunity tag boosts + slice content |
| **Spacing collapse** | Uniform stage density expectations | Per-archetype `stageProfiles` density multipliers |

## Healthy vs Harmful (observed)

- **Healthy thematic recurrence**: echo hooks, route reinforcement after explicit player commitment — currently working.
- **Harmful repetition**: identical early action histograms, same summary identity line, exact event ID within 3y without setback class — partially suppressed only for high-negative events.

## P20 Priority

1. Profile-first repetition pressure with exact-repeat suppression + thematic continuity floor.
2. Cross-stage payoff spacing rules per archetype family.
3. Validation slice demonstrating reduced overlap between controlled replay pairs.

No gameplay changes in US-002.
