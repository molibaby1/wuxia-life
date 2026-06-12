# P7.2 Local Active Planning Inventory (US-001)

Read-only inventory of the local Web P7 active-planning path — reference flow for P7.2 server wiring.

## getNextEvent when selectEvent returns null

**Location:** `src/composables/useNewGameEngine.ts` — `getNextEvent()`

1. `gameEngine.selectEvent(age)` returns `null` (no formal/daily story event selected).
2. Branch calls `gameEngine.getAvailableActiveActions()`.
3. If `actions.length > 0`:
   - `engineState.currentEvent = null`
   - `engineState.availableChoices = []`
   - `engineState.availableActiveActions = actions`
   - `engineState.isActiveActionMode = true`
4. Else (no actions either):
   - `gameEngine.advanceTime(3, 'month')`
   - Recursive `getNextEvent()` — time catch-up until an event or planning actions appear.

## getAvailableActiveActions and buildActiveActionChoices

| Piece | Location | Role |
| --- | --- | --- |
| `getAvailableActiveActions()` | `src/core/GameEngineIntegration.ts` | Resolves `resolveChildhoodActionPalette` by age/flags, then `buildActiveActionChoices` |
| `buildActiveActionChoices` | `src/core/activePlanning/ActivePlanningService.ts` | Maps `ActiveActionDefinition[]` → UI choice rows (`actionId`, `text`, `rewardSummary`, `costSummary`, `riskLevel`, …) |
| Minimum catalog | `src/data/activeActionCatalog.ts` | P7 minimum action ids (`action_training_basic`, `action_study_basic`, `action_socializing_basic`, …) |

## executeActiveAction, summary, disturbance, return-to-planning

| Step | Location | Behavior |
| --- | --- | --- |
| `handleActiveAction` | `useNewGameEngine.ts` | Calls `gameEngine.executeActiveAction(actionId)`; sets `lastActiveActionSummary`, `pendingDisturbanceNarrative`, clears `isActiveActionMode` |
| `executeActiveAction` | `GameEngineIntegration.ts` | Delegates to `executeActiveActionOnState` with session RNG |
| Core mutation | `ActivePlanningService.executeActiveActionOnState` | Stats, time, `actionHistory` (`sourceKind: active_action`), optional disturbance history |
| Summary card | `buildActiveActionSummaryDisplay` | `engineState.lastActiveActionSummary` |
| Disturbance card | `buildDisturbanceNarrativeDisplay` | `engineState.pendingDisturbanceNarrative`; shown after summary ack via `showingDisturbanceNarrative` |
| Continue / ack | `continueProgressionFlow` | Summary ack → disturbance view (`markDisturbanceNarrativeShown`) → `clearProgressionPresentation` → `getNextEvent()` |

## Key file paths

| Concern | Path |
| --- | --- |
| Local composable | `src/composables/useNewGameEngine.ts` |
| Engine integration | `src/core/GameEngineIntegration.ts` |
| Active planning service | `src/core/activePlanning/ActivePlanningService.ts` |
| UI routing | `src/App.vue` (`currentNode`, `availableChoices`, `onChoice`) |
| Presentation | `src/components/GameScreen.vue` (summary/disturbance cards, continue button) |

No business code modified in this story.
