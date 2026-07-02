# PRD: P112 Wuxia Merchant Martial Patron Endgame Playable Implementation

> **Derived from:** `docs/test-reports/p111-merchant-martial-patron-endgame-closure-report.md`, `docs/PRD/p111-merchant-martial-patron-endgame-contract.md`, `docs/test-reports/p111-p112-validation-shape.md`, `agent_docs/p111-wuxia-merchant-martial-patron-endgame-design-first-discovery-result.md`
> **Stage slug:** `p112-wuxia-merchant-martial-patron-endgame-playable-implementation`
> **Gaps addressed:** GAP-P111-N01
> **Stage type:** bounded endgame implementation stage for merchant_martial_patron (lightweight)

## 1. Introduction

P111 已完成 `merchant_martial_patron`（商武一体金主）路线的 endgame design-first contract：选定商武终局回响（single auto echo × 3 variants），定义事件规格、flag 接口、表达更新、验证形状。Closure report 给出 **GO (CONDITIONAL_GO — lightweight only)**。

对照 renown P80→P81 与 patron P109→P110 方法论，P112 的目标是把 P111 contract 落地成可玩实现：spine event wiring + expression updates + targeted proof + regression tests。

这不是 full patron content wave，而是严格按 P111 contract 落地的 bounded implementation 阶段。

**Lightweight constraint (非 negotiable):** 1 auto echo event + expression updates only, no stat changes.

## 2. Goals

- 按 P111 contract 落地 `merchant_martial_patron` 的 endgame / final legacy 阶段 runtime 实现
- 让 patron 路线从「商武定型的晚年」推进到「商武终局回响」——完成整条路线的叙事闭合
- 复用现有事件系统与 sample-lines-spine 架构，不建新系统
- 保持商武一体风味，与 magnate/renown endgame 明确区分
- Strict lightweight：1 auto echo event + expression updates，无 stat 变化
- P102–P110 + P100/P101 magnate 既有 evidence 不退化

## 3. Non-Goals

- 不做 multi-event endgame arc（仅 single echo event）
- 不新建 route framework 或事件调度器
- 不重做 P110 late-life 或 P108 payoff wiring
- 不做 full 5×3 entry×payoff×late-life×endgame identity 矩阵
- 不做 stat threshold gate 实现
- 不做 ordinary origin patron endgame expression（P112 optional bonus / defer）
- 不做 P19 generic endgame 集成
- 不做 full-lifetime `gate:p20` broad rerun
- 不新增 UI 组件
- 不做 stat 变化（endgame 是回响，不是力量）

## 4. User Stories

### US-001: Wire Patron Endgame Echo Event

**Description:** As a developer, I want the patron endgame echo event wired through the existing event system so players on the patron route encounter a final covenant settlement echo with 3 distinct variants keyed on late-life branch.

**Acceptance Criteria:**

- [ ] 在 `sample-lines-spine.json` 中配置 `merchant_patron_endgame_echo_*` auto 事件
- [ ] 触发条件：`merchant_patron_late_life_done` + age 60–65 + 互斥 guard + 排除 orthodox/demonic seed
- [ ] 3 个条件分支 keyed on late-life marker（covenant_bound / isolated_merchant / sustainable_covenant）
- [ ] 各分支设置 `merchant_patron_endgame_echo_done` + `merchant_patron_endgame_identity_done` + 对应 endgame branch marker
- [ ] **No stat changes**
- [ ] 不 unset `merchant_patron_late_life_done`
- [ ] 事件插入于 late-life 事件之后
- [ ] 不引入新的事件框架或调度器
- [ ] P102–P110 既有 evidence 不退化
- [ ] Typecheck passes

### US-002: Add Endgame Expression — Sample Line Core (P0)

**Description:** As a player, I want the patron endgame branch reflected in sample line status so the route feels like a meaningful final covenant settlement.

**Acceptance Criteria:**

- [ ] Cost label: late-life 状态 → endgame 状态（商武终局·担 / 商武终局·孤 / 商武终局·传）
- [ ] Current goal: late-life 状态 → endgame 分支语义 per contract §4.1
- [ ] Expression priority：`endgame_echo_done` > `late_life_done` > `payoff_done` > pressure > on-ramp
- [ ] 至少 2 个 endgame-specific 可读信号（cost label + current goal）
- [ ] 三个分支的表达有实质差异，不是换皮
- [ ] 保持商武一体风味（账房/演武场/盟约/刀）
- [ ] 不新增 UI 组件
- [ ] Typecheck passes

### US-003: Add Endgame Expression — Identity (P0)

**Description:** As a player, I want an endgame identity summary that reflects my late-life-driven endgame branch so the patron arc completes meaningfully.

**Acceptance Criteria:**

- [ ] `merchantAge40Identity()` 在 endgame 完成后返回对应身份文本（endgame branch marker 优先于 late-life branch）
- [ ] Branch A: 盟约碑上的商武金主
- [ ] Branch B: 孤商终局的巨贾
- [ ] Branch C: 新盟传统的金主
- [ ] 覆盖至少 1 native + 1 bridge-origin entry overlay（bonus）
- [ ] 保持商武一体风味
- [ ] Typecheck passes

### US-004: Add Targeted Endgame Proof

**Description:** As a maintainer, I want bounded proof showing endgame event fires, all three branches work, and patron flavor is preserved.

**Acceptance Criteria:**

- [ ] 产出 targeted proof（late-life → endgame → expression changes）
- [ ] 展示 validation shape §2.2 核心节点（pre-endgame state、event fires、checkpoint、branch marker、cost label、goal per branch）
- [ ] 最少 3 条 branch path：A native orthodox / B native martial / C bridge-origin
- [ ] 不要求 full lifetime exhaust
- [ ] 保存为 `docs/test-reports/p112-merchant-martial-patron-endgame-targeted-proof.md`
- [ ] Typecheck passes

### US-005: Add Narrow Regression Coverage

**Description:** As a maintainer, I want narrow tests guarding the patron endgame stage so future edits do not break the endgame milestone.

**Acceptance Criteria:**

- [ ] 新增 `tests/p112MerchantMartialPatronEndgameTests.ts`
- [ ] Group 1: Event wiring（R1–R11 per validation shape §3.1）
- [ ] Group 2: Pre-endgame expression（R12–R13）
- [ ] Group 3: Post-endgame expression per branch（R14–R21）
- [ ] Group 4: Spine ordering（R22–R23）
- [ ] Prior stage regression: P102–P110 + P100/P101 magnate + `guard:sample-lines-baseline`（R24–R31）
- [ ] No stat changes 验证（R11）
- [ ] Typecheck passes

### US-006: Update P102 Chain Proof with Endgame Nodes

**Description:** As a maintainer, I want the P102 patron bridge chain proof extended with endgame nodes so the full patron spine is traceable through endgame.

**Acceptance Criteria:**

- [ ] 更新 `docs/test-reports/p102-merchant-martial-patron-bridge-chain-proof.md` 含 endgame 节点
- [ ] 展示 late-life → endgame → expression 链路
- [ ] 三个 late-life branch 各至少 1 条 endgame path
- [ ] 不破坏既有 P102–P110 chain proof 节点
- [ ] Typecheck passes

### US-007: Produce P112 Closure Report

**Description:** As a maintainer, I want a closure report that locks the patron endgame implementation and confirms whether the patron route is fully closed.

**Acceptance Criteria:**

- [ ] 输出 `docs/test-reports/p112-merchant-martial-patron-endgame-closure-report.md`
- [ ] 汇总 event wiring、expression updates、targeted proof、regression tests 结果
- [ ] 明确 patron 路线是否完全闭合（bridge → entry → on-ramp → pressure → payoff → late-life → endgame）
- [ ] 列出仍 defer 的更大 patron-expansion 项
- [ ] 确认 lightweight 约束是否保持（1 event + expression only, no stat changes）
- [ ] 确认 P102–P110 + P100/P101 无退化
- [ ] 12/12 closure criteria per validation shape §4.1
- [ ] Typecheck passes

## 5. Success Criteria

- Endgame echo event 正确触发（age 60–65，条件正确）
- 三个变体都能正常工作，且有实质差异
- 无 stat 变化（lightweight 合规）
- Cost label + current goal + identity 有 endgame 表达
- 商武一体风味保持一致
- P102–P110 + P100/P101 无退化
- Typecheck 通过
- Targeted proof 产出
- Regression tests 通过
- 12/12 endgame closure criteria met

## 6. Dependencies / Context

- P111 closure: `docs/test-reports/p111-merchant-martial-patron-endgame-closure-report.md`
- P111 endgame contract: `docs/PRD/p111-merchant-martial-patron-endgame-contract.md`
- P111 → P112 validation shape: `docs/test-reports/p111-p112-validation-shape.md`
- P110 late-life: `docs/PRD/p110-wuxia-merchant-martial-patron-late-life-playable-implementation.md`
- P110 closure: `docs/test-reports/p110-merchant-martial-patron-late-life-closure-report.md`
- Renown endgame precedent: `docs/PRD/p81-wuxia-renown-endgame-playable.md`
- North Star: `docs/designs/p25-lifetime-simulation-north-star.md` §8

## 7. Open Questions

- Ordinary origin patron endgame expression 是否作为 P112 bonus 实现（默认 defer）
- P102 chain proof 更新范围：仅 endgame 节点 vs 全链重跑（默认仅 endgame 节点）
