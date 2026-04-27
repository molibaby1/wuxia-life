# US-017 Save State Shape Inventory

## Scope and method

- Scope: only inventory the current save/load shape; no runtime/business code changes.
- Sources inspected:
  - `src/core/SaveManager.ts`
  - `src/types/eventTypes.ts` (`GameState` / `PlayerState`)
  - `src/core/GameEngineIntegration.ts`
  - `src/composables/useNewGameEngine.ts`
  - `src/components/SaveManager.vue`
  - `src/components/MainDemo.vue`

## Current persistence pipeline

- Save write entry: `SaveManager.saveGame(gameState, name)` and `SaveManager.autoSave(gameState)`.
- Persisted payload:
  - Manual list key: `wuxia_life_saves` -> `SaveData[]`
  - Auto-save key: `wuxia_life_auto_save` -> `SaveData`
  - `SaveData.gameData` stores the full runtime `GameState` object passed in.
- Load read entry:
  - `SaveManager.loadGame(saveId)` / `loadAutoSave()` return `SaveData`.
  - UI component emits `gameLoaded` with `save.gameData`.
- Main flow restoration status:
  - `MainDemo.vue` has `loadGameFromSave(gameState)` placeholder and does not apply state back into `gameEngine`.
  - `GameEngineIntegration` has no public "hydrate from saved GameState" entry.

## Field inventory by category

### 1) Player state

- Saved fields:
  - `gameData.player` (entire `PlayerState` object currently in memory).
- Loaded fields:
  - Raw payload is read and emitted (`save.gameData.player`), but not hydrated into engine state in main flow.
- Missing or non-persistent concerns:
  - No schema-level validation before using loaded payload.
  - No explicit migration/default fill for optional player fields.

### 2) Current event state

- Saved fields:
  - Not in `GameState` schema. Current UI/composable state lives in `useNewGameEngine` `engineState.currentEvent` / `availableChoices` / `lastEffects` / `lastOutcomeText` / `lastChoiceFeedback`.
- Loaded fields:
  - Not loaded/restored.
- Missing fields:
  - Current event pointer and pending choices are absent from persisted `GameState`.

### 3) Event history state

- Saved fields:
  - `gameData.eventHistory`
  - `gameData.events` (legacy/compat path)
  - `gameData.triggeredEvents` (optional)
  - `gameData.player.events` (legacy/compat path)
- Loaded fields:
  - Present in payload read path; not applied into active engine state in main flow.
- Missing fields:
  - None at storage layer (fields exist), but load application is missing.

### 4) Route state

- Saved fields:
  - `gameData.routeStates`
  - `gameData.routeHistory`
  - Also route-related flags in `gameData.flags` and `gameData.player.flags`.
- Loaded fields:
  - Present in payload read path; not applied into active engine state in main flow.
- Missing fields:
  - None obvious at shape level; integration restore is missing.

### 5) Identity state

- Saved fields:
  - `gameData.identity`
  - `gameData.lifePath.primaryIdentity`
  - Related flags in `gameData.flags` / `gameData.player.flags`.
- Loaded fields:
  - Present in payload read path; not applied into active engine state in main flow.
- Missing fields:
  - None obvious at shape level; integration restore is missing.

### 6) Relationship state

- Saved fields:
  - `gameData.player.relationships`
  - `gameData.relations`
  - `gameData.lifePath.relationships`
- Loaded fields:
  - Present in payload read path; not applied into active engine state in main flow.
- Missing fields:
  - None obvious at shape level; integration restore is missing.

### 7) Ending state

- Saved fields:
  - `gameData.ending` (optional, untyped `unknown`)
  - `gameData.player.alive`, `gameData.player.deathReason`, and ending-related flags may also carry ending context.
- Loaded fields:
  - Present in payload read path; not applied into active engine state in main flow.
- Missing fields:
  - No strict ending schema (`ending?: unknown`) means compatibility risk.

### 8) Time state

- Saved fields:
  - `gameData.currentTime` (`year/month/day`)
  - `gameData.player.age`
  - Optional metadata fields `gameData.gameTimestamp`, `gameData.lastSavedAt`
- Loaded fields:
  - Present in payload read path; not applied into active engine state in main flow.
- Missing fields:
  - Engine internal pacing/runtime counters are not part of persisted shape:
    - `GameEngineIntegration.eventsThisYear`
    - `GameEngineIntegration.lastYear`
    - `GameEngineIntegration.annualEventPressure`
    - `GameEngineIntegration.eventCooldown`
    - `GameEngineIntegration.activeStoryLines`
    - `GameEngineIntegration.pendingEventOutcomeNote`

## Version fields inventory

- Present:
  - `GameState.saveVersion?: string` (type-level field, currently not set in save path)
  - `exportSave()` wraps output with `version: '1.0'`
- Missing:
  - No version assignment in `saveGame()` / `autoSave()` to `gameData.saveVersion`
  - No compatibility gate in `loadGame()` / `loadAutoSave()` based on version
  - No migration or rejection policy for unsupported save versions

## Derived fields inventory

Derived fields (computed at save time, not primary game state):

- `SaveData.metadata.playerAge` <- `gameState.player.age` (fallback `0`)
- `SaveData.metadata.playerName` <- `gameState.player.name` (fallback `未知`)
- `SaveData.metadata.eventCount` <- `gameState.player.events.length` (fallback `0`)
- `SaveData.metadata.playTime` <- `calculatePlayTime(gameState)` (current heuristic: `eventCount * 30` seconds)
- `SaveData.id` <- generated (`save_<timestamp>_<random>`)
- `SaveData.timestamp` <- `Date.now()`
- `exportSave().exportTime` <- `Date.now()`

## Missing fields summary (for main-flow wiring readiness)

- Missing from persisted shape:
  - Current in-progress UI/composable event state (`currentEvent`, pending `availableChoices`, `lastEffects`, `lastOutcomeText`, `lastChoiceFeedback`).
  - Engine internal runtime counters/maps used for pacing and suppression.
- Missing from load behavior:
  - Main-flow hydration path from loaded `GameState` back into `gameEngine`.
  - Version-aware compatibility handling and migration boundary checks.

## Conclusion

- Storage layer currently persists broad `GameState` payload plus derived save metadata, and can read it back.
- The key gap before "main flow save/load" is not raw storage, but restore/hydration semantics and versioned compatibility boundaries.
