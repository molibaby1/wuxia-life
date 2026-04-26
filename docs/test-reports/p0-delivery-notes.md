# P0 Delivery Notes

## US-012 - Choose the Single Main State Source

### Single main state source

- Decision: `gameEngine` (`src/core/GameEngineIntegration.ts`) and its `gameState` are the single main runtime state source for main gameplay flow.
- Scope: start, playing, event progression, ending, and restart paths should all read/write through `gameEngine`.

### Allowed read-only adapters

- `useNewGameEngine` (`src/composables/useNewGameEngine.ts`): allowed as a UI-facing adapter that coordinates actions and reads `gameEngine` state; it must not introduce a second business state model.
- `DebugPanel` (`src/components/DebugPanel.vue`): allowed for diagnostics/observation only.
- `SaveManager.vue` (`src/components/SaveManager.vue`): allowed to serialize snapshots from `gameEngine.getGameState()` for save/export flows.

### Deprecated entry points

- `useGameStore` / `gameStore` (`src/store/gameStore.ts`): deprecated for main flow state reads/writes.
- `useGameEngine` (`src/composables/useGameEngine.ts`): deprecated legacy composable path.
- `EndingScreen.vue` direct `useGameStore` usage (`src/components/EndingScreen.vue`): deprecated main-flow state entry and should be migrated to `gameEngine` model in follow-up stories.

### Migration guard for future stories

- New P0/P1 fixes touching main flow must treat `gameEngine.gameState` as source of truth.
- Legacy entry points above are retained only as transitional compatibility surfaces until migration stories complete.
