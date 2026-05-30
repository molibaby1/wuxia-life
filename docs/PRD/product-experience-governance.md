# PRD: Product Experience Governance

## Introduction

The current game has accumulated many systems, event files, quality reports, and future-facing architecture ideas, but the playable product experience is not yet solid. The immediate priority is not backend separation, database integration, mini-program support, or large UI redesign. The priority is to make one focused 0-30 age experience feel coherent, consequential, and worth playing.

This PRD defines a product experience governance phase. It focuses on a "golden life line" from birth through early jianghu adulthood, with clear choices, visible feedback, route continuity, and measurable quality gates. It should turn the project from a system-heavy prototype into a playable game foundation.

**Scope freeze (US-001, US-022):** See [`product-experience-governance-scope-and-guardrails.md`](./product-experience-governance-scope-and-guardrails.md) for the canonical 0-30 age boundary, player journey stages, priority routes, non-goals, architecture guardrails, stale documentation registry, and resolved open questions.

## Goals

- Create a coherent 0-30 age golden life line that can be played end to end.
- Ensure key choices have immediate feedback and later narrative payoff.
- Prioritize three route tracks: orthodox/sect, wandering hero, and demonic path.
- Classify current event assets so active content is distinguishable from candidate, broken, deferred, and dead content.
- Replace vague fallback feedback with explicit player-facing consequences.
- Harden experience gates so tests can block broken active-route gameplay.
- Preserve future frontend/backend separation readiness without changing architecture in this phase.
- Keep UI work limited to minimum playable layout and information clarity.

## User Stories

### US-001: Define Golden Life Line Scope
**Description:** As a product owner, I want a fixed 0-30 age scope so that experience work does not sprawl into the full 0-80 simulation too early.

**Acceptance Criteria:**
- [x] Define the golden life line as ages 0-30. *(See scope doc §1.1)*
- [x] Document the expected player journey from birth, childhood, youth, route entry, route commitment, and early adulthood. *(See scope doc §1.2)*
- [x] Explicitly exclude full 0-80 completion from this phase. *(See scope doc §1.1, §1.5)*
- [x] Document the selected priority routes: orthodox/sect, wandering hero, demonic path. *(See scope doc §1.3)*

### US-002: Audit Active Runtime Event Sources
**Description:** As a maintainer, I want to know which event files are actually loaded by the runtime so that content planning is based on playable assets, not file count.

**Acceptance Criteria:**
- [ ] Produce an event source inventory for runtime-loaded files.
- [ ] Produce a separate inventory for deferred or not-wired event files.
- [ ] Count active runtime events and deferred events.
- [ ] Identify mismatches between project documentation and runtime-loaded content.
- [ ] Do not modify business code.

### US-003: Classify Event Assets
**Description:** As a narrative designer, I want every event asset classified so that active content can be governed separately from backlog content.

**Acceptance Criteria:**
- [ ] Define event asset statuses: `active`, `candidate`, `broken`, `deferred`, `dead`.
- [ ] Classify every runtime-loaded event with one status.
- [ ] Classify every non-loaded event file with one status.
- [ ] Document the criteria for moving an event into `active`.
- [ ] Store the classification in a repo-tracked report or data file.

### US-004: Define Active Event Admission Rules
**Description:** As a maintainer, I want strict admission rules for active events so that weak content does not enter the playable golden line.

**Acceptance Criteria:**
- [ ] Active events must have valid trigger conditions.
- [ ] Active choice events must have at least one executable choice.
- [ ] Active choice events must produce player-facing feedback.
- [ ] Key active choice events must write a long-term state, flag, relationship, or route change.
- [ ] Key long-term states must be read by at least one later active event.
- [ ] Events that only modify hidden values without narrative explanation cannot be marked `active`.

### US-005: Select Golden Line Event Spine
**Description:** As a player, I want the first 30 years to feel like a story arc so that the game has a real beginning instead of a random table.

**Acceptance Criteria:**
- [ ] Select active events for birth, childhood identity, first formative choice, route entry, first route conflict, relationship or mentor beat, and early adulthood consequence.
- [ ] Golden line has no unexplained event gap longer than 2 in-game years between ages 0-30.
- [ ] Golden line includes at least 6 manual choice events.
- [ ] Golden line includes at least 3 later payoffs for earlier choices.
- [ ] Golden line can be summarized as a readable timeline.

### US-006: Define Choice Feedback Standard
**Description:** As a player, I want choices to explain what happened and what changed so that choices feel meaningful.

**Acceptance Criteria:**
- [ ] Define required feedback layers: immediate narrative, visible impact, and future implication.
- [ ] Define allowed visible impact categories: stats, relationship, route, identity, reputation, money, health, long-term flag.
- [ ] Define which impacts are hidden from the player and why.
- [ ] Ban vague fallback text as final active-event feedback.
- [ ] Include at least 3 examples of acceptable feedback and 3 examples of unacceptable feedback.

### US-007: Remove Air Feedback From Golden Line
**Description:** As a player, I want active golden-line choices to avoid vague placeholder text so that the game does not feel unfinished.

**Acceptance Criteria:**
- [ ] Scan golden-line choice events for vague feedback patterns.
- [ ] Replace or specify feedback for each golden-line choice.
- [ ] No golden-line choice displays generic text equivalent to "your choice caused ripples" as its final result.
- [ ] Add a test or report that fails when golden-line active choices have missing player-facing feedback.

### US-008: Define Choice Payoff Rules
**Description:** As a narrative designer, I want key choices to be referenced later so that the game remembers the player.

**Acceptance Criteria:**
- [ ] Define what qualifies as a key choice.
- [ ] Every key golden-line choice writes a durable state.
- [ ] At least 70% of key golden-line choices are referenced by a later event within ages 0-30.
- [ ] Payoff references include either altered event availability, altered text, altered choice availability, route state, relationship change, or ending weight.
- [ ] Produce a key-choice-to-payoff map.

### US-009: Define Route Lifecycle Model
**Description:** As a player, I want routes to have start, commitment, conflict, turn, completion, and failure states so that life paths have shape.

**Acceptance Criteria:**
- [ ] Define lifecycle states for the three priority routes.
- [ ] Define route entry conditions.
- [ ] Define route commitment conditions.
- [ ] Define route failure or abandonment conditions.
- [ ] Define how route state appears in history or debug reports.

### US-010: Define Orthodox/Sect Golden Route
**Description:** As a player, I want the orthodox/sect route to have a clear early arc so that joining a sect feels consequential.

**Acceptance Criteria:**
- [ ] Define ages 0-30 route beats for orthodox/sect.
- [ ] Include entry, trial, mentor or peer relationship, moral conflict, and early adulthood consequence.
- [ ] Define at least 3 route-specific key choices.
- [ ] Define at least 2 later payoffs for orthodox/sect choices.
- [ ] Define at least 1 route-specific failure or turn-away condition.

### US-011: Define Wandering Hero Golden Route
**Description:** As a player, I want the wandering hero route to support a non-sect heroic life so that the game is not only about joining an institution.

**Acceptance Criteria:**
- [ ] Define ages 0-30 route beats for wandering hero.
- [ ] Include entry, first public act, relationship or reputation consequence, moral dilemma, and early adulthood consequence.
- [ ] Define at least 3 route-specific key choices.
- [ ] Define at least 2 later payoffs for wandering hero choices.
- [ ] Define at least 1 route-specific failure or compromise condition.

### US-012: Define Demonic Path Golden Route
**Description:** As a player, I want the demonic path route to be tempting, costly, and coherent so that it is more than a random evil label.

**Acceptance Criteria:**
- [ ] Define ages 0-30 route beats for demonic path.
- [ ] Include entry temptation, power gain, social cost, moral conflict, and early adulthood consequence.
- [ ] Define at least 3 route-specific key choices.
- [ ] Define at least 2 later payoffs for demonic path choices.
- [ ] Define at least 1 route-specific redemption, escalation, or isolation condition.

### US-013: Define Route Conflict Rules
**Description:** As a designer, I want route conflicts to be explicit so that players do not become mutually contradictory identities by accident.

**Acceptance Criteria:**
- [ ] Define hard conflicts among orthodox/sect, wandering hero, and demonic path.
- [ ] Define soft conflicts and allowed transitions.
- [ ] Define which route combinations can coexist temporarily.
- [ ] Define how a transition event resolves conflict.
- [ ] Produce a route conflict table suitable for tests.

### US-014: Audit Existing Route and Identity Fields
**Description:** As a developer, I want current route, identity, sect, faction, karma, and flag fields audited before implementation so that new rules do not duplicate old fields.

**Acceptance Criteria:**
- [ ] Identify current fields that write route-like state.
- [ ] Identify current fields that read route-like state.
- [ ] Mark each field as main-flow, compatibility, candidate, or deprecated.
- [ ] Identify fields that should not be used for new golden-line work.
- [ ] Do not modify business code.

### US-015: Create Golden Line Simulation Scenario
**Description:** As a maintainer, I want a fixed simulation scenario for the golden line so that regressions are reproducible.

**Acceptance Criteria:**
- [ ] Define at least one deterministic 0-30 simulation input.
- [ ] Simulation records age, event id, route state, choices, feedback, and durable states.
- [ ] Simulation output can be compared across runs.
- [ ] Simulation does not depend on manual browser interaction.

### US-016: Add Golden Line Continuity Gate
**Description:** As a maintainer, I want continuity checks to fail when the golden line breaks so that playable experience cannot regress silently.

**Acceptance Criteria:**
- [ ] Gate fails if the golden line has a gap longer than 2 in-game years without meaningful event progress.
- [ ] Gate fails if fewer than 6 manual choice events appear between ages 0-30.
- [ ] Gate fails if key-choice payoff rate is below 70%.
- [ ] Gate fails if route state becomes contradictory.
- [ ] Gate output lists the exact age and event ids causing failure.

### US-017: Add Feedback Completeness Gate
**Description:** As a maintainer, I want missing or vague feedback to block active golden-line content so that unfinished content does not reach the main experience.

**Acceptance Criteria:**
- [ ] Gate scans all active golden-line choice events.
- [ ] Gate fails when player-facing feedback is missing.
- [ ] Gate fails when feedback matches banned vague patterns.
- [ ] Gate distinguishes active golden-line failures from deferred content warnings.
- [ ] Gate output identifies event id and choice id.

### US-018: Add Route Health Gate
**Description:** As a maintainer, I want route health metrics to block obvious route failure so that route systems are not only decorative.

**Acceptance Criteria:**
- [ ] Gate reports route entry rate for the three priority routes.
- [ ] Gate reports route commitment or progression rate.
- [ ] Gate reports route contradiction rate.
- [ ] Gate fails if route contradiction rate is above 0 for the deterministic golden scenario.
- [ ] Gate warns, but does not necessarily block, if non-priority routes are incomplete.

### US-019: Reclassify Existing Quality Issues by Active Scope
**Description:** As a maintainer, I want current quality reports to distinguish active-scope blockers from backlog issues so that the team fixes the right things first.

**Acceptance Criteria:**
- [ ] Existing event quality issues are grouped by event status.
- [ ] Active golden-line major issues are blockers.
- [ ] Candidate and deferred major issues are warnings or backlog entries.
- [ ] Report summary shows active blocker count separately from total issue count.
- [ ] No active golden-line blocker can be hidden inside a passing summary.

### US-020: Define Minimum Playable Layout Requirements
**Description:** As a player, I want the web interface to be readable on desktop and mobile so that the golden line can be evaluated without fighting the layout.

**Acceptance Criteria:**
- [ ] Define minimum desktop layout requirements for event text, choices, feedback, and character state.
- [ ] Define minimum mobile layout requirements for the same information.
- [ ] Explicitly exclude full visual redesign from this phase.
- [ ] Explicitly exclude mini-program-specific UI work from this phase.
- [ ] UI implementation stories must include browser verification.

### US-021: Remove Debug Intrusion From Player Flow
**Description:** As a player, I want debug tools to stay out of the default flow so that the experience feels like a game.

**Acceptance Criteria:**
- [ ] Define which debug elements are allowed in production-like player flow.
- [ ] Debug panels remain accessible only through an explicit development entry.
- [ ] Default player flow does not show raw event ids, raw condition data, or debug-only text.
- [ ] Verify in browser using dev-browser skill.

### US-022: Define Future Architecture Readiness Rules
**Description:** As a future platform maintainer, I want the current work to preserve backend and mini-program readiness without starting the architecture migration now.

**Acceptance Criteria:**
- [x] Game state remains serializable. *(See scope doc §2.1)*
- [x] Event definitions remain data-driven. *(See scope doc §2.2)*
- [x] Choice execution results can be logged or replayed from structured data. *(See scope doc §2.3)*
- [x] Save schema versioning remains explicit. *(See scope doc §2.4 — `P2_SAVE_SCHEMA_VERSION`)*
- [x] No database, backend API, account system, cloud sync, or mini-program runtime is introduced in this phase. *(See scope doc §2.5)*

### US-023: Update Project Documentation Claims
**Description:** As a maintainer, I want project documentation to match the actual playable scope so that future work is not guided by stale completion claims.

**Acceptance Criteria:**
- [ ] Identify outdated claims about event count, completion phase, and playable coverage.
- [ ] Update or supersede documentation to describe current golden-line governance scope.
- [ ] Documentation distinguishes completed, active, deferred, and planned work.
- [ ] Documentation contains no local absolute paths.

### US-024: Produce Governance Closure Report
**Description:** As a project owner, I want a closure report for this governance phase so that the project can decide whether to start architecture work later.

**Acceptance Criteria:**
- [ ] Report lists completed user stories.
- [ ] Report includes verification commands and results.
- [ ] Report includes golden-line simulation results.
- [ ] Report includes residual risks.
- [ ] Report states whether the project is ready to plan frontend/backend separation.

## Functional Requirements

- FR-1: The project must define a 0-30 age golden life line before expanding full-life coverage.
- FR-2: The project must track whether each event asset is active, candidate, broken, deferred, or dead.
- FR-3: Active golden-line events must satisfy stricter quality rules than deferred content.
- FR-4: Active golden-line choice events must provide player-facing feedback.
- FR-5: Key choices must write durable state and have later payoff targets.
- FR-6: The three priority routes must be orthodox/sect, wandering hero, and demonic path.
- FR-7: Priority routes must have lifecycle states and conflict rules.
- FR-8: Deterministic simulation must validate ages 0-30.
- FR-9: Experience gates must distinguish blockers from warnings.
- FR-10: Active golden-line blockers must fail governance verification.
- FR-11: UI work must stay limited to minimum playable information clarity.
- FR-12: Future architecture readiness must be preserved through serializable state and data-driven events.

## Non-Goals

- No frontend/backend separation in this phase.
- No database integration in this phase.
- No account system, online sync, or cloud save in this phase.
- No mini-program implementation in this phase.
- No large UI redesign in this phase.
- No full 0-80 age completion requirement in this phase.
- No large-scale new content expansion in this phase.
- No new major gameplay systems unless required to complete the golden life line.
- No full cleanup of all historical documents.
- No full migration of every deferred event file into runtime.

## Design Considerations

- The first screen can remain simple, but the gameplay screen must present event text, choices, feedback, route state, and key character state without hiding essential context.
- Desktop and mobile should both be readable, but polish is secondary to information clarity.
- Feedback should read like part of the story, not a system log.
- Player-facing text should not expose raw implementation details.
- Debug tools should remain available for development but must not dominate the player view.

## Technical Considerations

- Current architecture should remain in place during this phase.
- Runtime-loaded events and deferred event files must be treated differently by quality gates.
- Existing tests that only prove code execution are not enough; experience-specific gates are required.
- The golden-line simulation should reuse the same core event execution path as the real game.
- Save and state data should remain serializable to support future backend migration.
- Any new report or generated artifact should avoid local absolute paths.

## Success Metrics

- Golden-line ages 0-30 can be simulated deterministically without route contradiction.
- Golden-line event gaps do not exceed 2 in-game years.
- Golden-line manual choice count is at least 6.
- Key-choice payoff rate is at least 70%.
- Active golden-line vague feedback count is 0.
- Active golden-line major quality blocker count is 0.
- Route contradiction rate for the deterministic golden scenario is 0.
- Documentation clearly distinguishes active playable scope from deferred content.

## Resolved Decisions

See [`product-experience-governance-scope-and-guardrails.md` §4](./product-experience-governance-scope-and-guardrails.md#4-resolved-decisions原-prd-open-questions) for full resolutions. Summary:

- Three deterministic scenarios per priority route + one neutral baseline (PXG4).
- JSON manifest as machine source of truth; markdown report for humans (PXG1).
- Payoff counts mechanical state reads and player-facing text/choice changes.
- Death allowed in game; golden scenarios must reach age 30; death = continuity gate failure.
- `npm run gate:experience` as primary gate entry; PXG4 adds golden-line sub-gates (maxAge=30).

