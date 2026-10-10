# Session Progression API

锁定决策摘要（服务端权威主动规划 / progression-ack）。

## Single progression-ack endpoint

- **One route:** `POST /v1/sessions/:sessionId/progression-ack`
- **Body:** `ProgressionAckRequest` with `ackKind: 'action_summary' | 'disturbance'`
- No separate summary/disturbance URLs.

## Time catch-up

When no story event and no planning actions:

- Server reuses `advanceTime(3, 'month')` on hydrated engine, then re-resolves event/planning.

## Formal Event / active planning priority (PD-126)

- `terminal`, unconfirmed progression results, and an already selected event take precedence over a new event selection.
- Forced events and required milestones keep their existing priority.
- If there is no pending event and valid planning options exist, repeated phase resolution and restore preserve `active_planning` without selecting an ordinary event.
- After an active action advances time, the Runtime offers one existing Scheduler evaluation only after the action summary and any disturbance result are acknowledged. No selection returns the player to planning.
- Completing an ordinary event returns to valid planning instead of recursively selecting another ordinary event. When no action is executable, the existing catch-up / terminal path continues.
- These transitions are shared by P8/headless and API restore through the same session. Snapshot stays at `3.16.0`; the existing `pendingStoryEventId` carries a selected catalog event through restore, and runtime-built events continue to use volatile state.
- Formal / Daily Event eligibility and selection parameters are unchanged. Reading a phase or restoring the same decision point does not create another Scheduler opportunity.

## sessionPhase (authoritative client driver)

| Phase | Client shows |
| --- | --- |
| `story_event` | `nextEvent` + choices |
| `active_planning` | `planningOptions` |
| `action_summary` | `activeActionSummary` + continue |
| `disturbance_narrative` | `disturbanceNarrative` + continue |
| `terminal` | Ending flow |

**Backward compat:** missing `sessionPhase` → infer `story_event` if `nextEvent` present, else `active_planning` if `planningOptions` length > 0.

## Replay actionType values

| actionType | When |
| --- | --- |
| `active_action` | Successful `POST .../active-action` |
| `progression_ack` | Each `POST .../progression-ack` (payload includes `ackKind`) |

## Related contracts

- Types: `src/contracts/sessionProgression.ts`
- Related ops: `docs/local-api-dev.md`
