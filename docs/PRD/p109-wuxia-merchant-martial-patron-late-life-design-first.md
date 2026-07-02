# PRD: P109 Wuxia Merchant Martial Patron Late-Life Design-First Contract

> **Derived from:** `docs/test-reports/p108-merchant-martial-patron-payoff-closure-report.md`, `docs/PRD/p107-merchant-martial-patron-payoff-contract.md`, `docs/test-reports/p107-p108-validation-shape.md`, `agent_docs/p108-wuxia-merchant-martial-patron-payoff-playable-implementation-discovery-result.md`
> **Stage slug:** `p109-wuxia-merchant-martial-patron-late-life-design-first`
> **Gaps addressed:** GAP-P108-N01
> **Stage type:** bounded design-first contract stage for merchant_martial_patron late-life

## 1. Introduction

P108 已完成 `merchant_martial_patron`（商武一体金主）路线的 payoff runtime 实现：「商武撕裂之解」choice 事件已落地，三个选择（硬扛盟约 / 撕破盟约 / 商武平衡）各有不同的 stat、identity、表达。patron 路线从「护商武力负担兑现」推进到「商武撕裂之解的有选择定型」，midlife 弧线完整。

对照 renown（P78→P79）与 medical（P90→P91）方法论，patron 路线目前走完了 bridge → entry/on-ramp → pressure → payoff，下一步是 **late-life**（50岁+）。与 magnate late-life（守成与传承）不同，patron late-life 有三个不同的 payoff choice 分支，每个分支都有 P107 contract 预留的叙事 hook（盟约绑紧 / 自由孤立 / 新盟可持续）——这是 patron 路线的差异化机会。

P108 closure report 明确建议：**GO for P109 late-life design-first**。P109 的目标是为 `merchant_martial_patron` 的 late-life 阶段产出 design-first contract：明确 late-life 的核心叙事方向、三个 payoff choice 对应的 late-life 分支、事件结构、flag 接口、表达更新边界，为 P110 playable late-life implementation 提供无歧义输入。

这不是 late-life implementation stage，而是 bounded 的 design-first contract stage——类似 P78 相对于 P79、P90 相对于 P91 的关系。

## 2. Goals

- 为 `merchant_martial_patron` 定义 late-life 阶段的 design-first contract
- 基于三个 payoff choice（covenant_holder / covenant_breaker / balancer）设计三条不同的 late-life 分支
- 定义 late-life 事件的触发条件、结构、flag 接口（覆盖 native + bridge-origin 变体优先级）
- 定义 player-facing expression 更新边界（sample line + age-40/late-life identity）
- 为 P110 playable late-life implementation 提供无歧义输入
- 保持商武一体（patron）风味，与 magnate/renown late-life 明确区分
- 评估 late-life 是否值得做（GO / NO-GO），如果 NO-GO 则明确停止点
- P102–P108 既有 evidence 不退化（本 stage 不改 runtime）

## 3. Non-Goals

- 不直接写 runtime late-life 事件实现
- 不做 patron endgame echo / final legacy（P111+）
- 不重做 P102–P108 patron bridge/pressure/payoff wiring
- 不重做 P55/P97–P101 magnate spine
- 不扩成 full Wave 3 mixed-achievement graph 或 habit-led lifetime trace
- 不新增系统或平台层
- 不做 full 5×3 entry×payoff×late-life identity 矩阵（P109 minimum: 1 native + 1 bridge per branch）
- 不做 stat threshold gate 验证
- 不做 ordinary origin patron expression（defer）
- 不做 full-lifetime `gate:p20` broad rerun

## 4. User Stories

### US-001: Audit Patron Late-Life Prerequisites

**Description:** As a maintainer, I want a prerequisite audit for the patron late-life stage so P109 starts from the real gating surfaces and not from assumptions.

**Acceptance Criteria:**

- [ ] 汇总 patron 路线当前已有的 flags、markers、events、expressions（P102–P108）
- [ ] 明确三个 payoff choice 的状态差异（stats + flags + identity + cost label + goal）
- [ ] 明确 late-life 之前已经存在什么、可以复用什么
- [ ] 对照 renown late-life（P78）与 magnate late-life 先例，找出 patron 独特的 late-life 机会与约束
- [ ] 输出 `docs/test-reports/p109-merchant-martial-patron-late-life-prerequisite-audit.md`
- [ ] 本故事不改运行行为
- [ ] Typecheck passes

### US-002: Lock P109 Scope Contract

**Description:** As a planner, I want a scope contract so P109 stays design-first and does not slip into partial implementation.

**Acceptance Criteria:**

- [ ] 明确 P109 只做 prerequisite audit、scope contract、branch design、late-life contract、validation shape、closure
- [ ] 明确允许层：文档、contract、targeted proof planning
- [ ] 明确禁止项：runtime wiring、P102–P108 rewrite、magnate spine rewrite、endgame design、new UI
- [ ] 输出 `docs/test-reports/p109-merchant-martial-patron-late-life-scope-contract.md`
- [ ] Typecheck passes

### US-003: Design Three Late-Life Branches (Per Payoff Choice)

**Description:** As a designer, I want three distinct late-life branches (one per payoff choice) so patron late-life leverages the 3-choice payoff structure for meaningful differentiation.

**Acceptance Criteria:**

- [ ] 为 covenant_holder（硬扛盟约）设计 late-life 分支：核心叙事 + 触发条件 + 玩家体验（盟约绑紧方向）
- [ ] 为 covenant_breaker（撕破盟约）设计 late-life 分支：核心叙事 + 触发条件 + 玩家体验（自由孤立方向）
- [ ] 为 balancer（商武平衡）设计 late-life 分支：核心叙事 + 触发条件 + 玩家体验（新盟可持续方向）
- [ ] 三个分支有实质差异（不是换皮），各自对应不同的 payoff choice identity
- [ ] 至少覆盖 1 native + 1 bridge-origin entry 叠加 payoff choice 的 late-life 表达优先级规则
- [ ] 明确 late-life 是 single event 还是 multi-event（推荐 single auto event with 3 branches，保持 bounded）
- [ ] 与 magnate late-life、renown late-life 明确区分（商武一体 vs 巨贾守成 vs 江湖名宿）
- [ ] 结论写入 design document
- [ ] Typecheck passes

### US-004: Define Patron Late-Life Contract

**Description:** As a designer, I want an explicit late-life contract so P110 knows exactly what flags, gates, events, and player-facing meanings must be closed.

**Acceptance Criteria:**

- [ ] 定义 late-life checkpoint（`merchant_patron_late_life_done`）、所需 flags、对应 gate acceptance
- [ ] 定义 late-life 事件结构（choice 或 auto，推荐 auto with 3 branches keyed on payoff marker）
- [ ] 定义每个分支的 stat 变化、identity marker、表达差异
- [ ] 定义至少 3 个 late-life-specific player-facing signals（cost label, current goal, late-life identity 等）
- [ ] 明确 late-life 与 payoff、与 magnate/renown late-life 的差异
- [ ] 保留 native / bridge-origin 变体表达优先级规则
- [ ] 为后续 endgame echo 阶段预留 flag 接口（`merchant_patron_endgame_echo_done`）
- [ ] 合同写入 `docs/PRD/p109-merchant-martial-patron-late-life-contract.md`
- [ ] Typecheck passes

### US-005: Define P110 Validation Shape

**Description:** As a maintainer, I want the P110 validation shape fixed in advance so playable late-life work is judged against explicit proof and regression expectations.

**Acceptance Criteria:**

- [ ] 明确 targeted proof 需要展示哪些链路节点（payoff → late-life → 表达变化）
- [ ] 三个 payoff choice 分支都要有核心节点验证
- [ ] 明确 regression tests 至少覆盖 P102–P108 patron + P97–P101 magnate + guard:sample-lines-baseline
- [ ] 明确 closure criteria 数量与门槛（参照 P108 12-criteria pattern）
- [ ] 不要求 full lifetime exhaust
- [ ] 保存 validation shape 文档
- [ ] Typecheck passes

### US-006: Produce P109 Closure Report

**Description:** As a maintainer, I want a closure report that locks the patron late-life design-first contract and hands off to P110.

**Acceptance Criteria:**

- [ ] 保存 `docs/test-reports/p109-merchant-martial-patron-late-life-closure-report.md`
- [ ] 汇总 prerequisite audit、scope contract、branch design、late-life contract、validation shape
- [ ] 明确 P110 边界
- [ ] 列出更大 patron-expansion 项的 defer
- [ ] 给出 GO / NO-GO for P110 playable late-life（含理由）
- [ ] Typecheck passes

## 5. Success Criteria

- Patron late-life 有清晰的 design-first contract，三个 payoff 分支各有可验证的 late-life 走向
- P110 implementation 无需再做方向性决策
- 商武一体风味贯穿 late-life 设计，与 magnate/renown 可区分
- P102–P108 runtime evidence 未被本 stage 改动
- GO/NO-GO 结论有明确依据

## 6. Dependencies / Context

- P108 closure: `docs/test-reports/p108-merchant-martial-patron-payoff-closure-report.md`
- P107 payoff contract: `docs/PRD/p107-merchant-martial-patron-payoff-contract.md`
- Renown late-life precedent: `docs/PRD/p78-wuxia-renown-late-life-design-first.md`
- Medical late-life precedent: `docs/PRD/p90-wuxia-medical-late-life-design-first.md`
- North Star: `docs/designs/p25-lifetime-simulation-north-star.md` §8

## 7. Open Questions

- Late-life 是否采用 single auto × 3 branches（默认）vs choice event（需 stronger 理由）
- Age range 默认 52–56（对齐 medical/renown）是否需 patron-specific 调整
- Ordinary origin patron late-life 是否纳入 P109 bonus（默认 defer）
