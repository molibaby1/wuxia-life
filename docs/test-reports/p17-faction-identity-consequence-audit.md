# P17 Faction And Social Identity Consequence Audit (US-002)

Read-only inventory of sustained faction and identity consequence sources.

## Scope

- Faction flags: `sect_faction`, `orthodox_member`, `unconventional_member`, route flags (`route_orthodox`, `route_demonic`, etc.)
- Identity: `state.identity`, `LifePathManager.primaryIdentity`, `IdentitySystem` bonuses
- Organization role signals from event content (`identity-official.json`, `orthodox.json`, `faction-revelation.json`)

## Surface Inventory

| Surface | Write path | Read path (sustained) | Classification | Collapse risk |
| --- | --- | --- | --- | --- |
| `flags.sect_faction` | `FlagSetHandler` (mutual exclusion) | Route labels, event expressions, `getDominantPaths` | **partially config-driven** | Faction gates events but no duty/exposure loop |
| Route flags `route_*` | Event effects, `RouteStateManager` | P11 scheduling, UI labels | **partially config-driven** | Reinforcement bias only; weak role-pressure |
| `state.identity.primary` | `IdentitySystem.determineIdentity` | Triggers, endings, bonuses | **runtime-bound** | Identity picked once; bonuses static |
| `lifePath.primaryIdentity` / `lifePath.faction` | `LifePathManager`, achievements | `canTriggerEvent` requirements | **legacy-compatible** | Parallel to `state.identity`; summary use |
| `IdentitySystem.IDENTITY_CONFIG` bonuses | Hardcoded TS | Event pools per identity | **runtime-bound** | Not profile-tunable |
| `IdentityCompatibility` transition text | Hardcoded TS | Transition preview only | **runtime-bound** | Text consequences, not scheduling |
| `WUXIA_PROFILE_IDENTITY_TRACKS` | Profile config | P12 readers, summary signals | **config-driven** | Descriptive; no sustained pressure |
| P11 route reinforcement | `routeDefinitions` + scheduling | Mid-life event boost | **partially config-driven** | Rewards route membership, weak duty cost |

## Collapse Patterns

1. **Prestige labels** — `sect_faction` and `route_orthodox` appear in UI and unlock event pools but do not create ongoing duty, exposure, or rivalry pressure after joining.
2. **Static identity bonuses** — `IdentitySystem` multipliers apply uniformly; no maintenance when reputation or political cost rises.
3. **Dual identity tracks** — `state.identity` vs `lifePath.primaryIdentity` without a single consequence resolver.
4. **Faction revelation events** — `faction-revelation.json` is episodic; no sustained organization-level obligation surface.

## P17 Priority (faction / identity)

1. Profile patterns for protection/access vs duty/exposure/rivalry.
2. Organization-level and social-status-level triggers in one schema.
3. Later-life selection reads patterns through `getWorldProfile()` — no scheduler rewrite.

No gameplay changes in US-002.
