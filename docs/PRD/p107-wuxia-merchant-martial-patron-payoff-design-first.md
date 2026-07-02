# PRD: P107 Wuxia Merchant Martial Patron Payoff Design-First Contract

> **Derived from:** `docs/test-reports/p106-merchant-martial-patron-pressure-closure-report.md`, `docs/PRD/p106-wuxia-merchant-martial-patron-pressure-playable-implementation.md`, `docs/PRD/p105-merchant-martial-patron-pressure-contract.md` (Discovery pass 2026-07-02)
> **Stage slug:** `p107-wuxia-merchant-martial-patron-payoff-design-first`
> **Gaps addressed:** GAP-P106-D01, GAP-P106-D02
> **Stage type:** bounded design-first contract stage for merchant_martial_patron payoff

## 1. Introduction

P106 已完成 `merchant_martial_patron`（商武一体金主）路线的 pressure runtime 实现：「护商武力负担」事件已落地，patron 路线从「盟约初立」推进到「武力盟约代价兑现」。

对照 renown P75→P76 与 magnate trilogy 方法论，patron 路线目前走完了 bridge → entry/on-ramp → pressure，下一步是 **payoff**。当前 P102 lightweight auto `merchant_patron_payoff_echo`（P93 模式）仅设置 `merchant_patron_payoff_done` / `merchant_patron_identity_done`，缺少 choice-based 身份转折；P105 contract §6.3 已为 payoff 埋下叙事钩子（盟约 vs 刀、商武撕裂的和解）。

P106 closure report 明确建议：**payoff stage GO，且应先 design-first 再 implementation**（参照 renown P76→P77）。

P107 的目标是为 `merchant_martial_patron` 的 payoff 阶段产出 design-first contract：明确 payoff 模式（choice-based vs 保留 auto 深化）、选择方向、事件结构、flag 接口、表达更新边界，为 P108 playable implementation 提供无歧义输入。

这不是 payoff implementation stage，而是 bounded 的 design-first contract stage。

## 2. Goals

- 为 `merchant_martial_patron` 定义 payoff 阶段的 design-first contract
- 明确 patron payoff 是 choice-based 还是 auto 深化（推荐 choice-based 以差异化 magnate auto payoff）
- 定义至少 3 个选择方向及其后果、identity markers、表达差异
- 定义 payoff 事件触发条件、结构、与 P106 pressure gate 的衔接
- 定义 player-facing expression 更新边界（sample line；ordinary origin bonus defer）
- 为 P108 playable payoff implementation 提供无歧义输入
- 保持商武一体风味，与 magnate/renown payoff 明确区分
- P102–P106 既有 evidence 不退化（设计层）

## 3. Non-Goals

- 不直接写 runtime payoff 事件实现
- 不做 patron late-life / endgame echo 深化（P109+）
- 不重做 P102–P104 bridge entry / on-ramp wiring
- 不重做 P106 pressure event 或 expression
- 不扩成 full Wave 3 mixed-achievement 全谱
- 不新增 route framework 或事件调度器
- 不做 stat threshold gate 验证
- 不做 full-lifetime `gate:p20` broad rerun
- 不修改 parent P106 PRD.md

## 4. User Stories

### US-001: Audit Patron Payoff Prerequisites

**Description:** As a maintainer, I want a prerequisite audit for the patron payoff stage so P107 starts from the real gating surfaces and not from assumptions.

**Acceptance Criteria:**

- [ ] 汇总 patron 路线当前 flags、markers、events、expressions（P102 bridge + P103/P104 bridge-origin + P106 pressure）
- [ ] 明确 payoff 之前已存在什么、P106 已调整的 payoff echo gate 是什么
- [ ] 记录 `merchant_patron_payoff_resolved` / `merchant_patron_late_life_done` 预留状态
- [ ] 输出 `docs/test-reports/p107-merchant-martial-patron-payoff-prerequisite-audit.md`
- [ ] 本故事不改运行行为

### US-002: Lock P107 Scope Contract

**Description:** As a planner, I want a scope contract so P107 stays design-first and does not slip into partial implementation.

**Acceptance Criteria:**

- [ ] 明确 P107 只做 gap audit、方向比较、payoff contract、proof shape
- [ ] 明确允许层：文档、contract、targeted proof planning
- [ ] 明确禁止项：runtime wiring、P106 rewrite、magnate spine rewrite、late-life design、new UI
- [ ] 输出 `docs/test-reports/p107-merchant-martial-patron-payoff-scope-contract.md`

### US-003: Compare Patron Payoff Directions (Choice-Based vs Auto)

**Description:** As a designer, I want payoff-direction options for the patron route so P107 chooses the most differentiated and bounded payoff shape before implementation.

**Acceptance Criteria:**

- [ ] 至少比较 2 个 payoff 模式：choice-based（商武撕裂怎么解？） vs auto 深化（保留 P102 echo 结构）
- [ ] 若选 choice-based，比较至少 3 个选择方向（示例：硬扛盟约 / 撕破盟约 / 找到商武平衡）
- [ ] 每个候选包含：核心叙事、触发条件、玩家选择空间、商武一体适配度、与 magnate/renown payoff 区分度、实现复杂度
- [ ] 明确推荐方向及放弃方向
- [ ] 结论写入 comparison 文档（`docs/test-reports/p107-merchant-martial-patron-payoff-direction-comparison.md`）

### US-004: Define Patron Payoff Contract

**Description:** As a designer, I want an explicit payoff contract so P108 knows exactly what flags, gates, events, and player-facing meanings must be closed.

**Acceptance Criteria:**

- [ ] 定义 payoff checkpoint、所需 flags、gate acceptance（含与 `merchant_patron_midlife_pressure_done` 的衔接）
- [ ] 定义 1 个核心 payoff 事件（choice-based 或 auto）
- [ ] 若 choice-based，定义每个选择的 stat 变化、identity marker、表达差异
- [ ] 定义至少 3 个 payoff-specific player-facing signals
- [ ] 明确 payoff 与 pressure、与 P102 lightweight echo 的差异
- [ ] 保留商武一体风味；与 magnate auto payoff / renown choice payoff 区分
- [ ] 为 late-life / endgame 预留 flag 接口（`merchant_patron_late_life_done` 等）
- [ ] 合同写入 `docs/PRD/p107-merchant-martial-patron-payoff-contract.md`

### US-005: Define P108 Validation Shape

**Description:** As a maintainer, I want the P108 validation shape fixed in advance so playable payoff work is judged against explicit proof and regression expectations.

**Acceptance Criteria:**

- [ ] 明确 targeted proof 需要展示哪些链路节点（pressure → payoff → 表达变化）
- [ ] 若 choice-based，每个选择方向至少 1 条核心节点验证
- [ ] 明确 regression tests 至少覆盖哪些断言
- [ ] 明确何种证据算 payoff closed
- [ ] 不要求 full lifetime exhaust
- [ ] P102–P106 + P100/P101 magnate 既有 evidence 不退化的验证边界
- [ ] 保存 `docs/test-reports/p107-p108-validation-shape.md`

### US-006: Produce P107 Closure Report

**Description:** As a maintainer, I want a closure report that locks the patron payoff design-first contract and hands off a bounded implementation target to P108.

**Acceptance Criteria:**

- [ ] 输出 `docs/test-reports/p107-merchant-martial-patron-payoff-closure-report.md`
- [ ] 汇总 prerequisite audit、scope contract、direction comparison、payoff contract、validation shape
- [ ] 明确与 P108 的边界
- [ ] 列出仍 defer 的更大 patron-expansion 项
- [ ] 明确 P108 payoff implementation GO / NO-GO

## 5. Success Criteria

- Payoff contract LOCKED with unambiguous flags, gates, and expression boundaries
- Choice directions (if selected) have distinct narrative + mechanical identity
- P108 validation shape exists before any runtime work
- Typecheck passes (doc-only stage; no runtime changes expected)

## 6. Dependencies / Context

- Parent: `docs/PRD/p106-wuxia-merchant-martial-patron-pressure-playable-implementation.md`
- Pressure contract: `docs/PRD/p105-merchant-martial-patron-pressure-contract.md` §6
- P106 closure: `docs/test-reports/p106-merchant-martial-patron-pressure-closure-report.md`
- Renown precedent: `docs/PRD/p76-wuxia-renown-payoff-design-first.md`
- Magnate payoff reference: P55/P64 `magnate_payoff` (auto pattern — contrast only)
- North Star: `docs/designs/p25-lifetime-simulation-north-star.md`

## 7. Open Questions

- 是否保留 P102 `merchant_patron_payoff_echo` event ID 并升级为 choice，还是新增独立 payoff event ID
- Ordinary origin patron expression 是否纳入 P108 bonus（默认 defer）
- Stat threshold gates 是否作为 P108 optional enhancement
