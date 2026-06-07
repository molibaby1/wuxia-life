# P9 World Profile Boundary Note

## Purpose

Define a world-agnostic profile structure for future cross-theme reuse while documenting how the current wuxia slice maps onto it.

## World Profile Structure

```typescript
interface WorldProfile {
  id: string;
  label: string;
  stats: StatDefinition[];
  resources: ResourceDefinition[];
  identityTracks: IdentityTrack[];
  actions: ActionCatalogRef;
  goals: GoalTemplate[];
  summarySignals: SummarySignalConfig;
  stageConfig: LifeStageConfig[];
  routeDefinitions: RouteDefinition[];
  echoHooks: EchoHook[];
  summaryTemplates: SummaryTemplatePart[];
}
```

### Fields

| Field | Purpose |
|-------|---------|
| `stats` | Player attributes (martialPower, knowledge, charisma, …) |
| `resources` | Money, energy, connections treated as spendable/accumulable |
| `identityTracks` | Named life paths (merchant, wanderer, martial, scholar, …) |
| `actions` | Reference to active action catalog |
| `goals` | Age-banded achievement templates with evidence specs |
| `summarySignals` | Flags and templates that compose the three-part life summary |
| `stageConfig` | 0–40 (or theme-specific) pacing expectations |
| `routeDefinitions` | Entry → reinforcement → divergence → identity signal chains |
| `echoHooks` | Early action/choice → later callback mappings |
| `summaryTemplates` | World-specific wording for early/turning/identity slots |

## Wuxia Mapping

| World profile field | Wuxia implementation |
|---------------------|----------------------|
| stats | `GameState.player` martial/knowledge/social stats |
| resources | money, energy, connections, reputation |
| identityTracks | IdentitySystem primaries + P9 route flags |
| actions | `src/data/activeActionCatalog.ts` (5 minimum actions) |
| goals | `src/p8/personas.ts` shortTermGoals per persona |
| summarySignals | `p9_route_identity_*`, `p9_summary_echo_*` flags |
| stageConfig | `src/narrative/config/stageConfig.ts` WUXIA_STAGE_CONFIG |
| routeDefinitions | `src/narrative/config/routeDefinitions.ts` |
| echoHooks | `src/narrative/config/echoHooks.ts` |
| summaryTemplates | `src/narrative/config/summaryTemplates.ts` |

## Hypothetical Alternate Themes

### Football Career

- **stats:** stamina, technique, teamwork, fame
- **identityTracks:** striker, midfielder, coach, agent
- **actions:** training, match, transfer_negotiation, media
- **stageConfig:** youth academy (0–18), pro debut (18–25), peak (25–32), legacy (32–40)
- **echoHooks:** youth trial → senior squad callback

### Modern Business Career

- **stats:** negotiation, analytics, leadership, network
- **identityTracks:** founder, executive, investor, consultant
- **actions:** study, networking, side_project, fundraising
- **stageConfig:** education (0–22), early career (22–30), mid-career (30–40)
- **echoHooks:** first internship → promotion narrative

## Boundaries (not in scope)

- No alternate theme runtime implementation in P9
- No world-switching UI
- Wuxia remains the only validated world pack

## Runtime Boundary

Code layer: state progression, condition evaluation, action settlement, echo interpreter, summary framework, playability gate.

Config layer: world profile bundles stage/route/echo/summary definitions per theme.

Adding a new theme should require a new world profile config bundle, not changes to core engine flow.
