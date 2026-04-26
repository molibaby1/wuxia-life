# US-008 Route Categories and Lifecycle Design Notes

## Background

P2 requires a deterministic route lifecycle so event gating, identity consistency, and route conflict handling can be implemented without ad-hoc per-event flags.

## Route Categories

### Main Route

- Meaning: Player's primary long-term identity direction in the current life stage.
- Scope: Exactly one active main route is allowed at a time.
- Examples: `hero`, `merchant`, `sect`, `demonic`, `official`, `hermit`, `wanderer`.
- Persistence: Must be recoverable from save/load and written to route history.

### Secondary Route

- Meaning: A supportive or parallel development line that does not replace the current main route.
- Scope: Zero to many secondary routes can be active if compatibility rules permit.
- Examples: `romance`, `family`, `craft`, `reputation`.
- Persistence: Stored with independent progress and ending state.

### Conflicting Route

- Meaning: A candidate route that is currently incompatible with locked/active route commitments.
- Scope: Not active; represented as blocked or pending-turn intent.
- Trigger: Produced by route-selection checks when hard/soft conflict is detected.

### Temporary State

- Meaning: Transitional route state before lock-in (trial, probation, rumor phase).
- Scope: Time-limited and reversible.
- Exit: Must become `active`, `failed`, or be explicitly abandoned.

### Completed State

- Meaning: Route goals are fulfilled and route is terminal-success.
- Effects: Apply completion rewards/outcomes, close route-specific pending events, keep immutable completion record.

### Failed State

- Meaning: Route cannot continue due to breakage, contradiction, timeout, or explicit abandon.
- Effects: Apply failure consequences, close pending route chain, keep immutable failure reason.

## Lifecycle State Machine

Every route instance follows one canonical state machine:

`inactive -> temporary -> active -> locked_in -> (turned | completed | failed)`

`turned -> active` (new route context)

State semantics:

- `inactive`: Route exists in catalog only; no active progress.
- `temporary`: Route has started but no lock-in commitment yet.
- `active`: Route is currently progressing and can still pivot.
- `locked_in`: Core commitment accepted; hard-conflict routes must be blocked.
- `turned`: Player explicitly pivots from a previously locked/active direction through a turn event.
- `completed`: Terminal success.
- `failed`: Terminal failure.

Terminal states: `completed`, `failed`.

## Route Switching Rules

1. Starting a route from `inactive` always enters `temporary` first.
2. Switching between non-conflicting routes is allowed only when source route is `temporary` or `active`.
3. If source route is `locked_in`, switching requires an explicit `turn` event with cost/consequence.
4. Hard-conflicting target routes cannot be entered directly from `locked_in`; they must pass through `turned` workflow.
5. Secondary routes can be added/removed independently unless they violate a hard-conflict rule with the main route.

## Lock-in Rules

1. Lock-in is an explicit transition `active -> locked_in`, never implicit.
2. Lock-in requires route-specific commitment conditions (for example: milestone reached, key choice confirmed, threshold met).
3. After lock-in:
   - Hard-conflict routes are blocked.
   - Soft-conflict routes require `turn` handling.
   - Route-breaking events can still move the route to `failed`.
4. Lock-in transitions must be recorded in route history with age/time and trigger event id.

## Route Ending Rules

1. `completed` requires route objective criteria and no unresolved blocker conditions.
2. `failed` is triggered by explicit break conditions, timeout, contradiction, or abandon decision.
3. Terminal transitions (`-> completed` / `-> failed`) are irreversible in the same life run.
4. Completing or failing a main route does not automatically end all secondary routes; each secondary route resolves independently unless an explicit dependency exists.

## Implementation Notes for Follow-up Stories

- `US-009` should define a testable compatibility table using this lifecycle vocabulary.
- `US-010` should enforce state transitions through one unified route state manager.
- `US-011` and `US-012` should assert lock-in conflict blocking and completion/failure breakage paths using deterministic tests.
