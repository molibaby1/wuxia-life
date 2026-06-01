# PRD: P4 Engine Contract and Service Boundary

## Introduction

P3 has established a credible 0-50 single-client gameplay experience: deterministic route samples pass, midlife route arcs are covered, romance/family is reachable, death risk is readable, key-choice payoff gaps are closed, and life memory is available. The next risk is not missing content. The next risk is letting a proven single-client engine grow into backend, database, web, and mini-program targets without a stable contract.

P4 defines the contracts and service boundaries needed before frontend/backend separation. It does not implement a backend, connect a database, add accounts, ship cloud saves, or build a mini-program. It may add TypeScript contract types, schema definitions, validation helpers, fixture data, and contract tests, but it must not change gameplay runtime behavior.

The phase should answer one question clearly: when the engine later moves behind an API, what are the stable inputs, outputs, snapshots, replay logs, event catalog boundaries, save schema rules, and adapter responsibilities?

## Goals

- Define a stable `GameState` snapshot contract for persistence and future service transfer.
- Define a `ChoiceExecution` contract covering request, response, state transition, feedback, event history, route state, and life memory changes.
- Define a replay/audit log contract that can reproduce deterministic lives from seed, event catalog version, and choice log.
- Define an event catalog service boundary for future backend delivery without moving event loading in this phase.
- Define save schema versioning and migration policy without implementing a database.
- Define future database model boundaries for users, saves, event catalog versions, replay logs, and derived summaries.
- Isolate frontend adapter responsibilities from pure engine contract responsibilities.
- Add contract tests and fixtures that verify serialization, replay shape, and compatibility without changing gameplay behavior.
- Preserve existing P3 gates and gameplay behavior.

## User Stories

### US-001: Rebaseline Current Engine Boundaries
**Description:** As a maintainer, I want a read-only map of current engine, UI, save, event, and simulation boundaries so that P4 contracts are grounded in the real codebase.

**Acceptance Criteria:**
- [ ] Inventory current `GameState`, save manager, event loader, choice execution, feedback, route state, life memory, and simulation entry points.
- [ ] Mark each entry point as core engine, UI adapter, persistence adapter, report/simulation, or deprecated.
- [ ] Identify runtime dependencies that would block future backend execution.
- [ ] Produce a P4 boundary baseline report.
- [ ] Do not modify business code.
- [ ] Typecheck passes.

### US-002: Define P4 Non-Runtime-Behavior Guardrails
**Description:** As a project owner, I want P4 to avoid accidental gameplay changes so that contract work does not destabilize the proven P3 experience.

**Acceptance Criteria:**
- [ ] Document that P4 may add types, schemas, fixtures, validation helpers, and contract tests.
- [ ] Document that P4 must not change event selection, effect execution, choice outcomes, route logic, save behavior, or UI behavior unless a later approved PRD says so.
- [ ] Define verification commands that prove P3 behavior still passes.
- [ ] Define what counts as a prohibited runtime behavior change.
- [ ] Typecheck passes.

### US-003: Define Game State Snapshot Contract
**Description:** As a backend planner, I want a stable game state snapshot contract so that future persistence and API transport have a single source of truth.

**Acceptance Criteria:**
- [ ] Define a versioned `GameStateSnapshot` contract.
- [ ] Classify fields as persisted, derived, volatile, deprecated, or forbidden.
- [ ] Define required metadata: schema version, engine version, event catalog version, created time, updated time, and source platform.
- [ ] Document how route state, relationships, life memory inputs, event history, and save metadata are represented.
- [ ] Typecheck passes.

### US-004: Add Game State Snapshot Types
**Description:** As a developer, I want TypeScript types for the snapshot contract so that future adapters can compile against a stable shape.

**Acceptance Criteria:**
- [ ] Add TypeScript types or interfaces for `GameStateSnapshot` and related metadata.
- [ ] Types are exported from an appropriate contract module.
- [ ] Types do not replace the current runtime `GameState`.
- [ ] No gameplay runtime behavior changes.
- [ ] Typecheck passes.

### US-005: Add Snapshot Serialization Fixture
**Description:** As a maintainer, I want a representative snapshot fixture so that serialization expectations are visible and testable.

**Acceptance Criteria:**
- [ ] Add a fixture or sample object representing a valid 0-50 game state snapshot.
- [ ] Fixture includes route state, relationships, event history, choice history, save metadata, and life memory source fields.
- [ ] Fixture contains no local absolute paths.
- [ ] Fixture can be parsed by contract tests.
- [ ] Typecheck passes.
- [ ] Tests pass.

### US-006: Add Snapshot Contract Tests
**Description:** As a maintainer, I want tests proving snapshots remain serializable so that future backend or mini-program work does not inherit hidden client-only state.

**Acceptance Criteria:**
- [ ] Test that a valid snapshot can be JSON stringified and parsed.
- [ ] Test that derived or volatile fields are not required for persistence.
- [ ] Test that required metadata is present.
- [ ] Test that forbidden fields are rejected or reported by contract validation.
- [ ] Typecheck passes.
- [ ] Tests pass.

### US-007: Define Choice Execution Request Contract
**Description:** As a backend planner, I want a standard request shape for executing a choice so that Web, mini-program, and future API callers can use the same contract.

**Acceptance Criteria:**
- [ ] Define required request fields: snapshot id or state, event id, choice id, optional outcome id, player input metadata, seed or random context when needed.
- [ ] Define optional request fields for platform, client version, and trace id.
- [ ] Define which fields must never be trusted from the client in a future backend implementation.
- [ ] Document validation failures and error categories.
- [ ] Typecheck passes.

### US-008: Define Choice Execution Response Contract
**Description:** As a client developer, I want a standard response shape after a choice so that UI, save, replay, and life memory can update consistently.

**Acceptance Criteria:**
- [ ] Define response fields: next snapshot, feedback, event history append, route changes, relationship changes, life memory delta, generated logs, and next event hints.
- [ ] Define success and failure response shapes.
- [ ] Define how player-facing feedback is separated from diagnostic data.
- [ ] Define how warnings and validation errors are returned.
- [ ] Typecheck passes.

### US-009: Add Choice Execution Contract Types
**Description:** As a developer, I want TypeScript types for choice execution request and response so that future adapters share the same signatures.

**Acceptance Criteria:**
- [ ] Add TypeScript types for choice execution request, success response, failure response, and diagnostics.
- [ ] Types reference existing choice feedback and route/life memory concepts where appropriate.
- [ ] Types do not replace current choice execution runtime.
- [ ] No gameplay runtime behavior changes.
- [ ] Typecheck passes.

### US-010: Add Choice Execution Contract Fixtures
**Description:** As a maintainer, I want sample request and response fixtures so that future API work has concrete examples.

**Acceptance Criteria:**
- [ ] Add at least one valid choice execution request fixture.
- [ ] Add at least one valid choice execution success response fixture.
- [ ] Add at least one validation failure response fixture.
- [ ] Fixtures contain no local absolute paths.
- [ ] Typecheck passes.
- [ ] Tests pass.

### US-011: Define Replay Log Contract
**Description:** As a maintainer, I want a replay log contract so that a life can be reproduced from initial conditions and choices.

**Acceptance Criteria:**
- [ ] Define replay log metadata: replay version, engine version, event catalog version, initial seed, start snapshot hash, and platform.
- [ ] Define replay entries for choice execution, auto event execution, save/load markers, and terminal state.
- [ ] Define what data is required for deterministic replay and what data is diagnostic only.
- [ ] Define integrity checks such as snapshot hash before and after execution.
- [ ] Typecheck passes.

### US-012: Add Replay Log Types and Fixtures
**Description:** As a developer, I want replay log types and examples so that simulation and future backend audit can share one shape.

**Acceptance Criteria:**
- [ ] Add TypeScript types for replay log and replay entries.
- [ ] Add at least one 0-50 replay log fixture.
- [ ] Fixture includes multiple choice entries and at least one route or relationship change.
- [ ] Fixture is serializable and contains no local absolute paths.
- [ ] Typecheck passes.
- [ ] Tests pass.

### US-013: Add Replay Contract Tests
**Description:** As a maintainer, I want contract tests for replay logs so that future changes do not break auditability.

**Acceptance Criteria:**
- [ ] Test that replay log fixtures parse and validate.
- [ ] Test that required replay metadata is present.
- [ ] Test that replay entries contain event id, action type, age/time context, and snapshot hash fields.
- [ ] Test that malformed replay entries are rejected or reported.
- [ ] Typecheck passes.
- [ ] Tests pass.

### US-014: Define Event Catalog Service Boundary
**Description:** As a backend planner, I want an event catalog boundary so that future backend service work can move events out of the client without changing game rules.

**Acceptance Criteria:**
- [ ] Define catalog concepts: catalog version, event bundle, event id, route track, age range, status, and validation state.
- [ ] Define query boundaries for age, route, event status, and active/deferred scope.
- [ ] Define which event filtering remains engine-side and which may become service-side later.
- [ ] Define payload constraints to avoid exposing non-triggerable hidden events unnecessarily.
- [ ] Typecheck passes.

### US-015: Add Event Catalog Contract Types
**Description:** As a developer, I want TypeScript types for event catalog service payloads so that current data can be checked against future API shapes.

**Acceptance Criteria:**
- [ ] Add types for event catalog metadata, event bundle request, event bundle response, and validation summary.
- [ ] Types reference existing event ids and active/deferred classification concepts.
- [ ] Types do not change the current `EventLoader` runtime behavior.
- [ ] Typecheck passes.

### US-016: Add Event Catalog Contract Validation Report
**Description:** As a maintainer, I want a report comparing current event assets to the future catalog contract so that migration risk is visible.

**Acceptance Criteria:**
- [ ] Report current active, candidate, deferred, broken, and dead event counts against catalog contract categories.
- [ ] Identify event files or fields that do not fit the future catalog contract.
- [ ] Identify any event payload fields that should remain server-only or diagnostic-only later.
- [ ] Do not modify event runtime behavior.
- [ ] Typecheck passes.

### US-017: Define Save Schema Versioning Policy
**Description:** As a platform maintainer, I want a save schema versioning policy so that future database persistence does not create unlimited compatibility debt.

**Acceptance Criteria:**
- [ ] Define save schema version format and compatibility range.
- [ ] Define readable, migratable, unsupported legacy, and unsupported future states.
- [ ] Define when the system should reject saves instead of migrating.
- [ ] Define player-facing and diagnostic messages for incompatible saves.
- [ ] Typecheck passes.

### US-018: Define Save Migration Strategy
**Description:** As a maintainer, I want a migration strategy for future persisted saves so that schema changes are deliberate.

**Acceptance Criteria:**
- [ ] Define how migrations are named, ordered, and tested.
- [ ] Define allowed migration operations and forbidden migration shortcuts.
- [ ] Define rollback expectations for failed migration attempts.
- [ ] Define fixture requirements for each future migration.
- [ ] No database implementation is added.
- [ ] Typecheck passes.

### US-019: Define Future Database Model Boundary
**Description:** As a backend planner, I want future database models defined at the boundary level so that implementation can be planned without coupling current gameplay to a database.

**Acceptance Criteria:**
- [ ] Define conceptual tables or collections for users, save slots, game snapshots, replay logs, event catalog versions, and migration records.
- [ ] Define primary identifiers and relationships at a conceptual level.
- [ ] Define which data is canonical and which data is derived.
- [ ] Define what must not be stored, such as volatile UI state or raw debug-only state.
- [ ] No database driver, ORM, migration file, or server is implemented.
- [ ] Typecheck passes.

### US-020: Define Account and Ownership Boundary
**Description:** As a backend planner, I want ownership rules for future accounts and saves so that cloud persistence can be designed safely later.

**Acceptance Criteria:**
- [ ] Define ownership concepts for anonymous local play, logged-in user play, save slot ownership, and export/import ownership.
- [ ] Define what changes when an anonymous save is attached to a future account.
- [ ] Define authorization questions that must be answered before backend implementation.
- [ ] No account system is implemented.
- [ ] Typecheck passes.

### US-021: Define Frontend Adapter Boundary
**Description:** As a frontend developer, I want a boundary between UI adapters and engine contracts so that Web and mini-program clients can share game logic later.

**Acceptance Criteria:**
- [ ] Define responsibilities of UI components, composables, persistence adapters, engine contracts, and report/simulation code.
- [ ] Identify current direct dependencies on browser APIs, local storage, Vue reactivity, alerts, prompts, or DOM behavior.
- [ ] Define which dependencies must be wrapped before service extraction.
- [ ] Do not change current UI behavior.
- [ ] Typecheck passes.

### US-022: Define Platform Adapter Requirements
**Description:** As a future multi-platform maintainer, I want platform adapter requirements so that Web and mini-program behavior can be planned consistently.

**Acceptance Criteria:**
- [ ] Define adapter requirements for storage, time, random seed, logging, network, and UI feedback display.
- [ ] Define which adapter APIs must be synchronous or asynchronous.
- [ ] Define how platform differences should be represented in request metadata.
- [ ] No mini-program implementation is added.
- [ ] Typecheck passes.

### US-023: Add Contract Validation Helpers
**Description:** As a developer, I want lightweight validation helpers for contract fixtures so that schema drift is caught without adding a heavy runtime framework.

**Acceptance Criteria:**
- [ ] Add validation helpers for snapshot, choice execution, replay log, and event catalog fixtures.
- [ ] Validation helpers return structured success or error results.
- [ ] Validation helpers are used by contract tests or reports.
- [ ] Helpers do not run in gameplay unless explicitly imported by tests/reports.
- [ ] Typecheck passes.
- [ ] Tests pass.

### US-024: Add Contract Test Suite Entry
**Description:** As a maintainer, I want a dedicated contract test entry so that P4 boundaries can be verified independently of full gameplay simulation.

**Acceptance Criteria:**
- [ ] Add a contract test file or test suite covering snapshot, choice execution, replay, event catalog, and save schema fixtures.
- [ ] Contract tests can run through the existing test command or a documented script.
- [ ] Contract tests do not require a browser, backend, or database.
- [ ] Typecheck passes.
- [ ] Tests pass.

### US-025: Define Backend API Draft Boundaries
**Description:** As a backend planner, I want draft API boundaries so that future implementation can start from stable contracts instead of improvising endpoints.

**Acceptance Criteria:**
- [ ] Define draft endpoint boundaries for fetching event catalog data, creating/loading saves, executing choices, and fetching replay logs.
- [ ] Define request and response shapes by referencing P4 contracts.
- [ ] Define non-goals for actual server implementation.
- [ ] Define likely error categories.
- [ ] No backend server or HTTP client is implemented.
- [ ] Typecheck passes.

### US-026: Define Service Extraction Risks and Migration Order
**Description:** As a project owner, I want the future extraction order and risks documented so that backend work starts safely after P4.

**Acceptance Criteria:**
- [ ] Define recommended extraction order: contracts, event catalog read service, snapshot persistence, choice execution service, replay/audit, accounts.
- [ ] Identify risks for determinism, event version drift, save compatibility, client/server trust, and mini-program storage limits.
- [ ] Define mitigation for each risk.
- [ ] Define which P3 gates must remain green during extraction.
- [ ] Typecheck passes.

### US-027: Update Documentation for P4 Architecture Readiness
**Description:** As a maintainer, I want project documentation to explain the new contract layer so that future sessions do not skip boundaries and jump straight into backend code.

**Acceptance Criteria:**
- [ ] Add or update documentation explaining P4 contracts and service boundaries.
- [ ] Link to snapshot, choice execution, replay, event catalog, save schema, database boundary, and adapter boundary docs.
- [ ] State clearly that backend/database implementation is out of P4 scope.
- [ ] Documentation contains no local absolute paths.
- [ ] Typecheck passes.

### US-028: Produce P4 Closure Report
**Description:** As a project owner, I want a P4 closure report so that the project can decide when to start actual frontend/backend separation implementation.

**Acceptance Criteria:**
- [ ] Report lists completed P4 user stories.
- [ ] Report includes contract files, fixtures, validation helpers, and test commands.
- [ ] Report confirms no gameplay runtime behavior changes were intended.
- [ ] Report includes verification results for typecheck, tests, and P3 gates.
- [ ] Report recommends whether to proceed to backend implementation PRD.
- [ ] Documentation contains no local absolute paths.
- [ ] Typecheck passes.
 
## Functional Requirements

- FR-1: The project must define a versioned `GameStateSnapshot` contract.
- FR-2: The project must define choice execution request and response contracts.
- FR-3: The project must define a replay/audit log contract.
- FR-4: The project must define event catalog service boundary contracts.
- FR-5: The project must define save schema versioning and migration policy.
- FR-6: The project must define future database model boundaries without implementing a database.
- FR-7: The project must define frontend and platform adapter boundaries.
- FR-8: Contract types and fixtures must be serializable and testable.
- FR-9: Contract validation must be available through tests or reports.
- FR-10: P4 must not change gameplay runtime behavior.
- FR-11: P3 experience gates must remain valid after P4.
- FR-12: Documentation must clearly distinguish contract planning from backend implementation.

## Non-Goals

- No backend server implementation.
- No database connection, ORM, or migration implementation.
- No account system implementation.
- No cloud save implementation.
- No HTTP client integration.
- No mini-program implementation.
- No large UI redesign.
- No event loading runtime migration to a service.
- No change to event selection rules, choice execution behavior, route logic, death logic, or feedback behavior.
- No 51-80 content expansion.
- No activation of deferred event content.

## Design Considerations

- P4 is an architecture-readiness phase, not a visible player feature phase.
- Contract names should be clear enough for future backend, frontend, and test agents to reuse.
- Examples and fixtures should be concrete, small, and readable.
- Derived data such as life memory should be identified separately from canonical state.
- Client-provided data should be treated as untrusted in future backend design.
- The current Web client should continue behaving exactly as it does after P3.

## Technical Considerations

- Prefer TypeScript types, JSON fixtures, and simple validators over introducing a heavy schema framework unless later approved.
- Contract modules should avoid importing Vue, DOM APIs, browser storage, or UI components.
- Validation helpers should be safe to run in Node test/report contexts.
- Contract files should be organized so future backend packages can copy or import them with minimal coupling.
- Snapshot and replay contracts should include version fields to prevent silent drift.
- Event catalog contracts should account for active/deferred status and event catalog versioning.
- Save migration policy should avoid unlimited backward compatibility.

## Success Metrics

- Snapshot, choice execution, replay, event catalog, and save schema contracts are documented.
- Contract types compile without changing runtime gameplay behavior.
- Contract fixtures are serializable and pass contract tests.
- Contract tests run without browser, backend, database, or network.
- P3 gates still pass after P4 contract additions.
- Future backend implementation can be planned from documented request/response and persistence boundaries.
- P4 closure report recommends a clear next phase for actual backend/API implementation.

## Open Questions

- Should P4 introduce a lightweight schema library later, or keep validation as hand-written TypeScript helpers?
- Should contract modules live under `src/contracts`, `src/types/contracts`, or another directory?
- Should fixtures be stored in `tests/fixtures`, `src/data/contracts`, or `docs` artifacts?
- Should future backend own event filtering entirely, or should filtering remain split between catalog service and engine?
- Should the next phase implement event catalog service first or snapshot persistence first?

