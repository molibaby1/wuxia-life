# PRD: P45 Wuxia Personality Habit Trajectory Quantitative Validation

> **Derived from:** P26-P44 long-term shaping mechanism closure
> **Stage slug:** `p45-wuxia-personality-habit-trajectory-quantitative-validation`
> **Parent:** `p44-wuxia-habit-trajectory-operator-audit-tooling`

## 1. Introduction

到 P44 为止，`wuxia-life` 已经具备一条完整的长期塑形机制链：

- 长期选择会沉淀为人格 / 习惯状态
- 人格 / 习惯状态会影响后续反馈、事件、成长和收口结果
- 玩家与维护者都已经能在若干界面和审计产物中看到这条链路

但当前仍缺一个更严格的确认：

项目虽然已经证明“机制存在”，却还没有充分证明“这套机制会在整段人生中稳定地把不同的人推向不同的成长方向”。

用户当前关心的不是再做一轮玩家可见性，也不是进入“最小可玩人生样本线”包装，而是先用真实 replay / 生命周期样本回答下面的问题：

- 不同性格或偏好是否真的会引导不同的自动成长方向？
- 这种差异是否会在 0-40 岁或更长区间里持续累积？
- 后续事件与结果分化，是否能够追溯回早期的长期选择与塑形倾向？
- 若不能稳定成立，问题是在内容覆盖、触发密度、因果传导，还是验证口径本身？

P45 的目标就是把这件事从“感觉可能成立”变成“有回放证据、差异指标和失败样本归因的验证结论”。

## 2. Goals

- 为长期塑形机制建立一套 replay-oriented quantitative validation 基线
- 验证不同初始偏好 / 长期选择倾向是否会把人物推向可区分的成长方向
- 验证差异是否能在关键年龄段、关键选择和中后期结果中持续体现
- 让失败样本能被归因为内容薄弱、触发稀疏、分化不足或因果链断裂
- 为后续“最小可玩人生样本线”提供可信的下层证据，而不是反过来让样本线替机制兜底

## 3. Non-Goals

- 不设计“最小可玩人生样本线”或章节化体验包装
- 不继续做玩家可见性优化；P41-P43 已处理该方向
- 不新增独立 personality 容器或重写 runtime
- 不做全量内容扩写
- 不把 `gate:playability` PASS 当作本阶段唯一验收
- 不在本阶段直接修所有内容问题；先建立验证口径与问题定位能力

## 4. User Stories

### US-001: Define Quantitative Validation Questions And Success Bar

**Description:** As a maintainer, I want an explicit validation contract for the shaping mechanism so later replay evidence is judged against a stable, non-handwavy bar.

**Acceptance Criteria:**

- [ ] Define the core validation questions:
  - 不同偏好 / 长期选择是否导向不同成长方向
  - 差异是否在关键年龄段持续累积
  - 中后期事件 / 身份 / 总结是否能追溯回早期塑形
  - 哪些失败样本说明“机制弱”，而不是单纯运气波动
- [ ] Define pass / warning / fail interpretation for this stage
- [ ] Define the minimum evidence bundle required before declaring the mechanism “量上已验证”
- [ ] Save contract under `docs/test-reports/p45-trajectory-validation-contract.md`
- [ ] No gameplay behavior changes in this story

### US-002: Define Replay Persona Matrix And Seed Coverage

**Description:** As a maintainer, I want a bounded replay matrix of personas, tendencies, and seeds so validation has enough coverage without turning into infinite simulation work.

**Acceptance Criteria:**

- [ ] Define a replay matrix covering at least:
  - martial/training-leaning
  - scholarly/study-leaning
  - business/livelihood-leaning
  - mixed / balanced tendency
- [ ] For each persona, specify fixed seeds and target age window
- [ ] Document which early-life choices or action preferences represent the intended shaping push
- [ ] Save matrix under `docs/test-reports/p45-replay-persona-matrix.md`
- [ ] Matrix is small enough to run repeatedly in future regression loops

### US-003: Add Deterministic Trajectory Replay Harness

**Description:** As a maintainer, I want a deterministic replay harness for shaping validation so I can rerun the same life samples and compare trajectories over time.

**Acceptance Criteria:**

- [ ] Add a bounded script or test surface that runs the replay matrix deterministically
- [ ] Output includes at least:
  - major age checkpoints
  - dominant shaping axes
  - key route / identity / consequence signals
  - notable outcome deltas
- [ ] Output is readable in terminal and exportable to `docs/test-reports/`
- [ ] Harness does not require manual UI play to reproduce the same sample set
- [ ] Add regression coverage for output shape or fixture stability

### US-004: Produce Trajectory Differentiation Report

**Description:** As a maintainer, I want a concrete report comparing replay outcomes across personas so I can see whether shaping actually produces materially different life directions.

**Acceptance Criteria:**

- [ ] Generate a report comparing the replay matrix by persona and seed
- [ ] Report calls out where trajectories materially diverge and where they collapse together
- [ ] Report includes at least one comparison each for:
  - growth emphasis
  - route / identity drift
  - midlife consequence pattern
  - life-memory / recap differentiation
- [ ] Save report under `docs/test-reports/p45-trajectory-differentiation-report.md`
- [ ] Report avoids vague conclusions like “feels different” without evidence snippets

### US-005: Add Early-Choice To Later-Outcome Traceability Slice

**Description:** As a maintainer, I want at least one explicit traceability slice from early shaping choices to later outcomes so the mechanism can be defended as causal rather than coincidental.

**Acceptance Criteria:**

- [ ] Select representative replay samples from at least 3 shaping directions
- [ ] For each sample, document:
  - early shaping choices or action patterns
  - state accumulation on habit / semi-personality axes
  - later consequence, identity, or summary differences
- [ ] Trace avoids raw internal dumps where a small curated evidence path is clearer
- [ ] Save slice under `docs/test-reports/p45-early-choice-to-outcome-trace.md`
- [ ] If traceability is weak, explicitly mark the break point

### US-006: Classify Weak Samples And Route Them To Follow-Up Buckets

**Description:** As a maintainer, I want weak or collapsed replay samples classified by root cause so future optimization does not immediately jump to runtime rewrites.

**Acceptance Criteria:**

- [ ] Define a small set of failure buckets, such as:
  - content coverage thin
  - trigger density too low
  - shaping signal too weak
  - consequence callback too late or too opaque
  - route differentiation collapse
- [ ] Map weak replay samples into those buckets
- [ ] Distinguish “needs more content” from “needs mechanism adjustment”
- [ ] Save classification report under `docs/test-reports/p45-weak-sample-classification.md`
- [ ] Report leaves a clear defer queue for the next optimization stage

### US-007: P45 Regression And Closure

**Description:** As a maintainer, I want closure evidence that the shaping mechanism is quantitatively validated across replay samples, not just locally tested.

**Acceptance Criteria:**

- [ ] Run typecheck
- [ ] Run existing shaping regressions relevant to replay validation
- [ ] Run the new replay harness
- [ ] Save closure under `docs/test-reports/p45-trajectory-validation-closure.md`
- [ ] Closure explicitly states whether the mechanism is:
  - runtime-complete only
  - quantitatively validated
  - still blocked by specific weak-sample classes

## 5. Success Metrics

| ID | Metric | Baseline | Target |
| --- | --- | --- | --- |
| **M1** | Validation contract for shaping quantity | implicit | **explicit pass/warn/fail bar** |
| **M2** | Replay matrix coverage | ad hoc | **bounded persona + seed matrix defined** |
| **M3** | Deterministic trajectory replay | absent/partial | **repeatable harness exists** |
| **M4** | Material differentiation visibility | anecdotal | **written comparison report with evidence** |
| **M5** | Early-choice to later-outcome causality proof | weak / scattered | **curated traceability slice exists** |
| **M6** | Weak-sample routing | none | **root-cause buckets and defer queue defined** |

## 6. Dependencies / Context

- Existing shaping correctness and visibility work from P26-P44
- Existing tests:
  - `tests/personalityHabitTrajectoryTests.ts`
  - `tests/p41HabitFeedbackTests.ts`
  - `tests/p42ContentDensityTests.ts`
  - `tests/p43ArchetypeRecapEndingTests.ts`
  - `tests/p44HabitAuditTests.ts`
- Existing replay / gate surfaces:
  - `scripts/runP8PlayabilityGate.ts`
  - `docs/test-reports/`
- Likely shaping and summary surfaces:
  - `src/p25/`
  - `src/core/deriveLifeMemorySummary.ts`

## 7. Recommended Execution Order

1. Validation contract
2. Replay persona matrix
3. Deterministic replay harness
4. Differentiation report
5. Early-choice to later-outcome traceability slice
6. Weak-sample classification
7. Regression + closure

## 8. Why This Is Next

P45 should happen before “最小可玩人生样本线” because it answers a lower-level truth question:

- does the shaping mechanism consistently steer lives apart?

If the answer is weak, then the next stage should repair content density or causal transmission first. If the answer is strong, then later sample-line work can focus on packaging a proven mechanism into sharper player experience rather than compensating for a weak core.
