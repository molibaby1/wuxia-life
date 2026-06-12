# P7.2 Integration Baseline (US-003)

Combines local reference flow ([p7-2-local-active-planning-inventory.md](./p7-2-local-active-planning-inventory.md)) and API gap ([p7-2-api-session-gap-inventory.md](./p7-2-api-session-gap-inventory.md)) so later stories need not re-audit.

## Shared core modules to reuse

| Module | Reuse in P7.2 |
| --- | --- |
| `ActivePlanningService.executeActiveActionOnState` | Headless `executeActiveAction` mutation |
| `buildActiveActionChoices` | `getPlanningOptions` → `PlanningOptionDto` |
| `buildActiveActionSummaryDisplay` | Volatile summary after action |
| `buildDisturbanceNarrativeDisplay` | Volatile disturbance payload |
| `markDisturbanceNarrativeShown` | Disturbance ack |
| `GameEngineIntegration.getAvailableActiveActions` / `advanceTime` | Planning resolution + catch-up |
| `HeadlessEngineSessionImpl` | Extend with phase + planning APIs |
| P7.1 `GameScreen` summary/disturbance cards | API mode props (no redesign) |

## Volatile vs snapshot UI state (from PRD)

| State | Persisted in snapshot | Session volatile |
| --- | --- | --- |
| Stat/time/history after action | Yes | — |
| `activeActionSummary` card | No | `pendingActionSummary` until ack |
| `disturbanceNarrative` card | No (history entry exists) | `pendingDisturbanceNarrative` until ack |
| `sessionPhase` | Derived each response | Drives client UI branch |

Ack-only transitions must not write a second snapshot.

## Explicit non-goals (P7.2)

- No bulk deferred event ingestion.
- No new active-action catalog entries.
- No account / cross-device sync.
- No physical removal of local mode (dev fallback only).
- No UI visual redesign.
- No new database tables (`game_snapshots`, `replay_actions` JSONB only).

No business code modified in this story.
