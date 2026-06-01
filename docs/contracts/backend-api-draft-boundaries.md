# Backend API Draft Boundaries (P4 US-025)

Draft endpoint boundaries referencing P4 contracts. No server or HTTP client in P4.

## 1. Endpoints (Draft)

### GET `/v1/catalog/bundle`

- Request: `EventBundleRequest` query params
- Response: `EventBundleResponse`
- Errors: `CATALOG_NOT_FOUND`, `CATALOG_VERSION_UNSUPPORTED`

### POST `/v1/saves`

- Request: `{ slotLabel?, snapshot: GameStateSnapshot }`
- Response: `{ snapshotId, slotId, metadata }`
- Errors: `SNAPSHOT_SCHEMA_UNSUPPORTED`, `SNAPSHOT_FORBIDDEN_FIELDS`

### GET `/v1/saves/{snapshotId}`

- Response: `GameStateSnapshot`
- Errors: `SNAPSHOT_NOT_FOUND`, `UNAUTHORIZED`

### POST `/v1/choices/execute`

- Request: `ChoiceExecutionRequest`
- Response: `ChoiceExecutionResponse`
- Errors: request contract §6 codes

### GET `/v1/replay-logs/{replayLogId}`

- Response: `ReplayLog`
- Errors: `REPLAY_NOT_FOUND`, `UNAUTHORIZED`

## 2. Non-Goals

- No server implementation
- No HTTP client
- No auth/token implementation

## 3. Likely Error Categories

- Validation (400): schema, missing fields
- State conflict (409): stale snapshot, pending event mismatch
- Auth (401/403): ownership
- Catalog (404/422): version drift
- Internal (500): execution failure

## 4. References

- All `docs/contracts/*` P4 contract documents
- `src/contracts/*` types
