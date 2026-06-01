# Replay Log Contract (P4 US-011)

Audit and deterministic replay contract for reproducing a life from initial conditions and choice log.

## 1. Purpose

- Support simulation audit, backend replay verification, and bug reproduction.
- Separate **deterministic replay data** from **diagnostic-only** entries.
- Does not implement a replay engine in P4.

## 2. Replay Log Envelope

```typescript
interface ReplayLog {
  metadata: ReplayLogMetadata;
  entries: ReplayLogEntry[];
}
```

## 3. Required Metadata

| Field | Type | Description |
| --- | --- | --- |
| `replayVersion` | `'1.0.0'` | Replay contract version |
| `engineVersion` | `string` | Engine build semver |
| `eventCatalogVersion` | `string` | Event bundle version |
| `initialSeed` | `string \| number` | Life/session seed |
| `startSnapshotHash` | `string` | Hash of initial snapshot at replay start |
| `platform` | `SourcePlatform` | Origin platform |
| `createdAt` | `number` | Log creation timestamp (ms) |
| `lifeId` | `string?` | Optional life/session identifier |

## 4. Entry Types

| `actionType` | Purpose | Deterministic? |
| --- | --- | --- |
| `choice` | Player choice execution | yes |
| `auto_event` | Engine auto-resolved event | yes |
| `save_load` | Save/load boundary marker | marker only |
| `terminal` | Death or ending reached | yes |

### 4.1 Common entry fields

| Field | Required | Description |
| --- | --- | --- |
| `sequence` | yes | Monotonic index within log |
| `actionType` | yes | Entry kind |
| `age` | yes | Player age at action |
| `timestamp` | yes | Engine calendar `{ year, month, day }` |
| `eventId` | conditional | Required for choice/auto_event |
| `choiceId` | conditional | Required for choice |
| `outcomeId` | no | When branching requires it |
| `snapshotHashBefore` | yes | Integrity check before step |
| `snapshotHashAfter` | yes | Integrity check after step |
| `randomDrawIndex` | conditional | Required when RNG used |

### 4.2 Diagnostic-only fields (not required for replay)

- `executionMs`, `clientTraceId`, `feedbackSummary`, `warnings`
- Full `ChoiceFeedbackModel` blobs
- UI session state

## 5. Integrity Checks

1. `startSnapshotHash` must match hash recomputed from initial snapshot fixture.
2. Each entry's `snapshotHashBefore` must equal previous entry's `snapshotHashAfter` (or `startSnapshotHash` for first entry).
3. `randomDrawIndex` must be monotonic within a life when present.
4. Terminal entry must have `actionType: 'terminal'` and no subsequent entries.

## 6. Deterministic Replay Minimum

To reproduce a life, consumers need:

- `initialSeed`
- `eventCatalogVersion`
- `engineVersion` (within supported compatibility range)
- Ordered `choice` and `auto_event` entries with event/choice/outcome ids and RNG indices
- Initial snapshot or enough bootstrap state to construct one

## 7. Non-Goals

- No replay executor implementation.
- No simulation behavior changes.

## 8. References

- `docs/contracts/game-state-snapshot-contract.md`
- `docs/contracts/choice-execution-request-contract.md`
