# PRD: P23 Wuxia Experience Acceptance And Live Balance Closure

## 1. Introduction

P16 到 P20 已经把武侠人生的关键系统层和整局体验层补齐，P21 把内容生产与调优闭环正式化，P22 则进一步把内容库扩展与长期运营基线建立起来。到这个阶段，项目的主要矛盾不再是“还能补什么系统”或“还能扩多少内容”，而是“这些持续更新是否真的稳定提升了玩家体验，而不是只让内容数量变多”。

如果这一步不推进，后续每一轮内容波次虽然都可能通过基础 gate，但仍可能出现另一种风险：内容越来越多，体验却没有明确变好；某些 archetype 更容易重开，某些路线仍然偏淡，某些中后期 payoff 或终局余韵虽然合规却不够有味道。缺少一套稳定的体验验收和长期平衡运营方式，会让项目逐渐回到“能更新，但难判断更新价值”的状态。

P23 的目标因此是完成一轮 **Experience Acceptance / Live Balance Closure**：建立面向玩家体验的整局验收基线，把内容波次从“能生产、能验证不退化”推进到“能比较优劣、能衡量体验提升”，形成长期平衡运营指标和对比样板，并用一整轮长期运营样板证明后续武侠体验打磨可以进入持续、可比较、可验收的状态。

本阶段允许少量 runtime 支撑改动和一整轮长期平衡运营样板，但不做 UI、不做新题材、不做大规模 runtime 重构。

## 2. Goals

- 建立面向玩家体验的整局验收基线，而不是只依赖底层健康 gate
- 建立内容波次优劣比较能力，能够判断“变多”和“变好”的区别
- 建立长期平衡运营指标，持续衡量 archetype、节奏、payoff、legacy、endgame 等关键体验面
- 用 3-5 类代表性体验对比/平衡运营样板验证比较闭环可运行
- 完成一整轮长期平衡运营样板，并保持现有 narrative/profile/playability gates 不退化
- 尽量通过配置、内容文件、报告和验证链完成长期体验控制，只在必要处补最小 runtime 支撑

## 3. User Stories

### US-001: Experience Acceptance Surface Audit
**Description:** As a maintainer, I want a read-only audit of current wuxia acceptance and comparison surfaces so that P23 targets actual experience-control gaps rather than adding more raw metrics.

**Acceptance Criteria:**
- [ ] Audit the current acceptance surfaces across archetype quality, replay quality, route differentiation, stage pacing, mid/late payoff, legacy closure, and endgame aftertaste
- [ ] Identify which experience surfaces are already measurable, partially measurable, or still inferred only impressionistically
- [ ] Record the main risks where content waves can pass existing gates without clearly improving player experience
- [ ] Save the audit under `docs/test-reports/` or `docs/designs/`
- [ ] Do not modify gameplay behavior in this story

### US-002: P23 Experience Acceptance Rules
**Description:** As a designer, I want explicit rules for wuxia experience acceptance and live balance evaluation so that future tuning waves are judged against a coherent player-facing standard.

**Acceptance Criteria:**
- [ ] Define the representative experience dimensions in scope for P23
- [ ] Define how acceptance should combine early-life variation, route differentiation, consequence weight, legacy resonance, and endgame aftertaste
- [ ] Define what counts as a meaningful player-experience improvement versus a merely larger content update
- [ ] Define which acceptance or live-balance problems are explicitly deferred beyond P23
- [ ] Save the rules under `docs/designs/` or `docs/`

### US-003: Experience Acceptance Schema And Reporting Surface
**Description:** As a developer, I want a clearer acceptance and comparison surface so that experience-oriented judgments can be tracked without hidden runtime-specific knowledge.

**Acceptance Criteria:**
- [ ] Add or refine config or reporting structures for experience acceptance, wave comparison, and long-term balance indicators
- [ ] Ensure field semantics are explicit enough for later acceptance review and LLM-assisted tuning support
- [ ] Keep the schema compatible with current profile-first loading or provide a controlled migration path
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-004: Archetype And Replay Acceptance Baseline
**Description:** As a player, I want the game to distinguish strong and weak life runs in a consistent way so that replayability quality is not judged only by content count.

**Acceptance Criteria:**
- [ ] Define or implement an acceptance baseline for archetype strength, replay distinctiveness, and route differentiation
- [ ] Ensure the baseline can distinguish between at least one stronger and one weaker representative replay slice
- [ ] Ensure the baseline is wired through the existing profile-first content and reporting path
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-005: Mid/Late-Life And Endgame Acceptance Baseline
**Description:** As a player, I want later-life payoff and endings to be evaluated as experience outcomes so that the most important parts of a run do not remain under-measured.

**Acceptance Criteria:**
- [ ] Define or implement an acceptance baseline for mid/late payoff, legacy resonance, endgame closure, and historical-memory aftertaste
- [ ] Ensure the baseline can distinguish between at least one stronger and one weaker later-life or endgame slice
- [ ] Ensure the baseline is wired through the existing profile-first content and reporting path
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-006: Long-Term Balance Indicator Set
**Description:** As a maintainer, I want explicit long-term balance indicators so that sustained tuning can target stable player-facing outcomes rather than shifting intuitions.

**Acceptance Criteria:**
- [ ] Define 3-5 representative long-term balance indicators across archetype stability, replay quality, stage pacing health, mid/late payoff strength, and endgame or legacy resonance
- [ ] Ensure each indicator has a concrete interpretation for future tuning review
- [ ] Ensure the resulting indicator set is suitable for future wave-to-wave comparison
- [ ] Save the definition under `docs/test-reports/` or `docs/designs/`
- [ ] Do not require runtime redesign in this story

### US-007: Representative Experience Comparison Samples
**Description:** As a maintainer, I want representative comparison samples so that future content waves can be evaluated by experience quality rather than only by adding more material.

**Acceptance Criteria:**
- [ ] Implement 3-5 representative experience comparison samples using the new acceptance surface
- [ ] At least 1 sample must compare archetype or replay quality
- [ ] At least 1 sample must compare mid/late-life payoff or consequence quality
- [ ] At least 1 sample must compare legacy, endgame, or historical-memory quality
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-008: Representative Live Balance Wave Samples
**Description:** As a player, I want content and tuning waves to be compared by outcome quality so that future updates optimize for better lives, not only more lives.

**Acceptance Criteria:**
- [ ] Implement 3-5 representative live-balance wave samples using the new comparison workflow
- [ ] At least 1 sample must show a wave that improves an experience dimension without materially increasing raw content volume
- [ ] At least 1 sample must show a wave that adds content but fails or weakly improves a targeted experience indicator
- [ ] At least 1 sample must show a wave where acceptance reporting changes the chosen tuning direction
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-009: Experience Acceptance Validation Matrix
**Description:** As a maintainer, I want a stable validation matrix for player-experience acceptance so that future waves can be assessed systematically rather than impressionistically.

**Acceptance Criteria:**
- [ ] Add a matrix or machine-readable report that tracks representative experience baselines, comparison outcomes, and balance indicators
- [ ] Track whether content waves improve weak experience areas without destabilizing strong ones
- [ ] Ensure the output is suitable for future long-term operating comparisons
- [ ] Save report output under `docs/test-reports/`
- [ ] Relevant tests pass

### US-010: Full Live Balance Operation Sample
**Description:** As a project owner, I want one representative long-term balance operation sample executed through the new workflow so that P23 proves the acceptance model is usable in practice rather than only in theory.

**Acceptance Criteria:**
- [ ] Run one bounded content-and-tuning comparison wave across representative early, mid, late, and endgame experience surfaces
- [ ] Demonstrate at least 1 case where a previously weak experience dimension becomes measurably stronger
- [ ] Demonstrate at least 1 case where acceptance reporting prevented or redirected a low-value content wave
- [ ] Demonstrate at least 1 case where live-balance indicators changed the final tuning choice
- [ ] Save report output under `docs/test-reports/`
- [ ] Relevant tests pass

### US-011: Full Wuxia Experience Acceptance Pass
**Description:** As a project owner, I want P23 to improve the complete wuxia acceptance loop so that future optimization becomes a repeatable experience-control capability rather than only a production capability.

**Acceptance Criteria:**
- [ ] Apply P23 acceptance, comparison, and balance-reporting changes across representative full-life experience surfaces
- [ ] Increase the share of future tuning decisions that can be justified by explicit experience acceptance evidence rather than intuition alone
- [ ] Reduce cases where new content waves expand the library without materially improving targeted experience dimensions
- [ ] Preserve or improve current summary coherence, route readability, replayability signals, and endgame resonance
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-012: P23 Experience Gate And Closure Report
**Description:** As a maintainer, I want a dedicated P23 report and closure summary so that the phase can be accepted based on evidence, not impressions.

**Acceptance Criteria:**
- [ ] Add or update a P23-specific gate or report covering acceptance baseline health, wave comparison quality, long-term balance indicators, and live-balance decision usefulness
- [ ] Record before/after findings for the main acceptance and live-balance issues targeted by P23
- [ ] Confirm `gate:playability` and current profile/runtime gates do not regress
- [ ] Save the final closure report under `docs/test-reports/`
- [ ] Relevant tests pass

## 4. Functional Requirements

1. FR-1: The system must support explicit management of player-experience acceptance across major wuxia life phases and consequence layers.
2. FR-2: The runtime and tooling must consume acceptance, comparison, and balance inputs through the existing profile-first configuration path rather than through new wuxia-hardcoded branches.
3. FR-3: The system must support explicit configuration or reporting surfaces for archetype quality, replay quality, stage pacing health, payoff strength, legacy resonance, and endgame aftertaste.
4. FR-4: The system must support representative long-term balance indicators suitable for future wave-to-wave comparison.
5. FR-5: Comparison waves must be able to evaluate experience differences across early-life, mid/late-life, legacy, and endgame surfaces without requiring direct runtime logic changes in most cases.
6. FR-6: The system must support machine-readable validation outputs for experience acceptance, comparison quality, and long-term balance stability.
7. FR-7: Selected content and tuning waves must be able to improve targeted player-experience dimensions without destabilizing already strong experience areas.
8. FR-8: The system must provide testable evidence that future wuxia improvements can be judged mainly through experience acceptance and long-term balance signals rather than content volume alone.
9. FR-9: The system must preserve compatibility with the current save/runtime model unless an explicitly bounded internal migration is documented.
10. FR-10: P23 must preserve or improve current playability, scheduling, profile, replayability, and other existing major gate outcomes.

## 5. Non-Goals

- No UI theme switching or frontend feature expansion
- No new second-theme feature work beyond keeping shared abstractions healthy
- No large-scale runtime rewrite of the scheduler or simulation core
- No attempt to fully automate subjective experience judgment without bounded acceptance rules
- No attempt to solve every future balancing or editorial decision in the first P23 pass

## 6. Design Considerations

- Acceptance should remain player-facing and experience-oriented rather than collapsing into abstract metrics only
- Long-term balance indicators should help human judgment rather than replace it
- Comparison reporting should reveal whether a wave improved quality, not only whether it increased quantity
- Live-balance control should strengthen the game's thematic identity rather than optimize away its texture

## 7. Technical Considerations

- Prefer extending existing profile-first config, content, and reporting surfaces before adding new runtime-owned special cases
- Keep field naming stable and authoring-friendly so later acceptance waves can be managed by config editors or LLMs with minimal code reading
- Any runtime support added for acceptance reporting or long-term balance validation should remain theme-neutral and avoid wuxia-specific naming in shared logic
- Validation should favor report artifacts and targeted tests over ad hoc manual inspection

## 8. Success Metrics

- 3-5 representative experience comparison and live-balance samples can be completed through the established workflow
- 3-5 representative long-term balance indicators are defined and usable for future wave comparison
- At least 1 validation report demonstrates that a previously weak experience dimension is measurably stronger after a wave
- At least 1 validation report demonstrates that a low-value wave can be detected or redirected by the new acceptance/report chain
- Existing major gates remain passing after P23 changes

## 9. Open Questions

- Which 3-5 balance indicators best capture the intended foundation for long-term wuxia experience operations?
- Should future live-balance waves prioritize improving weak experience dimensions first, or protecting already strong dimensions from regression when the two compete?
- How much of experience acceptance should surface as explicit metrics versus narrative/editorial review guidance?
- Should P23 treat endgame and historical-memory aftertaste as first-class acceptance baselines alongside archetype and pacing quality, or keep them partially secondary in the first pass?
