# PRD: P111 Wuxia Merchant Martial Patron Endgame Design-First Contract

> **Derived from:** `docs/test-reports/p110-merchant-martial-patron-late-life-closure-report.md`, `docs/PRD/p109-merchant-martial-patron-late-life-contract.md`, `docs/test-reports/p109-p110-validation-shape.md`, `agent_docs/p110-wuxia-merchant-martial-patron-late-life-playable-implementation-discovery-result.md`
> **Stage slug:** `p111-wuxia-merchant-martial-patron-endgame-design-first`
> **Gaps addressed:** GAP-P110-N01
> **Stage type:** bounded design-first contract stage for merchant_martial_patron endgame / final legacy

## 1. Introduction

P110 已完成 `merchant_martial_patron`（商武一体金主）路线的 late-life runtime 实现：三个 payoff-driven 分支（盟约绑紧 / 自由孤立 / 新盟可持续）各有不同的 stat、identity、表达。patron 路线从 bridge → entry/on-ramp → pressure → payoff → late-life 共 6 个阶段完整落地，叙事弧线完整。

对照 renown 路线方法论（bridge → entry → on-ramp → pressure → payoff → late-life → endgame），下一步是 **endgame / final legacy**（60岁+）。这是 patron 路线的最终收束——不是新的一幕，而是最后的尾声（coda）。

P110 closure report 明确建议：**Worth opening P111+** — late-life checkpoints 与 branch markers 已 wired，endgame echo 可读取 `merchant_patron_late_*` 延续叙事。参照 renown P80→P81 与 magnate P100 模式，P111 的目标是为 `merchant_martial_patron` 的 endgame / final legacy 阶段产出 design-first contract：明确 endgame 的核心定位、三个 late-life branch 对应的 endgame 差异、事件结构、flag 接口、表达更新边界，并评估是否真的值得做（GO / NO-GO）。

这不是 endgame implementation stage，而是 bounded 的 design-first contract stage——类似 P80 相对于 P81 的关系。

## 2. Goals

- 为 `merchant_martial_patron` 定义 endgame / final legacy 阶段的 design-first contract
- 基于三个 late-life branch（盟约绑紧 / 自由孤立 / 新盟可持续）设计 endgame 差异
- 定义 endgame 事件的触发条件、结构、flag 接口
- 定义 player-facing expression 更新边界（sample line + identity）
- 为 P112 playable endgame implementation 提供无歧义输入（如果 GO）
- 保持商武一体（patron）风味，与 magnate/renown endgame 明确区分
- 严格评估 endgame 是否值得做（GO / NO-GO），如果 NO-GO 则明确停止点
- Endgame 必须 LIGHTWEIGHT：1 echo event + expression updates only（对齐 renown P80 约束）
- P102–P110 既有 evidence 不退化（本 stage 不改 runtime）

## 3. Non-Goals

- 不直接写 runtime endgame 事件实现
- 不重做 P102–P110 patron bridge/pressure/payoff/late-life wiring
- 不重做 P55/P97–P101 magnate spine
- 不扩成 full Wave 3 mixed-achievement graph 或 habit-led lifetime trace
- 不新增系统或平台层
- 不做 full 5×3 entry×payoff×late-life×endgame identity 矩阵
- 不做 stat threshold gate 验证
- 不做 ordinary origin patron endgame expression（defer）
- 不做 multi-event endgame arc（仅 single echo event）
- 不做 P19 generic endgame 集成
- 不新增 UI 组件
- 不做 full-lifetime `gate:p20` broad rerun

## 4. User Stories

### US-001: Audit Patron Endgame Prerequisites

**Description:** As a maintainer, I want a prerequisite audit for the patron endgame stage so P111 starts from the real gating surfaces and not from assumptions.

**Acceptance Criteria:**

- [ ] 汇总 patron 路线当前已有的 flags、markers、events、expressions（P102–P110）
- [ ] 明确三个 late-life branch 的状态差异（stats + flags + identity + cost label + goal）
- [ ] 明确 endgame 之前已经存在什么、可以复用什么
- [ ] 识别 renown P80 endgame 与 magnate P100 endgame 的可复用模式与 patron 差异
- [ ] 输出 `docs/test-reports/p111-merchant-martial-patron-endgame-prerequisite-audit.md`
- [ ] 本故事不改运行行为
- [ ] Typecheck passes

### US-002: Lock P111 Scope Contract

**Description:** As a planner, I want a scope contract so P111 stays design-first and does not slip into partial implementation.

**Acceptance Criteria:**

- [ ] 明确 P111 只做 gap audit、方向设计、endgame contract、proof shape
- [ ] 明确允许层：文档、contract、targeted proof planning
- [ ] 明确禁止项：runtime wiring、new framework、bulk content wave、multi-event arc
- [ ] 明确 lightweight 约束：最多 1 echo event + expression updates
- [ ] 输出 `docs/test-reports/p111-merchant-martial-patron-endgame-scope-contract.md`
- [ ] Typecheck passes

### US-003: Design Endgame Direction (GO / NO-GO Assessment)

**Description:** As a designer, I want a clear assessment of whether patron endgame is worth doing, and if so, what direction it takes.

**Acceptance Criteria:**

- [ ] 评估 late-life 之后是否还需要 endgame：late-life 是否已提供足够 closure？
- [ ] 如果 GO：定义 endgame 的核心定位——legacy echo？商武终局回响？还是自然收束？
- [ ] 如果 NO-GO：明确停止点（late-life 即为 patron 路线终点）及原因
- [ ] 三个 late-life branch 对应的 endgame 是否需要有差异？还是统一 echo？
- [ ] 明确 endgame 与 late-life 的本质区别（不是"更多内容"，而是"最终收束感"）
- [ ] 结论写入 design document
- [ ] Typecheck passes

### US-004: Design Three Endgame Branches (If GO)

**Description:** As a designer, I want three distinct endgame branches (one per late-life branch) so patron endgame leverages the 3-branch structure for meaningful differentiation — if endgame is worth doing.

**Acceptance Criteria:**

- [ ] 为 Branch A（盟约绑紧）设计 endgame：核心叙事 + 触发条件 + 玩家体验
- [ ] 为 Branch B（自由孤立）设计 endgame：核心叙事 + 触发条件 + 玩家体验
- [ ] 为 Branch C（新盟可持续）设计 endgame：核心叙事 + 触发条件 + 玩家体验
- [ ] 三个分支有实质差异（不是换皮），各自对应不同的 late-life identity
- [ ] 每个分支都有商武一体 patron 风味适配
- [ ] 明确 endgame 是 single echo event 还是 choice event（推荐 single auto echo with 3 variants）
- [ ] 如果 NO-GO，此故事标记为 skipped 并说明原因
- [ ] 结论写入 design document
- [ ] Typecheck passes

### US-005: Define Patron Endgame Contract

**Description:** As a designer, I want an explicit endgame contract so P112 knows exactly what flags, gates, events, and player-facing meanings must be closed — if endgame is worth doing.

**Acceptance Criteria:**

- [ ] 定义 endgame checkpoint `merchant_patron_endgame_echo_done`、所需 flags、对应 gate acceptance
- [ ] 定义 endgame 事件结构（echo 类型，推荐 auto with 3 variants keyed on late-life marker）
- [ ] 定义每个分支的 stat 变化（如果有）、identity marker、表达差异
- [ ] 定义至少 2 个 endgame-specific player-facing signals
- [ ] 明确 endgame 与 late-life、与 magnate/renown endgame 的差异
- [ ] 保留商武一体风味
- [ ] 明确年龄范围（60–65？）
- [ ] 如果 NO-GO，此故事标记为 skipped 并说明原因
- [ ] 合同写入 `docs/PRD/p111-merchant-martial-patron-endgame-contract.md`
- [ ] Typecheck passes

### US-006: Define P112 Validation Shape (If GO)

**Description:** As a maintainer, I want the P112 validation shape fixed in advance so playable endgame work is judged against explicit proof and regression expectations — if endgame is worth doing.

**Acceptance Criteria:**

- [ ] 明确 targeted proof 需要展示哪些链路节点（late-life → endgame → 表达变化）
- [ ] 三个分支都要有核心节点验证
- [ ] 明确 regression tests 至少覆盖哪些断言
- [ ] 明确何种证据算 endgame closed
- [ ] 不要求 full lifetime exhaust
- [ ] P102–P110 + P100/P101 magnate 既有 evidence 不退化的验证边界
- [ ] 如果 NO-GO，此故事标记为 skipped 并说明原因
- [ ] 保存 validation shape 文档
- [ ] Typecheck passes

### US-007: Produce P111 Closure Report

**Description:** As a maintainer, I want a closure report that locks the patron endgame design-first contract and either hands off a bounded implementation target to P112 or explicitly stops the patron route at late-life.

**Acceptance Criteria:**

- [ ] 输出 `docs/test-reports/p111-merchant-martial-patron-endgame-closure-report.md`
- [ ] 汇总 audit、scope、branch design、contract、validation shape
- [ ] 明确 GO/NO-GO for P112 playable endgame with rationale
- [ ] 列出更大 patron-expansion 项的 defer
- [ ] 本 stage 零运行时代码改动
- [ ] Typecheck passes

## 5. Success Criteria

- Patron endgame 方向有明确 contract 或明确 NO-GO 停止点
- 若 GO：P112 可无歧义开工（event spec + flags + expression + validation shape）
- 商武一体风味与 magnate/renown endgame 明确区分
- P102–P110 既有 evidence 未退化（docs-only stage）
- Typecheck passes

## 6. Dependencies / Context

- P110 closure: `docs/test-reports/p110-merchant-martial-patron-late-life-closure-report.md`
- P109 late-life contract: `docs/PRD/p109-merchant-martial-patron-late-life-contract.md`
- Renown endgame precedent: `docs/PRD/p80-wuxia-renown-endgame-design-first.md`
- Magnate endgame precedent: `docs/PRD/p100-wuxia-merchant-magnate-native-endgame-echo-sample.md`
- North Star: `docs/designs/p25-lifetime-simulation-north-star.md` §8

## 7. Open Questions

- Endgame 是否应完全无 stat 变化（对齐 renown P81 lightweight 约束）？
- Ordinary origin patron endgame expression 是否纳入 P112 bonus（默认 defer）
- P102 chain proof 更新范围：仅 endgame 节点 vs 全链重跑
