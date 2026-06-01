# PRD: P6B PostgreSQL Save Persistence and Session API

## 1. Introduction

P4 defined stable contracts for snapshots, choice execution, replay logs, event catalog payloads, save schema policy, ownership boundaries, and future database models. P5 proved that the gameplay engine can be exercised through a Node-runnable headless session with deterministic 0-50 parity for the golden cohort.

P6B introduces the first deployable backend foundation: a lightweight TypeScript HTTP service backed by self-hosted PostgreSQL. The backend becomes authoritative for anonymous device identity, game sessions, three save slots per device, immutable snapshots, append-only replay actions, versioned event catalog reads, and trusted choice execution.

The existing Web client must use this API for the minimum complete player loop:

1. Bootstrap an anonymous device identity.
2. Start a new game or resume one of three save slots.
3. Execute choices through the backend.
4. Persist successful progression automatically.
5. Load the saved game after a browser refresh.

This phase is intentionally narrow. It does not add account registration, login UI, cross-device account sync, conflict merge UI, administration tools, mini-program pages, gameplay rebalance, or visual redesign.

P6B uses the P5 headless session as the execution boundary. Any service-path runtime issue that blocks reliable API execution may be fixed surgically, but broad core refactoring belongs to a separate runtime-hardening phase.

## 2. Decisions Locked for P6B

| Area | Decision |
| --- | --- |
| Database | Self-hosted PostgreSQL |
| Backend | Lightweight TypeScript Node HTTP service |
| Migration style | Repository-managed ordered SQL migrations |
| Anonymous ownership | `deviceToken` identifies a device; `sessionToken` identifies a gameplay session |
| Save capacity | Exactly three numbered save slots per anonymous device |
| Save modes | Automatic save after trusted progression and explicit manual save |
| Web scope | Existing Web client must complete new game, continue game, save, and load flows through the API |
| API scope | Device bootstrap, session creation, save list, save, restore, choice execution, event catalog read, health checks |
| Server authority | The backend loads canonical state, executes choices, and writes snapshots; clients must not submit trusted state deltas |

## 3. Goals

- Add a reproducible PostgreSQL schema and migration workflow.
- Store anonymous device tokens and session tokens securely as hashes, never plaintext.
- Support three server-side save slots per anonymous device.
- Store immutable versioned `GameStateSnapshot` rows as JSONB with integrity metadata.
- Execute player choices through a server-owned P5 headless session.
- Persist successful new-game and choice progression automatically.
- Reject stale writes and stale choices with explicit HTTP `409` conflicts.
- Store replay actions as append-only audit rows.
- Serve the pinned event catalog version through an HTTP read endpoint.
- Switch the existing Web gameplay path to the API-backed flow without redesigning the UI.
- Preserve P3, P4, and P5 regression gates.
- Add a dedicated P6B gate covering migrations, repositories, API integration, Web build, and existing gameplay gates.

## 4. User Stories

### US-001: Rebaseline P6B Integration Boundaries
**Description:** As a maintainer, I want a read-only inventory of the current P5 headless, Web runtime, snapshot, catalog, and save boundaries so that backend work starts from the proven path.

**Acceptance Criteria:**
- [ ] Inventory current P5 headless session construction and dependency injection points.
- [ ] Inventory current Web new-game, continue-game, choice, save, and load entry points.
- [ ] Inventory snapshot conversion, replay, catalog, and version validation helpers.
- [ ] Identify service-path blockers caused by Vue reactivity, global singletons, browser storage, or direct console logging.
- [ ] Produce a P6B integration-baseline report.
- [ ] Do not modify business code.
- [ ] Typecheck passes.

### US-002: Define P6B Runtime and Scope Guardrails
**Description:** As a project owner, I want explicit P6B guardrails so that backend implementation does not silently expand into accounts, mini-program work, or gameplay changes.

**Acceptance Criteria:**
- [ ] Document the server-authoritative session and persistence model.
- [ ] Document permitted surgical service-path fixes.
- [ ] Prohibit gameplay rebalance, event expansion, UI redesign, account registration, login UI, cloud account sync, conflict merge UI, admin tools, and mini-program implementation.
- [ ] Define required regression commands after each implementation wave.
- [ ] Typecheck passes.

### US-003: Define PostgreSQL Schema
**Description:** As a backend developer, I want an explicit PostgreSQL schema so that ownership, saves, snapshots, replay actions, and catalog versions are persisted consistently.

**Acceptance Criteria:**
- [ ] Define tables for `anonymous_devices`, `game_sessions`, `save_slots`, `game_snapshots`, `replay_actions`, and `event_catalog_versions`.
- [ ] Define primary keys, foreign keys, unique constraints, indexes, timestamps, and deletion rules.
- [ ] Define a migration bookkeeping table or equivalent migration runner state.
- [ ] Use PostgreSQL-native JSONB for snapshots and structured replay payloads.
- [ ] Document why derived life-memory summaries and volatile UI state are not canonical stored data.
- [ ] Typecheck passes.

### US-004: Add Ordered SQL Migration Runner
**Description:** As an operator, I want repository-managed SQL migrations so that a fresh PostgreSQL instance can be prepared reproducibly.

**Acceptance Criteria:**
- [ ] Add ordered SQL migration files for the P6B schema.
- [ ] Add a command that applies pending migrations in order.
- [ ] Applied migrations are recorded and are not executed twice.
- [ ] Migration command fails with a non-zero exit code when a migration fails.
- [ ] Fresh-database migration test passes.
- [ ] Typecheck passes.

### US-005: Add Backend Environment Validation
**Description:** As an operator, I want backend environment variables validated at startup so that configuration failures are visible before requests are accepted.

**Acceptance Criteria:**
- [ ] Validate PostgreSQL connection configuration.
- [ ] Validate HTTP host, HTTP port, environment mode, and token-hashing secret or equivalent secret material.
- [ ] Validate current engine version and event catalog version configuration.
- [ ] Startup fails with a clear error when required configuration is missing or invalid.
- [ ] Secrets are not printed in logs.
- [ ] Typecheck passes.
- [ ] Tests pass.

### US-006: Add Database Connection and Transaction Boundary
**Description:** As a backend developer, I want a PostgreSQL connection and transaction boundary so that save updates and replay appends commit atomically.

**Acceptance Criteria:**
- [ ] Add a PostgreSQL connection pool.
- [ ] Expose a transaction helper used by repositories and application services.
- [ ] Roll back all writes when any operation inside a transaction fails.
- [ ] Close the pool gracefully on process shutdown.
- [ ] Add integration tests against a PostgreSQL test database.
- [ ] Typecheck passes.
- [ ] Tests pass.

### US-007: Add Anonymous Device Bootstrap
**Description:** As a Web player, I want an anonymous device identity so that my save slots can be recovered without creating an account.

**Acceptance Criteria:**
- [ ] Add `POST /v1/devices/bootstrap`.
- [ ] New bootstrap returns an opaque `deviceToken`.
- [ ] Reusing a valid device token returns the same anonymous device identity without creating a duplicate row.
- [ ] Store only a one-way token hash in PostgreSQL.
- [ ] Invalid tokens receive a structured authentication error.
- [ ] Logs never include raw device tokens.
- [ ] Typecheck passes.
- [ ] API integration tests pass.

### US-008: Add Three Save Slots Per Device
**Description:** As a Web player, I want three save slots so that I can keep separate lives without creating an account.

**Acceptance Criteria:**
- [ ] Each anonymous device can own slot indexes `1`, `2`, and `3`.
- [ ] Database constraints prevent a fourth slot and prevent duplicate slot indexes for one device.
- [ ] Slot rows include label, current snapshot reference, integer version, created time, and updated time.
- [ ] Empty slots are returned consistently in the save-list response.
- [ ] Typecheck passes.
- [ ] Repository tests pass.

### US-009: Add Immutable Snapshot Repository
**Description:** As a backend developer, I want immutable snapshot rows so that every persisted progression step has an auditable canonical state.

**Acceptance Criteria:**
- [ ] Store each `GameStateSnapshot` as a new `game_snapshots` row.
- [ ] Store snapshot id, slot id, session id, slot version, schema version, engine version, event catalog version, content hash, snapshot JSONB, and created time.
- [ ] Never update snapshot JSONB in place.
- [ ] Validate snapshot contracts before insert.
- [ ] Recompute integrity metadata server-side; do not trust client-provided hashes.
- [ ] Typecheck passes.
- [ ] Repository tests pass.

### US-010: Add Event Catalog Version Persistence
**Description:** As a backend developer, I want immutable event catalog versions so that saved lives do not silently drift when content changes.

**Acceptance Criteria:**
- [ ] Store catalog version, content hash, status, metadata JSONB, bundle JSONB, and created time.
- [ ] Add a seed or migration step for the current active bundled event catalog.
- [ ] Reject mutation of an existing catalog version when its content hash changes.
- [ ] Support lookup by catalog version.
- [ ] Typecheck passes.
- [ ] Repository tests pass.

### US-011: Add Event Catalog Read API
**Description:** As a Web client, I want to read the pinned event catalog bundle through HTTP so that the client no longer depends on an undeclared catalog source.

**Acceptance Criteria:**
- [ ] Add `GET /v1/catalog/bundle?version=<eventCatalogVersion>`.
- [ ] Return the P4/P5 event catalog response shape.
- [ ] Return a structured error for an unknown or unsupported catalog version.
- [ ] Preserve engine-side final trigger eligibility.
- [ ] Add HTTP-level contract tests against the P5 in-memory adapter reference behavior.
- [ ] Typecheck passes.
- [ ] API integration tests pass.

### US-012: Add Gameplay Session Repository
**Description:** As a backend developer, I want gameplay sessions persisted so that every active engine mutation is scoped to one anonymous owner.

**Acceptance Criteria:**
- [ ] Store session id, device id, optional slot id, session-token hash, engine version, event catalog version, status, created time, and updated time.
- [ ] Store only a one-way session-token hash.
- [ ] Session status supports at least `active`, `terminal`, and `revoked`.
- [ ] Session lookups verify both ownership and token validity.
- [ ] Logs never include raw session tokens.
- [ ] Typecheck passes.
- [ ] Repository tests pass.

### US-013: Add New Game Session API
**Description:** As a Web player, I want to start a new game in a selected slot so that my new life is persisted immediately.

**Acceptance Criteria:**
- [ ] Add `POST /v1/sessions`.
- [ ] Require a valid `deviceToken`, selected slot index, and source platform.
- [ ] Construct a fresh P5 headless session with the configured engine and catalog versions.
- [ ] Persist the session, initial immutable snapshot, current slot pointer, and initial replay marker atomically.
- [ ] Return opaque `sessionToken`, session metadata, slot metadata, current snapshot, and next event.
- [ ] Starting a new life in an occupied slot requires an explicit overwrite confirmation field.
- [ ] Missing overwrite confirmation returns a structured conflict.
- [ ] Typecheck passes.
- [ ] API integration tests pass.

### US-014: Add Save List API
**Description:** As a Web player, I want to see my three save slots so that I can choose whether to continue or start a new life.

**Acceptance Criteria:**
- [ ] Add `GET /v1/saves`.
- [ ] Require a valid `deviceToken`.
- [ ] Return exactly three slots ordered by slot index.
- [ ] Each occupied slot includes slot id, slot index, label, slot version, updated time, snapshot id, age, terminal status, engine version, and event catalog version.
- [ ] Empty slots contain no fabricated snapshot metadata.
- [ ] Typecheck passes.
- [ ] API integration tests pass.

### US-015: Add Restore Session API
**Description:** As a Web player, I want to resume an occupied save slot so that I can continue a previous life after refreshing or returning later.

**Acceptance Criteria:**
- [ ] Add `POST /v1/sessions/restore`.
- [ ] Require a valid `deviceToken` and occupied slot index.
- [ ] Load the canonical current snapshot from PostgreSQL.
- [ ] Validate schema, engine, and catalog compatibility before hydration.
- [ ] Hydrate a new P5 headless session and derive the next event after load.
- [ ] Persist the resumed gameplay session and restore replay marker.
- [ ] Return opaque `sessionToken`, slot metadata, current snapshot, and next event.
- [ ] Typecheck passes.
- [ ] API integration tests pass.

### US-016: Add Append-Only Replay Action Repository
**Description:** As a maintainer, I want append-only replay actions so that persisted lives can be audited and reproduced.

**Acceptance Criteria:**
- [ ] Store replay action id, session id, slot id, sequence number, action type, event id, optional choice id, snapshot hash before, snapshot hash after, payload JSONB, and created time.
- [ ] Sequence numbers are unique and monotonic within a session.
- [ ] Existing replay actions cannot be updated or deleted through application repositories.
- [ ] Support at least `session_created`, `session_restored`, `choice_executed`, `automatic_progression`, `manual_save`, and `terminal` action types.
- [ ] Typecheck passes.
- [ ] Repository tests pass.

### US-017: Add Server-Authoritative Choice Execution API
**Description:** As a Web player, I want my selected choice executed by the backend so that saved progression is trusted and portable across clients.

**Acceptance Criteria:**
- [ ] Add `POST /v1/sessions/{sessionId}/choices`.
- [ ] Require valid session ownership, `sessionToken`, expected slot version, expected snapshot id, event id, and choice id.
- [ ] Load canonical state from PostgreSQL; do not accept client-provided state deltas as authoritative.
- [ ] Hydrate the P5 headless session, validate the pending event and choice, execute the choice, and process automatic progression until the next choice or terminal state.
- [ ] Persist new immutable snapshot, replay actions, current slot pointer, slot-version increment, and session status atomically.
- [ ] Return updated slot version, snapshot, feedback, diagnostics safe for clients, replay append summary, terminal state, life memory, and next event.
- [ ] Invalid event or choice receives a structured validation error.
- [ ] Typecheck passes.
- [ ] API integration tests pass.

### US-018: Add Optimistic Concurrency Protection
**Description:** As a player, I want stale browser tabs prevented from overwriting newer progress so that server saves remain trustworthy.

**Acceptance Criteria:**
- [ ] Save mutations compare the request `expectedSlotVersion` and `expectedSnapshotId` with the current slot row.
- [ ] Slot update uses an atomic compare-and-swap condition inside the same transaction as snapshot and replay writes.
- [ ] Stale requests return HTTP `409` with a stable `STALE_SLOT_VERSION` or `STALE_SNAPSHOT` error code.
- [ ] Conflict responses include current slot version and snapshot id but do not leak another device's data.
- [ ] Concurrent integration test proves that only one of two stale-equivalent writes commits.
- [ ] Typecheck passes.
- [ ] Tests pass.

### US-019: Add Explicit Manual Save API
**Description:** As a Web player, I want to save the current server-owned session explicitly so that I can understand when progress is durable.

**Acceptance Criteria:**
- [ ] Add `POST /v1/sessions/{sessionId}/save`.
- [ ] Require valid session ownership, `sessionToken`, expected slot version, and expected snapshot id.
- [ ] Persist a new immutable snapshot only when the current server session state differs from the slot snapshot.
- [ ] Append a `manual_save` replay action.
- [ ] Return updated slot metadata and snapshot metadata.
- [ ] Apply the same optimistic concurrency rules as choice execution.
- [ ] Typecheck passes.
- [ ] API integration tests pass.

### US-020: Add Automatic Save Policy
**Description:** As a Web player, I want successful progression saved automatically so that closing the browser does not lose meaningful progress.

**Acceptance Criteria:**
- [ ] Persist the initial snapshot when a new game session is created.
- [ ] Persist after each successful choice and its automatic progression chain.
- [ ] Persist terminal state.
- [ ] Do not persist failed or rejected actions.
- [ ] Document that UI-only pacing changes do not trigger a save.
- [ ] Typecheck passes.
- [ ] API integration tests pass.

### US-021: Add Health Check Endpoints
**Description:** As an operator, I want health checks so that deployment systems can distinguish process liveness from database readiness.

**Acceptance Criteria:**
- [ ] Add `GET /health/live`.
- [ ] Add `GET /health/ready`.
- [ ] Liveness does not depend on PostgreSQL.
- [ ] Readiness verifies PostgreSQL connectivity and required catalog availability.
- [ ] Health responses do not expose secrets or internal stack traces.
- [ ] Typecheck passes.
- [ ] API integration tests pass.

### US-022: Add Structured Backend Logging
**Description:** As an operator, I want structured logs so that API failures are diagnosable without flooding stdout with engine debug messages.

**Acceptance Criteria:**
- [ ] Log request id, route, method, status, duration, session id when safe, and stable error code.
- [ ] Do not log raw device tokens, raw session tokens, full snapshots, or PostgreSQL credentials.
- [ ] Route engine logs through an injected logger for the backend path.
- [ ] Production backend execution does not emit verbose attribute-by-attribute engine debug logs by default.
- [ ] Tests verify token redaction and production log suppression.
- [ ] Typecheck passes.
- [ ] Tests pass.

### US-023: Add Consistent API Error Envelope
**Description:** As a Web developer, I want stable API errors so that the client can handle authentication, validation, conflicts, and compatibility failures predictably.

**Acceptance Criteria:**
- [ ] Define error envelope fields: stable code, message, request id, optional safe details.
- [ ] Map validation failures to HTTP `400` or `422`.
- [ ] Map invalid or missing tokens to HTTP `401` or `403`.
- [ ] Map missing resources to HTTP `404`.
- [ ] Map stale writes and overwrite-confirmation failures to HTTP `409`.
- [ ] Map unexpected failures to HTTP `500` without exposing stack traces.
- [ ] Reuse P4 contract error codes where applicable.
- [ ] Typecheck passes.
- [ ] API integration tests pass.

### US-024: Add Web API Client Adapter
**Description:** As a frontend developer, I want a typed Web API client adapter so that Vue components do not embed transport details.

**Acceptance Criteria:**
- [ ] Add typed methods for device bootstrap, session creation, save list, restore, manual save, choice execution, catalog read, and health checks where needed.
- [ ] Store `deviceToken` and active `sessionToken` only through the Web platform adapter.
- [ ] Keep API base URL configurable for local and deployed environments.
- [ ] Normalize API errors into client-safe categories.
- [ ] Do not add API calls directly inside presentation-only components.
- [ ] Typecheck passes.
- [ ] Tests pass.

### US-025: Add Web Save Slot Selection Flow
**Description:** As a Web player, I want to choose one of three slots when starting or continuing so that multiple lives are manageable.

**Acceptance Criteria:**
- [ ] Display all three slots with empty or occupied state.
- [ ] Allow continuing an occupied slot.
- [ ] Allow starting a new life in an empty slot.
- [ ] Require explicit confirmation before overwriting an occupied slot.
- [ ] Show loading, authentication failure, server unavailable, compatibility failure, and stale-conflict states.
- [ ] Preserve desktop and mobile usability without a visual redesign.
- [ ] Typecheck passes.
- [ ] Build passes.
- [ ] Verify in browser using dev-browser skill.

### US-026: Switch Web Gameplay Progression to API Sessions
**Description:** As a Web player, I want gameplay choices and saves routed through the backend so that refresh and future platform clients share one authoritative progression model.

**Acceptance Criteria:**
- [ ] New game uses `POST /v1/sessions`.
- [ ] Continue game uses `POST /v1/sessions/restore`.
- [ ] Choice execution uses `POST /v1/sessions/{sessionId}/choices`.
- [ ] Manual save uses `POST /v1/sessions/{sessionId}/save`.
- [ ] Refreshing the browser allows an occupied slot to resume from PostgreSQL.
- [ ] Disable duplicate choice submission while a request is pending.
- [ ] Handle HTTP `409` by stopping further mutation and prompting the player to reload the current save.
- [ ] Existing UI pacing remains a Web concern.
- [ ] Typecheck passes.
- [ ] Build passes.
- [ ] Verify in browser using dev-browser skill.

### US-027: Add PostgreSQL and API Integration Test Entry
**Description:** As a maintainer, I want a dedicated P6B integration-test entry so that persistence and API behavior can be verified independently.

**Acceptance Criteria:**
- [ ] Add a command that runs migrations against an isolated PostgreSQL test database.
- [ ] Test bootstrap, three-slot listing, new session, overwrite confirmation, restore, choice execution, automatic save, manual save, replay append, catalog read, health checks, and token rejection.
- [ ] Test schema, engine, and catalog incompatibility rejection.
- [ ] Test optimistic concurrency with two competing writes.
- [ ] Test transaction rollback after an injected failure.
- [ ] Tests clean up their own isolated database state.
- [ ] Typecheck passes.
- [ ] Tests pass.

### US-028: Add P6B Persistence and API Gate
**Description:** As a maintainer, I want a dedicated P6B gate so that backend foundation work cannot regress proven gameplay behavior.

**Acceptance Criteria:**
- [ ] Gate runs typecheck.
- [ ] Gate runs Web build.
- [ ] Gate runs P4 contract tests.
- [ ] Gate runs P5 headless unit and deterministic parity tests.
- [ ] Gate runs P6B PostgreSQL and API integration tests.
- [ ] Gate runs P3 golden-line, midlife, and experience-health gates.
- [ ] Gate returns a non-zero exit code on any blocker.
- [ ] Tests pass.

### US-029: Update Backend Deployment Documentation
**Description:** As an operator, I want backend setup documentation so that the service and PostgreSQL dependency can be deployed consistently.

**Acceptance Criteria:**
- [ ] Document required environment variables without embedding secrets.
- [ ] Document PostgreSQL creation, migration, catalog seeding, backend startup, Web API URL configuration, and health-check commands.
- [ ] Document backup expectations for PostgreSQL before production deployment.
- [ ] Document that HTTPS termination is required in deployed environments because tokens are bearer credentials.
- [ ] Document known P6B limitations and deferred work.
- [ ] Documentation contains no local absolute paths.
- [ ] Typecheck passes.

### US-030: Produce P6B Closure Report
**Description:** As a project owner, I want a P6B closure report so that the project can decide whether to proceed to account migration, mini-program integration, or runtime hardening.

**Acceptance Criteria:**
- [ ] Report lists completed P6B user stories.
- [ ] Report includes migration, schema, repository, API, Web integration, and gate commands.
- [ ] Report confirms whether fresh database migration, save restore, refresh resume, stale-write rejection, replay append, and catalog pinning work.
- [ ] Report records remaining Vue-reactivity, singleton, direct randomness, direct time, and logging risks if any remain.
- [ ] Report recommends the next phase with evidence.
- [ ] Documentation contains no local absolute paths.
- [ ] Typecheck passes.

## 5. Functional Requirements

- FR-1: The backend must use self-hosted PostgreSQL as the canonical persistence store.
- FR-2: PostgreSQL schema changes must be applied through ordered repository-managed SQL migrations.
- FR-3: The backend must expose a lightweight TypeScript Node HTTP service.
- FR-4: The backend must issue opaque `deviceToken` and `sessionToken` credentials and store only one-way hashes.
- FR-5: Each anonymous device must have exactly three numbered save slots.
- FR-6: Snapshots must be immutable rows. Progression creates a new row and advances the slot pointer.
- FR-7: Snapshot JSONB must conform to the P4 `GameStateSnapshot` contract and P5 conversion boundary.
- FR-8: Snapshot hashes must be computed server-side from canonical serialized state.
- FR-9: Event catalog versions must be immutable and addressable by version.
- FR-10: Snapshots and sessions must pin engine version and event catalog version.
- FR-11: The server must reject unsupported snapshot schema, engine, or catalog versions rather than silently continue.
- FR-12: The backend must load canonical snapshot state and execute choices through the P5 headless session.
- FR-13: The backend must not trust client-provided state deltas, hashes, user ids, or ownership claims.
- FR-14: New-game creation, choice progression, terminal state, and explicit manual save must persist atomically.
- FR-15: Replay actions must be append-only and include before/after snapshot hashes.
- FR-16: Save mutations must enforce optimistic concurrency using expected slot version and expected snapshot id.
- FR-17: Stale save mutations must return HTTP `409` and must not overwrite newer state.
- FR-18: The API must expose device bootstrap, session creation, save list, restore, manual save, choice execution, catalog bundle read, liveness, and readiness endpoints.
- FR-19: API errors must use a stable structured envelope.
- FR-20: Production logs must be structured, redact tokens, and suppress verbose engine debug output by default.
- FR-21: The Web client must use the API-backed flow for new game, continue game, choice execution, manual save, and refresh resume.
- FR-22: The Web client must remain usable on desktop and mobile without a visual redesign.
- FR-23: P3, P4, and P5 gates must remain green.

## 6. API Surface

| Method | Path | Purpose | Authentication |
| --- | --- | --- | --- |
| `POST` | `/v1/devices/bootstrap` | Create or resume anonymous device identity | Optional existing `deviceToken` |
| `GET` | `/v1/saves` | List three slots for a device | `deviceToken` |
| `POST` | `/v1/sessions` | Start a new game in a selected slot | `deviceToken` |
| `POST` | `/v1/sessions/restore` | Resume an occupied slot | `deviceToken` |
| `POST` | `/v1/sessions/{sessionId}/choices` | Execute one trusted player choice and automatic progression | `sessionToken` |
| `POST` | `/v1/sessions/{sessionId}/save` | Explicitly persist the current session | `sessionToken` |
| `GET` | `/v1/catalog/bundle` | Read an immutable event catalog bundle by version | Public read |
| `GET` | `/health/live` | Process liveness | Public read |
| `GET` | `/health/ready` | Database and catalog readiness | Public read |

Token transport details must be documented during implementation. Deployed environments must use HTTPS. Raw tokens must never appear in logs or PostgreSQL rows.

## 7. PostgreSQL Model

### 7.1 Required Tables

| Table | Purpose |
| --- | --- |
| `anonymous_devices` | Anonymous device ownership and hashed device credentials |
| `game_sessions` | Hashed session credentials and active gameplay-session metadata |
| `save_slots` | Three numbered slots per anonymous device and pointer to current snapshot |
| `game_snapshots` | Immutable canonical `GameStateSnapshot` JSONB rows |
| `replay_actions` | Append-only audit events with deterministic integrity metadata |
| `event_catalog_versions` | Immutable versioned event catalog bundles |
| migration bookkeeping | Records applied ordered SQL migrations |

### 7.2 Canonical Storage Rules

- Canonical snapshot state is stored as validated JSONB.
- Life-memory summaries remain derived from snapshot source fields.
- UI feedback display state, pending animations, modal state, and browser-only timing state are not canonical data.
- Snapshot content hashes are computed by the backend.
- Catalog bundle content hashes are computed during seeding or publication.
- Client-submitted deltas and client-submitted ownership identifiers are never authoritative.

### 7.3 Transaction Rules

The following writes must commit or roll back as one transaction:

- Device bootstrap row creation when a new token is issued.
- New session row, initial snapshot row, replay marker, and slot-pointer update.
- Restored session row and replay marker.
- Choice execution snapshot row, replay actions, session-status update, and slot-pointer update.
- Manual-save snapshot row when needed, replay action, and slot-pointer update.

## 8. Non-Goals

- No account registration, login, password reset, OAuth, or user profile UI.
- No conversion of anonymous saves into registered-account saves.
- No cross-device account synchronization.
- No merge UI for divergent cloud saves.
- No offline-first mutation queue.
- No export/import workflow.
- No replay viewer UI.
- No event-authoring admin console.
- No database-backed event editing workflow.
- No mini-program pages or mini-program packaging.
- No Web visual redesign.
- No gameplay rebalance or content expansion.
- No 51-80 content work.
- No broad rewrite of Vue-reactive core internals.
- No broad removal of every existing global singleton.
- No arbitrary backward migration of unsupported legacy snapshots.
- No production infrastructure provisioning beyond documented PostgreSQL and backend requirements.

## 9. Design Considerations

- The Web changes must remain utilitarian: expose slot selection, loading states, conflict handling, and save status without redesigning the game.
- Occupied slots should show the minimum useful resume metadata: label, age, last update time, and terminal status.
- Overwriting an occupied slot requires explicit confirmation.
- While a choice request is pending, the choice controls must be disabled to prevent duplicate mutations.
- A stale-write response must stop further local mutation and direct the player to reload the current server snapshot.
- Server unavailability must be visible to the player. The client must not claim a save succeeded when the backend did not commit it.

## 10. Technical Considerations

- Reuse P4 contract types and P5 headless interfaces where they fit. Do not duplicate snapshot or choice contracts with subtly different shapes.
- Use explicit SQL migrations rather than an ORM-managed schema abstraction for P6B.
- Keep HTTP handlers thin. Put ownership checks, transactions, and engine invocation in application services.
- Keep SQL in repositories. Do not scatter SQL across Vue components or route handlers.
- Prefer one backend process and one PostgreSQL database for this phase. Do not introduce distributed queues, caches, or background workers.
- The backend may use a PostgreSQL driver and a minimal HTTP library if needed. Avoid unrelated runtime dependencies.
- Use cryptographically strong opaque tokens. Store hashes using a keyed or otherwise attack-resistant construction appropriate for high-entropy bearer tokens.
- Use UUIDs or an equivalently collision-resistant server-generated identifier for public ids.
- Do not log snapshots, token values, or database credentials.
- Preserve catalog pinning: a saved life must not silently move to a different event catalog version.
- Preserve deterministic execution: backend adapters must supply random, time, catalog, snapshot conversion, and logger dependencies explicitly where the service path requires them.
- Treat the current internal Vue reactivity in wrapped core classes as known debt. P6B may isolate or remove only the portions that prevent reliable backend execution.
- PostgreSQL integration tests require an isolated test database. Tests must not target a developer's non-test database accidentally.

## 11. Implementation Order

1. Baseline and guardrails: US-001 to US-002.
2. PostgreSQL foundation: US-003 to US-006.
3. Ownership and persistence repositories: US-007 to US-012.
4. Session and progression APIs: US-013 to US-023.
5. Web integration: US-024 to US-026.
6. Automated gate and documentation: US-027 to US-030.

Implementation must follow this order. Each story must record verification evidence before the next story begins.

## 12. Success Metrics

- A fresh PostgreSQL database migrates successfully from zero state.
- A new browser profile receives one anonymous device identity and exactly three save slots.
- A player can start a new life, execute a choice, refresh the browser, restore the slot, and continue.
- Successful progression automatically advances the persisted slot version.
- Manual save returns durable snapshot metadata.
- Two competing stale-equivalent writes result in exactly one committed mutation and one HTTP `409`.
- Snapshot rows are immutable and carry schema, engine, catalog, and content-hash metadata.
- Replay actions append in monotonic order with before/after snapshot hashes.
- Event catalog bundle reads preserve version pinning.
- Logs contain no raw device tokens, raw session tokens, full snapshots, or PostgreSQL credentials.
- Production backend tests do not flood stdout with verbose engine attribute logs.
- Web desktop and mobile save-slot flows are verified in browser.
- P3, P4, P5, and P6B gates pass.

## 13. Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Vue-reactive core leaks into backend execution | Service behavior remains coupled to frontend runtime assumptions | Use the P5 headless boundary; fix only service-path blockers; record remaining debt in closure report |
| Shared singleton state leaks across requests | One player's life can contaminate another session | Construct or resolve isolated headless sessions per request/session; add concurrent-session tests |
| Browser submits stale choice after another tab progresses | Newer saves can be overwritten | Require expected slot version and snapshot id; enforce transaction-level compare-and-swap |
| Client sends forged state deltas | Save integrity is lost | Load canonical snapshot server-side; execute trusted engine logic server-side |
| Catalog changes break old saves | Existing lives become nondeterministic | Persist immutable catalog bundles and pin version in session and snapshot rows |
| Token leakage in logs or database | Anonymous saves can be hijacked | Store only hashes; redact logs; require HTTPS in deployment |
| Test commands mutate report fixtures or non-test databases | Verification creates noisy diffs or corrupts state | Use isolated test databases and explicit cleanup; keep report generation controlled |
| Verbose engine logging floods backend stdout | Operational diagnosis becomes difficult | Inject backend logger and suppress debug-level engine logs by default |

## 14. Rollback Strategy

- Keep the pre-P6B Web local path available only as a temporary migration rollback until API-backed save restore is verified in the deployment environment.
- Roll back Web API activation independently from database rows; do not delete persisted snapshots during client rollback.
- Apply forward SQL migrations for schema corrections. Do not edit previously applied production migrations.
- Before production migration, back up PostgreSQL.
- If a catalog seed is invalid, publish a corrected new catalog version instead of mutating an existing version.
- If backend choice execution is disabled, block remote mutation explicitly. Do not silently claim saves succeeded locally.

## 15. Open Questions

- Which minimal HTTP library should the implementation use after inspecting repository constraints?
- Should token transport use authorization headers exclusively, or a dedicated device header plus authorization header for sessions?
- Should slot labels be user-editable in P6B or default to fixed labels such as `Slot 1`, `Slot 2`, and `Slot 3`?
- Should explicit manual save create a new snapshot when no server state changed, or append only a replay marker? The default requirement is to avoid redundant snapshots.
- How long should inactive gameplay sessions remain valid before revocation?
- Should the temporary pre-P6B Web local path be removed immediately after deployment verification or in a dedicated cleanup phase?

## 16. Approval Gate

This PRD does not authorize implementation.

After this markdown PRD is reviewed and approved:

1. Generate `docs/PRD/p6b-postgresql-save-persistence-and-session-api.prd.json` using the Ralph PRD converter workflow.
2. Review and approve the JSON story order.
3. Implement stories strictly in priority order.
4. Record verification evidence after each story.

