# US-003 Structured Choice Feedback Model

## Goal

Define a unified feedback model for post-choice results so players can understand:

- what happened (narrative result)
- what changed (stat/relationship/route impacts)
- what future consequences were opened (long-term flags and risk hints)

This story only defines model and fallback contract. It does not change main-flow rendering behavior yet.

## Model Definition

Primary type source:

- `src/types/choiceFeedback.ts`

Core model: `ChoiceFeedbackModel`

- `player`: fields that can be shown directly in UI
- `diagnostic`: test/log-only fields for debugging and regression checks

### Player-Facing Fields

- `narrativeResult`: final narrative sentence shown after choice execution
- `statImpacts[]`: structured stat deltas
- `relationshipImpacts[]`: structured relationship deltas
- `routeImpact`: route/identity path transition snapshot (or `null`)
- `longTermFlags[]`: future-affecting flags that can be surfaced to players
- `riskHints[]`: uncertainty/risk hints with severity (`low` / `medium` / `high`)

### Diagnostic-Only Fields

- `fallbackUsed`: whether fallback narrative was used
- `fallbackReason`: fallback reason code (currently `missing_narrative_result`)
- `sourceEventId` / `sourceChoiceId` / `sourceOutcomeId`: source traceability
- `rawEffects[]`: raw effect payload reserved for tests/logging

## Fallback Behavior

Fallback entry: `createChoiceFeedbackFallback(...)`

Fallback rules:

1. If `narrativeResult` is missing or blank, use default narrative:
   - `你的选择激起了涟漪，后续影响仍在发酵。`
2. If fallback is used, set:
   - `diagnostic.fallbackUsed = true`
   - `diagnostic.fallbackReason = "missing_narrative_result"`
3. Non-narrative sections default to empty structures for safe rendering:
   - `statImpacts = []`
   - `relationshipImpacts = []`
   - `routeImpact = null`
   - `longTermFlags = []`
   - `riskHints = []`
4. Preserve source trace and `rawEffects` when available for test/log diagnostics.

## Why This Shape

- Keeps a strict boundary between player copy and engineering diagnostics.
- Supports upcoming generator story (`US-004`) without forcing UI coupling now.
- Makes fallback deterministic and testable before display integration (`US-005` / `US-006`).
