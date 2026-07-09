# PRD: P119 Wuxia Founding Patriarch Endgame Playable Implementation

> **Derived from:** `docs/test-reports/p118-founding-patriarch-endgame-closure-report.md`, `docs/PRD/p118-founding-patriarch-endgame-contract.md`, `docs/test-reports/p118-p119-validation-shape.md`, `agent_docs/p118-wuxia-founding-patriarch-endgame-design-first-discovery-result.md`
> **Stage slug:** `p119-wuxia-founding-patriarch-endgame-playable-implementation`
> **Gaps addressed:** GAP-P118-N01, GAP-P118-N02, GAP-P118-N03, GAP-P118-N04, GAP-P118-N05, GAP-P118-N06, GAP-P118-N07
> **Stage type:** bounded endgame implementation stage for founding_patriarch (lightweight)

## 1. Introduction

P118 已完成 `founding_patriarch`（开派祖师）路线的 endgame design-first contract：选定开派终局回响（single auto echo × 2 variants），定义事件规格、flag 接口、表达更新、验证形状。Closure report 给出 **GO (CONDITIONAL_GO — lightweight only)**。

对照 patron P111→P112 与 renown P80→P81 方法论，P119 的目标是把 P118 contract 落地成可玩实现：spine event wiring + expression updates + targeted proof + regression tests。

这不是 full founding-patriarch content wave，而是严格按 P118 contract 落地的 bounded implementation 阶段。

**Lightweight constraint (非 negotiable):** 1 auto echo event + expression updates only, no stat changes.

## 2. Goals

- 按 P118 contract 落地 `founding_patriarch` 的 endgame / final legacy 阶段 runtime 实现
- 让 founding-patriarch 路线从「治理次序的晚年」推进到「开派终局回响」——完成整条路线的叙事闭合
- 复用现有事件系统与 sample-lines-spine 架构，不建新系统
- 保持开派治理风味（门规/盟约/书斋/山门），与 patron/renown/magnate endgame 明确区分
- Strict lightweight：1 auto echo event + 2 variants + expression updates，无 stat 变化
- P113/P115/P117 + P37/P102–P110 patron 既有 evidence 不退化

## 3. Non-Goals

- 不做 multi-event endgame arc（仅 single echo event）
- 不新建 route framework 或事件调度器
- 不重做 P117 late-life 或 P113 payoff wiring
- 不做 full 2×3 pressure×payoff×late-life×endgame identity 矩阵
- 不做 stat threshold gate 实现
- 不做 ordinary origin founding-patriarch endgame expression（P119 optional bonus / defer）
- 不做 P19 generic endgame 集成
- 不做 full-lifetime `gate:p20` broad rerun
- 不新增 UI 组件
- 不做 stat 变化（endgame 是回响，不是力量）
- 不做 sect inheritance handoff marker 系统（narrative element only per contract）

## 4. User Stories

### US-001: Wire Founding-Patriarch Endgame Echo Event

**Description:** As a developer, I want the founding-patriarch endgame echo event wired through the existing event system so players on the route encounter a final founding legacy settlement echo with 2 distinct variants keyed on late-life branch.

**Acceptance Criteria:**

- [ ] 在 `sample-lines-spine.json` 中配置 `founding_patriarch_endgame_echo_*` auto 事件
- [ ] 触发条件：`founding_patriarch_late_life_done` + age 60–65 + 互斥 guard + orthodox seed + 排除 demonic/merchant seed
- [ ] 2 个条件分支 keyed on late-life marker（`founding_patriarch_late_rule_keeper` / `founding_patriarch_late_alliance_bearer`）
- [ ] 各分支设置 `founding_patriarch_endgame_echo_done` + `founding_patriarch_endgame_identity_done` + 对应 endgame branch marker
- [ ] **No stat changes**
- [ ] 不 unset `founding_patriarch_late_life_done`
- [ ] 事件插入于 late-life 事件之后
- [ ] 不引入新的事件框架或调度器
- [ ] P113/P115/P117 既有 evidence 不退化
- [ ] Typecheck passes

### US-002: Add Endgame Expression — Sample Line Core (P0)

**Description:** As a player, I want the founding-patriarch endgame branch reflected in sample line status so the route feels like a meaningful final founding legacy settlement.

**Acceptance Criteria:**

- [ ] Cost label: late-life 状态 → endgame 状态（开派终局·规 / 开派终局·盟）
- [ ] Current goal: late-life 状态 → endgame 分支语义 per contract §4.1
- [ ] Expression priority：`endgame_echo_done` > `late_life_done` > `payoff_done` > pressure > on-ramp
- [ ] 至少 2 个 endgame-specific 可读信号（cost label + current goal）
- [ ] 两个分支的表达有实质差异，不是换皮
- [ ] 保持开派治理风味（书斋/门规碑/山门/盟约）
- [ ] 不新增 UI 组件
- [ ] Typecheck passes

### US-003: Add Endgame Expression — Identity (P0)

**Description:** As a player, I want an endgame identity summary that reflects my late-life-driven endgame branch so the founding-patriarch arc completes meaningfully.

**Acceptance Criteria:**

- [ ] `orthodoxAge40Identity()` 在 endgame 完成后返回对应身份文本（endgame branch marker 优先于 late-life branch）
- [ ] Branch A (rule_echo): 门规碑上的开宗祖师
- [ ] Branch B (alliance_echo): 盟约碑上的开宗祖师
- [ ] 覆盖至少 1 on-ramp variant 叠加 endgame branch（bonus）
- [ ] 保持开派治理风味
- [ ] Typecheck passes

### US-004: Add Targeted Endgame Proof

**Description:** As a maintainer, I want bounded proof showing endgame event fires, both branches work, and founding-patriarch flavor is preserved.

**Acceptance Criteria:**

- [ ] 产出 targeted proof（late-life → endgame → expression changes）
- [ ] 展示 validation shape §2.2 核心节点（pre-endgame state、event fires、checkpoint、branch marker、cost label、goal per branch）
- [ ] 最少 2 条 branch path：A rule_keeper / B alliance_bearer
- [ ] 至少 1 条 on-ramp variant 叠加 endgame branch（bonus）
- [ ] 不要求 full lifetime exhaust
- [ ] 保存为 `docs/test-reports/p119-founding-patriarch-endgame-targeted-proof.md`
- [ ] Typecheck passes

### US-005: Add Narrow Regression Coverage

**Description:** As a maintainer, I want narrow tests guarding the founding-patriarch endgame stage so future edits do not break the endgame milestone.

**Acceptance Criteria:**

- [ ] 新增 `tests/p119FoundingPatriarchEndgameTests.ts`
- [ ] Group 1: Event wiring（R1–R11 per validation shape §3.1）
- [ ] Group 2: Pre-endgame expression（R12–R13）
- [ ] Group 3: Post-endgame expression per branch（R14–R20）
- [ ] Group 4: Spine ordering（R21–R22）
- [ ] Prior stage regression: P113/P115/P117 + P37 + P102–P110 patron + `guard:sample-lines-baseline`（R23–R29）
- [ ] No stat changes 验证（R11）
- [ ] Typecheck passes

### US-006: Update P113 Chain Proof with Endgame Nodes

**Description:** As a maintainer, I want the P113 founding-patriarch bridge chain proof extended with endgame nodes so the full founding-patriarch spine is traceable through endgame.

**Acceptance Criteria:**

- [ ] 更新 `docs/test-reports/p113-founding-patriarch-bridge-chain-proof.md` 含 endgame 节点
- [ ] 展示 late-life → endgame → expression 链路
- [ ] 两个 late-life branch 各至少 1 条 endgame path
- [ ] 不破坏既有 P113–P117 chain proof 节点
- [ ] Typecheck passes

### US-007: Produce P119 Closure Report

**Description:** As a maintainer, I want a closure report that locks the founding-patriarch endgame implementation and confirms whether the founding-patriarch route is fully closed.

**Acceptance Criteria:**

- [ ] 输出 `docs/test-reports/p119-founding-patriarch-endgame-closure-report.md`
- [ ] 汇总 event wiring、expression updates、targeted proof、regression tests 结果
- [ ] 明确 founding-patriarch 路线是否完全闭合（bridge → on-ramp → pressure → payoff → late-life → endgame）
- [ ] 列出仍 defer 的更大 founding-patriarch-expansion 项
- [ ] 确认 lightweight 约束是否保持（1 event + expression only, no stat changes）
- [ ] 确认 P113/P115/P117 + P37/P102–P110 无退化
- [ ] 12/12 closure criteria per validation shape §4.1
- [ ] Typecheck passes

## 5. Success Criteria

- Endgame echo event 正确触发（age 60–65，条件正确）
- 两个变体都能正常工作，且有实质差异
- 无 stat 变化（lightweight 合规）
- Cost label + current goal + identity 有 endgame 表达
- 开派治理风味保持一致
- P113/P115/P117 + P37/P102–P110 无退化
- Typecheck 通过
- Targeted proof 产出
- Regression tests 通过
- 12/12 endgame closure criteria met

## 6. Dependencies / Context

- P118 closure: `docs/test-reports/p118-founding-patriarch-endgame-closure-report.md`
- P118 endgame contract: `docs/PRD/p118-founding-patriarch-endgame-contract.md`
- P118 → P119 validation shape: `docs/test-reports/p118-p119-validation-shape.md`
- P117 late-life: `docs/PRD/p117-wuxia-founding-patriarch-late-life-playable-implementation.md`
- P117 closure: `docs/test-reports/p117-founding-patriarch-late-life-closure-report.md`
- Patron endgame precedent: `docs/PRD/p112-wuxia-merchant-martial-patron-endgame-playable-implementation.md`
- Renown endgame precedent: `docs/PRD/p81-wuxia-renown-endgame-playable.md`
- North Star: `docs/designs/p25-lifetime-simulation-north-star.md` §8

## 7. Open Questions

- Ordinary origin founding-patriarch endgame expression 是否作为 P119 bonus 实现（默认 defer）
- P113 chain proof 更新范围：仅 endgame 节点 vs 全链重跑（默认仅 endgame 节点）
- Single spine event with 2 branches vs 2 spine events mirroring P117 late-life pattern（默认 either per contract §9.1）
