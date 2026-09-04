# Choice Execution Response Contract (P4 US-008)

Stable response shape after a choice execution attempt. Separates player-facing feedback from diagnostic data for UI, save, replay, and life memory consumers.

## 1. Response Envelope

```typescript
type ChoiceExecutionResponse =
  | ChoiceExecutionSuccessResponse
  | ChoiceExecutionFailureResponse;
```

Both variants share:

| Field | Type | Description |
| --- | --- | --- |
| `responseVersion` | `'2.0.0'` | Contract version |
| `traceId` | `string?` | Echo from request when provided |

## 2. Success Response

```typescript
interface ChoiceExecutionSuccessResponse {
  status: 'success';
  nextSnapshot: GameStateSnapshot;
  feedback: ChoiceFeedbackModel;
  append: ExecutionAppend;
  deltas: ExecutionDeltas;
  hints: NextEventHints;
  diagnostics: ChoiceExecutionDiagnostics;
  warnings?: ExecutionWarning[];
}
```

### 2.1 Core payload fields

| Field | Description |
| --- | --- |
| `nextSnapshot` | Authoritative post-choice persisted state |
| `feedback` | Structured choice feedback (`ChoiceFeedbackModel`) |
| `append.eventHistory` | New event history row(s) |
| `append.generatedLogs` | Engine-generated narrative/log lines |
| `deltas.routeChanges` | Route lifecycle transitions |
| `deltas.relationshipChanges` | Relationship affinity deltas |
| `deltas.lifeMemoryInputs` | Canonical input fields changed (not derived summary) |
| `hints.nextEventIds` | Candidate next events (non-binding preview) |
| `hints.autoAdvance` | Whether client may auto-advance without new choice |

### 2.2 Player-facing vs diagnostic separation

Reuse existing visibility model from `ChoiceFeedbackModel`:

| Layer | Audience | Contents |
| --- | --- | --- |
| `feedback.player` | Player UI | explicit result narrative or `null`, stat/relationship/route impacts, risk hints |
| `feedback.diagnostic` | Dev/report only | raw effects and source ids |
| `diagnostics` | Server audit / replay | execution timing, catalog version used, snapshot hash before/after |
| `warnings` | Both (filtered by visibility) | non-fatal validation notices |

**Rule:** Player UI must render only `feedback.player` and warnings marked `visibility: 'player'`. Diagnostic and hidden entries must not appear in default player flow.

### 2.3 Missing result narrative

`feedback.player.narrativeResult` has exactly two meanings:

- `string`: explicit semantic post-choice narrative from the resolved `ChoiceOutcome.text`;
- `null`: this successful choice execution has no independent semantic post-choice narrative.

`null` is a valid successful result state. It must not be replaced with `choice.description`, configured-effect prose, or a generic ripple message. The player surface continues to show the selected choice and canonical actual public impacts when present. Missing narrative is not a soft failure and does not produce fallback diagnostic fields.

Hard execution failures use the failure response shape below.

## 3. Failure Response

```typescript
interface ChoiceExecutionFailureResponse {
  status: 'failure';
  error: ChoiceExecutionError;
  diagnostics?: ChoiceExecutionDiagnostics;
  partialSnapshot?: GameStateSnapshot;
}
```

### 3.1 Error object

| Field | Type | Description |
| --- | --- | --- |
| `code` | string | Machine-readable category (see request contract §6) |
| `message` | string | Player-safe short message |
| `details` | string? | Diagnostic explanation (dev/support) |
| `field` | string? | Request field path when validation failed |

### 3.2 Warnings vs validation errors

| Kind | HTTP analogy | Response location | Blocks success? |
| --- | --- | --- | --- |
| Warning | 2xx + warning header | `warnings[]` on success | no |
| Validation error | 400 | `failure.error` | yes |
| State/catalog error | 409/422 | `failure.error` | yes |
| Internal error | 500 | `failure.error` | yes |

## 4. Supporting Shapes

```typescript
interface ExecutionAppend {
  eventHistory: SnapshotEventRecord[];
  generatedLogs: string[];
}

interface ExecutionDeltas {
  relationshipChanges?: Array<{ relationId: string; delta: number }>;
  lifeMemoryInputs?: Partial<Pick<GameStateSnapshotState, 'flags' | 'criticalChoices' | 'lifePath'>>;
}

interface NextEventHints {
  nextEventIds?: string[];
  autoAdvance?: boolean;
}

interface ExecutionWarning {
  code: string;
  message: string;
  visibility: ChoiceFeedbackVisibility;
}

interface ChoiceExecutionDiagnostics {
  engineVersion: string;
  eventCatalogVersion: string;
  snapshotHashBefore?: string;
  snapshotHashAfter?: string;
  executionMs?: number;
}
```

## 5. Boundaries

- Player UI reads only `feedback.player`; it must not inspect `feedback.diagnostic` for normal presentation.
- Request contract remains `1.0.0`; this response contract change does not version `/v1/...` HTTP routes.
- Snapshot, Save, Replay schemas and choice execution effects are unchanged.

## 6. References

- `docs/contracts/choice-execution-request-contract.md`
- `docs/contracts/game-state-snapshot-contract.md`
- `src/types/choiceFeedback.ts`
