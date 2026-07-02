# P110 Validation Shape — Merchant Martial Patron Late-Life Implementation

> **Date:** 2026-07-02
> **Source:** P109 Merchant Martial Patron Late-Life Design-First
> **Target stage:** P110 Patron Late-Life Implementation
> **Route:** `merchant_martial_patron`（商武一体金主）
> **Contract:** `docs/PRD/p109-merchant-martial-patron-late-life-contract.md`

---

## 1. Purpose

本文件定义 P110（late-life implementation 阶段）的验证形状：targeted proof 需要展示哪些链路节点、regression tests 至少覆盖哪些断言、什么证据算 late-life closed。目的是在 implementation 开始前就锁定验证标准。

本验证形状基于 P78→P79 renown late-life 验证模式，并参考 P108 patron payoff 测试实践。

---

## 2. Targeted Proof Chain

### 2.1 Chain Nodes Overview

| # | Node | Type | Verification Point |
|---|------|------|-------------------|
| 1 | **Wealth + invest commitment** | P22/P102 | `route_wealth_committed` + `merchant_invest_*` (native path) |
| 2 | **Patron entry reached** | P102+ | `merchant_patron_bridge_entry` fires at age 34–38 |
| 3 | **On-ramp checkpoint** | P102+ | `merchant_patron_on_ramp_done` + variant marker set |
| 4 | **Pressure event fires** | P106 | `merchant_patron_midlife_pressure` fires at age 40–44 |
| 5 | **Pressure checkpoint** | P106 | `merchant_patron_midlife_pressure_done` = true |
| 6 | **Payoff event fires** | P108 | `merchant_patron_payoff_echo` fires at age 48–52 |
| 7 | **Payoff checkpoint** | P108 | `merchant_patron_payoff_done` + payoff marker set |
| 8 | **Pre-late-life expression** | baseline | cost label / goal reflect payoff choice |
| 9 | **Pre-late-life state** | baseline | `payoff_done` = true, `late_life_done` = false |
| 10 | **Late-life event fires** | **P110 core** | `merchant_patron_late_life` fires at age 52–56 |
| 11 | **Late-life checkpoint set** | **P110 core** | `merchant_patron_late_life_done` = true |
| 12 | **Late-life identity done** | **P110 core** | `merchant_patron_late_life_identity_done` = true |
| 13 | **Branch marker set** | **P110 core** | matching `merchant_patron_late_*` set |
| 14 | **Late-life expression — cost label** | **P110 core** | cost label reflects late-life branch |
| 15 | **Late-life expression — current goal** | **P110 core** | goal reflects late-life branch |
| 16 | **Late-life expression — identity** | **P110 core** | identity reflects late-life branch |
| 17 | **Endgame interface reserved** | contract-only | `merchant_patron_endgame_echo_done` not set |

### 2.2 Core Nodes (Must Show)

必须展示的核心节点（P0）：

1. **节点 9:** Pre-late-life state (payoff done, late-life not done)
2. **节点 10:** Late-life event fires at correct age
3. **节点 11:** Checkpoint flag set
4. **节点 13:** Branch marker traceable
5. **节点 14:** Cost label late-life update (per branch)
6. **节点 15:** Current goal late-life update (per branch)

共 6 个核心节点。**每个 payoff choice 方向至少 1 条 proof path**（3 paths minimum for branches A/B/C）。

Bonus: 节点 16 identity update；至少 1 条 bridge-origin path 叠加 late-life branch。

### 2.3 Branch Path Requirements

| Branch | Minimum Proof Path | Key Assertions |
|--------|-------------------|----------------|
| A: 盟约绑紧 | Native orthodox → payoff A → late-life A | `late_covenant_bound` + cost/goal |
| B: 自由孤立 | Native martial → payoff B → late-life B | `late_isolated_merchant` + cost/goal |
| C: 新盟可持续 | Bridge apprentice → payoff C → late-life C | `late_sustainable_covenant` + cost/goal |

### 2.4 No Full Lifetime Exhaust Required

**不需要：**
- Full birth-to-death 穷举
- 多种子组合爆炸
- Stat 阈值边界测试（增强项 defer）
- `gate:p20` broad rerun
- 5×3 entry×payoff×late-life identity 全矩阵

只需要 targeted proof：3 条 late-life branch paths + 至少 1 条 bridge-origin 叠加。

---

## 3. Regression Tests

### 3.1 P110 New Tests (`tests/p110MerchantMartialPatronLateLifeTests.ts`)

#### Group 1: Late-Life Event Wiring

| # | Assertion | Priority |
|---|-----------|----------|
| R1 | `merchant_patron_late_life` 存在于 `sample-lines-spine.json` | P0 |
| R2 | 事件类型是 **auto**（非 choice） | P0 |
| R3 | 触发条件包含 `merchant_patron_payoff_done` | P0 |
| R4 | 年龄范围 52–56 | P0 |
| R5 | 3 个条件分支存在（keyed on payoff marker） | P0 |
| R6 | 所有分支设置 `merchant_patron_late_life_done` | P0 |
| R7 | 所有分支设置 `merchant_patron_late_life_identity_done` | P0 |
| R8 | 各分支设置对应 `merchant_patron_late_*` marker | P0 |
| R9 | 各分支互斥（不可同时设多个 late-life marker） | P0 |
| R10 | Late-life 不设置 `merchant_patron_endgame_echo_done` | P0 |

#### Group 2: Pre-Late-Life Expression

| # | Assertion | Priority |
|---|-----------|----------|
| R11 | Payoff done 但 late-life 未 done 时，cost label 是 payoff choice label | P0 |
| R12 | Payoff done 但 late-life 未 done 时，goal 是 payoff choice state | P0 |

#### Group 3: Post-Late-Life Expression (per branch)

| # | Assertion | Priority |
|---|-----------|----------|
| R13 | Late-life A 后，cost label = "盟约终老之累" | P0 |
| R14 | Late-life A 后，goal 含守盟约至终语义 | P0 |
| R15 | Late-life B 后，cost label = "孤商自在之快" | P0 |
| R16 | Late-life B 后，goal 含商路自分断语义 | P0 |
| R17 | Late-life C 后，cost label = "新盟久立之累" | P0 |
| R18 | Late-life C 后，goal 含守新盟规矩语义 | P0 |
| R19 | Late-life A 后，identity 反映 covenant_bound | P1 |
| R20 | 至少 1 条 bridge-origin + late-life branch 表达正确 | P1 |

#### Group 4: Spine Ordering

| # | Assertion | Priority |
|---|-----------|----------|
| R21 | Spine 顺序：entry → pressure → payoff → late-life | P0 |
| R22 | Late-life 不可在 payoff 之前触发 | P0 |

### 3.2 Prior Stage Regression (Must Not Break)

| # | Test Suite | Priority |
|---|------------|----------|
| R23 | `p102MerchantMartialPatronBridgeTests` | P0 |
| R24 | `p103MerchantMartialPatronBridgeOriginTests` | P0 |
| R25 | `p104MerchantMartialPatronBridgeOriginPeasantTests` | P0 |
| R26 | `p106MerchantMartialPatronPressureTests` | P0 |
| R27 | `p108MerchantMartialPatronPayoffTests` | P0 |
| R28 | P100/P101 magnate spine tests（若存在） | P0 |
| R29 | `npm run guard:sample-lines-baseline` | P0 |
| R30 | `npm run typecheck` | P0 |

---

## 4. Late-Life Closed Definition

### 4.1 Closure Criteria (12-criteria pattern, aligned with P108)

| # | Criterion | Evidence |
|---|-----------|----------|
| C1 | Late-life event fires as auto | Targeted proof nodes 10–11 |
| C2 | All checkpoint flags set | `late_life_done` + `late_life_identity_done` |
| C3 | Branch marker traceable | One of 3 `merchant_patron_late_*` |
| C4 | Cost label updates per branch | R13–R18 |
| C5 | Current goal updates per branch | R14, R16, R18 |
| C6 | Identity updates (minimum 1 branch) | R19 |
| C7 | 商武一体 flavor consistent | Manual review — 账房/演武场/盟约/刀 |
| C8 | No P102–P108 regressions | R23–R27 pass |
| C9 | No magnate spine regressions | R28 pass |
| C10 | Typecheck passes | R30 |
| C11 | Guard sample-lines-baseline | R29 |
| C12 | Endgame interfaces reserved | `endgame_echo_done` not set by late-life |

**12/12 = late-life closed.**

### 4.2 What Does NOT Count as Closed

- 仅设 flag 但表达不更新
- 仅 1 个 branch 有表达分化
- 破坏 P108 payoff gate 或表达
- Late-life 设为 choice 事件（与 contract 不符）

---

## 5. Non-Regression Boundaries

| Closed Stage | What Must Not Change |
|--------------|---------------------|
| P102–P104 bridge entry | Entry gates, on-ramp markers, entry expressions |
| P106 pressure | Pressure event, pressure expressions, pressure gate |
| P108 payoff | Payoff choice event, payoff expressions, payoff gate |
| P100/P101 magnate | Magnate spine events and expressions |
| Expression priority | magnate > late_life > payoff > pressure > on-ramp |

**Allowed change:** New `merchant_patron_late_life` auto event; late-life expression branches; new late-life branch markers.

---

## 6. Test Execution Commands

```
npm run typecheck
npm exec tsx tests/p110MerchantMartialPatronLateLifeTests.ts
npm exec tsx tests/p108MerchantMartialPatronPayoffTests.ts
npm exec tsx tests/p106MerchantMartialPatronPressureTests.ts
npm exec tsx tests/p102MerchantMartialPatronBridgeTests.ts
npm run guard:sample-lines-baseline
```

---

**P109-005 complete.**
