# P76 Renown Payoff Design-First — Closure Report

> **Stage:** P76 — design-first contract for jianghu_renown_sage payoff
> **Verdict:** ✅ GO — P77 (payoff implementation) can proceed
> **Stories completed:** 6/6
> **Runtime changes:** 0 (design-only stage)

---

## 1. Executive Summary

P76 是 `jianghu_renown_sage` 路线的 payoff design-first 阶段。目标是在进入 implementation 之前，明确 payoff 的方向、contract 和 validation shape，避免边做边改。

**核心决策：** Renown payoff 采用 **choice-based** 模式（而非 merchant 式的 auto），主题为 **"人情债之解"**——人情债越积越重，玩家选择怎么了结。

**三个选择方向：**
- **Option A: 硬扛到底**（硬撑面子的江湖好人）
- **Option B: 索性撕破脸**（快意恩仇的独行侠）
- **Option C: 找到平衡**（人情练达的江湖名宿）

**P76 完成了所有 6 个 user stories，产出了 5 份文档 + 1 份 contract，范围控制良好，没有 runtime 代码改动。**

---

## 2. Story-by-Story Summary

### P76-001: Prerequisite Audit ✅
- 汇总了 renown 路线 4 个阶段（bridge + entry + on-ramp + pressure）的全部资产
- 5 个 checkpoint flags、4 个 stage markers、3 个 spine events、7 个 expression surfaces
- 确认上游 gate `renown_midlife_pressure_done` 已就绪
- 输出：`docs/test-reports/p76-renown-payoff-prerequisite-audit.md`

### P76-002: Scope Contract ✅
- 4 个 allowed layers：audit / compare / contract / shape
- 5 个 forbidden categories：runtime wiring / new framework / bulk content / late-life / other routes
- 4 个 scope guardrails：quality-first / small-step / tavern-born / boundary
- NO-GO conditions 和 rollback strategy 已定义
- 输出：`docs/test-reports/p76-renown-payoff-scope-contract.md`

### P76-003: Direction Comparison ✅
- 比较了 2 个大方向：choice-based vs auto
- 选定 choice-based "人情债之解"
- 比较了 3 个 choice 子方向：硬扛到底 / 索性撕破脸 / 找到平衡
- Rejected: auto payoff（差异化不足、浪费叙事潜力）
- 输出：`docs/test-reports/p76-renown-payoff-direction-comparison.md`

### P76-004: Payoff Contract ✅ LOCKED
- 完整的 event spec：`renown_midlife_payoff`（choice 类型，age 43-47）
- 3 个 choice-specific markers + 通用 checkpoint `renown_midlife_payoff_done` + `renown_age40_identity_done`
- 5 个 player-facing expression surfaces：cost label / current goal / age40 identity / life memory / origin summary
- 每个 choice 有不同的 stat 变化、identity、叙事调性、tavern-born 锚点
- Gate acceptance criteria（pre + post payoff）已定义
- 预留了 late-life / endgame flag 接口
- 输出：`docs/PRD/p76-renown-payoff-contract.md`（LOCKED）

### P76-005: P77 Validation Shape ✅
- Targeted proof：11 个 core nodes + 5 个 bonus nodes
- Regression tests：~25 tests 跨 7 个 groups
- 9 项 closure criteria
- P71/P72/P73/P75 既有证据的 regression boundaries
- 不需要 full lifetime exhaust
- 输出：`docs/test-reports/p76-p77-validation-shape.md`

### P76-006: Closure Report ✅
- 本报告
- 汇总所有 P76 产出
- 明确 P76/P77 边界
- GO / NO-GO 建议
- Deferred items 列表

---

## 3. What Was Decided

### 3.1 Core Direction
- **模式：** Choice-based payoff（不是 auto）
- **主题：** 人情债之解
- **核心问题：** 人情债越积越重，你选择怎么了结？
- **为什么是 choice-based：** 与 merchant auto payoff 差异化；"人情债怎么还"本身就是价值判断问题；符合 tavern-born 风味

### 3.2 Three Choices

| Choice | Flavor Anchor | Stats Net | Identity | Narrative Tone |
|--------|---------------|-----------|----------|----------------|
| A 硬扛到底 | 酒肆跑堂的——打落牙齿和血吞 | +10 | 硬撑面子的江湖好人 | 悲剧英雄 |
| B 索性撕破脸 | 三教九流——见多了虚情假意 | -7 | 快意恩仇的独行侠 | 反英雄 |
| C 找到平衡 | 酒肆掌柜——八面玲珑 | +6 | 人情练达的江湖名宿 | 中庸智者 |

**三个选项有实质差异**：stat 分布不同、identity 不同、cost label 不同、叙事调性不同、tavern-born 锚点不同。不是换皮。

### 3.3 Event Spec
- **Event ID:** `renown_midlife_payoff`
- **Type:** choice（3 个选项）
- **Age:** 43–47 岁
- **Upstream gate:** `renown_midlife_pressure_done`
- **Checkpoint:** `renown_midlife_payoff_done` + `renown_age40_identity_done`
- **Choice markers:** `tavern_renown_payoff_hard_holder` / `tavern_renown_payoff_breaker` / `tavern_renown_payoff_balancer`

### 3.4 Expression Surfaces（5 个）
1. Cost label（声名之累 / 快意恩仇 / 人情练达）
2. Current goal（硬扛 / 撕破脸 / 找平衡）
3. Age-40 identity（好人 / 独行侠 / 名宿）
4. Life memory（payoff 记忆）
5. Origin summary（终局总结）

---

## 4. Boundary with P77

| P76 (Design-First) | P77 (Implementation) |
|-------------------|---------------------|
| Prerequisite audit | Runtime event wiring in sample-lines-spine.json |
| Direction comparison | Expression updates in sampleLineExpression.ts |
| Payoff contract (LOCKED) | Expression updates in ordinaryOriginExpression.ts |
| Validation shape | Targeted proof document |
| Closure report | Regression tests (~25 tests) |
| | Closure report |

**P77 must not expand scope beyond the contract defined in P76.** If scope expansion is needed, a new PRD stage is required.

---

## 5. Deferred Items (Larger Renown Expansion)

以下内容不在 P76/P77 范围内，留待未来阶段：

1. **Mentor-bond martial seed bridge** — 第二条 renown seed，当前只有 ally_network 一条
2. **Late-life identity (P78+)** — 晚年身份深化，三个 choice 方向各有不同的 late-life 展开
3. **Endgame echo** — 终局回响，payoff 的选择如何影响结局
4. **Other origins** — 扩展到 tavern_hand 以外的出身（farm_peasant / town_apprentice 是否能走 renown 路线）
5. **Renown stat threshold gates** — 是否需要 stat 门槛才能触发 payoff（当前没有）
6. **Multiple payoff events** — 是否需要多个 payoff 事件（当前只有 1 个核心事件）

---

## 6. GO / NO-GO Recommendation

### Recommendation: ✅ GO — P77 can proceed

**理由：**

1. **Design 清晰无歧义** — payoff contract 已锁定，event spec、flags、expressions、stats 全部定义清楚
2. **差异化充分** — choice-based 模式与 merchant auto payoff 形成鲜明对比，三个选项各有特色
3. **Tavern-born 风味一致** — 所有设计都锚定在酒肆出身的不同侧面，没有 generic 化
4. **Scope bounded** — 1 个事件 + 3 个选项 + 5 个 expression surfaces，实现量可控
5. **前置条件就绪** — pressure 阶段（P75）已完成，上游 gate 可用
6. **Validation shape 明确** — P77 的验证标准已提前锁定，不会边做边改标准
7. **风险可控** — 即使 implementation 遇到问题，也可以退化为 auto payoff（备选方案）

**风险提示：**
- Choice 事件比 auto 事件复杂，P77 实现量会比 merchant payoff 大一些
- 需要确保三个 choice 的表达差异在 implementation 中不丢失风味
- 建议 P77 也按 small-step 原则分 story 推进

---

## 7. Deliverables Checklist

| Deliverable | Status | File |
|-------------|--------|------|
| Prerequisite audit | ✅ Done | `docs/test-reports/p76-renown-payoff-prerequisite-audit.md` |
| Scope contract | ✅ Done | `docs/test-reports/p76-renown-payoff-scope-contract.md` |
| Direction comparison | ✅ Done | `docs/test-reports/p76-renown-payoff-direction-comparison.md` |
| Payoff contract | ✅ Done (LOCKED) | `docs/PRD/p76-renown-payoff-contract.md` |
| P77 validation shape | ✅ Done | `docs/test-reports/p76-p77-validation-shape.md` |
| Closure report | ✅ Done | `docs/test-reports/p76-renown-payoff-closure-report.md` (本文档) |
| prd.json updated | ✅ Done | `docs/PRD/p76-wuxia-renown-payoff-design-first.prd.json` |
| progress.txt updated | ✅ Done | `progress.txt` |

---

## 8. Closure Criteria Verification

P76 的成功标准（来自 PRD §6）：

| Criterion | Status | Evidence |
|-----------|--------|----------|
| 1 份 renown payoff 的 design-first truth source | ✅ Met | `p76-renown-payoff-contract.md` LOCKED |
| payoff contract 已无歧义 | ✅ Met | Event spec, flags, expressions, stats 全部定义 |
| proof / test 预期已提前固定 | ✅ Met | `p76-p77-validation-shape.md` 定义了 11 core nodes + ~25 tests + 9 closure criteria |
| P77 无需重新做方向选择 | ✅ Met | Direction comparison 已选定 choice-based + 3 个选项 |
| tavern-born 风味在 payoff 设计中保持一致 | ✅ Met | 三个选项都有 tavern-born 锚点（跑堂的 / 三教九流 / 掌柜的） |
| 三个选择方向有实质差异 | ✅ Met | Stat 分布、identity、cost label、叙事调性全部不同 |

**6/6 success criteria met.**

---

## 9. Final Verdict

**P76 design-first stage 完成。**

- 6/6 stories passed
- 0 runtime code changes
- Contract LOCKED
- Validation shape defined
- GO recommendation for P77

**P77 (payoff implementation) 可以按 contract 推进。**

---

*Closure report for P76 wuxia renown payoff design-first stage. Next: P77 implementation.*
