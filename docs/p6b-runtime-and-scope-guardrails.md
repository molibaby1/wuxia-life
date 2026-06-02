# P6B Runtime and Scope Guardrails (US-002)

## Server-Authoritative Model

- **Anonymous device**: `POST /v1/devices/bootstrap` issues `deviceToken`; DB stores only a hash.
- **Gameplay session**: `POST /v1/sessions` or `POST /v1/sessions/restore` issues `sessionToken`; DB stores only a hash.
- **Save slots**: Three numbered slots per device; `save_slots.current_snapshot_id` and `version` are authoritative.
- **Snapshots**: Append-only `game_snapshots` rows; content hash computed server-side.
- **Choices**: Server loads canonical snapshot, runs P5 headless `executeChoice` + automatic progression, persists new snapshot and replay rows in one transaction.
- **Catalog**: Pinned `event_catalog_versions`; clients read bundle via `GET /v1/catalog/bundle`.

Clients send **expected** slot version and snapshot id for optimistic concurrency; they must not send trusted state deltas.

## Permitted Surgical Service-Path Fixes

- Inject `HeadlessLogger` on backend (suppress verbose engine debug in production).
- Guard or bypass browser-only APIs in code paths invoked from Node (already partially done in P5).
- Narrow fixes that unblock headless execution from HTTP without gameplay rebalance.

## Explicit Prohibitions (P6B)

- Gameplay rebalance, new events, or event rule changes
- UI visual redesign (layout/styling overhaul)
- Account registration, login UI, cloud account sync
- Conflict merge UI beyond HTTP 409 + reload prompt
- Admin tools, mini-program runtime
- ORM-heavy abstractions beyond thin repositories

## Regression Commands (Each Wave)

```bash
npm run typecheck
npm run build
npm test
npm run test:contracts
npm run test:headless
npm run gate:p5
npm run test:p6b
npm run gate:p6b
```

## Deferred to Later Phases

- Account migration and cross-device sync
- Mini-program adapter
- Broad runtime hardening (full singleton removal in Web)
