# PRD: P90 Wuxia Medical Late-Life Design-First Contract

> **Derived from:** `docs/test-reports/p89-medical-payoff-closure-report.md`, `docs/PRD/p89-wuxia-medical-payoff-playable-implementation.md`, `docs/designs/p25-lifetime-simulation-north-star.md`
> **Stage slug:** `p90-wuxia-medical-late-life-design-first`
> **Stage type:** bounded design-first contract stage for medical late-life (6 branches)

## 1. Introduction

P89 已完成 `medical_sage_healer`（一代名医）路线的 payoff runtime 实现：2 个 choice 事件（compassionate + pragmatic）已落地，6 个选择各有不同的 stat、identity、表达。medical 路线从"有代价的成长"推进到"有选择的了结"，midlife 弧线完整。

对照 renown trilogy 方法论，medical 路线目前走完了 bridge → entry → on-ramp → pressure → payoff，下一步是 **late-life**（50岁+）。与 renown late-life（3 个分支）不同，medical late-life 有 **2 variants × 3 choices = 6 个不同的 payoff 分支**，每个分支都有独特的 late-life 走向——这是 medical 路线的差异化机会。

P89 closure report 明确建议：**GO for P90 medical late-life design-first**，理由包括：5 层基础扎实、6 个分支各有清晰 late-life hook、tavern-born 风味强、renown late-life 模式可复用。

P90 的目标是为 `medical_sage_healer` 的 late-life 阶段产出 design-first contract：明确 late-life 的核心叙事方向、6 个 payoff choice 对应的 late-life 分支、事件结构、flag 接口、表达更新边界，为 P91 的 implementation 提供无歧义输入。

这不是 late-life implementation stage，而是 bounded 的 design-first contract stage——类似 P78 相对于 P79、P88 相对于 P89 的关系。

## 2. Goals

- 为 `medical_sage_healer` 定义 late-life 阶段的 design-first contract
- 基于 6 个 payoff choice（2 variants × 3 choices）设计 6 条不同的 late-life 分支
- 定义 late-life 事件的触发条件、结构、flag 接口
- 定义 player-facing expression 更新边界（sample line + ordinary origin）
- 为 P91 playable late-life implementation 提供无歧义输入
- 保持 tavern-born medical healer 风味，不做成 generic late-life
- 评估 late-life 是否值得做（GO / NO-GO），如果 NO-GO 则明确停止点
- 与 renown late-life 明确区分，避免镜像

## 3. Non-Goals

- 不直接写 runtime late-life 事件实现
- 不做 endgame echo / final legacy（P92+ 或更远）
- 不扩成 full medical route 全生命周期规划
- 不新增系统或平台层
- 不扩展到其他出身（仅 tavern_hand origin）
- 不做 stat threshold gate 验证
- 不做 plague hero / medical pure 完整抉择线
- 不做巅峰/混合成就（Wave 2/3）
- 不并行设计第二条 medical seed（other origins）

## 4. User Stories

### US-001: Audit Medical Late-Life Prerequisites
**Description:** As a maintainer, I want a prerequisite audit for the medical late-life stage so P90 starts from the real gating surfaces and not from assumptions.

**Acceptance Criteria:**
- [ ] 汇总 medical 路线当前已有的 flags、markers、events、expressions（bridge + entry + on-ramp + pressure + payoff）
- [ ] 明确 6 个 payoff choice 的状态差异（stats + flags + identity）
- [ ] 明确 late-life 之前已经存在什么、可以复用什么
- [ ] 与 renown late-life 对比，找出 medical 独特的 late-life 机会与约束
- [ ] 输出 `docs/test-reports/p90-medical-late-life-prerequisite-audit.md`
- [ ] 本故事不改运行行为

### US-002: Lock P90 Scope Contract
**Description:** As a planner, I want a scope contract so P90 stays design-first and does not slip into partial implementation.

**Acceptance Criteria:**
- [ ] 明确 P90 只做 prerequisite audit、scope contract、branch design、late-life contract、validation shape、closure
- [ ] 明确允许层：文档、contract、targeted proof planning
- [ ] 明确禁止项：runtime wiring、new framework、bulk content wave、endgame design、第二条路线、plague/pure 扩展
- [ ] 明确 6 分支是上限，如发现叙事价值不足可缩减
- [ ] 输出 `docs/test-reports/p90-medical-late-life-scope-contract.md`

### US-003: Design Six Late-Life Branches (Per Payoff Choice)
**Description:** As a designer, I want six distinct late-life branches (one per payoff choice) so medical late-life leverages the 2-variant × 3-choice structure for meaningful differentiation.

**Acceptance Criteria:**
- [ ] 为 Compassionate A（硬扛到底 / 油尽灯枯）设计 late-life 分支：核心叙事 + 触发条件 + 玩家体验
- [ ] 为 Compassionate B（学会放手 / 释然通透）设计 late-life 分支：核心叙事 + 触发条件 + 玩家体验
- [ ] 为 Compassionate C（找到传承 / 仁心传承）设计 late-life 分支：核心叙事 + 触发条件 + 玩家体验
- [ ] 为 Pragmatic A（硬扛人情 / 声名赫赫）设计 late-life 分支：核心叙事 + 触发条件 + 玩家体验
- [ ] 为 Pragmatic B（撕破脸皮 / 快意江湖）设计 late-life 分支：核心叙事 + 触发条件 + 玩家体验
- [ ] 为 Pragmatic C（人情练达 / 一代名医）设计 late-life 分支：核心叙事 + 触发条件 + 玩家体验
- [ ] 6 个分支有实质差异（不是换皮），各自对应不同的 payoff choice identity
- [ ] 2 个 variant（compassionate vs pragmatic）的 late-life 方向有本质差异（不是镜像）
- [ ] 每个分支都有 tavern-born medical healer 风味适配
- [ ] 明确 late-life 是 single event 还是 multi-event（推荐 single auto event with 6 branches，保持 bounded）
- [ ] 与 renown late-life 明确区分（healer identity vs jianghu renown identity）
- [ ] 结论写入 design document

### US-004: Define Medical Late-Life Contract
**Description:** As a designer, I want an explicit late-life contract so P91 knows exactly what flags, gates, events, and player-facing meanings must be closed.

**Acceptance Criteria:**
- [ ] 定义 late-life checkpoint、所需 flags、对应 gate acceptance
- [ ] 定义 late-life 事件结构（choice 或 auto，推荐 auto with 6 branches）
- [ ] 定义每个分支的 stat 变化、identity marker、表达差异
- [ ] 定义至少 3 个 late-life-specific player-facing signals（cost label, current goal, late-life identity 等）
- [ ] 明确 late-life 与 payoff、与 generic endgame 的差异
- [ ] 保留 tavern-born medical healer 风味
- [ ] 为后续 endgame / final legacy 阶段预留 flag 接口
- [ ] 合同写入 `docs/PRD/p90-medical-late-life-contract.md`

### US-005: Define P91 Validation Shape
**Description:** As a maintainer, I want the P91 validation shape fixed in advance so playable late-life work is judged against explicit proof and regression expectations.

**Acceptance Criteria:**
- [ ] 明确 targeted proof 需要展示哪些链路节点（payoff → late-life → 表达变化）
- [ ] 6 个分支都要有核心节点验证
- [ ] 明确 regression tests 至少覆盖哪些断言
- [ ] 明确何种证据算 late-life closed
- [ ] 不要求 full lifetime exhaust
- [ ] P83/P84/P85/P87/P89 既有 evidence 不退化的验证边界
- [ ] 与 renown late-life (P79) 的测试覆盖面对比，确保 medical 6 分支的验证深度足够

### US-006: Produce P90 Closure Report
**Description:** As a maintainer, I want a closure report that locks the medical late-life design-first contract and hands off a bounded implementation target to P91.

**Acceptance Criteria:**
- [ ] 输出 `docs/test-reports/p90-medical-late-life-closure-report.md`
- [ ] 汇总 prerequisite audit、scope contract、late-life branch design、late-life contract、validation shape
- [ ] 明确与 `P91` 的边界
- [ ] 列出仍 defer 的更大 medical-expansion 项
- [ ] 明确 late-life 阶段是否值得进入 implementation（GO / NO-GO）
- [ ] 如果 NO-GO，明确停止点及原因
- [ ] 14 条 closure criteria（参考 P88→P89 validation shape 模式）

## 5. Functional Requirements

1. FR-1: P90 必须围绕 `medical_sage_healer` tavern_hand seed 展开。
2. FR-2: P90 必须输出明确的 late-life contract（或显式 NO-GO）。
3. FR-3: P90 必须提前锁定 P91 的 proof / regression shape。
4. FR-4: P90 不得进入 runtime 实现。
5. FR-5: P90 closure 必须足以让 P91 直接承接（如果 GO）。
6. FR-6: Late-life 必须保持 tavern-born medical healer 风味，与 renown late-life 明确区分。
7. FR-7: 6 个 late-life 分支必须有实质差异（对应 6 个 payoff choice）。
8. FR-8: 2 个 variant 的 late-life 必须有本质差异（compassionate vs pragmatic，不是镜像）。
9. FR-9: P90 必须评估 late-life 是否值得做（GO / NO-GO）。

## 6. Success Criteria

- repo 内存在 1 份 medical late-life 的 design-first truth source（或显式 NO-GO 文档）
- late-life contract 已无歧义（如果 GO）
- proof / test 预期已提前固定（如果 GO）
- `P91` 无需重新做方向选择或大范围澄清（如果 GO）
- tavern-born medical healer 风味在 late-life 设计中保持一致
- 6 个 late-life 分支有实质差异（如果 GO）
- 2 个 variant 的 late-life 有本质差异（不是镜像）
- 与 renown late-life 明确区分

## 7. Dependencies / Context

- P89 closure: `docs/test-reports/p89-medical-payoff-closure-report.md`
- P89 payoff implementation: `docs/PRD/p89-wuxia-medical-payoff-playable-implementation.md`
- P88 design-first precedent: `docs/PRD/p88-medical-payoff-design-first.md`
- P78 renown late-life design-first precedent: `docs/PRD/p78-wuxia-renown-late-life-design-first.md`
- North Star: `docs/designs/p25-lifetime-simulation-north-star.md`

## 8. Risks And Rollback

### Risks

- **6-branch complexity risk:** 2 variants × 3 choices = 6 分支，复杂度约为 renown late-life 的 2 倍，可能导致设计稀释
- **Scope creep risk:** 容易把 design-first 扩成半实现阶段，或同时设计 endgame
- **Overfit risk:** 机械复制 renown late-life 模式而忽略 medical 路线差异（healer vs jianghu renown）
- **Flavor dilution risk:** Late-life 设计可能丢失 tavern-born medical healer 风味，变成 generic old doctor
- **Choice meaninglessness risk:** 6 个 late-life 分支可能变成换皮，没有实质差异
- **Variant weakening risk:** 2 个 variant 的 late-life 可能被稀释成镜像
- **Unnecessary late-life risk:** 6 分支中可能部分分支叙事价值不足，应允许缩减

### Rollback

- 若 prerequisite audit 证明 payoff 基础仍不足，P90 应中止并回到补证据阶段
- 若评估后发现 late-life 不值得做，可显式 NO-GO，不进入 P91
- 若 6 分支过于复杂，可缩减为 4-5 个分支（合并叙事价值低的分支）
- 若设计过于复杂，可缩减为 single auto event with 6 branches（bounded）
- 可回退到 P89 payoff-only 状态，P90 文档保留为 reference

## 9. Validation Direction

- prerequisite 层：现有 gate/flag/expression/event truth 必须先被摸清
- direction 层：设计 6 个 late-life 分支，每个对应一个 payoff choice
- contract 层：late-life checkpoint、事件结构、player-facing signal 必须明确
- handoff 层：P91 的 proof / regression 入口必须提前收紧（如果 GO）
- GO/NO-GO 层：必须明确 late-life 是否值得做
- differentiation 层：必须与 renown late-life 明确区分
