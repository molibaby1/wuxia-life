# P21 Workflow Pain Points Audit (US-002)

Read-only analysis of content authoring friction across authoring, validation, and regression checking.

## Pain Point Inventory

| ID | Pain point | Phase | Root cause |
| --- | --- | --- | --- |
| PP-01 | Dual-track event assets — JSON runtime vs deferred/orphan TS | Authoring | Missing unified asset registry beyond `event-asset-manifest.json` |
| PP-02 | Echo requires 4 coordinated edits (hook, action, callback event, route) | Authoring | Hidden field semantics, no single authoring contract |
| PP-03 | `narrativeScheduling` undeclared on most events | Validation | Sparse metadata → P11 gate cannot verify route/stage fit |
| PP-04 | New line file needs `EventLoader.ts` lineMap edit | Authoring | Non-declarative loader wiring |
| PP-05 | Scheduling multipliers partially hardcoded in `GameEngineIntegration` | Tuning | Runtime knowledge required for wanderer/romance boosts |
| PP-06 | Shallow vs deep validation split (`EventLoader` vs `validateEventQuality`) | Validation | No unified production matrix |
| PP-07 | Legacy/mixed effect formats in event JSON | Authoring | LLM edits risk invalid semantics |
| PP-08 | Profile gate and event quality gate run separately | Regression | Impressionistic sign-off for content additions |
| PP-09 | Tuning changes require reading P11/P20 runtime to predict effect | Tuning | Implicit tuning metadata |
| PP-10 | No bounded LLM I/O contract for content or weight changes | Authoring/Tuning | Ad hoc prompt → patch workflow |

## Root Cause Categories

### Hidden field semantics (PP-02, PP-03, PP-07, PP-09)

- Echo `hookFlag` naming convention undocumented in schema.
- `metadata.narrativeScheduling.routePoints` shape known only from P11 validation samples.
- Effect `target` vs legacy paths distinguished only at validation time.

### Runtime knowledge (PP-04, PP-05, PP-09)

- EventLoader lineMap is code, not config manifest.
- Composite scheduling multiplier stack spans P11–P20 modules.
- Archetype pacing effective only after `getWholeLifePacingMultiplier` composition.

### Missing reports (PP-06, PP-08, PP-10)

- No machine-readable style/fit/duplicate-risk findings for new content.
- No before/after tuning comparison tied to production workflow.
- LLM outputs validated only by manual review or generic event quality gate.

## Highest-Cost Friction (P21 fix order)

1. **Echo/callback coupling** — blocks safe LLM-assisted content additions.
2. **Implicit tuning metadata** — blocks config-only distribution rebalancing.
3. **Validation fragmentation** — blocks systematic production sign-off.

## Deferred Beyond P21 (not in scope)

- Full declarative EventLoader (auto-discover all `lines/*.json`).
- UI authoring tools or in-game content editor.
- New themes, new route families, or engine rewrite.
- Promoting all 39 deferred JSON packs to runtime (tracked but not bulk-migrated).

No gameplay changes in US-002.
