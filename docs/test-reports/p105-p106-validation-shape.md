# P106 Validation Shape — Merchant Martial Patron Pressure Implementation

> **Date:** 2026-07-02
> **Source:** P105 Merchant Martial Patron Pressure Design-First
> **Target stage:** P106 Patron Pressure Implementation
> **Route:** `merchant_martial_patron`（商武一体金主）
> **Contract:** `docs/PRD/p105-merchant-martial-patron-pressure-contract.md`

---

## 1. Purpose

本文件定义 P106（pressure implementation 阶段）的验证形状：targeted proof 需要展示哪些链路节点、regression tests 至少覆盖哪些断言、什么证据算 pressure closed。目的是在 implementation 开始前就锁定验证标准。

本验证形状基于 P74→P75 renown pressure 验证模式，并参考 P102–P104 patron bridge 测试实践。

---

## 2. Targeted Proof Chain

### 2.1 Chain Nodes Overview

| # | Node | Type | Verification Point |
|---|------|------|-------------------|
| 1 | **Wealth + invest commitment** | P22/P102 | `route_wealth_committed` + `merchant_invest_*` (native path) |
| 2 | **Patron entry reached** | P102+ | `merchant_patron_bridge_entry` fires at age 34–38 |
| 3 | **On-ramp checkpoint** | P102+ | `merchant_patron_on_ramp_done` + variant marker set |
| 4 | **Pre-pressure expression** | baseline | cost label = on-ramp "之累"; goal = on-ramp state |
| 5 | **Pre-pressure state** | baseline | `on_ramp_done` = true, `midlife_pressure_done` = false |
| 6 | **Pressure event fires** | **P106 core** | `merchant_patron_midlife_pressure` fires at age 40–44 |
| 7 | **Pressure checkpoint set** | **P106 core** | `merchant_patron_midlife_pressure_done` = true |
| 8 | **Variant pressure marker** | **P106 core** | matching `merchant_patron_pressure_*` set |
| 9 | **Pressure expression — cost label** | **P106 core** | cost label deepens to pressure state |
| 10 | **Pressure expression — current goal** | **P106 core** | goal updates to pressure state |
| 11 | **Payoff echo still reachable** | regression | `merchant_patron_payoff_echo` reachable after pressure |
| 12 | **Payoff flag interface reserved** | contract-only | downstream flags not prematurely set |

### 2.2 Core Nodes (Must Show)

必须展示的核心节点（P0）：

1. **节点 5:** Pre-pressure state
2. **节点 6:** Pressure event fires at correct age
3. **节点 7:** Checkpoint flag set
4. **节点 9:** Cost label pressure update
5. **节点 10:** Current goal pressure update

共 5 个核心节点。至少 1 条 native path + 1 条 bridge-origin path 在 proof 中展示（共 2 paths minimum）。

### 2.3 Bonus Nodes (Nice to Show)

1. 全部 5 条 variant 分支各走一遍
2. Generic fallback 分支
3. 节点 1–4 完整链路回溯
4. Payoff echo gate adjustment（若 P106 实施）

### 2.4 No Full Lifetime Exhaust Required

**不需要：**
- Full birth-to-death 穷举
- 多种子组合爆炸
- Stat 阈值边界测试（增强项 defer）
- `gate:p20` broad rerun

只需要 targeted proof：至少 2 条路径（native + 1 bridge-origin）上的 pressure 链路打通。

---

## 3. Regression Tests

### 3.1 P106 New Tests

#### Group 1: Pressure Event Wiring

| # | Assertion | Priority |
|---|-----------|----------|
| R1 | `merchant_patron_midlife_pressure` 存在于 `sample-lines-spine.json` | P0 |
| R2 | 触发条件包含 `merchant_patron_on_ramp_done` | P0 |
| R3 | 年龄范围 40–44 | P0 |
| R4 | 事件类型是 choice | P0 |
| R5 | 所有分支设置 `merchant_patron_midlife_pressure_done` | P0 |
| R6 | Variant 分支条件读取对应 entry marker | P0 |
| R7 | Generic fallback 分支存在 | P0 |

#### Group 2: Pre-Pressure Expression

| # | Assertion | Priority |
|---|-----------|----------|
| R8 | On-ramp done 但 pressure 未 done 时，cost label 是 on-ramp "之累" | P0 |
| R9 | On-ramp done 但 pressure 未 done 时，goal 是 on-ramp 状态 | P0 |

#### Group 3: Post-Pressure Expression

| # | Assertion | Priority |
|---|-----------|----------|
| R10 | Pressure done 后，native orthodox cost label 深化 | P0 |
| R11 | Pressure done 后，native orthodox goal 更新 | P0 |
| R12 | Pressure done 后，至少 1 条 bridge-origin variant 表达正确 | P0 |
| R13 | Pressure done 后，generic fallback 表达正确 | P1 |

#### Group 4: Distinction from Magnate / Renown

| # | Assertion | Priority |
|---|-----------|----------|
| R14 | Patron pressure cost label ≠ magnate pressure cost label | P0 |
| R15 | Patron pressure goal ≠ renown pressure goal | P1 |

#### Group 5: No Regression — Patron Bridge (P102–P104)

| # | Assertion | Priority |
|---|-----------|----------|
| R16 | `p102MerchantMartialPatronBridgeTests` 通过 | P0 |
| R17 | `p103MerchantMartialPatronBridgeOriginTests` 通过 | P0 |
| R18 | `p104MerchantMartialPatronBridgeOriginPeasantTests` 通过 | P0 |

#### Group 6: No Regression — Magnate Spine (P97–P101)

| # | Assertion | Priority |
|---|-----------|----------|
| R19 | P100 magnate native endgame tests 通过 | P0 |
| R20 | P101 magnate bridge-origin endgame tests 通过 | P0 |

### 3.2 Test Count Estimate

- **P0 断言：** 约 16–18 个
- **P1 断言：** 约 3–4 个
- **总计：约 19–22 个断言**

---

## 4. What Counts As Pressure Closed

### 4.1 Closure Criteria

| # | Criterion | Method |
|---|-----------|--------|
| C1 | **Pressure event fires** | Targeted proof 节点 6–7 |
| C2 | **Checkpoint flag set** | `merchant_patron_midlife_pressure_done` = true |
| C3 | **Variant marker set** | Matching `merchant_patron_pressure_*` |
| C4 | **Cost label updates** | At least native + 1 bridge-origin correct |
| C5 | **Current goal updates** | At least native + 1 bridge-origin correct |
| C6 | **商武一体 flavor consistent** | Manual review of all text |
| C7 | **No P102–P104 regressions** | R16–R18 pass |
| C8 | **No magnate spine regressions** | R19–R20 pass |
| C9 | **Typecheck passes** | `tsc --noEmit` |
| C10 | **Guard: sample-lines-baseline passes** | baseline guard |
| C11 | **Payoff interfaces reserved** | `merchant_patron_payoff_done` not set by pressure |

**11 条标准全部满足才算 pressure closed。**

### 4.2 Must-Have vs Nice-to-Have

**Must-have (P0):** C1–C5, C7–C10

**Nice-to-have (P1):** C6 full variant matrix, all 5 branches in proof, payoff gate adjustment

---

## 5. Regression Boundaries

### 5.1 What Must Not Regress

| Stage | Evidence | Verification |
|-------|----------|--------------|
| P102 native patron | Bridge tests + chain proof | `p102MerchantMartialPatronBridgeTests` |
| P103 apprentice/tavern | Bridge-origin tests | `p103MerchantMartialPatronBridgeOriginTests` |
| P104 peasant | Peasant tests | `p104MerchantMartialPatronBridgeOriginPeasantTests` |
| P97–P101 magnate | Endgame tests | P100/P101 test suites |
| Sample line baseline | Guard harness | `guard:sample-lines-baseline` |

### 5.2 What Is Allowed to Change

- `merchantCurrentGoal()` — on-ramp → pressure branches
- `deriveSampleLineCostLabel()` — on-ramp → pressure branches
- `sample-lines-spine.json` — new pressure event insertion
- `merchant_patron_payoff_echo` gate — if contract §6.2 adjustment applied

---

## 6. Validation Pattern Reference

| Stage | Proof Nodes | Test Count | Pattern |
|-------|-----------|------------|---------|
| P74→P75 Renown pressure | 5 core / 12 total | ~14–17 | Targeted proof + narrow regression |
| P105→P106 Patron pressure | 5 core / 12 total | ~19–22 | Targeted proof + narrow regression |

---

## 7. P106 Exit Checklist

- [ ] Pressure 事件配置正确（gate、age、choice branches、flags）
- [ ] 2 个核心 expression 更新（cost label + goal）含 variant branches
- [ ] Targeted proof 文档（5+ 核心节点，2+ paths）
- [ ] ~19–22 个 regression tests（6 groups）
- [ ] P102–P104 + P100/P101 既有测试全部通过
- [ ] Typecheck + baseline guard 通过
- [ ] 商武一体风味 review 通过
- [ ] Payoff flag 接口状态确认
- [ ] Closure report 输出

---

**P105-005 complete.**
