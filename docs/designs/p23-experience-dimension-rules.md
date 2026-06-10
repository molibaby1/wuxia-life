# P23 Representative Experience Dimension Rules

## In-scope dimensions (first pass)

| Dimension ID | Label | Life phases |
|--------------|-------|-------------|
| `archetype_strength` | Archetype strength | origin → legacy |
| `replay_distinctiveness` | Replay distinctiveness | early → mid |
| `route_differentiation` | Route differentiation | early_route → midlife |
| `stage_pacing_health` | Stage pacing health | childhood → late |
| `mid_late_payoff` | Mid/late payoff strength | midlife → legacy |
| `legacy_resonance` | Legacy resonance | legacy |
| `endgame_aftertaste` | Endgame aftertaste | endgame |

## How acceptance combines dimensions

1. **Early-life variation** (`archetype_strength`, `replay_distinctiveness`) — origin and childhood slices must diverge before mid-life scoring counts.
2. **Route differentiation** — scheduling and pacing deltas must exceed minimum thresholds, not only route label match.
3. **Consequence weight** (`mid_late_payoff`) — P17 engagement + P20 payoff spacing combined; flags alone insufficient.
4. **Legacy resonance** — P18 transmission/rupture signals weighted against successor investment.
5. **Endgame aftertaste** — P19 category + historical memory tone; closure rhythm must align with archetype pacing profile.

**Composite rule:** A wave passes experience acceptance when weak dimensions improve by ≥ configured delta without dropping any strong dimension below its healthy range.

## Stronger vs weaker slice pairing

Each baseline pairs a **stronger** replay slice (high signal match, healthy pacing/payoff) with a **weaker** slice (thin signals, flat pacing or payoff). Comparison must show measurable delta on the baseline metric.

## Authoring guidance

- Dimensions are theme-neutral field names for shared tooling.
- Slice IDs reference existing P20 `replaySliceConfigs`.
- Scores are 0–1 normalized for wave-to-wave comparison.
