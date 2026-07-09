# PRD: P114 Wuxia Founding Patriarch Midlife Pressure Design-First Contract

> **Derived from:** `docs/PRD/p113-wuxia-founding-patriarch-bridge-narrow-playable.md` (Discovery pass 2026-07-02)
> **Stage slug:** `p114-wuxia-founding-patriarch-midlife-pressure-design-first`
> **Gaps addressed:** GAP-P113-N01
> **Stage type:** bounded design-first contract stage for founding_patriarch pinnacle pressure

## 1. Introduction

P113 closed the **narrow playable bridge** from scholar/faction commitment into `founding_patriarch` checkpoint flags: `founding_patriarch_bridge_entry` (age 32–38) and lightweight `founding_patriarch_payoff_echo` (age 48–52, P93 pattern). P37 lifetime traces and P102–P112 patron spine remain non-regressed.

对照 patron P105→P106 与 renown/medical pressure 方法论，founding-patriarch 路线目前走完了 bridge → on-ramp → payoff echo，但 **payoff 直接从 on-ramp 触发，缺少 midlife pressure 阶段**。开派祖师 pressure 的核心叙事方向尚不明确——「门派延续之责」、「盟约与治学撕裂」、「自立山门 vs 续责开派张力」都是候选，且必须与 renown pressure（人情债）、patron pressure（护商武力负担）、magnate pressure（经营债）明确区分。

P113 closure 明确 defer midlife pressure chain。P114 的目标是为 `founding_patriarch` 的 pressure 阶段产出 design-first contract：明确 pressure 核心叙事方向、触发条件、事件结构、flag 接口、表达更新边界，为 P115 playable pressure implementation 提供无歧义输入。

这不是 pressure implementation stage，而是 bounded 的 design-first contract stage——类似 P105 相对于 P106 的关系。

## 2. Goals

- 为 `founding_patriarch` 定义 pressure 阶段的 design-first contract
- 明确 founding-patriarch pressure 的核心叙事方向（在多个候选中选定一个）
- 定义 pressure 事件的触发条件、结构、flag 接口（覆盖 scholar vs alliance on-ramp 变体优先级）
- 定义 player-facing expression 更新边界（orthodox sample line surfaces）
- 为 P115 playable pressure implementation 提供无歧义输入
- 保持开派祖师（门派延续 + 学者盟约）风味，与 renown/patron/magnate pressure 明确区分

## 3. Non-Goals

- 不直接写 runtime pressure 事件实现
- 不直接做 founding-patriarch late-life / endgame 深化
- 不重做 P113 bridge entry / on-ramp / payoff echo wiring
- 不重做 P37 `founding_patriarch` lifetime trace
- 不重做 P102–P112 patron spine
- 不扩成 full faction empire graph
- 不新增系统或平台层
- 不做 ordinary-origin founding-patriarch bridges（defer P113 bonus）
- 不做 full-lifetime `gate:p20` broad rerun

## 4. User Stories

### US-001: Audit Founding Patriarch Pressure Prerequisites

**Description:** As a maintainer, I want a prerequisite audit for the founding-patriarch pressure stage so P114 starts from the real gating surfaces and not from assumptions.

**Acceptance Criteria:**

- [ ] 汇总 founding-patriarch 路线当前已有的 flags、markers、events、expressions（P113 bridge entry + on-ramp + payoff echo）
- [ ] 明确 pressure 之前已经存在什么、可以复用什么
- [ ] 对照 patron pressure（P105 contract）、renown pressure（P74）、magnate pressure 先例
- [ ] 输出 `docs/test-reports/p114-founding-patriarch-pressure-prerequisite-audit.md`
- [ ] 本故事不改运行行为
- [ ] `npm run typecheck` passes

### US-002: Lock P114 Scope Contract

**Description:** As a planner, I want a scope contract so P114 stays design-first and does not slip into partial implementation.

**Acceptance Criteria:**

- [ ] 明确 P114 只做 gap audit、方向比较、pressure contract、proof shape
- [ ] 明确允许层：文档、contract、targeted proof planning
- [ ] 明确禁止项：runtime wiring、P113 rewrite、patron spine rewrite、payoff redesign、new UI、P37 lifetime reopen
- [ ] 输出 `docs/test-reports/p114-founding-patriarch-pressure-scope-contract.md`
- [ ] `npm run typecheck` passes

### US-003: Compare Founding Patriarch Pressure Directions

**Description:** As a designer, I want bounded pressure-direction options for the founding-patriarch route so P114 chooses the smallest viable pressure shape before implementation.

**Acceptance Criteria:**

- [ ] 至少比较 2 个 pressure 方向候选（如：门派延续之责 / 盟约与治学撕裂 / 自立 vs 续责张力）
- [ ] 每个候选包含：核心叙事、触发条件、玩家选择空间、与 renown/patron/magnate pressure 的区分度
- [ ] 明确推荐方向及放弃方向
- [ ] 推荐必须符合质量优先与小步实施原则
- [ ] 结论写入 comparison 文档
- [ ] `npm run typecheck` passes

### US-004: Define Founding Patriarch Pressure Contract

**Description:** As a designer, I want an explicit pressure contract so P115 knows exactly what flags, gates, events, and player-facing meanings must be closed.

**Acceptance Criteria:**

- [ ] 定义 pressure checkpoint flag（如 `founding_patriarch_midlife_pressure_done`）
- [ ] 定义 1 个核心 choice 事件规格（age band、gate、变体分支）
- [ ] 定义 ≥2 个 player-facing 表达信号（cost label + current goal / identity）
- [ ] 定义 payoff echo gate 调整（on-ramp → pressure → payoff 顺序）
- [ ] 定义 scholar vs alliance on-ramp 变体优先级
- [ ] 输出 `docs/PRD/p114-founding-patriarch-pressure-contract.md`
- [ ] `npm run typecheck` passes

### US-005: Define P115 Validation Shape

**Description:** As a maintainer, I want a validation shape so P115 implementation has locked proof nodes and regression boundaries before coding.

**Acceptance Criteria:**

- [ ] 定义 proof chain nodes（pre-pressure → event fires → checkpoint → expression）
- [ ] 定义 regression boundaries（P37 parity + P102–P112 patron + P113 + guard:sample-lines-baseline）
- [ ] 定义 closure criteria（≥10 条可验收项）
- [ ] 输出 `docs/test-reports/p114-p115-validation-shape.md`
- [ ] `npm run typecheck` passes

### US-006: Produce P114 Closure Report

**Description:** As a maintainer, I want a closure report stating exactly what the founding-patriarch pressure design provides and whether P115 implementation is justified.

**Acceptance Criteria:**

- [ ] 输出 `docs/test-reports/p114-founding-patriarch-pressure-closure-report.md`
- [ ] 汇总 audit、scope、direction comparison、contract、validation shape
- [ ] 明确 P115 边界与 deferred 项
- [ ] 给出 GO / NO-GO for pressure implementation
- [ ] `npm run typecheck` passes

## 5. Success Criteria

- Founding-patriarch pressure direction selected with evidence
- Pressure contract unambiguous for P115
- P113 + P37 + P102–P112 no regressions (design-only stage)
- Validation shape locks P115 proof + regression
- Closure report with GO for implementation

## 6. Dependencies / Context

- P113 closure: `docs/test-reports/p113-founding-patriarch-bridge-closure-report.md`
- P113 scope: `docs/test-reports/p113-founding-patriarch-bridge-scope-contract.md`
- P105 pressure precedent: `docs/PRD/p105-wuxia-merchant-martial-patron-pressure-design-first.md`
- P37 pinnacle trace: `docs/test-reports/p37-pinnacle-founding-patriarch-lifetime-trace.md`
- North Star: `docs/designs/p25-lifetime-simulation-north-star.md` §8

## 7. Open Questions

- Stat threshold gates at pressure — default optional defer (P105 pattern)
- Mutual-exclusion with active renown bridge during pressure — resolve in scope contract (US-002)
