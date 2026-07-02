# PRD: P110 Wuxia Merchant Martial Patron Late-Life Playable Implementation

> **Derived from:** `docs/test-reports/p109-merchant-martial-patron-late-life-closure-report.md`, `docs/PRD/p109-merchant-martial-patron-late-life-contract.md`, `docs/test-reports/p109-p110-validation-shape.md`, `agent_docs/p109-wuxia-merchant-martial-patron-late-life-design-first-discovery-result.md`
> **Stage slug:** `p110-wuxia-merchant-martial-patron-late-life-playable-implementation`
> **Gaps addressed:** GAP-P109-N01
> **Stage type:** bounded late-life implementation stage for merchant_martial_patron

## 1. Introduction

P109 已完成 `merchant_martial_patron`（商武一体金主）路线的 late-life design-first contract：选定了 auto × 3 branches 结构（盟约绑紧 / 自由孤立 / 新盟可持续），定义了事件规格、表达更新、验证形状。

对照 renown P78→P79 与 medical P90→P91 方法论，patron 路线目前走完了 bridge → entry/on-ramp → pressure → payoff，但 **late-life 阶段仅有 contract、尚无 runtime**。P110 的目标是把 P109 contract 落地成可玩实现：spine event wiring + expression updates + targeted proof + regression tests。

这不是 full patron content wave，而是严格按 P109 contract 落地的 bounded implementation 阶段。

## 2. Goals

- 按 P109 contract 落地 `merchant_martial_patron` 的 late-life 阶段 runtime 实现
- 让 patron 路线从「商武撕裂之解」推进到「商武定型的晚年」
- 复用现有事件系统与 sample-lines-spine 架构，不建新系统
- 保持商武一体风味，与 magnate/renown late-life 明确区分
- 为后续 endgame echo 阶段预留 flag 接口
- P102–P108 + P100/P101 magnate 既有 evidence 不退化

## 3. Non-Goals

- 不做 patron endgame echo / final legacy（P111+）
- 不新建 route framework 或事件调度器
- 不重做 P108 payoff event 或 expression
- 不重做 P106 pressure / P102–P104 bridge wiring
- 不做 full 5×3 entry×payoff×late-life identity 矩阵（P110 minimum: 1 native + 1 bridge per branch）
- 不做 stat threshold gate 实现（optional enhancement，defer）
- 不做 ordinary origin patron late-life expression（P110 bonus / defer）
- 不做 full-lifetime `gate:p20` broad rerun
- 不新增 UI 组件

## 4. User Stories

### US-001: Wire Patron Late-Life Spine Event

**Description:** As a developer, I want the patron late-life event wired through the existing event system so players on the patron route encounter a real late-life milestone after payoff.

**Acceptance Criteria:**

- [ ] 在 `sample-lines-spine.json` 中配置 `merchant_patron_late_life` auto 事件（version 1.0.0）
- [ ] 触发条件：`merchant_patron_payoff_done` + age 52–56 + exclusivity guards + `!merchant_patron_late_life_done`
- [ ] 3 个条件分支 keyed on payoff marker（covenant_holder / covenant_breaker / balancer）
- [ ] 各分支设置 `merchant_patron_late_life_done` + `merchant_patron_late_life_identity_done` + 对应 `merchant_patron_late_*` marker
- [ ] Stat 变化按 contract §2
- [ ] 不设置 `merchant_patron_endgame_echo_done`
- [ ] 事件插入于 `merchant_patron_payoff_echo` 之后
- [ ] 不引入新的事件框架或调度器
- [ ] P102–P108 既有 evidence 不退化
- [ ] Typecheck passes

### US-002: Add Late-Life Player-Facing Expression — Sample Line (Core P0)

**Description:** As a player, I want the patron late-life branch reflected in sample line status so the route feels like a meaningful late-life identity turning point.

**Acceptance Criteria:**

- [ ] Cost label: payoff 状态 → late-life 状态（盟约终老之累 / 孤商自在之快 / 新盟久立之累）
- [ ] Current goal: payoff 状态 → late-life 分支语义 per contract §4.1
- [ ] Expression priority：`late_life_done` > `payoff_done` > pressure > on-ramp
- [ ] 至少 2 个 late-life-specific 可读信号（cost label + current goal）
- [ ] 三个分支的表达有实质差异，不是换皮
- [ ] 保持商武一体风味（账房/演武场/盟约/刀）
- [ ] 不新增 UI 组件
- [ ] Typecheck passes

### US-003: Add Late-Life Player-Facing Expression — Identity (Core P0)

**Description:** As a player, I want a late-life identity summary that reflects my payoff-driven late-life branch so the patron arc completes meaningfully.

**Acceptance Criteria:**

- [ ] `merchantAge40Identity()` 在 late-life 完成后返回对应身份文本（late-life branch 优先于 payoff choice）
- [ ] Branch A: 盟约终老的商武金主
- [ ] Branch B: 孤商巨贾
- [ ] Branch C: 新盟掌局的金主
- [ ] 三个分支的身份描述有实质差异
- [ ] 至少覆盖 1 native + 1 bridge-origin entry 叠加 late-life branch
- [ ] 保持商武一体风味
- [ ] Typecheck passes

### US-004: Add Targeted Late-Life Proof

**Description:** As a maintainer, I want a bounded proof artifact showing that the patron late-life event fires correctly, all three branches work, and merchant-martial patron flavor is preserved.

**Acceptance Criteria:**

- [ ] 产出 1 份 targeted proof（payoff → late-life → expression changes 路径验证）
- [ ] 展示 P110 validation shape §2.2 核心节点：pre-late-life state → event fires → checkpoint flags → cost label per branch → current goal per branch
- [ ] 每个 payoff choice 方向至少 1 条 proof path（A native orthodox / B native martial / C bridge-origin）
- [ ] 不要求 full lifetime exhaust
- [ ] 保存为 `docs/test-reports/p110-merchant-martial-patron-late-life-targeted-proof.md`
- [ ] Typecheck passes

### US-005: Add Narrow Regression Coverage

**Description:** As a maintainer, I want narrow tests guarding the patron late-life stage so future edits do not break the first patron late-life milestone.

**Acceptance Criteria:**

- [ ] 新增 `tests/p110MerchantMartialPatronLateLifeTests.ts` 覆盖 late-life 阶段
- [ ] Group 1: Event wiring（R1–R10）— auto 类型、触发条件、3 分支、flags、互斥
- [ ] Group 2: Pre-late-life expression（R11–R12）
- [ ] Group 3: Post-late-life expression per branch（R13–R20）
- [ ] Group 4: Spine ordering（R21–R22）
- [ ] Prior stage regression: P102–P108 + magnate + guard:sample-lines-baseline（R23–R30）
- [ ] 复用现有 test harness
- [ ] 所有相关命令 Pass
- [ ] Typecheck passes

### US-006: Update P102 Chain Proof Late-Life Nodes

**Description:** As a maintainer, I want the P102 patron bridge chain proof updated to reflect late-life behavior after payoff.

**Acceptance Criteria:**

- [ ] 更新 `docs/test-reports/p102-merchant-martial-patron-bridge-chain-proof.md` late-life 节点描述
- [ ] 文档化 auto late-life 的 flag / expression 变化
- [ ] 不破坏 P102–P104 bridge entry evidence
- [ ] Typecheck passes

### US-007: Produce P110 Closure Report

**Description:** As a maintainer, I want a closure report stating exactly what the patron late-life stage now provides and whether endgame echo stage is justified next.

**Acceptance Criteria:**

- [ ] 输出 `docs/test-reports/p110-merchant-martial-patron-late-life-closure-report.md`
- [ ] 汇总 event wiring、expressions、proof、tests
- [ ] 明确后续 endgame echo 阶段是否值得开
- [ ] 列出更大 patron-expansion 项的 defer
- [ ] 12 条 closure criteria 全部满足（来自 P109 validation shape §4.1）
- [ ] Typecheck passes

## 5. Success Criteria

- Patron 路线有 auto late-life 阶段的实际 runtime 实现
- 玩家能感受到 payoff 选择的晚年后果：三个分支有实质差异
- 商武一体风味贯穿 late-life 事件与表达
- P102–P108 + P100/P101 magnate 既有 evidence 未退化
- 后续 endgame echo 阶段是否值得继续已有依据
- Typecheck + sample-lines-baseline guard 通过

## 6. Dependencies / Context

- P109 closure: `docs/test-reports/p109-merchant-martial-patron-late-life-closure-report.md`
- P109 late-life contract: `docs/PRD/p109-merchant-martial-patron-late-life-contract.md`
- P109 validation shape: `docs/test-reports/p109-p110-validation-shape.md`
- P108 payoff: `docs/test-reports/p108-merchant-martial-patron-payoff-closure-report.md`
- P102 bridge: `docs/test-reports/p102-merchant-martial-patron-bridge-chain-proof.md`
- Renown late-life precedent: `docs/PRD/p79-wuxia-renown-late-life-playable-implementation.md`
- North Star: `docs/designs/p25-lifetime-simulation-north-star.md` §8

## 7. Open Questions

- Ordinary origin patron late-life expression 是否纳入 P110 bonus（默认 defer）
- Stat threshold gates 是否作为 P110 optional enhancement
- P102 chain proof 更新范围：仅 late-life 节点 vs 全链重跑
