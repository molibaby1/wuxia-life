# Frontend Adapter Boundary (P4 US-021)

Separation between UI adapters and pure engine contracts before service extraction.

## 1. Responsibility Layers

| Layer | Responsibility | Examples |
| --- | --- | --- |
| UI components | Render player-facing state | `GameScreen.vue`, `LifeMemoryPanel.vue` |
| Composables | Orchestrate engine + session state | `useNewGameEngine.ts` |
| Persistence adapters | localStorage / export | `SaveManager.ts`, `SaveManager.vue` |
| Engine contracts | Serializable transport types | `src/contracts/*` |
| Report/simulation | Headless audit | `GameProcessSimulator.ts`, gate scripts |

## 2. Current Direct Dependencies to Wrap

| Dependency | Location | Wrap before extraction? |
| --- | --- | --- |
| `localStorage` | `SaveManager.ts` | yes — storage adapter |
| `requestAnimationFrame` | `useNewGameEngine.ts` | yes — scheduler adapter |
| Vue `reactive`/`ref` | composables, engine integration | yes — session boundary |
| `window.alert` / DOM | UI components | yes — UI feedback adapter |
| `Math.random` | engine/simulation | yes — RNG adapter for determinism |
| Static event JSON import | `EventLoader` | yes — catalog provider interface |

## 3. Must Not Cross Into Contracts

- Vue components importing contract validators in hot path
- Contract types importing composables or `.vue` files
- Browser APIs inside `src/contracts/`

## 4. Non-Goals

- No UI behavior changes
- No service extraction in P4

## 5. References

- Related contracts in `docs/contracts/`
- Headless boundary: `docs/contracts/web-runtime-adapter-boundary.md`
