# PRD: P5 Headless Engine and Catalog Read Service

## Introduction

P4 defined stable contracts and service boundaries for snapshots, choice execution, replay logs, event catalog payloads, save schema policy, future database models, and platform adapters. The next step is to prove those boundaries in executable code before introducing HTTP services, databases, accounts, cloud saves, or mini-program integration.

P5 extracts a headless engine session that can run in Node without Vue, DOM APIs, browser storage, alerts, prompts, or UI components. The headless session must support hydration, next-event selection, automatic event progression, choice execution, serialization, restart, terminal state, and life memory derivation. P5 also adds an event catalog read interface with an in-memory adapter backed by current event data.

The current Web gameplay path must remain behaviorally stable. P5 uses dual-track parity tests to compare existing runtime behavior with the new headless path across deterministic 0-50 replay scenarios.

## Goals

- Extract a Node-runnable headless engine session from current gameplay logic.
- Support `hydrate`, `getNextEvent`, automatic progression, `executeChoice`, `serialize`, restart, terminal state, and life memory derivation.
- Remove Vue reactivity and browser dependencies from the new headless execution path.
- Define an event catalog read interface and in-memory adapter without adding HTTP.
- Keep event filtering rules in the engine while the catalog adapter supplies versioned event bundles.
- Verify parity between current runtime and headless execution for snapshots, feedback, route state, life memory, and event history.
- Run deterministic 0-50 replay parity scenarios.
- Avoid new runtime dependencies.
- Preserve existing Web behavior and P3/P4 gates.

## User Stories

### US-001: Rebaseline Runtime Coupling
**Description:** As a maintainer, I want a fresh map of runtime dependencies so that headless extraction addresses real Vue and browser coupling.

**Acceptance Criteria:**
- [ ] Inventory Vue reactive imports used by engine execution paths.
- [ ] Inventory global singleton usage in engine, composable, save, and event-loading paths.
- [ ] Inventory DOM, browser storage, prompt, alert, and animation-frame dependencies.
- [ ] Classify each dependency as core logic, Web adapter responsibility, test/report-only, or deprecated.
- [ ] Produce a P5 runtime-coupling baseline report.
- [ ] Do not modify business code.
- [ ] Typecheck passes.

### US-002: Define P5 Runtime Behavior Guardrails
**Description:** As a project owner, I want explicit guardrails so that extraction does not silently change gameplay.

**Acceptance Criteria:**
- [ ] Document that P5 must preserve event selection, choice outcomes, feedback, route state, life memory, and event history behavior.
- [ ] Document that P5 may add headless modules, adapters, fixtures, and parity tests.
- [ ] Define prohibited changes: new gameplay systems, event rebalance, UI redesign, HTTP, database, account, cloud-save, or mini-program implementation.
- [ ] Define regression commands required after each implementation wave.
- [ ] Typecheck passes.

### US-003: Define Headless Engine Session Interface
**Description:** As a backend developer, I want a stable headless session interface so that future services can execute gameplay without UI runtime dependencies.

**Acceptance Criteria:**
- [ ] Define an interface for creating a session from initial state or hydrated snapshot.
- [ ] Define methods for `hydrate`, `getNextEvent`, automatic progression, `executeChoice`, `serialize`, restart, terminal-state read, and life-memory read.
- [ ] Define method inputs, outputs, error categories, and async behavior.
- [ ] Define session ownership and mutation rules.
- [ ] Typecheck passes.

### US-004: Define Headless Dependency Injection Boundary
**Description:** As a developer, I want explicit engine dependencies so that headless sessions do not reach into browser or global state.

**Acceptance Criteria:**
- [ ] Define required dependencies for event catalog access, random source, time source, logging, and snapshot conversion.
- [ ] Define default in-memory or deterministic implementations for tests.
- [ ] Define which dependencies are optional.
- [ ] Document that Vue, DOM APIs, and browser storage are forbidden dependencies for headless modules.
- [ ] Typecheck passes.

### US-005: Add Random Source Adapter
**Description:** As a maintainer, I want random behavior behind an adapter so that deterministic replay remains possible outside the browser.

**Acceptance Criteria:**
- [ ] Add a random source interface.
- [ ] Add a deterministic seeded implementation for tests and replay.
- [ ] Add a default runtime implementation using existing platform capability.
- [ ] Headless modules consume the adapter instead of direct random calls where extracted behavior requires randomness.
- [ ] Typecheck passes.
- [ ] Tests pass.

### US-006: Add Time Source Adapter
**Description:** As a maintainer, I want time access behind an adapter so that snapshots and replay logs are deterministic when needed.

**Acceptance Criteria:**
- [ ] Add a time source interface.
- [ ] Add fixed and runtime implementations.
- [ ] Headless session metadata and generated records can use an injected time source.
- [ ] No browser-only time dependency is introduced.
- [ ] Typecheck passes.
- [ ] Tests pass.

### US-007: Define Catalog Read Interface
**Description:** As a backend planner, I want a versioned event catalog read interface so that engine execution can stop depending on static imports later.

**Acceptance Criteria:**
- [ ] Define catalog read methods for catalog metadata, event bundle retrieval, and event lookup by id.
- [ ] Define query support for catalog version, age, route, and event status.
- [ ] Define error behavior for unknown catalog version and missing event id.
- [ ] Document that final trigger eligibility remains engine-side.
- [ ] Typecheck passes.

### US-008: Implement In-Memory Catalog Adapter
**Description:** As a developer, I want an in-memory catalog adapter so that P5 can prove service boundaries without HTTP or database work.

**Acceptance Criteria:**
- [ ] Implement the catalog read interface using current event data.
- [ ] Adapter returns versioned event bundles.
- [ ] Adapter supports age, route, and status query fields.
- [ ] Adapter does not change current `EventLoader` behavior.
- [ ] No HTTP server or network client is added.
- [ ] Typecheck passes.
- [ ] Tests pass.

### US-009: Add Catalog Adapter Contract Tests
**Description:** As a maintainer, I want tests for the in-memory catalog adapter so that future HTTP implementations have a behavioral reference.

**Acceptance Criteria:**
- [ ] Test catalog metadata retrieval.
- [ ] Test event lookup by id.
- [ ] Test age filtering.
- [ ] Test route and status query behavior.
- [ ] Test unknown version and missing id errors.
- [ ] Typecheck passes.
- [ ] Tests pass.

### US-010: Define Snapshot Conversion Boundary
**Description:** As a developer, I want explicit conversion between runtime state and `GameStateSnapshot` so that persistence transport is not mixed with engine internals.

**Acceptance Criteria:**
- [ ] Define runtime-state-to-snapshot conversion.
- [ ] Define snapshot-to-runtime-state hydration.
- [ ] Document persisted, derived, volatile, deprecated, and forbidden field treatment.
- [ ] Define conversion error behavior.
- [ ] Typecheck passes.

### US-011: Implement Snapshot Serialization Adapter
**Description:** As a maintainer, I want a snapshot adapter so that headless sessions can serialize and hydrate without browser storage.

**Acceptance Criteria:**
- [ ] Implement runtime-state-to-snapshot serialization.
- [ ] Implement snapshot-to-runtime-state hydration.
- [ ] Preserve route state, relationships, event history, choice history, and life-memory source fields.
- [ ] Do not import browser storage or Vue.
- [ ] Typecheck passes.
- [ ] Tests pass.

### US-012: Add Snapshot Adapter Round-Trip Tests
**Description:** As a maintainer, I want round-trip tests for snapshots so that headless hydration does not lose gameplay state.

**Acceptance Criteria:**
- [ ] Test runtime state to snapshot to runtime state round trip.
- [ ] Test route state preservation.
- [ ] Test relationship preservation.
- [ ] Test event and choice history preservation.
- [ ] Test life-memory summary equivalence after hydration.
- [ ] Typecheck passes.
- [ ] Tests pass.

### US-013: Implement Headless Session Construction
**Description:** As a backend developer, I want to construct a headless session without Vue so that gameplay can run in Node.

**Acceptance Criteria:**
- [ ] Add a headless session implementation that accepts injected dependencies.
- [ ] Session can start from initial state.
- [ ] Session can hydrate from a valid snapshot.
- [ ] Headless modules do not import Vue, DOM APIs, localStorage, prompt, alert, or UI components.
- [ ] Typecheck passes.
- [ ] Tests pass.

### US-014: Implement Headless Next Event Selection
**Description:** As a backend developer, I want the headless session to select the next event so that future services can advance gameplay.

**Acceptance Criteria:**
- [ ] Session exposes next-event selection.
- [ ] Event candidates come from the catalog read interface.
- [ ] Final trigger checks remain in engine logic.
- [ ] Selection result includes event id and player-safe event payload.
- [ ] Existing Web runtime behavior is not changed.
- [ ] Typecheck passes.
- [ ] Tests pass.

### US-015: Implement Headless Automatic Progression
**Description:** As a backend developer, I want automatic events to progress without UI timers so that Node execution can complete non-interactive chains.

**Acceptance Criteria:**
- [ ] Session processes automatic events without `requestAnimationFrame`, timeout-driven UI pacing, or DOM dependencies.
- [ ] Session records applied effects and history.
- [ ] Session stops when player choice is required, terminal state is reached, or configured safety limit is reached.
- [ ] Safety-limit failures return a structured error.
- [ ] Typecheck passes.
- [ ] Tests pass.

### US-016: Implement Headless Choice Execution
**Description:** As a backend developer, I want headless choice execution so that future APIs can apply trusted server-side decisions.

**Acceptance Criteria:**
- [ ] Session executes a choice using the P4 choice-execution request concept.
- [ ] Session validates current event id and available choice id.
- [ ] Session returns next snapshot, player feedback, diagnostics, history append, route changes, relationship changes, and life-memory delta.
- [ ] Session rejects invalid or stale choices with structured errors.
- [ ] Typecheck passes.
- [ ] Tests pass.

### US-017: Implement Headless Restart and Terminal State
**Description:** As a platform developer, I want restart and ending-state behavior in headless sessions so that clients can manage a complete game lifecycle.

**Acceptance Criteria:**
- [ ] Session exposes terminal-state read.
- [ ] Session stops progressing after terminal state.
- [ ] Session exposes restart or new-session behavior.
- [ ] Restart resets gameplay, event, route, relationship, and life-memory source state according to current runtime rules.
- [ ] Typecheck passes.
- [ ] Tests pass.

### US-018: Implement Headless Life Memory Read
**Description:** As a client developer, I want life memory derived from headless state so that Web and future mini-program clients can share the same summary.

**Acceptance Criteria:**
- [ ] Session exposes life-memory summary read.
- [ ] Summary uses existing life-memory derivation rules.
- [ ] Summary remains serializable.
- [ ] Headless life memory does not import UI components.
- [ ] Typecheck passes.
- [ ] Tests pass.

### US-019: Define Web Runtime Adapter Boundary
**Description:** As a frontend developer, I want a documented adapter boundary so that the Web client can migrate incrementally without behavior changes.

**Acceptance Criteria:**
- [ ] Document current Web composable responsibilities.
- [ ] Document which responsibilities should call headless session later.
- [ ] Document which UI pacing concerns remain Web-only.
- [ ] Document that P5 does not require switching the production Web flow to headless execution.
- [ ] Typecheck passes.

### US-020: Add Headless Unit Test Entry
**Description:** As a maintainer, I want a dedicated headless test entry so that Node execution can be verified independently.

**Acceptance Criteria:**
- [ ] Add a test command for headless session tests.
- [ ] Test command does not require browser, network, HTTP server, or database.
- [ ] Tests cover construction, hydration, next event, automatic progression, choice execution, serialization, restart, terminal state, and life memory.
- [ ] Typecheck passes.
- [ ] Tests pass.

### US-021: Define Dual-Track Parity Model
**Description:** As a maintainer, I want a parity model between current runtime and headless runtime so that extraction regressions are detected.

**Acceptance Criteria:**
- [ ] Define parity comparison fields: snapshot hash, feedback, route state, life memory, and event history.
- [ ] Define normalization rules for volatile timestamps and diagnostic-only fields.
- [ ] Define mismatch categories and report format.
- [ ] Define when a mismatch blocks P5.
- [ ] Typecheck passes.

### US-022: Implement Dual-Track Parity Harness
**Description:** As a maintainer, I want an automated parity harness so that current and headless runtime outputs can be compared.

**Acceptance Criteria:**
- [ ] Harness runs equivalent inputs against current runtime reference path and headless session path.
- [ ] Harness compares normalized snapshot hash, feedback, route state, life memory, and event history.
- [ ] Harness reports exact mismatch field and step.
- [ ] Harness runs without browser, HTTP server, or database.
- [ ] Typecheck passes.
- [ ] Tests pass.

### US-023: Add Deterministic 0-50 Replay Parity Samples
**Description:** As a maintainer, I want replay parity for the proven P3 samples so that extraction preserves real gameplay behavior.

**Acceptance Criteria:**
- [ ] Add parity coverage for orthodox/sect, wandering hero, demonic path, neutral baseline, and romance/family 0-50 deterministic samples.
- [ ] Each sample replays fixed seed and choice log inputs.
- [ ] Each sample compares final snapshot, feedback history, route state, life memory, and event history.
- [ ] Any mismatch fails the parity suite.
- [ ] Typecheck passes.
- [ ] Tests pass.

### US-024: Add Catalog Version Pinning Checks
**Description:** As a maintainer, I want snapshots and replay sessions to pin catalog versions so that event drift cannot silently alter outcomes.

**Acceptance Criteria:**
- [ ] Headless session requires or records `eventCatalogVersion`.
- [ ] Snapshot serialization preserves catalog version.
- [ ] Replay metadata preserves catalog version.
- [ ] Unknown or mismatched catalog versions return structured errors.
- [ ] Typecheck passes.
- [ ] Tests pass.

### US-025: Add P5 Extraction Gate
**Description:** As a maintainer, I want a dedicated P5 gate so that headless extraction cannot regress contracts or gameplay parity.

**Acceptance Criteria:**
- [ ] Gate runs contract tests.
- [ ] Gate runs headless unit tests.
- [ ] Gate runs dual-track 0-50 replay parity tests.
- [ ] Gate runs P3 experience, golden-line, and midlife gates.
- [ ] Gate returns non-zero exit code on any blocker.
- [ ] Typecheck passes.
- [ ] Tests pass.

### US-026: Update Architecture Documentation
**Description:** As a maintainer, I want architecture documentation updated after extraction so that future backend implementation starts from the proven headless path.

**Acceptance Criteria:**
- [ ] Document headless session interface and dependencies.
- [ ] Document in-memory catalog adapter and future HTTP replacement point.
- [ ] Document snapshot adapter, Web adapter boundary, and parity harness.
- [ ] State explicitly that P5 does not add HTTP, database, accounts, cloud saves, or mini-program implementation.
- [ ] Documentation contains no local absolute paths.
- [ ] Typecheck passes.

### US-027: Produce P5 Closure Report
**Description:** As a project owner, I want a P5 closure report so that the project can decide whether to start persistence and API implementation.

**Acceptance Criteria:**
- [ ] Report lists completed P5 user stories.
- [ ] Report includes headless modules, catalog adapter, snapshot adapter, parity harness, and test commands.
- [ ] Report confirms whether Web runtime behavior remained stable.
- [ ] Report includes P3/P4 regression and P5 extraction-gate results.
- [ ] Report recommends whether to proceed to snapshot persistence and API PRD.
- [ ] Documentation contains no local absolute paths.
- [ ] Typecheck passes.

## Functional Requirements

- FR-1: The project must expose a Node-runnable headless engine session.
- FR-2: The headless session must support hydrate, next-event selection, automatic progression, choice execution, serialization, restart, terminal state, and life-memory read.
- FR-3: Headless modules must not depend on Vue, DOM APIs, browser storage, prompt, alert, or UI components.
- FR-4: The project must expose a versioned event catalog read interface.
- FR-5: The project must provide an in-memory catalog adapter backed by current event data.
- FR-6: Final event trigger eligibility must remain engine-side.
- FR-7: Snapshot serialization and hydration must preserve gameplay-relevant state.
- FR-8: Random and time sources must be injectable where needed for deterministic replay.
- FR-9: Dual-track parity must compare snapshots, feedback, route state, life memory, and event history.
- FR-10: Deterministic 0-50 parity samples must cover priority routes and romance/family.
- FR-11: Catalog version must be pinned in snapshots and replay metadata.
- FR-12: P5 must add no HTTP server, database, account system, cloud save, or mini-program implementation.
- FR-13: Existing P3 and P4 gates must remain green.

## Non-Goals

- No HTTP server.
- No network client integration.
- No database connection, ORM, or migrations.
- No snapshot persistence API.
- No account system.
- No cloud saves.
- No mini-program implementation.
- No production Web migration to headless execution unless separately approved.
- No gameplay rebalance.
- No event-selection behavior change.
- No UI redesign.
- No 51-80 content expansion.
- No bulk repair of deferred or broken event catalog content.
- No new runtime dependency.

## Design Considerations

- The headless API should be small, explicit, and usable from Node tests without framework setup.
- Automatic progression must be logical, not UI-paced. UI delays remain a Web adapter concern.
- Catalog adapter behavior should be a reference implementation for a later HTTP service.
- Snapshot conversion must separate canonical persisted state from derived summaries.
- Parity reports must identify exact divergence points, not only final failure.
- Existing Web behavior remains the reference baseline during P5.

## Technical Considerations

- Prefer existing TypeScript and Node capabilities. Do not add runtime packages.
- Reuse P4 contract types where appropriate.
- Avoid importing Vue into new headless modules.
- Use dependency injection for catalog, random, time, logging, and snapshot conversion.
- Keep in-memory catalog adapter separate from the existing `EventLoader`; do not change production loading behavior.
- Normalize timestamps and diagnostics before parity hashing.
- Add safety limits for automatic chains to detect loops without hiding root causes.
- Keep P3 deterministic fixtures as required parity inputs.

## Success Metrics

- Headless session runs in Node without Vue or browser APIs.
- In-memory catalog adapter passes catalog contract tests.
- Snapshot adapter round-trip tests preserve gameplay-relevant state.
- Headless unit tests cover complete session lifecycle.
- All five deterministic 0-50 P3 samples pass dual-track parity.
- Catalog version mismatch is detected and reported.
- P5 extraction gate passes.
- Existing P3 and P4 regression gates remain green.
- No new runtime dependency is added.

## Open Questions

- Should the headless session wrap selected existing core classes or progressively extract pure functions from them?
- Should parity reference the current runtime integration class directly or use existing simulation adapters?
- Should catalog status filtering use current manifest values exactly or normalize them into a smaller service enum?
- Should snapshot hashes use a temporary deterministic canonical JSON hash in P5, then upgrade in persistence implementation?
- Should P6 implement snapshot persistence API before HTTP event catalog service, or ship both in one backend foundation phase?

