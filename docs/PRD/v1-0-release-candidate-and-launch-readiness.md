# PRD: v1.0 Release Candidate And Launch Readiness

## 1. Introduction

P10 到 P24 已经逐步完成了武侠人生项目从 runtime 真源化、调度闭环、世界配置化、内容生产化、内容库扩展、体验验收，到真人试玩校准和发布候选收口的整条能力链。到这个阶段，继续以 `Pxx` 形式推进新的大阶段建设，收益已经明显下降。

当前真正的问题不再是“系统还缺哪一层”或“内容还能再补多少”，而是：**当前版本是否已经足够作为一个可以对外交付的首发版本，以及发布后应该如何进入版本化迭代而不是继续基础建设。**

因此，这个阶段不再定义为新的 `P25`，而是直接进入 **v1.0 Release Candidate / Launch Readiness**：完成一次面向首发版本的总审查、收口发布阻塞项、形成 RC 流程与发布边界、对齐内部指标与真人反馈，并同时定义 `v1.0` 之后的阻塞修复和内容更新节奏。

本阶段允许少量 runtime 或内容收口修复，但不做新题材、不做 UI 大改、不做大规模 runtime 重构。

## 2. Goals

- 完成面向 `v1.0` 的总审查，明确当前版本是否具备首发条件
- 建立正式的 RC 流程、范围冻结规则和发布阻塞项收口方式
- 对齐内部体验指标与真人试玩反馈，避免“内部通过但首发体验仍不成立”
- 用一整轮 launch readiness 收口样板验证首局、多局、终局与总体稳定性
- 定义 `v1.0` 之后的 `hotfix / patch / content wave` 节奏骨架
- 保持现有 narrative/profile/playability/replayability 等主要 gate 不退化

## 3. User Stories

### US-001: v1.0 Launch Surface Audit
**Description:** As a maintainer, I want a read-only audit of current launch-readiness surfaces so that v1.0 work targets real release blockers instead of continuing open-ended optimization.

**Acceptance Criteria:**
- [ ] Audit the current launch surfaces across first-run quality, replay value, route clarity, mid/late payoff, legacy or endgame quality, technical stability, and report health
- [ ] Identify which surfaces are already launch-ready, borderline, or still release-blocking
- [ ] Record the main risks that could prevent a clean `v1.0` launch
- [ ] Save the audit under `docs/test-reports/` or `docs/designs/`
- [ ] Do not modify gameplay behavior in this story

### US-002: v1.0 Launch Readiness Rules
**Description:** As a project owner, I want explicit launch-readiness rules so that RC decisions are judged against a stable shipping standard rather than ongoing phase-style ambition.

**Acceptance Criteria:**
- [ ] Define the required launch dimensions in scope for `v1.0`
- [ ] Define what counts as a release blocker, a launch-quality issue, and a post-launch candidate issue
- [ ] Define the launch-freeze boundary for `v1.0`
- [ ] Define which classes of work are explicitly deferred to post-launch patches or content waves
- [ ] Save the rules under `docs/designs/` or `docs/`

### US-003: RC Workflow And Reporting Surface
**Description:** As a developer, I want a clearer RC workflow and reporting surface so that candidate builds can be evaluated consistently without hidden process knowledge.

**Acceptance Criteria:**
- [ ] Add or refine config or reporting structures for RC status, blocker tracking, readiness review, and candidate comparison
- [ ] Ensure field semantics are explicit enough for later release review and LLM-assisted triage support
- [ ] Keep the schema compatible with current profile-first loading or provide a controlled migration path
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-004: First-Run Launch Acceptance Baseline
**Description:** As a new player, I want the first run to be readable, compelling, and stable so that the game can justify a `v1.0` release even before deeper replay depth is discovered.

**Acceptance Criteria:**
- [ ] Define or implement a launch baseline for first-run readability, early engagement, and new-player survivability through the early game
- [ ] Ensure the baseline can distinguish between at least one stronger and one weaker representative first-run slice
- [ ] Ensure the baseline is wired through the existing profile-first content and reporting path
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-005: Full-Life Launch Acceptance Baseline
**Description:** As a player, I want repeated runs and full-life arcs to remain distinct and rewarding so that the launch version is more than a one-run curiosity.

**Acceptance Criteria:**
- [ ] Define or implement a launch baseline for replay distinctiveness, route differentiation, mid/late payoff, and endgame resonance
- [ ] Ensure the baseline can distinguish between at least one stronger and one weaker representative multi-run or full-life slice
- [ ] Ensure the baseline is wired through the existing profile-first content and reporting path
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-006: Internal-To-External Alignment Review
**Description:** As a maintainer, I want explicit alignment review between internal metrics and human feedback so that the release decision does not over-trust internal acceptance alone.

**Acceptance Criteria:**
- [ ] Define 3-5 representative alignment indicators across onboarding clarity, replay desire, route readability, payoff strength, and ending aftertaste
- [ ] Ensure each indicator has a concrete use in deciding whether a build is ready, blocked, or patch-worthy
- [ ] Ensure the indicator set is suitable for future RC and post-launch comparison
- [ ] Save the definition under `docs/test-reports/` or `docs/designs/`
- [ ] Do not require runtime redesign in this story

### US-007: Representative RC Comparison Samples
**Description:** As a maintainer, I want representative RC comparison samples so that launch decisions can be grounded in concrete candidate tradeoffs instead of broad confidence statements.

**Acceptance Criteria:**
- [ ] Implement 3-5 representative RC comparison samples using the new launch-readiness surface
- [ ] At least 1 sample must compare first-run quality
- [ ] At least 1 sample must compare replay or route-distinction quality
- [ ] At least 1 sample must compare mid/late payoff, legacy, or endgame quality
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-008: Representative Launch Blocker Fix Samples
**Description:** As a project owner, I want representative launch-blocker fix samples so that v1.0 readiness is demonstrated through bounded closure work rather than abstract readiness scoring.

**Acceptance Criteria:**
- [ ] Implement 3-5 representative launch-readiness or blocker-fix samples using the new RC workflow
- [ ] At least 1 sample must show a player-facing issue that is fixed primarily through content/config changes
- [ ] At least 1 sample must show a small runtime or support fix that meaningfully improves release readiness
- [ ] At least 1 sample must show a case where RC reporting changed the preferred fix choice
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-009: Launch Readiness Validation Matrix
**Description:** As a maintainer, I want a stable validation matrix for launch readiness so that candidate builds can be reviewed systematically rather than conversationally.

**Acceptance Criteria:**
- [ ] Add a matrix or machine-readable report that tracks representative launch baselines, RC comparison outcomes, blocker status, and alignment indicators
- [ ] Track whether candidate improvements are actually increasing publishability rather than only internal cleanliness
- [ ] Ensure the output is suitable for future candidate-build and post-launch comparison
- [ ] Save report output under `docs/test-reports/`
- [ ] Relevant tests pass

### US-010: Full Launch Readiness Closure Wave
**Description:** As a project owner, I want one representative launch-readiness wave executed through the new workflow so that this PRD proves the RC and release process is usable in practice rather than only in theory.

**Acceptance Criteria:**
- [ ] Run one bounded launch-readiness closure wave across representative first-run, replay, mid/late, and endgame experience surfaces
- [ ] Demonstrate at least 1 case where a previously weak launch-facing experience dimension becomes measurably stronger
- [ ] Demonstrate at least 1 case where internal metrics alone would have underweighted a real release blocker
- [ ] Demonstrate at least 1 case where RC reporting redirected or sharpened the final release fix choice
- [ ] Save report output under `docs/test-reports/`
- [ ] Relevant tests pass

### US-011: Post-Launch Cadence Definition
**Description:** As a project owner, I want the post-launch cadence defined up front so that `v1.0` is not followed by another open-ended phase but by a stable version rhythm.

**Acceptance Criteria:**
- [ ] Define the intended `v1.0 -> v1.0.1` hotfix path
- [ ] Define the intended `patch` and `content wave` cadence after launch
- [ ] Define which classes of issues belong to hotfixes, balance patches, or content waves
- [ ] Save the cadence definition under `docs/designs/` or `docs/`
- [ ] Do not introduce a new phase-based roadmap in this story

### US-012: v1.0 RC Gate And Closure Report
**Description:** As a maintainer, I want a dedicated `v1.0` RC report and closure summary so that launch readiness can be accepted based on evidence, not momentum.

**Acceptance Criteria:**
- [ ] Add or update a `v1.0`-specific gate or report covering launch baseline health, blocker status, RC comparison quality, and post-launch cadence readiness
- [ ] Record before/after findings for the main launch-readiness issues targeted by this phase
- [ ] Confirm `gate:playability` and current profile/runtime/replayability gates do not regress
- [ ] Save the final closure report under `docs/test-reports/`
- [ ] Relevant tests pass

## 4. Functional Requirements

1. FR-1: The system must support explicit management of `v1.0` launch readiness across major wuxia life phases and player experience layers.
2. FR-2: The runtime and tooling must consume RC, readiness, and post-launch cadence inputs through the existing profile-first configuration path rather than through new wuxia-hardcoded branches.
3. FR-3: The system must support explicit configuration or reporting surfaces for first-run quality, replay value, route readability, payoff strength, legacy or endgame resonance, and release-blocker status.
4. FR-4: The system must support representative internal-to-external alignment indicators suitable for future RC and post-launch comparison.
5. FR-5: Launch-readiness waves must be able to evaluate candidate differences across first-run, replay, mid/late-life, legacy, and endgame surfaces without requiring direct runtime logic changes in most cases.
6. FR-6: The system must support machine-readable validation outputs for RC comparison quality, launch-blocker tracking, and post-launch cadence readiness.
7. FR-7: Selected content and tuning waves must be able to improve targeted launch-facing experience dimensions without destabilizing already strong experience areas.
8. FR-8: The system must provide testable evidence that `v1.0` release decisions can be judged mainly through aligned playtest feedback, internal acceptance signals, and explicit blocker status rather than momentum alone.
9. FR-9: The system must preserve compatibility with the current save/runtime model unless an explicitly bounded internal migration is documented.
10. FR-10: This release-readiness phase must preserve or improve current playability, scheduling, profile, replayability, and other existing major gate outcomes.

## 5. Non-Goals

- No new theme or second-theme expansion work
- No UI redesign or broad frontend overhaul
- No large-scale runtime rewrite of the scheduler or simulation core
- No attempt to fully automate release judgment without bounded human review
- No continuation into another `Pxx` systems roadmap from this PRD

## 6. Design Considerations

- Launch readiness should remain grounded in what real players notice, not only what internal metrics can summarize
- RC comparison should clarify whether a build is becoming more publishable, not just more internally coherent
- Post-launch cadence should be simple enough to execute and stable enough to avoid reverting to phase-style sprawl
- The `v1.0` bar should protect the game's identity rather than over-flattening it into generic accessibility

## 7. Technical Considerations

- Prefer extending existing profile-first config, content, and reporting surfaces before adding new runtime-owned special cases
- Keep field naming stable and authoring-friendly so later RC and patch waves can be managed by config editors or LLMs with minimal code reading
- Any runtime support added for launch reporting or cadence validation should remain theme-neutral and avoid wuxia-specific naming in shared logic
- Validation should favor report artifacts and targeted tests over ad hoc manual inspection

## 8. Success Metrics

- 3-5 representative RC comparison and launch-blocker fix samples can be completed through the established workflow
- 3-5 representative alignment indicators are defined and usable for future candidate and post-launch comparison
- At least 1 validation report demonstrates that a previously weak launch-facing experience dimension is measurably stronger after the closure wave
- At least 1 validation report demonstrates that internal metrics alone would have underweighted a real launch problem
- Existing major gates remain passing after the `v1.0` readiness changes

## 9. Open Questions

- Which 3-5 launch-facing experience indicators best capture the true `v1.0` ship bar for this project?
- Should `v1.0` prioritize protecting strong multi-run depth first, or protecting first-run clarity first, when the two compete?
- How much of release readiness should surface as explicit metrics versus playtest-note and editorial review guidance?
- Should post-launch cadence treat endgame/legacy reinforcement as immediate patch scope, or reserve those mostly for content waves after `v1.0`?
