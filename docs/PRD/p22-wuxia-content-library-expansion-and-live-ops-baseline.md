# PRD: P22 Wuxia Content Library Expansion And Live Ops Baseline

## 1. Introduction

P16 到 P20 已经把武侠人生的关键体验层逐步补齐并完成整局优化，P21 则进一步把内容生产、调优、验证和 LLM 参与的闭环正式化。到这个阶段，项目的主要矛盾不再是“系统能不能支持这些内容”，而是“内容库本身是否已经足够厚、足够均衡、足够稳定，能支撑长期游玩与持续运营式迭代”。

如果这一步不推进，后续即使流程和工具已经具备，也可能因为内容池厚度不足、覆盖率不均、薄弱 archetype 长期空洞、关键阶段或终局事件池过浅，而让玩家体验重新塌缩到少数熟悉套路中。

P22 的目标因此是完成一轮 **Content Library Expansion / Live Ops Baseline**：系统性补齐当前武侠内容库中的高价值空洞，建立面向内容库而非单点 feature 的覆盖率管理方式，形成一组可持续扩充的长期运营基线内容池，并用 P21 的生产流程跑出一整轮内容波次样板，证明后续武侠体验提升可以主要靠内容库扩张与配置调优持续推进。

本阶段允许少量 runtime 支撑改动和一整轮内容库扩展与运营基线样板，但不做 UI、不做新题材、不做大规模 runtime 重构。

## 2. Goals

- 系统性补齐当前武侠内容库中的高价值内容空洞
- 建立对内容库覆盖率、稠密度与薄弱区的持续管理方式
- 建立 3-5 类代表性基线内容池，作为后续长期运营扩展的稳定起点
- 用 P21 工作流完成一整轮内容波次样板，验证生产化能力可持续落地
- 完成一整轮内容库扩展与运营基线样板，并保持现有 narrative/profile/playability gates 不退化
- 尽量通过配置、内容文件和验证链完成后续扩展，只在必要处补最小 runtime 支撑

## 3. User Stories

### US-001: Content Library Coverage Audit
**Description:** As a maintainer, I want a read-only audit of the current wuxia content library so that P22 targets high-value holes and weak pools rather than broad undirected expansion.

**Acceptance Criteria:**
- [ ] Audit the current content library across origin, childhood shaping, route reinforcement/divergence, relationship consequence, faction consequence, legacy, and endgame or historical-memory pools
- [ ] Identify which content pools are strong, weak, sparse, or overly repetitive
- [ ] Record the main player-experience risks caused by library thinness, including weak archetypes, weak stages, weak route differentiation, or weak closure
- [ ] Save the audit under `docs/test-reports/` or `docs/designs/`
- [ ] Do not modify gameplay behavior in this story

### US-002: P22 Content Library Expansion Rules
**Description:** As a designer, I want explicit rules for library expansion and baseline-pool building so that future content growth follows a coherent long-term operating model.

**Acceptance Criteria:**
- [ ] Define the target baseline content pools in scope for P22
- [ ] Define how to prioritize high-value gaps versus nice-to-have thematic expansion
- [ ] Define what counts as acceptable pool redundancy versus harmful thinness or duplication
- [ ] Define which content-library or live-ops problems are explicitly deferred beyond P22
- [ ] Save the rules under `docs/designs/` or `docs/`

### US-003: Library Coverage Schema And Reporting Surface
**Description:** As a developer, I want a clearer content-library coverage surface so that weak pools and missing bridges can be tracked without hidden runtime-specific knowledge.

**Acceptance Criteria:**
- [ ] Add or refine config or reporting structures for content-pool coverage, density, and weak-spot detection
- [ ] Ensure field semantics are explicit enough for later content-library management and LLM-assisted tuning
- [ ] Keep the schema compatible with current profile-first loading or provide a controlled migration path
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-004: High-Value Early-Life Pool Expansion
**Description:** As a player, I want stronger origin, childhood, and early-growth content pools so that early-life runs feel varied and well-supported across different starts.

**Acceptance Criteria:**
- [ ] Expand or refine at least one high-value content pool across origin, childhood shaping, or early route divergence
- [ ] Ensure the expanded pool materially improves support for at least one previously weak early-life archetype or stage band
- [ ] Ensure additions are wired through the existing profile-first content path
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-005: High-Value Mid/Late-Life Pool Expansion
**Description:** As a player, I want stronger mid/late-life consequence and identity pools so that sustained roles, relationships, and factions remain well-supported after early growth.

**Acceptance Criteria:**
- [ ] Expand or refine at least one high-value content pool across relationship consequence, faction identity, or social-role continuation
- [ ] Ensure the expanded pool materially improves support for at least one previously weak mid/late-life trajectory
- [ ] Ensure additions are wired through the existing profile-first content path
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-006: High-Value Legacy And Endgame Pool Expansion
**Description:** As a player, I want stronger legacy, endgame, and historical-memory pools so that late-life closure remains deep across many different runs.

**Acceptance Criteria:**
- [ ] Expand or refine at least one high-value content pool across legacy, disciple/heir outcomes, endgame closure, or historical memory
- [ ] Ensure the expanded pool materially improves support for at least one previously weak late-life or endgame archetype
- [ ] Ensure additions are wired through the existing profile-first content path
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-007: Baseline Pool Set Definition
**Description:** As a maintainer, I want explicit baseline pool sets so that future live-ops style content additions can target known stable foundations instead of implicit, shifting expectations.

**Acceptance Criteria:**
- [ ] Define 3-5 representative baseline content pools for long-term operation, such as origin pool, childhood shaping pool, route consequence pool, legacy pool, or endgame-memory pool
- [ ] For each pool, record minimum coverage expectations and known thin areas
- [ ] Ensure the baseline pool set is suitable for future production-wave comparisons
- [ ] Save the definition under `docs/test-reports/` or `docs/designs/`
- [ ] Do not require runtime redesign in this story

### US-008: Representative Content Wave Samples
**Description:** As a player, I want new content waves produced under the P21 workflow to still feel cohesive and purposeful so that expansion does not degrade quality.

**Acceptance Criteria:**
- [ ] Implement 3-5 representative content-wave samples using the new production workflow
- [ ] At least 1 sample must target an early-life or growth-pool weakness
- [ ] At least 1 sample must target a mid/late-life consequence or identity weakness
- [ ] At least 1 sample must target a legacy, endgame, or historical-memory weakness
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-009: Representative Live Ops Tuning Samples
**Description:** As a maintainer, I want tuning samples tied to content-library growth so that expansion is accompanied by weight, distribution, and coverage correction rather than only raw content addition.

**Acceptance Criteria:**
- [ ] Implement 3-5 representative tuning samples alongside the new content waves
- [ ] At least 1 sample must tune route or event distribution after pool expansion
- [ ] At least 1 sample must tune stage density, payoff spacing, or closure weighting after pool expansion
- [ ] At least 1 sample must tune archetype or replayability support affected by the newly expanded pools
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-010: Library Coverage Validation Matrix
**Description:** As a maintainer, I want a stable validation matrix for content-library coverage so that future expansion waves can be evaluated systematically rather than impressionistically.

**Acceptance Criteria:**
- [ ] Add a matrix or machine-readable report that tracks representative content-pool coverage, thin areas, archetype support, and duplication risk
- [ ] Track whether expansion waves improve weak pools without destabilizing existing strong pools
- [ ] Ensure the output is suitable for future live-ops style comparisons
- [ ] Save report output under `docs/test-reports/`
- [ ] Relevant tests pass

### US-011: Full Content Library Expansion Wave
**Description:** As a project owner, I want one representative full expansion wave executed through the new workflow so that P22 proves the content-library operating model is usable in practice rather than only in theory.

**Acceptance Criteria:**
- [ ] Run one bounded expansion-and-tuning wave across representative early, mid, and late content pools
- [ ] Demonstrate at least 1 case where a previously weak content area becomes materially better supported
- [ ] Demonstrate at least 1 case where a tuning adjustment was required to stabilize new pool additions
- [ ] Demonstrate at least 1 case where validation reports caught or prevented low-value or duplicative expansion
- [ ] Save report output under `docs/test-reports/`
- [ ] Relevant tests pass

### US-012: P22 Experience Gate And Closure Report
**Description:** As a maintainer, I want a dedicated P22 report and closure summary so that the phase can be accepted based on evidence, not impressions.

**Acceptance Criteria:**
- [ ] Add or update a P22-specific gate or report covering content-library coverage, baseline-pool health, wave quality, and expansion-driven tuning stability
- [ ] Record before/after findings for the main content-library and live-ops baseline issues targeted by P22
- [ ] Confirm `gate:playability` and current profile/runtime gates do not regress
- [ ] Save the final closure report under `docs/test-reports/`
- [ ] Relevant tests pass

## 4. Functional Requirements

1. FR-1: The system must support explicit management of content-library coverage across major wuxia life phases and consequence layers.
2. FR-2: The runtime and tooling must consume content-library and wave-tuning inputs through the existing profile-first configuration path rather than through new wuxia-hardcoded branches.
3. FR-3: The system must support explicit configuration or reporting surfaces for pool density, weak-spot detection, duplication risk, and baseline coverage expectations.
4. FR-4: The system must support representative baseline pool definitions suitable for future expansion-wave comparison.
5. FR-5: Expansion waves must be able to add or refine content across early-life, mid/late-life, and legacy or endgame surfaces without direct runtime logic changes in most cases.
6. FR-6: The system must support machine-readable validation outputs for library coverage, wave quality, and tuning stability.
7. FR-7: Selected content-library expansions and tuning changes must be able to improve archetype support, route differentiation, stage support, or endgame closure without destabilizing existing strong pools.
8. FR-8: The system must provide testable evidence that future wuxia experience improvements can be driven mainly through content-library expansion and configuration tuning rather than new system phases.
9. FR-9: The system must preserve compatibility with the current save/runtime model unless an explicitly bounded internal migration is documented.
10. FR-10: P22 must preserve or improve current playability, scheduling, profile, replayability, and other existing major gate outcomes.

## 5. Non-Goals

- No UI theme switching or frontend feature expansion
- No new second-theme feature work beyond keeping shared abstractions healthy
- No large-scale runtime rewrite of the scheduler or simulation core
- No attempt to fully saturate every possible wuxia content pool in the first P22 pass
- No attempt to replace human editorial judgment with fully automated live-ops generation

## 6. Design Considerations

- Library expansion should favor high-impact thin areas before broad decorative growth
- Baseline pools should be stable enough for long-term comparison but flexible enough for future wave growth
- Expansion quality should be measured not only by quantity added but by support gained for weak lives and weak arcs
- Live-ops style tuning should strengthen content coherence, not turn the world into a mechanically optimized but thematically flat system

## 7. Technical Considerations

- Prefer extending existing profile-first config, content, and reporting surfaces before adding new runtime-owned special cases
- Keep field naming stable and authoring-friendly so later expansion waves can be managed by config editors or LLMs with minimal code reading
- Any runtime support added for coverage reporting or wave validation should remain theme-neutral and avoid wuxia-specific naming in shared logic
- Validation should favor report artifacts and targeted tests over ad hoc manual inspection

## 8. Success Metrics

- 3-5 representative baseline content pools are defined and usable for future expansion comparison
- 3-5 representative content-wave and tuning samples can be completed through the established workflow
- At least 1 validation report demonstrates that a previously weak content area is materially better supported after the wave
- At least 1 validation report demonstrates that duplicative or low-value expansion can be detected by the new coverage/report chain
- Existing major gates remain passing after P22 changes

## 9. Open Questions

- Which 3-5 baseline content pools best capture the intended foundation for long-term wuxia content operations?
- Should future waves prioritize filling thin pools first, or broadening already strong pools when doing so improves replayability more?
- How much of content-library health should surface as explicit metrics versus narrative/editorial review guidance?
- Should P22 treat historical-memory and endgame pools as first-class library baselines alongside early and mid-life pools, or keep them partially secondary in the first pass?
