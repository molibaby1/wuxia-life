# PRD: P42 Wuxia Habit Trajectory Content Densification

> **Derived from:** P26-P41 habit trajectory runtime and player-facing foundation
> **Stage slug:** `p42-wuxia-habit-trajectory-content-densification`
> **Parent:** `p41-wuxia-habit-trajectory-player-facing-feedback`

## 1. Introduction

P41 解决的是“玩家能否看见长期塑形”。P42 要解决的则是“玩家是否能在更多年龄段、更多路线、更多人生类型里持续感受到长期塑形的存在”。

当前系统已经具备以下基础：

- runtime 已能稳定读写 `trainingHabit` / `studyHabit` / `businessHabit`
- `socialMomentum` / `familyBond` 已进入一部分内容链
- 主链样本与若干中后期 consequence 已存在

但整体内容密度仍然偏薄：

- 某些轴只有少量代表性样本，尚未形成“多次可感知”的体验
- 不同 archetype 对同一长期塑形的体验分化还不够
- 某些年龄段仍容易出现“系统存在，但内容回声稀疏”的空窗

P42 的目标不是继续做玩家提示，也不是再修 runtime，而是系统性补齐 habit / semi-personality 内容密度，使这套系统从“已成立”进入“稳定可玩”。

## 2. Goals

- 为五条长期轴补齐更多年龄段和路线样本
- 让同一条长期塑形在不同 archetype 下呈现不同人生后果
- 降低长期塑形系统的内容空窗期
- 强化 replay 中“同样前期投入，不同人生类型会产生不同回响”的差异感

## 3. Non-Goals

- 不新增新的长期轴
- 不重做主界面或反馈 UI
- 不改 scheduler 核心
- 不在 P42 中做 ending 总结层重构
- 不做 operator 工具或全量审计台

## 4. User Stories

### US-001: Audit Habit Content Coverage Gaps By Axis And Age Band

**Description:** As a maintainer, I want a concrete coverage map of current habit and semi-personality samples by axis and age band so densification work stays targeted.

**Acceptance Criteria:**

- [ ] Inventory current samples for `trainingHabit`, `studyHabit`, `businessHabit`, `socialMomentum`, `familyBond`
- [ ] Classify each sample by age band: childhood, youth, early adult, midlife, later life
- [ ] Identify sparse bands and single-sample dependency risks
- [ ] Save audit under `docs/test-reports/p42-habit-coverage-gap-map.md`
- [ ] No gameplay behavior changes in this story

### US-002: Densify Training And Study Habit Content

**Description:** As a player, I want repeated but varied martial and scholarly shaping payoffs so long-term discipline feels like a real life pattern rather than a one-off gate.

**Acceptance Criteria:**

- [ ] Add at least 2 new `trainingHabit`-led content samples in uncovered or weak bands
- [ ] Add at least 2 new `studyHabit`-led content samples in uncovered or weak bands
- [ ] At least one sample per axis must be non-route-only and readable as long-term shaping
- [ ] Samples must not duplicate existing P21/P26/P27 roles too closely
- [ ] Add or update targeted regression coverage for new sample eligibility

### US-003: Densify Business And Social Momentum Content

**Description:** As a player, I want livelihood and social shaping to have enough density that merchant-like or network-driven lives feel continuously reinforced.

**Acceptance Criteria:**

- [ ] Add at least 2 new `businessHabit`-led samples
- [ ] Add at least 2 new `socialMomentum`-led samples
- [ ] At least one sample must produce a materially different obligation/opportunity pattern from current baseline
- [ ] Samples must span more than one age band
- [ ] Add or update targeted regression coverage

### US-004: Densify Family Bond And Caretaking Consequences

**Description:** As a player, I want strong family shaping to continue echoing across different later-life situations rather than collapsing into one or two obligations.

**Acceptance Criteria:**

- [ ] Add at least 2 new `familyBond`-led samples
- [ ] At least one sample must be positive or restorative, not only burden/obligation
- [ ] At least one sample must materially affect relationship, money, or identity consequences
- [ ] New samples do not contradict existing family-state logic
- [ ] Add or update targeted regression coverage

### US-005: Differentiate Habit Echoes Across Archetypes

**Description:** As a player, I want the same shaping axis to feel different when it appears inside different life archetypes, so replay stays fresh.

**Acceptance Criteria:**

- [ ] Select at least 2 axes and 2 archetype clusters for differentiated content treatment
- [ ] Add or revise content so the same axis leads to meaningfully different narrative framing or consequence shape
- [ ] Differences are visible in content or consequence, not only hidden gates
- [ ] Document before/after examples under `docs/test-reports/p42-archetype-differentiation-matrix.md`

### US-006: P42 Regression And Closure

**Description:** As a maintainer, I want a regression pass and closure report proving that content densification improved long-term shaping stability without runtime regression.

**Acceptance Criteria:**

- [ ] Run typecheck
- [ ] Run existing habit trajectory regressions
- [ ] Add at least one isolated P42 content-density regression or coverage test
- [ ] Save closure under `docs/test-reports/p42-habit-content-densification-closure.md`
- [ ] Closure lists remaining thin areas clearly

## 5. Success Metrics

| ID | Metric | Baseline | Target |
| --- | --- | --- | --- |
| **M1** | Axis coverage by age band | uneven | **all 5 axes have multi-band presence** |
| **M2** | Single-sample dependency risk | high in places | **reduced for key axes** |
| **M3** | Archetype differentiation | partial | **documented improvement across at least 2 clusters** |
| **M4** | Runtime habit regressions | pass | **no regression** |

## 6. Dependencies / Context

- P26-P40 runtime closure
- P41 player-facing feedback surfaces
- Current habit sample pool in `p21`, `p22`, `medical`, `relationship`, `family-life`, `merchant`
- Existing regressions:
  - `tests/personalityHabitTrajectoryTests.ts`
  - `tests/p32RuntimeParityTests.ts`
  - `tests/p33RuntimeParityTests.ts`
  - `tests/p39ContentPoolConsistencyTests.ts`

## 7. Recommended Execution Order

1. Coverage gap audit
2. Training/study densification
3. Business/social densification
4. Family bond densification
5. Archetype differentiation pass
6. Regression + closure

## 8. Why This Is Next

P42 is the natural follow-up because once the system is runtime-correct and player-visible, the highest-value next step is to make it content-dense enough to survive repeated play without thinning out.

