# PRD: P44 Wuxia Habit Trajectory Operator Audit Tooling

> **Derived from:** P26-P43 long-term shaping system maturation
> **Stage slug:** `p44-wuxia-habit-trajectory-operator-audit-tooling`
> **Parent:** `p43-wuxia-archetype-recap-and-ending-differentiation`

## 1. Introduction

到 P43 为止，长期塑形系统已经具备：

- runtime 正确性
- 玩家可见性
- 内容密度增强
- 全局 recap / ending 层的更强收口

接下来最大的风险不再是“功能不存在”，而是“后续继续扩内容时，没人能快速知道哪些轴又变薄了、哪些 archetype 又失衡了、哪些条件又偷偷退回 legacy flag 路径了”。

P44 的目标是为策划/维护者提供一组轻量、可回归、可扩展的 operator-facing 审计工具，降低长期塑形系统在后续波次中的退化风险。

## 2. Goals

- 为长期塑形系统建立 operator-facing coverage audit
- 快速识别 axis coverage、age-band gap、legacy flag drift、archetype imbalance
- 让未来内容扩展不必每次都依赖大规模人工阅读
- 把“长期塑形系统是否仍健康”变成可重复执行的检查项

## 3. Non-Goals

- 不做玩家 UI
- 不做新的内容波次
- 不重做 runtime
- 不接入外部可视化平台
- 不做复杂 Web 后台

## 4. User Stories

### US-001: Define Operator Audit Questions And Outputs

**Description:** As a maintainer, I want an explicit audit contract for the habit trajectory system so tooling output is stable and actionable.

**Acceptance Criteria:**

- [ ] Define the core audit questions:
  - 哪些轴在哪些年龄段缺样本
  - 哪些关键链路仍依赖 legacy flag
  - 哪些 archetype 缺少差异化后果
  - 哪些回顾层没有吸收 shaping 结果
- [ ] Define expected output shape for operator consumption
- [ ] Save contract under `docs/designs/p44-habit-audit-contract.md`
- [ ] No gameplay behavior changes in this story

### US-002: Add Habit Coverage Audit Script Or Test Surface

**Description:** As a maintainer, I want a repeatable way to inspect habit content coverage so future waves can be checked before merge.

**Acceptance Criteria:**

- [ ] Add a script or test that inventories content by axis and age band
- [ ] Output highlights missing or low-density zones
- [ ] Output is readable in terminal and/or markdown artifact form
- [ ] Add regression coverage for the audit output shape

### US-003: Add Legacy Flag Drift Detection

**Description:** As a maintainer, I want tooling that detects when new content accidentally depends on legacy habit flags without documented reason.

**Acceptance Criteria:**

- [ ] Detect references to `training_habit`, `study_habit`, `business_habit` in content/logic surfaces
- [ ] Distinguish allowed compatibility use from accidental primary dependency where possible
- [ ] Output suspicious readers clearly
- [ ] Add targeted regression coverage

### US-004: Add Archetype Differentiation Audit

**Description:** As a maintainer, I want an audit view of shaping coverage across archetypes so replay differentiation regressions are easier to catch.

**Acceptance Criteria:**

- [ ] Define at least one operator-facing report comparing shaping echoes across archetype families
- [ ] Surface obvious convergence or thin differentiation areas
- [ ] Output references concrete event or summary surfaces
- [ ] Save sample report under `docs/test-reports/`

### US-005: P44 Regression And Closure

**Description:** As a maintainer, I want closure evidence that the operator audit tooling is usable and can catch real shaping-system regressions.

**Acceptance Criteria:**

- [ ] Run typecheck
- [ ] Run new audit tooling or tests
- [ ] Demonstrate at least one real example per audit class
- [ ] Save closure under `docs/test-reports/p44-habit-audit-tooling-closure.md`
- [ ] Closure defines what still remains manual

## 5. Success Metrics

| ID | Metric | Baseline | Target |
| --- | --- | --- | --- |
| **M1** | Operator coverage visibility | manual / ad hoc | **repeatable audit exists** |
| **M2** | Legacy flag drift detection | manual grep | **structured suspicious-reader output** |
| **M3** | Archetype differentiation observability | weak | **reportable per family** |
| **M4** | Audit regression repeatability | absent | **runnable in one command flow** |

## 6. Dependencies / Context

- P26-P43 shaping system and recap layers
- Existing content pool reports and playability gates
- Existing habit trajectory regression suite

## 7. Recommended Execution Order

1. Audit contract
2. Coverage audit surface
3. Legacy flag drift detection
4. Archetype differentiation audit
5. Regression + closure

## 8. Why This Is Next

P44 is the maintenance phase that protects the work of P26-P43. Without lightweight operator tooling, future content waves are likely to erode the system gradually and invisibly.

