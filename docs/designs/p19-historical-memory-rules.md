# P19 Historical Memory And Reputation Rules (US-006)

## Evaluation dimensions

| Dimension | Source signals |
| --- | --- |
| `local_remembrance` | family, spouse, children, quiet continuity |
| `jianghu_reputation` | reputation, chivalry, hero mantle |
| `faction_memory` | sect standing, duty, exposure |
| `legacy_testimony` | disciples, transmission, heir outcomes |
| `moral_ambiguity` | mixed karma, disputed choices |
| `distorted_legacy` | public myth vs private conduct gap |

## Lived reality vs posthumous reputation

- **Lived self-understanding** — derived from personal stats, lifeStates, and positive/neutral ending category tone
- **Posthumous reputation** — dominant `historicalMemoryPattern` tones weighted by intensity
- **Divergence** — patterns with `livedRealityDelta` shift posthumous tone away from self-image; inspectable via `divergenceScore`

Posthumous output may praise a controversial figure (feared/disputed) or soften a harsh self-judgment (admired local memory despite modest stats).

## Summary and report output

- `classificationLines` — debugging/balancing reasoning (pattern ids, tones, deltas)
- Final summary includes 1–3 historical-memory lines from resolver

## Deferred beyond P19

- Dynamic rumor propagation across NPCs
- Faction-specific historiography text packs per sect
- Player-facing memory ledger UI
