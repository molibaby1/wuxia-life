# PRD: P11 Stage-Route-Driven Narrative Scheduling

## 1. Introduction

P10 已经把 `stageConfig`、`routeDefinitions`、`echoHooks`、`summaryTemplates` 的主要解释层硬编码收掉，并引入了显式 `WorldProfile` 装配入口。但当前 runtime 的主要问题仍然是：这些配置虽然能被读取，却还没有真正主导“什么时候给什么内容、何时补什么反馈、何时强化或分化路线”。

P11 的目标是把 `stageConfig` 与 `routeDefinitions` 从“配置入口”推进为“事件调度真源”。本阶段直接接入事件选择/优先级调度主流程，同时允许补入一小批武侠内容点，验证调度结果确实改变了 0-40 岁切片的节奏、反馈密度与路线分化。

## 2. Goals

- 让 `stageConfig` 真实参与 0-40 岁的内容调度、反馈缺口判断与补点选择
- 让 `routeDefinitions` 真实参与 route reinforcement / divergence / identity signal 的调度决策
- 为每个阶段输出可验证的“应有信号 vs 实际信号”证据，而不只看最终 summary
- 补齐一小批武侠内容点，使新调度路径有实际内容可触发，而不是空调度
- 新增 P11 阶段门禁或报告，证明 stage/route-driven scheduling 已生效
- 保持现有 `gate:playability`、P9/P10 回归、0-40 武侠切片不退化

## 3. User Stories

### US-001: Stage Scheduling Baseline Audit
**Description:** As a maintainer, I want a baseline report of stage expectations versus actual signals so that P11 starts from measured scheduling gaps instead of assumptions.

**Acceptance Criteria:**
- [ ] Produce a report for ages 0-10, 10-20, 20-30, and 30-40 using current simulation output
- [ ] For each stage, list expected signals from `stageConfig.feedbackExpectation.expectedSignals`
- [ ] For each stage, list actual signals observed in records, grouped by signal type
- [ ] Classify each missing signal as no-content, weak-scheduling, or weak-detection
- [ ] Save the report under `docs/test-reports/`

### US-002: Route Scheduling Baseline Audit
**Description:** As a designer, I want a route-level audit of reinforcement and divergence coverage so that I can see where route definitions are not yet affecting the runtime.

**Acceptance Criteria:**
- [ ] For each primary wuxia route used in P8 personas, report configured entry, reinforcement, divergence, and identity points
- [ ] For each point, report whether simulation records show a matching event, flag, or summary signal
- [ ] Identify which route points are configured but never scheduled
- [ ] Save the route audit under `docs/test-reports/`

### US-003: Stage Signal Detection Helpers
**Description:** As a developer, I want stable stage signal detection helpers so that the runtime and reports evaluate stage expectations through one shared ruleset.

**Acceptance Criteria:**
- [ ] Add a shared helper that maps simulation records and state to normalized signal keys such as `origin`, `route_entry`, `relationship_shift`, `achievement`, and `age40_identity`
- [ ] The helper supports stage expectation checks for all four 0-40 age bands
- [ ] Existing reports continue to run without requiring duplicated signal parsing logic
- [ ] `npm run typecheck` passes
- [ ] Relevant tests pass

### US-004: Stage-Aware Scheduling Policy
**Description:** As a player, I want low-feedback stages to bias toward missing signal types so that each life stage produces visible narrative progress instead of empty advancement.

**Acceptance Criteria:**
- [ ] Add a scheduling policy that reads the current stage and its expected signals before selecting fallback or candidate content
- [ ] When a stage is missing one of its expected signals, scheduling increases priority for content that can supply that signal
- [ ] The policy does not guarantee the same event every run; it changes priorities rather than forcing one exact script
- [ ] Existing non-stage-gated content can still trigger when valid
- [ ] `npm run typecheck` passes
- [ ] Relevant tests pass

### US-005: Route Reinforcement Scheduling
**Description:** As a player, I want my early route tendency to receive reinforcing content in the correct age band so that my path feels deliberately supported.

**Acceptance Criteria:**
- [ ] Runtime reads `routeDefinitions.reinforcementPoints` during event scheduling or prioritization
- [ ] At least one reinforcement point for martial, scholar, social, wealth, and wanderer routes can affect scheduling outcome
- [ ] Reinforcement scheduling uses configured age band and configured event/flag hints rather than hardcoded route branches
- [ ] Existing route identity summaries remain functional
- [ ] `npm run typecheck` passes
- [ ] Relevant tests pass

### US-006: Route Divergence Scheduling
**Description:** As a player, I want midlife route divergence to be triggered by configured route points so that different personas do not collapse into the same experience.

**Acceptance Criteria:**
- [ ] Runtime reads `routeDefinitions.divergencePoints` during event scheduling or prioritization
- [ ] At least one configured divergence point for wealth vs wanderer and one for martial vs deviant can affect scheduling outcome
- [ ] Divergence scheduling can prefer content that confirms route separation by event, flag, or summary-visible identity signal
- [ ] The behavior is driven by route config, not a hardcoded persona id list
- [ ] `npm run typecheck` passes
- [ ] Relevant tests pass

### US-007: First P11 Wuxia Scheduling Content Pack
**Description:** As a designer, I want a small set of wuxia content hooks aligned to stage and route signals so that the new scheduler has real content to select.

**Acceptance Criteria:**
- [ ] Add a minimal content pack covering at least one 20-30 stage feedback gap and one 30-40 route divergence gap
- [ ] Each new or revised content item declares which stage signal or route point it satisfies
- [ ] The pack is limited to the minimum content needed to validate scheduling behavior
- [ ] No unrelated system expansion is introduced
- [ ] `npm run typecheck` passes
- [ ] Relevant tests pass

### US-008: Scheduler-Content Wiring Verification
**Description:** As a maintainer, I want proof that the new content pack is being selected because of stage/route scheduling rather than by accident.

**Acceptance Criteria:**
- [ ] Add focused tests or diagnostics showing the scheduler considered stage or route requirements when choosing the content
- [ ] Record at least one positive example where missing stage feedback changed event priority
- [ ] Record at least one positive example where route divergence changed event priority
- [ ] Save the verification note under `docs/test-reports/`
- [ ] Relevant tests pass

### US-009: P11 Scheduling Gate Command Or Report
**Description:** As a project owner, I want a dedicated P11 scheduling gate or report so that stage/route-driven scheduling can be verified independently of the broader playability gate.

**Acceptance Criteria:**
- [ ] Add one stable command or scripted report for P11 scheduling verification
- [ ] The output reports stage expectation coverage for all four age bands
- [ ] The output reports route reinforcement/divergence coverage for the targeted routes
- [ ] The output clearly marks pass, warning, or fail for scheduling coverage
- [ ] Save machine-readable and human-readable output under stable paths
- [ ] `npm run typecheck` passes
- [ ] Relevant tests pass

### US-010: P11 Regression And Closure Report
**Description:** As a maintainer, I want a closure report comparing pre-P11 and post-P11 scheduling evidence so that the next phase starts from verified progress.

**Acceptance Criteria:**
- [ ] Run `npm run gate:playability` after P11 changes
- [ ] Run the P11 scheduling gate or report after P11 changes
- [ ] Compare before and after stage signal coverage for each age band
- [ ] Compare before and after route reinforcement/divergence coverage for targeted routes
- [ ] Summarize residual gaps that still require later persona strategy or second-theme work
- [ ] Save the closure report under `docs/test-reports/`

## 4. Functional Requirements

- FR-1: The runtime must read the active life stage before resolving narrative scheduling priorities.
- FR-2: The scheduler must compare current stage state against `feedbackExpectation.expectedSignals`.
- FR-3: The scheduler must be able to raise priority for content that satisfies missing stage signals.
- FR-4: The scheduler must read route reinforcement points from `routeDefinitions`.
- FR-5: The scheduler must read route divergence points from `routeDefinitions`.
- FR-6: Route scheduling must use configured age bands plus configured event or flag hints rather than hardcoded persona branches.
- FR-7: The system must expose a shared signal-detection layer so reports and scheduler logic use the same normalized stage/route signal vocabulary.
- FR-8: New or revised wuxia content items introduced in P11 must declare which stage signal or route point they satisfy.
- FR-9: The project must provide a dedicated P11 scheduling verification command or report with stable output paths.
- FR-10: P11 changes must not break `npm run gate:playability`, existing P9/P10 narrative regressions, or the 0-40 summary path.

## 5. Non-Goals

- No second-theme or alternate world pack implementation
- No rewrite of the full active-action persona strategy model
- No large-scale content expansion beyond the minimum P11 validation pack
- No UI redesign or new frontend workflow for scheduling inspection
- No save schema or backend API changes
- No attempt to make all narrative behavior world-agnostic in this phase

## 6. Design Considerations

- Prefer behavior-level scheduling bias over deterministic scripting; the system should prioritize fitting content, not force one single linear route.
- Keep the 0-40 slice as the only required validation surface for P11.
- Reuse existing narrative config structures rather than introducing a second parallel scheduling schema.
- Reports should be readable by follow-up sessions without re-reading implementation code.

## 7. Technical Considerations

- P10 already introduced explicit config entry points and a `WorldProfile`; P11 should build on those types rather than adding sidecar config readers.
- Signal detection should be centralized so `gate:playability`, the P11 scheduling report, and future world-pack work do not drift.
- Route scheduling will likely need metadata beyond `eventId` and `flagKey`; if added, it must stay inside existing route config structures rather than creating ad hoc runtime-only maps.
- Content selection must remain probabilistic enough to preserve replayability while still improving stage and route coverage.
- Tests should cover both positive scheduling cases and negative cases where generic content should not be misclassified as satisfying a missing signal.

## 8. Success Metrics

- The new P11 scheduling report shows explicit coverage results for all four stage bands and all targeted route points.
- At least one previously missing or weak stage signal category is now covered in simulation evidence.
- At least one targeted route reinforcement or divergence path now shows scheduler-driven evidence in simulation records.
- `npm run gate:playability` remains PASS, or if warnings remain, they do not regress because of P11 scheduling changes.
- Follow-up sessions can identify remaining gaps by reading the P11 closure report without re-deriving scheduling behavior from source code.

## 9. Open Questions

- Should stage scheduling bias only fallback/no-event turns, or should it also reprioritize normal candidate events earlier in the pipeline?
- What is the minimum metadata needed on content items to declare the stage or route signal they satisfy without creating a second content taxonomy?
- Should the P11 scheduling gate be a standalone command, or an extension of an existing simulation/report command with a dedicated output mode?

