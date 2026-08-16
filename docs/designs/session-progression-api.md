# Session Progression API

锁定决策摘要（服务端权威主动规划 / progression-ack）。

## Single progression-ack endpoint

- **One route:** `POST /v1/sessions/:sessionId/progression-ack`
- **Body:** `ProgressionAckRequest` with `ackKind: 'action_summary' | 'disturbance'`
- No separate summary/disturbance URLs.

## Time catch-up

When no story event and no planning actions (mirrors local `useNewGameEngine`):

- Server reuses `advanceTime(3, 'month')` on hydrated engine, then re-resolves event/planning.

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
