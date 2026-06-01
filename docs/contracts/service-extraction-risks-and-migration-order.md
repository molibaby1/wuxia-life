# Service Extraction Risks and Migration Order (P4 US-026)

Recommended order and risks for post-P4 backend/service extraction.

## 1. Recommended Extraction Order

1. **Contracts** (P4 complete) — types, fixtures, validation, tests
2. **Event catalog read service** — versioned bundle delivery
3. **Snapshot persistence** — save/load API backed by database boundary
4. **Choice execution service** — server-side execution with trust boundaries
5. **Replay/audit service** — log storage and integrity verification
6. **Accounts** — ownership, auth, cloud slots

## 2. Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| Determinism drift | Pin engine + catalog versions; seeded RNG adapter |
| Event version drift | Snapshot pins `eventCatalogVersion`; reject mismatch |
| Save compatibility debt | Save schema policy + ordered migrations |
| Client/server trust | Never trust client deltas; recompute on server |
| Mini-program storage limits | Partial sync policy; compress snapshots |
| Vue reactive coupling | Extract headless engine session before API |
| Session state vs snapshot | Document hydrate + `getNextEvent()` recovery |

## 3. P3 Gates Must Stay Green

During extraction, keep passing:

```bash
npm run typecheck
npm test
npm run gate:golden-line
npm run gate:experience
npm run gate:midlife
npm run simulate:p3-eval
```

## 4. Non-Goals

- No service extraction in P4
- No runtime changes
