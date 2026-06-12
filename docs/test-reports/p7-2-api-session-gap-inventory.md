# P7.2 API Session Gap Inventory (US-002)

Read-only inventory of where API mode stops before P7.2 — the exact dead-end to close.

## create / restore / choice response fields (pre-P7.2)

**Routes:** `POST /v1/sessions`, `POST /v1/sessions/restore`, `POST /v1/sessions/:id/choices`

**Response shape (via `gameService` + `router.ts`):**

| Field | Source |
| --- | --- |
| `sessionId`, `sessionToken` | Session store |
| `slot` / `slotVersion` | Save slot pointer + version |
| `snapshot` / `snapshotId`, `contentHash` | Latest snapshot row |
| `nextEvent` | `mapNextEvent(deriveNextEvent(headless))` — null when `selectEvent()` empty |
| `terminal` | `headless.getTerminalState()` |
| `lifeMemory` | `headless.getLifeMemory()` |
| `feedback` | Choice path only (choice execution feedback) |

**Missing before P7.2:** `sessionPhase`, `planningOptions`, `activeActionSummary`, `disturbanceNarrative`.

## nextEvent null in useApiGameEngine

**Location:** `src/composables/useApiGameEngine.ts`

- `applySessionResponse` sets `engineState.currentEvent = response.nextEvent`.
- When `nextEvent === null`, `currentNode` in `App.vue` returns `null` → blank content area.
- No active-planning branch; player sees P7.1 `api-boundary-notice` in `GameScreen.vue`.

## HeadlessEngineSession.getNextEvent null path

**Location:** `src/headless/session/HeadlessEngineSessionImpl.ts`

- `engine.selectEvent()` returns `null` → `volatile.currentEvent = null`, returns `null`.
- Unlike local `useNewGameEngine`, headless does **not** call `getAvailableActiveActions` or `advanceTime(3, 'month')` on this path.
- `progressUntilChoiceOrTerminal` breaks on `!next` → session left with `nextEvent: null` at API boundary.

## Missing HTTP routes (pre-P7.2)

| Intended endpoint | Status before P7.2 |
| --- | --- |
| `POST /v1/sessions/:sessionId/active-action` | Not registered |
| `POST /v1/sessions/:sessionId/progression-ack` | Not registered |

**Existing related routes:** choices, manual save, session create/restore only.

No business code modified in this story.
