# P12 Wuxia Profile Boundary Inventory

Generated for US-001. Read-only snapshot of wuxia-owned runtime surfaces before P12 formalization.

## Stats

| Stat keys | Source | Profile-like? |
|-----------|--------|---------------|
| martialPower, externalSkill, internalSkill, qinggong, constitution | `src/data/attributeMeanings.ts`, player state in `src/types/eventTypes.ts` | Scattered — meanings catalog, not world pack |
| comprehension, charisma, connections, reputation, chivalry, knowledge | `src/data/attributeMeanings.ts` | Scattered |
| money, energy, businessAcumen | action rewards/costs in `src/data/activeActionCatalog.ts`, player state | Scattered |

**Scheduling-relevant stats:** martialPower, money, knowledge (`src/p11/signalDetection.ts`).

**Bypass WUXIA_WORLD_PROFILE:** all stat reads use player state + attributeMeanings; no profile path pre-P12.

## Resources

| Resource | Source | Profile-like? |
|----------|--------|---------------|
| money | player state, action costs | Scattered |
| energy | action costs in activeActionCatalog | Scattered |
| connections | player stat used as social resource | Scattered |

**Bypass WUXIA_WORLD_PROFILE:** resource semantics implied by gameplay code, not profile.

## Identity tracks

| Tracks | Source | Profile-like? |
|--------|--------|---------------|
| merchant, wanderer, martial, deviant, scholar, social, cautious, balanced | `src/narrative/worldProfile.ts` (partial), `src/narrative/config/routeDefinitions.ts` | Partial — tracks in profile, resolution in routeDefinitions |

**Bypass WUXIA_WORLD_PROFILE:** `getRouteIdentityFromFlags` in routeDefinitions.ts read const directly pre-P12 migration.

## Action families

| Families | Source | Profile-like? |
|----------|--------|---------------|
| training, study, socializing, business, travel | `src/data/activeActionCatalog.ts`, `P7_MINIMUM_ACTION_IDS` | Scattered |

**Bypass WUXIA_WORLD_PROFILE:** `getMinimumActions()` read catalog filter only.

## Summary signals

| Signals | Source | Profile-like? |
|---------|--------|---------------|
| origin, route_identity, route_preference, echo_suffix | `src/narrative/worldProfile.ts` (partial), echo hooks in `src/narrative/config/echoHooks.ts` | Partial |

**Bypass WUXIA_WORLD_PROFILE:** echo hook lookup used direct const pre-P12.

## Narrative config entrypoints

| Section | Source file | Profile-like? |
|---------|-------------|---------------|
| stageConfig | `src/narrative/config/stageConfig.ts` | Attached via WUXIA_WORLD_PROFILE assembly |
| routeDefinitions | `src/narrative/config/routeDefinitions.ts` | Attached via profile; helpers bypassed profile |
| echoHooks | `src/narrative/config/echoHooks.ts` | Attached via profile; lookup bypassed profile |
| summaryTemplates | `src/narrative/config/summaryTemplates.ts` | Attached via profile |
| Loader | `src/narrative/NarrativeConfigLoader.ts` | Mixed — age40 identity via profile, stage/route helpers scattered |

## P10/P11 readers (pre-P12)

| Reader | File | Bypassed profile? |
|--------|------|-------------------|
| Age-40 identity + echo summary | `NarrativeConfigLoader.resolveConfiguredAge40Identity` | Partial (profile echo/route, route helper direct) |
| Stage purpose/feedback | `NarrativeConfigLoader.getStagePurposeForAge` | No — used profile.stageConfig |
| P11 scheduling context routes | `src/p11/schedulingContext.ts` | Yes — `WUXIA_ROUTE_DEFINITIONS` direct |
| P11 report route baseline | `src/p11/reportBuilder.ts` | Yes — direct const |
| P11 stage baseline | `getAllStageConfigs()` | Indirect — same data as profile.stageConfig |

## Migration targets (P12 scope)

1. Formalize stats, resources, actionFamilies, summarySignals in profile schema.
2. Route P10 identity, P11 scheduling, minimum actions through profile-first APIs.
3. Add P12 verification gate with reader registry and negative missing-section probes.
