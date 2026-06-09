# P20 Whole-Life Pacing Differentiation Rules (US-006)

## Per-Archetype Pacing Targets

| Archetype | Childhood/youth density | Adulthood route pressure | Payoff spacing | Callback cadence | Endgame closure |
| --- | --- | --- | --- | --- | --- |
| Martial ascendant | High (1.15×) | Early (+0y) | Tight (0.85×) | 3y martial echoes | Standard |
| Scholar statesman | Moderate (1.0×) | Delayed (+2y) | Wide (1.25×) | 4y study/mentor | Delayed |
| Wealth merchant | Moderate (0.95×) | Mid (+1y) | Wide (1.2×) | 5y trade callbacks | Standard |
| Hermit withdrawal | Low (0.8×) | Late (+3y) | Very wide (1.4×) | 6y withdrawal | Early fade |
| Demonic outlaw | High (1.1×) | Early (−1y) | Tight (0.9×) | 3y feud/risk | Fragmented |

## Visible vs Implicit

| Signal | Visible in reports/debug | Implicit weighting only |
| --- | --- | --- |
| Stage density multiplier | ✅ pacing comparison output | Applied in scheduling |
| Route-pressure offset | ✅ pacing comparison output | Applied via age-shifted gates |
| Payoff spacing | ✅ validation slices | Event weight modulation |
| Callback cadence | ✅ debug report lines | Echo/scheduling bias |
| Endgame closure rhythm | ✅ archetype regression matrix | Category weight nudge |

## P20 Non-Goals (implementation-facing)

- **No UI work** — reports under `docs/test-reports/` and test/debug builders only
- **No new themes** — `WorldProfile.id === 'wuxia'` only; resolvers accept `worldId` for theme neutrality
- **No large runtime rewrite** — extend `getRouteSchedulingMultiplier` / `selectEvent` weight chain; no new scheduler

## Deferred Beyond P20

- Dynamic difficulty pacing per player skill
- Age-40+ stage config expansion (P20 tunes within existing 0–40 slice + late-life gates)
- Real-time pacing telemetry in production UI
