# P19 Endgame Outcome Surface Audit (US-001)

Read-only inventory of endgame outcome, end-of-life state, and final fate signals.

## Scope

- `EndingSystem.determineEnding` / `getForcedLateLifeEnding` — stat-threshold ending selection
- `EventExecutor` `end_game` effect — triggers ending at event completion
- `EndingSystem.getEndingSummary` — short category-based summary lines
- `EndingSystem.generateEndingReview` — stat dump + achievements + critical choices
- `GameProcessSimulator.generateReport` — simulation ending summary
- P16 `compositeDestinyOutcomes` — mid-life destiny checkpoints, not endgame categories
- P17/P18 later-life multipliers — scheduling only, not final category selection

## Surface Inventory

| Surface | Primary signals | Classification | Differentiation gap |
| --- | --- | --- | --- |
| `EndingSystem.ENDINGS` | chivalry, reputation, martialPower, karma, flags | **runtime-bound** | Threshold buckets; age rarely decisive beyond forced late-life |
| `getForcedLateLifeEnding` | age ≥ 70 | **runtime-bound** | Re-runs same stat ending at 70+ |
| `getEndingSummary` | ending.category + lifeStates | **runtime-bound** | ~10 generic lines; no relationship/faction/legacy |
| `generateEndingReview` | player stats, achievements | **runtime-bound** | Autobiographical; no posthumous layer |
| `end_game` effect | event-authored | **content-only** | Sets flags; no profile-first category |
| P17 consequence report | relationship/faction/maintenance | **partially config-driven** | Weights scheduling, not final fate |
| P18 legacy report | successor/inheritance/outcomes | **partially config-driven** | Weights scheduling, not final fate |
| `summaryTemplates` | route identity at age 40 | **config-driven** | Mid-life only; not endgame |

## Collapse Patterns

1. **Age-or-route label endings** — Two runs with different relationship/faction arcs can share the same `ordinary_life` or `bittersweet_success` if stats align.
2. **No endgame category layer** — Positive/neutral/negative enum replaces trajectory-shaped closure types.
3. **Summary without recovery** — Pre-endgame unresolved vendettas, faction exposure, and legacy burden do not appear in final summary.
4. **Scheduling ≠ closure** — P17/P18 multipliers affect event weights but do not compose into ending narrative.

## P19 Priority (endgame outcome)

1. Profile-first endgame category configs with trajectory inputs (relationship, faction, legacy, burden).
2. Theme-neutral category selection resolver consumed at summary/endgame time.
3. Upgrade final summary to include category + recovery + legacy + historical memory.
4. Validation slices proving category change beyond age/route label.

No gameplay changes in US-001.
