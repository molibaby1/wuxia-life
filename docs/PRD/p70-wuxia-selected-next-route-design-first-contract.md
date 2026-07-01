# PRD: P70 Wuxia Selected Next Route Design-First Contract

> **Derived from:** `docs/test-reports/p69-next-route-candidate-closure-report.md`
> **Stage slug:** `p70-wuxia-selected-next-route-design-first-contract`
> **Stage type:** bounded design-first contract stage for the selected next route

## 1. Introduction

在 `P69` 正式选出下一条路线之后，下一步仍不应直接写实现，而应先像 `P60` 一样，把这条路线的 bridge contract、allowed layers、proof shape、non-goals 明确下来。这样做的目的，是保证下一条复制线继续遵守 merchant trilogy 已验证的方法，而不是在新的题材上重新扩 scope。

P70 的对象不是抽象路线，而是 **P69 选中的唯一候选**。如果 `P69` 是 no-go，则 P70 不应开启。

## 2. Goals

- 为选中的下一条路线产出 design-first contract
- 明确 bridge 的最小 runtime 可达方式
- 明确允许层、禁止项、proof shape、测试边界
- 为 `P71` playable bridge 实施提供无歧义输入

## 3. Non-Goals

- 不直接写 runtime bridge 实现
- 不直接做 entry / payoff differentiation
- 不扩成新路线全生命周期规划
- 不新增系统或平台层
- 不并行设计第二条候选路线

## 4. User Stories

### US-001: Audit Selected Route Prerequisites
**Description:** As a maintainer, I want a prerequisite audit for the selected route so P70 starts from the real gating surfaces and not from assumptions.

**Acceptance Criteria:**
- [ ] 汇总选中路线的 origin、flags、gate、existing expressions、existing tests
- [ ] 明确 bridge 前已经存在什么、缺什么
- [ ] 输出 `docs/test-reports/p70-selected-route-prerequisite-audit.md`
- [ ] 本故事不改运行行为

### US-002: Lock P70 Scope Contract
**Description:** As a planner, I want a scope contract so P70 stays design-first and does not slip into partial implementation.

**Acceptance Criteria:**
- [ ] 明确 P70 只做 gap audit、方向比较、bridge contract、proof shape
- [ ] 明确允许层：文档、contract、targeted proof planning
- [ ] 明确禁止项：runtime wiring、new framework、bulk content wave
- [ ] 输出 `docs/test-reports/p70-selected-route-scope-contract.md`

### US-003: Compare Candidate Bridge Shapes Inside The Selected Route
**Description:** As a designer, I want bounded bridge-shape options for the selected route so P70 chooses the smallest viable entry path before implementation.

**Acceptance Criteria:**
- [ ] 至少比较 2 个 bridge shape 方向
- [ ] 明确推荐方向及放弃方向
- [ ] 推荐必须符合质量优先与小步实施原则
- [ ] 结论写入 comparison 文档

### US-004: Define The Selected Route Bridge Contract
**Description:** As a designer, I want an explicit bridge contract so P71 knows exactly what flags, gates, and player-facing meanings must be closed.

**Acceptance Criteria:**
- [ ] 定义 bridge checkpoint、所需 flags、对应 gate acceptance
- [ ] 定义至少 2 个 bridge-specific player-facing signals
- [ ] 明确 bridge 与 generic path 的差异
- [ ] 合同写入 PRD 或附录

### US-005: Define P71 Validation Shape
**Description:** As a maintainer, I want the P71 validation shape fixed in advance so playable bridge work is judged against explicit proof and regression expectations.

**Acceptance Criteria:**
- [ ] 明确 targeted proof 需要展示哪些链路节点
- [ ] 明确 regression tests 至少覆盖哪些断言
- [ ] 明确何种证据算 bridge closed
- [ ] 不要求 full lifetime exhaust

### US-006: Produce P70 Closure Report
**Description:** As a maintainer, I want a closure report that locks the selected route's design-first contract and hands off a bounded implementation target to P71.

**Acceptance Criteria:**
- [ ] 输出 `docs/test-reports/p70-selected-next-route-design-closure-report.md`
- [ ] 汇总 prerequisite audit、scope contract、bridge-shape comparison、bridge contract、validation shape
- [ ] 明确与 `P71` 的边界
- [ ] 列出仍 defer 的更大 route-expansion 项

## 5. Functional Requirements

1. FR-1: P70 必须围绕 `P69` 选中的唯一候选展开。
2. FR-2: P70 必须输出明确的 bridge contract。
3. FR-3: P70 必须提前锁定 P71 的 proof / regression shape。
4. FR-4: P70 不得进入 runtime 实现。
5. FR-5: P70 closure 必须足以让 P71 直接承接。

## 6. Success Criteria

- repo 内存在 1 份所选路线的 design-first truth source
- bridge contract 已无歧义
- proof / test 预期已提前固定
- `P71` 无需重新做选线或大范围澄清

## 7. Dependencies / Context

- P69 closure: `docs/test-reports/p69-next-route-candidate-closure-report.md`

## 8. Risks And Rollback

### Risks

- **Premature design risk:** 在候选证据不足时过早写死 bridge 形状
- **Scope creep risk:** 容易把 design-first 扩成半实现阶段
- **Overfit risk:** 机械复制 merchant bridge 模式而忽略新路线差异

### Rollback

- 若 prerequisite audit 证明基础仍不足，P70 应中止并回到补证据阶段
- 若比较后发现无 bounded bridge shape，可显式 no-go，不进入 P71

## 9. Validation Direction

- prerequisite 层：现有 gate/flag/expression truth 必须先被摸清
- contract 层：bridge checkpoint 与 player-facing signal 必须明确
- handoff 层：P71 的 proof / regression 入口必须提前收紧
