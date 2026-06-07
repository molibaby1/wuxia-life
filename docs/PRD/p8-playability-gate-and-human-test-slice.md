# PRD: P8 自动化可玩性门禁与真人测试切片

## 1. Introduction

P7/P7.1 已经把游戏从纯随机事件推进到“玩家可主动规划”的基础形态，但项目仍存在一个更根本的风险：即使继续补天赋、道具、世界观和更多路线，核心循环也可能依然不好玩。

P8 的目标不是扩成终局系统，而是在继续投入大系统之前建立一套可回归的可玩性判断机制，并准备一个真人玩家可测试的 0-40 岁切片。自动化门禁用于筛掉明显不成立的版本，真人测试切片用于验证玩家是否真的产生目标感、成就感、挫折感和重玩欲望。

## 2. Goals

- 建立 `P8 Playability Gate`，用小样本固定画像/seed 自动评估 0-40 岁体验。
- 让模拟玩家不再只在无事件时固定练功，而是按画像选择不同主动行动策略。
- 输出可读的可玩性报告，解释规划、因果、挫折、路线分化和重玩差异。
- 准备 20-30 分钟真人可测切片的准入线、测试脚本和观察表。
- 允许少量补齐主动行动、路线、反馈、摘要 UI，但禁止扩展天赋、道具、大世界等终局系统。
- 明确自动化测试的边界：它只能拦截明显问题，不能替代真人玩家判断。

## 3. User Stories

### US-001: Baseline Current Simulation Coverage
**Description:** As a maintainer, I want a read-only baseline of current simulation coverage so that P8 starts from known evidence rather than assumptions.

**Acceptance Criteria:**
- [ ] Document which current commands cover gameplay simulation, experience health, golden-line, headless parity, and browser runtime checks.
- [ ] Identify which current metrics already reflect playability and which do not.
- [ ] Identify current simulation blind spots for active action choice, player agency, UI comprehension, and replay motivation.
- [ ] Save the baseline under `docs/test-reports/`.
- [ ] Typecheck is not required because this is documentation-only.

### US-002: Define P8 Playability Metrics
**Description:** As a project owner, I want explicit playability metrics so that the project can be judged by player value rather than feature count.

**Acceptance Criteria:**
- [ ] Define metric keys for agency, causality, achievement, frustration, replayability, pacing, and narrative memory.
- [ ] Each metric has a clear formula or scoring rule.
- [ ] Each metric declares severity: blocker, warning, or info.
- [ ] Each metric declares whether it can be measured by simulation, browser check, or human testing only.
- [ ] Add threshold defaults for the small-sample P8 gate.

### US-003: Define Fixed Player Personas
**Description:** As a designer, I want fixed simulated player personas so that automated runs cover different motivations.

**Acceptance Criteria:**
- [ ] Define 6-10 personas with stable ids, names, gender, seed, and strategy.
- [ ] Personas include at least martial, scholarly, social, wealth-seeking, risk-averse, and deviant/邪路倾向.
- [ ] Each persona declares intended short-term goals for 0-20, 20-30, and 30-40.
- [ ] Personas are documented in a design note under `docs/designs/`.

### US-004: Active Action Strategy Model
**Description:** As a maintainer, I want simulated players to choose active actions by strategy so that P8 does not overfit to fixed练功.

**Acceptance Criteria:**
- [ ] Replace or extend fixed no-event `action_training_basic` fallback with strategy-based active action selection.
- [ ] Strategy selection can choose at least training, study, socializing, wealth/business, and exploration if available.
- [ ] Strategy selection records why an action was selected.
- [ ] Existing P7 active action replay records remain replayable.
- [ ] `npm test` passes.

### US-005: Persona Choice Bias
**Description:** As a designer, I want persona-specific event choice bias so that simulations represent different player intentions.

**Acceptance Criteria:**
- [ ] Existing `choiceTendency` scoring is extended or mapped to P8 personas without removing current route-track behavior.
- [ ] Persona choice decisions include goal alignment, risk preference, relationship preference, and route preference where applicable.
- [ ] The simulator records the selected choice score and top competing choice score for diagnostics.
- [ ] Existing `simulate:gameplay:samples` still runs.
- [ ] `npm test` passes.

### US-006: Agency Metric Implementation
**Description:** As a project owner, I want to measure whether players have meaningful planning agency so that the game does not regress into random playback.

**Acceptance Criteria:**
- [ ] Report active action count, story event count, choice event count, and forced event count per persona.
- [ ] Report active action diversity by category.
- [ ] Fail the P8 gate if a persona spends too many no-event turns on the same active action without route, goal, or narrative change.
- [ ] Include metric output in machine-readable JSON.

### US-007: Causality Echo Metric
**Description:** As a player, I want earlier choices to visibly affect later outcomes so that my life feels authored rather than random.

**Acceptance Criteria:**
- [ ] Count later event requirements, unlocked choices, feedback text, route state changes, or report fields that reference earlier choices/actions.
- [ ] Distinguish direct causality from generic stat growth.
- [ ] Flag personas with too few causality echoes by age 40.
- [ ] Include examples of strongest causality echoes in the report.

### US-008: Achievement Metric
**Description:** As a player, I want to accomplish short-term goals so that the first 20-30 minutes have payoff.

**Acceptance Criteria:**
- [ ] Each persona has 2-4 expected short goals.
- [ ] The report marks each goal as achieved, missed, or unavailable.
- [ ] Goal evidence references concrete flags, route states, stats, relationships, or event ids.
- [ ] The P8 gate warns if most personas reach age 40 with no achieved goal.

### US-009: Frustration And Recovery Metric
**Description:** As a player, I want setbacks to feel fair so that failure creates retry desire rather than distrust.

**Acceptance Criteria:**
- [ ] Detect negative outcomes and classify them as warned, explained, recoverable, or opaque.
- [ ] Report the ratio of opaque negative outcomes per persona.
- [ ] Include at least one concrete example for each opaque setback.
- [ ] Fail the P8 gate if opaque setbacks exceed the blocker threshold.

### US-010: Replay Difference Metric
**Description:** As a project owner, I want different personas and seeds to produce different lives so that replay value can be evaluated before adding large systems.

**Acceptance Criteria:**
- [ ] Compare personas by route tags, key choices, active action distribution, relationship state, major stats, and age-40 summary.
- [ ] Report similarity clusters.
- [ ] Warn if multiple personas produce nearly identical route and summary outputs.
- [ ] Include machine-readable similarity scores.

### US-011: Pacing And Boredom Metric
**Description:** As a player, I want frequent meaningful change so that the 0-40 slice does not feel empty.

**Acceptance Criteria:**
- [ ] Detect long windows with no new choice, no route change, no relationship change, no meaningful stat threshold, and no new summary line.
- [ ] Report longest low-impact span per persona.
- [ ] Fail the P8 gate if any persona has a blocker-level low-impact span.
- [ ] Preserve existing `gate:experience` repetition blockers.

### US-012: Narrative Memory Summary
**Description:** As a tester, I want each simulated life to produce a readable summary so that automation output can be reviewed like a player story.

**Acceptance Criteria:**
- [ ] Generate a 3-part summary for each persona: early life, turning point, age-40 identity.
- [ ] Include at least 3 cited evidence points from events, actions, or route changes.
- [ ] Mark missing identity or missing turning point as a warning.
- [ ] Save summary in both JSON and Markdown report.

### US-013: P8 Playability Gate Command
**Description:** As a maintainer, I want one command for P8 playability checks so that future sessions can run the same acceptance gate.

**Acceptance Criteria:**
- [ ] Add a package script such as `gate:playability`.
- [ ] The command runs the fixed P8 persona set and produces a pass/fail decision.
- [ ] The command exits non-zero on blocker failures.
- [ ] The command writes a stable report path under `docs/test-reports/` or `public/reports/`.
- [ ] `npm run gate:playability` is documented in the P8 closure report.

### US-014: Human Test Slice Scope Document
**Description:** As a project owner, I want a precise definition of the 0-40真人测试切片 so that implementation does not drift into the full game.

**Acceptance Criteria:**
- [ ] Define the intended 20-30 minute experience from age 0 to 40.
- [ ] List required early routes, active actions, feedback surfaces, and summary surfaces.
- [ ] List explicit content minimums and non-goals.
- [ ] Clarify that the slice is not expected to cover full endgame, complete item economy, or complete world map.

### US-015: Slice Gap Audit
**Description:** As a maintainer, I want to compare the current game against the human test slice so that only necessary gaps are filled.

**Acceptance Criteria:**
- [ ] Audit current 0-40 route availability, active action categories, attribute visibility, relationship feedback, and summary UI.
- [ ] Classify each gap as blocker, warning, or defer.
- [ ] Do not implement fixes in this story.
- [ ] Save the audit under `docs/test-reports/`.

### US-016: Minimum Active Action Coverage For Slice
**Description:** As a player, I want several viable things to do when no event forces me so that planning feels active.

**Acceptance Criteria:**
- [ ] The 0-40 slice exposes at least training, study, social, and wealth/exploration-oriented active action directions where design allows.
- [ ] Each direction has visible reward, cost, risk, and likely use case.
- [ ] Each direction can be selected in the local Web flow.
- [ ] `npm run gate:playability` passes or reports only known non-blocking warnings.
- [ ] Verify in browser using dev-browser skill.

### US-017: Minimum Route Differentiation For Slice
**Description:** As a player, I want early life choices to lead toward different identities so that replaying feels meaningful.

**Acceptance Criteria:**
- [ ] The 0-40 slice supports at least three distinct early identities or route tendencies.
- [ ] At least two personas reach meaningfully different route/identity states by age 40 in the P8 gate.
- [ ] Route identity is visible in UI or life summary.
- [ ] No new large route system is introduced beyond the minimum slice need.
- [ ] Verify in browser using dev-browser skill.

### US-018: Attribute Meaning And Visibility Slice Polish
**Description:** As a player, I want attributes to explain what they affect so that growth feels meaningful.

**Acceptance Criteria:**
- [ ] The attribute panel shows player-facing meaning for key visible attributes.
- [ ] Hidden or implicit attributes are not exposed as exact numbers unless current self-awareness rules allow it.
- [ ] At least 3 choices or active actions visibly reference relevant attribute meaning.
- [ ] Verify in browser using dev-browser skill.

### US-019: Age-40 Life Summary For Human Testing
**Description:** As a tester, I want the game to summarize the life so far so that I can judge whether the playthrough created a memorable story.

**Acceptance Criteria:**
- [ ] At or before age 40, the game can show a summary of goals, major choices, setbacks, route identity, and unexplored hints.
- [ ] Summary distinguishes player-driven active actions from forced story events.
- [ ] Summary includes at least one replay hook when available.
- [ ] Verify in browser using dev-browser skill.

### US-020: Human Test Script And Observation Sheet
**Description:** As a project owner, I want a repeatable test script so that真人反馈 can be compared across players.

**Acceptance Criteria:**
- [ ] Create a test script for 5-8 players, 20-30 minutes each.
- [ ] Include pre-test instructions that do not over-explain hidden systems.
- [ ] Include post-test questions about goal, causality, achievement, frustration, replay desire, and memorable story.
- [ ] Include an observer checklist for confusion, hesitation, boredom, and restart intent.
- [ ] Save the script under `docs/test-reports/` or `docs/designs/`.

### US-021: Browser Acceptance For Human Slice
**Description:** As a maintainer, I want to verify the local Web flow before inviting真人测试 so that testers do not hit obvious runtime blockers.

**Acceptance Criteria:**
- [ ] Start a local Web session from the start screen.
- [ ] Play through enough turns to reach active action selection and at least one route/identity signal.
- [ ] Verify no blocking console errors during start, active action, choice, summary, and save/load if used.
- [ ] Capture notes for any UX blockers that automation cannot judge.
- [ ] Verify in browser using dev-browser skill.

### US-022: P8 Closure Report
**Description:** As a project owner, I want a final P8 closure report so that the next decision is based on evidence.

**Acceptance Criteria:**
- [ ] Report automated gate result, major warnings, and blocker status.
- [ ] Report whether the human test slice meets准入线.
- [ ] List remaining risks before真人测试.
- [ ] Recommend one of: run真人测试, fix blockers first, or stop/reshape project direction.
- [ ] Include commands used for verification.

## 4. Functional Requirements

- FR-1: The system must provide a P8 playability metric definition covering agency, causality, achievement, frustration, replayability, pacing, and narrative memory.
- FR-2: The simulation runner must support a fixed small sample of 6-10 player personas.
- FR-3: The simulator must support persona-driven active action selection instead of always selecting basic training when no story event is available.
- FR-4: The simulator must record selected active action id, category, reason, and relevant competing options where available.
- FR-5: The simulator must record selected event choice, choice score, and relevant competing choice score for P8 diagnostics.
- FR-6: The P8 report must output per-persona and aggregate metrics in machine-readable JSON.
- FR-7: The P8 report must output a human-readable summary suitable for product review.
- FR-8: The P8 gate must produce a pass/fail decision and non-zero exit code on blocker failures.
- FR-9: The P8 gate must not replace existing `gate:experience`, `gate:golden-line`, or `gate:p5`; it is an additional playability gate.
- FR-10: The human test slice must define a 0-40 age range and 20-30 minute target session.
- FR-11: The local Web flow must expose enough active action, route, attribute, and summary feedback for a player to understand what kind of person they are becoming.
- FR-12: The test script must include standardized post-test questions and observer notes.

## 5. Non-Goals

- P8 does not implement a complete talent system.
- P8 does not implement inventory, equipment, item economy, or crafting.
- P8 does not implement a complete world map, region system, or faction reputation grid.
- P8 does not batch-wire all deferred event files.
- P8 does not require API/server-backed active planning unless separately approved.
- P8 does not tune the entire lifetime balance beyond the 0-40 test slice.
- P8 does not claim automation can prove the game is fun.
- P8 does not recruit or run真人玩家测试; it prepares the version, script, and准入判断.

## 6. Design Considerations

- The report should be readable by a designer without inspecting raw event JSON.
- The report should include concrete evidence snippets, not only numeric scores.
- The 0-40 slice should bias toward clarity over breadth: fewer routes with strong feedback are better than many vague hooks.
- Human testers should not need internal knowledge of P7/P7.1 to understand what to do.
- UI changes should preserve existing visual language unless a specific slice blocker requires adjustment.

## 7. Technical Considerations

- Existing entry points to reuse include `scripts/runGameplaySimulation.ts`, `tests/GameProcessSimulator.ts`, `gate:experience`, `gate:golden-line`, and P7/P7.1 active planning report helpers.
- Existing route-track fixtures must not be broken by persona scoring changes.
- P8 simulation must stay deterministic for fixed persona/seed runs.
- Generated reports may update `public/reports/manifest.json`; this is expected for simulation runs.
- Browser verification is required for UI stories because Node simulation cannot validate interaction clarity, layout, console stability, or perceived readability.
- Current engine still has singleton and Vue-reactive coupling; P8 should avoid turning this into a backend extraction project.

## 8. Success Metrics

- `gate:playability` runs the fixed small sample and produces deterministic reports.
- At least 4 active action directions are represented across the P8 persona set.
- By age 40, most personas achieve at least one documented short-term goal.
- Each persona has at least one concrete causality echo by age 40.
- Opaque negative outcomes stay below the blocker threshold.
- Persona summaries show meaningful differences in route, identity, or strategy.
- The 0-40 local Web slice can be played without blocking console errors.
- The final P8 report can recommend whether to proceed to真人测试, fix blockers, or reshape the project.

## 9. Open Questions

- What exact numeric thresholds should be used for each metric after the first baseline run?
- Should age 40 be a hard stop in the UI for testing, or only a report checkpoint?
- Which three early route identities should be treated as mandatory for the first真人切片?
- Should the P8 gate be part of `npm run validate`, or remain a separate product gate due to report generation cost?
- Should API mode be excluded from P8 human testing until server-backed active planning exists?

