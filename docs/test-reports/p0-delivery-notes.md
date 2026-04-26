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

- `useGameStore` / `gameStore` (`src/store/gameStore.ts`): deprecated and retained only for historical compatibility/demo paths; do not wire into main flow.
- `useGameEngine` (`src/composables/useGameEngine.ts`): deprecated legacy composable retained only for historical compatibility/demo paths.

### Migration guard for future stories

- New P0/P1 fixes touching main flow must treat `gameEngine.gameState` as source of truth.
- Legacy entry points above are isolated compatibility surfaces and must remain outside main gameplay flow.

## US-016 - Close P0 with Fresh Verification Evidence

### Changed files

- `docs/test-reports/p0-delivery-notes.md`
- `docs/PRD/p0-core-experience-remediation.prd.json`
- `progress.txt`

### Fresh verification results

- `npm run typecheck` ✅
- `npm run build` ✅
- `npm test` ✅

### Residual risks

- `testGameSimulation` output still reports repeated injury/family trajectories and "事件总数偏多" as warning-level balancing signal; this does not block P0 closure but can affect long-session narrative diversity.
- P0 regression gates are green, but P1 content expansion could reintroduce repetition pressure without continuing to track the established repetition metrics and thresholds.

### Follow-up recommendations

- In P1, prioritize narrative balancing for high-frequency event classes using the existing reproduction/metrics scripts to keep warning trends observable.
- Keep release gates strict (`typecheck + build + test`) and preserve warning-hygiene review in delivery notes for each future milestone.
