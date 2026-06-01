# Web Runtime Adapter Boundary (P5 US-019)

## Current Web composable responsibilities (`useNewGameEngine`)

| Concern | Owner today | Notes |
| --- | --- | --- |
| Phase flow (`getNextEvent`, `handleChoice`, auto chain) | Web composable | Uses `requestAnimationFrame` pacing |
| Volatile session | `engineState` module singleton | `currentEvent`, `lastChoiceFeedback`, `isAutoPlaying` |
| Save/load orchestration | Composable + `SaveManager` | `loadGameState` + `getNextEvent` |
| Player alerts/prompts | `GameScreen`, `App`, `SaveManager` | Browser-only |

## Future headless delegation map

| Concern | Target owner | P5 status |
| --- | --- | --- |
| Event selection / execution | `HeadlessEngineSession` | Implemented in Node path |
| Snapshot transport | `SnapshotConverter` | Implemented |
| Catalog reads | `InMemoryEventCatalogAdapter` | Implemented |
| UI pacing / animation | Web composable | Remains Web-only |
| Storage UX | Web + `SaveManager` | Unchanged in P5 |

## P5 scope statement

P5 **does not require** migrating production `App.vue` / `GameScreen` to headless execution. Web keeps existing composable flow; headless path proves contracts for backend work later.
