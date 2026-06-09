# PRD: P21 Wuxia Content Production And Tuning Closure

## 1. Introduction

P16 到 P20 已经把武侠人生的主要体验层逐步铺开并调优到较完整状态：人物成型、中后期后果、传承、终局余韵、历史回响，以及可重玩性和人物谱系覆盖都已经建立起来。到这个阶段，下一步的关键矛盾不再是“还缺哪一层人生机制”，而是“是否已经具备一套稳定、低代码依赖、可持续的武侠内容生产与调优能力”。

如果这一步不补上，后续每一次优化都仍会回到临时改配置、临时补内容、临时调权重的状态，导致内容风格漂移、事件质量不稳定、路线分布逐渐失衡，也不利于让大语言模型在受控边界内直接参与内容生成和体验调优。

P21 的目标因此是完成一轮 **Content Production / Tuning Closure**：把武侠内容生产流程正式化，把内容质量与风格一致性约束明确化，把 LLM 可以安全参与的内容补点与分布调优闭环建立起来，并用一整轮持续内容优化波次样板证明后续武侠体验打磨可以主要依靠配置、内容包和验证链推进。

本阶段允许少量 runtime 支撑改动和一整轮持续内容优化样板，但不做 UI、不做新题材、不做大规模 runtime 重构。

## 2. Goals

- 建立稳定的武侠内容生产流程与作者工作流，而不是依赖临时 patch 式补点
- 建立内容质量、风格一致性、路线辨识度和武侠味的明确约束
- 建立 LLM 可直接参与的“补内容 + 调分布”安全闭环
- 用 3-5 类代表性内容生产/调优样板验证流程可持续运行
- 完成一整轮持续内容优化波次样板，并保持现有 narrative/profile/playability gates 不退化
- 尽量通过配置、内容文件和验证链完成后续优化，只在必要处补最小 runtime 支撑

## 3. User Stories

### US-001: Content Production Surface Audit
**Description:** As a maintainer, I want a read-only audit of current wuxia content production and tuning surfaces so that P21 targets workflow and quality bottlenecks rather than broad ad hoc expansion.

**Acceptance Criteria:**
- [ ] Audit the current authoring surfaces for events, callbacks, summaries, route weighting, stage pacing, legacy/endgame content, and replayability tuning
- [ ] Identify which authoring surfaces are already config-driven, partially config-driven, or still dependent on runtime knowledge
- [ ] Record the main workflow pain points for adding or tuning wuxia content
- [ ] Save the audit under `docs/test-reports/` or `docs/designs/`
- [ ] Do not modify gameplay behavior in this story

### US-002: P21 Content Workflow Design Rules
**Description:** As a designer, I want explicit rules for wuxia content authoring and tuning so that future content work follows a coherent production model rather than personal intuition.

**Acceptance Criteria:**
- [ ] Define the expected workflow for adding new wuxia content, tuning weights, and validating changes
- [ ] Define what counts as acceptable thematic recurrence versus harmful repetition or slop
- [ ] Define which content changes are safe to perform through config/content files alone and which require runtime support
- [ ] Define which production or tuning problems are explicitly deferred beyond P21
- [ ] Save the rules under `docs/designs/` or `docs/`

### US-003: LLM-Friendly Content Schema Refinement
**Description:** As a developer, I want a clearer content authoring surface so that LLM-assisted edits can be made with lower risk of hidden coupling or invalid semantics.

**Acceptance Criteria:**
- [ ] Add or refine content/config structures for event authoring, callback wiring, summary composition, or tuning metadata where current semantics are too implicit
- [ ] Ensure field semantics are explicit enough for later LLM-assisted content editing
- [ ] Keep the schema compatible with current profile-first loading or provide a controlled migration path
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-004: Content Quality And Style Constraint Surface
**Description:** As a maintainer, I want explicit quality and style constraint surfaces so that wuxia content stays recognizable and internally consistent as volume increases.

**Acceptance Criteria:**
- [ ] Add or refine config/rule surfaces for theme fit, route fit, stage fit, tone consistency, and duplicate-risk checking
- [ ] Ensure the constraint surface can be consumed by reports, validation scripts, or LLM-facing guidance
- [ ] Keep the resulting surface profile-first and authoring-friendly
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-005: LLM-Safe Content Addition Loop
**Description:** As a maintainer, I want a bounded workflow for LLM-generated event, callback, summary, or echo content so that the model can help add material without breaking game coherence.

**Acceptance Criteria:**
- [ ] Define or implement a bounded input/output workflow for LLM-assisted content additions
- [ ] Ensure the workflow covers at least event or callback content and associated validation expectations
- [ ] Ensure invalid or low-quality outputs can be detected through existing or new reports rather than only manual review
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-006: LLM-Safe Distribution Tuning Loop
**Description:** As a maintainer, I want a bounded workflow for LLM-assisted route/event/archetype distribution tuning so that the model can help rebalance the game without direct runtime code edits.

**Acceptance Criteria:**
- [ ] Define or implement a bounded input/output workflow for LLM-assisted weight, distribution, or coverage tuning
- [ ] Ensure the workflow covers at least route/event distribution and archetype or stage-balance tuning
- [ ] Ensure tuning outputs can be validated through coverage, replayability, or quality reports
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-007: Representative Content Production Samples
**Description:** As a player, I want new content added through the production workflow to still feel like cohesive wuxia material so that scale does not come at the cost of flavor.

**Acceptance Criteria:**
- [ ] Implement 3-5 representative content-production samples using the new workflow
- [ ] At least 1 sample must add or refine route-sensitive content
- [ ] At least 1 sample must add or refine stage-sensitive or callback-sensitive content
- [ ] At least 1 sample must add or refine endgame, legacy, or archetype-sensitive content
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-008: Representative Tuning Samples
**Description:** As a player, I want weight and distribution tuning done through the new workflow to produce more coherent and varied lives so that planning improvements become sustainable.

**Acceptance Criteria:**
- [ ] Implement 3-5 representative tuning samples using the new workflow
- [ ] At least 1 sample must tune route/event distribution
- [ ] At least 1 sample must tune stage pacing or payoff spacing
- [ ] At least 1 sample must tune archetype coverage, replayability, or endgame distribution
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-009: Production Validation Matrix
**Description:** As a maintainer, I want a stable production validation matrix so that future content additions and tuning changes can be checked systematically rather than impressionistically.

**Acceptance Criteria:**
- [ ] Add a matrix or machine-readable report that tracks representative content quality, route fit, stage fit, archetype fit, and duplication risk
- [ ] Track whether LLM-assisted or config-only changes preserve thematic and structural coherence
- [ ] Ensure the output is suitable for future production and tuning comparisons
- [ ] Save report output under `docs/test-reports/`
- [ ] Relevant tests pass

### US-010: Continuous Optimization Wave Sample
**Description:** As a project owner, I want one representative ongoing content-optimization wave executed through the new workflow so that P21 proves the system is usable in practice rather than only in theory.

**Acceptance Criteria:**
- [ ] Run one bounded content-and-tuning optimization wave using the new production workflow
- [ ] Demonstrate at least 1 case where content was added or refined without runtime edits
- [ ] Demonstrate at least 1 case where weight or distribution tuning improved a measured experience property
- [ ] Demonstrate at least 1 case where validation reports caught or prevented low-quality content drift
- [ ] Save report output under `docs/test-reports/`
- [ ] Relevant tests pass

### US-011: Full Wuxia Productionization Pass
**Description:** As a project owner, I want P21 to improve the complete wuxia content-production loop so that future optimization becomes a repeatable operational capability.

**Acceptance Criteria:**
- [ ] Apply P21 workflow, constraint, and validation changes across representative full-life content surfaces
- [ ] Increase the share of wuxia experience tuning that can be completed through content/config changes rather than runtime edits
- [ ] Reduce cases where new content introduces route drift, tone drift, or duplicate-feel regressions
- [ ] Preserve or improve current summary coherence, route readability, and replayability signals
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-012: P21 Experience Gate And Closure Report
**Description:** As a maintainer, I want a dedicated P21 report and closure summary so that the phase can be accepted based on evidence, not impressions.

**Acceptance Criteria:**
- [ ] Add or update a P21-specific gate or report covering production workflow health, style/quality constraint coverage, LLM-loop safety, and content/tuning sample quality
- [ ] Record before/after findings for the main productionization and tuning-closure issues targeted by P21
- [ ] Confirm `gate:playability` and current profile/runtime gates do not regress
- [ ] Save the final closure report under `docs/test-reports/`
- [ ] Relevant tests pass

## 4. Functional Requirements

1. FR-1: The system must support explicit, documented workflows for wuxia content addition and tuning.
2. FR-2: The runtime and tooling must consume content-production and tuning inputs through the existing profile-first configuration path rather than through new wuxia-hardcoded branches.
3. FR-3: The system must support explicit configuration or rule surfaces for style fit, route fit, stage fit, duplicate-risk control, and thematic consistency.
4. FR-4: The system must support bounded LLM-assisted workflows for both content creation and distribution tuning.
5. FR-5: LLM-assisted workflows must be able to validate outputs against at least quality, fit, and coverage expectations.
6. FR-6: The system must support machine-readable validation outputs for representative production and tuning samples.
7. FR-7: Selected content additions and tuning changes must be able to improve route, stage, replayability, legacy, or endgame surfaces without direct runtime logic changes.
8. FR-8: The system must provide testable evidence that future experience improvements can be driven mainly through content/config updates rather than code edits.
9. FR-9: The system must preserve compatibility with the current save/runtime model unless an explicitly bounded internal migration is documented.
10. FR-10: P21 must preserve or improve current playability, scheduling, profile, replayability, and other existing major gate outcomes.

## 5. Non-Goals

- No UI theme switching or frontend feature expansion
- No new second-theme feature work beyond keeping shared abstractions healthy
- No large-scale runtime rewrite of the scheduler or simulation core
- No attempt to fully automate all wuxia content generation without review constraints
- No attempt to solve every future planning or balancing problem in the first P21 pass

## 6. Design Considerations

- Content production should remain authorable by humans while becoming safer for LLM participation
- Quality constraints should protect wuxia flavor, not reduce all content into generic template compliance
- Validation should catch both structural regressions and tonal/content drift
- Productionization should make future tuning faster without sacrificing intentionality

## 7. Technical Considerations

- Prefer extending existing profile-first config and report surfaces before adding new runtime-owned special cases
- Keep field naming stable and authoring-friendly so later tuning can be done by config editors or LLMs with minimal code reading
- Any runtime support added for production workflow or validation should remain theme-neutral and avoid wuxia-specific naming in shared logic
- Validation should favor report artifacts and targeted tests over ad hoc manual inspection

## 8. Success Metrics

- 3-5 representative content-production and tuning samples can be completed through the new workflow
- At least 1 validation report demonstrates a content improvement achieved without runtime edits
- At least 1 validation report demonstrates that low-quality or off-theme drift can be detected by the new constraint/report chain
- The share of wuxia tuning completed via config/content changes increases relative to runtime edits in the sampled wave
- Existing major gates remain passing after P21 changes

## 9. Open Questions

- Which 3-5 representative content-production samples best capture the intended breadth of future wuxia planning work?
- Should LLM-assisted workflows prioritize stronger pre-generation constraints or stronger post-generation validation when the two compete?
- How much style enforcement should live in machine-readable constraints versus human-facing authoring guides?
- Should P21 treat summary and endgame text as first-class production surfaces alongside event content, or keep them partially separate in the first pass?
