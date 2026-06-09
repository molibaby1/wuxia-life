# P20 Repetition-Control And Recurrence Rules (US-005)

## Harmful Repetition (suppress in first P20 pass)

| Category | Definition | Example |
| --- | --- | --- |
| Exact-repeat event | Same formal event id within `crossStagePayoffMinSpacing` years | Repeated economy setback event |
| Rhythm collapse | Same action-category histogram across unlike setups before age 20 | martial-lin ≡ cautious-han training:3 |
| Payoff shape repeat | Same achievement/summary slot despite different route pressure | Shared `martial_talent_acknowledged` summary |
| Late-life closure repeat | Same endgame category + memory tone without trajectory cause | Stat-aligned `ordinary_life` |

## Healthy Thematic Recurrence (preserve)

- Echo hooks tied to explicit player actions
- Route reinforcement after commitment flags
- Recurring mentor/sect/feud callbacks when P17 consequence patterns are active
- Setback-class soft decay already in `getFormalRepetitionSuppressionMultiplier`

## Trade-Off Rules (first P20 pass)

| Control | Setting | Rationale |
| --- | --- | --- |
| Exact-repeat suppression | `0.35–0.55` decay per recent exact match | Strong enough to notice; avoids empty pools |
| Novelty preference | `0.15–0.30` boost for unseen event ids in window | Freshens without excluding thematic neighbors |
| Thematic continuity floor | `0.40` minimum weight for same-tag events when archetype family active | Prevents random unrelatedness |
| Route-specific variance | Per-archetype `routeVarianceBoost` on non-dominant routes | Counteracts 1.35× active-route dominance |
| Cross-stage payoff spacing | `2–4` years minimum between same payoff class | Reduces midgame flattening |

## Deferred Beyond P20

- Cross-save global novelty memory (multi-run persistence)
- Player-visible "seen event" ledger
- LLM-authored event pool expansion
- Daily-event repetition overhaul (formal events only in P20)
