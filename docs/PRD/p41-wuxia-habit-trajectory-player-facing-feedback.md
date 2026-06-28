# PRD: P41 Wuxia Habit Trajectory Player-Facing Feedback

> **Derived from:** P26-P40 runtime closure (2026-06-25)
> **Stage slug:** `p41-wuxia-habit-trajectory-player-facing-feedback`
> **Parent:** `p26-wuxia-personality-habit-trajectory-optimization`, `p27-wuxia-habit-pool-expansion-and-consequence-wiring`, `p40-wuxia-p8-replay-pacing-polish`

## 1. Introduction

P26-P40 已经把“长期选择 -> 习惯/半性格形成 -> 后续事件与结果变化”的 runtime 链路接通，并通过相关回归测试证明系统在内容层和运行时层成立。但当前项目仍有一个明显短板：

- 玩家**很难直接看见**自己的长期塑形正在朝哪个方向累积
- 玩家在做单次选择时，通常**看不清它会推动哪条习惯轴**
- 玩家即使在中后期吃到回响，也未必能明确把它与自己长期行为联系起来
- 主界面、阶段总结、人生摘要、历史记忆中，尚未形成一套统一的“长期塑形可读性”表达

这会导致一个结果：系统层已经成立，但玩家感知层仍接近“黑箱”，从而削弱 replay 决策、路线经营感和长期选择的项目价值。

P41 的目标不是继续扩内容池，而是把已成立的 habit / semi-personality runtime 能力转化为**玩家可见、可学、可复盘**的体验层。

## 2. Goals

- 让玩家在主界面或阶段摘要中能看见当前主要长期塑形方向
- 让关键选择后的“长期影响”反馈明确指向 habit / semi-personality 轴
- 让中后期回响事件对玩家可读地说明“这是你长期行为塑形的结果”
- 让人生摘要 / life memory / 复盘层能呈现 1-3 条真正影响后续人生的长期轨迹
- 在不引入新数值系统、不新增独立 personality 容器的前提下，提升习惯系统的项目体验价值

## 3. Non-Goals

- 不新增 `personalityTrajectory` 独立状态容器
- 不扩展新的长期轴种类；仅使用现有 `trainingHabit` / `studyHabit` / `businessHabit` / `socialMomentum` / `familyBond`
- 不在 P41 中继续做 P42+ 内容池扩容
- 不重做整体 UI 视觉风格
- 不新增复杂角色面板或专门子页面
- 不在 P41 中改 headless gate 阈值

## 4. User Stories

### US-001: Audit Current Player-Facing Habit Visibility

**Description:** As a maintainer, I want an audit of current main-screen, feedback, and memory surfaces so P41 only patches the missing visibility links instead of inventing a parallel UX path.

**Acceptance Criteria:**

- [ ] Inventory current player-facing surfaces related to long-term state:
  - `GameScreen.vue`
  - `MainScreenLifeSummary.vue`
  - `mainScreenModel.ts`
  - life-memory summary related files
- [ ] Document where habit / semi-personality is already visible, where it is hidden, and where wording is misleading
- [ ] Identify one primary surface for “current shaping direction”, one for “choice consequence hint”, and one for “late-life recap”
- [ ] Save audit under `docs/test-reports/p41-habit-feedback-audit.md`
- [ ] No gameplay behavior changes in this story

### US-002: Surface Current Shaping Direction On Main Screen

**Description:** As a player, I want the main screen summary to show what kind of long-term shaping I am currently building, so I can intentionally continue or pivot my life trajectory.

**Acceptance Criteria:**

- [ ] Add a concise player-facing summary derived from current habit / semi-personality axes
- [ ] Summary must prefer readable labels over raw key names
- [ ] Summary must distinguish at least:
  - martial/training shaping
  - scholarly/study shaping
  - livelihood/business shaping
  - social momentum shaping
  - family bond shaping
- [ ] Summary must degrade cleanly when no axis is yet strong
- [ ] Main-screen wording fits existing summary card and does not require a new standalone panel
- [ ] Add or update tests for summary derivation logic

### US-003: Make Choice Feedback Explicit About Long-Term Direction

**Description:** As a player, I want post-choice “长期影响” feedback to tell me which long-term direction a decision is pushing, so I can connect local choices with future identity and consequence changes.

**Acceptance Criteria:**

- [ ] For actions/events that materially reinforce a habit axis, feedback includes a visible long-term direction hint
- [ ] Hint wording is diegetic/player-facing, not debug-style raw key output
- [ ] At minimum, cover representative actions for:
  - training
  - study
  - business
  - social/family shaping
- [ ] Avoid false precision such as showing exact hidden numeric deltas unless current UX already does so
- [ ] Existing “数值影响 / 关系影响 / 路线变化 / 长期影响” structure remains intact
- [ ] Add targeted regression tests or fixtures for feedback text generation

### US-004: Bind Mid/Late Echo Events To Readable Past-Shaping Language

**Description:** As a player, I want midlife and later-life echo events to read as consequences of my earlier behavior, so the long-term shaping loop feels earned rather than arbitrary.

**Acceptance Criteria:**

- [ ] Review P26-P29 representative echo/consequence events and ensure text legibly references earlier shaping
- [ ] Cover at least one sample each for:
  - trainingHabit
  - studyHabit
  - businessHabit
  - socialMomentum or familyBond
- [ ] Event copy should communicate “long-term塑形的回响”, not just gate eligibility
- [ ] Avoid changing unlock logic in this story unless required for copy consistency
- [ ] Save a sample matrix under `docs/test-reports/p41-habit-echo-legibility-matrix.md`

### US-005: Add Habit Trajectory Recap To Life Memory Summary

**Description:** As a player, I want the life-memory summary to preserve the most important long-term shaping lines from my life, so I can understand what kind of person I became across the whole run.

**Acceptance Criteria:**

- [ ] Extend life-memory summary with a compact habit-trajectory recap section or equivalent field
- [ ] Recap highlights 1-3 dominant shaping directions rather than dumping all axes
- [ ] Recap uses player-facing labels and ties to actual later-life outcomes when possible
- [ ] Summary serialization and existing life-memory tests remain valid or are updated intentionally
- [ ] No raw event ids or internal state keys shown to player-facing output

### US-006: P41 Regression And Closure

**Description:** As a maintainer, I want regression coverage and a closure report proving that the habit system is now player-visible, not only runtime-correct.

**Acceptance Criteria:**

- [ ] Run typecheck
- [ ] Run existing habit trajectory regression tests
- [ ] Run life-memory / main-screen related targeted tests
- [ ] Add at least one isolated P41 regression asserting player-facing habit summary output
- [ ] Save closure under `docs/test-reports/p41-habit-feedback-closure.md`
- [ ] Closure states remaining defer queue clearly

## 5. Success Metrics

| ID | Metric | Baseline | Target |
| --- | --- | --- | --- |
| **M1** | Main-screen can express current shaping direction | weak / implicit | **clear player-facing summary present** |
| **M2** | Choice feedback explicitly references long-term direction | partial | **representative coverage across 4 domains** |
| **M3** | Mid/late echo text legibility | mixed | **sample matrix passes review** |
| **M4** | Life-memory recap of long-term shaping | absent/weak | **1-3 dominant trajectories surfaced** |
| **M5** | Existing runtime habit regressions | pass | **no regression** |

## 6. Dependencies / Context

- Runtime closure files:
  - `src/core/ConditionEvaluator.ts`
  - `src/core/GameEngineIntegration.ts`
  - `src/data/lines/p21-content-samples.json`
  - `src/data/lines/relationship.json`
  - `src/data/lines/family-life.json`
  - `src/data/lines/merchant.json`
- Main-screen summary surfaces:
  - `src/components/GameScreen.vue`
  - `src/components/MainScreenLifeSummary.vue`
  - `src/components/mainScreenModel.ts`
- Life-memory surfaces:
  - `src/components/LifeMemoryPanel.vue`
  - `tests/testLifeMemorySummary.ts`
- Existing habit validation:
  - `tests/personalityHabitTrajectoryTests.ts`
  - `tests/p32RuntimeParityTests.ts`
  - `tests/p33RuntimeParityTests.ts`

## 7. Recommended Execution Order

1. Audit visibility gaps
2. Main-screen shaping summary
3. Choice feedback long-term direction hint
4. Echo event legibility pass
5. Life-memory recap
6. Regression + closure

## 8. Why This Is Next

P41 is the highest-leverage follow-up because it converts a newly-correct runtime system into a player-facing differentiator:

- It improves replay decision quality without requiring a large new content wave
- It makes long-term choice design legible, which strengthens the whole project loop
- It de-risks future P42+ content work by giving the player a clearer causal model

After P41, the next natural phases are:

- **P42:** habit/semi-personality content pool densification
- **P43:** archetype-specific recap and ending differentiation
- **P44:** operator-facing audit tools for long-term shaping coverage
