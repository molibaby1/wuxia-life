# PRD: P62 Wuxia Ordinary Merchant Bridge Reconciliation

> **Derived from:** `docs/test-reports/p55-merchant-magnate-closure-report.md`, `docs/test-reports/p58-town-apprentice-merchant-bridge-closure-report.md`, `docs/test-reports/p59-tavern-hand-bridge-closure-report.md`, `docs/test-reports/p60-farm-peasant-bridge-design-closure-report.md`, `docs/test-reports/p61-farm-peasant-playable-bridge-closure-report.md`, `docs/test-reports/p25-mixed-identity-slice.md`
> **Stage slug:** `p62-wuxia-ordinary-merchant-bridge-reconciliation`
> **Stage type:** bounded reconciliation stage after the closed ordinary-origin merchant bridge trilogy

## 1. Introduction

到 P61 为止，`town_apprentice`、`tavern_hand`、`farm_peasant` 三条 ordinary origin 都已经完成了 bounded bridge，并全部接入同一个 `P55 merchant_magnate` 链。`P61` closure 已明确说明这完成了 Wave 4 ordinary-origin trilogy，North Star §8 所要求的“平凡出身有可玩的 higher-value 路径”已经不再是 blocker。

但这并不意味着 merchant 方向已经没有后续工作。当前 repo 的真实新缺口，不再是“能不能进 mixed”，而是“3 条 ordinary 入口在进入同一个 mixed 终点后，是否仍保持足够清晰的差异”。`P58/P59/P61` 都强调了 `identity preserved`，`P55` 也保留了 `merchant-specific habit trajectory densification` 作为 deferred item。这说明下一步最合理的不是再造第 4 条 bridge，也不是立刻重写 magnate wave，而是先做一次 repo-grounded reconciliation：

- 三条 bridge 的 prerequisite / checkpoint / expression / proof 是否真的构成三条不同入口
- 进入 `merchant_magnate` 后，哪些差异已经存在，哪些差异只停留在 bridge 文案层
- 若要继续做 magnate differentiation，最小、最值得做的切口在哪里

因此，P62 应定位为一个只读为主、必要时补极小验证资产的 reconciliation stage，为后续 `P63/P64` 的 merchant 后段分化提供约束，而不是直接开始扩 merchant 内容。

## 2. Goals

- 把 `P58/P59/P61` 三条 ordinary→merchant bridge 当成一组做正式 reconciliation
- 明确区分“已经实现的 entry differentiation”和“仍缺失的 post-bridge differentiation”
- 验证三条桥是否满足 mixed identity 成立之外的 route differentiation 目标
- 为后续 `P63/P64` 提供 bounded、repo-grounded 的差异化切口

## 3. Non-Goals

- 不新建第 4 条 ordinary bridge
- 不直接扩写 `merchant_magnate` 新事件链或完整第二波 magnate 内容
- 不转向 `escort / jianghu_renown_sage` 新 mixed 终点建设
- 不重开 sample-line 轨，不新增 second 40+ node
- 不扩成 full economy / map / trade platform / full lifetime sim

## 4. User Stories

### US-001: Audit The Three Ordinary Merchant Bridges As A Set
**Description:** As a maintainer, I want a single audit covering `P58/P59/P61` together so the repo has one truth source for what the trilogy now proves.

**Acceptance Criteria:**
- [ ] 汇总 3 条 bridge 的 prerequisite chain、checkpoint、downstream gate、expression 与 proof 资产
- [ ] 明确哪些结论来自 P58/P59/P61 closure，哪些仍未被整体比较过
- [ ] 输出 `docs/test-reports/p62-ordinary-merchant-bridge-set-audit.md`
- [ ] 本故事不改运行行为

### US-002: Lock P62 Scope Contract
**Description:** As a planner, I want a scope contract so P62 stays a reconciliation stage instead of quietly expanding into merchant content implementation.

**Acceptance Criteria:**
- [ ] 明确 P62 以 audit / comparison / reconciliation / narrow validation 为主
- [ ] 明确允许层：对比文档、验证口径补强、极小测试补强
- [ ] 明确禁止项：新 merchant chain、new mixed destiny、full magnate deepening
- [ ] 输出 `docs/test-reports/p62-ordinary-merchant-bridge-scope-contract.md`

### US-003: Compare Entry Differentiation Across The Trilogy
**Description:** As a designer, I want a structured comparison of the three bridge entries so later stages do not accidentally flatten them.

**Acceptance Criteria:**
- [ ] 对比 apprentice / tavern / peasant 三条 bridge 的 narrative hook、bridge flag、entry expression、identity semantics
- [ ] 明确哪些差异已经是 runtime-visible，哪些只是文档口径
- [ ] 明确是否存在“同构模板过重”的问题
- [ ] 结论写入 reconciliation 文档

### US-004: Evaluate Post-Bridge Differentiation Gap
**Description:** As a maintainer, I want an explicit assessment of what happens after the bridge so the next stage solves a real post-bridge gap.

**Acceptance Criteria:**
- [ ] 明确 `merchant_magnate` on-ramp / pressure / payoff 中哪些层当前完全共享
- [ ] 说明共享是否已经足够，还是确实稀释了三条 ordinary origin 的后续差异
- [ ] 结论必须绑定 P55 deferred item 与现有 expression / gate truth
- [ ] 明确至少 1 个最小可行差异化切口

### US-005: Reconcile With Mixed-Identity And North-Star Evidence
**Description:** As a maintainer, I want the ordinary-merchant bridge trilogy reconciled against P25/P39/P61 evidence so future stages do not solve a problem that North Star already considers closed.

**Acceptance Criteria:**
- [ ] 对齐 P25 mixed identity slice 对 `merchant_magnate` 的定义
- [ ] 对齐 P39 consequence consistency 与 P61 North Star §8 CLEAR 口径
- [ ] 明确哪些问题已闭合、哪些问题只是“更优体验空间”而非 correctness blocker
- [ ] 不重写既有闭合结论

### US-006: Produce Next-Stage Cut Recommendation
**Description:** As a planner, I want P62 to recommend the smallest high-value next cut so P63 starts from a real gap instead of from habit.

**Acceptance Criteria:**
- [ ] 推荐 1 个主切口，必要时列 1 个备选切口
- [ ] 推荐必须能直接转成单阶段 PRD
- [ ] 说明为什么先做 on-ramp differentiation 或 pressure/payoff differentiation
- [ ] 写入 closure 或 reconciliation 附录

### US-007: Add Narrow Reconciliation Validation If Needed
**Description:** As a maintainer, I want only the minimum additional validation needed to support the reconciliation conclusion.

**Acceptance Criteria:**
- [ ] 若现有测试已足够，则明确记录“无需新增测试”
- [ ] 若现有测试不足，则只补最小 comparison-level 验证资产
- [ ] 不重写 P58/P59/P61 测试体系
- [ ] 相关命令 Pass

### US-008: Produce P62 Closure Report
**Description:** As a maintainer, I want a closure report stating what the 3-bridge trilogy now proves as a set and what the next merchant differentiation stage should target.

**Acceptance Criteria:**
- [ ] 输出 `docs/test-reports/p62-ordinary-merchant-bridge-reconciliation-closure-report.md`
- [ ] 汇总 set audit、comparison、North-Star reconciliation 与 next-cut recommendation
- [ ] 明确与 P63/P64 的边界
- [ ] 列出仍 defer 的更大 merchant / economy / new-destiny 项

## 5. Functional Requirements

1. FR-1: P62 必须把 `P58/P59/P61` 作为一个整体进行分析，而不是分别重复 closure 内容。
2. FR-2: P62 必须区分 entry differentiation 与 post-bridge differentiation。
3. FR-3: P62 必须把结论绑定到 `P55` 的 deferred merchant densification、`P25` mixed identity、`P39` consistency、`P61` North Star §8 status。
4. FR-4: P62 不得把 reconciliation stage 扩成新的 merchant 内容实施阶段。
5. FR-5: P62 closure 必须明确给出 `P63` 的最小、可执行切口。

## 6. Success Criteria

- repo 内存在 1 份三桥全集合的正式 truth source
- 已明确指出三条桥哪些差异已经实现，哪些差异在 bridge 后仍缺口明显
- 后续 `P63` 的切口来自 repo-grounded gap，而不是主观偏好
- 不破坏 `P55/P58/P59/P61` 已闭合结论

## 7. Dependencies / Context

- P55 closure: `docs/test-reports/p55-merchant-magnate-closure-report.md`
- P58 closure: `docs/test-reports/p58-town-apprentice-merchant-bridge-closure-report.md`
- P59 closure: `docs/test-reports/p59-tavern-hand-bridge-closure-report.md`
- P60 closure: `docs/test-reports/p60-farm-peasant-bridge-design-closure-report.md`
- P61 closure: `docs/test-reports/p61-farm-peasant-playable-bridge-closure-report.md`
- P25 mixed slice: `docs/test-reports/p25-mixed-identity-slice.md`
- P39 reconciliation: `docs/test-reports/p39-section8-item3-reconciliation-closure.md`

## 8. Risks And Rollback

### Risks

- **Fake gap risk:** 容易把“已经足够不同”误判成必须扩内容的缺口
- **Scope drift:** 容易从 reconciliation 滑成 merchant 第二波内容设计
- **Template bias:** 容易只按文档结构比较，而忽略 runtime-visible truth

### Rollback

- 若 reconciliation 证明现有三桥在 bounded 目标下已经足够分化，则 P62 可以收口为“P63 no-go or lower priority”结论
- 若唯一可行后续需要 full merchant wave 或新系统，则该方向应显式 defer

## 9. Validation Direction

- 文档层：三桥 set audit 与 next-cut recommendation 必须形成一致证据链
- truth 层：comparison 结论必须绑定真实 bridge flags、gate、expression、tests
- 边界层：closure 必须清楚说明 P62 为什么不直接做 merchant differentiation implementation
