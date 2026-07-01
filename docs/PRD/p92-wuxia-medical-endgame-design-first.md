# PRD: P92 Wuxia Medical Endgame Design-First Contract

> **Derived from:** `docs/test-reports/p91-medical-late-life-closure-report.md`, `docs/PRD/p91-wuxia-medical-late-life-playable-implementation.md`, `docs/designs/p25-lifetime-simulation-north-star.md`
> **Stage slug:** `p92-wuxia-medical-endgame-design-first`
> **Stage type:** bounded design-first contract stage for medical endgame / final legacy

## 1. Introduction

P91 已完成 `medical_sage_healer`（一代名医）路线的 late-life runtime 实现：6 个分支（2 variants × 3 choices）各有不同的 stat、identity、表达。medical 路线从 bridge → entry → on-ramp → pressure → payoff → late-life 共 6 个阶段完整落地，叙事弧线完整。

对照 medical 路线方法论（bridge → entry → on-ramp → pressure → payoff → late-life → endgame），下一步是 **endgame / final legacy**（60岁+）。这是 medical 路线的最终收束——不是新的一幕，而是最后的尾声（coda）。

P91 closure report 明确建议：**GO for P92 medical endgame design-first stage**。核心条件：endgame 必须是轻量级的（1 echo event + expression updates only），必须有明确的 contract，不能 scope creep。

P92 的目标是为 `medical_sage_healer` 的 endgame / final legacy 阶段产出 design-first contract：明确 endgame 的核心定位（是 life review？legacy echo？还是自然收束？）、6 个 late-life branch 对应的 endgame 差异、事件结构、flag 接口、表达更新边界，并评估是否真的值得做（GO / NO-GO）——如果 NO-GO，则明确 medical 路线在 late-life 处收束即可。

这不是 endgame implementation stage，而是 bounded 的 design-first contract stage——类似 P90 相对于 P91 的关系，以及 P80 相对于 P81 的关系。

## 2. Goals

- 为 `medical_sage_healer` 定义 endgame / final legacy 阶段的 design-first contract
- 基于 6 个 late-life branch（Comp-A/B/C + Prag-A/B/C）设计 endgame 差异
- 定义 endgame 事件的触发条件、结构、flag 接口
- 定义 player-facing expression 更新边界（sample line + ordinary origin）
- 为 P93 playable endgame implementation 提供无歧义输入（如果 GO）
- 保持 tavern-born medical healer 风味，不做成 generic endgame
- 严格评估 endgame 是否值得做（GO / NO-GO），如果 NO-GO 则明确停止点
- Endgame 必须 LIGHTWEIGHT：1 echo event + expression updates only

## 3. Non-Goals

- 不直接写 runtime endgame 事件实现
- 不做第二条 medical seed（plague hero / poison path）
- 不扩成 full medical route 全生命周期规划
- 不新增系统或平台层
- 不扩展到其他出身（仅 tavern_hand origin）
- 不做 stat threshold gate 实现
- 不做第二条成就线（其他 Wave 1 成就）
- 不做巅峰/混合成就（Wave 2/3）
- 不做 multi-event endgame arc（仅 single echo event）
- 不新增 UI 组件
- 不做 stat 变化（endgame 是记忆，不是力量）
- 不做 P19 generic endgame 集成
- 不做 full lifetime exhaust 测试

## 4. User Stories

### US-001: Audit Medical Endgame Prerequisites
**Description:** As a maintainer, I want a prerequisite audit for the medical endgame stage so P92 starts from the real gating surfaces and not from assumptions.

**Acceptance Criteria:**
- [ ] 汇总 medical 路线当前已有的 flags、markers、events、expressions（bridge + entry + on-ramp + pressure + payoff + late-life）
- [ ] 明确 6 个 late-life branch 的状态差异（stats + flags + identity）
- [ ] 明确 endgame 之前已经存在什么、可以复用什么
- [ ] 识别现有 endgame / echo 系统（P19 endgame echo、P80/P81 renown endgame）的复用可能性
- [ ] 输出 `docs/test-reports/p92-medical-endgame-prerequisite-audit.md`
- [ ] 本故事不改运行行为

### US-002: Lock P92 Scope Contract
**Description:** As a planner, I want a scope contract so P92 stays design-first and does not slip into partial implementation.

**Acceptance Criteria:**
- [ ] 明确 P92 只做 gap audit、方向设计、endgame contract、proof shape
- [ ] 明确允许层：文档、contract、targeted proof planning
- [ ] 明确禁止项：runtime wiring、new framework、bulk content wave、第二条路线、multi-event arc
- [ ] 明确 lightweight 约束：最多 1 echo event + expression updates
- [ ] 输出 `docs/test-reports/p92-medical-endgame-scope-contract.md`

### US-003: Design Endgame Direction (GO / NO-GO Assessment)
**Description:** As a designer, I want a clear assessment of whether medical endgame is worth doing, and if so, what direction it takes.

**Acceptance Criteria:**
- [ ] 评估 late-life 之后是否还需要 endgame：late-life 是否已提供足够 closure？
- [ ] 如果 GO：定义 endgame 的核心定位——是 life review echo？legacy finalization？还是自然死亡收束？
- [ ] 如果 NO-GO：明确停止点（late-life 即为 medical 路线终点）及原因
- [ ] 6 个 late-life branch 对应的 endgame 是否需要有差异？还是统一 echo？
- [ ] 明确 endgame 与 late-life 的本质区别（不是"更多内容"，而是"最终收束感"）
- [ ] 结论写入 design document

### US-004: Design Six Endgame Branches (If GO)
**Description:** As a designer, I want six distinct endgame branches (one per late-life branch) so medical endgame leverages the 6-branch structure for meaningful differentiation — if endgame is worth doing.

**Acceptance Criteria:**
- [ ] 为 Compassionate A（最后仁心 / 燃尽自己）设计 endgame：核心叙事 + 触发条件 + 玩家体验
- [ ] 为 Compassionate B（从容自在 / 颐养天年）设计 endgame：核心叙事 + 触发条件 + 玩家体验
- [ ] 为 Compassionate C（仁心传承 / 桃李满天下）设计 endgame：核心叙事 + 触发条件 + 玩家体验
- [ ] 为 Pragmatic A（人走茶凉 / 失势跌落）设计 endgame：核心叙事 + 触发条件 + 玩家体验
- [ ] 为 Pragmatic B（逍遥自在 / 云游四方）设计 endgame：核心叙事 + 触发条件 + 玩家体验
- [ ] 为 Pragmatic C（德高望重 / 一代名医）设计 endgame：核心叙事 + 触发条件 + 玩家体验
- [ ] 6 个分支有实质差异（不是换皮），各自对应不同的 late-life identity
- [ ] 每个分支都有 tavern-born medical healer 风味适配
- [ ] 明确 endgame 是 single echo event 还是 choice event（推荐 single auto echo with 6 variants）
- [ ] 如果 NO-GO，此故事标记为 skipped 并说明原因
- [ ] 结论写入 design document

### US-005: Define Medical Endgame Contract
**Description:** As a designer, I want an explicit endgame contract so P93 knows exactly what flags, gates, events, and player-facing meanings must be closed — if endgame is worth doing.

**Acceptance Criteria:**
- [ ] 定义 endgame checkpoint、所需 flags、对应 gate acceptance
- [ ] 定义 endgame 事件结构（echo 类型，推荐 auto with 6 variants）
- [ ] 定义每个分支的 stat 变化（推荐无）、identity marker、表达差异
- [ ] 定义至少 2 个 endgame-specific player-facing signals
- [ ] 明确 endgame 与 late-life、与 generic P19 endgame echo 的差异
- [ ] 保留 tavern-born medical healer 风味
- [ ] 明确年龄范围（60-65？65-70？）
- [ ] 如果 NO-GO，此故事标记为 skipped 并说明原因
- [ ] 合同写入 `docs/PRD/p92-medical-endgame-contract.md`

### US-006: Define P93 Validation Shape (If GO)
**Description:** As a maintainer, I want the P93 validation shape fixed in advance so playable endgame work is judged against explicit proof and regression expectations — if endgame is worth doing.

**Acceptance Criteria:**
- [ ] 明确 targeted proof 需要展示哪些链路节点（late-life → endgame → 表达变化）
- [ ] 6 个分支都要有核心节点验证
- [ ] 明确 regression tests 至少覆盖哪些断言
- [ ] 明确何种证据算 endgame closed
- [ ] 不要求 full lifetime exhaust
- [ ] P83/P84/P85/P87/P89/P91 既有 evidence 不退化的验证边界
- [ ] 如果 NO-GO，此故事标记为 skipped 并说明原因

### US-007: Produce P92 Closure Report
**Description:** As a maintainer, I want a closure report that locks the medical endgame design-first contract and either hands off a bounded implementation target to P93 or explicitly stops the medical route at late-life.

**Acceptance Criteria:**
- [ ] 输出 `docs/test-reports/p92-medical-endgame-closure-report.md`
- [ ] 汇总 prerequisite audit、scope contract、endgame direction assessment、endgame branch design（如果 GO）、endgame contract（如果 GO）、validation shape（如果 GO）
- [ ] 明确与 `P93` 的边界（如果 GO）或明确停止点（如果 NO-GO）
- [ ] 列出仍 defer 的更大 medical-expansion 项
- [ ] 明确 endgame 阶段是否值得进入 implementation（GO / NO-GO）
- [ ] 如果 GO：给出明确的 lightweight 约束
- [ ] 如果 NO-GO：明确 medical 路线在 late-life 处收束，以及为什么这是更好的选择

## 5. Functional Requirements

1. FR-1: P92 必须围绕 `medical_sage_healer` tavern_hand seed 展开。
2. FR-2: P92 必须输出明确的 endgame contract 或显式 NO-GO 决定。
3. FR-3: P92 必须提前锁定 P93 的 proof / regression shape（如果 GO）。
4. FR-4: P92 不得进入 runtime 实现。
5. FR-5: P92 closure 必须足以让 P93 直接承接（如果 GO）。
6. FR-6: Endgame 必须保持 tavern-born medical healer 风味，与 generic endgame 明确区分。
7. FR-7: 6 个 endgame 分支必须有实质差异（对应 6 个 late-life branch）——如果 GO。
8. FR-8: P92 必须评估 endgame 是否值得做（GO / NO-GO），不得默认 GO。
9. FR-9: Endgame 必须 LIGHTWEIGHT（1 echo event + expression updates only）——如果 GO。

## 6. Success Criteria

- P92 产出明确的 GO / NO-GO 决定
- 如果 GO：endgame contract 清晰，P93 可直接承接，范围严格 bounded
- 如果 NO-GO：原因清晰，medical 路线在 late-life 处收束是合理的
- 6 个 late-life branch 的 endgame 差异有定义（如果 GO）
- Tavern-born medical healer 风味贯穿设计
- P83/P84/P85/P87/P89/P91 既有 evidence 不受影响
- Scope 不 creep：始终保持 lightweight 约束

## 7. Dependencies / Context

- P91 closure: `docs/test-reports/p91-medical-late-life-closure-report.md`
- P91 PRD: `docs/PRD/p91-wuxia-medical-late-life-playable-implementation.md`
- P90 late-life contract: `docs/PRD/p90-medical-late-life-contract.md`
- P89 payoff: `docs/test-reports/p89-medical-payoff-closure-report.md`
- P87 pressure: `docs/test-reports/p87-medical-pressure-closure-report.md`
- P85 on-ramp: `docs/test-reports/p85-medical-sage-on-ramp-closure-report.md`
- P83 bridge: `docs/test-reports/p83-medical-sage-bridge-playable-closure-report.md`
- Renown endgame precedent: `docs/PRD/p80-wuxia-renown-endgame-design-first.md`, `docs/PRD/p80-renown-endgame-contract.md`
- P19 endgame echo: `docs/PRD/p19-wuxia-endgame-echo-and-historical-memory-closure.md`
- North Star: `docs/designs/p25-lifetime-simulation-north-star.md`

## 8. Risks And Rollback

### Risks

- **Scope creep risk:** Endgame 容易从"轻量 echo"膨胀成"完整终局章节"
- **Redundancy risk:** Late-life 已经提供很强的 closure，endgame 可能感觉多余
- **6-branch complexity risk:** 6 个分支 = 2× renown endgame 的工作量，设计中可能稀释质量
- **Flavor dilution risk:** Endgame 设计可能丢失 tavern-born healer 风味，变成 generic doctor endgame
- **NO-GO risk:** 如果评估后认为不值得做，P92 本身可能被认为是浪费

### Rollback

- 若评估为 NO-GO，P92 本身产出 NO-GO 决定即为 deliverable，不需要 rollback
- 若 GO 但后续 P93 超出范围，可回退到 P91 late-life-only 状态
- P91 late-life 不受 P92 影响，可独立存活

## 9. Validation Direction

- Design 层：endgame 定位是否清晰？与 late-life 的本质区别是什么？
- Scope 层：是否保持 lightweight？是否 1 event + expression only？
- Flavor 层：tavern-born medical healer 风味是否保持？
- Branch 层：6 个分支是否有实质差异？
- Variant 层：2 个 variant（compassionate vs pragmatic）的 endgame 是否有本质差异？
- GO/NO-GO 层：决定是否有充分依据？
- Continuation 层：如果 GO，P93 contract 是否足够清晰？
