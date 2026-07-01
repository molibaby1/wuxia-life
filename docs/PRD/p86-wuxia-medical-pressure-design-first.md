# PRD: P86 Wuxia Medical Pressure Design-First Contract

> **Derived from:** `docs/test-reports/p85-medical-sage-on-ramp-closure-report.md`, `docs/PRD/p85-wuxia-medical-sage-on-ramp-spine.md`, `docs/designs/p25-lifetime-simulation-north-star.md`
> **Stage slug:** `p86-wuxia-medical-pressure-design-first`
> **Stage type:** bounded design-first contract stage for medical_sage_healer pressure

## 1. Introduction

P85 已完成 `medical_sage_healer`（一代名医）路线的 on-ramp spine：过桥后的第一个标志性叙事事件"医名初起"已落地，医疗路线从"有标签"推进到"有内容"，且 compassionate / pragmatic 两个 variant 在 on-ramp 层可区分。

对照 merchant trilogy 与 renown 路线的方法论，医疗路线目前走完了 bridge → entry → on-ramp，下一步是 **pressure**。与 merchant pressure（财务崩溃、债务危机）和 renown pressure（人情债渐重）不同，medical pressure 有两个 variant 各自的压力方向：
- **Compassionate（仁心医者）**：身体垮掉 / 药材告急 / 被人利用善心
- **Pragmatic（世故人医）**：人情债 / 选边站 / 名声与利益的冲突

P85 closure report 明确建议：**pressure stage GO，但 design-first，不是 implementation-first。**

P86 的目标是为 `medical_sage_healer` 的 pressure 阶段产出 design-first contract：明确 pressure 的核心叙事方向（每个 variant 各一个）、触发条件、事件结构、flag 接口、表达更新边界，为 P87 的 implementation 提供无歧义输入。

这不是 pressure implementation stage，而是 bounded 的 design-first contract stage——类似 P74 相对于 P75 的关系。

## 2. Goals

- 为 `medical_sage_healer` 定义 pressure 阶段的 design-first contract（覆盖 2 variants）
- 明确 medical pressure 的核心叙事方向（每个 variant 在多个候选中选定一个）
- 定义 pressure 事件的触发条件、结构、flag 接口
- 定义 player-facing expression 更新边界
- 为 P87 playable pressure implementation 提供无歧义输入
- 保持 tavern-born 风味，不做成 generic pressure
- 延续 compassionate / pragmatic 两个 variant 的分化

## 3. Non-Goals

- 不直接写 runtime pressure 事件实现
- 不直接做 payoff / late identity 深化
- 不扩成 full medical route 全生命周期规划
- 不新增系统或平台层
- 不扩展到其他出身（仅 tavern_hand origin）
- 不做 stat threshold gate 验证
- 不做毒医路线（poison path）
- 不做 plague hero / medical pure 的完整抉择（defer 到 pressure 之后或 payoff）

## 4. User Stories

### US-001: Audit Medical Pressure Prerequisites
**Description:** As a maintainer, I want a prerequisite audit for the medical pressure stage so P86 starts from the real gating surfaces and not from assumptions.

**Acceptance Criteria:**
- [ ] 汇总 medical 路线当前已有的 flags、markers、events、expressions（bridge + entry + on-ramp）
- [ ] 明确 pressure 之前已经存在什么、可以复用什么
- [ ] 分析 2 个 variant 各自的 pressure 前置条件差异
- [ ] 输出 `docs/test-reports/p86-medical-pressure-prerequisite-audit.md`
- [ ] 本故事不改运行行为

### US-002: Lock P86 Scope Contract
**Description:** As a planner, I want a scope contract so P86 stays design-first and does not slip into partial implementation.

**Acceptance Criteria:**
- [ ] 明确 P86 只做 gap audit、方向比较、pressure contract、proof shape
- [ ] 明确允许层：文档、contract、targeted proof planning
- [ ] 明确禁止项：runtime wiring、new framework、bulk content wave、payoff design
- [ ] 明确与 P87（pressure implementation）的边界
- [ ] 输出 `docs/test-reports/p86-medical-pressure-scope-contract.md`

### US-003: Compare Medical Pressure Directions (Per Variant)
**Description:** As a designer, I want bounded pressure-direction options for each medical variant so P86 chooses the smallest viable pressure shape before implementation.

**Acceptance Criteria:**
- [ ] Compassionate variant：至少比较 2 个 pressure 方向候选（如：身体垮掉 / 药材告急 / 被利用善心）
- [ ] Pragmatic variant：至少比较 2 个 pressure 方向候选（如：人情债 / 选边站 / 名声与利益冲突）
- [ ] 每个候选包含：核心叙事、触发条件、玩家选择空间、tavern-born 适配度
- [ ] 每个 variant 明确推荐方向及放弃方向
- [ ] 推荐必须符合质量优先与小步实施原则
- [ ] 结论写入 comparison 文档

### US-004: Define Medical Pressure Contract
**Description:** As a designer, I want an explicit pressure contract (2 variants) so P87 knows exactly what flags, gates, events, and player-facing meanings must be closed.

**Acceptance Criteria:**
- [ ] 定义 pressure checkpoint、所需 flags、对应 gate acceptance
- [ ] 定义 2 个 variant 各 1 个核心 pressure 事件（或 1 组紧密关联的小事件）
- [ ] 定义至少 2 个 pressure-specific player-facing signals per variant
- [ ] 明确 pressure 与 on-ramp、与 generic midlife 的差异
- [ ] 保留 tavern-born 风味（酒肆小药庐底色）
- [ ] 为后续 payoff 阶段预留 flag 接口
- [ ] 延续 compassionate / pragmatic 的差异化
- [ ] 合同写入 `docs/PRD/p86-medical-pressure-contract.md`

### US-005: Define P87 Validation Shape
**Description:** As a maintainer, I want the P87 validation shape fixed in advance so playable pressure work is judged against explicit proof and regression expectations.

**Acceptance Criteria:**
- [ ] 明确 targeted proof 需要展示哪些链路节点（on-ramp → pressure → 表达变化，2 variants）
- [ ] 明确 regression tests 至少覆盖哪些断言
- [ ] 明确何种证据算 pressure closed
- [ ] 不要求 full lifetime exhaust
- [ ] P83/P84/P85 既有 evidence 不退化的验证边界

### US-006: Produce P86 Closure Report
**Description:** As a maintainer, I want a closure report that locks the medical pressure design-first contract and hands off a bounded implementation target to P87.

**Acceptance Criteria:**
- [ ] 输出 `docs/test-reports/p86-medical-pressure-closure-report.md`
- [ ] 汇总 prerequisite audit、scope contract、pressure-direction comparison、pressure contract、validation shape
- [ ] 明确与 `P87` 的边界
- [ ] 列出仍 defer 的更大 medical-expansion 项
- [ ] 明确 pressure 阶段是否值得进入 implementation（GO / NO-GO）

## 5. Functional Requirements

1. FR-1: P86 必须围绕 `medical_sage_healer` tavern_hand seed 展开。
2. FR-2: P86 必须覆盖 compassionate / pragmatic 两个 variant，各有独立的 pressure 方向。
3. FR-3: P86 必须输出明确的 pressure contract（2 variants）。
4. FR-4: P86 必须提前锁定 P87 的 proof / regression shape。
5. FR-5: P86 不得进入 runtime 实现。
6. FR-6: P86 closure 必须足以让 P87 直接承接。
7. FR-7: Pressure 必须保持 tavern-born medical healer 风味，与 renown / merchant pressure 明确区分。

## 6. Success Criteria

- repo 内存在 1 份 medical pressure 的 design-first truth source（2 variants）
- pressure contract 已无歧义，每个 variant 各有明确方向
- proof / test 预期已提前固定
- `P87` 无需重新做方向选择或大范围澄清
- tavern-born 风味在 pressure 设计中保持一致
- compassionate 与 pragmatic 在 pressure 层的差异化设计清晰

## 7. Dependencies / Context

- P85 closure: `docs/test-reports/p85-medical-sage-on-ramp-closure-report.md`
- P85 on-ramp contract: `docs/PRD/p85-medical-on-ramp-contract.md`
- Renown pressure design-first precedent: `docs/PRD/p74-wuxia-renown-pressure-design-first.md`
- Renown pressure implementation precedent: `docs/PRD/p75-wuxia-renown-pressure-playable-implementation.md`
- North Star: `docs/designs/p25-lifetime-simulation-north-star.md`

## 8. Risks And Rollback

### Risks

- **Direction ambiguity risk:** Medical pressure 有 2 个 variant，方向选择可能比 renown 更复杂
- **Scope creep risk:** 容易把 design-first 扩成半实现阶段，或同时设计 payoff
- **Overfit risk:** 机械复制 renown pressure 模式而忽略医疗路线差异
- **Variant weakening risk:** 两个 variant 的 pressure 方向可能差异不够强
- **Flavor dilution risk:** Pressure 设计可能丢失 tavern-born 风味，变成 generic medical pressure

### Rollback

- 若 prerequisite audit 证明 on-ramp 基础仍不足，P86 应中止并回到补证据阶段
- 若比较后发现无 bounded pressure shape（2 variants 都找不到合适的小步压力点），可显式 NO-GO，不进入 P87
- 可回退到 P85 on-ramp-only 状态，P86 文档保留为 reference

## 9. Validation Direction

- prerequisite 层：现有 gate/flag/expression/event truth 必须先被摸清
- direction 层：每个 variant 至少比较 2 个 pressure 方向，各选定 1 个
- contract 层：pressure checkpoint、事件结构、player-facing signal 必须明确（2 variants）
- handoff 层：P87 的 proof / regression 入口必须提前收紧
