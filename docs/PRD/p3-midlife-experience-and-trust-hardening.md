# PRD: P3 Midlife Experience and Trust Hardening

## Introduction

Product Experience Governance established a playable 0-30 golden life line and added gates for active-scope quality, feedback completeness, route health, and deterministic simulation. The project can now pass the main experience gates, but the reports still expose trust issues: warning-level death rate is too high, romance/family achievement is not reliably reachable, some simulated key-choice payoffs are below the intended threshold, and route contradiction can still appear as a warning.

P3 focuses on turning "passes the gate" into "players trust the life simulation." It will first eliminate the most visible warning signals, then extend the experience from ages 31-50 across the three priority routes, and finally add a lightweight life memory layer so players can understand their choices, relationships, old debts, and route risks.

This phase still does not start frontend/backend separation, database integration, account systems, cloud sync, mini-program implementation, or large UI redesign.

## Goals

- Remove or resolve the current high-signal experience warnings from golden-line and experience reports.
- Extend the playable life arc from ages 0-30 to ages 0-50.
- Cover the orthodox/sect, wandering hero, and demonic path routes through midlife.
- Make death risk understandable and avoidable instead of opaque or random.
- Make at least one romance/family path reliably achievable in the 0-50 experience.
- Increase simulated key-choice payoff rate so the game demonstrably remembers player decisions.
- Prevent contradictory priority-route states from appearing in deterministic scenarios.
- Add a lightweight life memory view or data layer that summarizes route, key choices, relationships, unresolved old debts, and risk signals.
- Keep UI work limited to functional clarity and browser-verifiable minimum presentation.

## User Stories

### US-001: Rebaseline P3 Warning Sources
**Description:** As a maintainer, I want a fresh P3 baseline of all warning-level experience issues so that implementation targets current evidence rather than stale reports.

**Acceptance Criteria:**
- [ ] Run `npm run gate:golden-line` and record all warnings.
- [ ] Run `npm run gate:experience` and record all warning failures.
- [ ] Classify warnings as death risk, romance/family, payoff, route contradiction, or other.
- [ ] Produce a P3 baseline report with command outputs summarized.
- [ ] Do not modify business code.
- [ ] Typecheck passes.

### US-002: Define P3 Trust Targets
**Description:** As a product owner, I want explicit trust targets so that P3 is measured by player-facing experience quality, not only technical completion.

**Acceptance Criteria:**
- [ ] Define target thresholds for death rate, romance/family achievement, simulated payoff rate, and route contradiction.
- [ ] Define which warnings must become blockers during P3.
- [ ] Define which warnings can remain non-blocking and why.
- [ ] Document the target state for 0-50 deterministic scenarios.
- [ ] Typecheck passes.

### US-003: Audit Death Sources
**Description:** As a designer, I want to know why players die in simulations so that death can become understandable and avoidable.

**Acceptance Criteria:**
- [ ] Inventory all active and candidate events that can directly kill the player or sharply reduce survival.
- [ ] Identify whether each death source has player-visible warning, avoidable choice, or mitigation path.
- [ ] Identify death sources that occur before age 50.
- [ ] Produce a death-source report grouped by route and age range.
- [ ] Do not modify business code.
- [ ] Typecheck passes.

### US-004: Define Death Risk Design Rules
**Description:** As a player, I want death risk to feel earned and readable so that failure feels like consequence rather than bad luck.

**Acceptance Criteria:**
- [ ] Define early, midlife, and late-life death-risk rules.
- [ ] Define required warning signals before high-risk choices.
- [ ] Define mitigation methods such as health, allies, reputation, route state, or prior choices.
- [ ] Define when unavoidable death is allowed.
- [ ] Define death-rate target for 0-50 deterministic scenarios.
- [ ] Typecheck passes.

### US-005: Implement Death Risk Telemetry
**Description:** As a maintainer, I want simulations to explain death causes so that death-rate warnings can be debugged quickly.

**Acceptance Criteria:**
- [ ] Simulation output records death event id when death occurs.
- [ ] Simulation output records age, route state, and recent key choices before death.
- [ ] Simulation output records whether death had a visible warning or mitigation path.
- [ ] Reports summarize top death causes.
- [ ] Typecheck passes.
- [ ] Tests pass.

### US-006: Tune Early and Midlife Death Risk
**Description:** As a player, I want early and midlife death to be avoidable through choices so that the game rewards reading and planning.

**Acceptance Criteria:**
- [ ] 0-50 deterministic scenarios do not die without prior warning.
- [ ] High-risk choices include player-facing warning text or risk feedback.
- [ ] At least one mitigation route exists for each priority-route high-risk branch.
- [ ] `npm run gate:experience` no longer fails the death-rate warning target.
- [ ] Typecheck passes.
- [ ] Tests pass.

### US-007: Audit Romance and Family Availability
**Description:** As a narrative designer, I want to know why romance/family achievement is currently unreachable so that the fix addresses the actual chain break.

**Acceptance Criteria:**
- [ ] Inventory romance and family events loaded by runtime.
- [ ] Identify route, age, flag, relationship, and choice requirements for each romance/family event.
- [ ] Identify the first missing or unlikely trigger in deterministic scenarios.
- [ ] Produce a romance/family availability report.
- [ ] Do not modify business code.
- [ ] Typecheck passes.

### US-008: Define Romance and Family Sample Arc
**Description:** As a player, I want at least one relationship path to progress from meeting to commitment or family so that the life simulation includes emotional stakes.

**Acceptance Criteria:**
- [ ] Define one sample romance/family arc available before or during ages 31-50.
- [ ] The arc includes meeting, trust growth, conflict, commitment or separation, and midlife consequence.
- [ ] The arc can coexist with orthodox/sect, wandering hero, and demonic path through route-specific variations.
- [ ] The arc has at least 3 player choices and at least 2 later payoffs.
- [ ] Typecheck passes.

### US-009: Implement Reachable Romance Family Path
**Description:** As a player, I want a romance/family path to be reachable through normal play so that emotional life is not just dormant content.

**Acceptance Criteria:**
- [ ] At least one romance/family path can be reached in a deterministic 0-50 scenario.
- [ ] Romance/family progression uses existing relationship and choice feedback systems.
- [ ] The path does not require hidden impossible flags.
- [ ] `romance_family_achievement_rate` is above the configured minimum.
- [ ] Typecheck passes.
- [ ] Tests pass.

### US-010: Add Romance Family Simulation Sample
**Description:** As a maintainer, I want a deterministic sample for romance/family completion so that relationship regressions are visible.

**Acceptance Criteria:**
- [ ] Add or define a deterministic sample that targets the romance/family arc.
- [ ] Sample output includes relationship state, key choices, and final relationship/family outcome.
- [ ] Gate or report identifies whether the arc completed, separated, or failed.
- [ ] Typecheck passes.
- [ ] Tests pass.

### US-011: Audit Simulated Key-Choice Payoff Gaps
**Description:** As a narrative designer, I want to know why static payoff maps pass while simulations miss payoffs so that player-visible memory improves.

**Acceptance Criteria:**
- [ ] Compare static payoff map expectations with actual 0-30 and 0-50 simulation results.
- [ ] Identify key choices that write state but do not produce simulated payoff.
- [ ] Identify payoff events that are blocked by age, route, condition, or priority ordering.
- [ ] Produce a key-choice payoff gap report.
- [ ] Do not modify business code.
- [ ] Typecheck passes.

### US-012: Define Payoff Timing Rules
**Description:** As a player, I want important choices to echo within a reasonable time so that the game feels like it remembers me.

**Acceptance Criteria:**
- [ ] Define maximum recommended age distance between a key choice and its first payoff.
- [ ] Define what counts as payoff: text callback, event availability, altered choice, relationship change, route change, risk mitigation, or ending weight.
- [ ] Define minimum simulated payoff rate for 0-50 priority-route samples.
- [ ] Define how missed payoff opportunities are reported.
- [ ] Typecheck passes.

### US-013: Implement Missing Payoff Hooks
**Description:** As a player, I want earlier key choices to affect later events so that my life path feels continuous.

**Acceptance Criteria:**
- [ ] Add or adjust payoff hooks for key choices with simulated gaps.
- [ ] Payoff hooks use existing state, flag, relationship, route, or feedback mechanisms.
- [ ] No payoff hook creates route contradiction.
- [ ] Simulated key-choice payoff rate reaches the P3 target.
- [ ] Typecheck passes.
- [ ] Tests pass.

### US-014: Harden Payoff Gate
**Description:** As a maintainer, I want simulated payoff failures to become harder to ignore so that static maps cannot hide broken player memory.

**Acceptance Criteria:**
- [ ] Gate distinguishes static payoff coverage from simulated payoff coverage.
- [ ] Simulated payoff below P3 target fails or blocks according to P3 trust targets.
- [ ] Gate output lists missing choice id, expected payoff id, sample id, and likely block reason when available.
- [ ] Typecheck passes.
- [ ] Tests pass.

### US-015: Audit Priority Route Contradictions
**Description:** As a designer, I want route contradiction warnings traced to concrete events so that priority routes have reliable identity rules.

**Acceptance Criteria:**
- [ ] Identify deterministic samples that produce route contradiction warnings.
- [ ] Identify exact events and effects that activate conflicting route states.
- [ ] Identify whether contradiction comes from event data, route conflict rules, simulation choice strategy, or fallback behavior.
- [ ] Produce a route contradiction audit report.
- [ ] Do not modify business code.
- [ ] Typecheck passes.

### US-016: Fix Priority Route Contradictions
**Description:** As a player, I want route transitions to be explicit so that I do not accidentally become mutually contradictory identities.

**Acceptance Criteria:**
- [ ] Strong-exclusion priority routes cannot become simultaneously active in deterministic 0-50 scenarios.
- [ ] Route transitions require explicit turn, corruption, redemption, exile, or betrayal events.
- [ ] Route state history records the transition reason.
- [ ] Golden-line route contradiction warnings are eliminated or promoted to blockers and fixed.
- [ ] Typecheck passes.
- [ ] Tests pass.

### US-017: Extend Simulation to Ages 31-50
**Description:** As a maintainer, I want deterministic scenarios to cover ages 31-50 so that midlife content is validated before full-life expansion.

**Acceptance Criteria:**
- [ ] Existing deterministic samples can run through age 50.
- [ ] Simulation reports separate metrics for 0-30 and 31-50.
- [ ] Output includes event count, choice count, route state, relationship state, death status, and payoff status for 31-50.
- [ ] Typecheck passes.
- [ ] Tests pass.

### US-018: Define Orthodox Sect Midlife Arc
**Description:** As a player, I want the orthodox/sect route to have midlife pressure so that joining a sect continues to matter after youth.

**Acceptance Criteria:**
- [ ] Define ages 31-50 orthodox/sect beats: responsibility, internal pressure, moral compromise, reputation cost, and midlife consequence.
- [ ] Include at least 3 midlife events or event specs.
- [ ] Include at least 2 manual choices.
- [ ] Include at least 2 callbacks to ages 0-30 choices or route state.
- [ ] Typecheck passes.

### US-019: Implement Orthodox Sect Midlife Arc
**Description:** As a player, I want sect life in midlife to create meaningful obligations and consequences.

**Acceptance Criteria:**
- [ ] Orthodox/sect deterministic scenario reaches at least 3 route-relevant events between ages 31-50.
- [ ] The route includes at least 2 manual choices in ages 31-50.
- [ ] At least 2 earlier choices or states affect midlife text, availability, or outcomes.
- [ ] Typecheck passes.
- [ ] Tests pass.

### US-020: Define Wandering Hero Midlife Arc
**Description:** As a player, I want the wandering hero route to show the cost of freedom and reputation in midlife.

**Acceptance Criteria:**
- [ ] Define ages 31-50 wandering hero beats: old case, public reputation, ally cost, moral dilemma, and midlife consequence.
- [ ] Include at least 3 midlife events or event specs.
- [ ] Include at least 2 manual choices.
- [ ] Include at least 2 callbacks to ages 0-30 choices or route state.
- [ ] Typecheck passes.

### US-021: Implement Wandering Hero Midlife Arc
**Description:** As a player, I want wandering hero midlife events to prove that freedom has consequences.

**Acceptance Criteria:**
- [ ] Wandering hero deterministic scenario reaches at least 3 route-relevant events between ages 31-50.
- [ ] The route includes at least 2 manual choices in ages 31-50.
- [ ] At least 2 earlier choices or states affect midlife text, availability, or outcomes.
- [ ] Typecheck passes.
- [ ] Tests pass.

### US-022: Define Demonic Path Midlife Arc
**Description:** As a player, I want the demonic path to show power, isolation, and possible transformation in midlife.

**Acceptance Criteria:**
- [ ] Define ages 31-50 demonic path beats: power expansion, social cost, betrayal or temptation, redemption or escalation, and midlife consequence.
- [ ] Include at least 3 midlife events or event specs.
- [ ] Include at least 2 manual choices.
- [ ] Include at least 2 callbacks to ages 0-30 choices or route state.
- [ ] Typecheck passes.

### US-023: Implement Demonic Path Midlife Arc
**Description:** As a player, I want demonic midlife events to make power feel costly and choices feel dangerous but readable.

**Acceptance Criteria:**
- [ ] Demonic deterministic scenario reaches at least 3 route-relevant events between ages 31-50.
- [ ] The route includes at least 2 manual choices in ages 31-50.
- [ ] At least 2 earlier choices or states affect midlife text, availability, or outcomes.
- [ ] Death or severe harm branches include visible risk and at least one mitigation path.
- [ ] Typecheck passes.
- [ ] Tests pass.

### US-024: Add 0-50 Midlife Gate
**Description:** As a maintainer, I want a P3 gate for the 0-50 experience so that midlife content cannot silently regress.

**Acceptance Criteria:**
- [ ] Gate checks all priority-route deterministic 0-50 samples.
- [ ] Gate checks minimum midlife route events per route.
- [ ] Gate checks minimum midlife manual choices per route.
- [ ] Gate checks death risk readability and route contradiction.
- [ ] Gate output lists sample id, age, event id, and failed metric.
- [ ] Typecheck passes.
- [ ] Tests pass.

### US-025: Define Life Memory Model
**Description:** As a player, I want the game to summarize my life so that I understand who I am, what I chose, and what remains unresolved.

**Acceptance Criteria:**
- [ ] Define memory categories: route status, key choices, relationships, unresolved debts, risks, and achievements.
- [ ] Define which existing state fields feed each category.
- [ ] Define player-facing labels for each category.
- [ ] Define what should be hidden or spoiler-protected.
- [ ] Typecheck passes.

### US-026: Implement Life Memory Summary Data
**Description:** As a developer, I want a structured life memory summary so that UI and reports can display player history consistently.

**Acceptance Criteria:**
- [ ] Add a function or module that derives life memory summary from current game state.
- [ ] Summary includes route status, key choices, relationships, unresolved debts, risks, and achievements where data exists.
- [ ] Summary avoids raw event ids in player-facing labels.
- [ ] Summary is serializable.
- [ ] Typecheck passes.
- [ ] Tests pass.

### US-027: Display Minimum Life Memory View
**Description:** As a player, I want to view my current life summary so that I can understand my route, relationships, and unresolved consequences.

**Acceptance Criteria:**
- [ ] Gameplay UI exposes a minimum life memory section or panel.
- [ ] The view shows route status, key choices, relationships, unresolved debts, and risk signals when present.
- [ ] The view is readable on desktop and mobile.
- [ ] The view does not become a large visual redesign.
- [ ] Typecheck passes.
- [ ] Verify in browser using dev-browser skill.

### US-028: Add Life Memory Regression Coverage
**Description:** As a maintainer, I want tests for life memory summaries so that player-facing history does not silently disappear.

**Acceptance Criteria:**
- [ ] Tests cover at least one route state in memory summary.
- [ ] Tests cover at least one key choice in memory summary.
- [ ] Tests cover at least one relationship in memory summary.
- [ ] Tests cover unresolved risk or debt when present.
- [ ] Typecheck passes.
- [ ] Tests pass.

### US-029: Update Experience Gates for P3 Completion
**Description:** As a maintainer, I want final P3 gates to reflect the new trust standards so that passing means the game is more credible than before.

**Acceptance Criteria:**
- [ ] P3 gate includes 0-50 deterministic samples.
- [ ] P3 gate includes death readability target.
- [ ] P3 gate includes romance/family achievement target.
- [ ] P3 gate includes simulated payoff target.
- [ ] P3 gate includes route contradiction target.
- [ ] Typecheck passes.
- [ ] Tests pass.

### US-030: Produce P3 Closure Report
**Description:** As a project owner, I want a P3 closure report so that the project can decide whether to start frontend/backend separation planning afterward.

**Acceptance Criteria:**
- [ ] Report lists completed P3 user stories.
- [ ] Report includes verification commands and results.
- [ ] Report compares P3 warning metrics before and after.
- [ ] Report includes 0-50 scenario summaries.
- [ ] Report includes remaining risks and next-phase recommendation.
- [ ] Documentation contains no local absolute paths.
- [ ] Typecheck passes.

## Functional Requirements

- FR-1: The system must preserve the completed 0-30 golden life line while extending deterministic coverage to age 50.
- FR-2: The system must report death cause, age, route state, and recent key choices when a simulation death occurs.
- FR-3: High-risk death branches in active 0-50 content must include visible warning or mitigation.
- FR-4: At least one romance/family arc must be reachable in deterministic 0-50 testing.
- FR-5: The system must distinguish static payoff coverage from simulated payoff coverage.
- FR-6: Simulated key-choice payoff rate must meet the P3 target.
- FR-7: Strong-exclusion priority routes must not be simultaneously active in deterministic 0-50 scenarios.
- FR-8: Each priority route must have a defined 31-50 midlife arc.
- FR-9: Each implemented priority-route midlife arc must include route-relevant events, manual choices, and callbacks to earlier state.
- FR-10: P3 gates must include 0-50 deterministic scenario checks.
- FR-11: The life memory summary must derive from existing game state and remain serializable.
- FR-12: The life memory UI must show player-facing route, choice, relationship, unresolved debt, and risk information without a large visual redesign.

## Non-Goals

- No frontend/backend separation implementation.
- No database integration.
- No account system, cloud save, or online sync.
- No mini-program implementation or mini-program-specific UI.
- No large visual redesign.
- No 0-80 full-life completion requirement.
- No expansion of all deferred event files into active runtime.
- No new major gameplay system unrelated to 0-50 trust, midlife, romance/family, payoff, route coherence, or life memory.
- No full historical document cleanup.
- No monetization, analytics SDK, or production deployment work.

## Design Considerations

- P3 should improve trust before scale. A smaller set of coherent midlife events is better than many loosely connected events.
- Death should remain possible, but the player should see warning signs and meaningful alternatives before severe outcomes.
- Romance/family should not become mandatory, but at least one path must be reachable and emotionally legible.
- Midlife route arcs should create pressure from earlier choices rather than feel like a new unrelated chapter.
- Life memory should be a compact gameplay aid, not a lore encyclopedia.
- UI changes must be functional, responsive, and browser-verified, while avoiding a broad restyle.

## Technical Considerations

- P3 should build on existing data-driven events, route state, choice feedback, golden-line simulations, and gate scripts.
- New simulation telemetry should remain machine-readable and suitable for future backend replay or audit.
- New state summaries should be derived from existing game state where possible, not stored redundantly unless necessary.
- Any new content classification or route metadata should stay compatible with the existing event asset manifest.
- Reports and documentation must avoid local absolute paths.
- If warnings are promoted to blockers, the gate output must explain exact failure causes to avoid frustrating future implementation.

## Success Metrics

- `npm run gate:golden-line` passes with no priority-route contradiction warning.
- `npm run gate:experience` passes without death-rate warning failure.
- `romance_family_achievement_rate` is at or above the configured minimum.
- Simulated key-choice payoff rate meets the P3 target for priority-route deterministic samples.
- Each priority route has at least 3 route-relevant events between ages 31-50.
- Each priority route has at least 2 manual choices between ages 31-50.
- Every severe death or harm branch in active 0-50 deterministic scenarios has visible warning or mitigation.
- Life memory summary displays route status, at least one key choice, relationship state when present, and unresolved risk or debt when present.

## Open Questions

- Should the romance/family sample arc use an existing named character, or define a new minimal recurring relationship?
- Should P3 promote all golden-line route contradiction warnings to blockers immediately, or only after route audit?
- What exact death-rate target should replace the current warning range for 0-50 deterministic scenarios?
- Should life memory be always visible, collapsible, or placed behind a tab/panel?
- Should 31-50 midlife arcs be written as full active events immediately, or first as route specs followed by implementation stories?

