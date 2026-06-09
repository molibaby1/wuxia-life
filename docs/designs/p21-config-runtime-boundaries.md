# P21 Config-Only And Deferred-Scope Boundaries (US-006)

Explicit boundaries for config-only work versus runtime work in P21.

## Safe Through Config / Content Files Alone

| Change | Surfaces |
| --- | --- |
| New events / choices / effects | `src/data/lines/*.json` |
| Echo/callback pairs | `echoHooks.ts`, `activeActionCatalog.ts`, callback event JSON |
| Summary template text | `summaryTemplates.ts` |
| Route signal declarations | `routeDefinitions.ts`, event `metadata.narrativeScheduling` |
| Route affinity / event weight | event `weight`, `metadata.pathAffinity` |
| Stage pacing density | `archetypePacingProfiles` in replayability surfaces |
| Repetition / novelty tuning | `repetitionPressureConfigs` |
| Archetype coverage weights | `archetypeFamilyConfigs.baseWeight` |
| Style/fit/duplicate constraints | `wuxiaContentProductionSurfaces.ts` |
| Legacy/endgame content | `elderly-legacy.json`, P18/P19 profile patterns |

## Requires Minimal Runtime Support

| Change | Why | P21 approach |
| --- | --- | --- |
| New event line file import | EventLoader lineMap | Add import + lineMap entry (bounded, no engine rewrite) |
| Constraint evaluation in reports | No existing consumer | `src/p21/constraintEvaluation.ts` (thin reader) |
| LLM contract validation | No existing path | `src/p21/contentValidation.ts`, `tuningValidation.ts` |
| Production matrix output | New report type | `src/p21/productionMatrix.ts` + `runP21Gate.ts` |
| Authoring schema types | Implicit fields | `authoringSchema.ts` + optional `authoringSemantics` on events |

## Explicitly Deferred Beyond P21

- Full auto-discovery EventLoader (eliminate lineMap).
- In-game or web UI content editor.
- New playable themes or route families.
- Large `GameEngineIntegration` refactor to remove hardcoded multipliers.
- Bulk promotion of 39 deferred JSON event packs.
- Real-time LLM API integration in runtime (contracts only, not live calls).
- Save schema changes for content metadata.

## Expansion Guard

P21 stories must not add features outside content production, tuning closure, validation, and bounded samples. Any runtime edit must trace to a US-007–US-016 acceptance criterion.
