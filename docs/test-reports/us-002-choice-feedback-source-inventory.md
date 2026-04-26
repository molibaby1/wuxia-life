# US-002 Choice Feedback Source Inventory

## Scope

Inventory target fields from P2 `US-002`:

- choice events
- outcomes
- effects
- `lastOutcomeText`
- event history
- relationships
- route changes

No business/runtime code changes are included in this story.

## Feedback Source Inventory

| Feedback target | Primary source | Read/Write path | Classification | Notes |
| --- | --- | --- | --- | --- |
| Choice events | Event data `eventType: "choice"` + `choices[]` | Read in `src/composables/useNewGameEngine.ts` (`getNextEvent`, `handleChoice`) from `gameEngine.selectEvent` selected event | immediate | Main player interaction entry in current flow |
| Outcome branches | `choice.outcomes[]` (`text`, `condition`, `effects`) | Evaluated in `useNewGameEngine.evaluateOutcomeCondition` and picked in `handleChoice` | immediate | First matched outcome wins, fallback to `choice.effects` |
| Effect payloads | `choice.effects[]` or `outcome.effects[]` | Executed by `gameEngine.executeChoiceEffects` -> `EventExecutor.executeEffects` | immediate | Immediate state mutation source |
| Narrative feedback text | `outcome.text` -> `choice.description` -> generated text from effects | Written to `engineState.lastOutcomeText` in `handleChoice`; displayed in `src/components/GameScreen.vue` | immediate | Player-facing text priority chain is explicit |
| Event history records | `gameState.eventHistory[]` (`eventId`, `age`, `triggeredAt`) | Written in `GameEngineIntegration.executeChoiceEffects` / `executeAutoEvent`; read by selection guards and `EventHistory` UI | long-term + diagnostic | Used for gameplay gating and also debug/trace display |
| Relationship values | `relation_change` effects into `state.relations` and `player.relationships[]` | Written in `EventExecutor.RelationChangeHandler`; displayed in `GameScreen` relation list | immediate + long-term | Immediate UI value update and persisted relationship progression |
| Route display state | `flags.sect_faction` (plus legacy route flags) | Set by `flag_set` effects via `FlagSetHandler`; read in `GameScreen.routeLabel` | immediate + long-term | Current main-flow route label relies on flags |
| Route weight/availability influence | Dominant path inference from flags/stats + `metadata.pathAffinity/pathConflicts` | Read in `GameEngineIntegration.getDominantPaths` / `isPathConflicting` / `adjustWeightByPath` | hidden | Influences future event pool and weights, not directly shown to player |
| LifePath route/faction state | `lifePath.faction` and lifePath relationship structures | Written by `set_faction` / lifepath handlers in `EventExecutor`; currently weakly surfaced in main UI | hidden + diagnostic | Structured long-term route state exists but is not primary UI route source |

## Classification Summary

### Immediate

- Choice selection (`choices[]`)
- Outcome branch result (`outcomes[]`)
- Executed effects (`effects[]`)
- `lastOutcomeText` rendering
- Relationship list value updates
- Route label updates from flags

### Long-term

- `eventHistory` persistence and reuse for gating (`once`, cooldown, max trigger, storyline continuity)
- Relationship accumulation (`relations` and `player.relationships`)
- Route-related flags and lifePath faction/commitments influencing subsequent content

### Hidden

- Path compatibility/conflict weighting (`metadata.pathAffinity/pathConflicts`)
- Dominant-path inference from hidden flags/stat thresholds
- Formal-event friction note (`pendingEventOutcomeNote`) affecting narrative nuance without current main-flow render

### Diagnostic

- `EventHistory` panel (`src/components/EventHistory.vue`) for event trace
- Console warnings around unavailable choices/outcomes and condition failures in `useNewGameEngine`
- Internal records (`eventHistory`, `relations`, lifePath structures) that are richer than current player-facing feedback

## Current Feedback Gaps

1. Route change explainability gap:
   - UI shows route label derived from flags, but does not explain which exact choice/effect caused route transition.

2. Relationship causality gap:
   - UI shows resulting affinity numbers, but no direct “which choice changed this relationship and by how much” trace in main flow.

3. Outcome confidence/uncertainty gap:
   - No explicit signal for branch certainty/risk hints (for example: hidden consequence probability or delayed trigger risk).

4. Hidden long-term consequence visibility gap:
   - Path affinity/conflict and lifePath commitments influence future selection, but current gameplay feedback does not expose these as “future route impact”.

5. Partial-outcome note surface gap:
   - `GameEngineIntegration.consumeLastEventOutcomeNote()` exists, but current main flow does not consume/render this note to players.

6. Unified feedback object gap:
   - Feedback is currently split across text (`lastOutcomeText`), effects (`lastEffects`), route label, and relationship state; there is no single structured feedback payload yet (planned by later P2 stories).

