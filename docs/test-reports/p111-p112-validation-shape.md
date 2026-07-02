# P112 Validation Shape — Merchant Martial Patron Endgame Implementation

> **Date:** 2026-07-02
> **Source:** P111 Merchant Martial Patron Endgame Design-First
> **Target stage:** P112 Patron Endgame Implementation
> **Route:** `merchant_martial_patron`（商武一体金主）
> **Contract:** `docs/PRD/p111-merchant-martial-patron-endgame-contract.md`
> **Status:** Not skipped — GO verdict from P111-003

---

## 1. Purpose

本文件定义 P112（endgame implementation 阶段）的验证形状：targeted proof 需要展示哪些链路节点、regression tests 至少覆盖哪些断言、什么证据算 endgame closed。目的是在 implementation 开始前就锁定验证标准。

本验证形状基于 P80→P81 renown endgame 验证模式，并参考 P110 patron late-life 测试实践。

---

## 2. Targeted Proof Chain

### 2.1 Chain Nodes Overview

| # | Node | Type | Verification Point |
|---|------|------|-------------------|
| 1 | **Wealth + invest commitment** | P22/P102 | `route_wealth_committed` + `merchant_invest_*` |
| 2 | **Patron entry reached** | P102+ | `merchant_patron_bridge_entry` fires |
| 3 | **On-ramp checkpoint** | P102+ | `merchant_patron_on_ramp_done` |
| 4 | **Pressure event fires** | P106 | `merchant_patron_midlife_pressure` |
| 5 | **Payoff event fires** | P108 | `merchant_patron_payoff_echo` |
| 6 | **Late-life event fires** | P110 | `merchant_patron_late_life_*` at age 52–56 |
| 7 | **Late-life checkpoint** | P110 | `merchant_patron_late_life_done` + late-life marker |
| 8 | **Pre-endgame expression** | baseline | cost label / goal reflect late-life branch |
| 9 | **Pre-endgame state** | baseline | `late_life_done` = true, `endgame_echo_done` = false |
| 10 | **Endgame event fires** | **P112 core** | `merchant_patron_endgame_echo_*` at age 60–65 |
| 11 | **Endgame checkpoint set** | **P112 core** | `merchant_patron_endgame_echo_done` = true |
| 12 | **Endgame identity done** | **P112 core** | `merchant_patron_endgame_identity_done` = true |
| 13 | **Endgame branch marker set** | **P112 core** | matching `merchant_patron_endgame_*` set |
| 14 | **Endgame expression — cost label** | **P112 core** | cost label reflects endgame branch |
| 15 | **Endgame expression — current goal** | **P112 core** | goal reflects endgame branch |
| 16 | **Endgame expression — identity** | **P112 core** | identity reflects endgame branch |

### 2.2 Core Nodes (Must Show)

必须展示的核心节点（P0）：

1. **节点 9:** Pre-endgame state (late-life done, endgame not done)
2. **节点 10:** Endgame event fires at correct age
3. **节点 11:** Checkpoint flag set
4. **节点 13:** Branch marker traceable
5. **节点 14:** Cost label endgame update (per branch)
6. **节点 15:** Current goal endgame update (per branch)

共 6 个核心节点。**每个 late-life branch 方向至少 1 条 proof path**（3 paths minimum for branches A/B/C）。

Bonus: 节点 16 identity update；至少 1 条 bridge-origin path 叠加 endgame branch。

### 2.3 Branch Path Requirements

| Branch | Minimum Proof Path | Key Assertions |
|--------|-------------------|----------------|
| A: 盟约绑紧 | Native orthodox → payoff A → late-life A → endgame A | `endgame_covenant_echo` + cost/goal 商武终局·担 |
| B: 自由孤立 | Native martial → payoff B → late-life B → endgame B | `endgame_solitary_echo` + cost/goal 商武终局·孤 |
| C: 新盟可持续 | Bridge apprentice → payoff C → late-life C → endgame C | `endgame_legacy_echo` + cost/goal 商武终局·传 |

### 2.4 No Full Lifetime Exhaust Required

**不需要：**
- Full birth-to-death 穷举
- 多种子组合爆炸
- Stat 阈值边界测试
- `gate:p20` broad rerun
- 5×3 entry×payoff×late-life×endgame identity 全矩阵

只需要 targeted proof：3 条 endgame branch paths + 至少 1 条 bridge-origin 叠加。

---

## 3. Regression Tests

### 3.1 P112 New Tests (`tests/p112MerchantMartialPatronEndgameTests.ts`)

#### Group 1: Endgame Event Wiring

| # | Assertion | Priority |
|---|-----------|----------|
| R1 | `merchant_patron_endgame_echo_*` 存在于 `sample-lines-spine.json` | P0 |
| R2 | 事件类型是 **auto**（非 choice） | P0 |
| R3 | 触发条件包含 `merchant_patron_late_life_done` | P0 |
| R4 | 年龄范围 60–65 | P0 |
| R5 | 3 个条件分支存在（keyed on late-life marker） | P0 |
| R6 | 所有分支设置 `merchant_patron_endgame_echo_done` | P0 |
| R7 | 所有分支设置 `merchant_patron_endgame_identity_done` | P0 |
| R8 | 各分支设置对应 `merchant_patron_endgame_*` marker | P0 |
| R9 | 各分支互斥（不可同时设多个 endgame marker） | P0 |
| R10 | Endgame 不 unset `merchant_patron_late_life_done` | P0 |
| R11 | Endgame 无 stat 变化 | P0 |

#### Group 2: Pre-Endgame Expression

| # | Assertion | Priority |
|---|-----------|----------|
| R12 | Late-life done 但 endgame 未 done 时，cost label 是 late-life branch label | P0 |
| R13 | Late-life done 但 endgame 未 done 时，goal 是 late-life branch state | P0 |

#### Group 3: Post-Endgame Expression (per branch)

| # | Assertion | Priority |
|---|-----------|----------|
| R14 | Endgame A 后，cost label = "商武终局·担" | P0 |
| R15 | Endgame A 后，goal 含盟约碑立语义 | P0 |
| R16 | Endgame B 后，cost label = "商武终局·孤" | P0 |
| R17 | Endgame B 后，goal 含商号自定论语义 | P0 |
| R18 | Endgame C 后，cost label = "商武终局·传" | P0 |
| R19 | Endgame C 后，goal 含新盟分寸传承语义 | P0 |
| R20 | Endgame A 后，identity 反映 covenant_echo | P1 |
| R21 | 至少 1 条 bridge-origin + endgame branch 表达正确 | P1 |

#### Group 4: Spine Ordering

| # | Assertion | Priority |
|---|-----------|----------|
| R22 | Spine 顺序：entry → pressure → payoff → late-life → endgame | P0 |
| R23 | Endgame 不可在 late-life 之前触发 | P0 |

### 3.2 Prior Stage Regression (Must Not Break)

| # | Test Suite | Priority |
|---|------------|----------|
| R24 | `p102MerchantMartialPatronBridgeTests` | P0 |
| R25 | `p103MerchantMartialPatronBridgeOriginTests` | P0 |
| R26 | `p104MerchantMartialPatronBridgeOriginPeasantTests` | P0 |
| R27 | `p106MerchantMartialPatronPressureTests` | P0 |
| R28 | `p108MerchantMartialPatronPayoffTests` | P0 |
| R29 | `p110MerchantMartialPatronLateLifeTests` | P0 |
| R30 | P100/P101 magnate spine tests（若存在） | P0 |
| R31 | `npm run guard:sample-lines-baseline` | P0 |
| R32 | `npm run typecheck` | P0 |

---

## 4. Endgame Closed Definition

### 4.1 Closure Criteria (12-criteria pattern, aligned with P110)

| # | Criterion | Evidence |
|---|-----------|----------|
| C1 | Endgame event fires as auto | Targeted proof nodes 10–11 |
| C2 | All checkpoint flags set | `endgame_echo_done` + `endgame_identity_done` |
| C3 | Branch marker traceable | One of 3 `merchant_patron_endgame_*` |
| C4 | Cost label updates per branch | R14–R19 |
| C5 | Current goal updates per branch | R15, R17, R19 |
| C6 | Identity updates (minimum 1 branch) | R20 |
| C7 | 商武一体 flavor consistent | Manual review — 账房/演武场/盟约/刀 |
| C8 | No P102–P110 regressions | R24–R29 pass |
| C9 | No magnate spine regressions | R30 pass |
| C10 | Typecheck passes | R32 |
| C11 | Guard sample-lines-baseline | R31 |
| C12 | No stat changes in endgame | R11 |

**12/12 = endgame closed.**

### 4.2 What Does NOT Count as Closed

- 仅设 flag 但表达不更新
- 仅 1 个 branch 有表达分化
- 破坏 P110 late-life gate 或表达
- Endgame 设为 choice 事件（与 contract 不符）
- Endgame 添加 stat 变化（与 lightweight 约束不符）

---

## 5. Non-Regression Boundaries

| Closed Stage | What Must Not Change |
|--------------|---------------------|
| P102–P104 bridge entry | Entry gates, on-ramp markers, entry expressions |
| P106 pressure | Pressure event, pressure expressions |
| P108 payoff | Payoff choice event, payoff expressions |
| P110 late-life | Late-life auto events, late-life expressions, late-life gate |
| P100/P101 magnate | Magnate spine events and expressions |
| Expression priority | magnate > endgame > late_life > payoff > pressure > on-ramp |

**Allowed change:** New `merchant_patron_endgame_echo_*` auto event(s); endgame expression branches; new endgame branch markers.

---

## 6. Test Execution Commands

```
npm run typecheck
npm exec tsx tests/p112MerchantMartialPatronEndgameTests.ts
npm exec tsx tests/p110MerchantMartialPatronLateLifeTests.ts
npm exec tsx tests/p108MerchantMartialPatronPayoffTests.ts
npm exec tsx tests/p106MerchantMartialPatronPressureTests.ts
npm exec tsx tests/p102MerchantMartialPatronBridgeTests.ts
npm run guard:sample-lines-baseline
```

---

**P111-006 complete.**
