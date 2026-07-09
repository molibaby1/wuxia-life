# PRD: P118 Wuxia Founding Patriarch Endgame Design-First Contract

> **Derived from:** `docs/test-reports/p117-founding-patriarch-late-life-closure-report.md`, `docs/PRD/p116-founding-patriarch-late-life-contract.md`, `docs/test-reports/p116-p117-validation-shape.md`, `agent_docs/p117-wuxia-founding-patriarch-late-life-playable-implementation-discovery-result.md`
> **Stage slug:** `p118-wuxia-founding-patriarch-endgame-design-first`
> **Gaps addressed:** GAP-P117-N01, GAP-P117-N02, GAP-P117-N03
> **Stage type:** bounded design-first contract stage for founding_patriarch endgame / final legacy

## 1. Introduction

P117 已完成 `founding_patriarch`（开派祖师）路线的 late-life runtime 实现：两条 pressure-driven 分支（门规守成终老 / 盟约续责终老）各有不同的 stat、identity、表达。founding-patriarch 路线从 bridge → on-ramp → pressure → payoff → late-life 共 6 个阶段已 playable，叙事弧线接近完整但 **终局回响尚未设计**。

对照 patron P110→P111 与 renown 路线方法论，下一步是 **endgame / final legacy**（60岁+）。这是 founding-patriarch 路线的最终收束——不是新的一幕，而是最后的尾声（coda）：开派名号、门规/盟约遗产如何收官。

P117 closure report 明确建议：**GO** — late-life checkpoints 与 branch markers 已 wired，`founding_patriarch_endgame_echo_done` 可读取 `founding_patriarch_late_*` 延续叙事。参照 patron P111 与 magnate P100 模式，P118 的目标是为 `founding_patriarch` 的 endgame / final legacy 阶段产出 design-first contract：明确 endgame 核心定位、两个 late-life branch 对应的 endgame 差异、事件结构、flag 接口、表达更新边界，并评估是否真的值得做（GO / NO-GO）。

这不是 endgame implementation stage，而是 bounded 的 design-first contract stage——类似 P111 相对于 P112 的关系。

## 2. Goals

- 为 `founding_patriarch` 定义 endgame / final legacy 阶段的 design-first contract
- 基于两个 late-life branch（门规守成终老 / 盟约续责终老）设计 endgame 差异
- 定义 endgame 事件的触发条件、结构、flag 接口（含 `founding_patriarch_endgame_echo_done`）
- 定义 player-facing expression 更新边界（sample line + identity）
- 评估 sect inheritance handoff 与 life memory/summary 是否纳入 lightweight endgame 边界
- 为 P119 playable endgame implementation 提供无歧义输入（如果 GO）
- 保持开派治理风味（门规/盟约/书斋/山门），与 patron/renown/magnate endgame 明确区分
- 严格评估 endgame 是否值得做（GO / NO-GO），如果 NO-GO 则明确停止点
- Endgame 必须 LIGHTWEIGHT：1 echo event + expression updates only（对齐 renown P80 / patron P111 约束）
- P113/P115/P117 既有 evidence 不退化（本 stage 不改 runtime）

## 3. Non-Goals

- 不直接写 runtime endgame 事件实现
- 不重做 P113/P115/P117 bridge/pressure/payoff/late-life wiring
- 不重做 P102–P112 patron spine 或 P55/P97–P101 magnate spine
- 不扩成 full Wave 2 pinnacle-achievement graph 或 habit-led lifetime trace
- 不新增系统或平台层
- 不做 full 2×3 pressure×payoff×late-life×endgame identity 矩阵
- 不做 stat threshold gate 验证
- 不做 ordinary origin founding-patriarch endgame expression（defer）
- 不做 multi-event endgame arc（仅 single echo event）
- 不做 P19 generic endgame 集成
- 不新增 UI 组件
- 不做 full-lifetime `gate:p20` broad rerun

## 4. User Stories

### US-001: Audit Founding-Patriarch Endgame Prerequisites

**Description:** As a maintainer, I want a prerequisite audit for the founding-patriarch endgame stage so P118 starts from the real gating surfaces and not from assumptions.

**Acceptance Criteria:**

- [ ] 汇总 founding-patriarch 路线当前已有的 flags、markers、events、expressions（P113–P117）
- [ ] 明确两个 late-life branch 的状态差异（stats + flags + identity + cost label + goal）
- [ ] 明确 endgame 之前已经存在什么、可以复用什么
- [ ] 识别 patron P111 endgame 与 renown P80 endgame 的可复用模式与 founding-patriarch 差异
- [ ] 输出 `docs/test-reports/p118-founding-patriarch-endgame-prerequisite-audit.md`
- [ ] 本故事不改运行行为
- [ ] Typecheck passes

### US-002: Lock P118 Scope Contract

**Description:** As a planner, I want a scope contract so P118 stays design-first and does not slip into partial implementation.

**Acceptance Criteria:**

- [ ] 明确 P118 只做 gap audit、方向设计、endgame contract、proof shape
- [ ] 明确允许层：文档、contract、targeted proof planning
- [ ] 明确禁止项：runtime wiring、new framework、bulk content wave、multi-event arc
- [ ] 明确 lightweight 约束：最多 1 echo event + expression updates
- [ ] 输出 `docs/test-reports/p118-founding-patriarch-endgame-scope-contract.md`
- [ ] Typecheck passes

### US-003: Design Endgame Direction (GO / NO-GO Assessment)

**Description:** As a designer, I want a clear assessment of whether founding-patriarch endgame is worth doing, and if so, what direction it takes.

**Acceptance Criteria:**

- [ ] 评估 late-life 之后是否还需要 endgame：late-life 是否已提供足够 closure？
- [ ] 如果 GO：定义 endgame 的核心定位——legacy echo？开派终局回响？山门传承收官？
- [ ] 如果 NO-GO：明确停止点（late-life 即为 founding-patriarch 路线终点）及原因
- [ ] 两个 late-life branch 对应的 endgame 是否需要有差异？还是统一 echo？
- [ ] 明确 endgame 与 late-life 的本质区别（不是"更多内容"，而是"最终收束感"）
- [ ] 结论写入 design document
- [ ] Typecheck passes

### US-004: Design Two Endgame Branches (If GO)

**Description:** As a designer, I want two distinct endgame branches (one per late-life branch) so founding-patriarch endgame leverages the 2-branch structure for meaningful differentiation — if endgame is worth doing.

**Acceptance Criteria:**

- [ ] 为 Branch A（门规守成终老 / `founding_patriarch_late_rule_keeper`）设计 endgame：核心叙事 + 触发条件 + 玩家体验
- [ ] 为 Branch B（盟约续责终老 / `founding_patriarch_late_alliance_bearer`）设计 endgame：核心叙事 + 触发条件 + 玩家体验
- [ ] 两个分支有实质差异（不是换皮），各自对应不同的 late-life identity
- [ ] 每个分支都有开派治理风味适配（门规/盟约/书斋/山门）
- [ ] 明确 endgame 是 single echo event 还是 choice event（推荐 single auto echo with 2 variants）
- [ ] 如果 NO-GO，此故事标记为 skipped 并说明原因
- [ ] 结论写入 design document
- [ ] Typecheck passes

### US-005: Define Founding-Patriarch Endgame Contract

**Description:** As a designer, I want an explicit endgame contract so P119 knows exactly what flags, gates, events, and player-facing meanings must be closed — if endgame is worth doing.

**Acceptance Criteria:**

- [ ] 定义 endgame checkpoint `founding_patriarch_endgame_echo_done`、所需 flags、对应 gate acceptance
- [ ] 定义 endgame 事件结构（echo 类型，推荐 auto with 2 variants keyed on late-life marker）
- [ ] 定义每个分支的 stat 变化（如果有）、identity marker、表达差异
- [ ] 定义至少 2 个 endgame-specific player-facing signals
- [ ] 明确 endgame 与 late-life、与 patron/renown/magnate endgame 的差异
- [ ] 评估 sect inheritance handoff markers 是否纳入 contract（lightweight 边界内）
- [ ] 明确年龄范围（60–65？）
- [ ] 如果 NO-GO，此故事标记为 skipped 并说明原因
- [ ] 合同写入 `docs/PRD/p118-founding-patriarch-endgame-contract.md`
- [ ] Typecheck passes

### US-006: Define P119 Validation Shape (If GO)

**Description:** As a maintainer, I want the P119 validation shape fixed in advance so playable endgame work is judged against explicit proof and regression expectations — if endgame is worth doing.

**Acceptance Criteria:**

- [ ] 明确 targeted proof 需要展示哪些链路节点（late-life → endgame → 表达变化）
- [ ] 两个分支都要有核心节点验证
- [ ] 明确 regression tests 至少覆盖哪些断言
- [ ] 明确何种证据算 endgame closed
- [ ] 不要求 full lifetime exhaust
- [ ] P113/P115/P117 + P37/P102–P110 patron 既有 evidence 不退化的验证边界
- [ ] 如果 NO-GO，此故事标记为 skipped 并说明原因
- [ ] 保存 validation shape 文档
- [ ] Typecheck passes

### US-007: Produce P118 Closure Report

**Description:** As a maintainer, I want a closure report that locks the founding-patriarch endgame design-first contract and either hands off a bounded implementation target to P119 or explicitly stops the route at late-life.

**Acceptance Criteria:**

- [ ] 输出 `docs/test-reports/p118-founding-patriarch-endgame-closure-report.md`
- [ ] 汇总 audit、scope、branch design、contract、validation shape
- [ ] 明确 GO/NO-GO for P119 playable endgame with rationale
- [ ] 列出更大 founding-patriarch-expansion 项的 defer
- [ ] 本 stage 零运行时代码改动
- [ ] Typecheck passes

## 5. Success Criteria

- Founding-patriarch endgame 方向有明确 contract 或明确 NO-GO 停止点
- 若 GO：P119 可无歧义开工（event spec + flags + expression + validation shape）
- 开派治理风味与 patron/renown/magnate endgame 明确区分
- P113/P115/P117 既有 evidence 未退化（docs-only stage）
- Typecheck passes

## 6. Dependencies / Context

- P117 closure: `docs/test-reports/p117-founding-patriarch-late-life-closure-report.md`
- P116 late-life contract: `docs/PRD/p116-founding-patriarch-late-life-contract.md`
- Patron endgame precedent: `docs/PRD/p111-wuxia-merchant-martial-patron-endgame-design-first.md`
- Renown endgame precedent: `docs/PRD/p80-wuxia-renown-endgame-design-first.md`
- Magnate endgame precedent: `docs/PRD/p100-wuxia-merchant-magnate-native-endgame-echo-sample.md`
- North Star: `docs/designs/p25-lifetime-simulation-north-star.md` §3, §8

## 7. Open Questions

- Endgame 是否应完全无 stat 变化（对齐 renown P81 lightweight 约束）？
- Sect inheritance handoff 是否作为 echo 叙事元素 vs 独立 marker 系统？
- Ordinary origin founding-patriarch endgame expression 是否纳入 P119 bonus（默认 defer）
- P113 chain proof 更新范围：仅 endgame 节点 vs 全链重跑
