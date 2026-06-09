# P21 Content Authoring Surface Audit (US-001)

Read-only inventory of wuxia content production and tuning surfaces before P21 formalization.

## Audit Dimensions

| Surface | Primary paths | Classification |
| --- | --- | --- |
| Events | `src/types/eventTypes.ts`, `src/data/lines/*.json`, `src/core/EventLoader.ts` | **config-driven** (content) + **partial** (loader wiring) |
| Callbacks / echoes | `src/narrative/config/echoHooks.ts`, `src/data/activeActionCatalog.ts`, callback events in `p9-remediation.json` | **partial** — four-file coupling |
| Summaries | `src/narrative/config/summaryTemplates.ts`, `src/narrative/profile/wuxiaSummarySignals.ts` | **config-driven** |
| Route weighting | `src/narrative/config/routeDefinitions.ts`, `metadata.pathAffinity`, `src/p11/schedulingPolicy.ts` | **partial** — constants in runtime |
| Stage pacing | `src/narrative/config/stageConfig.ts`, `wuxiaReplayabilitySurfaces.ts` pacing profiles | **config-driven** (profile) + **runtime-bound** (multipliers) |
| Legacy / endgame | `wuxiaLegacySurfaces.ts`, `wuxiaEndgameSurfaces.ts`, `elderly-legacy.json` | **partial** |
| Replayability tuning | `wuxiaReplayabilitySurfaces.ts`, `src/p20/*` | **partial** |

## Per-Surface Detail

### Events

- **Schema**: `EventDefinition` in `eventTypes.ts` — ageRange, conditions, metadata.narrativeScheduling, pathAffinity.
- **Runtime pool**: 21 JSON line files via `events.json` imports (234 events loaded).
- **Deferred**: ~39 `lines/*.json` files and orphan TS event modules not wired to EventLoader.
- **Validation**: shallow `EventLoader.validateEvents()` vs deep `validateEventQuality` (`scripts/validateEventQuality.ts`).
- **narrativeScheduling coverage**: sparse — mainly `p9-remediation.json` and `p11-validation.json`.

### Callbacks

- **Chain**: `activeAction.onCompleteFlags` → `echoHooks.hookFlag` → callback event `conditions` → normal pool selection.
- **No standalone callback scheduler** — echo is implicit through flag conditions.
- **Summary bridge**: `NarrativeConfigLoader.resolveConfiguredEchoSummaryVars`.

### Summaries

- Three slots: `early_life`, `turning_point`, `age40_identity`.
- Route-matched templates + echo variable injection.
- P19 adds `finalSummaryComposition` for endgame layers.

### Route weighting

- Route definitions declare entry/reinforcement/divergence/identity signals.
- P11 multipliers: `STAGE_BIAS=2.2`, `ROUTE_REINFORCEMENT=2.5`, `ROUTE_DIVERGENCE=2.8`.
- `GameEngineIntegration.getRouteSchedulingMultiplier` composes P11–P20 + hardcoded romance/wanderer lists.

### Stage pacing

- Four stages 0–40 in `stageConfig.ts`.
- P20 `archetypePacingProfiles` per-family density/payoff/callback cadence.
- `getWholeLifePacingMultiplier` reads profile at runtime.

### Legacy / endgame

- P18: successor roles, inheritance channels, cultivation costs, legacy outcomes.
- P19: endgame categories, pre-endgame recovery, historical memory patterns.
- Content in `elderly-legacy.json` plus P18/P19 validation slices.

### Replayability tuning

- P20: archetype families, repetition pressure, pacing profiles, replay slices.
- Tuning levers are profile-first but selection logic lives in `src/p20/*`.

## Classification Summary

| Classification | Surfaces |
| --- | --- |
| **config-driven** | summaryTemplates, routeDefinitions (signals), stageConfig, profile surfaces P16–P20, event JSON content |
| **partially config-driven** | echoHooks, events (metadata bridge), route weighting (pathAffinity + runtime multipliers), legacy/endgame |
| **runtime-bound** | EventLoader lineMap, GameEngineIntegration scheduling composition, P11/P16–P20 selector modules |

## P21 Priority Targets

1. Unify implicit echo/callback authoring semantics (US-007, US-008).
2. Make tuning metadata explicit for config-only distribution changes (US-009).
3. Add style/fit/duplicate constraint surfaces consumable by reports (US-010–US-012).
4. Establish bounded LLM content/tuning loops with validation evidence (US-013–US-016).

No gameplay changes in US-001.
