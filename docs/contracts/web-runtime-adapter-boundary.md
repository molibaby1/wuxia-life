# Web Runtime Adapter Boundary (P5 US-019)

## Production player path

The formal Web player path is:

```text
Vue UI (`App.vue`, `SaveSlotStartScreen.vue`, `GameScreen.vue`)
→ `useApiGameEngine`
→ `webApiClient`
→ Server API / `gameService`
→ `HeadlessEngineSessionImpl`
→ shared `GameEngineIntegration` and domain settlement
```

`VITE_P6B_API_URL` is required Web runtime configuration. If it is missing, the UI reports a configuration error. If the API is unavailable, the UI reports that failure. Neither case starts or recreates a browser Local game.

The UI renders server-owned session state and submits player choices, active actions, progression acknowledgements, and save requests. Event selection, phase resolution, settlement, and game-state persistence stay on the API / Headless path. Snapshot conversion continues to use the current canonical contract (`3.16.0`).

## Browser storage

`webPlatformStorage` stores the API device and session credentials needed by the client. It is not a player-save store. Browser save slots and session restoration are served by the API.

## Shared and simulation capabilities

- `GameEngineIntegration`, event execution, time progression, world/player state, feedback, `HeadlessEngineSessionImpl`, and `SnapshotConverter` remain shared formal capabilities.
- `SaveManager.ts` remains available to canonical persistence tests and simulation consumers; its former browser Local UI is retired.
- `GameProcessSimulator` with `local_direct` is a separate P8 simulation path, not the browser Local player runtime.
- Headless simulations and tests may run without a database. They do not create a second Web player mode.
