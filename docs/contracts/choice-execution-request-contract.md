# Choice Execution Request Contract (P4 US-007)

Stable request shape for executing a player choice against a known game state snapshot. This contract defines transport boundaries only; it does not replace the current runtime choice pipeline in `GameEngineIntegration` / `useNewGameEngine`.

## 1. Purpose

- Allow Web, mini-program, and future API callers to submit the same choice execution intent.
- Separate **trusted server-side state** from **untrusted client hints**.
- Provide validation and error categories before any backend implementation.

## 2. Request Envelope

```typescript
interface ChoiceExecutionRequest {
  requestVersion: '1.0.0';
  snapshotRef: SnapshotReference;
  action: ChoiceAction;
  randomContext?: RandomContext;
  clientMetadata?: ClientMetadata;
}
```

## 3. Required Fields

### 3.1 Snapshot reference (`snapshotRef`) — one of:

| Field | Type | Description |
| --- | --- | --- |
| `snapshotId` | `string` | Server-resolved save or snapshot identifier |
| `snapshot` | `GameStateSnapshot` | Inline snapshot payload (local/offline or bootstrap) |

At least one must be present. Future backend implementations should prefer `snapshotId` and load canonical state server-side.

### 3.2 Choice action (`action`)

| Field | Required | Description |
| --- | --- | --- |
| `eventId` | yes | Event being resolved |
| `choiceId` | yes | Selected choice within the event |
| `outcomeId` | no | Explicit outcome when branching requires it |
| `playerInput` | no | Structured player input metadata (text, slider, confirm token) |

### 3.3 Random context (`randomContext`) — required when event/outcome resolution depends on RNG

| Field | Type | Description |
| --- | --- | --- |
| `seed` | `string \| number` | Deterministic seed for this execution step |
| `sequence` | `number` | Monotonic draw index within the life/session |

When omitted, the engine or backend owns RNG derivation from replay metadata.

## 4. Optional Client Metadata

| Field | Type | Description |
| --- | --- | --- |
| `platform` | `SourcePlatform` | Caller platform (`web-browser`, `mini-program`, etc.) |
| `clientVersion` | `string` | Client build semver |
| `traceId` | `string` | Correlation id for logs and diagnostics |
| `submittedAt` | `number` | Client timestamp (diagnostic only) |

## 5. Untrusted Client Fields (Future Backend)

The following must **never** be trusted from the client without server recomputation:

| Category | Examples | Server must |
| --- | --- | --- |
| State deltas | attribute changes, route transitions, relationship deltas | Recompute from event catalog + choice outcome |
| Derived views | `LifeMemorySummary`, statistics, feedback text | Regenerate after execution |
| History append | fabricated `eventHistory` rows | Append only from engine result |
| Catalog/version | `eventCatalogVersion` alone | Verify against deployed catalog bundle |
| Authorization | `userId`, slot ownership claims | Resolve from session/token |
| RNG outcomes | client-provided random draws | Derive or validate against seed policy |

Client may send hints for diagnostics; server responses must not treat them as authoritative.

## 6. Validation Failures and Error Categories

| Code | Category | When |
| --- | --- | --- |
| `INVALID_REQUEST_VERSION` | schema | Unknown `requestVersion` |
| `MISSING_SNAPSHOT` | snapshot | Neither `snapshotId` nor `snapshot` provided |
| `SNAPSHOT_NOT_FOUND` | snapshot | `snapshotId` unknown |
| `SNAPSHOT_SCHEMA_UNSUPPORTED` | snapshot | Schema version outside supported range |
| `SNAPSHOT_FORBIDDEN_FIELDS` | snapshot | Volatile/engine-only fields present |
| `MISSING_EVENT_ID` | action | `eventId` absent |
| `MISSING_CHOICE_ID` | action | `choiceId` absent |
| `EVENT_NOT_FOUND` | catalog | Event id absent from active catalog |
| `CHOICE_NOT_FOUND` | catalog | Choice id invalid for event |
| `OUTCOME_REQUIRED` | action | Branching event requires `outcomeId` |
| `OUTCOME_NOT_FOUND` | catalog | Outcome id invalid |
| `PLAYER_NOT_ALIVE` | state | Choice attempted after terminal death |
| `PENDING_EVENT_MISMATCH` | state | Snapshot state inconsistent with pending event (future strict mode) |
| `RANDOM_CONTEXT_REQUIRED` | random | RNG-dependent resolution without seed context |
| `CATALOG_VERSION_MISMATCH` | catalog | Snapshot catalog version incompatible with server bundle |
| `UNAUTHORIZED` | auth | Caller cannot act on snapshot (future) |
| `INTERNAL_ERROR` | server | Unexpected execution failure |

Player-facing messages should be short and non-technical. Diagnostic detail belongs in failure response `diagnostics` (see response contract).

## 7. Non-Goals

- No HTTP endpoint implementation in P4.
- No modification to current `handleChoice` / `executeChoiceEffects` runtime behavior.

## 8. References

- `docs/contracts/game-state-snapshot-contract.md`
- `docs/contracts/choice-execution-response-contract.md`
- `src/types/choiceFeedback.ts`
