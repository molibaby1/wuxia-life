# PRD: P80 Wuxia Renown Endgame Design-First Contract

> **Derived from:** `docs/test-reports/p79-renown-late-life-closure-report.md`, `docs/PRD/p79-wuxia-renown-late-life-playable-implementation.md`, `docs/designs/p25-lifetime-simulation-north-star.md`
> **Stage slug:** `p80-wuxia-renown-endgame-design-first`
> **Stage type:** bounded design-first contract stage for renown endgame / final legacy

## 1. Introduction

P79 已完成 `jianghu_renown_sage`（江湖名宿）路线的 late-life runtime 实现：三个分支（油尽灯枯/逍遥自在/传承授业）各有不同的 stat、identity、表达。renown 路线从 bridge → entry → on-ramp → pressure → payoff → late-life 共 6 个阶段完整落地，叙事弧线完整。

对照 renown 路线方法论（bridge → entry → on-ramp → pressure → payoff → late-life → endgame），下一步是 **endgame / final legacy**（60岁+）。这是 renown 路线的最终收束——不是新的一幕，而是最后的尾声（coda）。

P79 closure report 明确建议：**Conditional GO for endgame stage (P80), but only if lightweight**。核心条件：endgame 必须是轻量级的（1 echo event + expression updates only），必须有明确的 contract，不能 scope creep。

P80 的目标是为 `jianghu_renown_sage` 的 endgame / final legacy 阶段产出 design-first contract：明确 endgame 的核心定位（是 life review？legacy echo？还是自然收束？）、三个 late-life branch 对应的 endgame 差异、事件结构、flag 接口、表达更新边界，并评估是否真的值得做（GO / NO-GO）——如果 NO-GO，则明确 renown 路线在 late-life 处收束即可。

这不是 endgame implementation stage，而是 bounded 的 design-first contract stage——类似 P78 相对于 P79 的关系。

## 2. Goals

- 为 `jianghu_renown_sage` 定义 endgame / final legacy 阶段的 design-first contract
- 基于三个 late-life branch（油尽灯枯/逍遥自在/传承授业）设计 endgame 差异
- 定义 endgame 事件的触发条件、结构、flag 接口
- 定义 player-facing expression 更新边界（sample line + ordinary origin）
- 为 P81 playable endgame implementation 提供无歧义输入（如果 GO）
- 保持 tavern-born 风味，不做成 generic endgame
- 严格评估 endgame 是否值得做（GO / NO-GO），如果 NO-GO 则明确停止点
- Endgame 必须 LIGHTWEIGHT：1 echo event + expression updates only

## 3. Non-Goals

- 不直接写 runtime endgame 事件实现
- 不做第二条 renown seed（mentor-bond）
- 不扩成 full renown route 全生命周期规划
- 不新增系统或平台层
- 不扩展到其他出身（仅 tavern_hand origin）
- 不做 stat threshold gate 实现
- 不做第二条成就线（medical_sage_healer）
- 不做巅峰/混合成就（Wave 2/3）
- 不做 multi-event endgame arc（仅 single echo event）
- 不新增 UI 组件

## 4. User Stories

### US-001: Audit Renown Endgame Prerequisites
**Description:** As a maintainer, I want a prerequisite audit for the renown endgame stage so P80 starts from the real gating surfaces and not from assumptions.

**Acceptance Criteria:**
- [ ] 汇总 renown 路线当前已有的 flags、markers、events、expressions（bridge + entry + on-ramp + pressure + payoff + late-life）
- [ ] 明确三个 late-life branch 的状态差异（stats + flags + identity）
- [ ] 明确 endgame 之前已经存在什么、可以复用什么
- [ ] 识别现有 endgame / echo 系统（P19 endgame echo）的复用可能性
- [ ] 输出 `docs/test-reports/p80-renown-endgame-prerequisite-audit.md`
- [ ] 本故事不改运行行为

### US-002: Lock P80 Scope Contract
**Description:** As a planner, I want a scope contract so P80 stays design-first and does not slip into partial implementation.

**Acceptance Criteria:**
- [ ] 明确 P80 只做 gap audit、方向设计、endgame contract、proof shape
- [ ] 明确允许层：文档、contract、targeted proof planning
- [ ] 明确禁止项：runtime wiring、new framework、bulk content wave、第二条路线、multi-event arc
- [ ] 明确 lightweight 约束：最多 1 echo event + expression updates
- [ ] 输出 `docs/test-reports/p80-renown-endgame-scope-contract.md`

### US-003: Design Endgame Direction (GO / NO-GO Assessment)
**Description:** As a designer, I want a clear assessment of whether renown endgame is worth doing, and if so, what direction it takes.

**Acceptance Criteria:**
- [ ] 评估 late-life 之后是否还需要 endgame：late-life 是否已提供足够 closure？
- [ ] 如果 GO：定义 endgame 的核心定位——是 life review echo？legacy finalization？还是自然死亡收束？
- [ ] 如果 NO-GO：明确停止点（late-life 即为 renown 路线终点）及原因
- [ ] 三个 late-life branch 对应的 endgame 是否需要有差异？还是统一 echo？
- [ ] 明确 endgame 与 late-life 的本质区别（不是"更多内容"，而是"最终收束感"）
- [ ] 结论写入 design document

### US-004: Design Three Endgame Branches (If GO)
**Description:** As a designer, I want three distinct endgame branches (one per late-life branch) so renown endgame leverages the 3-branch structure for meaningful differentiation — if endgame is worth doing.

**Acceptance Criteria:**
- [ ] 为 Branch A（油尽灯枯）设计 endgame：核心叙事 + 触发条件 + 玩家体验
- [ ] 为 Branch B（逍遥自在）设计 endgame：核心叙事 + 触发条件 + 玩家体验
- [ ] 为 Branch C（传承授业）设计 endgame：核心叙事 + 触发条件 + 玩家体验
- [ ] 三个分支有实质差异（不是换皮），各自对应不同的 late-life identity
- [ ] 每个分支都有 tavern-born 风味适配
- [ ] 明确 endgame 是 single echo event 还是 choice event（推荐 single auto echo with 3 variants）
- [ ] 如果 NO-GO，此故事标记为 skipped 并说明原因
- [ ] 结论写入 design document

### US-005: Define Renown Endgame Contract
**Description:** As a designer, I want an explicit endgame contract so P81 knows exactly what flags, gates, events, and player-facing meanings must be closed — if endgame is worth doing.

**Acceptance Criteria:**
- [ ] 定义 endgame checkpoint、所需 flags、对应 gate acceptance
- [ ] 定义 endgame 事件结构（echo 类型，推荐 auto with 3 variants）
- [ ] 定义每个分支的 stat 变化（如果有）、identity marker、表达差异
- [ ] 定义至少 2 个 endgame-specific player-facing signals
- [ ] 明确 endgame 与 late-life、与 generic P19 endgame echo 的差异
- [ ] 保留 tavern-born 风味
- [ ] 明确年龄范围（60-65？65-70？）
- [ ] 如果 NO-GO，此故事标记为 skipped 并说明原因
- [ ] 合同写入 `docs/PRD/p80-renown-endgame-contract.md`

### US-006: Define P81 Validation Shape (If GO)
**Description:** As a maintainer, I want the P81 validation shape fixed in advance so playable endgame work is judged against explicit proof and regression expectations — if endgame is worth doing.

**Acceptance Criteria:**
- [ ] 明确 targeted proof 需要展示哪些链路节点（late-life → endgame → 表达变化）
- [ ] 三个分支都要有核心节点验证
- [ ] 明确 regression tests 至少覆盖哪些断言
- [ ] 明确何种证据算 endgame closed
- [ ] 不要求 full lifetime exhaust
- [ ] P71/P72/P73/P75/P77/P79 既有 evidence 不退化的验证边界
- [ ] 如果 NO-GO，此故事标记为 skipped 并说明原因

### US-007: Produce P80 Closure Report
**Description:** As a maintainer, I want a closure report that locks the renown endgame design-first contract and either hands off a bounded implementation target to P81 or explicitly stops the renown route at late-life.

**Acceptance Criteria:**
- [ ] 输出 `docs/test-reports/p80-renown-endgame-closure-report.md`
- [ ] 汇总 prerequisite audit、scope contract、endgame direction assessment、endgame branch design（如果 GO）、endgame contract（如果 GO）、validation shape（如果 GO）
- [ ] 明确与 `P81` 的边界（如果 GO）或明确停止点（如果 NO-GO）
- [ ] 列出仍 defer 的更大 renown-expansion 项
- [ ] 明确 endgame 阶段是否值得进入 implementation（GO / NO-GO）
- [ ] 如果 GO：给出明确的 lightweight 约束
- [ ] 如果 NO-GO：明确 renown 路线在 late-life 处收束，以及为什么这是更好的选择

## 5. Functional Requirements

1. FR-1: P80 必须围绕 `jianghu_renown_sage` tavern_hand seed 展开。
2. FR-2: P80 必须输出明确的 endgame contract 或显式 NO-GO 决定。
3. FR-3: P80 必须提前锁定 P81 的 proof / regression shape（如果 GO）。
4. FR-4: P80 不得进入 runtime 实现。
5. FR-5: P80 closure 必须足以让 P81 直接承接（如果 GO）。
6. FR-6: Endgame 必须保持 tavern-born renown 风味，与 generic endgame 明确区分。
7. FR-7: 三个 endgame 分支必须有实质差异（对应三个 late-life branch）——如果 GO。
8. FR-8: P80 必须评估 endgame 是否值得做（GO / NO-GO），不得默认 GO。
9. FR-9: Endgame 必须 LIGHTWEIGHT（1 echo event + expression updates only）——如果 GO。

## 6. Success Criteria

- P80 产出明确的 GO / NO-GO 决定
- 如果 GO：endgame contract 清晰，P81 可直接承接，范围严格 bounded
- 如果 NO-GO：原因清晰，renown 路线在 late-life 处收束是合理的
- 三个 late-life branch 的 endgame 差异有定义（如果 GO）
- Tavern-born 风味贯穿设计
- P71/P72/P73/P75/P77/P79 既有 evidence 不受影响
- Scope 不 creep：始终保持 lightweight 约束

## 7. Dependencies / Context

- P79 closure: `docs/test-reports/p79-renown-late-life-closure-report.md`
- P79 PRD: `docs/PRD/p79-wuxia-renown-late-life-playable-implementation.md`
- P78 late-life contract: `docs/PRD/p78-renown-late-life-contract.md`
- P77 payoff: `docs/test-reports/p77-renown-payoff-closure-report.md`
- P75 pressure: `docs/test-reports/p75-renown-pressure-closure-report.md`
- P73 on-ramp: `docs/test-reports/p73-renown-on-ramp-closure-report.md`
- P71 bridge: `docs/test-reports/p71-selected-next-route-bridge-closure-report.md`
- P19 endgame echo: `docs/PRD/p19-wuxia-endgame-echo-and-historical-memory-closure.md`
- North Star: `docs/designs/p25-lifetime-simulation-north-star.md`

## 8. Risks And Rollback

### Risks

- **Scope creep risk:** Endgame 容易从"轻量 echo"膨胀成"完整终局章节"
- **Redundancy risk:** Late-life 已经提供很强的 closure，endgame 可能感觉多余
- **Flavor dilution risk:** Endgame 设计可能丢失 tavern-born 风味，变成 generic jianghu endgame
- **NO-GO risk:** 如果评估后认为不值得做，P80 本身可能被认为是浪费

### Rollback

- 若评估为 NO-GO，P80 本身产出 NO-GO 决定即为 deliverable，不需要 rollback
- 若 GO 但后续 P81 超出范围，可回退到 P79 late-life-only 状态
- P79 late-life 不受 P80 影响，可独立存活

## 9. Validation Direction

- Design 层：endgame 定位是否清晰？与 late-life 的本质区别是什么？
- Scope 层：是否保持 lightweight？是否 1 event + expression only？
- Flavor 层：tavern-born renown 风味是否保持？
- Branch 层：三个分支是否有实质差异？
- GO/NO-GO 层：决定是否有充分依据？
- Continuation 层：如果 GO，P81 contract 是否足够清晰？
