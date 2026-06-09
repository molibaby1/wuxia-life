# PRD: P20 Wuxia Replayability And Archetype Coverage Optimization

## 1. Introduction

P16 到 P19 已经把武侠人生的关键层次逐步补齐：人物如何成型、中后期如何承受关系与势力后果、如何留下传承，以及终局如何形成余韵与历史回响。到这个阶段，系统性的人生闭环已经基本成立。

接下来的主要矛盾不再是“还缺哪一层人生系统”，而是“这些系统组合起来之后，能否稳定地产出足够多、足够鲜明、足够不重复、值得反复游玩的武侠人生”。如果不能解决这个问题，前面已经建立起来的出身、关系、传承、终局和历史回响层，就会在多次游玩后重新塌缩成有限的套路与重复的节奏。

P20 的目标因此是完成一轮 **Replayability / Archetype Coverage Optimization**：明确当前武侠人生已经覆盖的人物谱系与缺口，压降跨周目的重复事件与重复节奏，通盘优化从童年到终局的整局体验曲线，并建立面向“人物原型是否还能稳定产出”的长期回归验证方式。

本阶段允许少量 runtime 支撑改动和一整轮全生命周期武侠体验优化，但不做 UI、不做新题材、不做大规模 runtime 重构。

## 2. Goals

- 明确当前武侠人生已覆盖和未覆盖的核心人物原型谱系
- 降低跨周目中高频重复事件、重复节奏和重复 payoff
- 优化从出身到终局的整局体验曲线，减少阶段性同质化
- 建立 3-5 类代表性 archetype / replay slice 的长期回归验证样板
- 完成一整轮全生命周期武侠体验优化，并保持现有 narrative/profile/playability gates 不退化
- 尽量通过配置完成覆盖与可重玩性优化，只在必要处补最小 runtime 支撑

## 3. User Stories

### US-001: Archetype Coverage Audit
**Description:** As a maintainer, I want a read-only audit of current wuxia archetype coverage so that P20 targets meaningful gaps instead of broad undirected expansion.

**Acceptance Criteria:**
- [ ] Audit the currently observable archetypes across origin, growth pattern, route identity, social role, legacy shape, and endgame memory
- [ ] Identify which archetypes are already strongly supported, weakly supported, or effectively missing
- [ ] Record the main reasons missing archetypes fail to emerge, such as config gaps, low event support, over-dominant routes, or pacing collapse
- [ ] Save the audit under `docs/test-reports/` or `docs/designs/`
- [ ] Do not modify gameplay behavior in this story

### US-002: P20 Replayability Design Rules
**Description:** As a designer, I want explicit design rules for replayability and archetype differentiation so that later stories converge on a coherent long-term optimization model.

**Acceptance Criteria:**
- [ ] Define the representative archetype families in scope for P20
- [ ] Define what counts as harmful repetition versus healthy thematic recurrence
- [ ] Define how whole-life pacing should differ across materially different archetypes
- [ ] Define which replayability or coverage problems are explicitly deferred beyond P20
- [ ] Save the rules under `docs/designs/` or `docs/`

### US-003: Replayability Schema And Config Surface
**Description:** As a developer, I want a clearer config surface for archetype differentiation and repetition control so that replayability can be tuned without hidden wuxia-specific code coupling.

**Acceptance Criteria:**
- [ ] Add or refine config structures for archetype weighting, repetition pressure, event-pool diversity, or payoff spacing
- [ ] Ensure field semantics are explicit enough for later config-only tuning
- [ ] Keep the schema compatible with current profile-first loading or provide a controlled migration path
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-004: Archetype Coverage Wiring
**Description:** As a player, I want materially different life setups to produce materially different wuxia lives so that repeated runs do not collapse into the same character.

**Acceptance Criteria:**
- [ ] Archetype differentiation reads configured coverage inputs through the existing world-profile path
- [ ] At least 3 distinct archetype families can be produced through materially different full-life trajectories
- [ ] Archetype emergence is influenced by more than a single route or late summary label
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-005: Repetition Pressure Surface
**Description:** As a designer, I want explicit config for repetition pressure and novelty distribution so that repeated runs can stay fresh without rewriting the scheduler.

**Acceptance Criteria:**
- [ ] Add or refine config structures for repeated event suppression, novelty preference, route-specific variance, and cross-stage payoff spacing
- [ ] Ensure the config can represent both “avoid exact repeats” and “preserve thematic continuity” behaviors
- [ ] Keep the resulting schema profile-first and authoring-friendly
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-006: Representative Replay Slice Set
**Description:** As a player, I want multiple runs to feel distinct across growth, consequence, legacy, and ending so that replaying produces new stories rather than minor text swaps.

**Acceptance Criteria:**
- [ ] Implement 3-5 representative archetype or replay slices using the new replayability surface
- [ ] At least 1 slice must emphasize origin and early-growth divergence
- [ ] At least 1 slice must emphasize mid/late-life consequence or identity divergence
- [ ] At least 1 slice must emphasize legacy or endgame-memory divergence
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-007: Whole-Life Pacing Optimization Surface
**Description:** As a designer, I want a general way to tune whole-life pacing so that different archetypes do not converge into the same dense or empty rhythm.

**Acceptance Criteria:**
- [ ] Define a configuration model for stage density, payoff spacing, route-pressure timing, and major callback cadence across the full life
- [ ] Support visible before/after pacing comparison output for debugging and balancing
- [ ] Ensure the model can be applied without introducing new wuxia-hardcoded branches in shared runtime logic
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-008: Full-Lifecycle Experience Rebalance
**Description:** As a player, I want the full life arc to sustain interest from origin to endgame so that the strongest parts of the simulation are not cancelled out by weak middle or repetitive closure.

**Acceptance Criteria:**
- [ ] Apply pacing and variety tuning across childhood, youth, adulthood, late life, and endgame portions of the wuxia slice
- [ ] Reduce clearly repeated high-frequency event patterns across representative replay slices
- [ ] Reduce cases where different archetype candidates reconverge into similar late-life or endgame shapes without strong cause
- [ ] Preserve or improve current route readability, consequence legibility, legacy coherence, and endgame clarity
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-009: Archetype Regression Matrix
**Description:** As a maintainer, I want a stable regression matrix for representative wuxia archetypes so that future tuning can be evaluated in terms of lives produced, not only low-level system health.

**Acceptance Criteria:**
- [ ] Add a matrix or machine-readable report that tracks 3-5 representative archetype outputs across full-life runs
- [ ] Track whether each archetype still emerges, whether its life arc remains distinctive, and whether its ending or legacy remains coherent
- [ ] Ensure the regression output is suitable for future config-tuning comparisons
- [ ] Save report output under `docs/test-reports/`
- [ ] Relevant tests pass

### US-010: Replayability Validation Slice
**Description:** As a maintainer, I want a validation slice that demonstrates reduced repetition and stronger archetype differentiation so that P20 proves the intended replayability improvement.

**Acceptance Criteria:**
- [ ] Add a validation slice or report that compares multiple full-life runs with controlled differences in origin, route pressure, consequence state, legacy state, or endgame weighting
- [ ] Demonstrate at least 1 case where a previously weak archetype now emerges more clearly
- [ ] Demonstrate at least 1 case where repeated-run event or payoff overlap is materially reduced
- [ ] Demonstrate at least 1 case where whole-life pacing differs in a meaningful way between two archetypes
- [ ] Save report output under `docs/test-reports/`
- [ ] Relevant tests pass

### US-011: Full Wuxia Replayability Optimization Pass
**Description:** As a project owner, I want P20 to improve the complete wuxia experience as a replayable life-sim so that the system supports many worthwhile runs rather than one strong path.

**Acceptance Criteria:**
- [ ] Apply P20 tuning across representative full-life runs from origin to endgame
- [ ] Increase visible differentiation between at least 3 archetype trajectories shaped by different life setups
- [ ] Reduce cases where major runs feel repetitive despite different origins, identities, legacies, or endings
- [ ] Preserve or improve current summary coherence, consequence continuity, and historical-memory readability
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-012: P20 Experience Gate And Closure Report
**Description:** As a maintainer, I want a dedicated P20 report and closure summary so that the phase can be accepted based on evidence, not impressions.

**Acceptance Criteria:**
- [ ] Add or update a P20-specific gate or report covering archetype coverage, repetition pressure, whole-life pacing differentiation, and replay-slice quality
- [ ] Record before/after findings for the main replayability and coverage issues targeted by P20
- [ ] Confirm `gate:playability` and current profile/runtime gates do not regress
- [ ] Save the final closure report under `docs/test-reports/`
- [ ] Relevant tests pass

## 4. Functional Requirements

1. FR-1: The system must support explicit configuration for archetype differentiation across full-life runs.
2. FR-2: The runtime must read replayability and archetype-coverage inputs through the existing profile-first configuration path rather than through new wuxia-hardcoded branches.
3. FR-3: The system must support explicit configuration for repetition pressure, novelty weighting, or event-pool diversity across stages.
4. FR-4: Repetition-control paths must be able to balance freshness against thematic continuity rather than blindly suppressing all recurrence.
5. FR-5: The system must support a whole-life pacing model for selected replay slices or archetype families.
6. FR-6: Whole-life pacing must be able to combine at least stage density, route-pressure timing, payoff spacing, callback cadence, and endgame closure distribution.
7. FR-7: Selected full-life trajectories must reflect sustained differences in origin, growth, consequence, legacy, and ending state.
8. FR-8: Major lifetime systems must be able to influence archetype emergence and replay distinction rather than collapsing only into end summaries.
9. FR-9: The system must provide testable evidence that different full-life setups can produce materially different archetype and replay outcomes.
10. FR-10: P20 changes must preserve compatibility with the current save/runtime model unless an explicitly bounded internal migration is documented.
11. FR-11: P20 must preserve or improve current playability, scheduling, profile, and multi-theme gate outcomes.

## 5. Non-Goals

- No UI theme switching or frontend feature expansion
- No new second-theme feature work beyond keeping shared abstractions healthy
- No large-scale runtime rewrite of the scheduler or simulation core
- No attempt to build a fully exhaustive wuxia archetype encyclopedia in this phase
- No attempt to solve every possible replayability problem in the first P20 pass

## 6. Design Considerations

- Archetype differentiation should be visible at the level of lived life, not only in summaries
- Repetition reduction should preserve the feeling of a coherent wuxia world rather than turning every run into unrelated randomness
- Whole-life pacing should remain interpretable enough for tuning and regression
- Replayability improvements should strengthen, not dilute, the thematic identity of the game

## 7. Technical Considerations

- Prefer extending existing profile-first config surfaces before adding new runtime-owned special cases
- Keep field naming stable and authoring-friendly so later tuning can be done by config editors or LLMs with minimal code reading
- Any runtime support added for replayability, archetype coverage, or pacing optimization should remain theme-neutral and avoid wuxia-specific naming in shared logic
- Validation should favor report artifacts and targeted tests over ad hoc manual inspection

## 8. Success Metrics

- Full-life slices show visibly different arcs for at least 3 representative archetype and replay patterns
- 3-5 representative replay slices create distinct growth, consequence, legacy, or ending paths rather than superficial text variation
- Repeated-run overlap is materially reduced in at least 1 validated replay comparison
- At least 1 validation report demonstrates a whole-life pacing difference caused by archetype-oriented tuning rather than isolated event swaps
- Existing major gates remain passing after P20 changes

## 9. Open Questions

- Which 3-5 representative archetypes best capture the intended breadth of the first replayability coverage set?
- Should replayability controls prioritize structural variance first, or prioritise textual/event-pool variance first when the two compete?
- How much of archetype emergence should surface as explicit labels versus implicit recognition through reports and summaries?
- Should some archetype reconvergence remain intentionally possible as part of a shared wuxia social world, or should P20 prioritize stronger divergence first?
