# Frontend Adapter Boundary (P4 US-021)

Separation between player-facing UI, API transport, and shared engine contracts.

## 1. Responsibility Layers

| Layer | Responsibility | Examples |
| --- | --- | --- |
| UI components | Render server-owned player state and emit player intents | `App.vue`, `GameScreen.vue`, `SaveSlotStartScreen.vue` |
| API composable | Coordinate session state and API commands | `useApiGameEngine.ts` |
| API adapter | Encode requests and decode server responses | `webApiClient.ts` |
| Browser platform storage | Retain API device/session credentials | `webPlatformStorage.ts` |
| Engine contracts | Serializable session, choice, and Snapshot types | `src/contracts/*` |
| Headless / simulation | Execute canonical game behavior for server, tests, and simulation | `HeadlessEngineSessionImpl.ts`, `GameProcessSimulator.ts` |

## 2. Production Runtime Boundary

Formal Web play uses `Vue UI → Server API → Headless Session → shared engine`. The Web client requires `VITE_P6B_API_URL`; missing configuration or an unavailable service is reported in the UI. There is no browser Local gameplay fallback.

Browser storage contains API credentials, while player saves and session restoration are owned by the API and current Snapshot contract. `SaveManager.ts` remains a canonical persistence utility for tests and simulation, not a Web player save adapter.

`GameProcessSimulator.local_direct` is an independent simulation path and does not select or implement the browser player runtime.

## 3. Boundary Rules

- Vue components do not execute game event selection or settlement.
- API transport code does not treat client-provided state deltas as authoritative.
- Contract types do not import Vue components or composables.
- Browser APIs stay outside `src/contracts/`.

## 4. References

- Web / Headless boundary: `docs/contracts/web-runtime-adapter-boundary.md`
- Choice transport: `docs/contracts/choice-execution-request-contract.md`
