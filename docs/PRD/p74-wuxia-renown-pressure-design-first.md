# PRD: P74 Wuxia Renown Pressure Design-First Contract

> **Derived from:** `docs/test-reports/p73-renown-on-ramp-closure-report.md`, `docs/PRD/p73-wuxia-renown-on-ramp-spine.md`, `docs/designs/p25-lifetime-simulation-north-star.md`
> **Stage slug:** `p74-wuxia-renown-pressure-design-first`
> **Stage type:** bounded design-first contract stage for renown pressure

## 1. Introduction

P73 已完成 `jianghu_renown_sage`（江湖名宿）路线的 on-ramp spine：过桥后的第一个标志性叙事事件"声名初显"已落地，renown 路线从"有标签"推进到"有内容"。

对照 merchant trilogy 方法论，renown 路线目前走完了 bridge → entry → on-ramp，下一步是 **pressure**。但与 merchant pressure（财务崩溃、债务危机）不同，renown pressure 的方向不那么直观——"声名之累"、"人情债"、"江湖恩怨"都有可能。

P73 closure report 明确建议：**pressure stage GO，但 design-first，不是 implementation-first。**

P74 的目标是为 `jianghu_renown_sage` 的 pressure 阶段产出 design-first contract：明确 pressure 的核心叙事方向、触发条件、事件结构、flag 接口、表达更新边界，为 P75 的 implementation 提供无歧义输入。

这不是 pressure implementation stage，而是 bounded 的 design-first contract stage——类似 P70 相对于 P71 的关系。

## 2. Goals

- 为 `jianghu_renown_sage` 定义 pressure 阶段的 design-first contract
- 明确 renown pressure 的核心叙事方向（在多个候选中选定一个）
- 定义 pressure 事件的触发条件、结构、flag 接口
- 定义 player-facing expression 更新边界
- 为 P75 playable pressure implementation 提供无歧义输入
- 保持 tavern-born 风味，不做成 generic pressure

## 3. Non-Goals

- 不直接写 runtime pressure 事件实现
- 不直接做 payoff / late identity 深化
- 不扩成 full renown route 全生命周期规划
- 不新增系统或平台层
- 不并行设计第二条 renown seed（mentor-bond）
- 不扩展到其他出身（仅 tavern_hand origin）
- 不做 stat threshold gate 验证

## 4. User Stories

### US-001: Audit Renown Pressure Prerequisites
**Description:** As a maintainer, I want a prerequisite audit for the renown pressure stage so P74 starts from the real gating surfaces and not from assumptions.

**Acceptance Criteria:**
- [ ] 汇总 renown 路线当前已有的 flags、markers、events、expressions（bridge + entry + on-ramp）
- [ ] 明确 pressure 之前已经存在什么、可以复用什么
- [ ] 输出 `docs/test-reports/p74-renown-pressure-prerequisite-audit.md`
- [ ] 本故事不改运行行为

### US-002: Lock P74 Scope Contract
**Description:** As a planner, I want a scope contract so P74 stays design-first and does not slip into partial implementation.

**Acceptance Criteria:**
- [ ] 明确 P74 只做 gap audit、方向比较、pressure contract、proof shape
- [ ] 明确允许层：文档、contract、targeted proof planning
- [ ] 明确禁止项：runtime wiring、new framework、bulk content wave、payoff design
- [ ] 输出 `docs/test-reports/p74-renown-pressure-scope-contract.md`

### US-003: Compare Renown Pressure Directions
**Description:** As a designer, I want bounded pressure-direction options for the renown route so P74 chooses the smallest viable pressure shape before implementation.

**Acceptance Criteria:**
- [ ] 至少比较 2 个 pressure 方向候选（如：声名之累 / 人情债 / 江湖恩怨站队）
- [ ] 每个候选包含：核心叙事、触发条件、玩家选择空间、tavern-born 适配度
- [ ] 明确推荐方向及放弃方向
- [ ] 推荐必须符合质量优先与小步实施原则
- [ ] 结论写入 comparison 文档

### US-004: Define Renown Pressure Contract
**Description:** As a designer, I want an explicit pressure contract so P75 knows exactly what flags, gates, events, and player-facing meanings must be closed.

**Acceptance Criteria:**
- [ ] 定义 pressure checkpoint、所需 flags、对应 gate acceptance
- [ ] 定义 1 个核心 pressure 事件（或 1 组紧密关联的小事件）
- [ ] 定义至少 2 个 pressure-specific player-facing signals
- [ ] 明确 pressure 与 on-ramp、与 generic midlife 的差异
- [ ] 保留 tavern-born 风味
- [ ] 为后续 payoff 阶段预留 flag 接口
- [ ] 合同写入 `docs/PRD/p74-renown-pressure-contract.md`

### US-005: Define P75 Validation Shape
**Description:** As a maintainer, I want the P75 validation shape fixed in advance so playable pressure work is judged against explicit proof and regression expectations.

**Acceptance Criteria:**
- [ ] 明确 targeted proof 需要展示哪些链路节点（on-ramp → pressure → 表达变化）
- [ ] 明确 regression tests 至少覆盖哪些断言
- [ ] 明确何种证据算 pressure closed
- [ ] 不要求 full lifetime exhaust
- [ ] P71/P72/P73 既有 evidence 不退化的验证边界

### US-006: Produce P74 Closure Report
**Description:** As a maintainer, I want a closure report that locks the renown pressure design-first contract and hands off a bounded implementation target to P75.

**Acceptance Criteria:**
- [ ] 输出 `docs/test-reports/p74-renown-pressure-closure-report.md`
- [ ] 汇总 prerequisite audit、scope contract、pressure-direction comparison、pressure contract、validation shape
- [ ] 明确与 `P75` 的边界
- [ ] 列出仍 defer 的更大 renown-expansion 项
- [ ] 明确 pressure 阶段是否值得进入 implementation（GO / NO-GO）

## 5. Functional Requirements

1. FR-1: P74 必须围绕 `jianghu_renown_sage` tavern_hand seed 展开。
2. FR-2: P74 必须输出明确的 pressure contract。
3. FR-3: P74 必须提前锁定 P75 的 proof / regression shape。
4. FR-4: P74 不得进入 runtime 实现。
5. FR-5: P74 closure 必须足以让 P75 直接承接。
6. FR-6: Pressure 必须保持 tavern-born renown 风味，与 merchant pressure 明确区分。

## 6. Success Criteria

- repo 内存在 1 份 renown pressure 的 design-first truth source
- pressure contract 已无歧义
- proof / test 预期已提前固定
- `P75` 无需重新做方向选择或大范围澄清
- tavern-born 风味在 pressure 设计中保持一致

## 7. Dependencies / Context

- P73 closure: `docs/test-reports/p73-renown-on-ramp-closure-report.md`
- P73 on-ramp contract: `docs/PRD/p73-renown-on-ramp-contract.md`
- P70 design-first precedent: `docs/PRD/p70-wuxia-selected-next-route-design-first-contract.md`
- Merchant pressure precedent: `docs/PRD/p55-wuxia-merchant-magnate-bounded-expansion.md`
- North Star: `docs/designs/p25-lifetime-simulation-north-star.md`

## 8. Risks And Rollback

### Risks

- **Direction ambiguity risk:** Renown pressure 方向不如 merchant pressure 直观，可能陷入多方向摇摆
- **Scope creep risk:** 容易把 design-first 扩成半实现阶段，或同时设计 payoff
- **Overfit risk:** 机械复制 merchant pressure 模式而忽略 renown 路线差异
- **Flavor dilution risk:** Pressure 设计可能丢失 tavern-born 风味，变成 generic jianghu pressure

### Rollback

- 若 prerequisite audit 证明 on-ramp 基础仍不足，P74 应中止并回到补证据阶段
- 若比较后发现无 bounded pressure shape，可显式 NO-GO，不进入 P75
- 可回退到 P73 on-ramp-only 状态，P74 文档保留为 reference

## 9. Validation Direction

- prerequisite 层：现有 gate/flag/expression/event truth 必须先被摸清
- direction 层：至少比较 2 个 pressure 方向，选定 1 个
- contract 层：pressure checkpoint、事件结构、player-facing signal 必须明确
- handoff 层：P75 的 proof / regression 入口必须提前收紧
