# P17 Relationship Consequence Surface Audit (US-001)

Read-only inventory of sustained relationship consequence sources across allies, enemies, mentors, kinship, and sworn ties.

## Scope

- `state.player.relationships[]` — affinity-based social graph (main-flow)
- `state.relations` — numeric relation index
- `state.lifePath.relationships.{allies,enemies,mentors,disciples}` — trajectory buckets (legacy-compatible)
- `state.lifePath.commitments.{mustProtect,swornEnemies,cannotJoin}` — obligation / feud carryover
- Relationship flags in `state.flags` / `state.player.flags` (e.g. `has_sworn_siblings`, `has_mentor`, `has_life_debt`)

## Surface Inventory

| Surface | Write path | Read path (sustained) | Classification | Collapse risk |
| --- | --- | --- | --- | --- |
| `player.relationships[]` | `RelationChangeHandler`, `applyGameState` | `GameScreen`, `ChoiceFeedbackGenerator`, `deriveLifeMemorySummary` | **partially config-driven** | Affinity shown in UI; rarely changes mid/late opportunity weights |
| `state.relations` | `RelationChangeHandler` | Subsequent relation deltas | **runtime-bound** | Numeric only; no profile tuning |
| `lifePath.relationships.*` | `LifepathAddRelationshipHandler`, `LifePathManager.addRelationship` | `LifePathManager.canTriggerEvent`, life-memory summary | **legacy-compatible** | Name lists without consequence intensity |
| `lifePath.commitments.mustProtect` | `LifepathCommitmentHandler`, achievements | `deriveLifeMemorySummary` debts, `canTriggerEvent` | **partially config-driven** | Summary debt labels; no scheduling weight |
| `lifePath.commitments.swornEnemies` | enemy add side-effect, achievements | `canTriggerEvent`, life-memory | **partially config-driven** | Listed in summary; feud pressure not weighted |
| `flags.has_sworn_siblings` | `relationship.json` events | Event conditions, life-memory | **content-only** | One-off event chain; no ongoing aid/shield weight |
| `flags.has_mentor` | `relationship.json` | Event conditions, life-memory | **content-only** | Mentor benefits end after mentor events |
| `flags.has_life_debt` | `relationship.json` | Debt return event, life-memory | **content-only** | Cleared on return; no entanglement loop |
| `relationship.json` event pack | JSON content | Per-event triggers/effects | **content-only** | Each bond is episodic; outcomes are stat bumps + flags |

## Collapse Patterns (summary-only / flavor)

1. **Label without weight** — `has_sworn_siblings`, `has_mentor` appear in life-memory and route labels but do not adjust formal-event selection after the triggering arc.
2. **Dual storage** — `player.relationships` vs `lifePath.relationships` vs flags; no unified consequence intensity.
3. **Commitment lists** — `mustProtect` / `swornEnemies` surface as debt entries in `deriveLifeMemorySummary` but never raise opportunity cost or feud risk in scheduling.
4. **Kinship** — spouse/children tracked on `player` fields; family events use romance-family scheduling boost (hardcoded in `GameEngineIntegration`) rather than profile consequence patterns.

## P17 Priority (relationship)

1. Profile-first consequence patterns keyed by flags + lifePath signals.
2. Theme-neutral later-life multiplier via world-profile path (age ≥ 25).
3. Explicit upside (support/shielding) and burden (obligation/feud) samples.
4. Visible unmet-pressure / active-pattern reporting for gates.

No gameplay changes in US-001.
