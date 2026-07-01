# PRD: P88 Wuxia Medical Payoff Design-First Contract

> **Derived from:** `docs/test-reports/p87-medical-pressure-closure-report.md`, `docs/PRD/p87-wuxia-medical-pressure-playable-implementation.md`, `docs/designs/p25-lifetime-simulation-north-star.md`
> **Stage slug:** `p88-wuxia-medical-payoff-design-first`
> **Stage type:** bounded design-first contract stage for medical_sage_healer payoff (2 variants × 3 choices)

## 1. Introduction

P87 已完成 `medical_sage_healer`（一代名医）路线的 pressure runtime 实现：2 个 pressure auto 事件（compassionate 仁心耗尽 + pragmatic 人情债缠身）已落地，5 个表达面 × 2 variants 全部更新，medical 路线从"只有上升期"推进到"有代价的成长"。

对照 renown trilogy 方法论，medical 路线目前走完了 bridge → entry → on-ramp → pressure，下一步是 **payoff**。与 merchant payoff（auto、自然成型）不同，medical payoff 有机会做差异化——仁心耗尽 / 人情债缠身，怎么解？这本身就是一个价值判断问题，可以做成 choice-based。

P87 closure report 明确建议：**payoff stage GO，且建议 design-first，探索 choice-based payoff 以差异化。**

P88 的目标是为 `medical_sage_healer` 的 payoff 阶段产出 design-first contract：明确 payoff 的核心叙事方向（choice-based）、每个 variant 的 3 个选择方向、事件结构、flag 接口、表达更新边界，为 P89 的 implementation 提供无歧义输入。

这不是 payoff implementation stage，而是 bounded 的 design-first contract stage——类似 P76 相对于 P77 的关系。

## 2. Goals

- 为 `medical_sage_healer` 定义 payoff 阶段的 design-first contract
- 明确 medical payoff 是 choice-based（2 variants × 3 choices = 6 分支）
- 定义 compassionate variant 的 3 个选择方向及其后果、身份标记、stat 变化
- 定义 pragmatic variant 的 3 个选择方向及其后果、身份标记、stat 变化
- 定义 payoff 事件的触发条件、结构、flag 接口
- 定义 player-facing expression 更新边界（sample line + ordinary origin，至少 5 个表达面）
- 为 P89 playable payoff implementation 提供无歧义输入
- 保持 tavern-born 风味，不做成 generic payoff
- 延续 compassionate / pragmatic 两个 variant 的差异化

## 3. Non-Goals

- 不直接写 runtime payoff 事件实现
- 不做 late-life identity / endgame echo（P90+）
- 不扩成 full medical route 全生命周期规划
- 不新增系统或平台层
- 不并行设计毒医路线（poison path）
- 不扩展到其他出身（仅 tavern_hand origin）
- 不做 stat threshold gate 验证
- 不做 plague hero / medical pure 完整抉择
- 不扩展到 renown / merchant 路线

## 4. User Stories

### US-001: Audit Medical Payoff Prerequisites
**Description:** As a maintainer, I want a prerequisite audit for the medical payoff stage so P88 starts from the real gating surfaces and not from assumptions.

**Acceptance Criteria:**
- [ ] 汇总 medical 路线当前已有的 flags、markers、events、expressions（bridge + entry + on-ramp + pressure）
- [ ] 明确 payoff 之前已经存在什么、可以复用什么
- [ ] 特别关注 2 个 variant 的差异点与共同点
- [ ] 输出 `docs/test-reports/p88-medical-payoff-prerequisite-audit.md`
- [ ] 本故事不改运行行为

### US-002: Lock P88 Scope Contract
**Description:** As a planner, I want a scope contract so P88 stays design-first and does not slip into partial implementation.

**Acceptance Criteria:**
- [ ] 明确 P88 只做 gap audit、方向比较、payoff contract、proof shape
- [ ] 明确允许层：文档、contract、targeted proof planning
- [ ] 明确禁止项：runtime wiring、new framework、bulk content wave、late-life design
- [ ] 输出 `docs/test-reports/p88-medical-payoff-scope-contract.md`

### US-003: Compare Medical Payoff Directions (2 Variants × 3 Choices)
**Description:** As a designer, I want payoff-direction options for both medical variants so P88 chooses the most differentiated and bounded payoff shape before implementation.

**Acceptance Criteria:**
- [ ] 确认 payoff 模式为 choice-based（2 variants × 3 choices = 6 分支）
- [ ] Compassionate variant：比较至少 3 个选择方向（如：硬扛到底 / 学会放手 / 找到传承）
- [ ] Pragmatic variant：比较至少 3 个选择方向（如：硬扛人情 / 撕破脸皮 / 人情练达）
- [ ] 每个候选包含：核心叙事、触发条件、玩家选择空间、tavern-born 适配度、实现复杂度
- [ ] 明确推荐方向及放弃方向
- [ ] 推荐必须符合质量优先与小步实施原则
- [ ] 确保 2 variants 的 payoff 有本质差异，不是简单换皮
- [ ] 结论写入 comparison 文档

### US-004: Define Medical Payoff Contract (2 Variants)
**Description:** As a designer, I want an explicit payoff contract for both variants so P89 knows exactly what flags, gates, events, and player-facing meanings must be closed.

**Acceptance Criteria:**
- [ ] 定义 payoff checkpoint、所需 flags、对应 gate acceptance
- [ ] 定义 2 个核心 payoff 事件（compassionate + pragmatic，各为 choice-based）
- [ ] 每个 choice 定义 stat 变化、identity marker、表达差异
- [ ] 定义至少 5 个 payoff-specific player-facing signals（cost label、current goal、age40 identity、life memory、summary）
- [ ] 明确 payoff 与 pressure、与 generic midlife 的差异
- [ ] 保留 tavern-born 风味
- [ ] 为后续 late-life / endgame 阶段预留 flag 接口
- [ ] 合同写入 `docs/PRD/p88-medical-payoff-contract.md`

### US-005: Define P89 Validation Shape
**Description:** As a maintainer, I want the P89 validation shape fixed in advance so playable payoff work is judged against explicit proof and regression expectations.

**Acceptance Criteria:**
- [ ] 明确 targeted proof 需要展示哪些链路节点（pressure → payoff → 表达变化）
- [ ] 2 variants × 3 choices，每个方向都要有核心节点验证
- [ ] 明确 regression tests 至少覆盖哪些断言
- [ ] 明确何种证据算 payoff closed
- [ ] 不要求 full lifetime exhaust
- [ ] P83/P84/P85/P87 既有 evidence 不退化的验证边界

### US-006: Produce P88 Closure Report
**Description:** As a maintainer, I want a closure report that locks the medical payoff design-first contract and hands off a bounded implementation target to P89.

**Acceptance Criteria:**
- [ ] 输出 `docs/test-reports/p88-medical-payoff-closure-report.md`
- [ ] 汇总 prerequisite audit、scope contract、payoff-direction comparison、payoff contract、validation shape
- [ ] 明确与 `P89` 的边界
- [ ] 列出仍 defer 的更大 medical-expansion 项
- [ ] 明确 payoff 阶段是否值得进入 implementation（GO / NO-GO）

## 5. Functional Requirements

1. FR-1: P88 必须围绕 `medical_sage_healer` tavern_hand seed 展开。
2. FR-2: P88 必须输出明确的 payoff contract（覆盖 2 variants）。
3. FR-3: P88 必须提前锁定 P89 的 proof / regression shape。
4. FR-4: P88 不得进入 runtime 实现。
5. FR-5: P88 closure 必须足以让 P89 直接承接。
6. FR-6: Payoff 必须保持 tavern-born medical healer 风味，与 renown/merchant payoff 明确区分。
7. FR-7: 2 variants 的 payoff 必须有本质差异（不是换皮）。
8. FR-8: 每个 variant 的 3 个选择必须有实质差异。

## 6. Success Criteria

- repo 内存在 1 份 medical payoff 的 design-first truth source（覆盖 2 variants）
- payoff contract 已无歧义
- proof / test 预期已提前固定
- `P89` 无需重新做方向选择或大范围澄清
- tavern-born 风味在 payoff 设计中保持一致
- 2 variants 的 payoff 有本质差异
- 每个 variant 的 3 个选择方向有实质差异

## 7. Dependencies / Context

- P87 closure: `docs/test-reports/p87-medical-pressure-closure-report.md`
- P87 pressure implementation: `docs/PRD/p87-wuxia-medical-pressure-playable-implementation.md`
- P76 design-first precedent: `docs/PRD/p76-wuxia-renown-payoff-design-first.md`
- North Star: `docs/designs/p25-lifetime-simulation-north-star.md`

## 8. Risks And Rollback

### Risks

- **2x complexity risk:** 2 variants × 3 choices = 6 分支，工作量约为 renown payoff 的 2 倍
- **Choice complexity risk:** Choice-based payoff 可能比 auto 复杂太多，超出 bounded stage 范围
- **Scope creep risk:** 容易把 design-first 扩成半实现阶段，或同时设计 late-life
- **Overfit risk:** 机械复制 renown payoff 模式而忽略 medical 路线差异
- **Flavor dilution risk:** Payoff 设计可能丢失 tavern-born 风味，变成 generic medical payoff
- **Variant weakening risk:** 两个 variant 的 payoff 可能差异不够强，变成简单换皮
- **Choice meaninglessness risk:** 三个选择可能变成换皮，没有实质差异

### Rollback

- 若 prerequisite audit 证明 pressure 基础仍不足，P88 应中止并回到补证据阶段
- 若比较后发现 choice-based 太复杂，可退化为 auto payoff（类似 merchant）
- 若比较后发现无 bounded payoff shape，可显式 NO-GO，不进入 P89
- 可回退到 P87 pressure-only 状态，P88 文档保留为 reference

## 9. Validation Direction

- prerequisite 层：现有 gate/flag/expression/event truth 必须先被摸清（2 variants 都要覆盖）
- direction 层：确认 choice-based 模式；2 variants 各 3 个方向，确保差异
- contract 层：payoff checkpoint、事件结构、player-facing signal 必须明确
- handoff 层：P89 的 proof / regression 入口必须提前收紧
