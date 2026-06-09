# PRD: P18 Wuxia Legacy, Disciples, And Heirs Closure

## 1. Introduction

P16 解决了“人如何成型”，P17 解决了“成型之后如何承受关系、势力、身份与高阶成就的持续后果”。如果这两层都已经完成，武侠人生接下来最自然的延伸就不再只是“这个人后来怎样”，而是“这个人最终留下了什么，以及这些东西如何被继承、扭曲、延续或断绝”。

武侠叙事里真正有余味的后期人生，往往不止体现在个人身份上，还体现在传承对象和继承内容上：弟子是否成器，子女是否承志，产业是否败落，门风是否延续，人脉是否转化为庇护或牵连，仇怨是否被下一代承接，绝学是否有人真正学会。传承对象既可能成为成就的延续，也可能成为新的负担、失望、背叛、夭折、平庸或超越。

P18 的目标因此是完成一轮 **Legacy / Inheritance Closure**：让弟子与后代培养真正进入后期人生体验，让武学、技艺、门风、人脉、产业、仇怨与责任具备可继承性，并让培养结果体现长期投入、风险与取舍，而不是单向奖励。

本阶段允许少量 runtime 支撑改动和一整轮后期武侠体验优化，但不做 UI、不做新题材、不做大规模 runtime 重构。

## 2. Goals

- 让后代与弟子成为后期人生中的真实培养对象，而非 summary 附属设定
- 让武学、技艺、门风、人脉、产业、仇怨与责任进入可继承层
- 让培养过程体现投入、取舍、回报、失望、风险与分化结果
- 为 3-5 类代表性传承结果建立可验证样板
- 完成一整轮后期武侠体验优化，并保持现有 narrative/profile/playability gates 不退化
- 尽量通过配置完成传承体验优化，只在必要处补最小 runtime 支撑

## 3. User Stories

### US-001: Legacy Surface Audit
**Description:** As a maintainer, I want a read-only audit of current legacy, disciple, heir, and inheritance surfaces so that P18 targets the highest-impact post-achievement gaps first.

**Acceptance Criteria:**
- [ ] Audit the current sources of disciple, offspring, succession, inheritance, and late-life continuity signals
- [ ] Identify which legacy surfaces are already config-driven, partially config-driven, or still runtime-bound
- [ ] Record where current later-life outcomes stop at personal summary instead of creating inheritable consequences
- [ ] Save the audit under `docs/test-reports/` or `docs/designs/`
- [ ] Do not modify gameplay behavior in this story

### US-002: P18 Design Rules For Legacy And Cultivation
**Description:** As a designer, I want explicit design rules for disciple and heir cultivation so that later stories converge on a coherent wuxia legacy model.

**Acceptance Criteria:**
- [ ] Define the shared and distinct roles of disciples, heirs, children, adopted successors, or inheriting students
- [ ] Define which inheritance dimensions are in scope for P18 and which are deferred
- [ ] Define how cultivation investment should trade against the protagonist's own late-life opportunity space
- [ ] Define how success, mediocrity, betrayal, loss, or transcendence can appear as legacy outcomes
- [ ] Save the rules under `docs/designs/` or `docs/`

### US-003: Legacy Schema And Config Surface
**Description:** As a developer, I want a clearer config surface for legacy and inheritance so that late-life transmission can be tuned without hidden wuxia-specific code coupling.

**Acceptance Criteria:**
- [ ] Add or refine config structures for disciple/heir roles, inheritance channels, cultivation investment, and succession outcomes
- [ ] Ensure field semantics are explicit enough for later config-only tuning
- [ ] Keep the schema compatible with current profile-first loading or provide a controlled migration path
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-004: Disciple And Heir Cultivation Wiring
**Description:** As a player, I want disciples and heirs to respond to long-term cultivation so that late-life choices shape more than my own final summary.

**Acceptance Criteria:**
- [ ] Late-life opportunity or event selection reads disciple/heir cultivation inputs through the existing world-profile path
- [ ] Cultivation investment can influence the development of at least disciples and offspring or heir-like successors
- [ ] The resulting cultivation differences affect later opportunity, stability, succession quality, or legacy signals in a traceable way
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-005: Inheritable Asset And Burden Surface
**Description:** As a designer, I want inheritance structures exposed in config so that what gets passed down can be tuned without rewriting the scheduler.

**Acceptance Criteria:**
- [ ] Add or refine config structures for inheritability of martial teachings, technical skills, social capital, wealth or industry, reputation, vendettas, and responsibilities
- [ ] Ensure the config can represent both positive inheritance and inherited burden
- [ ] Keep the resulting schema profile-first and authoring-friendly
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-006: Representative Legacy Outcome Set
**Description:** As a player, I want different kinds of legacy to lead to different late-life meanings so that cultivation and succession feel distinct across runs.

**Acceptance Criteria:**
- [ ] Implement 3-5 representative disciple/heir legacy patterns using the new inheritance surface
- [ ] At least 1 pattern must emphasize successful transmission of ability or school direction
- [ ] At least 1 pattern must emphasize inheritance of network, obligation, or social burden
- [ ] At least 1 pattern must create a negative or unstable succession outcome such as betrayal, collapse, or incapacity
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-007: Cultivation Cost And Tradeoff Model
**Description:** As a designer, I want a general way to express the cost of raising successors so that legacy building is not a consequence-free late-game bonus.

**Acceptance Criteria:**
- [ ] Define a configuration model for disciple/heir cultivation cost and tradeoff
- [ ] Support cost dimensions across time, attention, resources, political exposure, emotional burden, or deferred personal progress
- [ ] Support visible unmet-pressure or underinvestment reporting for debugging and balancing
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-008: Success And Failure Legacy Samples
**Description:** As a player, I want cultivation outcomes to include both triumph and disappointment so that legacy feels uncertain and dramatic.

**Acceptance Criteria:**
- [ ] Implement 3-5 representative late-life cultivation results using the tradeoff model
- [ ] At least 1 outcome must show a successor who carries forward the protagonist's legacy effectively
- [ ] At least 1 outcome must show a successor who inherits burden without fully inheriting capability
- [ ] At least 1 outcome must show a failure or rupture path caused by neglect, misjudgment, conflict, or instability
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-009: Legacy Continuity Validation Slice
**Description:** As a maintainer, I want a validation slice that demonstrates different legacy outcomes emerging from cultivation, inheritance mix, and late-life choices so that P18 proves the intended closure pattern.

**Acceptance Criteria:**
- [ ] Add a validation slice or report that compares multiple later-life trajectories with controlled differences in disciple/heir cultivation and inherited asset mix
- [ ] Demonstrate at least 1 case where successor cultivation meaningfully changes late-life stability or final legacy
- [ ] Demonstrate at least 1 case where inherited burden or vendetta materially alters the successor-facing outcome space
- [ ] Demonstrate at least 1 case where underinvestment or misaligned inheritance produces a weaker legacy result than raw personal achievement would suggest
- [ ] Save report output under `docs/test-reports/`
- [ ] Relevant tests pass

### US-010: Full Late-Life Wuxia Legacy Optimization Pass
**Description:** As a project owner, I want P18 to improve the full late-life wuxia slice so that legacy closure is not limited to isolated showcase samples.

**Acceptance Criteria:**
- [ ] Apply P18 tuning across representative later-life and end-of-life portions of the wuxia slice
- [ ] Increase visible differentiation between at least 3 legacy trajectories shaped by different cultivation and inheritance choices
- [ ] Reduce cases where major lifetime achievement ends without meaningful transmission, burden, or succession consequence
- [ ] Preserve or improve current route readability, consequence legibility, and summary coherence
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-011: P18 Experience Gate And Closure Report
**Description:** As a maintainer, I want a dedicated P18 report and closure summary so that the phase can be accepted based on evidence, not impressions.

**Acceptance Criteria:**
- [ ] Add or update a P18-specific gate or report covering successor cultivation, inheritance coverage, positive and negative legacy outcomes, and cultivation tradeoff visibility
- [ ] Record before/after findings for the main late-life closure issues targeted by P18
- [ ] Confirm `gate:playability` and current profile/runtime gates do not regress
- [ ] Save the final closure report under `docs/test-reports/`
- [ ] Relevant tests pass

## 4. Functional Requirements

1. FR-1: The system must support explicit configuration for disciple and heir cultivation roles within late-life gameplay.
2. FR-2: The runtime must read legacy and cultivation inputs through the existing profile-first configuration path rather than through new wuxia-hardcoded branches.
3. FR-3: The system must support explicit configuration for inheritable channels across at least martial knowledge, technical skill, social capital, wealth or industry, reputation, vendetta, and responsibility.
4. FR-4: Inheritance paths must be able to generate both positive continuity and inherited burden.
5. FR-5: The system must support a cultivation cost and tradeoff model for selected disciple/heir paths.
6. FR-6: Cultivation cost must be able to combine at least time, resources, attention, emotional burden, political exposure, or reduced personal opportunity.
7. FR-7: Selected late-life trajectories must reflect sustained effects from successor quality, inheritance mix, and cultivation commitment.
8. FR-8: Major lifetime achievements must be able to influence successor-facing outcome space rather than ending only as personal summary text.
9. FR-9: The system must provide testable evidence that different cultivation and inheritance choices can produce materially different legacy outcomes.
10. FR-10: P18 changes must preserve compatibility with the current save/runtime model unless an explicitly bounded internal migration is documented.
11. FR-11: P18 must preserve or improve current playability, scheduling, profile, and multi-theme gate outcomes.

## 5. Non-Goals

- No UI theme switching or frontend feature expansion
- No new second-theme feature work beyond keeping shared abstractions healthy
- No large-scale runtime rewrite of the scheduler or simulation core
- No attempt to build a full multi-generational dynasty simulator in this phase
- No attempt to solve every possible lineage or clan mechanic in the first P18 pass

## 6. Design Considerations

- Legacy should feel like a continuation of the protagonist's life, not a disconnected epilogue system
- Disciples and heirs should overlap in some transmission channels but remain meaningfully distinct in others
- Strong legacy should require investment and judgment, not only late-game surplus
- Failure, instability, and burden should be possible outcomes even for otherwise successful protagonists

## 7. Technical Considerations

- Prefer extending existing profile-first config surfaces before adding new runtime-owned special cases
- Keep field naming stable and authoring-friendly so later tuning can be done by config editors or LLMs with minimal code reading
- Any runtime support added for legacy, inheritance, or cultivation logic should remain theme-neutral and avoid wuxia-specific naming in shared logic
- Validation should favor report artifacts and targeted tests over ad hoc manual inspection

## 8. Success Metrics

- Later-life slices show visibly different arcs for at least 3 successor cultivation and inheritance patterns
- 3-5 representative legacy states create both continuity and burden rather than only positive reward
- 3-5 representative cultivation outcomes create visible tradeoff and divergence after major life success
- At least 1 validation report demonstrates a legacy difference caused by cultivation strategy, inherited burden, and successor quality
- Existing major gates remain passing after P18 changes

## 9. Open Questions

- Which 3-5 representative successor archetypes best capture the intended diversity of wuxia legacy pressure for the first closure set?
- Should disciples and blood heirs compete for overlapping inheritance channels in the first pass, or remain partially separated?
- How much of successor quality should surface as explicit feedback versus implicit downstream weighting changes?
- Should inherited vendettas and obligations appear mainly as pressure on successors, or also immediately reshape the protagonist's final-life decisions in the same phase?
