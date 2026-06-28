# PRD: P76 Wuxia Renown Payoff Design-First Contract

> **Derived from:** `docs/test-reports/p75-renown-pressure-closure-report.md`, `docs/PRD/p75-wuxia-renown-pressure-playable-implementation.md`, `docs/designs/p25-lifetime-simulation-north-star.md`
> **Stage slug:** `p76-wuxia-renown-payoff-design-first`
> **Stage type:** bounded design-first contract stage for renown payoff

## 1. Introduction

P75 已完成 `jianghu_renown_sage`（江湖名宿）路线的 pressure runtime 实现："人情债渐重"事件已落地，renown 路线从"只有上升期"推进到"有代价的成长"。

对照 merchant trilogy 方法论，renown 路线目前走完了 bridge → entry → on-ramp → pressure，下一步是 **payoff**。与 merchant payoff（auto、商业帝国自然成型）不同，renown payoff 有机会做差异化——人情债怎么还？这本身就是一个价值判断问题，可以做成 choice-based。

P75 closure report 明确建议：**payoff stage GO，且建议 design-first，探索 choice-based payoff 以差异化。**

P76 的目标是为 `jianghu_renown_sage` 的 payoff 阶段产出 design-first contract：明确 payoff 的核心叙事方向（choice-based vs auto）、三个选择方向、事件结构、flag 接口、表达更新边界，为 P77 的 implementation 提供无歧义输入。

这不是 payoff implementation stage，而是 bounded 的 design-first contract stage——类似 P74 相对于 P75 的关系。

## 2. Goals

- 为 `jianghu_renown_sage` 定义 payoff 阶段的 design-first contract
- 明确 renown payoff 是 choice-based 还是 auto（推荐 choice-based 以差异化）
- 定义 3 个选择方向及其后果、身份标记、stat 变化
- 定义 payoff 事件的触发条件、结构、flag 接口
- 定义 player-facing expression 更新边界（sample line + ordinary origin）
- 为 P77 playable payoff implementation 提供无歧义输入
- 保持 tavern-born 风味，不做成 generic payoff

## 3. Non-Goals

- 不直接写 runtime payoff 事件实现
- 不做 late-life identity / endgame echo（P78+）
- 不扩成 full renown route 全生命周期规划
- 不新增系统或平台层
- 不并行设计第二条 renown seed（mentor-bond）
- 不扩展到其他出身（仅 tavern_hand origin）
- 不做 stat threshold gate 验证

## 4. User Stories

### US-001: Audit Renown Payoff Prerequisites
**Description:** As a maintainer, I want a prerequisite audit for the renown payoff stage so P76 starts from the real gating surfaces and not from assumptions.

**Acceptance Criteria:**
- [ ] 汇总 renown 路线当前已有的 flags、markers、events、expressions（bridge + entry + on-ramp + pressure）
- [ ] 明确 payoff 之前已经存在什么、可以复用什么
- [ ] 输出 `docs/test-reports/p76-renown-payoff-prerequisite-audit.md`
- [ ] 本故事不改运行行为

### US-002: Lock P76 Scope Contract
**Description:** As a planner, I want a scope contract so P76 stays design-first and does not slip into partial implementation.

**Acceptance Criteria:**
- [ ] 明确 P76 只做 gap audit、方向比较、payoff contract、proof shape
- [ ] 明确允许层：文档、contract、targeted proof planning
- [ ] 明确禁止项：runtime wiring、new framework、bulk content wave、late-life design
- [ ] 输出 `docs/test-reports/p76-renown-payoff-scope-contract.md`

### US-003: Compare Renown Payoff Directions (Choice-Based vs Auto)
**Description:** As a designer, I want payoff-direction options for the renown route so P76 chooses the most differentiated and bounded payoff shape before implementation.

**Acceptance Criteria:**
- [ ] 至少比较 2 个 payoff 模式：choice-based（人情债怎么还？3个选择） vs auto（类似 merchant）
- [ ] 若选 choice-based，比较至少 3 个选择方向（如：硬扛到底 / 索性撕破脸 / 找到平衡）
- [ ] 每个候选包含：核心叙事、触发条件、玩家选择空间、tavern-born 适配度、实现复杂度
- [ ] 明确推荐方向及放弃方向
- [ ] 推荐必须符合质量优先与小步实施原则
- [ ] 结论写入 comparison 文档

### US-004: Define Renown Payoff Contract
**Description:** As a designer, I want an explicit payoff contract so P77 knows exactly what flags, gates, events, and player-facing meanings must be closed.

**Acceptance Criteria:**
- [ ] 定义 payoff checkpoint、所需 flags、对应 gate acceptance
- [ ] 定义 1 个核心 payoff 事件（choice-based 或 auto）
- [ ] 若 choice-based，定义每个选择的 stat 变化、identity marker、表达差异
- [ ] 定义至少 3 个 payoff-specific player-facing signals
- [ ] 明确 payoff 与 pressure、与 generic midlife 的差异
- [ ] 保留 tavern-born 风味
- [ ] 为后续 late-life / endgame 阶段预留 flag 接口
- [ ] 合同写入 `docs/PRD/p76-renown-payoff-contract.md`

### US-005: Define P77 Validation Shape
**Description:** As a maintainer, I want the P77 validation shape fixed in advance so playable payoff work is judged against explicit proof and regression expectations.

**Acceptance Criteria:**
- [ ] 明确 targeted proof 需要展示哪些链路节点（pressure → payoff → 表达变化）
- [ ] 若 choice-based，每个选择方向都要有核心节点验证
- [ ] 明确 regression tests 至少覆盖哪些断言
- [ ] 明确何种证据算 payoff closed
- [ ] 不要求 full lifetime exhaust
- [ ] P71/P72/P73/P75 既有 evidence 不退化的验证边界

### US-006: Produce P76 Closure Report
**Description:** As a maintainer, I want a closure report that locks the renown payoff design-first contract and hands off a bounded implementation target to P77.

**Acceptance Criteria:**
- [ ] 输出 `docs/test-reports/p76-renown-payoff-closure-report.md`
- [ ] 汇总 prerequisite audit、scope contract、payoff-direction comparison、payoff contract、validation shape
- [ ] 明确与 `P77` 的边界
- [ ] 列出仍 defer 的更大 renown-expansion 项
- [ ] 明确 payoff 阶段是否值得进入 implementation（GO / NO-GO）

## 5. Functional Requirements

1. FR-1: P76 必须围绕 `jianghu_renown_sage` tavern_hand seed 展开。
2. FR-2: P76 必须输出明确的 payoff contract。
3. FR-3: P76 必须提前锁定 P77 的 proof / regression shape。
4. FR-4: P76 不得进入 runtime 实现。
5. FR-5: P76 closure 必须足以让 P77 直接承接。
6. FR-6: Payoff 必须保持 tavern-born renown 风味，与 merchant payoff 明确区分。
7. FR-7: 若选 choice-based，三个选择必须有实质差异（不是换皮）。

## 6. Success Criteria

- repo 内存在 1 份 renown payoff 的 design-first truth source
- payoff contract 已无歧义
- proof / test 预期已提前固定
- `P77` 无需重新做方向选择或大范围澄清
- tavern-born 风味在 payoff 设计中保持一致
- 若为 choice-based，三个选择方向有实质差异

## 7. Dependencies / Context

- P75 closure: `docs/test-reports/p75-renown-pressure-closure-report.md`
- P75 pressure implementation: `docs/PRD/p75-wuxia-renown-pressure-playable-implementation.md`
- P74 design-first precedent: `docs/PRD/p74-wuxia-renown-pressure-design-first.md`
- Merchant payoff precedent: `docs/PRD/p53-wuxia-sample-lines-40-plus-payoff-expansion.md`
- North Star: `docs/designs/p25-lifetime-simulation-north-star.md`

## 8. Risks And Rollback

### Risks

- **Choice complexity risk:** Choice-based payoff 可能比 auto 复杂太多，超出 bounded stage 范围
- **Scope creep risk:** 容易把 design-first 扩成半实现阶段，或同时设计 late-life
- **Overfit risk:** 机械复制 merchant payoff 模式而忽略 renown 路线差异
- **Flavor dilution risk:** Payoff 设计可能丢失 tavern-born 风味，变成 generic jianghu payoff
- **Choice meaninglessness risk:** 三个选择可能变成换皮，没有实质差异

### Rollback

- 若 prerequisite audit 证明 pressure 基础仍不足，P76 应中止并回到补证据阶段
- 若比较后发现 choice-based 太复杂，可退化为 auto payoff（类似 merchant）
- 若比较后发现无 bounded payoff shape，可显式 NO-GO，不进入 P77
- 可回退到 P75 pressure-only 状态，P76 文档保留为 reference

## 9. Validation Direction

- prerequisite 层：现有 gate/flag/expression/event truth 必须先被摸清
- direction 层：比较 choice-based vs auto，选定模式；若 choice-based，再比较 3 个方向
- contract 层：payoff checkpoint、事件结构、player-facing signal 必须明确
- handoff 层：P77 的 proof / regression 入口必须提前收紧
