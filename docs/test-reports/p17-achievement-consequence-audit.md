# P17 High-Tier Achievement Consequence Audit (US-003)

Read-only inventory of post-achievement sustained consequence sources.

## Scope

- `state.achievements`, `state.lifePath.achievements`, `state.identity.achievements`
- Achievement-adjacent flags (`hero_rep_mantle`, sect leadership flags, marriage/family flags)
- `deriveLifeMemorySummary` achievement and debt sections
- Hardcoded midlife boosts (`getWandererMidlifeSchedulingMultiplier`, romance-family scheduling)

## Surface Inventory

| Surface | Write path | Read path (sustained) | Classification | Collapse risk |
| --- | --- | --- | --- | --- |
| `state.achievements[]` | Event effects, life-path handlers | Endings, life-memory, identity | **content-only** | IDs listed; no upkeep model |
| Achievement flags (e.g. `hero_rep_mantle`) | Hero / sect event lines | Hardcoded scheduling multipliers | **runtime-bound** | Per-event hacks, not profile |
| `getWandererMidlifeSchedulingMultiplier` | N/A (hardcoded IDs) | Ages 31–50 wanderer events | **runtime-bound** | Showcase only for one route |
| `getRomanceFamilySchedulingMultiplier` | N/A | Marriage/child events | **runtime-bound** | Family line only |
| Life-memory achievements | `deriveLifeMemorySummary` | Player-facing summary | **partially config-driven** | Prestige text; no neglect risk |
| Life-memory debts | unresolved flags + commitments | Summary urgency bands | **partially config-driven** | Visible but not weighted in selection |
| Composite destiny (P16) | Profile `compositeDestinyOutcomes` | Early/mid unlock reporting | **config-driven** | Forward-looking; not maintenance |

## Collapse Patterns

1. **Prestige-only end states** — sect master, hero mantle, official promotion resolve into flags + summary lines without resource or stability upkeep.
2. **One-off hardcoded boosts** — wanderer midlife and romance-family multipliers prove the pattern but are not generalized.
3. **No unmet-pressure reporting** — achievements never expose neglected dimensions (followers, alliances, external threat).
4. **Achievement ID heterogeneity** — three storage locations without a shared maintenance contract.

## P17 Priority (achievement maintenance)

1. Profile `achievementMaintenancePatterns` with explicit dimensions.
2. `unmetPressure` report for gates and balancing.
3. Neglect increases risk-tag weighting in later-life selection.
4. At least three representative patterns (resource/leadership, social responsibility, decline-risk).

No gameplay changes in US-003.
