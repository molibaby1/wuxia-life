# P19 Epilogue And Historical Memory Surface Audit (US-003)

Read-only inventory of epilogue summary, posthumous reputation, and historical-memory signals.

## Scope

- `EndingSystem.generateEndingReview` / `getEndingSummary`
- `EndingSystem` negative endings (`eternal_damnation`, `tragic_death`) — name implies posthumous but no evaluation model
- P17 hero/reputation maintenance patterns
- P18 reputation inheritance channel
- `lifeMemory` types, simulation report `endingSummary`

## Memory Surface Inventory

| Surface | Signal | Classification | Personal vs public memory |
| --- | --- | --- | --- |
| `getEndingSummary` | ending id/category | **runtime-bound** | Personal tone only |
| `generateEndingReview` | stats + achievements | **runtime-bound** | Autobiography = public memory |
| `eternal_damnation` ending copy | evil_karma threshold | **runtime-bound** | Fixed text; no dimension mix |
| P17 prestige/hero maintenance | reputation neglect | **partially config-driven** | Live reputation; not posthumous |
| P18 reputation channel | `reputation`, hero flags | **partially config-driven** | Heir-facing asset; not Jianghu memory |
| Simulation `endingSummary` | EndingSystem helper | **runtime-bound** | Single shallow line |

## Collapse Patterns

1. **No historical-memory layer** — World remembrance collapses into the same stat summary the player already saw.
2. **No lived-vs-posthumous divergence** — High chivalry + disputed public acts cannot yield mixed remembrance.
3. **No evaluation dimensions** — Local, Jianghu, faction, testimony, ambiguity, distortion not separable.
4. **No classification output** — Balancers cannot inspect why two similar-strength runs got identical epilogue tone.

## P19 Priority (historical memory)

1. `historicalMemoryPatterns` with dimension + tone + optional `livedRealityDelta`.
2. `HistoricalMemoryReport` with lived self-understanding vs posthumous reputation strings.
3. Samples: admired, feared/disputed, lived-reality divergence.
4. Final summary composition includes historical-memory lines from shared resolver.

No gameplay changes in US-003.
