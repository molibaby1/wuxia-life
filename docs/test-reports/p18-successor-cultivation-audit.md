# P18 Successor Cultivation Surface Audit (US-001)

Read-only inventory of disciple, offspring, heir, adopted-successor, and inheriting-student cultivation surfaces.

## Scope

- `state.lifePath.relationships.disciples[]` — named disciple bucket
- `state.player.children` — offspring count
- `state.player.flags` / `state.flags` — cultivation outcome flags (`child_martial_artist`, `master_legacy`, `has_child`, etc.)
- Content packs: `inheritance.json`, `elderly-legacy.json`, `follower.json`, `relationship.json`, `identity-sect_leader.json`
- `deriveLifeMemorySummary` — legacy labels for disciples/family
- P17 `lifePathSignal: disciple` — counts disciples but does not model cultivation quality

## Surface Inventory

| Surface | Write path | Read path (sustained) | Classification | Collapse risk |
| --- | --- | --- | --- | --- |
| `lifePath.relationships.disciples` | `LifepathAddRelationshipHandler`, `LifePathManager` | `canTriggerEvent`, life-memory, P17 disciple signal | **partially config-driven** | Name list only; no quality/capacity/loyalty |
| `player.children` | `inheritance.json`, family events | Event conditions, life-memory | **content-only** | Count gate; no per-child cultivation state |
| `child_martial_artist` / `child_scholar` / `child_merchant` flags | `inheritance_child_education` | Event conditions, summary | **content-only** | One-shot education choice; no late-life succession weight |
| `master_legacy` flag | `relationship_master_legacy` | Summary, occasional triggers | **content-only** | Sets flag; no downstream opportunity/risk loop |
| `elderly-legacy.json` events | JSON content | Per-event stat bumps | **content-only** | “口传心授” choice has empty effects |
| `follower.json` / sect leader disciple events | JSON content | Episodic recruitment | **content-only** | Disciple acquisition without sustained cultivation model |
| `martialHeritage` / `scholarlyHeritage` / `merchantNetwork` player stats | rare stat_modify | Display only | **runtime-bound** | Heritage stats not wired to successor outcomes |
| P17 `P17_RELATIONSHIP_KINSHIP_DUTY` | profile | Later-life multiplier (family tags) | **partially config-driven** | Kinship obligation without successor quality |

## Collapse Patterns (summary-only / flavor)

1. **Empty cultivation choice** — `elderly_organize_martial` “口传心授” applies no effects; transmission is narrative-only.
2. **Flag without intensity** — `master_legacy`, `child_martial_artist` appear in memory/summary but do not alter late-life scheduling.
3. **Disciple list without quality** — `lifePath.relationships.disciples` enables P17 disciple signal but not capacity, loyalty, or instability.
4. **Heritage stats orphaned** — `martialHeritage` etc. are written in a few events but never read for succession evaluation.
5. **No cultivation cost** — Teaching disciples or educating children has no tradeoff against protagonist late-life opportunity space.

## P18 Priority (successor cultivation)

1. Profile-first successor role configs keyed by flags + lifePath signals.
2. Cultivation cost/pressure patterns with inspectable unmet-pressure output.
3. Theme-neutral later-life legacy multiplier (age ≥ 25) alongside P17 consequences.
4. Representative samples for transmission success, underinvestment, rupture.

No gameplay changes in US-001.
