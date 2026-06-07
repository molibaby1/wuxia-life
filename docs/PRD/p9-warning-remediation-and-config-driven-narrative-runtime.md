# PRD: P9 Warning Remediation And Config-Driven Narrative Runtime

## 1. Introduction

P8 已经建立了 `gate:playability`，并把 0-40 岁切片推进到“可自动门禁 + 可小规模真人测试”的状态，但当前门禁仍暴露出 17 个 warnings，主要集中在：

- `causality`：多个 persona 的 direct echoes 为 0
- `pacing`：多个 persona 存在 6-7 年 low-impact span
- `replayability`：存在 8 对 near-duplicate persona outcomes

这说明当前项目的主要问题不再是“有没有主动行动”，而是：

- 不同人生路径的中段分化不够强
- 早期选择/行动对后续的显性回响不够强
- 0-40 岁体验中的阶段成果与身份信号不够密
- 这些结构更多被隐含在代码和零散事件里，而不是以可复用配置表达

P9 的目标不是继续扩系统，而是分两步完成：

1. 先解决当前 P8 warnings 背后的体验结构问题
2. 再把有效做法沉淀成配置驱动的人生叙事 runtime，为未来跨题材复用打基础

## 2. Goals

- 将 P8 warnings 从“现象”收敛为明确根因，并形成稳定诊断报告
- 优先降低 `replayability`、`pacing`、`causality` warnings
- 让 0-40 岁切片的中段分化、阶段成果、身份信号、因果回响更明确
- 将阶段结构、路线结构、回响结构、摘要结构从隐性逻辑演进为显式配置
- 为未来的非武侠题材 world pack 打下 runtime 边界

## 3. Scope

### In Scope

- P8 warning triage 与诊断增强
- 0-40 岁武侠内容的结构修复
- 路线分化、阶段成果、显性回响、摘要模板增强
- `stage / route / echo / summary` 四类配置结构抽象
- 配置驱动 runtime 的最小支撑能力

### Out Of Scope

- 全量 world-agnostic runtime 定稿
- 足球/经商题材正式接入
- 大规模 UI 重构
- 后端/API 模式扩展
- 完整天赋、装备、背包、地图、终局系统扩展

## 4. Problem Statement

当前问题不是单一 bug，而是内容结构与配置结构问题：

- 不同 persona 虽然前期动作不同，但中后段承接内容过于相似
- 主动行动常只体现为数值变化，没有形成后续事件、身份、摘要中的显性回响
- 中段存在长时间低影响推进，玩家会感到“有年份变化但没人生变化”
- 这些问题目前无法通过纯配置稳定修复，因为关键结构仍然部分埋在代码流程中

## 5. Design Direction

项目应逐步形成两层结构：

### 代码层

- 状态推进
- 条件判断
- 行动结算
- 路线推进框架
- 回响解释器
- 摘要生成框架
- playability gate

### 配置层

- 世界观 profile
- 年龄阶段结构
- 主动行动 catalog
- 路线定义
- 回响 hooks
- 摘要模板
- 目标模板
- 事件与承接内容

目标是让代码定义“怎么跑”，配置定义“跑出什么人生”。

## 6. User Stories

### US-001: Warning Triage Baseline
**Description:** As a maintainer, I want a baseline report that expands the current P8 warnings into persona-level evidence so that remediation starts from exact failure surfaces rather than summary counts.

**Acceptance Criteria:**
- [ ] Produce a warning triage report from the latest playability gate output.
- [ ] List every warning by metric, persona, and detail text.
- [ ] Group warnings into replayability, pacing, and causality buckets.
- [ ] Save the report under `docs/test-reports/`.
- [ ] Do not modify gameplay logic.

### US-002: Pacing Window Annotation
**Description:** As a designer, I want each pacing warning expanded into an age-window timeline so that empty years can be inspected as concrete content gaps.

**Acceptance Criteria:**
- [ ] For each pacing warning, report the start age and end age of the low-impact span.
- [ ] For each low-impact span, report what events, actions, route changes, and summary changes occurred inside the span.
- [ ] Classify each span as no-content, weak-feedback, or weak-differentiation.
- [ ] Save the annotated pacing output under `docs/test-reports/`.

### US-003: Replayability Pair Annotation
**Description:** As a designer, I want each replayability warning expanded into concrete pairwise similarities so that I know which persona paths are collapsing together.

**Acceptance Criteria:**
- [ ] List each near-duplicate persona pair from the current gate output.
- [ ] For each pair, compare route tags, active action distributions, summary identity, and major achievement outcomes.
- [ ] Identify which comparison dimensions are too similar.
- [ ] Save the replayability comparison report under `docs/test-reports/`.

### US-004: Causality Root Cause Classification
**Description:** As a maintainer, I want causality warnings split into real missing echoes versus under-detected echoes so that remediation targets the right layer.

**Acceptance Criteria:**
- [ ] Review each persona with direct echoes equal to 0.
- [ ] Classify each case as missing content echo, implicit-only echo, or detector-too-strict.
- [ ] Record at least one evidence example per persona.
- [ ] Save the causality root-cause note under `docs/test-reports/`.

### US-005: Ranked Root Cause Summary
**Description:** As a project owner, I want one ranked root-cause summary so that the first remediation wave fixes the highest-value structural problems.

**Acceptance Criteria:**
- [ ] Produce a top-five root-cause list across replayability, pacing, and causality.
- [ ] Each root cause identifies affected personas and age bands.
- [ ] Each root cause identifies whether the likely fix belongs to content, config, or runtime support.
- [ ] Save the ranked summary under `docs/test-reports/`.

### US-006: First-Wave Route Divergence Targeting
**Description:** As a designer, I want the first replayability remediation wave scoped to a small set of collapsing persona pairs so that the content fix remains iteration-sized.

**Acceptance Criteria:**
- [ ] Select the first 2-3 near-duplicate persona pairs for remediation.
- [ ] For each selected pair, define the intended divergence in route, identity, or major life outcome.
- [ ] Document the minimum content surfaces that must diverge.
- [ ] Do not implement the divergence in this story.

### US-007: First-Wave Midlife Milestone Targeting
**Description:** As a designer, I want specific low-impact windows chosen for remediation so that pacing improvements land in the emptiest parts of the 0-40 slice.

**Acceptance Criteria:**
- [ ] Select the first 2-3 low-impact windows for remediation.
- [ ] For each window, define the missing milestone type such as route signal, relationship shift, achievement, or setback.
- [ ] Document the intended player-facing change for each selected window.
- [ ] Do not implement the milestones in this story.

### US-008: First-Wave Explicit Echo Targeting
**Description:** As a designer, I want a small set of early actions and choices chosen for explicit later-life callbacks so that causality remediation stays focused.

**Acceptance Criteria:**
- [ ] Select the first 3-5 early actions or choices that should gain explicit later echoes.
- [ ] For each selected action or choice, define the intended later event, identity, or summary callback.
- [ ] Document whether the echo should appear in event text, route signal, summary text, or multiple surfaces.
- [ ] Do not implement the echoes in this story.

### US-009: First Route Divergence Content Pack
**Description:** As a player, I want at least one collapsing persona pair to produce clearly different midlife outcomes so that replaying feels meaningfully different.

**Acceptance Criteria:**
- [ ] Implement the planned divergence for the first selected near-duplicate persona pair.
- [ ] The two personas produce different route or identity signals by age 40.
- [ ] The two personas produce different summary outcomes by age 40.
- [ ] `npm run typecheck` passes.
- [ ] Relevant tests pass.

### US-010: First Route Divergence Verification
**Description:** As a maintainer, I want a focused verification of the first divergence pack so that replayability improvements are evidenced rather than assumed.

**Acceptance Criteria:**
- [ ] Run the playability gate or focused simulation for the remediated persona pair.
- [ ] Confirm the pair no longer produces the previous near-duplicate result shape.
- [ ] Record the before-and-after evidence in a report under `docs/test-reports/`.
- [ ] Relevant tests pass.

### US-011: First Midlife Milestone Content Pack
**Description:** As a player, I want at least one previously empty midlife window to produce a meaningful milestone so that the slice feels less like empty year advancement.

**Acceptance Criteria:**
- [ ] Implement one milestone for the first selected low-impact window.
- [ ] The milestone is visible as route signal, relationship shift, achievement, setback, or identity confirmation.
- [ ] The change affects the human-readable life summary or event text.
- [ ] `npm run typecheck` passes.
- [ ] Relevant tests pass.

### US-012: First Midlife Milestone Verification
**Description:** As a maintainer, I want evidence that the first pacing remediation shortened or enriched the targeted low-impact window.

**Acceptance Criteria:**
- [ ] Run the playability gate or focused simulation for the remediated persona window.
- [ ] Record whether the longest low-impact span changed.
- [ ] Record the new player-facing milestone evidence.
- [ ] Save the verification note under `docs/test-reports/`.

### US-013: First Explicit Echo Content Pack
**Description:** As a player, I want at least one early action or choice to be called back later in life so that my earlier decisions feel authored.

**Acceptance Criteria:**
- [ ] Implement one explicit later-life callback for the first selected early action or choice.
- [ ] The callback appears in event text, route signal, summary text, or a combination of these.
- [ ] The callback is player-visible rather than hidden in only raw flags.
- [ ] `npm run typecheck` passes.
- [ ] Relevant tests pass.

### US-014: First Explicit Echo Verification
**Description:** As a maintainer, I want evidence that the first causality remediation is actually visible in simulation output.

**Acceptance Criteria:**
- [ ] Run the playability gate or focused simulation for the remediated persona path.
- [ ] Record the new explicit echo evidence in the report.
- [ ] State whether the echo is now detectable by the current gate output.
- [ ] Save the verification note under `docs/test-reports/`.

### US-015: Expanded Causality Detection
**Description:** As a maintainer, I want causality detection to recognize more explicit callbacks so that the gate stops undercounting visible authored outcomes.

**Acceptance Criteria:**
- [ ] Extend causality detection to consider route state, identity labels, summary references, or equivalent explicit signals.
- [ ] Do not count generic stat growth as direct echo.
- [ ] Document the new detectable signal types.
- [ ] `npm run typecheck` passes.
- [ ] Relevant tests pass.

### US-016: Causality Detector Verification
**Description:** As a maintainer, I want a focused regression check on the revised causality detector so that detection improvements do not inflate false positives.

**Acceptance Criteria:**
- [ ] Run focused causality checks against at least one explicit callback case.
- [ ] Run a negative check showing generic stat-only progression is not counted as direct echo.
- [ ] Record the detector behavior in a short note under `docs/test-reports/`.
- [ ] Relevant tests pass.

### US-017: Stage Configuration Skeleton
**Description:** As a content designer, I want the 0-40 slice divided into explicit stage configuration so that pacing and milestone expectations stop living only in implicit flow.

**Acceptance Criteria:**
- [ ] Define stage configuration for 0-10, 10-20, 20-30, and 30-40.
- [ ] Each stage declares intended content purpose and minimum feedback expectations.
- [ ] Do not migrate all content in this story.
- [ ] `npm run typecheck` passes if new config types are added.

### US-018: Stage Configuration Runtime Read Path
**Description:** As a developer, I want the runtime to read stage configuration so that later pacing and milestone behavior can be driven by config instead of scattered assumptions.

**Acceptance Criteria:**
- [ ] Runtime can load the new stage configuration structure.
- [ ] Existing gameplay flow remains functional.
- [ ] No broad gameplay rebalance is introduced in this story.
- [ ] `npm run typecheck` passes.
- [ ] Relevant tests pass.

### US-019: Route Definition Skeleton
**Description:** As a content designer, I want route entry, reinforcement, divergence, and identity signals expressed in route definitions so that route differentiation becomes configurable.

**Acceptance Criteria:**
- [ ] Define a route definition structure for entry signals, reinforcement points, divergence points, and identity signals.
- [ ] Document the first wuxia routes that will use the structure.
- [ ] Do not migrate every route in this story.
- [ ] `npm run typecheck` passes if new config types are added.

### US-020: Route Definition Runtime Read Path
**Description:** As a developer, I want the runtime to read route definitions so that future route differentiation work is mostly config-driven.

**Acceptance Criteria:**
- [ ] Runtime can load the new route definition structure.
- [ ] At least one existing route path reads identity or divergence data from the route definition.
- [ ] Existing gameplay flow remains functional.
- [ ] `npm run typecheck` passes.
- [ ] Relevant tests pass.

### US-021: Echo Hook Skeleton
**Description:** As a content designer, I want early actions and choices to declare future callback hooks in config so that causality does not depend on hand-written one-off logic.

**Acceptance Criteria:**
- [ ] Define an echo hook structure for early action or choice to later callback mapping.
- [ ] Support at least event text, route signal, and summary callback targets.
- [ ] Do not migrate all existing content in this story.
- [ ] `npm run typecheck` passes if new config types are added.

### US-022: Echo Hook Runtime Read Path
**Description:** As a developer, I want the runtime or report layer to read echo hooks so that explicit callbacks can be driven by config.

**Acceptance Criteria:**
- [ ] The runtime or report layer can read the new echo hook structure.
- [ ] At least one existing explicit callback path uses configured hook data.
- [ ] Existing gameplay flow remains functional.
- [ ] `npm run typecheck` passes.
- [ ] Relevant tests pass.

### US-023: Summary Template Skeleton
**Description:** As a content designer, I want life summary structure expressed in templates so that world-specific identity and turning-point language can be configured.

**Acceptance Criteria:**
- [ ] Define summary templates for early life, turning point, and age-40 identity.
- [ ] Support world-specific wording while preserving the current three-part summary shape.
- [ ] Do not migrate every summary path in this story.
- [ ] `npm run typecheck` passes if new config types are added.

### US-024: Summary Template Runtime Read Path
**Description:** As a developer, I want the summary generator to read summary templates so that future world packs can change wording and emphasis without rewriting core summary logic.

**Acceptance Criteria:**
- [ ] Summary generation can load the new template structure.
- [ ] At least one current summary path uses configured template data.
- [ ] Existing summary output remains functional.
- [ ] `npm run typecheck` passes.
- [ ] Relevant tests pass.

### US-025: World Profile Boundary Note
**Description:** As a project owner, I want a boundary note for future world profiles so that cross-theme reuse is planned intentionally rather than implied vaguely.

**Acceptance Criteria:**
- [ ] Document a world profile structure covering stats, resources, identity tracks, actions, goals, and summary signals.
- [ ] Explain how wuxia maps onto the structure.
- [ ] List at least two hypothetical alternate themes such as football career and modern business career.
- [ ] Do not implement alternate themes in this story.

### US-026: P9 Regression Gate Rerun
**Description:** As a maintainer, I want to rerun the playability and regression checks after the first remediation wave so that improvements are measured against the original P8 baseline.

**Acceptance Criteria:**
- [ ] Run `npm run gate:playability` after the first remediation wave.
- [ ] Record warning deltas versus the original P8 baseline.
- [ ] Run the required regression checks for touched runtime surfaces.
- [ ] Save the results under `docs/test-reports/`.

### US-027: P9 Closure Report
**Description:** As a project owner, I want a closure report for the first P9 wave so that the next decision is based on measured warning reduction and configuration progress.

**Acceptance Criteria:**
- [ ] Report which warnings were reduced, unchanged, or newly surfaced.
- [ ] Report which runtime structures became config-driven.
- [ ] Report residual risks before a larger world-pack generalization phase.
- [ ] List commands and evidence used for verification.

## 7. Functional Requirements

- FR-1: 系统必须输出 warning triage 报告，标出每个 warning 的 persona、年龄段、根因分类。
- FR-2: 系统必须支持更强的 replay difference 诊断，而不只输出 near-duplicate pair 列表。
- FR-3: 内容层必须支持为不同 persona/路线配置不同的 20-40 岁承接内容。
- FR-4: 系统必须支持为早期行动/选择配置显式 echo hooks。
- FR-5: 系统必须支持按阶段配置节奏节点与最低反馈密度。
- FR-6: 系统必须支持按路线配置 entry、reinforcement、divergence、identity signals。
- FR-7: 系统必须支持配置驱动的 summary templates。
- FR-8: `gate:playability` 继续作为额外门禁，验证 remediation 是否有效。
- FR-9: runtime 抽象不得要求未来题材复用时重写核心流程。
- FR-10: 武侠题材仍然是本阶段唯一必须落地验证的 world pack。

## 8. Non-Goals

- 不为了消 warning 而单纯放宽阈值
- 不重写核心引擎为大一统抽象系统后再验证内容
- 不把真人可玩性判断完全交给自动化
- 不在本阶段实现完整多题材游戏切换

## 9. Risks

- 过早做“大而全抽象”会抽象错，反而拖慢验证
- 如果只改检测规则而不改内容结构，会掩盖真实体验问题
- 如果只补事件数量而不补结构分化，会降低 replayability 改善效果
- 如果配置层设计过于武侠化，未来跨题材复用仍会受限

## 10. Rollback / Fallback

- 若配置抽象推进受阻，保留 Phase A/B 的 warning remediation 成果，不强行推进 Phase C/D
- 若某些检测增强被证明误导，则回退到更保守的 gate 判定，但保留 triage 证据输出
- 若 world-agnostic 边界定义不稳定，则只保留武侠 runtime 配置化，不提前承诺跨题材接入

## 11. Phased Delivery

### Phase A: Warning Triage

- warning triage baseline
- pacing window annotation
- replayability pair annotation
- causality root-cause classification
- ranked root-cause summary

### Phase B: First-Wave Remediation

- first-wave route divergence targeting and implementation
- first-wave midlife milestone targeting and implementation
- first-wave explicit echo targeting and implementation
- causality detector support and verification

### Phase C: Config-Driven Narrative Structures

- stage configuration skeleton and runtime read path
- route definition skeleton and runtime read path
- echo hook skeleton and runtime read path
- summary template skeleton and runtime read path

### Phase D: Boundary And Closure

- world profile boundary note
- regression gate rerun
- closure report

## 12. Acceptance Criteria

- `npm run gate:playability` 继续 PASS
- replayability 近重复对数量下降
- pacing 长空窗明显缩短
- causality direct echo 不再对大多数 persona 恒为 0
- warning triage report 可读、可复核
- 至少一部分阶段、路线、回响、摘要结构已配置化
- 新增或调整一条武侠路线时，主要改配置而非 runtime
- 未来 world pack 的 runtime 边界文档明确
