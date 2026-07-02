# PRD: P105 Wuxia Merchant Martial Patron Pressure Design-First Contract

> **Derived from:** `docs/PRD/p104-wuxia-merchant-martial-patron-bridge-origin-peasant-narrow-playable.md` (Discovery pass 2026-07-02)
> **Stage slug:** `p105-wuxia-merchant-martial-patron-pressure-design-first`
> **Gaps addressed:** GAP-P104-N01, GAP-P104-N02
> **Stage type:** bounded design-first contract stage for patron pressure

## 1. Introduction

P102–P104 closed the `merchant_martial_patron` narrow playable bridge: native wealth+invest path plus three P63 bridge-origin paths (apprentice, tavern, peasant) all reach `merchant_patron_on_ramp_done` and a lightweight `merchant_patron_payoff_echo` (P93 pattern). Magnate spine (P97–P101) and bridge-origin endgame (P101) remain non-regressed.

对照 merchant magnate trilogy 与 renown/medical 路线方法论，patron 路线目前走完了 bridge → entry/on-ramp → payoff echo，但 **缺少 pressure 阶段**。Patron pressure 的核心叙事方向尚不明确——「护商武力负担」、「门派人情债」、「商武复合身份撕裂」都是候选，且必须与 magnate pressure（金钱/经营债）和 renown pressure（人情债）明确区分。

P104 closure report 明确 defer full patron pressure/mid/late chain。P105 的目标是为 `merchant_martial_patron` 的 pressure 阶段产出 design-first contract：明确 pressure 核心叙事方向、触发条件、事件结构、flag 接口、表达更新边界，为 P106 playable pressure implementation 提供无歧义输入。

这不是 pressure implementation stage，而是 bounded 的 design-first contract stage——类似 P74 相对于 P75 的关系。

## 2. Goals

- 为 `merchant_martial_patron` 定义 pressure 阶段的 design-first contract
- 明确 patron pressure 的核心叙事方向（在多个候选中选定一个）
- 定义 pressure 事件的触发条件、结构、flag 接口（覆盖 native + bridge-origin 变体优先级）
- 定义 player-facing expression 更新边界
- 为 P106 playable pressure implementation 提供无歧义输入
- 保持商武一体（patron）风味，与 magnate/renown pressure 明确区分

## 3. Non-Goals

- 不直接写 runtime pressure 事件实现
- 不直接做 patron mid/late / endgame 深化
- 不重做 P102–P104 patron bridge entry / on-ramp wiring
- 不重做 P55/P97–P101 magnate spine
- 不扩成 full Wave 3 mixed-achievement graph
- 不新增系统或平台层
- 不做 stat threshold gate 验证
- 不做 full-lifetime `gate:p20` broad rerun

## 4. User Stories

### US-001: Audit Patron Pressure Prerequisites

**Description:** As a maintainer, I want a prerequisite audit for the patron pressure stage so P105 starts from the real gating surfaces and not from assumptions.

**Acceptance Criteria:**

- [ ] 汇总 patron 路线当前已有的 flags、markers、events、expressions（P102 native + P103/P104 bridge-origin + payoff echo）
- [ ] 明确 pressure 之前已经存在什么、可以复用什么
- [ ] 对照 magnate pressure（`magnate_midlife_pressure`）与 renown pressure（`renown_midlife_pressure`）先例
- [ ] 输出 `docs/test-reports/p105-merchant-martial-patron-pressure-prerequisite-audit.md`
- [ ] 本故事不改运行行为
- [ ] `npm run typecheck` passes

### US-002: Lock P105 Scope Contract

**Description:** As a planner, I want a scope contract so P105 stays design-first and does not slip into partial implementation.

**Acceptance Criteria:**

- [ ] 明确 P105 只做 gap audit、方向比较、pressure contract、proof shape
- [ ] 明确允许层：文档、contract、targeted proof planning
- [ ] 明确禁止项：runtime wiring、P102–P104 rewrite、magnate spine rewrite、payoff redesign、new UI
- [ ] 输出 `docs/test-reports/p105-merchant-martial-patron-pressure-scope-contract.md`
- [ ] `npm run typecheck` passes

### US-003: Compare Patron Pressure Directions

**Description:** As a designer, I want bounded pressure-direction options for the patron route so P105 chooses the smallest viable pressure shape before implementation.

**Acceptance Criteria:**

- [ ] 至少比较 2 个 pressure 方向候选（如：护商武力负担 / 门派人情债 / 商武身份撕裂）
- [ ] 每个候选包含：核心叙事、触发条件、玩家选择空间、与 magnate/renown pressure 的区分度
- [ ] 明确推荐方向及放弃方向
- [ ] 推荐必须符合质量优先与小步实施原则
- [ ] 结论写入 comparison 文档
- [ ] `npm run typecheck` passes

### US-004: Define Patron Pressure Contract

**Description:** As a designer, I want an explicit pressure contract so P106 knows exactly what flags, gates, events, and player-facing meanings must be closed.

**Acceptance Criteria:**

- [ ] 定义 pressure checkpoint、所需 flags、对应 gate acceptance
- [ ] 定义 1 个核心 pressure 事件（或 1 组紧密关联的小事件）
- [ ] 定义至少 2 个 pressure-specific player-facing signals
- [ ] 明确 pressure 与 on-ramp、与 magnate midlife pressure 的差异
- [ ] 保留 native / bridge-origin 变体表达优先级规则
- [ ] 为后续 payoff/late-life 阶段预留 flag 接口
- [ ] 合同写入 `docs/PRD/p105-merchant-martial-patron-pressure-contract.md`
- [ ] `npm run typecheck` passes

### US-005: Define P106 Validation Shape

**Description:** As a maintainer, I want the P106 validation shape fixed in advance so playable pressure work is judged against explicit proof and regression expectations.

**Acceptance Criteria:**

- [ ] 明确 targeted proof 需要展示哪些链路节点（on-ramp → pressure → 表达变化）
- [ ] 明确 regression tests 至少覆盖 P102–P104 patron bridge + P97–P101 magnate
- [ ] 明确何种证据算 pressure closed
- [ ] 不要求 full lifetime exhaust
- [ ] `npm run typecheck` passes

### US-006: Produce P105 Closure Report

**Description:** As a maintainer, I want a closure report that locks the patron pressure design-first contract and hands off a bounded implementation target to P106.

**Acceptance Criteria:**

- [ ] 输出 `docs/test-reports/p105-merchant-martial-patron-pressure-closure-report.md`
- [ ] 汇总 prerequisite audit、scope contract、pressure-direction comparison、pressure contract、validation shape
- [ ] 明确与 P106 的边界
- [ ] 列出仍 defer 的更大 patron-expansion 项
- [ ] 明确 pressure 阶段是否值得进入 implementation（GO / NO-GO）
- [ ] `npm run typecheck` passes

## 5. Success Criteria

- repo 内存在 1 份 patron pressure 的 design-first truth source
- pressure contract 已无歧义
- proof / test 预期已提前固定
- P106 无需重新做方向选择或大范围澄清
- patron 商武一体风味在 pressure 设计中保持一致

## 6. Dependencies / Context

- P104 closure: `docs/test-reports/p104-merchant-martial-patron-bridge-origin-peasant-closure-report.md`
- P102 scope contract: `docs/test-reports/p102-merchant-martial-patron-bridge-scope-contract.md`
- Magnate pressure precedent: `magnate_midlife_pressure` in sample-lines-spine
- Renown pressure contract: `docs/PRD/p74-renown-pressure-contract.md`
- North Star: `docs/designs/p25-lifetime-simulation-north-star.md`

## 7. Open Questions

- pressure 事件 age band：对齐 magnate midlife（36–42）还是 patron on-ramp 之后独立窗口
- native orthodox/martial 变体是否在 pressure 层分叉，还是共用单一 pressure 事件 + 表达分支

## 8. Out-Of-Scope Follow-Up

1. P106 playable pressure implementation
2. Patron mid/late-life and endgame differentiation
3. Full Wave 3 mixed-achievement graph
4. North Star §8 broader Wave 1/2/4 waves
5. Full-lifetime simulation `gate:p20` broad rerun
