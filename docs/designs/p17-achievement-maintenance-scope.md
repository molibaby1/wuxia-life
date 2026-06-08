# P17 Achievement Maintenance Rules And Scope Boundary (US-006)

## Maintenance model

High-tier achievements register **maintenance patterns** with dimensions:

- `reputation`, `followers`, `resources`, `alliances`, `internal_stability`, `external_threat`

Each dimension has `requiredLevel` (0–1). Runtime compares player stats/flags to infer **satisfaction**. Unmet dimensions accumulate **unmet pressure** (0–1 per dimension, aggregated).

## Ongoing pressure (not static prestige)

When maintenance is neglected:

- Risk tags (`decline`, `backlash`, `instability`, `conflict`) gain weight in later-life selection.
- Opportunity tags for the same achievement family may be damped.

When maintained:

- Opportunity tags (`prestige`, `backing`, `resource`) stay boosted.

## In scope for P17

- Profile schema for maintenance patterns.
- Theme-neutral resolver + later-life wiring (age ≥ 25).
- Visible `unmetPressure` report for tests/gates.
- ≥ 3 representative patterns across dimension families.
- Validation slice + gate + closure report.

## Deferred beyond P17

| Area | Reason |
| --- | --- |
| Descendants / training next generation | Explicit PRD non-goal |
| UI panels for maintenance meters | UI expansion non-goal |
| Second-theme (non-wuxia) feature work | Profile path only; no new theme pack |
| Large runtime rewrite | Extend `getRouteSchedulingMultiplier`; no new scheduler |
| Replacing `IdentitySystem` / `LifePathManager` | Legacy paths remain; profile overlays |
| Economy simulation depth | Tag weighting only |

## Implementation-facing non-goals

- Do not fork event selection into wuxia-only branches.
- Do not require save-schema migration; patterns read existing flags/stats.
- Do not remove hardcoded wanderer/romance boosts in P17; generalize via patterns incrementally.
