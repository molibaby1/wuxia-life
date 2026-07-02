# PRD: P108 Wuxia Merchant Martial Patron Payoff Playable Implementation

> **Derived from:** `docs/test-reports/p107-merchant-martial-patron-payoff-closure-report.md`, `docs/PRD/p107-merchant-martial-patron-payoff-contract.md`, `docs/test-reports/p107-p108-validation-shape.md`, `agent_docs/p107-wuxia-merchant-martial-patron-payoff-design-first-discovery-result.md`
> **Stage slug:** `p108-wuxia-merchant-martial-patron-payoff-playable-implementation`
> **Gaps addressed:** GAP-P107-D01
> **Stage type:** bounded payoff implementation stage for merchant_martial_patron

## 1. Introduction

P107 已完成 `merchant_martial_patron`（商武一体金主）路线的 payoff design-first contract：选定了 choice-based「商武撕裂之解」方向，定义了三个选择（硬扛盟约 / 撕破盟约 / 商武平衡）、事件规格、表达更新、验证形状。

对照 renown P76→P77 与 magnate trilogy 方法论，patron 路线目前走完了 bridge → entry/on-ramp → pressure → payoff-design。P108 的目标是把 P107 contract 落地成可玩实现：将 `merchant_patron_payoff_echo` 从 auto 升级为 choice、expression updates、targeted proof、regression tests。

这不是 full patron content wave，而是严格按 P107 contract 落地的 bounded implementation 阶段。

## 2. Goals

- 按 P107 contract 落地 `merchant_martial_patron` 的 payoff 阶段 runtime 实现
- 让 patron 路线从「护商武力负担兑现」推进到「商武撕裂之解的有选择定型」
- 复用现有事件系统与 sample-lines-spine 架构，不建新系统
- 保持商武一体风味，与 magnate auto payoff / renown choice payoff 明确区分
- 为后续 late-life / endgame 阶段预留 flag 接口
- P102–P106 + P100/P101 magnate 既有 evidence 不退化

## 3. Non-Goals

- 不做 patron late-life / endgame echo 深化（P109+）
- 不新建 route framework 或事件调度器
- 不重做 P106 pressure event 或 expression
- 不重做 P102–P104 patron bridge entry / on-ramp wiring
- 不做 full 5×3 entry×payoff identity 矩阵（P108 minimum: 1 native + 1 bridge per choice）
- 不做 stat threshold gate 实现（optional enhancement，defer）
- 不做 ordinary origin patron expression（P108 bonus / defer）
- 不做 full-lifetime `gate:p20` broad rerun
- 不新增 UI 组件

## 4. User Stories

### US-001: Wire Patron Payoff Spine Event

**Description:** As a developer, I want the patron payoff event upgraded from auto to choice so players on the patron route encounter a real payoff milestone with meaningful choices after pressure.

**Acceptance Criteria:**

- [ ] 在 `sample-lines-spine.json` 中将 `merchant_patron_payoff_echo` 从 auto 升级为 choice 事件（version 2.0.0）
- [ ] 触发条件：`merchant_patron_midlife_pressure_done` + age 48–52 + exclusivity guards + `!merchant_patron_payoff_done`
- [ ] 3 个 choice 分支：`patron_payoff_hold_covenant` / `patron_payoff_break_covenant` / `patron_payoff_balance_covenant`
- [ ] 各分支设置 `merchant_patron_payoff_done` + `merchant_patron_identity_done` + `merchant_patron_payoff_resolved` + 对应 `merchant_patron_payoff_*` marker
- [ ] Stat 变化按 contract §2：A(biz+2, martial+3, rep+2) / B(biz+4, martial-2, rep-1) / C(biz+3, martial+1, rep+2)
- [ ] 不引入新的事件框架或调度器
- [ ] P102–P106 既有 evidence 不退化
- [ ] Typecheck passes

### US-002: Add Payoff Player-Facing Expression — Sample Line (Core P0)

**Description:** As a player, I want the patron payoff choice reflected in my sample line status so the route feels like a meaningful identity turning point.

**Acceptance Criteria:**

- [ ] Sample line cost label: pressure「之债」→ payoff 状态（盟约如山之累 / 断武从商之快 / 商武新矩之累）
- [ ] Sample line current goal: pressure 状态 → payoff 状态（硬扛盟约 / 撕破盟约 / 商武平衡语义）
- [ ] 至少 2 个 payoff-specific 可读信号（cost label + current goal）
- [ ] 三个 choice 的表达有实质差异，不是换皮
- [ ] 保持商武一体风味（账房/演武场/盟约/刀）
- [ ] 不新增 UI 组件
- [ ] Typecheck passes

### US-003: Add Payoff Player-Facing Expression — Age-40 Identity (Core P0)

**Description:** As a player, I want an age-40 identity summary that reflects my payoff choice so the midlife turning point defines who I am as a patron.

**Acceptance Criteria:**

- [ ] `merchantAge40Identity()` 在 payoff 完成后返回对应身份文本
- [ ] Option A: 靠盟约定型的商武金主
- [ ] Option B: 断武从商的巨贾
- [ ] Option C: 懂商武分寸的金主
- [ ] 三个 choice 的身份描述有实质差异
- [ ] 至少覆盖 1 native + 1 bridge-origin entry 叠加 payoff choice
- [ ] 保持商武一体风味
- [ ] Typecheck passes

### US-004: Add Targeted Payoff Proof

**Description:** As a maintainer, I want a bounded proof artifact showing that the patron payoff event fires correctly, all three choices work, and merchant-martial patron flavor is preserved.

**Acceptance Criteria:**

- [ ] 产出 1 份 targeted proof（pressure → payoff → expression changes 路径验证）
- [ ] 展示 P108 validation shape §2.2 核心节点：pre-payoff state → event fires → checkpoint flags → cost label per choice → current goal per choice
- [ ] 每个 payoff choice 方向至少 1 条 proof path（A native orthodox / B native martial / C bridge-origin）
- [ ] 不要求 full lifetime exhaust
- [ ] proof 能支持是否继续 late-life 阶段的判断
- [ ] 保存为 `docs/test-reports/p108-merchant-martial-patron-payoff-targeted-proof.md`
- [ ] Typecheck passes

### US-005: Add Narrow Regression Coverage

**Description:** As a maintainer, I want narrow tests guarding the patron payoff stage so future edits do not break the first patron choice payoff milestone.

**Acceptance Criteria:**

- [ ] 新增 `tests/p108MerchantMartialPatronPayoffTests.ts` 覆盖 payoff 阶段
- [ ] Group 1: Event wiring（R1–R10）— choice 类型、触发条件、3 选项、flags、互斥
- [ ] Group 2: Pre-payoff expression（R11–R12）
- [ ] Group 3: Post-payoff expression per choice（R13–R20）
- [ ] Group 4: Spine ordering（R21–R22）
- [ ] Prior stage regression: P102–P106 + magnate + guard:sample-lines-baseline（R23–R29）
- [ ] 复用现有 test harness
- [ ] 所有相关命令 Pass
- [ ] Typecheck passes

### US-006: Update P102 Chain Proof Payoff Nodes

**Description:** As a maintainer, I want the P102 patron bridge chain proof updated to reflect choice-based payoff behavior instead of legacy auto echo.

**Acceptance Criteria:**

- [ ] 更新 `docs/test-reports/p102-merchant-martial-patron-bridge-chain-proof.md` payoff 节点描述
- [ ] 文档化 choice payoff 替代 auto echo 的 flag / expression 变化
- [ ] 不破坏 P102–P104 bridge entry evidence
- [ ] Typecheck passes

### US-007: Produce P108 Closure Report

**Description:** As a maintainer, I want a closure report stating exactly what the patron payoff stage now provides and whether late-life stage is justified next.

**Acceptance Criteria:**

- [ ] 输出 `docs/test-reports/p108-merchant-martial-patron-payoff-closure-report.md`
- [ ] 汇总 event wiring、expression、proof、tests
- [ ] 明确后续 late-life 阶段是否值得开
- [ ] 列出更大 patron-expansion 项的 defer
- [ ] 12 条 closure criteria 全部满足（来自 P107 validation shape §4.1）
- [ ] Typecheck passes

## 5. Success Criteria

- Patron 路线有 choice-based payoff 阶段的实际 runtime 实现
- 玩家能感受到 patron 的选择：从「被动承受盟约负担」到「主动选择商武定型路径」
- 三个 choice 有实质差异，不是换皮
- 商武一体风味贯穿 payoff 事件与表达
- P102–P106 + P100/P101 magnate 既有 evidence 未退化
- 后续 late-life 阶段是否值得继续已有依据
- Typecheck + sample-lines-baseline guard 通过

## 6. Dependencies / Context

- P107 closure: `docs/test-reports/p107-merchant-martial-patron-payoff-closure-report.md`
- P107 payoff contract: `docs/PRD/p107-merchant-martial-patron-payoff-contract.md`
- P107 validation shape: `docs/test-reports/p107-p108-validation-shape.md`
- P106 pressure: `docs/test-reports/p106-merchant-martial-patron-pressure-closure-report.md`
- P102 bridge: `docs/test-reports/p102-merchant-martial-patron-bridge-chain-proof.md`
- Renown payoff precedent: `docs/PRD/p77-wuxia-renown-payoff-playable-implementation.md`
- North Star: `docs/designs/p25-lifetime-simulation-north-star.md`

## 7. Open Questions

- Ordinary origin patron expression 是否纳入 P108 bonus（默认 defer）
- Stat threshold gates 是否作为 P108 optional enhancement
- P102 chain proof 更新范围：仅 payoff 节点 vs 全链重跑
