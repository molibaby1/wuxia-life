# PRD: P117 Wuxia Founding Patriarch Late-Life Playable Implementation

> **Derived from:** `docs/test-reports/p116-founding-patriarch-late-life-closure-report.md`, `docs/PRD/p116-founding-patriarch-late-life-contract.md`, `docs/test-reports/p116-p117-validation-shape.md`, `agent_docs/p116-wuxia-founding-patriarch-late-life-design-first-discovery-result.md`
> **Stage slug:** `p117-wuxia-founding-patriarch-late-life-playable-implementation`
> **Gaps addressed:** GAP-P116-N01, GAP-P116-N02, GAP-P116-N03, GAP-P116-N04, GAP-P116-N05, GAP-P116-N06
> **Stage type:** bounded late-life implementation stage for founding_patriarch

## 1. Introduction

P116 已完成 `founding_patriarch`（开派祖师）路线的 late-life design-first contract：选定 auto × 2 branches 结构（门规守成终老 / 盟约续责终老），分支 keyed on P115 pressure markers（`rule_first` / `alliance_first`），定义了事件规格、表达更新边界与验证形状。

对照 patron P109→P110 与 renown P78→P79 方法论，founding-patriarch 路线目前走完了 bridge → on-ramp → pressure → payoff，但 **late-life 阶段仅有 contract、尚无 runtime**。P117 的目标是把 P116 contract 落地成可玩实现：spine event wiring + branch markers + expression updates + targeted proof + regression tests。

这不是 full founding-patriarch content wave，而是严格按 P116 contract 落地的 bounded implementation 阶段。

## 2. Goals

- 按 P116 contract 落地 `founding_patriarch` 的 late-life 阶段 runtime 实现
- 让 founding-patriarch 路线从「名号定型」推进到「治理次序的晚年」
- 复用现有事件系统与 sample-lines-spine 架构，不建新系统
- 保持开派治理风味（门规/盟约/书斋/山门），与 patron/renown/magnate late-life 明确区分
- 为后续 endgame echo 阶段（P118+）预留 flag 接口
- P113/P115 + P37/P102–P110 patron 既有 evidence 不退化

## 3. Non-Goals

- 不做 founding-patriarch endgame echo / final legacy（P118+）
- 不新建 route framework 或事件调度器
- 不重做 P113 payoff event 或 expression
- 不重做 P115 pressure / P113 bridge wiring
- 不做 full 2×3 pressure×payoff identity 矩阵（P117 minimum: 2 pressure branches）
- 不做 stat threshold gate 实现（optional enhancement，defer）
- 不做 ordinary origin founding-patriarch late-life expression（P117 bonus / defer）
- 不做 full-lifetime `gate:p20` broad rerun
- 不新增 UI 组件
- 不将 branch key 改为 payoff marker（locked as pressure-keyed）

## 4. User Stories

### US-001: Wire Founding-Patriarch Late-Life Spine Event

**Description:** As a developer, I want the founding-patriarch late-life event wired through the existing event system so players on the route encounter a real late-life milestone after payoff.

**Acceptance Criteria:**

- [ ] 在 `sample-lines-spine.json` 中配置 `founding_patriarch_late_life` auto 事件（version 1.0.0）
- [ ] 触发条件：`founding_patriarch_payoff_done` + age 52–56 + exclusivity guards + `!founding_patriarch_late_life_done`
- [ ] 2 个条件分支 keyed on pressure marker（`founding_patriarch_pressure_rule_first` / `founding_patriarch_pressure_alliance_first`）
- [ ] 各分支设置 `founding_patriarch_late_life_done` + `founding_patriarch_late_life_identity_done` + 对应 `founding_patriarch_late_*` marker
- [ ] Stat 变化按 contract §2
- [ ] 不设置 `founding_patriarch_endgame_echo_done`
- [ ] 事件插入于 `founding_patriarch_payoff_echo` 之后
- [ ] 不引入新的事件框架或调度器
- [ ] P113/P115 既有 evidence 不退化
- [ ] Typecheck passes

### US-002: Add Late-Life Branch Flags and Sequencing

**Description:** As a maintainer, I can trace late-life branch semantics and verify on-ramp → pressure → payoff → late-life ordering in sample lines.

**Acceptance Criteria:**

- [ ] Branch A 设 `founding_patriarch_late_rule_keeper`，且仅当 `founding_patriarch_pressure_rule_first` 为真
- [ ] Branch B 设 `founding_patriarch_late_alliance_bearer`，且仅当 `founding_patriarch_pressure_alliance_first` 为真
- [ ] 两分支互斥，不可同时设多个 late-life marker
- [ ] Pressure marker 在 late-life 后保留（不被清除或覆盖）
- [ ] 样本链路中可观测到 entry → pressure → payoff → late-life 顺序
- [ ] Late-life 不可在 payoff 之前触发
- [ ] Typecheck passes

### US-003: Add Late-Life Player-Facing Expression Updates

**Description:** As a player, I want the founding-patriarch late-life branch reflected in sample line status so the route feels like a meaningful late-life identity turning point.

**Acceptance Criteria:**

- [ ] Cost label: payoff 状态 → late-life 状态（门规守成之累 / 盟约续责之累）
- [ ] Current goal: payoff 状态 → late-life 分支语义 per contract §4.1
- [ ] `orthodoxAge40Identity()` 在 late-life 完成后返回对应身份文本（late-life branch 优先于 payoff choice）
- [ ] Expression priority：`late_life_done` > `payoff_done` > `pressure_done` > on-ramp
- [ ] 至少 2 个 late-life-specific 可读信号（cost label + current goal）
- [ ] 两个分支的表达有实质差异，不是换皮
- [ ] 至少覆盖 1 条 on-ramp variant overlay（scholar 或 alliance）
- [ ] 保持开派治理风味（门规/盟约/书斋/山门）
- [ ] 不新增 UI 组件
- [ ] Typecheck passes

### US-004: Add Targeted Late-Life Proof

**Description:** As a maintainer, I want a bounded proof artifact showing that the founding-patriarch late-life event fires correctly, both branches work, and founding-patriarch flavor is preserved.

**Acceptance Criteria:**

- [ ] 产出 1 份 targeted proof（pressure → payoff → late-life → expression changes 路径验证）
- [ ] 展示 P117 validation shape §2.2 核心节点：pre-late-life state → event fires → checkpoint flags → branch marker → cost label per branch → current goal per branch
- [ ] 每个 pressure branch 方向至少 1 条 proof path（rule_first / alliance_first）
- [ ] 至少 1 条 on-ramp variant overlay
- [ ] 不要求 full lifetime exhaust
- [ ] 保存为 `docs/test-reports/p117-founding-patriarch-late-life-targeted-proof.md`
- [ ] Typecheck passes

### US-005: Add Narrow Regression Coverage

**Description:** As a maintainer, I want narrow tests guarding the founding-patriarch late-life stage so future edits do not break the first late-life milestone.

**Acceptance Criteria:**

- [ ] 新增 `tests/p117FoundingPatriarchLateLifeTests.ts` 覆盖 late-life 阶段
- [ ] Group 1: Event wiring（R1–R10）— auto 类型、触发条件、2 分支、flags、互斥
- [ ] Group 2: Pre-late-life expression（R11–R12）
- [ ] Group 3: Post-late-life expression per branch（R13–R18）
- [ ] Group 4: Spine ordering（R19–R21）
- [ ] Prior stage regression: P113, P115, P37, P102–P110 patron, guard:sample-lines-baseline（R22–R30）
- [ ] 复用现有 test harness
- [ ] 所有相关命令 Pass
- [ ] Typecheck passes

### US-006: Produce P117 Closure Report

**Description:** As a maintainer, I want a closure report stating exactly what the founding-patriarch late-life stage now provides and whether endgame echo stage is justified next.

**Acceptance Criteria:**

- [ ] 输出 `docs/test-reports/p117-founding-patriarch-late-life-closure-report.md`
- [ ] 汇总 event wiring、expressions、proof、tests
- [ ] 明确后续 endgame echo 阶段（P118+）是否值得开
- [ ] 列出更大 founding-patriarch-expansion 项的 defer
- [ ] 12 条 closure criteria 全部满足（来自 P116 validation shape §4.1）
- [ ] Typecheck passes

## 5. Success Criteria

- Founding-patriarch 路线有 auto late-life 阶段的实际 runtime 实现
- 玩家能感受到 pressure 治理次序选择的晚年后果：两个分支有实质差异
- 开派治理风味贯穿 late-life 事件与表达
- P113/P115 + P37/P102–P110 patron 既有 evidence 未退化
- 后续 endgame echo 阶段是否值得继续已有依据
- Typecheck + sample-lines-baseline guard 通过

## 6. Dependencies / Context

- P116 closure: `docs/test-reports/p116-founding-patriarch-late-life-closure-report.md`
- P116 late-life contract: `docs/PRD/p116-founding-patriarch-late-life-contract.md`
- P116 validation shape: `docs/test-reports/p116-p117-validation-shape.md`
- P115 pressure: `docs/test-reports/p115-founding-patriarch-midlife-pressure-closure-report.md`
- P113 bridge: `docs/test-reports/p113-founding-patriarch-bridge-closure-report.md`
- Patron late-life precedent: `docs/PRD/p110-wuxia-merchant-martial-patron-late-life-playable-implementation.md`
- North Star: `docs/designs/p25-lifetime-simulation-north-star.md` §8

## 7. Open Questions

- Ordinary origin founding-patriarch late-life expression 是否纳入 P117 bonus（默认 defer）
- Stat threshold gates 是否作为 P117 optional enhancement
- Identity 覆盖范围：2 pressure branches only vs partial payoff overlay（默认 2 branches minimum）
