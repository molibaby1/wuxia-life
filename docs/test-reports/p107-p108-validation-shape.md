# P108 Validation Shape — Merchant Martial Patron Payoff Implementation

> **Date:** 2026-07-02
> **Source:** P107 Merchant Martial Patron Payoff Design-First
> **Target stage:** P108 Patron Payoff Implementation
> **Route:** `merchant_martial_patron`（商武一体金主）
> **Contract:** `docs/PRD/p107-merchant-martial-patron-payoff-contract.md`

---

## 1. Purpose

本文件定义 P108（payoff implementation 阶段）的验证形状：targeted proof 需要展示哪些链路节点、regression tests 至少覆盖哪些断言、什么证据算 payoff closed。目的是在 implementation 开始前就锁定验证标准。

本验证形状基于 P76→P77 renown payoff 验证模式，并参考 P106 patron pressure 测试实践。

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
| 6 | **Pre-payoff expression** | baseline | cost label = pressure "之债"; goal = pressure state |
| 7 | **Pre-payoff state** | baseline | `pressure_done` = true, `payoff_done` = false |
| 8 | **Payoff event fires** | **P108 core** | `merchant_patron_payoff_echo` fires at age 48–52 |
| 9 | **Payoff checkpoint set** | **P108 core** | `merchant_patron_payoff_done` = true |
| 10 | **Payoff resolved marker** | **P108 core** | `merchant_patron_payoff_resolved` = true |
| 11 | **Choice marker set** | **P108 core** | matching `merchant_patron_payoff_*` set |
| 12 | **Identity done** | **P108 core** | `merchant_patron_identity_done` = true |
| 13 | **Payoff expression — cost label** | **P108 core** | cost label reflects payoff choice |
| 14 | **Payoff expression — current goal** | **P108 core** | goal reflects payoff choice |
| 15 | **Payoff expression — identity** | **P108 core** | identity reflects payoff choice |
| 16 | **Late-life interface reserved** | contract-only | `merchant_patron_late_life_done` not set |

### 2.2 Core Nodes (Must Show)

必须展示的核心节点（P0）：

1. **节点 7:** Pre-payoff state (pressure done, payoff not done)
2. **节点 8:** Payoff event fires at correct age
3. **节点 9:** Checkpoint flag set
4. **节点 10:** `payoff_resolved` marker set
5. **节点 13:** Cost label payoff update (per choice)
6. **节点 14:** Current goal payoff update (per choice)

共 6 个核心节点。**每个 payoff choice 方向至少 1 条 proof path**（3 paths minimum for choices A/B/C）。

Bonus: 节点 15 identity update；至少 1 条 bridge-origin path 叠加 payoff choice。

### 2.3 Choice Path Requirements

| Choice | Minimum Proof Path | Key Assertions |
|--------|-------------------|----------------|
| A: 硬扛盟约 | Native orthodox entry → pressure → payoff A | `covenant_holder` + cost/goal |
| B: 撕破盟约 | Native martial entry → pressure → payoff B | `covenant_breaker` + cost/goal |
| C: 商武平衡 | Bridge-origin (apprentice) → pressure → payoff C | `balancer` + cost/goal |

### 2.4 No Full Lifetime Exhaust Required

**不需要：**
- Full birth-to-death 穷举
- 多种子组合爆炸
- Stat 阈值边界测试（增强项 defer）
- `gate:p20` broad rerun
- 5×3 entry×payoff identity 全矩阵

只需要 targeted proof：3 条 payoff choice paths + 至少 1 条 bridge-origin 叠加。

---

## 3. Regression Tests

### 3.1 P108 New Tests (`tests/p108MerchantMartialPatronPayoffTests.ts`)

#### Group 1: Payoff Event Wiring

| # | Assertion | Priority |
|---|-----------|----------|
| R1 | `merchant_patron_payoff_echo` 存在于 `sample-lines-spine.json` | P0 |
| R2 | 事件类型是 **choice**（非 auto） | P0 |
| R3 | 触发条件包含 `merchant_patron_midlife_pressure_done` | P0 |
| R4 | 年龄范围 48–52 | P0 |
| R5 | 3 个 choice 分支存在 | P0 |
| R6 | 所有分支设置 `merchant_patron_payoff_done` | P0 |
| R7 | 所有分支设置 `merchant_patron_payoff_resolved` | P0 |
| R8 | 所有分支设置 `merchant_patron_identity_done` | P0 |
| R9 | 各分支设置对应 `merchant_patron_payoff_*` marker | P0 |
| R10 | 各分支互斥（不可同时设多个 payoff marker） | P0 |

#### Group 2: Pre-Payoff Expression

| # | Assertion | Priority |
|---|-----------|----------|
| R11 | Pressure done 但 payoff 未 done 时，cost label 是 pressure "之债" | P0 |
| R12 | Pressure done 但 payoff 未 done 时，goal 是 pressure 状态 | P0 |

#### Group 3: Post-Payoff Expression (per choice)

| # | Assertion | Priority |
|---|-----------|----------|
| R13 | Payoff A 后，cost label = "盟约如山之累" | P0 |
| R14 | Payoff A 后，goal 含硬扛盟约语义 | P0 |
| R15 | Payoff B 后，cost label = "断武从商之快" | P0 |
| R16 | Payoff B 后，goal 含撕破盟约语义 | P0 |
| R17 | Payoff C 后，cost label = "商武新矩之累" | P0 |
| R18 | Payoff C 后，goal 含商武平衡语义 | P0 |
| R19 | Payoff A 后，identity 反映 covenant_holder | P1 |
| R20 | 至少 1 条 bridge-origin + payoff choice 表达正确 | P1 |

#### Group 4: Spine Ordering

| # | Assertion | Priority |
|---|-----------|----------|
| R21 | Spine 顺序：entry → pressure → payoff | P0 |
| R22 | Payoff 不可在 pressure 之前触发 | P0 |

### 3.2 Prior Stage Regression (Must Not Break)

| # | Test Suite | Priority |
|---|------------|----------|
| R23 | `p102MerchantMartialPatronBridgeTests` | P0 |
| R24 | `p103MerchantMartialPatronBridgeOriginTests` | P0 |
| R25 | `p104MerchantMartialPatronBridgeOriginPeasantTests` | P0 |
| R26 | `p106MerchantMartialPatronPressureTests` | P0 |
| R27 | P100/P101 magnate spine tests（若存在） | P0 |
| R28 | `npm run guard:sample-lines-baseline` | P0 |
| R29 | `npm run typecheck` | P0 |

---

## 4. Payoff Closed Definition

### 4.1 Closure Criteria

| # | Criterion | Evidence |
|---|-----------|----------|
| C1 | Payoff event fires as choice | Targeted proof nodes 8–9 |
| C2 | All checkpoint flags set | `payoff_done` + `identity_done` + `payoff_resolved` |
| C3 | Choice marker traceable | One of 3 `merchant_patron_payoff_*` |
| C4 | Cost label updates per choice | R13–R18 |
| C5 | Current goal updates per choice | R14, R16, R18 |
| C6 | Identity updates (minimum 1 choice) | R19 |
| C7 | 商武一体 flavor consistent | Manual review — 账房/演武场/盟约/刀 |
| C8 | No P102–P106 regressions | R23–R26 pass |
| C9 | No magnate spine regressions | R27 pass |
| C10 | Typecheck passes | R29 |
| C11 | Guard sample-lines-baseline | R28 |
| C12 | Late-life interfaces reserved | `late_life_done` not set by payoff |

**12/12 = payoff closed.**

### 4.2 What Does NOT Count as Closed

- 仅 auto echo 行为不变（必须升级为 choice）
- 仅设 flag 但表达不更新
- 仅 1 个 choice 有表达分化
- 破坏 P106 pressure gate 或表达

---

## 5. Non-Regression Boundaries

| Closed Stage | What Must Not Change |
|--------------|---------------------|
| P102–P104 bridge entry | Entry gates, on-ramp markers, entry expressions |
| P106 pressure | Pressure event, pressure expressions, pressure gate |
| P100/P101 magnate | Magnate spine events and expressions |
| Expression priority | magnate > payoff > pressure > on-ramp |

**Allowed change:** `merchant_patron_payoff_echo` auto → choice upgrade; payoff expression branches; new payoff choice markers.

---

## 6. Test Execution Commands

```
npm run typecheck
npm exec tsx tests/p108MerchantMartialPatronPayoffTests.ts
npm exec tsx tests/p106MerchantMartialPatronPressureTests.ts
npm exec tsx tests/p102MerchantMartialPatronBridgeTests.ts
npm run guard:sample-lines-baseline
```

---

**P107-005 complete.**
