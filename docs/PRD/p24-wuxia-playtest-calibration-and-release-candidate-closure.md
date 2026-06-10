# PRD: P24 Wuxia Playtest Calibration And Release Candidate Closure

## 1. Introduction

P16 到 P20 已经把武侠人生的关键系统层、内容层、传承层、终局层和可重玩性层逐步补齐，P21 到 P23 又把内容生产、内容库扩展、长期体验验收与平衡运营闭环建立起来。到这个阶段，项目在内部逻辑上已经相当自洽。

但内部自洽并不等于真人试玩成立。当前新的主要矛盾不再是“系统和内容还缺什么”，而是“这些系统、内容、验收指标与平衡报告，是否真的对应玩家实际感受到的乐趣、清晰度、重开意愿和终局余味”。如果这一步不推进，项目就可能停留在“内部看起来越来越好”，却没有完成对真人体验的最后校准。

P24 的目标因此是完成一轮 **Playtest Calibration / Release Candidate Closure**：建立面向真人试玩的整局校准方式，让内部体验指标与真实反馈对齐，形成 3-5 类代表性试玩/RC 对比样板，并推进一个接近发布候选的收口过程，验证当前武侠人生版本是否已经具备对外呈现的基本稳定性、可读性、重玩价值与终局余味。

本阶段允许少量 runtime 支撑改动和一整轮发布候选收口样板，但不做 UI、不做新题材、不做大规模 runtime 重构。

## 2. Goals

- 建立面向真人试玩的整局校准基线，而不是只依赖内部 gate 与体验指标
- 建立内部体验指标与真人反馈的对齐机制，识别哪些内部改善真正对应外部体验提升
- 建立 3-5 类代表性试玩/RC 对比样板，验证首局体验、多局重玩、路线分化和终局余味
- 推进一整轮发布候选收口样板，明确当前版本的可交付性边界
- 完成一整轮试玩、反馈与 RC 收口样板，并保持现有 narrative/profile/playability gates 不退化
- 尽量通过配置、内容文件、报告和验证链完成校准与收口，只在必要处补最小 runtime 支撑

## 3. User Stories

### US-001: Playtest And RC Surface Audit
**Description:** As a maintainer, I want a read-only audit of current playtest, external-feedback, and release-candidate surfaces so that P24 targets real calibration gaps rather than extending internal metrics alone.

**Acceptance Criteria:**
- [ ] Audit the current external-validation surfaces across first-run clarity, onboarding readability, replay motivation, route differentiation, late-game payoff, and ending resonance
- [ ] Identify which surfaces are already testable with human feedback, partially proxyable by internal reports, or still not meaningfully calibrated
- [ ] Record the main risks where internal acceptance can pass while real-player experience still fails
- [ ] Save the audit under `docs/test-reports/` or `docs/designs/`
- [ ] Do not modify gameplay behavior in this story

### US-002: P24 Playtest Calibration Rules
**Description:** As a designer, I want explicit rules for human playtest calibration and RC evaluation so that future release decisions are judged against a coherent player-facing standard.

**Acceptance Criteria:**
- [ ] Define the representative playtest dimensions in scope for P24
- [ ] Define how calibration should combine first-run readability, replay desire, route distinction, consequence weight, and ending aftertaste
- [ ] Define what counts as an RC-quality improvement versus a merely cleaner internal report
- [ ] Define which playtest or release-candidate problems are explicitly deferred beyond P24
- [ ] Save the rules under `docs/designs/` or `docs/`

### US-003: Playtest Feedback Schema And Reporting Surface
**Description:** As a developer, I want a clearer playtest feedback and RC reporting surface so that human-facing judgments can be compared against internal acceptance signals.

**Acceptance Criteria:**
- [ ] Add or refine config or reporting structures for playtest feedback capture, RC evaluation, and internal-to-external comparison
- [ ] Ensure field semantics are explicit enough for later playtest review and LLM-assisted triage support
- [ ] Keep the schema compatible with current profile-first loading or provide a controlled migration path
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-004: First-Run And Onboarding Calibration Baseline
**Description:** As a player, I want the first run to be readable and compelling so that the game earns continued play before its deeper systems become visible.

**Acceptance Criteria:**
- [ ] Define or implement a calibration baseline for first-run readability, early-stage clarity, and initial motivation to continue
- [ ] Ensure the baseline can distinguish between at least one stronger and one weaker representative first-run slice
- [ ] Ensure the baseline is wired through the existing profile-first content and reporting path
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-005: Replay, Route, And Endgame Calibration Baseline
**Description:** As a player, I want later runs and endings to remain distinct and memorable so that the game justifies replay beyond the novelty of the first session.

**Acceptance Criteria:**
- [ ] Define or implement a calibration baseline for replay distinctiveness, route differentiation, endgame closure, and post-run aftertaste
- [ ] Ensure the baseline can distinguish between at least one stronger and one weaker representative multi-run or endgame slice
- [ ] Ensure the baseline is wired through the existing profile-first content and reporting path
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-006: Internal-External Alignment Indicator Set
**Description:** As a maintainer, I want explicit alignment indicators so that internal quality signals can be compared against human playtest outcomes rather than treated as automatically trustworthy.

**Acceptance Criteria:**
- [ ] Define 3-5 representative alignment indicators across onboarding clarity, replay motivation, route readability, payoff strength, and ending resonance
- [ ] Ensure each indicator has a clear meaning for deciding whether internal reports are overestimating or underestimating player experience
- [ ] Ensure the indicator set is suitable for future RC comparisons
- [ ] Save the definition under `docs/test-reports/` or `docs/designs/`
- [ ] Do not require runtime redesign in this story

### US-007: Representative Playtest Comparison Samples
**Description:** As a maintainer, I want representative playtest comparison samples so that future tuning waves can be assessed against real player-facing outcomes rather than internal structure alone.

**Acceptance Criteria:**
- [ ] Implement 3-5 representative playtest comparison samples using the new calibration surface
- [ ] At least 1 sample must compare first-run or onboarding quality
- [ ] At least 1 sample must compare replay or route-distinction quality
- [ ] At least 1 sample must compare late-game payoff, legacy, or endgame aftertaste quality
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-008: Representative RC Comparison Samples
**Description:** As a project owner, I want representative RC comparison samples so that release-candidate decisions are made against concrete strengths and weaknesses rather than a vague sense of readiness.

**Acceptance Criteria:**
- [ ] Implement 3-5 representative release-candidate comparison samples using the new RC workflow
- [ ] At least 1 sample must show a build with strong internal health but weak external-facing readability or appeal
- [ ] At least 1 sample must show a build where real-player feedback changes the preferred tuning direction
- [ ] At least 1 sample must show a build where RC reporting validates that a targeted fix meaningfully improved outward experience
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-009: Playtest And RC Validation Matrix
**Description:** As a maintainer, I want a stable validation matrix for human-calibrated acceptance so that future candidate builds can be reviewed systematically rather than conversationally.

**Acceptance Criteria:**
- [ ] Add a matrix or machine-readable report that tracks representative playtest baselines, RC comparison outcomes, and alignment indicators
- [ ] Track whether internal quality improvements are reflected in external-facing experience improvements
- [ ] Ensure the output is suitable for future candidate-build comparison
- [ ] Save report output under `docs/test-reports/`
- [ ] Relevant tests pass

### US-010: Full Release-Candidate Calibration Wave
**Description:** As a project owner, I want one representative RC calibration wave executed through the new workflow so that P24 proves the playtest and release-readiness model is usable in practice rather than only in theory.

**Acceptance Criteria:**
- [ ] Run one bounded calibration-and-fix wave across representative early, mid, late, and endgame experience surfaces
- [ ] Demonstrate at least 1 case where a previously weak human-facing experience dimension becomes measurably stronger
- [ ] Demonstrate at least 1 case where internal metrics alone would have missed a player-facing problem
- [ ] Demonstrate at least 1 case where RC reporting redirected or sharpened the final fix choice
- [ ] Save report output under `docs/test-reports/`
- [ ] Relevant tests pass

### US-011: Full Wuxia RC Closure Pass
**Description:** As a project owner, I want P24 to improve the complete release-candidate closure loop so that the current wuxia build can be judged as a near-shippable product rather than only a strong internal prototype.

**Acceptance Criteria:**
- [ ] Apply P24 calibration, comparison, and RC-reporting changes across representative full-life experience surfaces
- [ ] Increase the share of release decisions that can be justified by aligned human-feedback and internal-acceptance evidence rather than internal reporting alone
- [ ] Reduce cases where candidate builds appear healthy internally but still have weak onboarding, weak replay desire, or weak ending aftertaste
- [ ] Preserve or improve current summary coherence, route readability, replayability signals, and endgame resonance
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-012: P24 Experience Gate And Closure Report
**Description:** As a maintainer, I want a dedicated P24 report and closure summary so that the phase can be accepted based on evidence, not impressions.

**Acceptance Criteria:**
- [ ] Add or update a P24-specific gate or report covering playtest baseline health, internal-external alignment quality, RC comparison quality, and release-readiness usefulness
- [ ] Record before/after findings for the main playtest-calibration and RC-closure issues targeted by P24
- [ ] Confirm `gate:playability` and current profile/runtime gates do not regress
- [ ] Save the final closure report under `docs/test-reports/`
- [ ] Relevant tests pass

## 4. Functional Requirements

1. FR-1: The system must support explicit management of human-facing playtest acceptance across major wuxia life phases and consequence layers.
2. FR-2: The runtime and tooling must consume playtest, calibration, and RC inputs through the existing profile-first configuration path rather than through new wuxia-hardcoded branches.
3. FR-3: The system must support explicit configuration or reporting surfaces for onboarding clarity, replay desire, route readability, payoff strength, legacy resonance, and ending aftertaste.
4. FR-4: The system must support representative internal-external alignment indicators suitable for future RC comparison.
5. FR-5: Calibration waves must be able to evaluate experience differences across first-run, replay, mid/late-life, legacy, and endgame surfaces without requiring direct runtime logic changes in most cases.
6. FR-6: The system must support machine-readable validation outputs for playtest acceptance, RC comparison quality, and internal-external alignment stability.
7. FR-7: Selected content and tuning waves must be able to improve targeted human-facing experience dimensions without destabilizing already strong internal experience areas.
8. FR-8: The system must provide testable evidence that future wuxia release decisions can be judged mainly through aligned playtest feedback and internal acceptance signals rather than internal reporting alone.
9. FR-9: The system must preserve compatibility with the current save/runtime model unless an explicitly bounded internal migration is documented.
10. FR-10: P24 must preserve or improve current playability, scheduling, profile, replayability, and other existing major gate outcomes.

## 5. Non-Goals

- No UI theme switching or frontend feature expansion
- No new second-theme feature work beyond keeping shared abstractions healthy
- No large-scale runtime rewrite of the scheduler or simulation core
- No attempt to fully automate human judgment or replace real playtest with synthetic evaluation only
- No attempt to solve every future release-management or packaging problem in the first P24 pass

## 6. Design Considerations

- Calibration should remain grounded in what real players notice, not only what internal metrics can describe
- Internal-external alignment indicators should guide judgment rather than pretending to remove subjectivity
- RC comparison reporting should reveal whether a build is actually becoming more publishable, not only cleaner internally
- Release-candidate closure should strengthen confidence in the game's outward experience rather than only its structural consistency

## 7. Technical Considerations

- Prefer extending existing profile-first config, content, and reporting surfaces before adding new runtime-owned special cases
- Keep field naming stable and authoring-friendly so later RC waves can be managed by config editors or LLMs with minimal code reading
- Any runtime support added for playtest reporting or RC validation should remain theme-neutral and avoid wuxia-specific naming in shared logic
- Validation should favor report artifacts and targeted tests over ad hoc manual inspection

## 8. Success Metrics

- 3-5 representative playtest and RC comparison samples can be completed through the established workflow
- 3-5 representative internal-external alignment indicators are defined and usable for future candidate comparison
- At least 1 validation report demonstrates that a previously weak human-facing experience dimension is measurably stronger after a calibration wave
- At least 1 validation report demonstrates that internal metrics alone would have missed a real player-facing problem
- Existing major gates remain passing after P24 changes

## 9. Open Questions

- Which 3-5 alignment indicators best capture the intended foundation for long-term RC and playtest operations?
- Should future RC waves prioritize fixing weak first-run clarity first, or protecting strong multi-run depth when the two compete?
- How much of human-facing acceptance should surface as explicit metrics versus playtest-note and editorial review guidance?
- Should P24 treat ending aftertaste and long-run replay desire as first-class RC baselines alongside onboarding quality, or keep them partially secondary in the first pass?
